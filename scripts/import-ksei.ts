/**
 * Imports a monthly KSEI "Pemegang Saham di atas 1%" report from data/raw/
 * into Supabase.
 *
 * Supported inputs (place the downloaded file in data/raw/):
 *  - .xlsx  — parsed with SheetJS. Expected columns (case-insensitive,
 *             Indonesian or English header both work):
 *               Kode Saham | Kode Emiten | Ticker
 *               Nama Emiten | Ticker Name              (optional, used to upsert `tickers.name`)
 *               Sektor | Sector                        (optional)
 *               Nama Pemegang Saham | Investor Name
 *               Jenis Investor | Investor Type          (KSEI code: CP/ID/IB/MF/IS/PF/SC/FD/OT)
 *               Lokal/Asing | Local/Foreign             (L/F, or "Lokal"/"Asing")
 *               Jumlah Saham | Shares
 *               Persentase | Percentage
 *               Tanggal Laporan | Report Date            (optional — falls back to --date)
 *  - .pdf   — text is extracted with pdf-parse and parsed line-by-line
 *             against the same column order. PDF table extraction is
 *             best-effort: KSEI's PDF layout varies by release, so always
 *             spot-check row counts against the source after a PDF import.
 *
 * Usage:
 *   npx tsx scripts/import-ksei.ts --file data/raw/ksei-2026-08.xlsx --date 2026-08-29
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * (service role — never the anon key, never committed).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { normalizeInvestorName } from '../src/lib/normalizeName'

const RAW_DIR = join(import.meta.dirname, '..', 'data', 'raw')

const VALID_TYPES = new Set(['CP', 'ID', 'IB', 'MF', 'IS', 'PF', 'SC', 'FD', 'OT'])

interface ParsedRow {
  tickerCode: string
  tickerName?: string
  sector?: string
  investorName: string
  investorType: string
  localForeign: 'L' | 'F'
  shares: number
  percentage: number
  reportDate: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const idx = args.indexOf(flag)
    return idx >= 0 ? args[idx + 1] : undefined
  }
  return { file: get('--file'), date: get('--date') }
}

function findHeaderKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  const keys = Object.keys(row)
  for (const candidate of candidates) {
    const match = keys.find((k) => k.trim().toLowerCase() === candidate.toLowerCase())
    if (match) return match
  }
  return undefined
}

function normalizeLocalForeign(raw: string): 'L' | 'F' {
  const v = raw.trim().toLowerCase()
  if (v.startsWith('l') || v === 'local' || v === 'lokal') return 'L'
  return 'F'
}

function parseXlsx(filePath: string, fallbackDate?: string): ParsedRow[] {
  const workbook = XLSX.read(readFileSync(filePath))
  const rows: ParsedRow[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (json.length === 0) continue

    const sample = json[0]!
    const tickerKey = findHeaderKey(sample, ['Kode Saham', 'Kode Emiten', 'Ticker'])
    const nameKey = findHeaderKey(sample, ['Nama Emiten', 'Ticker Name'])
    const sectorKey = findHeaderKey(sample, ['Sektor', 'Sector'])
    const investorKey = findHeaderKey(sample, ['Nama Pemegang Saham', 'Investor Name'])
    const typeKey = findHeaderKey(sample, ['Jenis Investor', 'Investor Type'])
    const lfKey = findHeaderKey(sample, ['Lokal/Asing', 'Local/Foreign'])
    const sharesKey = findHeaderKey(sample, ['Jumlah Saham', 'Shares'])
    const pctKey = findHeaderKey(sample, ['Persentase', 'Percentage'])
    const dateKey = findHeaderKey(sample, ['Tanggal Laporan', 'Report Date'])

    if (!tickerKey || !investorKey || !typeKey || !lfKey || !sharesKey || !pctKey) {
      console.warn(`Sheet "${sheetName}" is missing required columns, skipping.`)
      continue
    }

    for (const row of json) {
      const tickerCode = String(row[tickerKey]).trim().toUpperCase()
      const investorType = String(row[typeKey]).trim().toUpperCase()
      if (!tickerCode || !VALID_TYPES.has(investorType)) continue

      rows.push({
        tickerCode,
        tickerName: nameKey ? String(row[nameKey]).trim() : undefined,
        sector: sectorKey ? String(row[sectorKey]).trim() : undefined,
        investorName: String(row[investorKey]).trim(),
        investorType,
        localForeign: normalizeLocalForeign(String(row[lfKey])),
        shares: Number(String(row[sharesKey]).replace(/[.,\s]/g, '')) || 0,
        percentage: Number(String(row[pctKey]).replace(',', '.')) || 0,
        reportDate: (dateKey ? String(row[dateKey]).trim() : '') || fallbackDate || '',
      })
    }
  }
  return rows
}

async function parsePdf(filePath: string, fallbackDate?: string): Promise<ParsedRow[]> {
  // Lazy import: pdf-parse pulls in a large PDF.js build we don't want to
  // pay for when only XLSX files are being imported.
  const pdfParse = (await import('pdf-parse')).default
  const { text } = await pdfParse(readFileSync(filePath))

  // Best-effort: KSEI PDF tables typically render one holding per line as
  // "KODE  NAMA PEMEGANG SAHAM  JENIS  L/F  JUMLAH_SAHAM  PERSENTASE".
  // Always cross-check the imported row count against the source PDF.
  const lineRegex =
    /^([A-Z]{4})\s+(.+?)\s+(CP|ID|IB|MF|IS|PF|SC|FD|OT)\s+(L|F)\s+([\d.,]+)\s+([\d.,]+)\s*%?$/
  const rows: ParsedRow[] = []

  for (const line of text.split('\n')) {
    const match = lineRegex.exec(line.trim())
    if (!match) continue
    const [, tickerCode, investorName, investorType, localForeign, sharesRaw, pctRaw] = match
    rows.push({
      tickerCode: tickerCode!,
      investorName: investorName!.trim(),
      investorType: investorType!,
      localForeign: localForeign as 'L' | 'F',
      shares: Number(sharesRaw!.replace(/[.,]/g, '')) || 0,
      percentage: Number(pctRaw!.replace(',', '.')) || 0,
      reportDate: fallbackDate || '',
    })
  }

  if (rows.length === 0) {
    console.warn(
      'No rows matched the expected PDF table pattern. KSEI PDF layouts vary by release — ' +
        'consider converting the PDF to XLSX (e.g. with a table-extraction tool) and re-running with --file pointing at the .xlsx instead.',
    )
  }
  return rows
}

async function main() {
  const { file, date } = parseArgs()
  const targetFiles = file
    ? [file]
    : readdirSync(RAW_DIR)
        .filter((f) => ['.xlsx', '.pdf'].includes(extname(f).toLowerCase()))
        .map((f) => join(RAW_DIR, f))

  if (targetFiles.length === 0) {
    console.error(
      `No .xlsx or .pdf files found in ${RAW_DIR}. Pass --file <path> or add a file there.`,
    )
    process.exit(1)
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  let allRows: ParsedRow[] = []
  for (const filePath of targetFiles) {
    console.log(`Parsing ${filePath}...`)
    const ext = extname(filePath).toLowerCase()
    const rows = ext === '.xlsx' ? parseXlsx(filePath, date) : await parsePdf(filePath, date)
    console.log(`  -> ${rows.length} holding rows`)
    allRows = allRows.concat(rows)
  }

  const missingDate = allRows.filter((r) => !r.reportDate)
  if (missingDate.length > 0) {
    console.error(
      `${missingDate.length} rows have no report date and no --date fallback was given. Pass --date YYYY-MM-DD.`,
    )
    process.exit(1)
  }

  // 1) Upsert tickers.
  const tickerMap = new Map<string, { code: string; name?: string; sector?: string }>()
  for (const row of allRows) {
    if (!tickerMap.has(row.tickerCode)) {
      tickerMap.set(row.tickerCode, {
        code: row.tickerCode,
        name: row.tickerName,
        sector: row.sector,
      })
    }
  }
  const tickerRows = [...tickerMap.values()].map((t) => ({
    code: t.code,
    name: t.name || t.code,
    sector: t.sector || null,
  }))
  const { error: tickerErr } = await supabase
    .from('tickers')
    .upsert(tickerRows, { onConflict: 'code' })
  if (tickerErr) throw new Error(`Failed to upsert tickers: ${tickerErr.message}`)
  console.log(`Upserted ${tickerRows.length} tickers.`)

  // 2) Upsert investors (deduped by normalized name).
  const investorMap = new Map<
    string,
    { name: string; name_normalized: string; type: string; local_foreign: string }
  >()
  for (const row of allRows) {
    const key = normalizeInvestorName(row.investorName)
    if (!investorMap.has(key)) {
      investorMap.set(key, {
        name: row.investorName,
        name_normalized: key,
        type: row.investorType,
        local_foreign: row.localForeign,
      })
    }
  }
  const { data: insertedInvestors, error: investorErr } = await supabase
    .from('investors')
    .upsert([...investorMap.values()], { onConflict: 'name_normalized' })
    .select('id, name_normalized')
  if (investorErr) throw new Error(`Failed to upsert investors: ${investorErr.message}`)
  console.log(`Upserted ${insertedInvestors?.length ?? 0} investors.`)

  const normalizedToId = new Map(
    (insertedInvestors ?? []).map((r) => [r.name_normalized, r.id as string]),
  )

  // 3) Upsert holdings.
  const holdingRows = allRows.map((row) => ({
    ticker_code: row.tickerCode,
    investor_id: normalizedToId.get(normalizeInvestorName(row.investorName)),
    shares: row.shares,
    percentage: row.percentage,
    report_date: row.reportDate,
  }))
  const { error: holdingErr } = await supabase
    .from('holdings')
    .upsert(holdingRows, { onConflict: 'ticker_code,investor_id,report_date' })
  if (holdingErr) throw new Error(`Failed to upsert holdings: ${holdingErr.message}`)
  console.log(`Upserted ${holdingRows.length} holding rows.`)

  console.log('KSEI import complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
