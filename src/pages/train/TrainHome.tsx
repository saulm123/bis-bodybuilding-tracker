import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db, type DayTemplate } from '../../db/schema'
import { useSettings } from '../../db/settings'
import { isoDate, formatDate } from '../../lib/dates'
import { deloadStatus, WEEKDAYS, weekdayOf } from '../../training/logic'
import { startDeloadWeek, startSession, useProgram } from '../../training/store'
import { musclesWorked } from '../../training/records'
import MuscleChips from '../../components/MuscleChips'
import DemoButton from '../../components/DemoButton'

export default function TrainHome() {
  const program = useProgram()
  const settings = useSettings()
  const navigate = useNavigate()
  const today = isoDate()
  const open = useLiveQuery(() => db.sessions.filter((s) => !s.finishedAt).first(), [])
  const recent = useLiveQuery(() => db.sessions.orderBy('date').reverse().filter((s) => !!s.finishedAt).limit(8).toArray(), [])
  const recentCardio = useLiveQuery(() => db.cardio.orderBy('date').reverse().limit(3).toArray(), [])
  // This week = Monday to today
  const monday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return isoDate(d)
  })()
  const week = useLiveQuery(async () => {
    const sessions = await db.sessions.where('date').aboveOrEqual(monday).filter((s) => !!s.finishedAt).count()
    const sets = await db.sets.where('date').aboveOrEqual(monday).toArray()
    return { sessions, muscles: musclesWorked(sets) }
  }, [monday])

  if (!program || !settings) return null
  const todayDay = program.days.find((d) => d.weekday === weekdayOf(today))
  const inDeload = !!settings.deloadUntil && settings.deloadUntil >= today
  const deload = inDeload ? undefined : deloadStatus(settings.lastDeloadDate)

  const start = async (day: DayTemplate) => {
    const id = await startSession(day, inDeload)
    navigate(`/train/session/${id}`)
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Train</h1>
        <Link to="/train/program" className="btn btn-small">Plan</Link>
      </div>

      {inDeload && <div className="banner">Deload week until {formatDate(settings.deloadUntil!)}: half the sets, same weights.</div>}
      {deload && deload.level !== 'ok' && (
        <div className="banner">
          <span>
            {deload.weeks} weeks since your last deload.{deload.level === 'overdue' ? ' Time to take one.' : ' Consider a deload soon.'}
          </span>
          <button className="btn btn-small" onClick={() => startDeloadWeek()}>Start deload</button>
        </div>
      )}

      {open && (
        <Link to={`/train/session/${open.id}`} className="card card-link">
          <span className="muted small">Workout in progress</span>
          <strong>Continue {open.dayName}</strong>
        </Link>
      )}

      {week && (
        <div className="card stack">
          <div className="row-between">
            <h2>This week</h2>
            <span className="small"><strong>{week.sessions}</strong><span className="muted"> / {program.days.filter((d) => d.kind === 'lift').length} workouts</span></span>
          </div>
          <MuscleChips counts={week.muscles} />
          <Link to="/badges" className="muted small">🏅 Badges and records</Link>
        </div>
      )}

      {todayDay && !open && (
        <div className="card stack">
          <span className="muted small">Today · {WEEKDAYS[todayDay.weekday - 1]}</span>
          <h2>{todayDay.name}</h2>
          {todayDay.kind === 'lift' && (
            <>
              <div className="chips">
                {todayDay.exercises.map((e) => <DemoButton key={e.id} exercise={e} label={e.name} />)}
              </div>
              <button className="btn btn-primary btn-block" onClick={() => start(todayDay)}>Start workout</button>
            </>
          )}
          {todayDay.kind === 'cardio' && (
            <Link to="/train/cardio" className="btn btn-primary btn-block">Log cardio</Link>
          )}
          {todayDay.kind === 'rest' && <p className="muted">Rest day. Eat, sleep, grow.</p>}
        </div>
      )}

      <div className="card stack">
        <h2>Start another day</h2>
        <div className="day-grid">
          {program.days
            .filter((d) => d.kind === 'lift')
            .map((d) => (
              <button key={d.id} className="btn" onClick={() => start(d)} disabled={!!open}>
                {WEEKDAYS[d.weekday - 1]} · {d.name}
              </button>
            ))}
        </div>
        <Link to="/train/cardio" className="btn btn-block">Log cardio</Link>
        <Link to="/train/library" className="btn btn-block">▶ Exercise videos</Link>
      </div>

      {!!recent?.length && (
        <div className="card">
          <h2>Recent workouts</h2>
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id}>
                <Link to={`/train/session/${s.id}`} className="list-row">
                  <span>{s.dayName}{s.deload ? ' (deload)' : ''}</span>
                  <span className="muted small">{formatDate(s.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!recentCardio?.length && (
        <div className="card">
          <h2>Recent cardio</h2>
          <ul className="list">
            {recentCardio.map((c) => (
              <li key={c.id} className="list-row">
                <span>{c.type} · {c.minutes} min{c.inclinePct ? ` · ${c.inclinePct}%` : ''}</span>
                <span className="muted small">{formatDate(c.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
