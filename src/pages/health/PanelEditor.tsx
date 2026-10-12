import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, newId, nowIso, type BloodPanel } from '../../db/schema'
import { isoDate } from '../../lib/dates'
import { MARKERS } from '../../health/markers'

const LABELS = import.meta.env.VITE_FLAVOR !== 'play' ? ['Baseline', 'Mid-cycle', 'After', 'Routine'] : ['Baseline', 'Routine', 'Follow-up']

export default function PanelEditor() {
  const { panelId } = useParams()
  const navigate = useNavigate()
  const existing = useLiveQuery(() => (panelId ? db.bloodPanels.get(panelId) : undefined), [panelId])
  const [date, setDate] = useState(isoDate())
  const [label, setLabel] = useState('Routine')
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!existing) return
    setDate(existing.date)
    setLabel(existing.label)
    setNotes(existing.notes ?? '')
    setValues(Object.fromEntries(Object.entries(existing.values).map(([k, v]) => [k, String(v)])))
  }, [existing])

  const save = async () => {
    const parsed: Record<string, number> = {}
    for (const [k, v] of Object.entries(values)) {
      const n = parseFloat(v.replace(',', '.'))
      if (Number.isFinite(n)) parsed[k] = n
    }
    const now = nowIso()
    const panel: BloodPanel = { id: existing?.id ?? newId(), date, label, values: parsed, notes: notes || undefined, createdAt: existing?.createdAt ?? now, updatedAt: now }
    await db.bloodPanels.put(panel)
    navigate('/health/bloods')
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{existing ? 'Edit results' : 'New results'}</h1>
        <button className="btn btn-small" onClick={() => navigate('/health/bloods')}>Cancel</button>
      </div>
      <div className="card stack">
        <label className="field">
          <span>Date of the test</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="chips">
          {LABELS.map((l) => (
            <button key={l} className={`chip ${label === l ? 'chip-done' : ''}`} onClick={() => setLabel(l)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <p className="muted small">Fill in what's on your report. Leave the rest blank.</p>
        {MARKERS.map((m) => (
          <label key={m.key} className="marker-input">
            <span>{m.name}</span>
            <input inputMode="decimal" value={values[m.key] ?? ''} onChange={(e) => setValues({ ...values, [m.key]: e.target.value })} placeholder="–" />
            <small className="muted">{m.unit}</small>
          </label>
        ))}
        <label className="field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <button className="btn btn-primary btn-block" onClick={save}>Save results</button>
      {existing &&
        (!confirmDelete ? (
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(true)}>Delete these results</button>
        ) : (
          <button className="btn btn-danger btn-block" onClick={async () => { await db.bloodPanels.delete(existing.id); navigate('/health/bloods') }}>
            Tap again to delete
          </button>
        ))}
    </section>
  )
}
