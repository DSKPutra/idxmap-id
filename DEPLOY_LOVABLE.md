# Menghubungkan IDXMap.ID ke Lovable

Repo ini sudah kompatibel dengan Lovable secara default: Vite + React + TypeScript + Tailwind + shadcn/ui + Supabase adalah stack standar yang dipakai Lovable. Tidak ada langkah konversi kode yang diperlukan — cukup hubungkan repo GitHub-nya.

Langkah ini membutuhkan UI Lovable (tidak bisa diotomasi dari CLI), jadi kerjakan manual mengikuti urutan berikut:

## 1. Buat project baru dari repo GitHub

1. Masuk ke [lovable.dev](https://lovable.dev) dan login.
2. Klik **New Project** → pilih **Import from GitHub**.
3. Pilih repo `DSKPutra/idxmap-id`, branch `main`.
4. Lovable akan mendeteksi otomatis Vite + React + Tailwind + shadcn dan meng-import struktur project apa adanya.

## 2. Set environment variables

Di pengaturan project Lovable (Settings → Environment Variables), tambahkan variabel yang sama seperti `.env.example`:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://ibumxbrjsablasamefmr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (lihat `.env` lokal atau Supabase Dashboard → Settings → API) |
| `VITE_MAYAR_CHECKOUT_URL` | Link checkout produk lifetime Anda di Mayar.id |
| `VITE_EARLY_BIRD_DEADLINE` | Tanggal ISO 8601 batas harga early bird |
| `VITE_DOCS_URL` | URL dokumentasi GitBook (lihat `docs/SETUP_GITBOOK.md`) |

## 3. Hubungkan Supabase (opsional, jika ingin mengelola dari Lovable)

Lovable punya integrasi Supabase native (Settings → Integrations → Supabase). Karena proyek ini sudah punya Supabase project sendiri (`ibumxbrjsablasamefmr`) dengan skema, RLS, dan Edge Functions yang sudah di-deploy, **hubungkan ke project yang sudah ada** ini, jangan buat project Supabase baru dari Lovable — cukup masukkan Project URL dan anon key yang sama seperti di atas.

## 4. Publish

1. Klik tombol **Publish** di pojok kanan atas editor Lovable.
2. Lovable akan build dan deploy ke subdomain `*.lovable.app` secara otomatis.
3. (Opsional) Hubungkan domain kustom di Settings → Domains jika Anda punya domain sendiri untuk versi Lovable ini.

## 5. Menjaga sinkronisasi dengan GitHub

Lovable secara default melakukan two-way sync dengan repo GitHub yang terhubung — perubahan yang dibuat lewat editor Lovable akan ter-commit ke `main`, dan sebaliknya push ke `main` dari luar akan tercermin di Lovable. Karena repo ini juga di-deploy ke GitHub Pages/Netlify/Cloudflare Pages/Vercel dari branch `main` yang sama, pastikan tim Anda sepakat platform mana yang menjadi "source of truth" untuk perubahan UI agar tidak terjadi konflik dua arah.
