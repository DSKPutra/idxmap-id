// "Tanya IDXMap" — retrieval-augmented Q&A over the IDXMap.ID database.
//
// Flow: authenticate the caller -> rate limit -> pull ticker/investor names
// mentioned in the question out of Postgres -> hand that context plus the
// question to Gemini -> log the query -> return the answer.
//
// GEMINI_API_KEY is a server-side secret (set via `supabase secrets set`),
// never exposed to the frontend.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'

const RATE_LIMIT_MAX_QUERIES = 20
const RATE_LIMIT_WINDOW_HOURS = 24

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

interface AiQaRequest {
  question: string
  lang?: 'id' | 'en'
}

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }
    if (!GEMINI_API_KEY) {
      return json({ error: 'AI Q&A is not configured (missing GEMINI_API_KEY).' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    )
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Invalid or expired session.' }, 401)

    const body = (await req.json()) as AiQaRequest
    const question = (body.question ?? '').trim()
    if (!question || question.length > 500) {
      return json({ error: 'Question is required and must be under 500 characters.' }, 400)
    }
    const lang = body.lang === 'en' ? 'en' : 'id'

    // Rate limit: N queries per rolling window, per user.
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
    ).toISOString()
    const { count, error: countError } = await supabase
      .from('ai_query_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', windowStart)
    if (countError) return json({ error: countError.message }, 500)
    if ((count ?? 0) >= RATE_LIMIT_MAX_QUERIES) {
      return json(
        {
          error:
            lang === 'en'
              ? `You've reached the limit of ${RATE_LIMIT_MAX_QUERIES} questions per ${RATE_LIMIT_WINDOW_HOURS}h. Please try again later.`
              : `Anda telah mencapai batas ${RATE_LIMIT_MAX_QUERIES} pertanyaan per ${RATE_LIMIT_WINDOW_HOURS} jam. Coba lagi nanti.`,
        },
        429,
      )
    }

    const context = await buildRetrievalContext(supabase, question)
    const answer = await askGemini(question, context, lang)

    await supabase.from('ai_query_logs').insert({ user_id: user.id, question })

    return json({ answer })
  } catch (err) {
    console.error(err)
    return json({ error: 'Internal error handling the AI Q&A request.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Pulls out ticker codes (4 uppercase letters) and quoted/likely investor names, then queries Postgres for grounding context. */
async function buildRetrievalContext(
  supabase: ReturnType<typeof createClient>,
  question: string,
): Promise<string> {
  const chunks: string[] = []

  const tickerMatches = [...question.toUpperCase().matchAll(/\b[A-Z]{4}\b/g)].map((m) => m[0])
  if (tickerMatches.length > 0) {
    const { data: summaries } = await supabase
      .from('v_ticker_summary')
      .select(
        'code, name, sector, holder_count, local_pct, foreign_pct, free_float_pct, report_date',
      )
      .in('code', tickerMatches)
    for (const s of summaries ?? []) {
      chunks.push(
        `Ticker ${s.code} (${s.name}, sektor ${s.sector ?? '-'}): ${s.holder_count} pemegang saham >1% per ${s.report_date}. ` +
          `Lokal ${Number(s.local_pct).toFixed(1)}%, Asing ${Number(s.foreign_pct).toFixed(1)}%, estimasi free float ${Number(s.free_float_pct).toFixed(1)}%.`,
      )

      const { data: top } = await supabase
        .from('v_holdings_preview')
        .select('investor_name, investor_type, local_foreign, percentage')
        .eq('ticker_code', s.code)
        .order('percentage', { ascending: false })
        .limit(5)
      for (const h of top ?? []) {
        chunks.push(
          `  - ${h.investor_name} (${h.investor_type}, ${h.local_foreign === 'L' ? 'Lokal' : 'Asing'}): ${Number(h.percentage).toFixed(2)}% di ${s.code}`,
        )
      }
    }
  }

  // Fuzzy investor-name lookup: try the longest capitalized word sequence in the question.
  const nameGuess = question
    .split(/[?.!]/)[0]
    ?.replace(/\b(siapa|pemegang saham|terbesar|di|who|is|the|largest|shareholder|of)\b/gi, '')
    .trim()
  if (nameGuess && nameGuess.length > 2) {
    const { data: investors } = await supabase
      .from('investors')
      .select('id, name, type, local_foreign')
      .ilike('name', `%${nameGuess}%`)
      .limit(3)
    for (const inv of investors ?? []) {
      const { data: positions } = await supabase
        .from('v_holdings_preview')
        .select('ticker_code, percentage')
        .eq('investor_id', inv.id)
        .order('percentage', { ascending: false })
        .limit(5)
      chunks.push(
        `Investor ${inv.name} (${inv.type}, ${inv.local_foreign === 'L' ? 'Lokal' : 'Asing'}) memiliki posisi di: ` +
          (positions ?? [])
            .map((p) => `${p.ticker_code} (${Number(p.percentage).toFixed(2)}%)`)
            .join(', '),
      )
    }
  }

  return chunks.length > 0
    ? chunks.join('\n')
    : 'Tidak ditemukan data spesifik di database untuk pertanyaan ini — jawab berdasarkan konteks umum dan sarankan pengguna mengecek ticker/nama investor secara eksplisit.'
}

async function askGemini(question: string, context: string, lang: 'id' | 'en'): Promise<string> {
  const systemInstruction =
    lang === 'en'
      ? 'You are "Tanya IDXMap", an assistant for IDXMap.ID answering questions about Indonesian stock exchange (IDX) shareholder data sourced from KSEI reports. Answer ONLY using the provided context. If the context does not contain the answer, say so plainly and suggest the user search a specific ticker or investor name. Never give investment advice or recommendations. Be concise.'
      : 'Anda adalah "Tanya IDXMap", asisten IDXMap.ID yang menjawab pertanyaan seputar data kepemilikan saham Bursa Efek Indonesia (BEI) bersumber dari laporan KSEI. Jawab HANYA berdasarkan konteks yang diberikan. Jika konteks tidak memuat jawabannya, katakan dengan jelas dan sarankan pengguna mencari ticker atau nama investor secara spesifik. Jangan pernah memberi rekomendasi atau nasihat investasi. Jawab secara ringkas.'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Konteks database:\n${context}\n\nPertanyaan: ${question}` }],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    },
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errText}`)
  }
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return (
    text ??
    (lang === 'en'
      ? 'Sorry, I could not generate an answer right now.'
      : 'Maaf, saya tidak dapat menghasilkan jawaban saat ini.')
  )
}
