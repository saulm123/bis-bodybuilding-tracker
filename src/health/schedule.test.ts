import { describe, expect, it } from 'vitest'
import type { BloodPanel, Cycle, Injection } from '../db/schema'
import { bloodsDue, bpLevel, dosesFor, nextSite, supplementStreak, weeklyBp } from './schedule'

const base = { createdAt: '', updatedAt: '' }
const cycle: Cycle = {
  ...base, id: 'c1', name: 'Bulk', startDate: '2026-09-01', endDate: '2026-12-31',
  compounds: [{ id: 'a', name: 'Compound A', doseMg: 250, days: [1, 4] }, { id: 'b', name: 'Compound B', doseMg: 100, days: [1] }],
}
const panel = (date: string): BloodPanel => ({ ...base, id: date, date, label: '', values: {} })

describe('health schedule', () => {
  it('works out bloods due dates around a cycle', () => {
    const due = bloodsDue([panel('2026-08-20')], cycle, '2026-10-14')
    expect(due[0]).toMatchObject({ status: 'done' })
    expect(due[1]).toMatchObject({ date: '2026-10-13', status: 'due' })
    expect(due[2]).toMatchObject({ date: '2027-02-11', status: 'upcoming' })
  })

  it('falls back to a routine interval without a cycle', () => {
    expect(bloodsDue([panel('2026-07-01')], undefined, '2026-10-12', 12)[0]).toMatchObject({ date: '2026-09-23', status: 'overdue' })
  })

  it('splits weekly doses across injection days', () => {
    const monday = dosesFor(cycle, '2026-10-12', [])
    expect(monday.map((d) => [d.compound.id, d.perShotMg])).toEqual([['a', 125], ['b', 100]])
    expect(dosesFor(cycle, '2026-10-13', [])).toEqual([])
    expect(dosesFor(cycle, '2027-01-04', [])).toEqual([])
  })

  it('rotates injection sites', () => {
    const inj = (date: string, site: string): Injection => ({ ...base, id: date, date, site, cycleId: 'c1', compoundId: 'a', compoundName: 'A', doseMg: 125 })
    expect(nextSite([])).toBe('Left glute')
    expect(nextSite([inj('2026-10-01', 'Left glute'), inj('2026-10-05', 'Right glute')])).toBe('Left delt')
  })

  it('averages blood pressure by week and grades it', () => {
    const r = (date: string, s: number, d: number, pulse?: number) => ({ ...base, id: date, date, time: '07:00', systolic: s, diastolic: d, pulse })
    const weeks = weeklyBp([r('2026-10-12', 130, 80, 60), r('2026-10-14', 124, 78, 62), r('2026-10-08', 140, 90)])
    expect(weeks[0]).toMatchObject({ weekStart: '2026-10-12', systolic: 127, diastolic: 79, pulse: 61, count: 2 })
    expect(weeks[1]).toMatchObject({ weekStart: '2026-10-05', count: 1 })
    expect(bpLevel(118, 76)).toBe('normal')
    expect(bpLevel(132, 76)).toBe('elevated')
    expect(bpLevel(141, 76)).toBe('high')
  })

  it('counts supplement streaks', () => {
    const taken = new Map([
      ['2026-10-10', new Set(['a', 'b'])],
      ['2026-10-11', new Set(['a', 'b'])],
      ['2026-10-12', new Set(['a'])],
    ])
    expect(supplementStreak(taken, ['a', 'b'], '2026-10-12')).toBe(2)
  })
})
