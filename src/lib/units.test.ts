import { describe, expect, it } from 'vitest'
import { cmToFtIn, ftInToCm, incrementFor, KG_PER_LB, tidy, unitHelpers } from './units'

describe('units', () => {
  it('converts kg and lb both ways without drifting', () => {
    const u = unitHelpers('imperial')
    const kg = u.toKg(225)
    expect(tidy(u.fromKg(kg))).toBe(225)
    expect(u.fmtW(100)).toBe('220.5 lb')
    expect(unitHelpers('metric').fmtW(86.44)).toBe('86.4 kg')
  })

  it('converts height', () => {
    expect(cmToFtIn(191)).toEqual({ ft: 6, inch: 3 })
    expect(ftInToCm(6, 3)).toBe(191)
  })

  it('picks plate-friendly increments in pounds', () => {
    expect(incrementFor('imperial', 2.5)).toBeCloseTo(5 * KG_PER_LB)
    expect(incrementFor('imperial', 1)).toBeCloseTo(2.5 * KG_PER_LB)
    expect(incrementFor('metric', 2.5)).toBe(2.5)
  })
})
