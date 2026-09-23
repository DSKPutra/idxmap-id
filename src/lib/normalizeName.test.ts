import { describe, expect, it } from 'vitest'
import { normalizeInvestorName } from './normalizeName'

describe('normalizeInvestorName', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeInvestorName('  Budi   Wijaya  ')).toBe('budi wijaya')
  })

  it('treats "PT" and "PT." the same', () => {
    expect(normalizeInvestorName('PT. Sentosa Abadi')).toBe(
      normalizeInvestorName('PT Sentosa Abadi'),
    )
  })

  it('strips a trailing "Tbk" suffix', () => {
    expect(normalizeInvestorName('PT Sentosa Abadi Tbk')).toBe(
      normalizeInvestorName('PT Sentosa Abadi'),
    )
  })

  it('removes punctuation but keeps alphanumerics', () => {
    expect(normalizeInvestorName('Meridian Capital, Ltd.')).toBe('meridian capital ltd')
  })

  it('produces the same key for reports formatted differently across months', () => {
    const a = normalizeInvestorName('PT. Reksa Dana Mandiri Investama Tbk.')
    const b = normalizeInvestorName('PT  Reksa Dana Mandiri Investama')
    expect(a).toBe(b)
  })
})
