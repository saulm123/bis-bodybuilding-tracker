import { describe, expect, it } from 'vitest'
import { DEFAULT_TARGETS, fatGrams, isOverBudget } from './macros'

describe('fatGrams', () => {
  it('fills the calories left after protein and carbs', () => {
    // 3500 - 200*4 - 150*4 = 2100 kcal -> 233 g fat
    expect(fatGrams(DEFAULT_TARGETS.bulk)).toBe(233)
    // 2700 - 220*4 - 100*4 = 1420 kcal -> 158 g fat
    expect(fatGrams(DEFAULT_TARGETS.cut)).toBe(158)
  })

  it('never goes negative', () => {
    expect(fatGrams({ kcal: 1000, protein: 200, netCarbs: 100 })).toBe(0)
    expect(isOverBudget({ kcal: 1000, protein: 200, netCarbs: 100 })).toBe(true)
    expect(isOverBudget(DEFAULT_TARGETS.bulk)).toBe(false)
  })
})
