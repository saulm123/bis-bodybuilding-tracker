import { describe, expect, it } from 'vitest'
import { bmr, computeTargets, maintenanceKcal } from './targets'
import { fatGrams } from './macros'

describe('target calculator', () => {
  it('uses Mifflin-St Jeor for men and women', () => {
    expect(bmr({ sex: 'male', age: 30, heightCm: 180, weightKg: 80 })).toBe(1780)
    expect(bmr({ sex: 'female', age: 30, heightCm: 165, weightKg: 62 })).toBe(1340.25)
  })

  it('gives a tall, active man on a physical job about 3,650 kcal to bulk', () => {
    const d = { sex: 'male' as const, age: 30, heightCm: 191, weightKg: 86, activity: 'physicalJob' as const, dietStyle: 'keto' as const }
    expect(maintenanceKcal(d)).toBe(3300)
    const t = computeTargets(d)
    expect(t.bulk.kcal).toBe(3650)
    expect(t.bulk.netCarbs).toBe(30)
    expect(t.cut.kcal).toBeLessThan(t.maintain.kcal)
    expect(t.cut.protein).toBe(190)
  })

  it('keeps enough fat even with low calories', () => {
    const d = { sex: 'female' as const, age: 45, heightCm: 158, weightKg: 55, activity: 'sedentary' as const, dietStyle: 'balanced' as const }
    const t = computeTargets(d)
    for (const phase of ['cut', 'maintain', 'bulk'] as const) expect(fatGrams(t[phase])).toBeGreaterThanOrEqual(Math.floor(55 * 0.6) - 3)
  })
})
