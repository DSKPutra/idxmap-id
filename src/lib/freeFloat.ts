export type InvestorTypeCode = 'CP' | 'ID' | 'IB' | 'MF' | 'IS' | 'PF' | 'SC' | 'FD' | 'OT'

export interface HoldingForFreeFloat {
  investorType: InvestorTypeCode
  percentage: number
}

/**
 * Investor types treated as "strategic" (non-free-float) holders, loosely
 * following MSCI's free-float methodology: corporate/bank/foundation
 * cross-holdings are assumed to be long-term strategic stakes, not shares
 * available to trade. Individuals, mutual funds, insurers, pension funds,
 * brokers, and "other" are counted as free float.
 */
const STRATEGIC_HOLDER_TYPES: ReadonlySet<InvestorTypeCode> = new Set(['CP', 'IB', 'FD'])

/** Free float % = 100 minus the combined stake of strategic holders, clamped to [0, 100]. */
export function calculateFreeFloat(holdings: HoldingForFreeFloat[]): number {
  const strategicPct = holdings
    .filter((h) => STRATEGIC_HOLDER_TYPES.has(h.investorType))
    .reduce((sum, h) => sum + h.percentage, 0)
  return Math.min(100, Math.max(0, 100 - strategicPct))
}

export type FreeFloatBand = 'sangat_rendah' | 'rendah' | 'menengah' | 'tinggi'

export const FREE_FLOAT_BAND_LABEL: Record<FreeFloatBand, string> = {
  sangat_rendah: '< 5%',
  rendah: '< 15%',
  menengah: 'Menengah (15–40%)',
  tinggi: 'Tinggi (> 40%)',
}

export function classifyFreeFloatBand(freeFloatPct: number): FreeFloatBand {
  if (freeFloatPct < 5) return 'sangat_rendah'
  if (freeFloatPct < 15) return 'rendah'
  if (freeFloatPct < 40) return 'menengah'
  return 'tinggi'
}

/** Tickers below this free float % are flagged with a low-liquidity warning badge. */
export const LOW_FLOAT_WARNING_THRESHOLD = 15
