import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Settings } from '../db/schema'
import { isoDate } from '../lib/dates'
import { assess, movingAverage, reviewDue, weeklyRate, type Assessment, type Rate } from './trend'

export interface TrendInfo {
  latest?: { date: string; kg: number }
  average?: number
  rate?: Rate
  assessment?: Assessment
  /** A ±200 kcal suggestion is ready to show. */
  suggest: boolean
}

export function useTrend(settings: Settings | undefined): TrendInfo | undefined {
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [])
  if (!weights || !settings) return undefined
  const today = isoDate()
  const latest = weights.at(-1)
  const avg = movingAverage(weights).at(-1)?.kg
  const rate = weeklyRate(weights, today)
  const assessment = rate?.enough && avg ? assess(rate.perWeek, settings.phase, avg) : undefined
  const suggest = !!assessment && assessment.kcalChange !== 0 && reviewDue(settings.lastCalorieReviewAt, weights[0]?.date, today)
  return { latest, average: avg, rate, assessment, suggest }
}
