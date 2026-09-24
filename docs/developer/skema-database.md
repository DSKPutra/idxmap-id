# Skema Database & RLS

Skema didefinisikan di `supabase/migrations/`. Ringkasan tabel utama:

| Tabel                  | Isi                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tickers`              | Emiten IDX: kode, nama, sektor, jumlah saham beredar, kapitalisasi pasar (real, dari API IDX + laporan KSEI)                                                           |
| `ownership_breakdown`  | Kepemilikan agregat per `(ticker_code, investor_type, local_foreign, report_date)`: jumlah saham & persentase — **real**, dari laporan bulanan KSEI "Kepemilikan Efek" |
| `conglomerates`        | Kelompok usaha (dikurasi manual, berdasarkan afiliasi publik yang dikenal luas)                                                                                        |
| `conglomerate_members` | Relasi konglomerasi ↔ ticker, dengan peran `core`/`affiliate`                                                                                                          |
| `prices`               | Harga akhir bulan per ticker, untuk Market Heatmap                                                                                                                     |
| `search_logs`          | Log pencarian (untuk fitur Hot Searches)                                                                                                                               |
| `profiles`             | Profil pengguna: email, `is_paid`, `paid_at` — dibuat otomatis saat sign-up via trigger                                                                                |
| `payments`             | Riwayat transaksi Mayar.id                                                                                                                                             |
| `ai_query_logs`        | Log pertanyaan Tanya IDXMap, untuk rate limiting                                                                                                                       |

{% hint style="info" %}
Versi awal proyek ini memodelkan kepemilikan sebagai `investors` (nama) + `holdings` (per investor). Tabel itu **dipensiunkan** di migrasi `20260924000001_real_ownership_data_model.sql` karena data nama pemegang saham individual tidak tersedia publik secara massal — hanya agregat per tipe investor yang benar-benar dipublikasikan KSEI. Lihat [ETL & Sumber Data](etl-import-ksei.md).
{% endhint %}

## Row Level Security (RLS)

Semua tabel mengaktifkan RLS. Poin penting:

- `tickers`, `conglomerates`, `conglomerate_members`, `prices` — **dapat dibaca publik** (`anon` + `authenticated`).
- `ownership_breakdown` — **hanya dapat dibaca penuh oleh pengguna dengan `profiles.is_paid = true`**. Ini adalah inti mekanisme paywall.
- `profiles`, `payments`, `ai_query_logs` — pengguna hanya bisa membaca/menulis baris miliknya sendiri (`auth.uid()`).
- `search_logs` — siapa pun boleh `INSERT` (mencatat pencarian), tidak ada yang boleh `SELECT` langsung (hanya lewat view agregat).

## View publik (preview tanpa membuka RLS)

Karena `ownership_breakdown` dikunci RLS, halaman publik/gratis membaca lewat **view** yang dibuat dengan `security_invoker = false` (berjalan dengan privilese pembuat view, bukan pemanggil), sehingga bisa melihat lewat RLS `ownership_breakdown` — namun view itu sendiri **membatasi apa yang dikembalikan**:

| View                       | Fungsi                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `v_ticker_summary`         | Ringkasan publik per ticker (lokal/asing %, estimasi free float, kapitalisasi pasar) |
| `v_ownership_preview`      | Top-3 baris kepemilikan (per tipe investor) per ticker — preview gratis              |
| `v_market_stats`           | Statistik landing page (jumlah ticker, sektor, konglomerasi, tipe investor)          |
| `v_hot_searches`           | Top 10 pencarian terpopuler                                                          |
| `v_local_foreign_overview` | Agregat kepemilikan per tipe investor × lokal/asing, seluruh ticker tercakup         |

{% hint style="info" %}
Pola "security definer view" ini didokumentasikan langsung di migrasi sebagai trade-off yang disengaja — linter keamanan Supabase akan menandainya sebagai peringatan, dan itu diharapkan.
{% endhint %}

## Full-text & fuzzy search

Extension `pg_trgm` diaktifkan (di schema `extensions`) dengan index GIN pada `tickers.name`, mendukung pencarian _fuzzy_/_contains_ yang cepat untuk fitur [Instant Search](../panduan-pengguna/instant-search.md).

## Trigger penting

- `handle_new_user()` — dipanggil setelah `INSERT` ke `auth.users` (yaitu setelah login magic-link pertama kali). Membuat baris `profiles`, dan otomatis mengaktifkan `is_paid = true` jika ditemukan pembayaran `paid` dengan email yang sama di tabel `payments` (menangani kasus pembayaran sebelum login pertama).
- `set_updated_at()` — trigger generik untuk kolom `updated_at` di beberapa tabel.

## Migrasi

Jalankan migrasi terhadap proyek Supabase melalui Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Atau melalui MCP/dashboard Supabase langsung dengan mengeksekusi isi file di `supabase/migrations/` secara berurutan.
