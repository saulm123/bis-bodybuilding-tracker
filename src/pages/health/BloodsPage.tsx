import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { useSettings } from '../../db/settings'
import LineChart, { dayMs, shortDate } from '../../components/LineChart'
import { formatDate, isoDate } from '../../lib/dates'
import { flag, MARKERS, rangeFor, rangeText } from '../../health/markers'
import { bloodsDue } from '../../health/schedule'
import { currentCycle } from '../../health/store'

const FOSS = import.meta.env.VITE_FLAVOR !== 'play'

export default function BloodsPage() {
  const settings = useSettings()
  const panels = useLiveQuery(() => db.bloodPanels.orderBy('date').reverse().toArray(), [])
  const HAS_CYCLE = FOSS && !!settings?.showCycleLog
  const cycle = useLiveQuery(() => (HAS_CYCLE ? currentCycle() : undefined), [HAS_CYCLE])
  const [open, setOpen] = useState<string | null>(null)
  if (!settings || !panels) return null

  const due = bloodsDue(panels, HAS_CYCLE ? cycle : undefined, isoDate(), settings.bloodsIntervalWeeks ?? 12)

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Bloods</h1>
        <Link to="/health" className="btn btn-small">Back</Link>
      </div>

      <div className="card stack">
        <h2>When to test</h2>
        <ul className="list">
          {due.map((d) => (
            <li key={d.label} className="list-row">
              <span>{d.label}<br /><span className="muted small">{formatDate(d.date)}</span></span>
              <span className={`small status-${d.status}`}>{d.status}</span>
            </li>
          ))}
        </ul>
        {HAS_CYCLE && !cycle && <p className="muted small">Set start and end dates in the cycle log to get before / mid / after reminders.</p>}
      </div>

      <Link to="/health/bloods/new" className="btn btn-primary btn-block">Add test results</Link>

      {panels.length > 0 && (
        <div className="card">
          <h2>Latest results</h2>
          <ul className="list">
            {MARKERS.map((m) => {
              const history = panels.filter((p) => m.key in p.values).map((p) => ({ date: p.date, v: p.values[m.key] }))
              if (!history.length) return null
              const range = rangeFor(m, settings.markerRanges, settings.sex)
              const latest = history[0]
              const f = flag(latest.v, range)
              return (
                <li key={m.key}>
                  <button className="list-row plain" onClick={() => setOpen(open === m.key ? null : m.key)} aria-expanded={open === m.key}>
                    <span>
                      {m.name}
                      <br />
                      <span className="muted small">Range {rangeText(range)} {m.unit} · {formatDate(latest.date)}</span>
                    </span>
                    <span className={`marker-value flag-${f}`}>
                      {latest.v} <small>{m.unit}</small>
                      {f !== 'ok' && <small> {f}</small>}
                    </span>
                  </button>
                  {open === m.key && (
                    <div className="stack marker-detail">
                      <LineChart
                        series={[{ points: [...history].reverse().map((h) => ({ x: dayMs(h.date), y: h.v })), colour: 'var(--accent)', dots: true }]}
                        band={range.low !== undefined || range.high !== undefined ? { from: range.low ?? 0, to: range.high ?? latest.v * 1.5 } : undefined}
                        formatX={shortDate}
                        formatY={(y) => (y < 10 ? y.toFixed(1) : String(Math.round(y)))}
                      />
                      {m.note && <p className="muted small">{m.note}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="muted small">Ranges are typical UK adult {settings.sex} defaults. Change them in More → Bloods ranges to match your lab. This is a log, not medical advice.</p>
        </div>
      )}

      {panels.length > 0 && (
        <div className="card">
          <h2>All tests</h2>
          <ul className="list">
            {panels.map((p) => (
              <li key={p.id}>
                <Link to={`/health/bloods/${p.id}`} className="list-row">
                  <span>{p.label || 'Blood test'}</span>
                  <span className="muted small">{formatDate(p.date)} · {Object.keys(p.values).length} markers</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
