import type { Session, SetEntry } from '../db/schema'
import { e1rm } from './logic'
import { demoFor, type Muscle } from './demos'

// Personal records, workout summaries, weekly muscle coverage and badges.
// Everything here is worked out from your logged sets; nothing extra is stored.

export interface PR {
  exerciseName: string
  weight: number
  reps: number
  kind: 'weight' | 'e1rm'
}

const key = (s: Pick<SetEntry, 'exerciseName'>) => s.exerciseName.trim().toLowerCase()

/**
 * Sets in `session` that beat everything you did before it, for the same exercise:
 * either the heaviest weight ever, or the best estimated 1-rep max (more reps at a weight).
 * One PR per exercise (the best set). Exercises done for the first time don't count.
 */
export function findPRs(sessionSets: SetEntry[], earlierSets: SetEntry[]): PR[] {
  const best = new Map<string, { weight: number; e1rm: number }>()
  for (const s of earlierSets) {
    if (!s.done || s.weight <= 0) continue
    const b = best.get(key(s)) ?? { weight: 0, e1rm: 0 }
    best.set(key(s), { weight: Math.max(b.weight, s.weight), e1rm: Math.max(b.e1rm, e1rm(s.weight, s.reps)) })
  }
  const out = new Map<string, PR & { score: number }>()
  for (const s of sessionSets) {
    if (!s.done || s.weight <= 0) continue
    const b = best.get(key(s))
    if (!b) continue
    const est = e1rm(s.weight, s.reps)
    const kind = s.weight > b.weight + 1e-6 ? 'weight' : est > b.e1rm + 0.05 ? 'e1rm' : null
    if (!kind) continue
    const prev = out.get(key(s))
    if (!prev || est > prev.score) out.set(key(s), { exerciseName: s.exerciseName, weight: s.weight, reps: s.reps, kind, score: est })
  }
  return [...out.values()].map(({ score: _score, ...pr }) => pr)
}

/** Is this one set a PR compared with earlier sessions? (for the live 🏆 on a set row) */
export function isSetPR(set: SetEntry, earlierSets: SetEntry[]): boolean {
  return findPRs([{ ...set, done: true }], earlierSets).length > 0
}

export function volume(sets: SetEntry[]): number {
  return sets.filter((s) => s.done).reduce((v, s) => v + s.weight * s.reps, 0)
}

export interface Summary {
  minutes: number
  sets: number
  volume: number
  /** % change in volume vs the last time you did this day; undefined if no previous one */
  vsLast?: number
  prs: PR[]
}

export function summarize(session: Session, sets: SetEntry[], earlierSets: SetEntry[], previousSameDay?: SetEntry[]): Summary {
  const done = sets.filter((s) => s.done)
  const end = session.finishedAt ? new Date(session.finishedAt) : new Date()
  const minutes = Math.max(1, Math.round((end.getTime() - new Date(session.startedAt).getTime()) / 60000))
  const v = volume(done)
  const pv = previousSameDay ? volume(previousSameDay) : 0
  return { minutes, sets: done.length, volume: v, vsLast: pv > 0 ? Math.round(((v - pv) / pv) * 100) : undefined, prs: findPRs(done, earlierSets) }
}

/** Hard sets per muscle group (each set counts once for every muscle the exercise works). */
export function musclesWorked(sets: SetEntry[]): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {}
  for (const s of sets) {
    if (!s.done) continue
    const demo = demoFor({ id: s.exerciseId, name: s.exerciseName })
    for (const m of demo?.muscles ?? []) out[m] = (out[m] ?? 0) + 1
  }
  return out
}

export interface Badge {
  id: string
  icon: string
  name: string
  hint: string
}

export interface Stats {
  workouts: number
  prs: number
  bestSessionVolumeKg: number
  foodStreak: number
  supplementStreak: number
  weeksTrainedInARow: number
}

