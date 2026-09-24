# Changelog

## v0.2.0 — 2026-09-24

Pivot ke data 100% real (menggantikan dataset demo fiktif dari v0.1.0):

- 88 ticker riil IDX (nama & sektor dari API publik "Company Profiles" IDX)
- Rincian kepemilikan riil per ticker × 9 tipe investor KSEI × Lokal/Asing, dari laporan agregat bulanan KSEI "Kepemilikan Efek" (per 31 Agustus 2026)
- Free float, Local vs Asing, dan Market Heatmap kini dihitung dari data riil
- 7 konglomerasi riil (Astra, Salim, Djarum, Barito/Prajogo, Sinar Mas, Bakrie, Lippo) dengan emiten anggota yang benar-benar terafiliasi
- Network Graph dirombak: menghubungkan ticker ke tipe investor (bukan nama individu), karena data granular per-nama tidak tersedia publik secara massal
- Halaman Investor dan Reksa Dana Tracker dipensiunkan (memerlukan data bernama yang tidak tersedia publik dalam bentuk agregat)
- Tanya IDXMap (AI Q&A) diperbarui untuk mengambil konteks dari data agregat riil

## v0.1.0 — 2026-09-23

Rilis awal IDXMap.ID (dataset demo fiktif).

- Instant search ticker & investor (full-text + fuzzy via `pg_trgm`)
- Halaman ticker & investor dengan preview gratis dan tabel penuh untuk pengguna berbayar
- Tanya IDXMap — AI Q&A berbasis Gemini dengan retrieval dari database
- Peta konglomerasi (kurasi manual) dan detail per kelompok usaha
- Network graph interaktif (D3.js force-directed) dengan filter kedalaman 1–2 hop
- Lokal vs Asing — ringkasan kepemilikan pasar per tipe investor
- Reksa Dana Tracker
- Float Screener dengan metodologi estimasi mirip MSCI
- Market Heatmap (D3.js treemap) berbasis data harga EOD
- Hot Searches — 10 pencarian terpopuler
- Login magic link + pembayaran lifetime via Mayar.id
- Dark/light mode, i18n Indonesia/Inggris, SEO dasar
- Dataset demo fiktif untuk keperluan showcase sebelum data asli diimpor
