# Instant Search

Kotak pencarian tersedia di navbar setiap halaman dan juga di hero landing page. Ketik minimal 2 karakter dan hasil ticker yang cocok muncul otomatis dalam waktu sekitar 200ms (debounced) tanpa perlu menekan Enter.

## Cara kerja

Pencarian mencocokkan awalan **kode ticker** (misalnya `BBC` akan menampilkan `BBCA`). Klik hasil untuk langsung membuka [Halaman Ticker](halaman-ticker.md) yang relevan.

Setiap pencarian yang berhasil dicatat secara anonim ke tabel statistik pencarian, yang kemudian ditampilkan di landing page sebagai **Pencarian Terpopuler** — berguna untuk melihat ticker apa yang sedang banyak dicari pengguna lain.
