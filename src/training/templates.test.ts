import { describe, expect, it } from 'vitest'
import { planDays, PLANS, recommendPlan } from './templates'

describe('workout plans', () => {
  it('every plan covers Mon–Sun once and matches its days per week', () => {
    for (const p of PLANS) {
      const days = p.days()
      expect(days.map((d) => d.weekday).sort(), p.id).toEqual([1, 2, 3, 4, 5, 6, 7])
      expect(new Set(days.map((d) => d.id)).size, p.id).toBe(7)
      expect(days.filter((d) => d.kind === 'lift').length, p.id).toBe(p.daysPerWeek)
      for (const d of days) {
        expect(new Set(d.exercises.map((e) => e.id)).size, `${p.id}/${d.id}`).toBe(d.exercises.length)
        for (const e of d.exercises) expect(e.repMin <= e.repMax && e.sets > 0, `${p.id}/${e.id}`).toBe(true)
      }
    }
  })

  it('converts increments to pounds for imperial users', () => {
    const bench = planDays(PLANS[0], 'imperial')[0].exercises.find((e) => e.id === 'bench-press')!
    expect(bench.increment).toBeCloseTo(2.268, 2)
  })

  it('recommends sensible plans', () => {
    expect(recommendPlan(3, 'Gym', 'Beginner').id).toBe('full-body-3')
    expect(recommendPlan(4, 'Gym', 'Intermediate').id).toBe('upper-lower-4')
    expect(recommendPlan(6, 'Gym', 'Advanced').id).toBe('ppl-6')
    expect(recommendPlan(5, 'Dumbbells', 'Beginner').id).toBe('home-db-3')
  })
})
