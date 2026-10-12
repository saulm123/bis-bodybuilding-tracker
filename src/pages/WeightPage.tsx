import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/schema'
import { logWeight, useSettings } from '../db/settings'
import { WeightInput } from '../components/BodyInputs'
import { useUnits } from '../lib/units'
import LineChart, { dayMs, shortDate } from '../components/LineChart'
import CalorieSuggestion from '../components/CalorieSuggestion'
import { formatDate, isoDate } from '../lib/dates'
import { movingAverage } from '../weight/trend'
import { useTrend } from '../weight/useTrend'

export default function WeightPage() {
  const settings = useSettings()
  const trend = useTrend(settings)
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [])
  const [kg, setKg] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const u = useUnits()
  if (!settings || !trend || !weights) return null

  const today = isoDate()
  const todays = weights.find((w) => w.date === today)
  const value = kg ?? todays?.kg ?? trend.latest?.kg ?? 86
  const recent = weights.slice(-90)
  const avg = movingAverage(weights).slice(-90)

  return (
    <section className="stack">
      <h1>Weight</h1>

      <div className="card stack">
        <WeightInput units={settings.units} kg={value} onChange={setKg} label={todays ? "Today's weight (logged, tap to change)" : "Today's weight"} />
        <button
          className="btn btn-primary btn-block"
          onClick={async () => {
            await logWeight(value)
            setKg(null)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
          }}
        >
          {todays ? 'Update today' : 'Log weight'}
        </button>
        {saved && <p className="ok small">Saved.</p>}
        <p className="muted small">Weigh in every morning after the toilet, before food. The 7-day average smooths out water swings.</p>
      </div>

      <div className="macro-grid three">
        <div><span>7-day avg ({u.w})</span><strong>{trend.average ? u.fromKg(trend.average).toFixed(1) : '–'}</strong></div>
        <div><span>{u.w} per week</span><strong>{trend.rate ? `${trend.rate.perWeek >= 0 ? '+' : ''}${u.fromKg(trend.rate.perWeek).toFixed(2)}` : '–'}</strong></div>
        <div><span>Last 14 days</span><strong>{trend.rate?.count ?? 0}<small> weigh-ins</small></strong></div>
      </div>

      <CalorieSuggestion settings={settings} trend={trend} />
      {trend.assessment && !trend.suggest && <p className={`small ${trend.assessment.verdict === 'on-track' ? 'ok' : 'muted'}`}>{trend.assessment.message}</p>}
      {!trend.rate?.enough && <p className="muted small">Trend advice starts after 10 weigh-ins spread over 10+ days.</p>}

      <div className="card">
        <h2>Last 90 days</h2>
        <LineChart
          series={[
            { points: recent.map((w) => ({ x: dayMs(w.date), y: u.fromKg(w.kg) })), colour: 'var(--text-muted)', dots: true, width: 0 },
            { points: avg.map((w) => ({ x: dayMs(w.date), y: u.fromKg(w.kg) })), colour: 'var(--accent)', width: 3 },
          ]}
          formatX={shortDate}
          formatY={(y) => y.toFixed(1)}
        />
        <p className="muted small">Dots: daily weigh-ins. Line: 7-day average.</p>
      </div>

      {weights.length > 0 && (
        <ul className="list card">
          {[...weights].reverse().slice(0, 30).map((w) => (
            <li key={w.id} className="list-row">
              <span>{u.fmtW(w.kg)}</span>
              <span className="row-actions">
                <span className="muted small">{formatDate(w.date)}</span>
                <button className="btn btn-small btn-ghost" aria-label={`Delete ${formatDate(w.date)}`} onClick={() => db.weights.delete(w.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
