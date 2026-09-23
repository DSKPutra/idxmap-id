/**
 * Upserts the fictional dataset in data/sample/*.json into Supabase so the
 * app has something to show before real KSEI data has been imported.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role — never
 * the anon key, and never committed) as environment variables.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-sample-data.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const DATA_DIR = join(import.meta.dirname, '..', 'data', 'sample')
const load = <T>(file: string): T => JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'))

async function upsert(table: string, rows: unknown[], onConflict: string) {
  if (rows.length === 0) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict })
  if (error) throw new Error(`Failed to seed ${table}: ${error.message}`)
  console.log(`Seeded ${rows.length} rows into ${table}`)
}

async function main() {
  const tickers = load<Record<string, unknown>[]>('tickers.json')
  const investors =
    load<{ id: string; name: string; type: string; local_foreign: string; nationality: string }[]>(
      'investors.json',
    )
  const holdings = load<
    {
      ticker_code: string
      investor_id: string
      shares: number
      percentage: number
      report_date: string
    }[]
  >('holdings.json')
  const conglomerates =
    load<{ slug: string; name: string; founder: string; description: string }[]>(
      'conglomerates.json',
    )
  const conglomerateMembers = load<
    { conglomerate_slug: string; ticker_code: string; role: string }[]
  >('conglomerate_members.json')
  const prices = load<Record<string, unknown>[]>('prices.json')

  await upsert('tickers', tickers, 'code')

  // investors.json uses friendly ids (INV-001); the DB generates real uuids,
  // so we insert them first and build a lookup from friendly id -> uuid.
  const normalizedInvestors = investors.map(({ id: _id, ...rest }) => ({
    ...rest,
    name_normalized: rest.name
      .toLowerCase()
      .replace(/\(data fiktif\)/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' '),
  }))
  const { data: insertedInvestors, error: investorsError } = await supabase
    .from('investors')
    .upsert(normalizedInvestors, { onConflict: 'name_normalized' })
    .select('id, name')
  if (investorsError) throw new Error(`Failed to seed investors: ${investorsError.message}`)
  console.log(`Seeded ${insertedInvestors?.length ?? 0} rows into investors`)

  const nameToUuid = new Map((insertedInvestors ?? []).map((row) => [row.name, row.id as string]))
  const friendlyIdToName = new Map(investors.map((inv) => [inv.id, inv.name]))
  const holdingsWithUuid = holdings.map((h) => ({
    ticker_code: h.ticker_code,
    investor_id: nameToUuid.get(friendlyIdToName.get(h.investor_id) ?? ''),
    shares: h.shares,
    percentage: h.percentage,
    report_date: h.report_date,
  }))
  await upsert('holdings', holdingsWithUuid, 'ticker_code,investor_id,report_date')

  const { data: insertedCong, error: congError } = await supabase
    .from('conglomerates')
    .upsert(
      conglomerates.map(({ slug, name, founder, description }) => ({
        slug,
        name,
        founder,
        description,
      })),
      { onConflict: 'slug' },
    )
    .select('id, slug')
  if (congError) throw new Error(`Failed to seed conglomerates: ${congError.message}`)
  console.log(`Seeded ${insertedCong?.length ?? 0} rows into conglomerates`)

  const slugToId = new Map((insertedCong ?? []).map((row) => [row.slug, row.id as string]))
  const members = conglomerateMembers.map((m) => ({
    conglomerate_id: slugToId.get(m.conglomerate_slug),
    ticker_code: m.ticker_code,
    role: m.role,
  }))
  await upsert('conglomerate_members', members, 'conglomerate_id,ticker_code')

  await upsert('prices', prices, 'ticker_code,date')

  console.log('Sample data seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
