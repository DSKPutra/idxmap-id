# Pengenalan

## Apa itu IDXMap.ID?

IDXMap.ID adalah platform intelijen kepemilikan saham Bursa Efek Indonesia (BEI). Platform ini menjawab pertanyaan yang selama ini sulit dijawab dengan cepat: **siapa (tipe investor apa) yang memiliki saham sebuah perusahaan publik di Indonesia, dan berapa besar porsi lokal vs asing?**

Menggunakan data resmi yang dipublikasikan KSEI (Kustodian Sentral Efek Indonesia) dan IDX (Bursa Efek Indonesia), IDXMap.ID mengubah laporan agregat bulanan menjadi:

- Rincian kepemilikan per ticker berdasarkan 9 tipe investor KSEI × status lokal/asing
- Peta konglomerasi yang menunjukkan struktur kepemilikan berlapis grup bisnis besar Indonesia
- Estimasi _free float_ per saham dengan metodologi yang transparan
- Peta panas (heatmap) pasar berdasarkan kapitalisasi dan perubahan harga bulanan
- Asisten AI yang bisa menjawab pertanyaan seputar komposisi kepemilikan saham

## Untuk siapa IDXMap.ID?

- **Investor ritel** yang ingin memahami profil kepemilikan (lokal/asing, strategis/free-float) sebelum membeli suatu saham
- **Peneliti & jurnalis** yang menelusuri struktur kepemilikan dan afiliasi konglomerasi
- **Analis & akademisi** yang membutuhkan data _free float_ dan komposisi investor lokal/asing
- **Siapa pun** yang penasaran dengan peta konglomerasi bisnis Indonesia

## Sumber data

Data kepemilikan saham di IDXMap.ID bersumber dari laporan publik bulanan **KSEI "Kepemilikan Efek"** (Data & Statistik → Kepemilikan Efek di ksei.co.id), yang memecah kepemilikan setiap sekuritas per **tipe investor** (Korporasi, Individu, Bank Investasi, Reksa Dana, Asuransi, Dana Pensiun, Sekuritas, Yayasan, Lainnya) dan status Lokal/Asing. Data nama dan sektor emiten bersumber dari **API publik "Company Profiles" IDX** (idx.co.id).

{% hint style="info" %}
**Kenapa tidak ada nama pemegang saham individual?** Laporan bulanan KSEI yang tersedia gratis secara massal hanya memuat data **agregat** per tipe investor, bukan daftar nama pemegang saham individual beserta persentase persisnya. Data granular semacam itu hanya tersedia tersebar di masing-masing keterbukaan informasi emiten (satu per satu, bukan dataset terkonsolidasi). IDXMap.ID memilih untuk menampilkan data **100% asli dan real** pada level agregat ini, alih-alih mencampur ticker asli dengan nama investor rekaan.
{% endhint %}

Data harga pada Market Heatmap adalah harga penutupan bulanan (akhir bulan) dari laporan KSEI yang sama, selalu diberi label **"Data EOD Bulanan"** untuk transparansi.

{% hint style="warning" %}
**Disclaimer**: IDXMap.ID menyajikan data kepemilikan saham untuk tujuan informasi dan riset. Konten di platform ini **bukan rekomendasi atau nasihat investasi**. Keputusan investasi sepenuhnya menjadi tanggung jawab pengguna.
{% endhint %}

## Mulai dari mana?

- Baru pertama kali? Mulai dari [Instant Search](panduan-pengguna/instant-search.md) untuk mencari ticker.
- Ingin memahami metodologi _free float_? Baca [Float Screener](panduan-pengguna/float-screener.md).
- Developer yang ingin menjalankan proyek ini secara lokal? Lihat [Setup Lokal](developer/setup-lokal.md).
