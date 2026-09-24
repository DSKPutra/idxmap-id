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

/**
 * Pulls out ticker codes mentioned in the question and grounds the answer in
 * real KSEI aggregate ownership data (per ticker x investor type x
 * local/foreign). Named individual holders aren't available in bulk public
 * data — see docs/developer/etl-import-ksei.md — so retrieval stops at the
 * investor-type breakdown, which is exactly what's real.
 */
async function buildRetrievalContext(
  supabase: ReturnType<typeof createClient>,
  question: string,
): Promise<string> {
  const chunks: string[] = []

  const { data: allTickers } = await supabase.from('tickers').select('code')
  const knownCodes = new Set((allTickers ?? []).map((t) => t.code as string))
  const tickerMatches = [
    ...new Set([...question.toUpperCase().matchAll(/\b[A-Z]{4}\b/g)].map((m) => m[0])),
  ].filter((code) => knownCodes.has(code))

  for (const code of tickerMatches) {
    const { data: s } = await supabase
      .from('v_ticker_summary')
      .select('code, name, sector, local_pct, foreign_pct, free_float_pct, market_cap, report_date')
      .eq('code', code)
      .maybeSingle()
    if (!s) continue

    chunks.push(
      `Ticker ${s.code} (${s.name}, sektor ${s.sector ?? '-'}) per ${s.report_date}: ` +
        `kepemilikan Lokal ${Number(s.local_pct).toFixed(1)}%, Asing ${Number(s.foreign_pct).toFixed(1)}%, ` +
        `estimasi free float ${Number(s.free_float_pct).toFixed(1)}%, kapitalisasi pasar Rp${Number(s.market_cap ?? 0).toLocaleString('id-ID')}.`,
    )

    const { data: breakdown } = await supabase
      .from('v_ownership_preview')
      .select('investor_type, local_foreign, percentage')
      .eq('ticker_code', code)
      .order('percentage', { ascending: false })
    for (const b of breakdown ?? []) {
      chunks.push(
        `  - Tipe ${b.investor_type} (${b.local_foreign === 'L' ? 'Lokal' : 'Asing'}): ${Number(b.percentage).toFixed(2)}% di ${code}`,
      )
    }
  }

  return chunks.length > 0
    ? chunks.join('\n')
    : 'Tidak ditemukan ticker yang cocok di database untuk pertanyaan ini. Data IDXMap.ID adalah agregat kepemilikan per TIPE investor (bukan nama investor individu) bersumber dari laporan bulanan KSEI — sarankan pengguna menyebutkan kode ticker secara eksplisit (mis. BBCA, TLKM).'
}

async function askGemini(question: string, context: string, lang: 'id' | 'en'): Promise<string> {
  const systemInstruction =
    lang === 'en'
      ? "You are \"Tanya IDXMap\", an assistant for IDXMap.ID answering questions about Indonesian stock exchange (IDX) ownership composition sourced from KSEI's monthly aggregate report. Data is broken down by investor TYPE (corporate, individual, mutual fund, etc.) and local/foreign — NOT by named individual shareholders, since that granularity isn't published in bulk. Answer ONLY using the provided context. If asked for a specific investor's name, explain that only aggregate type-level data is available and suggest a ticker code instead. Never give investment advice or recommendations. Be concise."
      : 'Anda adalah "Tanya IDXMap", asisten IDXMap.ID yang menjawab pertanyaan seputar komposisi kepemilikan saham Bursa Efek Indonesia (BEI) bersumber dari laporan agregat bulanan KSEI. Data dipecah per TIPE investor (korporasi, individu, reksa dana, dst.) dan lokal/asing — BUKAN per nama pemegang saham individu, karena granularitas itu tidak dipublikasikan secara massal. Jawab HANYA berdasarkan konteks yang diberikan. Jika ditanya nama investor tertentu, jelaskan bahwa hanya data agregat per tipe yang tersedia dan sarankan menyebutkan kode ticker. Jangan pernah memberi rekomendasi atau nasihat investasi. Jawab secara ringkas.'

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
