/**
 * Generates 100% fictional demo data into data/sample/*.json so the app is
 * browsable before any real KSEI report has been imported. Every company and
 * person name is invented and suffixed "(Data Fiktif)" so it can never be
 * mistaken for a real IDX filing. Deterministic (seeded PRNG) so re-running
 * produces the same dataset.
 *
 * Usage: npx tsx scripts/generate-sample-data.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Small seeded PRNG (mulberry32) so the dataset is reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260923)
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const OUT_DIR = join(import.meta.dirname, '..', 'data', 'sample')
mkdirSync(OUT_DIR, { recursive: true })

const SECTORS = [
  'Perbankan',
  'Konsumer',
  'Energi',
  'Telekomunikasi',
  'Properti',
  'Pertambangan',
  'Infrastruktur',
  'Kesehatan',
]

const TICKER_CODES = [
  'QRST',
  'ZYXW',
  'VVXQ',
  'JKLZ',
  'MNBV',
  'PLKJ',
  'WERT',
  'ASDG',
  'FGHJ',
  'CVBN',
  'TYUI',
  'OPQR',
  'LKJH',
  'BNML',
]

const tickers = TICKER_CODES.map((code) => {
  const listedShares = int(2_000_000_000, 40_000_000_000)
  const price = int(100, 12_000)
  return {
    code,
    name: `PT ${code} Nusantara Tbk (Data Fiktif)`,
    sector: pick(SECTORS),
    listed_shares: listedShares,
    market_cap: listedShares * price,
    _price: price,
  }
})

const INVESTOR_TYPES = ['CP', 'ID', 'IB', 'MF', 'IS', 'PF', 'SC', 'FD', 'OT'] as const
const LOCAL_GIVEN = [
  'Budi',
  'Siti',
  'Andi',
  'Rina',
  'Agus',
  'Dewi',
  'Hendra',
  'Putri',
  'Bambang',
  'Ayu',
]
const LOCAL_SURNAME = [
  'Wijaya',
  'Santoso',
  'Kusuma',
  'Pratama',
  'Sinaga',
  'Halim',
  'Wibowo',
  'Gunawan',
]
const FOREIGN_FIRM = [
  'Meridian Capital',
  'Northbridge Asset',
  'Silverline Partners',
  'Orient Pacific Fund',
  'Blue Harbor Investment',
  'Summit Crest Capital',
]
const CORP_SUFFIX = [
  'Investama',
  'Sekuritas',
  'Sentosa',
  'Mandiri Group',
  'Abadi Jaya',
  'Cipta Karya',
]

function makeInvestorName(type: (typeof INVESTOR_TYPES)[number], localForeign: 'L' | 'F') {
  if (type === 'ID') {
    return `${pick(LOCAL_GIVEN)} ${pick(LOCAL_SURNAME)} (Data Fiktif)`
  }
  if (localForeign === 'F') {
    return `${pick(FOREIGN_FIRM)} Ltd (Data Fiktif)`
  }
  const kind =
    type === 'MF'
      ? 'Reksa Dana'
      : type === 'IS'
        ? 'Asuransi'
        : type === 'PF'
          ? 'Dana Pensiun'
          : type === 'SC'
            ? 'Sekuritas'
            : type === 'IB'
              ? 'Bank Investasi'
              : type === 'FD'
                ? 'Yayasan'
                : 'Perusahaan'
  return `PT ${kind} ${pick(CORP_SUFFIX)} (Data Fiktif)`
}

// Upserts elsewhere key investors by (normalized) name, so within one
// generated snapshot every name must be unique — otherwise two distinct
// fictional investors would silently collapse into one row on import.
const usedNames = new Set<string>()
const investors = Array.from({ length: 45 }, (_, i) => {
  const type = pick([...INVESTOR_TYPES])
  const localForeign: 'L' | 'F' = type === 'ID' ? 'L' : rand() < 0.68 ? 'L' : 'F'
  let name = makeInvestorName(type, localForeign)
  let suffixN = 2
  while (usedNames.has(name)) {
    name = `${makeInvestorName(type, localForeign)} ${suffixN++}`
  }
  usedNames.add(name)
  return {
    id: `INV-${String(i + 1).padStart(3, '0')}`,
    name,
    type,
    local_foreign: localForeign,
    nationality:
      localForeign === 'L'
        ? 'Indonesia'
        : pick(['Singapura', 'Amerika Serikat', 'Jepang', 'Belanda']),
  }
})

const REPORT_DATE = '2026-08-29'

const holdings: {
  ticker_code: string
  investor_id: string
  shares: number
  percentage: number
  report_date: string
}[] = []

for (const t of tickers) {
  const holderCount = int(6, 10)
  const shuffled = [...investors].sort(() => rand() - 0.5).slice(0, holderCount)
  let remaining = 100
  shuffled.forEach((_inv, idx) => {
    const isLast = idx === shuffled.length - 1
    const maxShare = Math.min(remaining - (shuffled.length - idx - 1) * 1.2, idx === 0 ? 35 : 18)
    const pct = isLast
      ? Math.max(1, Math.min(remaining, 1 + rand() * 3))
      : Math.max(1.2, rand() * maxShare)
    remaining -= pct
    holdings.push({
      ticker_code: t.code,
      investor_id: shuffled[idx]!.id,
      shares: Math.round((pct / 100) * t.listed_shares),
      percentage: Math.round(pct * 100) / 100,
      report_date: REPORT_DATE,
    })
  })
}

const CONGLOMERATE_NAMES = [
  {
    slug: 'grup-nusantara-makmur',
    name: 'Grup Nusantara Makmur (Data Fiktif)',
    founder: 'H. Slamet Nusantara',
  },
  {
    slug: 'grup-cahaya-timur',
    name: 'Grup Cahaya Timur (Data Fiktif)',
    founder: 'Lie Cahaya Timur',
  },
  {
    slug: 'grup-samudra-abadi',
    name: 'Grup Samudra Abadi (Data Fiktif)',
    founder: 'Raden Samudra Abadi',
  },
]

const conglomerates = CONGLOMERATE_NAMES.map((c) => ({
  ...c,
  description: `Kelompok usaha fiktif ${c.name} untuk keperluan demo IDXMap.ID. Bukan entitas nyata.`,
}))

const shuffledTickers = [...tickers].sort(() => rand() - 0.5)
const conglomerateMembers = conglomerates.flatMap((c, i) =>
  shuffledTickers.slice(i * 4, i * 4 + int(2, 4)).map((t) => ({
    conglomerate_slug: c.slug,
    ticker_code: t.code,
    role: rand() < 0.7 ? 'core' : 'affiliate',
  })),
)

const prices = tickers.flatMap((t) => {
  let close = t._price
  const rows = []
  for (let d = 9; d >= 0; d--) {
    const date = new Date('2026-08-29')
    date.setDate(date.getDate() - d)
    const changePct = Math.round((rand() * 6 - 3) * 100) / 100
    close = Math.max(50, Math.round(close * (1 + changePct / 100)))
    rows.push({
      ticker_code: t.code,
      date: date.toISOString().slice(0, 10),
      close,
      change_pct: changePct,
      volume: int(500_000, 50_000_000),
      source: 'EOD_CSV',
    })
  }
  return rows
})

const cleanTickers = tickers.map(({ _price, ...rest }) => rest)

writeFileSync(join(OUT_DIR, 'tickers.json'), JSON.stringify(cleanTickers, null, 2))
writeFileSync(join(OUT_DIR, 'investors.json'), JSON.stringify(investors, null, 2))
writeFileSync(join(OUT_DIR, 'holdings.json'), JSON.stringify(holdings, null, 2))
writeFileSync(join(OUT_DIR, 'conglomerates.json'), JSON.stringify(conglomerates, null, 2))
writeFileSync(
  join(OUT_DIR, 'conglomerate_members.json'),
  JSON.stringify(conglomerateMembers, null, 2),
)
writeFileSync(join(OUT_DIR, 'prices.json'), JSON.stringify(prices, null, 2))

console.log(
  `Generated fictional sample data: ${cleanTickers.length} tickers, ${investors.length} investors, ${holdings.length} holdings rows, ${conglomerates.length} conglomerates, ${prices.length} price rows.`,
)
