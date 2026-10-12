import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WEEKDAYS } from '../../training/logic'
import { PLANS } from '../../training/templates'
import { applyPlan, useProgram } from '../../training/store'
import { useUnits } from '../../lib/units'
import DemoButton from '../../components/DemoButton'

export default function PlanPicker() {
  const program = useProgram()
  const { units } = useUnits()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  if (!program) return null

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Training plans</h1>
        <Link to="/train/program" className="btn btn-small">Back</Link>
      </div>
      <p className="muted small">Switching replaces your current plan. Your workout history and "last time" numbers carry over for the same exercises.</p>
      {PLANS.map((p) => (
        <div key={p.id} className={`card stack ${program.templateId === p.id ? 'card-current' : ''}`}>
          <button className="plain stack-tight" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
            <span className="row-between">
              <strong>{p.name}</strong>
              {program.templateId === p.id && <span className="badge">Current</span>}
            </span>
            <span className="muted small">{p.daysPerWeek} days · {p.level} · {p.equipment === 'Dumbbells' ? 'dumbbells only' : 'gym'}</span>
            <span className="small">{p.description}</span>
          </button>
          {open === p.id && (
            <ul className="list small">
              {p.days().filter((d) => d.kind === 'lift').map((d) => (
                <li key={d.id} className="plan-day">
                  <strong>{WEEKDAYS[d.weekday - 1]} · {d.name}</strong>
                  <div className="chips">
                    {d.exercises.map((e) => <DemoButton key={e.id} exercise={e} label={`${e.name} ${e.sets}×${e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}`} />)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {confirm === p.id ? (
            <div className="stack">
              <p className="small">Replace your current plan (including any edits) with {p.name}?</p>
              <button className="btn btn-primary btn-block" onClick={async () => { await applyPlan(p.id, units); navigate('/train') }}>Yes, switch</button>
              <button className="btn btn-ghost btn-block" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          ) : (
            program.templateId !== p.id && <button className="btn btn-block" onClick={() => setConfirm(p.id)}>Use this plan</button>
          )}
        </div>
      ))}
    </section>
  )
}
