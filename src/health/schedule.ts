import type { BloodPanel, BpReading, Cycle, Injection } from '../db/schema'

const DAY = 86_400_000
const t = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
const add = (iso: string, days: number) => new Date(t(iso) + days * DAY).toISOString().slice(0, 10)
const weekday = (iso: string) => ((new Date(`${iso}T12:00:00`).getDay() + 6) % 7) + 1

export interface Due {
  label: string
  date: string
  status: 'upcoming' | 'due' | 'overdue' | 'done'
}

function status(date: string, today: string, done: boolean, windowDays = 14): Due['status'] {
  if (done) return 'done'
  if (t(today) < t(date)) return 'upcoming'
  return t(today) - t(date) > windowDays * DAY ? 'overdue' : 'due'
}

/**
 * When blood tests are due.
 * With cycle dates: before you start, ~6 weeks in, and ~6 weeks after the end.
 * Without: every `intervalWeeks` after the last test.
 */
export function bloodsDue(panels: BloodPanel[], cycle: Cycle | undefined, today: string, intervalWeeks = 12): Due[] {
  const has = (from: string, to: string) => panels.some((p) => t(p.date) >= t(from) && t(p.date) <= t(to))
  if (cycle) {
    const { startDate, endDate } = cycle
    const list: Due[] = [
      { label: 'Baseline (before starting)', date: add(startDate, -14), status: status(add(startDate, -14), today, has(add(startDate, -90), startDate), 14) },
      { label: 'Mid-cycle (about 6 weeks in)', date: add(startDate, 42), status: status(add(startDate, 42), today, has(add(startDate, 28), add(startDate, 84))) },
    ]
    if (endDate) list.push({ label: 'After (about 6 weeks after finishing)', date: add(endDate, 42), status: status(add(endDate, 42), today, has(add(endDate, 28), add(endDate, 120))) })
    return list
  }
  const last = [...panels].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  const date = last ? add(last.date, intervalWeeks * 7) : today
  return [{ label: last ? `Routine bloods (every ${intervalWeeks} weeks)` : 'First blood test', date, status: status(date, today, false) }]
}

/** Doses due on a given day from a cycle's schedule, with whether each was logged. */
export function dosesFor(cycle: Cycle, date: string, injections: Injection[]) {
  if (t(date) < t(cycle.startDate) || (cycle.endDate && t(date) > t(cycle.endDate))) return []
  return cycle.compounds
    .filter((c) => c.days.includes(weekday(date)))
    .map((c) => ({
      compound: c,
      perShotMg: Math.round((c.doseMg / Math.max(1, c.days.length)) * 10) / 10,
      logged: injections.some((i) => i.date === date && i.compoundId === c.id),
    }))
}

export const SITES = ['Left glute', 'Right glute', 'Left delt', 'Right delt', 'Left quad', 'Right quad', 'Left ventroglute', 'Right ventroglute']

/** Next site in the rotation after the most recently used one. */
export function nextSite(injections: Injection[]): string {
  const last = [...injections].sort((a, b) => (a.date + a.createdAt < b.date + b.createdAt ? 1 : -1))[0]
  if (!last) return SITES[0]
  const i = SITES.indexOf(last.site)
  return SITES[(i + 1) % SITES.length]
}

export interface WeekAverage {
  weekStart: string
  systolic: number
  diastolic: number
  pulse?: number
  count: number
}

/** Averages per Monday-to-Sunday week, newest first. */
export function weeklyBp(readings: BpReading[]): WeekAverage[] {
  const weeks = new Map<string, BpReading[]>()
  for (const r of readings) {
    const start = add(r.date, -(weekday(r.date) - 1))
    weeks.set(start, [...(weeks.get(start) ?? []), r])
  }
  const avg = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)
  return [...weeks.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([weekStart, rs]) => {
      const pulses = rs.map((r) => r.pulse).filter((p): p is number => !!p)
      return { weekStart, systolic: avg(rs.map((r) => r.systolic)), diastolic: avg(rs.map((r) => r.diastolic)), pulse: pulses.length ? avg(pulses) : undefined, count: rs.length }
    })
}

export type BpLevel = 'normal' | 'elevated' | 'high'

export function bpLevel(sys: number, dia: number, alert = { systolic: 140, diastolic: 90 }): BpLevel {
  if (sys >= alert.systolic || dia >= alert.diastolic) return 'high'
  if (sys >= 130 || dia >= 80) return 'elevated'
  return 'normal'
}

/** Consecutive days (ending today, or yesterday if today isn't finished) where every supplement was ticked. */
export function supplementStreak(takenByDate: Map<string, Set<string>>, activeIds: string[], today: string): number {
  if (!activeIds.length) return 0
  const complete = (d: string) => activeIds.every((id) => takenByDate.get(d)?.has(id))
  let d = complete(today) ? today : add(today, -1)
  let n = 0
  while (complete(d)) {
    n++
    d = add(d, -1)
  }
  return n
}
