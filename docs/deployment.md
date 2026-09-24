# Panduan Deployment

IDXMap.ID adalah SPA statis (hasil `npm run build` → folder `dist/`) yang bisa di-deploy identik ke berbagai platform hosting statis. Repo: [github.com/DSKPutra/idxmap-id](https://github.com/DSKPutra/idxmap-id).

## Status per platform

| Platform | URL Live | Status | Keterangan |
|---|---|---|---|
| GitHub Pages | [dskputra.github.io/idxmap-id](https://dskputra.github.io/idxmap-id/) | ✅ Sukses (HTTP 200) | Deploy otomatis via GitHub Actions (`.github/workflows/deploy-pages.yml`) setiap push ke `main`. Base path `/idxmap-id/` di-inject lewat `VITE_BASE_PATH`. Deep-link routing ditangani `public/404.html` + `src/main.tsx`. |
| Netlify | [idxmap-id.netlify.app](https://idxmap-id.netlify.app/) | ✅ Sukses (HTTP 200) | Build otomatis dari `main` sesuai `netlify.toml` (`npm run build`, publish `dist`, SPA redirect `/* → /index.html`). |
| Vercel | [idxmap-id.vercel.app](https://idxmap-id.vercel.app/) | ✅ Sukses (HTTP 200) | Deploy via Vercel CLI (`vercel --prod`) sesuai `vercel.json` (build `dist`, SPA rewrite). |
| Cloudflare Pages | — | ⛔ Belum jalan | Butuh `CLOUDFLARE_API_TOKEN` atau login `wrangler` — tidak ada tool otomatis untuk Cloudflare Pages yang tersedia saat ini. Lihat langkah manual di bawah. |
| Lovable | — | 🟡 Manual | Perlu dihubungkan lewat UI Lovable (import dari GitHub). Lihat [DEPLOY_LOVABLE.md](../DEPLOY_LOVABLE.md) di root repo untuk langkah lengkap. |

Ketiga platform yang sudah live (GitHub Pages, Netlify, Vercel) dibangun dari commit yang sama di branch `main` dan menghasilkan build yang identik — semuanya membaca env vars yang sama (lihat `.env.example`) dan terhubung ke Supabase project yang sama.

## Setup Cloudflare Pages (manual)

Belum ada token Cloudflare yang terhubung ke sesi kerja ini, jadi deploy pertama harus dilakukan manual:

1. Install Wrangler jika belum ada: `npm install -g wrangler`.
2. Login: `wrangler login` (atau set `CLOUDFLARE_API_TOKEN` di environment untuk otomatisasi non-interaktif).
3. Dari root repo, jalankan:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=idxmap-id
   ```
4. Di dashboard Cloudflare Pages, buka **Settings → Environment variables** dan tambahkan variabel yang sama seperti `.env.example` (lihat tabel di bawah) untuk kedua environment (Production & Preview).
5. Setelah live, catat URL `*.pages.dev` yang dihasilkan dan tambahkan ke allowlist redirect URL Supabase Auth (lihat bagian di bawah).

## Environment variables yang dibutuhkan setiap platform

| Key | Sumber nilai |
|---|---|
| `VITE_SUPABASE_URL` | `https://ibumxbrjsablasamefmr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `VITE_MAYAR_CHECKOUT_URL` | Link checkout produk lifetime di Mayar.id |
| `VITE_EARLY_BIRD_DEADLINE` | Tanggal ISO 8601 batas harga early bird |
| `VITE_DOCS_URL` | URL GitBook publik (lihat [SETUP_GITBOOK.md](SETUP_GITBOOK.md)) |
| `VITE_BASE_PATH` | Hanya untuk GitHub Pages: `/idxmap-id/` (sudah diset di workflow Actions) |

Env vars ini sudah diset di:
- **GitHub Actions**: repository secrets (`gh secret set`) dipakai oleh `deploy-pages.yml`.
- **Netlify**: site environment variables (via Netlify UI/MCP).
- **Vercel**: project environment variables untuk production/preview/development (via `vercel env add`).

## Langkah manual yang masih tersisa

Beberapa langkah tidak bisa diotomasi dari sesi ini karena membutuhkan kredensial atau akses akun milik Anda:

1. **Supabase Auth redirect URLs** — tambahkan seluruh URL live (GitHub Pages, Netlify, Vercel, dan nanti Cloudflare/Lovable) ke allowlist di Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. Tidak ada tool API/MCP untuk ini.
2. **Edge Function secrets** — `GEMINI_API_KEY` (untuk fitur Tanya IDXMap) dan `MAYAR_WEBHOOK_SECRET` (untuk verifikasi webhook pembayaran) belum diset karena nilainya belum tersedia. Set lewat:
   ```bash
   supabase secrets set GEMINI_API_KEY=<nilai-anda> MAYAR_WEBHOOK_SECRET=<nilai-anda> --project-ref ibumxbrjsablasamefmr
   ```
   atau via Supabase Dashboard → Edge Functions → Secrets.
3. **Cloudflare Pages** — lihat langkah manual di atas; butuh `CLOUDFLARE_API_TOKEN` atau `wrangler login`.
4. **Lovable** — lihat [DEPLOY_LOVABLE.md](../DEPLOY_LOVABLE.md); hanya bisa dilakukan lewat UI Lovable.
5. **GitBook** — lihat [SETUP_GITBOOK.md](SETUP_GITBOOK.md); akun GitBook yang terhubung ke sesi ini tidak memiliki organization, sehingga space harus dibuat manual lewat UI terlebih dahulu.
