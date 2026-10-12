import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/schema'
import { useSettings } from '../db/settings'
import MacroBars from '../components/MacroBars'
import BackupBanner from '../components/BackupBanner'
import SupplementsCard from '../components/SupplementsCard'
import CalorieSuggestion from '../components/CalorieSuggestion'
import { isoDate } from '../lib/dates'
import { entryTotals, sum, targetTotals } from '../nutrition/macros'
import { weekdayOf } from '../training/logic'
import { startSession, useProgram } from '../training/store'
import { useTrend } from '../weight/useTrend'

export default function Today() {
  const settings = useSettings()
  const program = useProgram()
  const trend = useTrend(settings)
  const navigate = useNavigate()
  const today = isoDate()
  const entries = useLiveQuery(() => db.foodLog.where('date').equals(today).toArray(), [today])
  const sessionToday = useLiveQuery(() => db.sessions.where('date').equals(today).first(), [today])
  const weighedToday = useLiveQuery(() => db.weights.where('date').equals(today).count(), [today])
  if (!settings || !entries || !program || !trend) return null

  const day = program.days.find((d) => d.weekday === weekdayOf(today))
  const inDeload = !!settings.deloadUntil && settings.deloadUntil >= today

  return (
    <section className="stack">
      <BackupBanner settings={settings} />
      <div className="row-between">
        <h1>Today</h1>
        <Link to="/more" className={`pill pill-${settings.phase}`}>{settings.phase === 'bulk' ? 'Bulking' : 'Cutting'}</Link>
      </div>

      <CalorieSuggestion settings={settings} trend={trend} />

      <Link to="/food" className="card plain-link">
        <MacroBars eaten={sum(entries.map(entryTotals))} target={targetTotals(settings.targets[settings.phase])} />
      </Link>
      <div className="action-grid">
        <button className="btn btn-primary" onClick={() => navigate('/food/add?scan=1')}>Scan food</button>
        <Link className="btn" to="/food/meals">Favourites</Link>
      </div>

      {day && (
        <div className="card row-between">
          <div>
            <span className="muted small">Training</span>
            <br />
            <strong>{day.name}</strong>
            {inDeload && <span className="muted small"> · deload</span>}
          </div>
          {sessionToday ? (
            <Link className="btn btn-small" to={`/train/session/${sessionToday.id}`}>{sessionToday.finishedAt ? 'View' : 'Continue'}</Link>
          ) : day.kind === 'lift' ? (
            <button className="btn btn-small btn-primary" onClick={async () => navigate(`/train/session/${await startSession(day, inDeload)}`)}>Start</button>
          ) : day.kind === 'cardio' ? (
            <Link className="btn btn-small" to="/train/cardio">Log cardio</Link>
          ) : (
            <span className="muted small">Rest day</span>
          )}
        </div>
      )}

      <Link to="/weight" className="card card-tile">
        <div>
          <span className="muted small">Weight · 7-day average</span>
          <strong>{trend.average ? `${trend.average.toFixed(1)} kg` : '–'}</strong>
        </div>
        <span className={weighedToday ? 'ok small' : 'btn btn-small'}>{weighedToday ? '✓ Weighed in' : 'Weigh in'}</span>
      </Link>

      <SupplementsCard />
    </section>
  )
}
