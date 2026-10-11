import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, type ExerciseTemplate, type Session, type SetEntry } from '../../db/schema'
import MiniStepper from '../../components/MiniStepper'
import { formatDate } from '../../lib/dates'
import { formatRest, formatSets, hitTopOfRange, lastPerformance } from '../../training/logic'
import { addSet, deleteSession, exerciseHistory, finishSession, removeSet, updateSet, useProgram } from '../../training/store'
import { startRest } from '../../training/restTimer'

export default function Workout() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const program = useProgram()
  const session = useLiveQuery(() => db.sessions.get(id), [id])
  const sets = useLiveQuery(() => db.sets.where('sessionId').equals(id).toArray(), [id])
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (session === undefined || !sets || !program) return null
  if (!session) return <p className="muted">That workout no longer exists. <Link to="/train">Back to Train</Link></p>

  const day = program.days.find((d) => d.id === session.dayId)
  // Exercises from the split, plus any whose sets exist but were removed from the split since.
  const templates: ExerciseTemplate[] = [...(day?.exercises ?? [])]
  for (const s of sets) {
    if (!templates.some((t) => t.id === s.exerciseId)) {
      templates.push({ id: s.exerciseId, name: s.exerciseName, sets: 0, repMin: 0, repMax: 0, restSec: 90, increment: 0 })
    }
  }
  const doneCount = sets.filter((s) => s.done).length

  const finish = async () => {
    await finishSession(session.id)
    navigate('/train')
  }

  return (
    <section className="stack workout">
      <div className="row-between">
        <div>
          <h1>{session.dayName}</h1>
          <span className="muted small">
            {formatDate(session.date)}
            {session.deload ? ' · deload' : ''} · {doneCount}/{sets.length} sets
          </span>
        </div>
        <Link to="/train" className="btn btn-small">Back</Link>
      </div>

      {templates.map((t) => (
        <ExerciseCard key={t.id} session={session} template={t} sets={sets.filter((s) => s.exerciseId === t.id)} />
      ))}

      {!session.finishedAt ? (
        <button className="btn btn-primary btn-block" onClick={finish}>Finish workout</button>
      ) : (
        <p className="muted small">Finished. You can still correct numbers above.</p>
      )}

      {!confirmDelete ? (
        <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(true)}>Delete this workout</button>
      ) : (
        <div className="confirm stack">
          <p>Delete this workout and all its sets? This can't be undone.</p>
          <button className="btn btn-danger btn-block" onClick={async () => { await deleteSession(session.id); navigate('/train') }}>
            Delete workout
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(false)}>Keep it</button>
        </div>
      )}
    </section>
  )
}

function ExerciseCard({ session, template: t, sets }: { session: Session; template: ExerciseTemplate; sets: SetEntry[] }) {
  const history = useLiveQuery(() => exerciseHistory(t.id), [t.id])
  const last = history ? lastPerformance(history, session.id) : undefined
  const ordered = [...sets].sort((a, b) => a.setIndex - b.setIndex)
  const allDone = ordered.length > 0 && ordered.every((s) => s.done)
  const hasRange = t.repMax > 0
  const lastHitTop = hasRange && last && hitTopOfRange(t, last.sets) && t.increment > 0
  const nowHitTop = hasRange && allDone && hitTopOfRange(t, ordered)
  const weightStep = t.increment > 0 ? Math.min(t.increment, 2.5) : 1

  const toggle = async (s: SetEntry) => {
    await updateSet(s.id, { done: !s.done })
    // Supersets: only rest after the last exercise in the pair (rest 0 on the first).
    if (!s.done) startRest(t.restSec, t.name)
  }

  return (
    <div className={`card stack ex-card ${allDone ? 'ex-done' : ''}`}>
      <div className="row-between">
        <div>
          <Link to={`/train/exercise/${t.id}`} className="ex-name">{t.name}</Link>
          {hasRange && (
            <div className="muted small">
              {t.sets} × {t.repMin === t.repMax ? t.repMin : `${t.repMin}–${t.repMax}`}
              {t.restSec > 0 ? ` · rest ${formatRest(t.restSec)}` : ''}
              {t.superset ? ` · superset ${t.superset}` : ''}
            </div>
          )}
        </div>
      </div>

      {last && (
        <div className="last small">
          <span className="muted">Last ({formatDate(last.date)}):</span> {formatSets(last.sets)}
        </div>
      )}
      {lastHitTop && !session.deload && <div className="badge-up">↑ Hit the top last time: weight increased</div>}

      <div className="set-head small muted">
        <span>Set</span><span>kg</span><span>Reps</span><span />
      </div>
      {ordered.map((s, i) => (
        <div key={s.id} className={`set-row ${s.done ? 'set-done' : ''}`}>
          <span className="set-num">{i + 1}</span>
          <MiniStepper label={`Set ${i + 1} weight`} value={s.weight} step={weightStep} max={500} onChange={(weight) => updateSet(s.id, { weight })} />
          <MiniStepper label={`Set ${i + 1} reps`} value={s.reps} step={1} max={100} decimals={0} onChange={(reps) => updateSet(s.id, { reps })} />
          <button className="check" aria-label={s.done ? `Undo set ${i + 1}` : `Done set ${i + 1}`} aria-pressed={s.done} onClick={() => toggle(s)}>
            ✓
          </button>
        </div>
      ))}

      {nowHitTop && <div className="badge-up">Top of the range on every set. Add weight next time.</div>}

      <div className="row-actions">
        <button className="btn btn-small" onClick={() => addSet(session, t.id, t.name)}>+ Set</button>
        {ordered.length > 0 && (
          <button className="btn btn-small btn-ghost" onClick={() => removeSet(ordered[ordered.length - 1].id)}>Remove last set</button>
        )}
      </div>
    </div>
  )
}
