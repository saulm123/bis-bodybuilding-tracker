// FOSS build only. This file is never imported in the Play build.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, newId, nowIso, type Compound, type Cycle } from '../../db/schema'
import Stepper from '../../components/Stepper'
import { formatDate, isoDate } from '../../lib/dates'
import { WEEKDAYS } from '../../training/logic'
import { dosesFor, nextSite, SITES } from '../../health/schedule'
import { currentCycle, saveCycle } from '../../health/store'

export default function CyclePage() {
  const cycle = useLiveQuery(() => currentCycle().then((c) => c ?? null), [])
  const [editing, setEditing] = useState<Cycle | 'new' | null>(null)
  if (cycle === undefined) return null

  if (editing || !cycle) {
    return <CycleEditor initial={editing === 'new' || !cycle ? undefined : (editing ?? undefined)} onDone={() => setEditing(null)} canCancel={!!cycle} />
  }
  return <CycleView cycle={cycle} onEdit={() => setEditing(cycle)} onNew={() => setEditing('new')} />
}

function CycleView({ cycle, onEdit, onNew }: { cycle: Cycle; onEdit: () => void; onNew: () => void }) {
  const today = isoDate()
  const injections = useLiveQuery(() => db.injections.where('cycleId').equals(cycle.id).reverse().sortBy('date'), [cycle.id])
  const [site, setSite] = useState<string | null>(null)
  if (!injections) return null

  const doses = dosesFor(cycle, today, injections)
  const suggested = site ?? nextSite(injections)
  const week = Math.floor((Date.now() - new Date(`${cycle.startDate}T00:00:00`).getTime()) / (7 * 86_400_000)) + 1

  const log = async (c: Compound, mg: number) => {
    const now = nowIso()
    await db.injections.add({ id: newId(), date: today, cycleId: cycle.id, compoundId: c.id, compoundName: c.name, doseMg: mg, site: suggested, createdAt: now, updatedAt: now })
    setSite(null)
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{cycle.name}</h1>
        <Link to="/health" className="btn btn-small">Back</Link>
      </div>
      <p className="muted small">
        {formatDate(cycle.startDate)} → {cycle.endDate ? formatDate(cycle.endDate) : 'no end date'}
        {week > 0 && (!cycle.endDate || today <= cycle.endDate) ? ` · week ${week}` : ''}
      </p>

      <div className="card stack">
        <h2>Today</h2>
        {doses.length === 0 ? (
          <p className="muted small">Nothing scheduled today.</p>
        ) : (
          <>
            <label className="field">
              <span>Site</span>
              <select value={suggested} onChange={(e) => setSite(e.target.value)}>
                {SITES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            {doses.map((d) => (
              <div key={d.compound.id} className="row-between">
                <span>{d.compound.name} · {d.perShotMg} mg</span>
                {d.logged ? <span className="ok small">✓ Logged</span> : <button className="btn btn-small btn-primary" onClick={() => log(d.compound, d.perShotMg)}>Log</button>}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <h2>Schedule</h2>
        <ul className="list">
          {cycle.compounds.map((c) => (
            <li key={c.id} className="list-row">
              <span>{c.name}<br /><span className="muted small">{c.days.map((d) => WEEKDAYS[d - 1]).join(', ')}</span></span>
              <span>{c.doseMg} mg/wk</span>
            </li>
          ))}
        </ul>
      </div>

      {injections.length > 0 && (
        <div className="card">
          <h2>Log</h2>
          <ul className="list">
            {injections.slice(0, 30).map((i) => (
              <li key={i.id} className="list-row">
                <span>{i.compoundName} · {i.doseMg} mg<br /><span className="muted small">{i.site}</span></span>
                <span className="row-actions">
                  <span className="muted small">{formatDate(i.date)}</span>
                  <button className="btn btn-small btn-ghost" aria-label="Delete entry" onClick={() => db.injections.delete(i.id)}>✕</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="btn btn-block" onClick={onEdit}>Edit cycle</button>
      <button className="btn btn-ghost btn-block" onClick={onNew}>Start a new cycle</button>
    </section>
  )
}

function CycleEditor({ initial, onDone, canCancel }: { initial?: Cycle; onDone: () => void; canCancel: boolean }) {
  const [name, setName] = useState(initial?.name ?? 'Cycle')
  const [startDate, setStart] = useState(initial?.startDate ?? isoDate())
  const [endDate, setEnd] = useState(initial?.endDate ?? '')
  const [compounds, setCompounds] = useState<Compound[]>(initial?.compounds ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const update = (c: Compound) => setCompounds(compounds.map((x) => (x.id === c.id ? c : x)))
  const toggleDay = (c: Compound, d: number) => update({ ...c, days: c.days.includes(d) ? c.days.filter((x) => x !== d) : [...c.days, d].sort() })

  const save = async () => {
    await saveCycle({ id: initial?.id, createdAt: initial?.createdAt, name: name.trim() || 'Cycle', startDate, endDate: endDate || undefined, compounds: compounds.filter((c) => c.name.trim()), notes: notes || undefined })
    onDone()
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{initial ? 'Edit cycle' : 'New cycle'}</h1>
        {canCancel ? <button className="btn btn-small" onClick={onDone}>Cancel</button> : <Link to="/health" className="btn btn-small">Back</Link>}
      </div>
      <div className="card stack">
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Start date</span><input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="field"><span>End date (optional)</span><input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} /></label>
        <p className="muted small">Dates drive the before / mid / after bloods reminders.</p>
      </div>

      {compounds.map((c) => (
        <div key={c.id} className="card stack">
          <label className="field"><span>Compound</span><input value={c.name} onChange={(e) => update({ ...c, name: e.target.value })} /></label>
          <Stepper label="Total per week" value={c.doseMg} step={5} max={5000} suffix="mg" onChange={(doseMg) => update({ ...c, doseMg })} />
          <div className="stack-tight">
            <span className="muted small">Injection days (weekly total is split across them)</span>
            <div className="chips">
              {WEEKDAYS.map((w, i) => (
                <button key={w} className={`chip ${c.days.includes(i + 1) ? 'chip-done' : ''}`} onClick={() => toggleDay(c, i + 1)}>{w}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-small btn-danger" onClick={() => setCompounds(compounds.filter((x) => x.id !== c.id))}>Remove</button>
        </div>
      ))}
      <button className="btn btn-block" onClick={() => setCompounds([...compounds, { id: newId(), name: '', doseMg: 0, days: [1] }])}>+ Add compound</button>

      <label className="field card"><span>Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <button className="btn btn-primary btn-block" onClick={save}>Save cycle</button>
    </section>
  )
}
