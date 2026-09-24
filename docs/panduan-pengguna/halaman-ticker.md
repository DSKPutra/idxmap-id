# Halaman Ticker

Halaman ticker (`/ticker/KODE`) menampilkan komposisi kepemilikan untuk satu emiten, berdasarkan laporan agregat bulanan KSEI.

## Yang ditampilkan

- **Ringkasan**: estimasi free float, kapitalisasi pasar, persentase kepemilikan lokal, dan kategori _float band_.
- **Grafik Lokal vs Asing**: pie chart proporsi kepemilikan investor lokal dan asing.
- **Rincian Kepemilikan per Tipe Investor**: tabel yang memecah kepemilikan menjadi hingga 18 baris (9 tipe investor KSEI × Lokal/Asing), diurutkan dari persentase terbesar.

## Preview gratis vs akses penuh

Pengguna gratis (belum login atau belum membeli akses) hanya melihat **3 kategori teratas** per ticker sebagai preview. Untuk melihat rincian lengkap 9 tipe investor, diperlukan [akses lifetime](../akun-pembayaran.md).

{% hint style="info" %}
Batasan ini ditegakkan di level database (Row Level Security di Supabase), bukan hanya disembunyikan di tampilan.
{% endhint %}

{% hint style="warning" %}
Data ini adalah **agregat per tipe investor**, bukan daftar nama pemegang saham individual — lihat [Pengenalan](../README.md) untuk penjelasan kenapa.
{% endhint %}
