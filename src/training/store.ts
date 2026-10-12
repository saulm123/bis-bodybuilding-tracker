import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso, type CardioEntry, type DayTemplate, type Program, type Session, type SetEntry } from '../db/schema'
import { saveSettings } from '../db/settings'
import { isoDate } from '../lib/dates'
import { defaultDays } from './defaultProgram'
import { lastPerformance, planSets } from './logic'
import { planDays, PLANS } from './templates'
import { getSettings } from '../db/settings'
import { KG_PER_LB } from '../lib/units'
import type { Units } from '../db/schema'

const PROGRAM_ID = 'main'

function defaultProgram(): Program {
  const now = nowIso()
  return { id: PROGRAM_ID, days: defaultDays(), createdAt: now, updatedAt: now }
}

/** Saved program, or the built-in split if you haven't changed anything yet. Never writes. */
async function readProgram(): Promise<Program> {
  return (await db.program.get(PROGRAM_ID)) ?? defaultProgram()
}

export async function getProgram(): Promise<Program> {
  const existing = await db.program.get(PROGRAM_ID)
  if (existing) return existing
  const program = defaultProgram()
  await db.program.put(program)
  return program
}

export function useProgram(): Program | undefined {
  // Live queries must be read-only, so this doesn't save the default split.
  return useLiveQuery(() => readProgram(), [])
}

export async function saveDays(days: DayTemplate[]): Promise<void> {
  const program = await getProgram()
  await db.program.put({ ...program, days, updatedAt: nowIso() })
}

export async function updateDay(day: DayTemplate): Promise<void> {
  const program = await getProgram()
  await saveDays(program.days.map((d) => (d.id === day.id ? day : d)))
}

/** Switches to a built-in plan. Workout history is kept. */
export async function applyPlan(planId: string, units: Units): Promise<void> {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return
  const program = await getProgram()
  await db.program.put({ ...program, templateId: plan.id, days: planDays(plan, units), updatedAt: nowIso() })
}

/** Removes your edits by re-applying the plan you started from. */
export async function resetProgram(): Promise<void> {
  const program = await getProgram()
  const { units } = await getSettings()
  await applyPlan(program.templateId ?? 'ppl-ul-5', units)
}

/**
 * Every logged set of an exercise. Matches by id, and also by name so your
 * history carries over when you switch to a plan with the same lift.
 */
export async function exerciseHistory(exerciseId: string, name?: string): Promise<SetEntry[]> {
  const byId = await db.sets.where('[exerciseId+date]').between([exerciseId, ''], [exerciseId, '￿']).toArray()
  if (!name) return byId
  const byName = await db.sets.where('exerciseName').equalsIgnoreCase(name).toArray()
  const seen = new Set(byId.map((s) => s.id))
  return byId.concat(byName.filter((s) => !seen.has(s.id)))
}

/** Creates a session with set rows pre-filled from last time (with progression applied). */
export async function startSession(day: DayTemplate, deload: boolean, date = isoDate()): Promise<string> {
  await getProgram() // make sure the split is saved, so exercise ids stay stable
  const now = nowIso()
  const session: Session = { id: newId(), date, dayId: day.id, dayName: day.name, startedAt: now, deload, createdAt: now, updatedAt: now }
  const rows: SetEntry[] = []
  const { units } = await getSettings()
  // Round planned weights to 0.25 kg, or 0.5 lb for imperial users.
  const roundKg = units === 'imperial' ? 0.5 * KG_PER_LB : 0.25
  for (const ex of day.exercises) {
    const last = lastPerformance(await exerciseHistory(ex.id, ex.name))
    planSets(ex, last, deload, roundKg).forEach((p, setIndex) =>
      rows.push({
        id: newId(), sessionId: session.id, exerciseId: ex.id, exerciseName: ex.name, date, setIndex,
        weight: p.weight, reps: p.reps, done: false, createdAt: now, updatedAt: now,
      }),
    )
  }
  await db.transaction('rw', db.sessions, db.sets, db.settings, async () => {
    await db.sessions.add(session)
    await db.sets.bulkAdd(rows)
    // The deload clock starts from the very first workout.
    const settings = await db.settings.get('app')
    if (settings && !settings.lastDeloadDate) await saveSettings({ lastDeloadDate: date })
  })
  return session.id
}

export async function updateSet(id: string, patch: Partial<Pick<SetEntry, 'weight' | 'reps' | 'done'>>): Promise<void> {
  await db.sets.update(id, { ...patch, updatedAt: nowIso() })
}

export async function addSet(session: Session, exerciseId: string, exerciseName: string): Promise<void> {
  const existing = await db.sets.where('sessionId').equals(session.id).filter((s) => s.exerciseId === exerciseId).toArray()
  const prev = existing.sort((a, b) => a.setIndex - b.setIndex).at(-1)
  const now = nowIso()
  await db.sets.add({
    id: newId(), sessionId: session.id, exerciseId, exerciseName, date: session.date,
    setIndex: (prev?.setIndex ?? -1) + 1, weight: prev?.weight ?? 0, reps: prev?.reps ?? 8, done: false,
    createdAt: now, updatedAt: now,
  })
}

export async function removeSet(id: string): Promise<void> {
  await db.sets.delete(id)
}

export async function finishSession(id: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.sets, async () => {
    // Sets you never ticked off weren't done; don't let them count as history.
    await db.sets.where('sessionId').equals(id).filter((s) => !s.done).delete()
    await db.sessions.update(id, { finishedAt: nowIso(), updatedAt: nowIso() })
  })
}

export async function deleteSession(id: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.sets, async () => {
    await db.sets.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}

export async function startDeloadWeek(today = isoDate()): Promise<void> {
  const until = new Date(`${today}T12:00:00`)
  until.setDate(until.getDate() + 6)
  await saveSettings({ lastDeloadDate: today, deloadUntil: isoDate(until) })
}

export async function saveCardio(entry: Omit<CardioEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<void> {
  const now = nowIso()
  await db.cardio.put({ ...entry, id: entry.id ?? newId(), createdAt: now, updatedAt: now })
}
