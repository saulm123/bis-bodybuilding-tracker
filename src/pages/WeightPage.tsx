import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/schema'
import { logWeight, useSettings } from '../db/settings'
import Stepper from '../components/Stepper'
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
        <Stepper label={todays ? "Today's weight (logged, tap to change)" : "Today's weight"} value={value} step={0.1} decimals={1} min={30} max={300} suffix="kg" onChange={setKg} />
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
        <div><span>7-day average</span><strong>{trend.average ? trend.average.toFixed(1) : '–'}</strong></div>
        <div><span>Per week</span><strong>{trend.rate ? `${trend.rate.perWeek >= 0 ? '+' : ''}${trend.rate.perWeek.toFixed(2)}` : '–'}</strong></div>
        <div><span>Last 14 days</span><strong>{trend.rate?.count ?? 0}<small> weigh-ins</small></strong></div>
      </div>

      <CalorieSuggestion settings={settings} trend={trend} />
      {trend.assessment && !trend.suggest && <p className={`small ${trend.assessment.verdict === 'on-track' ? 'ok' : 'muted'}`}>{trend.assessment.message}</p>}
      {!trend.rate?.enough && <p className="muted small">Trend advice starts after 10 weigh-ins spread over 10+ days.</p>}

      <div className="card">
        <h2>Last 90 days</h2>
        <LineChart
          series={[
            { points: recent.map((w) => ({ x: dayMs(w.date), y: w.kg })), colour: 'var(--text-muted)', dots: true, width: 0 },
            { points: avg.map((w) => ({ x: dayMs(w.date), y: w.kg })), colour: 'var(--accent)', width: 3 },
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
              <span>{w.kg.toFixed(1)} kg</span>
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
