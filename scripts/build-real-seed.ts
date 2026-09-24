/**
 * Builds real seed data for IDXMap.ID from two genuinely public, official
 * sources:
 *  - data/reference/idx-tracked-tickers.json (tracked in git) —
 *    ticker/name/sector for the tickers this deployment covers, sourced
 *    from IDX's public "Company Profiles" API (idx.co.id). See
 *    docs/developer/etl-import-ksei.md for how to refresh/extend it.
 *  - data/raw/Balancepos<YYYYMMDD>.txt (gitignored, re-downloaded each
 *    month) — KSEI's monthly public "Kepemilikan Efek" report
 *    (ksei.co.id), a real aggregate balance position per security: total
 *    shares held by each of the 9 KSEI investor types, split
 *    Local/Foreign. This is genuinely the finest grain KSEI publishes in
 *    bulk for free — it does NOT include named individual holders (that
 *    only exists scattered across each issuer's own filings).
 *
 * Output: data/sample/real/{tickers,ownership_breakdown,prices}.json,
 * scoped to the tracked ticker list rather than the full ~900-issuer
 * universe, to keep the dataset a manageable, meaningful size.
 *
 * Usage: npx tsx scripts/build-real-seed.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const RAW_DIR = join(ROOT, 'data', 'raw')
const REFERENCE_DIR = join(ROOT, 'data', 'reference')
const OUT_DIR = join(ROOT, 'data', 'sample', 'real')
mkdirSync(OUT_DIR, { recursive: true })

const REPORT_DATE = '2026-08-31'
const PREV_REPORT_DATE = '2026-07-31'

interface CompanyMeta {
  code: string
  name: string
  sector: string
  subSector: string
  board: string
}

const companies: CompanyMeta[] = JSON.parse(
  readFileSync(join(REFERENCE_DIR, 'idx-tracked-tickers.json'), 'utf-8'),
)
const wantedCodes = new Set(companies.map((c) => c.code))

const TYPE_ORDER = ['IS', 'CP', 'PF', 'IB', 'ID', 'MF', 'SC', 'FD', 'OT'] as const

interface BalanceposRow {
  code: string
  secNum: number
  price: number
  local: Record<string, number>
  foreign: Record<string, number>
  localTotal: number
  foreignTotal: number
}

function parseBalancepos(filename: string): Map<string, BalanceposRow> {
  const text = readFileSync(join(RAW_DIR, filename), 'utf-8').trim()
  const lines = text.split('\n')
  const map = new Map<string, BalanceposRow>()

  for (const line of lines.slice(1)) {
    const cols = line.trim().split('|')
    if (cols.length < 24) continue
    const [, code, type, secNumStr, priceStr, ...rest] = cols
    if (type !== 'EQUITY' || !code || !wantedCodes.has(code)) continue

    // rest = [Local IS..OT (9), Local Total, Foreign IS..OT (9), Foreign Total]
    const localVals = rest.slice(0, 9).map(Number)
    const localTotal = Number(rest[9])
    const foreignVals = rest.slice(10, 19).map(Number)
    const foreignTotal = Number(rest[19]?.replace('\r', ''))

    const local: Record<string, number> = {}
    const foreign: Record<string, number> = {}
    TYPE_ORDER.forEach((t, i) => {
      local[t] = localVals[i] ?? 0
      foreign[t] = foreignVals[i] ?? 0
    })

    map.set(code, {
      code,
      secNum: Number(secNumStr),
      price: Number(priceStr),
      local,
      foreign,
      localTotal,
      foreignTotal,
    })
  }
  return map
}

const augRows = parseBalancepos('Balancepos20260831.txt')
const julRows = parseBalancepos('Balancepos20260731.txt')

console.log(
  `Matched ${augRows.size} / ${companies.length} curated tickers in the Aug 2026 KSEI report.`,
)

const missing = companies.filter((c) => !augRows.has(c.code))
if (missing.length > 0) {
  console.warn(`Not found in KSEI report (dropped): ${missing.map((m) => m.code).join(', ')}`)
}

// STRATEGIC_TYPES mirrors src/lib/freeFloat.ts — corporate/bank/foundation
// holders treated as non-free-float.
const STRATEGIC_TYPES = new Set(['CP', 'IB', 'FD'])

const tickers: {
  code: string
  name: string
  sector: string
  listed_shares: number
  market_cap: number
  report_date: string
}[] = []

const ownershipBreakdown: {
  ticker_code: string
  investor_type: string
  local_foreign: 'L' | 'F'
  shares: number
  percentage: number
  report_date: string
}[] = []

const prices: {
  ticker_code: string
  date: string
  close: number
  change_pct: number | null
  volume: null
  source: string
}[] = []

for (const company of companies) {
  const row = augRows.get(company.code)
  if (!row) continue

  const totalShares = row.localTotal + row.foreignTotal
  const marketCap = row.secNum * row.price

  tickers.push({
    code: company.code,
    name: company.name,
    sector: company.sector,
    listed_shares: row.secNum,
    market_cap: marketCap,
    report_date: REPORT_DATE,
  })

  for (const type of TYPE_ORDER) {
    for (const [lf, bucket] of [['L', row.local] as const, ['F', row.foreign] as const]) {
      const shares = bucket[type] ?? 0
      if (shares === 0) continue
      ownershipBreakdown.push({
        ticker_code: company.code,
        investor_type: type,
        local_foreign: lf,
        shares,
        percentage: totalShares > 0 ? Math.round((shares / totalShares) * 10000) / 100 : 0,
        report_date: REPORT_DATE,
      })
    }
  }

  const prevRow = julRows.get(company.code)
  const changePct =
    prevRow && prevRow.price > 0
      ? Math.round(((row.price - prevRow.price) / prevRow.price) * 10000) / 100
      : null

  prices.push({
    ticker_code: company.code,
    date: REPORT_DATE,
    close: row.price,
    change_pct: changePct,
    volume: null,
    source: 'KSEI_MONTHLY',
  })
  if (prevRow) {
    prices.push({
      ticker_code: company.code,
      date: PREV_REPORT_DATE,
      close: prevRow.price,
      change_pct: null,
      volume: null,
      source: 'KSEI_MONTHLY',
    })
  }
}

// Sanity check: strategic-holder % should be between 0 and 100 for every ticker.
for (const t of tickers) {
  const strategicPct = ownershipBreakdown
    .filter((o) => o.ticker_code === t.code && STRATEGIC_TYPES.has(o.investor_type))
    .reduce((s, o) => s + o.percentage, 0)
  if (strategicPct < 0 || strategicPct > 100.5) {
    console.warn(`${t.code}: strategic holder % out of range: ${strategicPct.toFixed(2)}%`)
  }
}

writeFileSync(join(OUT_DIR, 'tickers.json'), JSON.stringify(tickers, null, 2))
writeFileSync(
  join(OUT_DIR, 'ownership_breakdown.json'),
  JSON.stringify(ownershipBreakdown, null, 2),
)
writeFileSync(join(OUT_DIR, 'prices.json'), JSON.stringify(prices, null, 2))

console.log(
  `Wrote ${tickers.length} tickers, ${ownershipBreakdown.length} ownership rows, ${prices.length} price rows to ${OUT_DIR}`,
)
