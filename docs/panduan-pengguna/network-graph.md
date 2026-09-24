# Network Graph

Halaman **Jaringan** (`/jaringan`) memvisualisasikan hubungan antara ticker dan tipe investor sebagai graf interaktif berbasis D3.js force-directed layout.

## Elemen graf

- **Node biru besar** — ticker/emiten (ukuran mencerminkan total persentase kepemilikan yang tervisualisasi)
- **Node aksen** — tipe investor (misalnya "Korporasi (L)", "Reksa Dana (F)") — 18 node tipe yang dipakai bersama oleh seluruh ticker

Garis yang menghubungkan keduanya merepresentasikan persentase kepemilikan tipe investor tersebut pada ticker itu.

{% hint style="info" %}
Karena data publik tidak memuat nama pemegang saham individual (lihat [Pengenalan](../README.md)), graf ini menghubungkan ticker ke **tipe investor**, bukan ke nama investor. Dua ticker yang sama-sama terhubung kuat ke node tipe yang sama (misalnya "Bank Investasi (F)") berarti keduanya punya profil kepemilikan yang mirip.
{% endhint %}

## Kontrol interaktif

| Aksi                   | Cara                                      |
| ---------------------- | ----------------------------------------- |
| Pindah/tata ulang node | Seret (drag) node mana pun                |
| Perbesar/perkecil      | Scroll atau pinch di area graf            |
| Geser tampilan         | Klik dan seret area kosong                |
| Buka detail            | Klik node ticker untuk membuka halamannya |

## Filter kedalaman (depth)

Pilih **ticker fokus** dari dropdown, lalu atur **kedalaman**:

- **Kedalaman 1** — hanya menampilkan tipe investor teratas yang memegang ticker tersebut
- **Kedalaman 2** — juga menampilkan ticker lain yang berbagi tipe investor yang sama, mengungkap kemiripan profil kepemilikan antar-emiten

Filter kedalaman ini penting untuk menjaga graf tetap terbaca — pada kedalaman 2, tipe investor umum (misalnya "Individu (L)") yang dimiliki hampir semua ticker bisa membuat graf cukup padat.
