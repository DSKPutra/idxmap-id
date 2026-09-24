# Setup GitBook (manual)

Repo ini sudah docs-as-code lengkap di folder `docs/` dengan `.gitbook.yaml` di root, siap disinkronkan ke GitBook via GitHub Sync. Langkah ini perlu dilakukan manual lewat UI GitBook (percobaan otomatis melalui API GitBook gagal karena akun yang terhubung ke sesi ini tidak memiliki akses ke organization GitBook manapun — `GET /orgs` mengembalikan daftar kosong).

## Langkah-langkah

1. Login ke [gitbook.com](https://gitbook.com) dengan akun organisasi Anda.
2. Klik **New space** (atau **New** → **Space**) di dalam organization Anda.
3. Beri nama space **"IDXMap.ID Docs"**.
4. Buka **Integrations** pada space tersebut → cari **GitHub Sync** → **Install**.
5. Saat proses instalasi:
   - Pilih repository **`DSKPutra/idxmap-id`**.
   - Pilih branch **`main`**.
   - Pilih arah sinkronisasi **"GitHub → GitBook"** (GitBook membaca dari `docs/` di repo, bukan sebaliknya — repo tetap menjadi source of truth).
   - GitBook akan otomatis mendeteksi `.gitbook.yaml` di root repo dan menggunakan `docs/README.md` sebagai halaman utama serta `docs/SUMMARY.md` sebagai struktur navigasi.
6. Setelah sinkronisasi awal selesai, buka **Publish** (atau **Share** → **Publish site**) dan aktifkan sebagai **site publik**.
7. Salin URL publik yang dihasilkan (format umum: `https://<nama-organisasi>.gitbook.io/idxmap-id-docs` atau domain kustom jika dikonfigurasi).
8. Perbarui `VITE_DOCS_URL` di environment variables setiap platform deploy (GitHub Actions secrets, Netlify, Vercel, Lovable) dengan URL tersebut, lalu redeploy agar tautan "Dokumentasi" di footer aplikasi mengarah ke URL yang benar.

## Verifikasi

Setelah publish, buka URL GitBook di browser dan pastikan mengembalikan status 200 serta menampilkan halaman "Pengenalan" dari `docs/README.md`.

## Jika ingin coba otomatisasi API di kemudian hari

Jika Anda ingin agent/CLI membuat space secara otomatis nanti, pastikan token yang terhubung (`GITBOOK_API_TOKEN` atau koneksi MCP GitBook) memiliki akses ke sebuah organization GitBook — cek dengan memanggil `GET /orgs`. Jika hasilnya kosong seperti saat ini, token tersebut terikat ke akun personal tanpa organization, dan pembuatan space perlu dilakukan manual seperti di atas terlebih dahulu (assign token itu sebagai member organization), baru otomatisasi API bisa dipakai untuk update konten berikutnya.
