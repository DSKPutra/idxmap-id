# Setup Lokal

## Prasyarat

- Node.js 20+
- Akun Supabase (proyek sudah dibuat — lihat [Skema Database & RLS](skema-database.md))
- npm

## Instalasi

```bash
git clone https://github.com/DSKPutra/idxmap-id.git
cd idxmap-id
npm install
```

## Environment variables

Salin `.env.example` menjadi `.env` dan isi nilainya:

```bash
cp .env.example .env
```

| Variabel                   | Wajib | Keterangan                                          |
| -------------------------- | ----- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`        | ✅    | URL proyek Supabase (aman untuk frontend)           |
| `VITE_SUPABASE_ANON_KEY`   | ✅    | Anon/publishable key Supabase (aman untuk frontend) |
| `VITE_MAYAR_CHECKOUT_URL`  | ✅    | Link checkout produk lifetime di Mayar.id           |
| `VITE_EARLY_BIRD_DEADLINE` | ✅    | Tanggal ISO 8601 batas harga early bird             |
| `VITE_DOCS_URL`            | ✅    | URL dokumentasi GitBook, ditautkan di footer        |

{% hint style="danger" %}
Jangan pernah menaruh `GEMINI_API_KEY` atau `MAYAR_WEBHOOK_SECRET` di file `.env` frontend atau di variabel berprefiks `VITE_`. Kedua secret ini hanya boleh disetel sebagai Supabase Edge Function secret (lihat [Edge Functions](edge-functions.md)).
{% endhint %}

## Menjalankan dev server

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

## Perintah lain

| Perintah                          | Fungsi                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run build`                   | Build produksi ke folder `dist/`                                                 |
| `npm run preview`                 | Preview hasil build secara lokal                                                 |
| `npm run lint`                    | ESLint                                                                           |
| `npm run format` / `format:check` | Prettier                                                                         |
| `npm run typecheck`               | TypeScript strict type check                                                     |
| `npm run test`                    | Vitest (unit test)                                                               |
| `npm run import:ksei`             | Jalankan ETL import data KSEI — lihat [ETL Import Data KSEI](etl-import-ksei.md) |

## Memperbarui data harga EOD

Karena IDXMap.ID tidak berlangganan feed harga real-time berlisensi, data pada [Market Heatmap](../panduan-pengguna/market-heatmap.md) diperbarui melalui import CSV manual ke tabel `prices` (kolom: `ticker_code, date, close, change_pct, volume`), dengan `source` selalu diberi nilai `EOD_CSV`. Operator dapat menjalankan `INSERT ... ON CONFLICT` langsung melalui Supabase SQL editor atau menulis skrip serupa `scripts/seed-sample-data.ts` sesuai kebutuhan.
