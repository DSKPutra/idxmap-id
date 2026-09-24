# Peta Konglomerasi

Halaman **Peta Konglomerasi** (`/konglomerasi`) menampilkan daftar kelompok usaha besar dan emiten-emiten yang berafiliasi dengannya.

## Yang ditampilkan

Setiap kartu konglomerasi menunjukkan:

- Nama kelompok usaha dan deskripsi singkat
- Pendiri (jika tersedia)
- Daftar ticker yang berafiliasi

Klik salah satu konglomerasi untuk membuka halaman detailnya, yang membagi emiten menjadi dua kategori:

- **Emiten Inti** — perusahaan yang menjadi tulang punggung kelompok usaha tersebut
- **Afiliasi** — perusahaan yang terhubung namun bukan bagian inti

## Bagaimana data ini dikurasi

Berbeda dari data pemegang saham (yang diimpor otomatis dari laporan KSEI), pemetaan konglomerasi **dikurasi secara manual** berdasarkan informasi kepemilikan dan afiliasi yang tersedia untuk publik. Operator IDXMap.ID memperbarui pemetaan ini secara berkala melalui tabel `conglomerates` dan `conglomerate_members` di database — lihat [Skema Database](../developer/skema-database.md) untuk detail teknis.

{% hint style="info" %}
Dataset demo yang tampil sebelum data asli diimpor menggunakan nama konglomerasi **fiktif** (ditandai "Data Fiktif") agar tidak disalahartikan sebagai data riil.
{% endhint %}
