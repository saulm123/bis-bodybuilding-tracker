import { db, type Session, type SetEntry } from '../db/schema'
import { isoDate } from '../lib/dates'
import { supplementStreak } from '../health/schedule'
import { countPRs, dayStreak, volume, weekStreak, type Stats } from './records'

/** Everything the badges need, optionally pretending one session hasn't happened (to spot new badges). */
export async function loadStats(excludeSessionId?: string): Promise<Stats> {
  const today = isoDate()
  const sessions = (await db.sessions.toArray()).filter((s) => s.finishedAt && s.id !== excludeSessionId)
  const ids = new Set(sessions.map((s) => s.id))
  const sets = (await db.sets.toArray()).filter((s) => ids.has(s.sessionId))
  const bySession = new Map<string, SetEntry[]>()
  for (const s of sets) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])
  const foodDates = new Set((await db.foodLog.toArray()).map((e) => e.date))
  const supps = (await db.supplements.toArray()).filter((s) => s.active).map((s) => s.id)
  const logs = await db.supplementLog.toArray()
  const taken = new Map<string, Set<string>>()
  for (const l of logs) taken.set(l.date, (taken.get(l.date) ?? new Set()).add(l.supplementId))
  return {
    workouts: sessions.length,
    prs: countPRs(sessions, sets),
    bestSessionVolumeKg: Math.max(0, ...[...bySession.values()].map(volume)),
    foodStreak: dayStreak(foodDates, today),
    supplementStreak: supplementStreak(taken, supps, today),
    weeksTrainedInARow: weekStreak(sessions.map((s: Session) => s.date), today),
  }
}

/** Days in a row with anything logged (food or a workout), for the 🔥 on Today. */
export async function activityStreak(): Promise<number> {
  const dates = new Set<string>()
  for (const e of await db.foodLog.toArray()) dates.add(e.date)
  for (const s of await db.sessions.toArray()) if (s.finishedAt) dates.add(s.date)
  return dayStreak(dates, isoDate())
}
