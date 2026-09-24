# Float Screener

Halaman **Float Screener** (`/float-screener`) menampilkan estimasi _free float_ (saham beredar bebas) untuk seluruh ticker yang tercakup, lengkap dengan filter dan pengurutan.

## Apa itu free float?

_Free float_ adalah persentase saham suatu perusahaan yang tersedia untuk diperdagangkan bebas di pasar oleh publik — di luar saham yang dipegang oleh pemegang saham strategis jangka panjang (misalnya pendiri, induk perusahaan, atau pemerintah). Semakin rendah free float, semakin sedikit saham yang benar-benar likuid diperdagangkan, yang berpotensi membuat harga lebih volatil.

## Metodologi IDXMap.ID

IDXMap.ID mengestimasi free float dengan pendekatan yang mirip metodologi MSCI, mengklasifikasikan setiap tipe investor KSEI sebagai berikut:

| Kategori                            | Tipe Investor                                                                                                          | Diperlakukan sebagai        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Pemegang strategis (non-free-float) | **CP** (Korporasi), **IB** (Bank Investasi), **FD** (Yayasan)                                                          | Dikurangi dari 100%         |
| Free float                          | **ID** (Individu), **MF** (Reksa Dana), **IS** (Asuransi), **PF** (Dana Pensiun), **SC** (Sekuritas), **OT** (Lainnya) | Dihitung sebagai free float |

Rumus: **Free Float % = 100% − total persentase kepemilikan pemegang strategis** (dibatasi minimum 0%, maksimum 100%).

{% hint style="info" %}
Ini adalah **estimasi**, bukan angka resmi dari bursa. Metodologi resmi indeks (misalnya MSCI atau IDX) bisa memiliki penyesuaian tambahan yang tidak selalu tercermin dari tipe investor KSEI semata — misalnya _lock-up period_, kepemilikan silang antar-grup, atau saham treasury.
{% endhint %}

## Filter dan pengurutan

Gunakan tombol filter untuk mempersempit ke kategori:

- **Semua**
- **< 5%** — free float sangat rendah
- **< 15%** — free float rendah
- **Menengah** — 15–40%
- **Tinggi** — di atas 40%

Klik header kolom mana pun (Ticker, Kapitalisasi Pasar, Pemegang Saham, Free Float) untuk mengurutkan tabel. Ticker dengan free float di bawah 15% ditandai dengan **badge peringatan** karena berpotensi memiliki likuiditas rendah.
