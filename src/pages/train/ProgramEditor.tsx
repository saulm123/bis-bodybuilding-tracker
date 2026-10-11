import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { DayKind, DayTemplate, ExerciseTemplate } from '../../db/schema'
import { newId } from '../../db/schema'
import Segmented from '../../components/Segmented'
import Stepper from '../../components/Stepper'
import { WEEKDAYS } from '../../training/logic'
import { resetProgram, updateDay, useProgram } from '../../training/store'

export function ProgramEditor() {
  const program = useProgram()
  const [confirmReset, setConfirmReset] = useState(false)
  if (!program) return null

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Your split</h1>
        <Link to="/train" className="btn btn-small">Done</Link>
      </div>
      <p className="muted small">Changes apply to your next workout. Past workouts keep what you actually did.</p>
      <ul className="list card">
        {[...program.days].sort((a, b) => a.weekday - b.weekday).map((d) => (
          <li key={d.id}>
            <Link to={`/train/program/${d.id}`} className="list-row">
              <span><strong>{WEEKDAYS[d.weekday - 1]}</strong> · {d.name}</span>
              <span className="muted small">{d.kind === 'lift' ? `${d.exercises.length} exercises` : d.kind}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!confirmReset ? (
        <button className="btn btn-ghost btn-block" onClick={() => setConfirmReset(true)}>Reset split to the default</button>
      ) : (
        <div className="confirm stack">
          <p>Replace your split with the built-in 5-day split? Your workout history is kept.</p>
          <button className="btn btn-danger btn-block" onClick={async () => { await resetProgram(); setConfirmReset(false) }}>Reset split</button>
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      )}
    </section>
  )
}

export function DayEditor() {
  const { dayId } = useParams()
  const program = useProgram()
  const [open, setOpen] = useState<string | null>(null)
  const day = program?.days.find((d) => d.id === dayId)
  if (!program) return null
  if (!day) return <p className="muted">Day not found. <Link to="/train/program">Back</Link></p>

  const save = (patch: Partial<DayTemplate>) => updateDay({ ...day, ...patch })
  const setExercises = (exercises: ExerciseTemplate[]) => save({ exercises })
  const updateEx = (ex: ExerciseTemplate) => setExercises(day.exercises.map((e) => (e.id === ex.id ? ex : e)))
  const move = (i: number, dir: -1 | 1) => {
    const list = [...day.exercises]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    setExercises(list)
  }
  const add = () => {
    const ex: ExerciseTemplate = { id: newId(), name: 'New exercise', sets: 3, repMin: 8, repMax: 12, restSec: 90, increment: 1 }
    setExercises([...day.exercises, ex])
    setOpen(ex.id)
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{WEEKDAYS[day.weekday - 1]}</h1>
        <Link to="/train/program" className="btn btn-small">Done</Link>
      </div>
      <div className="card stack">
        <label className="field">
          <span>Name</span>
          <input value={day.name} onChange={(e) => save({ name: e.target.value })} />
        </label>
        <Segmented<DayKind>
          label="Day type"
          value={day.kind}
          onChange={(kind) => save({ kind })}
          options={[
            { value: 'lift', label: 'Lifting' },
            { value: 'cardio', label: 'Cardio' },
            { value: 'rest', label: 'Rest' },
          ]}
        />
      </div>

      {day.kind === 'lift' && (
        <>
          {day.exercises.map((ex, i) => (
            <div key={ex.id} className="card stack">
              <button className="row-between plain" onClick={() => setOpen(open === ex.id ? null : ex.id)} aria-expanded={open === ex.id}>
                <strong>{i + 1}. {ex.name}</strong>
                <span className="muted small">{ex.sets}×{ex.repMin}–{ex.repMax}</span>
              </button>
              {open === ex.id && (
                <div className="stack">
                  <label className="field">
                    <span>Exercise</span>
                    <input value={ex.name} onChange={(e) => updateEx({ ...ex, name: e.target.value })} />
                  </label>
                  <Stepper label="Sets" value={ex.sets} min={1} max={10} onChange={(sets) => updateEx({ ...ex, sets })} />
                  <Stepper label="Reps, bottom of range" value={ex.repMin} min={1} max={50} onChange={(repMin) => updateEx({ ...ex, repMin, repMax: Math.max(repMin, ex.repMax) })} />
                  <Stepper label="Reps, top of range" value={ex.repMax} min={1} max={50} onChange={(repMax) => updateEx({ ...ex, repMax, repMin: Math.min(repMax, ex.repMin) })} />
                  <Stepper label="Rest after each set" value={ex.restSec} step={15} max={600} suffix="sec" onChange={(restSec) => updateEx({ ...ex, restSec })} />
                  <Stepper label="Weight to add when you hit the top" value={ex.increment} step={0.5} decimals={1} max={20} suffix="kg" onChange={(increment) => updateEx({ ...ex, increment })} />
                  <label className="field">
                    <span>Superset letter (same letter = done back to back)</span>
                    <input value={ex.superset ?? ''} maxLength={2} onChange={(e) => updateEx({ ...ex, superset: e.target.value.toUpperCase() || undefined })} />
                  </label>
                  <div className="row-actions">
                    <button className="btn btn-small" onClick={() => move(i, -1)} disabled={i === 0}>Move up</button>
                    <button className="btn btn-small" onClick={() => move(i, 1)} disabled={i === day.exercises.length - 1}>Move down</button>
                    <button className="btn btn-small btn-danger" onClick={() => setExercises(day.exercises.filter((e) => e.id !== ex.id))}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-block" onClick={add}>+ Add exercise</button>
        </>
      )}
    </section>
  )
}
