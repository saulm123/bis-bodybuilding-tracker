import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { useSettings } from '../../db/settings'
import Stepper from '../../components/Stepper'
import LineChart, { dayMs, shortDate } from '../../components/LineChart'
import { formatDate, isoDate } from '../../lib/dates'
import { bpLevel, weeklyBp } from '../../health/schedule'
import { saveBp } from '../../health/store'

const LEVEL_TEXT = { normal: 'Normal', elevated: 'Elevated', high: 'High' }

export default function BpPage() {
  const settings = useSettings()
  const readings = useLiveQuery(() => db.bp.orderBy('date').toArray(), [])
  const [sys, setSys] = useState<number | null>(null)
  const [dia, setDia] = useState<number | null>(null)
  const [pulse, setPulse] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  if (!readings || !settings) return null

  const last = readings.at(-1)
  const v = { s: sys ?? last?.systolic ?? 120, d: dia ?? last?.diastolic ?? 80, p: pulse ?? last?.pulse ?? 60 }
  const weeks = weeklyBp(readings).slice(0, 8)
  const recent = readings.slice(-60)

  const save = async () => {
    const now = new Date()
    await saveBp({ date: isoDate(now), time: now.toTimeString().slice(0, 5), systolic: v.s, diastolic: v.d, pulse: v.p || undefined })
    setSys(null); setDia(null); setPulse(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Blood pressure</h1>
        <Link to="/health" className="btn btn-small">Back</Link>
      </div>
      <div className="card stack">
        <Stepper label="Systolic (top number)" value={v.s} min={60} max={260} onChange={setSys} suffix="mmHg" />
        <Stepper label="Diastolic (bottom number)" value={v.d} min={30} max={180} onChange={setDia} suffix="mmHg" />
        <Stepper label="Resting heart rate (0 = skip)" value={v.p} max={220} onChange={setPulse} suffix="bpm" />
        <button className="btn btn-primary btn-block" onClick={save}>Save reading</button>
        {saved && <p className="ok small">Saved.</p>}
        <p className="muted small">Best taken in the morning, seated and rested for 5 minutes, before caffeine. Take two readings a minute apart and log the second.</p>
      </div>

      {weeks.length > 0 && (
        <div className="card">
          <h2>Weekly averages</h2>
          <ul className="list">
            {weeks.map((w) => {
              const level = bpLevel(w.systolic, w.diastolic, settings.bpAlert)
              return (
                <li key={w.weekStart} className="list-row">
                  <span>
                    <strong>{w.systolic}/{w.diastolic}</strong>
                    {w.pulse ? <span className="muted"> · {w.pulse} bpm</span> : null}
                    <br />
                    <span className="muted small">Week of {formatDate(w.weekStart)} · {w.count} reading{w.count > 1 ? 's' : ''}</span>
                  </span>
                  <span className={`small level-${level}`}>{LEVEL_TEXT[level]}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted small">
            Elevated from 130/80, high from {settings.bpAlert?.systolic ?? 140}/{settings.bpAlert?.diastolic ?? 90}. If your weekly average stays high, speak to your GP.
          </p>
        </div>
      )}

      <div className="card">
        <h2>Trend</h2>
        <LineChart
          series={[
            { points: recent.map((r) => ({ x: dayMs(r.date), y: r.systolic })), colour: 'var(--danger)', dots: true },
            { points: recent.map((r) => ({ x: dayMs(r.date), y: r.diastolic })), colour: '#6aa6ff', dots: true },
            ...(recent.some((r) => r.pulse) ? [{ points: recent.filter((r) => r.pulse).map((r) => ({ x: dayMs(r.date), y: r.pulse! })), colour: 'var(--success)', width: 1.5 }] : []),
          ]}
          formatX={shortDate}
        />
        <p className="muted small">Red: systolic · Blue: diastolic · Green: resting HR</p>
      </div>

      {readings.length > 0 && (
        <ul className="list card">
          {[...readings].reverse().slice(0, 20).map((r) => (
            <li key={r.id} className="list-row">
              <span>{r.systolic}/{r.diastolic}{r.pulse ? ` · ${r.pulse} bpm` : ''}</span>
              <span className="row-actions">
                <span className="muted small">{formatDate(r.date)} {r.time}</span>
                <button className="btn btn-small btn-ghost" aria-label="Delete reading" onClick={() => db.bp.delete(r.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
