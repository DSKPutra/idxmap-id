# Market Heatmap

Halaman **Heatmap** (`/heatmap`) menampilkan peta panas (treemap) seluruh ticker, dikelompokkan per sektor.

## Cara membaca

- **Ukuran kotak** = kapitalisasi pasar (semakin besar kotak, semakin besar market cap)
- **Warna kotak** = perubahan harga harian — hijau untuk kenaikan, merah untuk penurunan, abu-abu untuk mendekati datar
- **Pengelompokan** = per sektor, dengan label sektor di kiri atas setiap kelompok

Klik kotak mana pun untuk membuka [Halaman Ticker](halaman-ticker.md) yang bersangkutan.

## Sumber data harga

{% hint style="warning" %}
Data harga pada heatmap ini adalah data **End-of-Day (EOD)** yang diinput secara berkala (bukan data real-time berlangganan bursa), dan selalu ditandai dengan badge **"Data EOD"** di halaman. Operator memperbarui data harga melalui proses impor CSV — lihat [Setup Lokal](../developer/setup-lokal.md) untuk detail teknis pembaruan data.
{% endhint %}
