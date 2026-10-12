import { describe, expect, it } from 'vitest'
import { assess, movingAverage, reviewDue, weeklyRate, type WeighIn } from './trend'

const days = (start: string, kgs: number[]): WeighIn[] =>
  kgs.map((kg, i) => {
    const d = new Date(`${start}T12:00:00`)
    d.setDate(d.getDate() + i)
    return { date: d.toISOString().slice(0, 10), kg }
  })

describe('weight trend', () => {
  it('averages the last 7 days', () => {
    const avg = movingAverage(days('2026-10-01', [86, 88, 87, 86, 87, 88, 86, 90]))
    expect(avg[6].kg).toBeCloseTo((86 + 88 + 87 + 86 + 87 + 88 + 86) / 7)
    expect(avg[7].kg).toBeCloseTo((88 + 87 + 86 + 87 + 88 + 86 + 90) / 7)
  })

  it('measures weekly rate from the 7-day average', () => {
    // Steady +0.1 kg/day = +0.7 kg/week, with daily noise.
    const kgs = Array.from({ length: 21 }, (_, i) => 86 + i * 0.1 + (i % 2 ? 0.3 : -0.3))
    const r = weeklyRate(days('2026-09-22', kgs), '2026-10-12')!
    expect(r.perWeek).toBeCloseTo(0.7, 1)
    expect(r.enough).toBe(true)
  })

  it('needs enough weigh-ins before acting', () => {
    const r = weeklyRate(days('2026-10-08', [86, 86.2, 86.1, 86.4, 86.3]), '2026-10-12')!
    expect(r.enough).toBe(false)
  })

  it('suggests ±200 kcal for bulk and cut', () => {
    expect(assess(0.7, 'bulk', 86).kcalChange).toBe(-200)
    expect(assess(0.1, 'bulk', 86).kcalChange).toBe(200)
    expect(assess(0.35, 'bulk', 86).kcalChange).toBe(0)
    expect(assess(-0.2, 'cut', 90).kcalChange).toBe(-200) // 0.22%/week: too slow
    expect(assess(-1.2, 'cut', 90).kcalChange).toBe(200) // 1.33%/week: too fast
    expect(assess(-0.6, 'cut', 90).kcalChange).toBe(0)
    expect(assess(0.3, 'maintain', 80).kcalChange).toBe(-200)
    expect(assess(-0.3, 'maintain', 80).kcalChange).toBe(200)
    expect(assess(0.1, 'maintain', 80).kcalChange).toBe(0)
  })

  it('waits two weeks between reviews', () => {
    expect(reviewDue(undefined, '2026-10-01', '2026-10-12')).toBe(false)
    expect(reviewDue(undefined, '2026-09-28', '2026-10-12')).toBe(true)
    expect(reviewDue('2026-10-05T09:00:00Z', '2026-09-01', '2026-10-12')).toBe(false)
  })
})
