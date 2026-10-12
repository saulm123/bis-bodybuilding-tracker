import { useSearchParams } from 'react-router-dom'
import { isoDate } from '../../lib/dates'

/** The day being logged, from ?date=YYYY-MM-DD (defaults to today). */
export function useDateParam(): [string, (d: string) => void] {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? isoDate()
  return [date, (d) => setParams(d === isoDate() ? {} : { date: d }, { replace: true })]
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

export function dayLabel(iso: string): string {
  const today = isoDate()
  if (iso === today) return 'Today'
  if (iso === shiftDate(today, -1)) return 'Yesterday'
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
