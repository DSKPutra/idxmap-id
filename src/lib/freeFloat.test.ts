import { describe, expect, it } from 'vitest'
import { calculateFreeFloat, classifyFreeFloatBand, type HoldingForFreeFloat } from './freeFloat'

describe('calculateFreeFloat', () => {
  it('subtracts only strategic holder types (CP, IB, FD) from 100', () => {
    const holdings: HoldingForFreeFloat[] = [
      { investorType: 'CP', percentage: 40 },
      { investorType: 'ID', percentage: 10 },
      { investorType: 'MF', percentage: 5 },
    ]
    expect(calculateFreeFloat(holdings)).toBe(60)
  })

  it('returns 100 when there are no strategic holders', () => {
    const holdings: HoldingForFreeFloat[] = [
      { investorType: 'ID', percentage: 10 },
      { investorType: 'SC', percentage: 5 },
    ]
    expect(calculateFreeFloat(holdings)).toBe(100)
  })

  it('clamps to 0 when strategic holders exceed 100% (data overlap)', () => {
    const holdings: HoldingForFreeFloat[] = [
      { investorType: 'CP', percentage: 70 },
      { investorType: 'IB', percentage: 40 },
    ]
    expect(calculateFreeFloat(holdings)).toBe(0)
  })

  it('returns 100 for an empty holdings list', () => {
    expect(calculateFreeFloat([])).toBe(100)
  })
})

describe('classifyFreeFloatBand', () => {
  it.each([
    [2, 'sangat_rendah'],
    [4.99, 'sangat_rendah'],
    [5, 'rendah'],
    [14.99, 'rendah'],
    [15, 'menengah'],
    [39.99, 'menengah'],
    [40, 'tinggi'],
    [100, 'tinggi'],
  ] as const)('classifies %f%% as %s', (pct, expected) => {
    expect(classifyFreeFloatBand(pct)).toBe(expected)
  })
})
