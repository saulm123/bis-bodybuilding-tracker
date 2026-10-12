import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/schema'
import { isoDate } from '../lib/dates'
import { supplementStreak } from '../health/schedule'
import { ensureSupplements, toggleSupplement } from '../health/store'

/** Today's supplement checklist. One tap per supplement. */
export default function SupplementsCard() {
  const today = isoDate()
  useEffect(() => {
    ensureSupplements()
  }, [])
  const supplements = useLiveQuery(() => db.supplements.orderBy('order').filter((s) => s.active).toArray(), [])
  const logs = useLiveQuery(() => db.supplementLog.where('date').aboveOrEqual(isoDate(new Date(Date.now() - 400 * 86_400_000))).toArray(), [])
  if (!supplements || !logs) return null

  const byDate = new Map<string, Set<string>>()
  for (const l of logs) byDate.set(l.date, (byDate.get(l.date) ?? new Set()).add(l.supplementId))
  const taken = byDate.get(today) ?? new Set()
  const streak = supplementStreak(byDate, supplements.map((s) => s.id), today)
  const doneCount = supplements.filter((s) => taken.has(s.id)).length

  return (
    <div className="card stack">
      <div className="row-between">
        <h2>Supplements</h2>
        <span className="muted small">
          {doneCount}/{supplements.length}
          {streak > 1 ? ` · ${streak}-day streak` : ''}
        </span>
      </div>
      {(['AM', 'PM'] as const).map((timing) => {
        const list = supplements.filter((s) => s.timing === timing)
        if (!list.length) return null
        return (
          <div key={timing} className="stack-tight">
            <span className="muted small">{timing === 'AM' ? 'Morning' : 'Evening'}</span>
            <div className="chips">
              {list.map((s) => (
                <button key={s.id} className={`chip ${taken.has(s.id) ? 'chip-done' : ''}`} aria-pressed={taken.has(s.id)} onClick={() => toggleSupplement(s.id, today)}>
                  {taken.has(s.id) ? '✓ ' : ''}
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <Link to="/health/supplements" className="muted small">Edit list</Link>
    </div>
  )
}
