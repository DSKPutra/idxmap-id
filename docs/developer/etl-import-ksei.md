# ETL & Sumber Data

IDXMap.ID menggunakan dua sumber data resmi dan publik:

1. **KSEI "Kepemilikan Efek"** (ksei.co.id → Publikasi → Data & Statistik → Kepemilikan Efek) — laporan bulanan berformat `.zip` berisi file teks pipe-delimited (`Balancepos<YYYYMMDD>.txt`), memuat saldo kepemilikan **agregat** per sekuritas: jumlah saham per 9 tipe investor KSEI × Lokal/Asing, plus harga penutupan akhir bulan.
2. **IDX "Company Profiles" API** (idx.co.id) — data resmi kode ticker, nama emiten, dan sektor/subsektor untuk seluruh emiten tercatat.

{% hint style="warning" %}
KSEI **tidak** mempublikasikan daftar nama pemegang saham individual secara massal/gratis — granularitas terkecil yang tersedia publik adalah agregat per tipe investor. Data per-nama (misalnya "PT X memiliki 12% saham Y") hanya ada tersebar di keterbukaan informasi masing-masing emiten, satu per satu, tanpa dataset terkonsolidasi. Karena itu skema `ownership_breakdown` IDXMap.ID dirancang di level agregat ini — lihat [Skema Database](skema-database.md).
{% endhint %}

## Alur pembaruan bulanan

1. Unduh laporan terbaru dari `ksei.co.id/id/publikasi/data-dan-statistik/kepemilikan-efek` (tombol "Unduh" pada baris bulan terbaru; filenya adalah `BalanceposEfek<YYYYMMDD>.zip`). Ekstrak menjadi `Balancepos<YYYYMMDD>.txt`.
2. Jalankan `scripts/build-real-seed.ts`, yang membaca `data/raw/idx_companies.json` (daftar ticker yang ingin dilacak — perluas daftar ini sesuai kebutuhan) dan `data/raw/Balancepos<YYYYMMDD>.txt`, lalu menghasilkan `data/sample/real/{tickers,ownership_breakdown,prices}.json`.
3. Upsert hasilnya ke Supabase (lihat kolom & constraint di `supabase/migrations/20260924000001_real_ownership_data_model.sql`) — baik lewat SQL langsung maupun skrip loader sesuai kebutuhan.

```bash
npx tsx scripts/build-real-seed.ts
```

## Format file KSEI (`Balancepos<YYYYMMDD>.txt`)

File pipe-delimited (`|`) dengan header:

```
Date|Code|Type|Sec. Num|Price|Local IS|Local CP|Local PF|Local IB|Local ID|Local MF|Local SC|Local FD|Local OT|Total|Foreign IS|Foreign CP|Foreign PF|Foreign IB|Foreign ID|Foreign MF|Foreign SC|Foreign FD|Foreign OT|Total
```

- `Type` — filter ke `EQUITY` untuk saham (file juga memuat obligasi, waran, dll.)
- `Sec. Num` — total lembar saham tercatat (dipakai sebagai `tickers.listed_shares`)
- `Price` — harga penutupan akhir bulan
- Sembilan kolom `Local <TYPE>` dan `Foreign <TYPE>` — jumlah lembar per tipe investor KSEI (lihat [Glosarium](../glosarium.md))

## Memperbarui daftar ticker yang dilacak

Edit `data/raw/idx_companies.json` (format: `{code, name, sector, subSector, board}`) untuk menambah/mengurangi ticker. Data nama & sektor bisa diambil dari endpoint publik IDX:

```
https://www.idx.co.id/primary/ListedCompany/GetCompanyProfiles?kodeEmiten=&year=&indexCode=&listingBoard=&sectorCode=&subSectorCode=&start=0&length=1000
```

{% hint style="info" %}
Endpoint ini dilindungi Cloudflare bot-protection sehingga tidak bisa diakses langsung via `curl`/skrip tanpa sesi browser yang valid — ambil datanya lewat browser (mis. DevTools Network tab atau `fetch()` dari console) lalu simpan ke `idx_companies.json`.
{% endhint %}

## Peta konglomerasi

`conglomerates` dan `conglomerate_members` dikurasi manual berdasarkan afiliasi bisnis yang dikenal luas dan didokumentasikan publik (mis. Djarum sebagai pengendali BBCA melalui PT Dwimuria Investama Andalan). Perbarui langsung lewat SQL saat menambah kelompok usaha baru.

## Harga & heatmap

Karena IDXMap.ID tidak berlangganan feed harga real-time berlisensi, [Market Heatmap](../panduan-pengguna/market-heatmap.md) menggunakan harga akhir bulan dari file KSEI yang sama, dengan `change_pct` dihitung dari selisih dua bulan berturut-turut (bukan harian). Kolom `prices.source` diberi label `KSEI_MONTHLY` agar transparan soal frekuensinya.
