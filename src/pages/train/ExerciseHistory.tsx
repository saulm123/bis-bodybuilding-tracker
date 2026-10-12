import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import LineChart, { dayMs, shortDate } from '../../components/LineChart'
import { formatDate } from '../../lib/dates'
import { e1rm, formatSets } from '../../training/logic'
import { exerciseHistory, useProgram } from '../../training/store'
import { useUnits } from '../../lib/units'
import DemoButton from '../../components/DemoButton'

export default function ExerciseHistory() {
  const { exerciseId = '' } = useParams()
  const program = useProgram()
  const u = useUnits()
  const template = program?.days.flatMap((d) => d.exercises).find((e) => e.id === exerciseId)
  const sets = useLiveQuery(() => exerciseHistory(exerciseId, template?.name), [exerciseId, template?.name])
  if (!sets || !program) return null

  const name = template?.name ?? sets[0]?.exerciseName ?? 'Exercise'
  const bySession = new Map<string, typeof sets>()
  for (const s of sets.filter((s) => s.done)) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])
  const sessions = [...bySession.values()]
    .map((ss) => {
      const ordered = ss.sort((a, b) => a.setIndex - b.setIndex)
      const best = Math.max(...ordered.map((s) => e1rm(s.weight, s.reps)))
      return { date: ordered[0].date, sets: ordered, best }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{name}</h1>
        <button className="btn btn-small" onClick={() => history.back()}>Back</button>
      </div>
      <DemoButton exercise={{ id: exerciseId, name }} label="Watch how to do it" />
      {sessions.length === 0 ? (
        <p className="muted">No completed sets yet. <Link to="/train">Go train</Link></p>
      ) : (
        <>
          <div className="card">
            <h2>Estimated 1-rep max ({u.w})</h2>
            <LineChart
              series={[{ points: [...sessions].reverse().map((s) => ({ x: dayMs(s.date), y: u.fromKg(s.best) })), colour: 'var(--accent)', dots: true }]}
              formatX={shortDate}
              formatY={(y) => `${Math.round(y)}`}
            />
            <p className="muted small">Best set each session, converted with the Epley formula. Useful for spotting trends, not a real max.</p>
          </div>
          <ul className="list card">
            {sessions.map((s) => (
              <li key={s.date + s.sets[0].sessionId} className="list-row">
                <span>{formatSets(s.sets, u.fromKg)}</span>
                <span className="muted small">{formatDate(s.date)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
