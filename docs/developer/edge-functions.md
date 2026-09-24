# Edge Functions

Dua Supabase Edge Function menangani seluruh logika sisi server yang membutuhkan secret.

## `ai-qa`

Menangani permintaan dari halaman [Tanya IDXMap](../panduan-pengguna/tanya-idxmap.md).

**Alur:**

1. Verifikasi sesi pengguna dari header `Authorization`.
2. Cek rate limit (20 pertanyaan / 24 jam per pengguna, dicatat di `ai_query_logs`).
3. Cocokkan kode ticker yang disebut dalam pertanyaan terhadap daftar `tickers`.
4. Query `v_ticker_summary` dan `v_ownership_preview` (top-3 breakdown tipe investor per ticker) untuk membangun konteks.
5. Kirim konteks + pertanyaan ke Gemini API (`gemini-2.0-flash`) dengan system instruction yang membatasi jawaban hanya berdasarkan konteks yang diberikan dan melarang nasihat investasi.
6. Catat pertanyaan ke `ai_query_logs`, kembalikan jawaban ke frontend.

**Secret yang dibutuhkan:** `GEMINI_API_KEY`

## `mayar-webhook`

Menerima callback dari Mayar.id setelah transaksi selesai.

**Alur:**

1. Verifikasi token webhook dari header (`X-Callback-Token` atau varian umum lainnya) terhadap `MAYAR_WEBHOOK_SECRET`.
2. Simpan/upsert transaksi ke tabel `payments`.
3. Jika status transaksi menandakan sukses, set `profiles.is_paid = true` untuk profil dengan email yang cocok.

{% hint style="warning" %}
Skema payload dan header webhook Mayar.id bisa berubah — selalu verifikasi nama header token dan struktur payload di dashboard Mayar.id Anda (Settings → Webhooks) sebelum go-live, dan sesuaikan `supabase/functions/mayar-webhook/index.ts` bila perlu.
{% endhint %}

**Secret yang dibutuhkan:** `MAYAR_WEBHOOK_SECRET`

## Deploy & set secret

```bash
supabase functions deploy ai-qa
supabase functions deploy mayar-webhook

supabase secrets set GEMINI_API_KEY=your-key
supabase secrets set MAYAR_WEBHOOK_SECRET=your-secret
```

## Menguji secara lokal

```bash
supabase functions serve ai-qa --env-file supabase/.env.local
```
