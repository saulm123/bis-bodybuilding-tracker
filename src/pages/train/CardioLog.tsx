import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import Segmented from '../../components/Segmented'
import Stepper from '../../components/Stepper'
import { formatDate, isoDate } from '../../lib/dates'
import { saveCardio } from '../../training/store'

const TYPES = ['Incline walk', 'Bike', 'Run', 'Other'] as const

export default function CardioLog() {
  const [type, setType] = useState<string>('Incline walk')
  const [minutes, setMinutes] = useState(25)
  const [incline, setIncline] = useState(10)
  const [speed, setSpeed] = useState(5)
  const [hr, setHr] = useState(0)
  const [saved, setSaved] = useState(false)
  const entries = useLiveQuery(() => db.cardio.orderBy('date').reverse().limit(20).toArray(), [])

  const save = async () => {
    await saveCardio({
      date: isoDate(),
      type,
      minutes,
      inclinePct: type === 'Incline walk' ? incline : undefined,
      speedKph: type === 'Bike' ? undefined : speed || undefined,
      avgHr: hr || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Cardio</h1>
        <Link to="/train" className="btn btn-small">Back</Link>
      </div>
      <div className="card stack">
        <Segmented label="Type" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: t.replace('Incline ', '') }))} />
        <Stepper label="Minutes" value={minutes} step={5} min={1} max={300} suffix="min" onChange={setMinutes} />
        {type === 'Incline walk' && <Stepper label="Incline" value={incline} step={1} max={30} suffix="%" onChange={setIncline} />}
        {type !== 'Bike' && <Stepper label="Speed" value={speed} step={0.5} decimals={1} max={30} suffix="km/h" onChange={setSpeed} />}
        <Stepper label="Average heart rate (0 = skip)" value={hr} step={5} max={220} suffix="bpm" onChange={setHr} />
        <button className="btn btn-primary btn-block" onClick={save}>Save cardio</button>
        {saved && <p className="ok">Saved.</p>}
      </div>
      {!!entries?.length && (
        <ul className="list card">
          {entries.map((c) => (
            <li key={c.id} className="list-row">
              <span>
                {c.type} · {c.minutes} min{c.inclinePct ? ` · ${c.inclinePct}%` : ''}{c.speedKph ? ` · ${c.speedKph} km/h` : ''}{c.avgHr ? ` · ${c.avgHr} bpm` : ''}
              </span>
              <span className="row-actions">
                <span className="muted small">{formatDate(c.date)}</span>
                <button className="btn btn-small btn-ghost" aria-label="Delete entry" onClick={() => db.cardio.delete(c.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
