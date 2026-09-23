import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'id' | 'en'

const dictionary = {
  id: {
    'nav.search': 'Cari ticker atau investor...',
    'nav.conglomerates': 'Konglomerasi',
    'nav.network': 'Jaringan',
    'nav.localForeign': 'Lokal vs Asing',
    'nav.mutualFunds': 'Reksa Dana',
    'nav.floatScreener': 'Float Screener',
    'nav.heatmap': 'Heatmap',
    'nav.aiQa': 'Tanya IDXMap',
    'nav.pricing': 'Harga',
    'nav.login': 'Masuk',
    'nav.logout': 'Keluar',
    'nav.account': 'Akun',

    'hero.title': 'Ketahui Siapa Pemilik Setiap Saham di Indonesia',
    'hero.subtitle':
      'IDXMap.ID memetakan pemegang saham di atas 1% setiap emiten BEI, peta konglomerasi, dan jaringan investor — berdasarkan data publik KSEI.',
    'hero.ctaPrimary': 'Mulai Cari Gratis',
    'hero.ctaSecondary': 'Lihat Demo',
    'stats.tickers': 'Ticker Tercakup',
    'stats.investors': 'Investor Terdata',
    'stats.conglomerates': 'Konglomerasi Terpetakan',
    'stats.investorTypes': 'Tipe Investor',

    'features.title': 'Semua yang Anda Butuhkan untuk Membaca Struktur Kepemilikan',
    'features.search.title': 'Instant Search',
    'features.search.desc': 'Cari ticker atau nama investor, hasil muncul saat Anda mengetik.',
    'features.network.title': 'Network Graph',
    'features.network.desc':
      'Visualisasi interaktif jaringan investor dan emiten yang saling terhubung.',
    'features.conglomerate.title': 'Peta Konglomerasi',
    'features.conglomerate.desc':
      'Lihat struktur kepemilikan berlapis dari grup bisnis besar Indonesia.',
    'features.ai.title': 'Tanya IDXMap (AI)',
    'features.ai.desc':
      'Tanyakan "Siapa pemegang saham terbesar BBRI?" dalam Bahasa Indonesia atau Inggris.',
    'features.float.title': 'Float Screener',
    'features.float.desc': 'Estimasi free float seluruh ticker dengan metodologi mirip MSCI.',
    'features.heatmap.title': 'Market Heatmap',
    'features.heatmap.desc':
      'Peta panas sektor berdasarkan kapitalisasi pasar dan perubahan harga harian.',

    'pricing.title': 'Harga Sederhana, Akses Selamanya',
    'pricing.subtitle': 'Bayar sekali, akses data lengkap selamanya. Tidak ada biaya berlangganan.',
    'pricing.earlyBird': 'Harga Early Bird berakhir dalam',
    'pricing.cta': 'Beli Akses Lifetime',
    'pricing.freeFeatures': 'Gratis: pencarian, preview 5 pemegang saham teratas, statistik pasar.',
    'pricing.paidFeatures':
      'Lifetime: tabel pemegang saham lengkap, network graph, AI Q&A, float screener.',

    'faq.title': 'Pertanyaan Umum',

    'search.placeholder': 'Ketik kode ticker (mis. QRST) atau nama investor...',
    'search.tickers': 'Ticker',
    'search.investors': 'Investor',
    'search.noResults': 'Tidak ada hasil ditemukan.',

    'paywall.title': 'Data Lengkap untuk Member',
    'paywall.desc':
      'Anda melihat 5 pemegang saham teratas. Beli akses lifetime untuk melihat tabel lengkap.',
    'paywall.cta': 'Beli Akses Lifetime',
    'paywall.loginPrompt': 'Sudah bayar? Masuk dengan email',

    'auth.magicLinkTitle': 'Masuk ke IDXMap.ID',
    'auth.magicLinkDesc': 'Masukkan email Anda, kami akan mengirim tautan masuk (tanpa password).',
    'auth.emailPlaceholder': 'nama@email.com',
    'auth.sendLink': 'Kirim Tautan Masuk',
    'auth.linkSent': 'Tautan masuk telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.',

    'ticker.holders': 'Pemegang Saham',
    'ticker.localForeign': 'Lokal vs Asing',
    'ticker.freeFloat': 'Estimasi Free Float',
    'ticker.investor': 'Investor',
    'ticker.type': 'Tipe',
    'ticker.status': 'Status',
    'ticker.shares': 'Jumlah Saham',
    'ticker.percentage': 'Persentase',
    'ticker.local': 'Lokal',
    'ticker.foreign': 'Asing',
    'ticker.reportDate': 'Data per',
    'ticker.sector': 'Sektor',
    'ticker.marketCap': 'Kapitalisasi Pasar',

    'float.title': 'Float Screener',
    'float.subtitle':
      'Estimasi free float seluruh ticker. Metodologi: korporasi, bank, dan yayasan dianggap pemegang strategis (non-free-float); individu, reksa dana, asuransi, dana pensiun, dan sekuritas dihitung sebagai free float.',
    'float.filterAll': 'Semua',
    'float.filterVeryLow': '< 5%',
    'float.filterLow': '< 15%',
    'float.filterMedium': 'Menengah',
    'float.filterHigh': 'Tinggi',
    'float.warning': 'Free float rendah',

    'heatmap.title': 'Market Heatmap',
    'heatmap.subtitle': 'Ukuran kotak = kapitalisasi pasar, warna = perubahan harga harian.',
    'heatmap.dataLabel': 'Data EOD',

    'network.title': 'Network Graph',
    'network.subtitle':
      'Seret untuk menata ulang, klik node untuk membuka detail, gunakan filter kedalaman.',
    'network.depth': 'Kedalaman',

    'conglomerates.title': 'Peta Konglomerasi',
    'conglomerates.subtitle': 'Kelompok usaha besar dan emiten yang berafiliasi dengannya.',

    'localForeign.title': 'Lokal vs Asing',
    'localForeign.subtitle': 'Ringkasan kepemilikan seluruh pasar berdasarkan asal investor.',

    'mutualFunds.title': 'Reksa Dana Tracker',
    'mutualFunds.subtitle': 'Daftar reksa dana, jumlah posisi, dan holding terbesar.',
    'mutualFunds.positions': 'Jumlah Posisi',
    'mutualFunds.topHolding': 'Holding Terbesar',

    'ai.title': 'Tanya IDXMap',
    'ai.subtitle': 'Tanyakan seputar kepemilikan saham dalam Bahasa Indonesia atau Inggris.',
    'ai.placeholder': 'Contoh: Siapa pemegang saham terbesar QRST?',
    'ai.send': 'Kirim',
    'ai.loginRequired': 'Masuk untuk menggunakan Tanya IDXMap.',
    'ai.disclaimer': 'Jawaban dihasilkan AI berdasarkan data KSEI, bukan nasihat investasi.',

    'hotSearches.title': 'Pencarian Terpopuler',

    'footer.disclaimer':
      'IDXMap.ID menyajikan data publik dari laporan KSEI untuk tujuan informasi. Bukan rekomendasi atau nasihat investasi.',
    'footer.docs': 'Dokumentasi',
    'footer.affiliate': 'Program Afiliasi',

    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan. Coba lagi.',
    'common.viewAll': 'Lihat Semua',
    'common.readMore': 'Selengkapnya',
  },
  en: {
    'nav.search': 'Search ticker or investor...',
    'nav.conglomerates': 'Conglomerates',
    'nav.network': 'Network',
    'nav.localForeign': 'Local vs Foreign',
    'nav.mutualFunds': 'Mutual Funds',
    'nav.floatScreener': 'Float Screener',
    'nav.heatmap': 'Heatmap',
    'nav.aiQa': 'Ask IDXMap',
    'nav.pricing': 'Pricing',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',
    'nav.account': 'Account',

    'hero.title': 'Know Who Owns Every Stock in Indonesia',
    'hero.subtitle':
      'IDXMap.ID maps shareholders above 1% for every IDX-listed issuer, conglomerate structures, and investor networks — sourced from public KSEI reports.',
    'hero.ctaPrimary': 'Start Searching Free',
    'hero.ctaSecondary': 'View Demo',
    'stats.tickers': 'Tickers Covered',
    'stats.investors': 'Investors Tracked',
    'stats.conglomerates': 'Conglomerates Mapped',
    'stats.investorTypes': 'Investor Types',

    'features.title': 'Everything You Need to Read Ownership Structures',
    'features.search.title': 'Instant Search',
    'features.search.desc': 'Search any ticker or investor name, results appear as you type.',
    'features.network.title': 'Network Graph',
    'features.network.desc': 'Interactive visualization of connected investors and issuers.',
    'features.conglomerate.title': 'Conglomerate Map',
    'features.conglomerate.desc':
      "See the layered ownership structure of Indonesia's largest business groups.",
    'features.ai.title': 'Ask IDXMap (AI)',
    'features.ai.desc': 'Ask "Who is the largest shareholder of BBRI?" in Indonesian or English.',
    'features.float.title': 'Float Screener',
    'features.float.desc': 'Free float estimates for every ticker using an MSCI-like methodology.',
    'features.heatmap.title': 'Market Heatmap',
    'features.heatmap.desc': 'Sector heatmap by market cap and daily price change.',

    'pricing.title': 'Simple Pricing, Lifetime Access',
    'pricing.subtitle': 'Pay once, access full data forever. No subscription.',
    'pricing.earlyBird': 'Early bird pricing ends in',
    'pricing.cta': 'Get Lifetime Access',
    'pricing.freeFeatures': 'Free: search, top-5 holder preview, market stats.',
    'pricing.paidFeatures': 'Lifetime: full holder tables, network graph, AI Q&A, float screener.',

    'faq.title': 'Frequently Asked Questions',

    'search.placeholder': 'Type a ticker code (e.g. QRST) or investor name...',
    'search.tickers': 'Tickers',
    'search.investors': 'Investors',
    'search.noResults': 'No results found.',

    'paywall.title': 'Full Data for Members',
    'paywall.desc': "You're seeing the top 5 holders. Get lifetime access to see the full table.",
    'paywall.cta': 'Get Lifetime Access',
    'paywall.loginPrompt': 'Already paid? Sign in with email',

    'auth.magicLinkTitle': 'Sign in to IDXMap.ID',
    'auth.magicLinkDesc': "Enter your email, we'll send a sign-in link (no password).",
    'auth.emailPlaceholder': 'name@email.com',
    'auth.sendLink': 'Send Sign-in Link',
    'auth.linkSent': 'A sign-in link has been sent to your email. Please check your inbox.',

    'ticker.holders': 'Shareholders',
    'ticker.localForeign': 'Local vs Foreign',
    'ticker.freeFloat': 'Estimated Free Float',
    'ticker.investor': 'Investor',
    'ticker.type': 'Type',
    'ticker.status': 'Status',
    'ticker.shares': 'Shares',
    'ticker.percentage': 'Percentage',
    'ticker.local': 'Local',
    'ticker.foreign': 'Foreign',
    'ticker.reportDate': 'As of',
    'ticker.sector': 'Sector',
    'ticker.marketCap': 'Market Cap',

    'float.title': 'Float Screener',
    'float.subtitle':
      'Free float estimates across all tickers. Methodology: corporate, bank, and foundation holders are treated as strategic (non-free-float); individuals, mutual funds, insurers, pension funds, and brokers count as free float.',
    'float.filterAll': 'All',
    'float.filterVeryLow': '< 5%',
    'float.filterLow': '< 15%',
    'float.filterMedium': 'Medium',
    'float.filterHigh': 'High',
    'float.warning': 'Low free float',

    'heatmap.title': 'Market Heatmap',
    'heatmap.subtitle': 'Box size = market cap, color = daily price change.',
    'heatmap.dataLabel': 'EOD Data',

    'network.title': 'Network Graph',
    'network.subtitle': 'Drag to rearrange, click a node to open its detail, use the depth filter.',
    'network.depth': 'Depth',

    'conglomerates.title': 'Conglomerate Map',
    'conglomerates.subtitle': 'Major business groups and their affiliated issuers.',

    'localForeign.title': 'Local vs Foreign',
    'localForeign.subtitle': 'Market-wide ownership breakdown by investor origin.',

    'mutualFunds.title': 'Mutual Fund Tracker',
    'mutualFunds.subtitle': 'List of mutual funds, position count, and largest holding.',
    'mutualFunds.positions': 'Positions',
    'mutualFunds.topHolding': 'Largest Holding',

    'ai.title': 'Ask IDXMap',
    'ai.subtitle': 'Ask anything about shareholding in Indonesian or English.',
    'ai.placeholder': 'e.g. Who is the largest shareholder of QRST?',
    'ai.send': 'Send',
    'ai.loginRequired': 'Sign in to use Ask IDXMap.',
    'ai.disclaimer': 'AI-generated answers based on KSEI data, not investment advice.',

    'hotSearches.title': 'Trending Searches',

    'footer.disclaimer':
      'IDXMap.ID presents public data from KSEI reports for informational purposes. Not investment advice or a recommendation.',
    'footer.docs': 'Documentation',
    'footer.affiliate': 'Affiliate Program',

    'common.loading': 'Loading...',
    'common.error': 'Something went wrong. Try again.',
    'common.viewAll': 'View All',
    'common.readMore': 'Read more',
  },
} as const

export type TranslationKey = keyof (typeof dictionary)['id']

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('idxmap-lang') as Lang) || 'id'
    } catch {
      return 'id'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('idxmap-lang', lang)
    } catch {
      // ignore (private browsing, storage disabled, etc.)
    }
  }, [lang])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      t: (key) => dictionary[lang][key] ?? dictionary.id[key] ?? key,
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export const INVESTOR_TYPE_LABEL: Record<string, { id: string; en: string }> = {
  CP: { id: 'Korporasi', en: 'Corporate' },
  ID: { id: 'Individu', en: 'Individual' },
  IB: { id: 'Bank Investasi', en: 'Investment Bank' },
  MF: { id: 'Reksa Dana', en: 'Mutual Fund' },
  IS: { id: 'Asuransi', en: 'Insurance' },
  PF: { id: 'Dana Pensiun', en: 'Pension Fund' },
  SC: { id: 'Sekuritas', en: 'Securities/Broker' },
  FD: { id: 'Yayasan', en: 'Foundation' },
  OT: { id: 'Lainnya', en: 'Other' },
}
