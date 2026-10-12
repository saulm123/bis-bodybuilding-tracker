import { describe, expect, it } from 'vitest'
import type { Session, SetEntry } from '../db/schema'
import { badges, countPRs, dayStreak, findPRs, musclesWorked, newBadges, summarize, weekStreak, type Stats } from './records'

const s = (sessionId: string, name: string, weight: number, reps: number, done = true): SetEntry => ({
  id: `${sessionId}-${name}-${weight}-${reps}`, sessionId, exerciseId: name.toLowerCase().replace(/ /g, '-'), exerciseName: name,
  date: '2026-10-01', setIndex: 0, weight, reps, done, createdAt: '', updatedAt: '',
})

describe('personal records', () => {
  const before = [s('a', 'Bench press', 100, 5), s('a', 'Bench press', 90, 8), s('a', 'Squat', 140, 5)]

  it('spots a heavier weight and a better rep record', () => {
    const prs = findPRs([s('b', 'Bench press', 102.5, 3), s('b', 'Squat', 140, 7)], before)
    expect(prs).toEqual([
      { exerciseName: 'Bench press', weight: 102.5, reps: 3, kind: 'weight' },
      { exerciseName: 'Squat', weight: 140, reps: 7, kind: 'e1rm' },
    ])
  })

  it('ignores matching old bests, unticked sets and first-time exercises', () => {
    expect(findPRs([s('b', 'Bench press', 100, 5), s('b', 'Bench press', 110, 5, false), s('b', 'Deadlift', 200, 5)], before)).toEqual([])
  })

  it('summarises a workout', () => {
    const session: Session = { id: 'b', date: '2026-10-08', dayId: 'mon', dayName: 'Push', startedAt: '2026-10-08T10:00:00Z', finishedAt: '2026-10-08T11:04:00Z', deload: false, createdAt: '', updatedAt: '' }
    const sum = summarize(session, [s('b', 'Bench press', 100, 6), s('b', 'Bench press', 100, 6)], before, [s('a', 'Bench press', 100, 5), s('a', 'Bench press', 90, 8)])
    expect(sum).toMatchObject({ minutes: 64, sets: 2, volume: 1200, vsLast: -2 })
    expect(sum.prs).toHaveLength(1)
  })

  it('counts sets per muscle', () => {
    expect(musclesWorked([s('b', 'Bench press', 100, 5), s('b', 'Squat', 100, 5)])).toMatchObject({ chest: 1, triceps: 1, quads: 1, glutes: 1 })
  })
})

describe('PR count', () => {
  it('counts PRs across sessions in order', () => {
    const sessions = [{ id: 'a', date: '2026-10-01', startedAt: 'a' }, { id: 'b', date: '2026-10-03', startedAt: 'b' }, { id: 'c', date: '2026-10-05', startedAt: 'c' }]
    const sets = [s('a', 'Bench press', 100, 5), s('b', 'Bench press', 102.5, 5), s('b', 'Squat', 100, 5), s('c', 'Bench press', 100, 5), s('c', 'Squat', 105, 5)]
    expect(countPRs(sessions, sets)).toBe(2)
  })
})

describe('streaks and badges', () => {
  it('counts day and week streaks', () => {
    expect(dayStreak(['2026-10-10', '2026-10-11', '2026-10-12'], '2026-10-12')).toBe(3)
    expect(dayStreak(['2026-10-10', '2026-10-11'], '2026-10-12')).toBe(2) // today not logged yet
    expect(weekStreak(['2026-09-29', '2026-10-06', '2026-10-12'], '2026-10-14')).toBe(3)
    expect(weekStreak(['2026-09-22', '2026-10-06'], '2026-10-14')).toBe(1)
  })

  it('reports newly unlocked badges', () => {
    const base: Stats = { workouts: 9, prs: 0, bestSessionVolumeKg: 4000, foodStreak: 0, supplementStreak: 0, weeksTrainedInARow: 1 }
    const after = { ...base, workouts: 10, prs: 1 }
    expect(newBadges(base, after).map((b) => b.id)).toEqual(['workouts-10', 'first-pr'])
    expect(badges(after).filter((b) => b.earned)).toHaveLength(3)
  })
})
