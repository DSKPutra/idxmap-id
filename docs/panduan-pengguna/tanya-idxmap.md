# Tanya IDXMap (AI Q&A)

"Tanya IDXMap" adalah asisten AI yang bisa menjawab pertanyaan seputar komposisi kepemilikan saham menggunakan bahasa natural — Bahasa Indonesia maupun Inggris.

## Cara menggunakan

1. Buka halaman **Tanya IDXMap** dari navbar.
2. [Masuk](../akun-pembayaran.md) dengan email (fitur ini memerlukan login untuk mencegah penyalahgunaan).
3. Ketik pertanyaan Anda dan tekan kirim.

## Contoh pertanyaan

- "Berapa persen kepemilikan asing di BBCA?"
- "Bagaimana komposisi kepemilikan TLKM?"
- "What % of BBRI is held by mutual funds?"
- "Ticker mana yang free float-nya paling rendah?"

{% hint style="warning" %}
Karena data KSEI yang tersedia publik adalah agregat per tipe investor (bukan nama individu), Tanya IDXMap **tidak bisa** menjawab pertanyaan seperti "siapa pemegang saham terbesar X?" dengan nama spesifik — ia akan menjelaskan keterbatasan ini dan menyarankan menyebutkan kode ticker.
{% endhint %}

## Cara kerja

Setiap pertanyaan diproses melalui **retrieval-augmented generation**: sistem mendeteksi kode ticker yang disebut dalam pertanyaan, mengambil ringkasan dan rincian kepemilikan per tipe investor dari database, lalu mengirim konteks tersebut bersama pertanyaan ke model AI (Google Gemini) untuk menghasilkan jawaban berbasis data yang benar-benar ada.

{% hint style="warning" %}
Jawaban AI bersifat informasional dan **bukan nasihat atau rekomendasi investasi**.
{% endhint %}

## Batas penggunaan

Untuk menjaga kualitas layanan, setiap pengguna dibatasi maksimal **20 pertanyaan per 24 jam**.
