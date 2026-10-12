import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { useSettings } from '../../db/settings'
import SupplementsCard from '../../components/SupplementsCard'
import { formatDate, isoDate } from '../../lib/dates'
import { bloodsDue, bpLevel, dosesFor, weeklyBp } from '../../health/schedule'
import { currentCycle } from '../../health/store'
import { useTrend } from '../../weight/useTrend'

const HAS_CYCLE = import.meta.env.VITE_FLAVOR !== 'play'

export default function HealthHome() {
  const settings = useSettings()
  const trend = useTrend(settings)
  const today = isoDate()
  const bp = useLiveQuery(() => db.bp.orderBy('date').reverse().limit(60).toArray(), [])
  const panels = useLiveQuery(() => db.bloodPanels.toArray(), [])
  const cycle = useLiveQuery(() => (HAS_CYCLE ? currentCycle() : undefined), [])
  const injections = useLiveQuery(() => (cycle ? db.injections.where('cycleId').equals(cycle.id).toArray() : []), [cycle?.id])
  if (!settings || !bp || !panels || !injections) return null

  const week = weeklyBp(bp)[0]
  const latestBp = bp[0]
  const due = bloodsDue(panels, HAS_CYCLE ? cycle : undefined, today, settings.bloodsIntervalWeeks ?? 12).filter((d) => d.status !== 'done')
  const nextDue = due[0]
  const dosesToday = HAS_CYCLE && cycle ? dosesFor(cycle, today, injections) : []

  return (
    <section className="stack">
      <h1>Health</h1>

      <SupplementsCard />

      <Link to="/weight" className="card card-tile">
        <div>
          <span className="muted small">Weight</span>
          <strong>{trend?.average ? `${trend.average.toFixed(1)} kg` : 'Log your weight'}</strong>
        </div>
        <span className="muted small">{trend?.rate ? `${trend.rate.perWeek >= 0 ? '+' : ''}${trend.rate.perWeek.toFixed(2)} kg/wk` : '7-day avg'}</span>
      </Link>

      <Link to="/health/bp" className="card card-tile">
        <div>
          <span className="muted small">Blood pressure & resting HR</span>
          <strong>{latestBp ? `${latestBp.systolic}/${latestBp.diastolic}${latestBp.pulse ? ` · ${latestBp.pulse} bpm` : ''}` : 'Log a reading'}</strong>
        </div>
        {week && (
          <span className={`small level-${bpLevel(week.systolic, week.diastolic, settings.bpAlert)}`}>
            Week avg {week.systolic}/{week.diastolic}
          </span>
        )}
      </Link>

      <Link to="/health/bloods" className="card card-tile">
        <div>
          <span className="muted small">Bloods</span>
          <strong>{panels.length ? `${panels.length} test${panels.length > 1 ? 's' : ''} logged` : 'Add your first results'}</strong>
        </div>
        {nextDue && <span className={`small status-${nextDue.status}`}>{nextDue.status === 'upcoming' ? `Next: ${formatDate(nextDue.date)}` : `${nextDue.label.split(' (')[0]} ${nextDue.status}`}</span>}
      </Link>

      {HAS_CYCLE && (
        <Link to="/health/cycle" className="card card-tile">
          <div>
            <span className="muted small">Cycle log</span>
            <strong>{cycle ? cycle.name : 'Set up a cycle'}</strong>
          </div>
          {dosesToday.length > 0 && (
            <span className={`small ${dosesToday.every((d) => d.logged) ? 'ok' : 'status-due'}`}>
              {dosesToday.every((d) => d.logged) ? 'Today done' : 'Injection due today'}
            </span>
          )}
        </Link>
      )}
    </section>
  )
}
