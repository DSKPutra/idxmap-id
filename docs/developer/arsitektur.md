# Arsitektur

## Ringkasan tech stack

| Lapisan          | Teknologi                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Frontend         | Vite + React 18 + TypeScript + Tailwind CSS + shadcn-style UI + React Router + TanStack Query         |
| Visualisasi      | D3.js (network graph, treemap heatmap), Recharts (pie & bar chart)                                    |
| Backend          | Supabase (Postgres + Auth magic link + Edge Functions + Row Level Security)                           |
| AI               | Supabase Edge Function → Google Gemini API                                                            |
| Pembayaran       | Mayar.id (checkout link + webhook)                                                                    |
| Hosting frontend | Statis (SPA) — bisa dideploy identik ke GitHub Pages, Netlify, Cloudflare Pages, Vercel, atau Lovable |

Frontend adalah **SPA 100% statis** — tidak ada server Node.js kustom di balik frontend. Semua logika yang butuh privasi (kunci Gemini API, secret webhook Mayar) berjalan di Supabase Edge Functions, bukan di browser.

## Diagram arsitektur

```mermaid
flowchart TB
    subgraph Client["Browser (SPA)"]
        UI["React + Vite<br/>Tailwind, shadcn, D3, Recharts"]
    end

    subgraph Supabase["Supabase Project"]
        Auth["Auth<br/>(magic link)"]
        DB[("Postgres<br/>+ RLS + Views")]
        EdgeAI["Edge Function:<br/>ai-qa"]
        EdgeWebhook["Edge Function:<br/>mayar-webhook"]
    end

    Gemini["Google Gemini API"]
    Mayar["Mayar.id<br/>(checkout + webhook)"]
    KSEI["KSEI monthly report<br/>(XLSX/PDF, manual download)"]
    ETL["scripts/import-ksei.ts"]

    UI -->|"REST/RPC via supabase-js"| DB
    UI -->|magic link| Auth
    UI -->|"invoke()"| EdgeAI
    EdgeAI -->|retrieval query| DB
    EdgeAI -->|generateContent| Gemini
    Mayar -->|"POST webhook"| EdgeWebhook
    EdgeWebhook -->|"update profiles.is_paid"| DB
    UI -->|"checkout link"| Mayar
    KSEI -->|download| ETL
    ETL -->|upsert| DB
```

## Alur data kepemilikan saham

1. Operator mengunduh laporan bulanan KSEI "Pemegang Saham di atas 1%" secara manual dari situs resmi KSEI/IDX.
2. File (`.xlsx` atau `.pdf`) diletakkan di `data/raw/`.
3. `scripts/import-ksei.ts` mem-parsing file, menormalisasi nama investor (lihat [Skema Database](skema-database.md)), lalu melakukan upsert ke tabel `tickers`, `investors`, dan `holdings`.
4. Frontend membaca data melalui **view publik** (`v_ticker_summary`, `v_holdings_preview`, dst.) untuk pengguna gratis, dan langsung dari tabel `holdings` (dengan RLS) untuk pengguna berbayar.

## Alur pembayaran

1. Pengguna klik "Beli Akses Lifetime" di halaman Harga → diarahkan ke checkout Mayar.id.
2. Setelah pembayaran sukses, Mayar.id memanggil Edge Function `mayar-webhook` dengan detail transaksi.
3. Edge Function mencatat transaksi ke tabel `payments` dan mengaktifkan `profiles.is_paid = true` untuk email yang cocok.
4. Jika pembayaran terjadi sebelum pengguna pernah login, aktivasi otomatis terjadi saat login pertama (lihat trigger `handle_new_user` di migrasi database).

## Paywall

Pembatasan akses ditegakkan di **level database** melalui Row Level Security (RLS), bukan hanya di frontend:

- Tabel `holdings` hanya bisa di-`SELECT` oleh pengguna dengan `profiles.is_paid = true`.
- View `v_holdings_preview` (dibuat dengan `security_invoker = false`) mem-bypass RLS tersebut secara terkontrol untuk mengekspos hanya 5 baris teratas per ticker kepada siapa pun.

Lihat [Skema Database & RLS](skema-database.md) untuk detail lengkap.