const BADGES: (Badge & { earned: (s: Stats) => boolean })[] = [
  { id: 'first-workout', icon: '🏁', name: 'First workout', hint: 'Finish a workout', earned: (s) => s.workouts >= 1 },
  { id: 'workouts-10', icon: '💪', name: '10 workouts', hint: 'Finish 10 workouts', earned: (s) => s.workouts >= 10 },
  { id: 'workouts-25', icon: '🥉', name: '25 workouts', hint: 'Finish 25 workouts', earned: (s) => s.workouts >= 25 },
  { id: 'workouts-50', icon: '🥈', name: '50 workouts', hint: 'Finish 50 workouts', earned: (s) => s.workouts >= 50 },
  { id: 'workouts-100', icon: '🥇', name: '100 workouts', hint: 'Finish 100 workouts', earned: (s) => s.workouts >= 100 },
  { id: 'first-pr', icon: '🏆', name: 'First PR', hint: 'Beat a personal record', earned: (s) => s.prs >= 1 },
  { id: 'prs-25', icon: '👑', name: '25 PRs', hint: 'Set 25 personal records', earned: (s) => s.prs >= 25 },
  { id: 'volume-5t', icon: '🏗️', name: '5-tonne session', hint: 'Lift 5,000 kg in one workout', earned: (s) => s.bestSessionVolumeKg >= 5000 },
  { id: 'volume-10t', icon: '🚛', name: '10-tonne session', hint: 'Lift 10,000 kg in one workout', earned: (s) => s.bestSessionVolumeKg >= 10000 },
  { id: 'weeks-4', icon: '📅', name: 'Month of training', hint: 'Train every week for 4 weeks', earned: (s) => s.weeksTrainedInARow >= 4 },
  { id: 'weeks-12', icon: '🗓️', name: '12-week run', hint: 'Train every week for 12 weeks', earned: (s) => s.weeksTrainedInARow >= 12 },
  { id: 'food-7', icon: '🥩', name: 'Week of logging', hint: 'Log food 7 days in a row', earned: (s) => s.foodStreak >= 7 },
  { id: 'food-30', icon: '📒', name: '30-day logger', hint: 'Log food 30 days in a row', earned: (s) => s.foodStreak >= 30 },
  { id: 'supps-30', icon: '💊', name: 'Supplement streak', hint: 'Tick every supplement 30 days in a row', earned: (s) => s.supplementStreak >= 30 },
]

export function badges(stats: Stats): { badge: Badge; earned: boolean }[] {
  return BADGES.map(({ earned, ...badge }) => ({ badge, earned: earned(stats) }))
}

/** Badges earned with `after` that weren't earned with `before`. */
export function newBadges(before: Stats, after: Stats): Badge[] {
  return BADGES.filter((b) => b.earned(after) && !b.earned(before)).map(({ earned: _e, ...b }) => b)
}

const DAY = 86_400_000
const t = (iso: string) => new Date(`${iso}T12:00:00`).getTime()

/** Days in a row (ending today, or yesterday if today has nothing yet) that appear in `dates`. */
export function dayStreak(dates: Iterable<string>, today: string): number {
  const set = new Set(dates)
  let d = t(today)
  if (!set.has(today)) d -= DAY
  let n = 0
  while (set.has(new Date(d).toISOString().slice(0, 10))) {
    n++
    d -= DAY
  }
  return n
}

/** Monday-start weeks in a row (ending this week or last week) with at least one workout. */
export function weekStreak(workoutDates: string[], today: string): number {
  const monday = (iso: string) => {
    const x = new Date(`${iso}T12:00:00`)
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
    return x.toISOString().slice(0, 10)
  }
  const weeks = new Set(workoutDates.map(monday))
  let w = t(monday(today))
  if (!weeks.has(monday(today))) w -= 7 * DAY
  let n = 0
  while (weeks.has(new Date(w).toISOString().slice(0, 10))) {
    n++
    w -= 7 * DAY
  }
  return n
}

/** Counts every PR ever set, walking through sessions in order (one pass, no re-scanning). */
export function countPRs(sessions: Pick<Session, 'id' | 'date' | 'startedAt'>[], sets: SetEntry[]): number {
  const bySession = new Map<string, SetEntry[]>()
  for (const s of sets) if (s.done && s.weight > 0) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])
  const best = new Map<string, { weight: number; e1rm: number }>()
  let count = 0
  for (const session of [...sessions].sort((a, b) => (a.date + a.startedAt < b.date + b.startedAt ? -1 : 1))) {
    const ss = bySession.get(session.id) ?? []
    const prExercises = new Set<string>()
    for (const s of ss) {
      const b = best.get(key(s))
      if (b && (s.weight > b.weight + 1e-6 || e1rm(s.weight, s.reps) > b.e1rm + 0.05)) prExercises.add(key(s))
    }
    count += prExercises.size
    for (const s of ss) {
      const b = best.get(key(s)) ?? { weight: 0, e1rm: 0 }
      best.set(key(s), { weight: Math.max(b.weight, s.weight), e1rm: Math.max(b.e1rm, e1rm(s.weight, s.reps)) })
    }
  }
  return count
}
