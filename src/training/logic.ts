import type { ExerciseTemplate, SetEntry } from '../db/schema'

export interface Performance {
  date: string
  sessionId: string
  sets: { weight: number; reps: number }[]
}

/** ISO weekday for a 'YYYY-MM-DD' date: 1 = Monday … 7 = Sunday. */
export function weekdayOf(isoDate: string): number {
  const d = new Date(`${isoDate}T12:00:00`)
  return ((d.getDay() + 6) % 7) + 1
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Most recent finished performance of an exercise from a list of set entries
 * (done sets only, excluding the given session).
 */
export function lastPerformance(sets: SetEntry[], excludeSessionId?: string): Performance | undefined {
  const done = sets.filter((s) => s.done && s.sessionId !== excludeSessionId)
  if (!done.length) return undefined
  const latest = done.reduce((a, b) => (b.date > a.date || (b.date === a.date && b.createdAt > a.createdAt) ? b : a))
  const sessionSets = done.filter((s) => s.sessionId === latest.sessionId).sort((a, b) => a.setIndex - b.setIndex)
  return { date: latest.date, sessionId: latest.sessionId, sets: sessionSets.map(({ weight, reps }) => ({ weight, reps })) }
}

/** True when every prescribed set reached the top of the rep range. */
export function hitTopOfRange(t: Pick<ExerciseTemplate, 'sets' | 'repMax'>, sets: { reps: number }[]): boolean {
  if (sets.length < t.sets) return false
  return sets.slice(0, t.sets).every((s) => s.reps >= t.repMax)
}

export interface PlannedSet {
  weight: number
  reps: number
}

/**
 * What to put in each set row when a workout starts.
 * Same weights as last time; if every set hit the top of the range, add the increment and
 * drop back to the bottom of the range. A deload keeps the weight but halves the sets.
 */
export function planSets(t: ExerciseTemplate, last: Performance | undefined, deload = false, roundKg = 0.25): PlannedSet[] {
  const count = deload ? Math.max(1, Math.ceil(t.sets / 2)) : t.sets
  const progress = !deload && last !== undefined && hitTopOfRange(t, last.sets) && t.increment > 0
  return Array.from({ length: count }, (_, i) => {
    const prev = last?.sets[i] ?? last?.sets[last.sets.length - 1]
    if (!prev) return { weight: 0, reps: t.repMin }
    if (progress) return { weight: roundTo(prev.weight + t.increment, roundKg), reps: t.repMin }
    return { weight: prev.weight, reps: Math.min(Math.max(prev.reps, t.repMin), t.repMax) }
  })
}

/** Estimated one-rep max (Epley). */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export type DeloadStatus = { weeks: number; level: 'ok' | 'due' | 'overdue' } | undefined

/** Weeks of training since the last deload (or first workout). Due at 6 weeks, overdue at 8. */
export function deloadStatus(sinceIso: string | undefined, today = new Date()): DeloadStatus {
  if (!sinceIso) return undefined
  const weeks = Math.floor((today.getTime() - new Date(`${sinceIso}T00:00:00`).getTime()) / (7 * 86_400_000))
  return { weeks, level: weeks >= 8 ? 'overdue' : weeks >= 6 ? 'due' : 'ok' }
}

export function formatRest(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

/** "32.5×10 · 32.5×9". Pass `fromKg` to show pounds. */
export function formatSets(sets: { weight: number; reps: number }[], fromKg: (kg: number) => number = (kg) => kg): string {
  return sets.map((s) => (s.weight ? `${+fromKg(s.weight).toFixed(1)}×${s.reps}` : `${s.reps}`)).join(' · ')
}
