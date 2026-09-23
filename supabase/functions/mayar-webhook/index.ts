// Mayar.id payment webhook -> activates lifetime access.
//
// IMPORTANT: Mayar's exact webhook payload/signature scheme can change and
// should be confirmed against your live Mayar dashboard (Settings ->
// Webhooks) before going live — this handler accepts the commonly
// documented shape (a shared-secret token header, plus id/status/amount/
// email fields with a couple of naming variants) and is intentionally
// defensive about field names. Log the raw payload (done below, into
// `payments.raw_payload`) and adjust the field lookups here if your
// dashboard shows different field names.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'

const MAYAR_WEBHOOK_SECRET = Deno.env.get('MAYAR_WEBHOOK_SECRET')

const PAID_STATUSES = new Set(['success', 'paid', 'settlement', 'completed'])

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }
  if (!MAYAR_WEBHOOK_SECRET) {
    return json({ error: 'Webhook is not configured (missing MAYAR_WEBHOOK_SECRET).' }, 503)
  }

  // Mayar sends the shared secret as a header; accept a couple of common
  // header-name conventions rather than guessing wrong and rejecting every call.
  const token =
    req.headers.get('X-Callback-Token') ??
    req.headers.get('X-Mayar-Signature') ??
    req.headers.get('X-Webhook-Token')
  if (token !== MAYAR_WEBHOOK_SECRET) {
    return json({ error: 'Invalid webhook token.' }, 401)
  }

  const payload = await req.json().catch(() => null)
  if (!payload) return json({ error: 'Invalid JSON payload.' }, 400)

  const transactionId = String(payload.id ?? payload.transactionId ?? payload.transaction_id ?? '')
  const status = String(payload.status ?? payload.transactionStatus ?? '').toLowerCase()
  const amount = Number(payload.amount ?? payload.total ?? 0)
  const email = String(payload.customerEmail ?? payload.customer?.email ?? payload.email ?? '')
    .trim()
    .toLowerCase()

  if (!transactionId || !email) {
    return json({ error: 'Payload missing transaction id or customer email.' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const isPaid = PAID_STATUSES.has(status)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const { error: paymentError } = await supabase.from('payments').upsert(
    {
      mayar_transaction_id: transactionId,
      profile_id: profile?.id ?? null,
      email,
      amount,
      status: isPaid ? 'paid' : status || 'pending',
      raw_payload: payload,
    },
    { onConflict: 'mayar_transaction_id' },
  )
  if (paymentError) {
    console.error(paymentError)
    return json({ error: paymentError.message }, 500)
  }

  if (isPaid && profile?.id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (profileError) {
      console.error(profileError)
      return json({ error: profileError.message }, 500)
    }
  } else if (isPaid && !profile?.id) {
    // Paid before the user's first magic-link login: profiles.id doesn't
    // exist yet. handle_new_user() (see migration 20260923000003) checks
    // `payments` by email and activates access automatically on first
    // sign-in, so no further action is needed here.
    console.info(
      `Payment received for ${email} before first login; will auto-activate on first sign-in.`,
    )
  }

  return json({ received: true })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
