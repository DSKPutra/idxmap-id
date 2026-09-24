# Testing

## Unit test (Vitest)

```bash
npm run test        # jalankan sekali
npm run test:watch  # mode watch
```

Cakupan saat ini:

- `src/lib/freeFloat.test.ts` — validasi rumus estimasi free float dan klasifikasi band (`sangat_rendah`, `rendah`, `menengah`, `tinggi`)
- `src/lib/normalizeName.test.ts` — validasi normalisasi nama investor tetap konsisten di berbagai variasi penulisan ("PT." vs "PT", trailing "Tbk", dst.)

## Lint & format

```bash
npm run lint          # ESLint (TypeScript strict, react-hooks)
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit strict
```

Keempat perintah ini (`lint`, `format:check`, `typecheck`, `test`) dijalankan otomatis di GitHub Actions pada setiap push — lihat `.github/workflows/ci.yml`.

## Verifikasi manual di browser

Untuk perubahan UI, jalankan dev server dan uji langsung:

```bash
npm run dev
```

Alur minimal yang perlu diverifikasi setelah perubahan besar:

1. Instant Search dari landing page → buka halaman ticker
2. Halaman ticker menampilkan preview 5 pemegang saham (belum login) dan paywall CTA muncul
3. Float Screener — filter dan sort berfungsi
4. Network Graph — ganti ticker fokus dan kedalaman
5. Heatmap — treemap ter-render dan bisa diklik
6. Toggle dark/light mode dan ID/EN tidak menyebabkan layout rusak
7. Console browser bebas dari error
