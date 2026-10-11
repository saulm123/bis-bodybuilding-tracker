import { describe, expect, it } from 'vitest'
import type { ExerciseTemplate, SetEntry } from '../db/schema'
import { deloadStatus, e1rm, hitTopOfRange, lastPerformance, planSets, weekdayOf } from './logic'

const t: ExerciseTemplate = { id: 'ex1', name: 'Incline DB press', sets: 4, repMin: 6, repMax: 10, restSec: 150, increment: 2 }

const set = (sessionId: string, date: string, setIndex: number, weight: number, reps: number, done = true): SetEntry => ({
  id: `${sessionId}-${setIndex}`, sessionId, exerciseId: 'ex1', exerciseName: 'x', date, setIndex, weight, reps, done,
  createdAt: `${date}T10:00:0${setIndex}Z`, updatedAt: '',
})

describe('training logic', () => {
  it('finds the most recent session and ignores unfinished sets', () => {
    const sets = [
      set('a', '2026-10-01', 0, 30, 8), set('a', '2026-10-01', 1, 30, 7),
      set('b', '2026-10-08', 0, 32, 10), set('b', '2026-10-08', 1, 32, 9),
      set('c', '2026-10-15', 0, 34, 6, false),
    ]
    const last = lastPerformance(sets)
    expect(last?.sessionId).toBe('b')
    expect(last?.sets).toEqual([{ weight: 32, reps: 10 }, { weight: 32, reps: 9 }])
    expect(lastPerformance(sets, 'b')?.sessionId).toBe('a')
  })

  it('flags top of range only when every prescribed set got there', () => {
    expect(hitTopOfRange(t, [10, 10, 10, 10].map((reps) => ({ reps })))).toBe(true)
    expect(hitTopOfRange(t, [10, 10, 10, 9].map((reps) => ({ reps })))).toBe(false)
    expect(hitTopOfRange(t, [10, 10, 10].map((reps) => ({ reps })))).toBe(false)
  })

  it('adds weight after hitting the top, otherwise repeats', () => {
    const top = { date: 'd', sessionId: 's', sets: [10, 10, 10, 10].map((reps) => ({ weight: 32, reps })) }
    expect(planSets(t, top)).toEqual(Array(4).fill({ weight: 34, reps: 6 }))
    const notTop = { date: 'd', sessionId: 's', sets: [{ weight: 32, reps: 9 }, { weight: 32, reps: 8 }] }
    expect(planSets(t, notTop)).toEqual([{ weight: 32, reps: 9 }, { weight: 32, reps: 8 }, { weight: 32, reps: 8 }, { weight: 32, reps: 8 }])
    expect(planSets(t, undefined)).toEqual(Array(4).fill({ weight: 0, reps: 6 }))
  })

  it('halves sets and keeps weight on a deload', () => {
    const top = { date: 'd', sessionId: 's', sets: [10, 10, 10, 10].map((reps) => ({ weight: 32, reps })) }
    expect(planSets(t, top, true)).toEqual([{ weight: 32, reps: 10 }, { weight: 32, reps: 10 }])
  })

  it('works out weekdays, e1RM and deload timing', () => {
    expect(weekdayOf('2026-10-12')).toBe(1) // a Monday
    expect(weekdayOf('2026-10-18')).toBe(7)
    expect(Math.round(e1rm(100, 5))).toBe(117)
    expect(deloadStatus('2026-08-31', new Date('2026-10-12T12:00:00'))).toEqual({ weeks: 6, level: 'due' })
    expect(deloadStatus('2026-10-01', new Date('2026-10-12T12:00:00'))?.level).toBe('ok')
  })
})
