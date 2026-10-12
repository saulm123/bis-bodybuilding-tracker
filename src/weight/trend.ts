import type { Phase } from '../db/schema'

export interface WeighIn {
  date: string
  kg: number
}

const DAY = 86_400_000
const t = (iso: string) => new Date(`${iso}T12:00:00`).getTime()

/** For each weigh-in, the average of all weigh-ins in the 7 days ending that day. */
export function movingAverage(points: WeighIn[], windowDays = 7): WeighIn[] {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1))
  return sorted.map((p) => {
    const end = t(p.date)
    const inWindow = sorted.filter((q) => t(q.date) <= end && t(q.date) > end - windowDays * DAY)
    return { date: p.date, kg: inWindow.reduce((s, q) => s + q.kg, 0) / inWindow.length }
  })
}

export interface Rate {
  /** kg per week; positive = gaining */
  perWeek: number
  /** weigh-ins in the last 14 days */
  count: number
  /** enough data to act on (10+ weigh-ins over at least 10 days) */
  enough: boolean
}

/** Weekly rate of change: slope of the 7-day average over the last 14 days. */
export function weeklyRate(points: WeighIn[], today: string): Rate | undefined {
  const from = t(today) - 13 * DAY
  const avg = movingAverage(points).filter((p) => t(p.date) >= from && t(p.date) <= t(today))
  if (avg.length < 2) return undefined
  const xs = avg.map((p) => (t(p.date) - from) / DAY)
  const ys = avg.map((p) => p.kg)
  const mx = xs.reduce((a, b) => a + b) / xs.length
  const my = ys.reduce((a, b) => a + b) / ys.length
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const slope = den ? num / den : 0
  const span = Math.max(...xs) - Math.min(...xs)
  return { perWeek: slope * 7, count: avg.length, enough: avg.length >= 10 && span >= 10 }
}

export type Verdict = 'on-track' | 'too-fast' | 'too-slow'

export interface Assessment {
  verdict: Verdict
  /** Suggested calorie change: +200, -200 or 0 */
  kcalChange: number
  message: string
}

/**
 * Bulk: aim for +0.2 to +0.5 kg/week.
 * Cut: aim to lose 0.5–1.0% of bodyweight per week.
 */
export function assess(rate: number, phase: Phase, bodyweight: number): Assessment {
  const r = rate.toFixed(2)
  if (phase === 'bulk') {
    if (rate > 0.5) return { verdict: 'too-fast', kcalChange: -200, message: `Gaining ${r} kg/week. Faster than 0.5 kg/week is likely extra fat.` }
    if (rate < 0.2) return { verdict: 'too-slow', kcalChange: 200, message: `Gaining ${r} kg/week. Under 0.2 kg/week: eat more.` }
    return { verdict: 'on-track', kcalChange: 0, message: `Gaining ${r} kg/week. Right in the 0.2–0.5 kg/week zone.` }
  }
  const lossPct = (-rate / bodyweight) * 100
  const pct = lossPct.toFixed(1)
  if (lossPct > 1) return { verdict: 'too-fast', kcalChange: 200, message: `Losing ${pct}% of bodyweight a week. Over 1% risks muscle; eat a bit more.` }
  if (rate >= 0) return { verdict: 'too-slow', kcalChange: -200, message: `Not losing weight (${rate >= 0 ? '+' : ''}${r} kg/week). Cut a little more.` }
  if (lossPct < 0.5) return { verdict: 'too-slow', kcalChange: -200, message: `Losing ${pct}% of bodyweight a week. Under 0.5%: cut a little more.` }
  return { verdict: 'on-track', kcalChange: 0, message: `Losing ${pct}% of bodyweight a week. Right in the 0.5–1% zone.` }
}

/** Suggestions come at most every 14 days, counted from the last change (or the first weigh-in). */
export function reviewDue(lastReview: string | undefined, firstWeighIn: string | undefined, today: string): boolean {
  const since = lastReview ? lastReview.slice(0, 10) : firstWeighIn
  if (!since) return false
  return (t(today) - t(since)) / DAY >= 14
}
