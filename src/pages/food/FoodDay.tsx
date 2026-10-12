import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, type FoodLogEntry } from '../../db/schema'
import { useSettings } from '../../db/settings'
import MacroBars from '../../components/MacroBars'
import MiniStepper from '../../components/MiniStepper'
import { entryTotals, sum, targetTotals } from '../../nutrition/macros'
import { copyDay, deleteEntry, saveMeal, updateEntryGrams } from '../../nutrition/store'
import { dayLabel, shiftDate, useDateParam } from './useDateParam'

export default function FoodDay() {
  const [date, setDate] = useDateParam()
  const settings = useSettings()
  const navigate = useNavigate()
  const entries = useLiveQuery(() => db.foodLog.where('date').equals(date).sortBy('createdAt'), [date])
  const yesterdayCount = useLiveQuery(() => db.foodLog.where('date').equals(shiftDate(date, -1)).count(), [date])
  const [editing, setEditing] = useState<string | null>(null)
  const [mealName, setMealName] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!settings || !entries) return null
  const q = `?date=${date}`
  const eaten = sum(entries.map(entryTotals))

  return (
    <section className="stack">
      <div className="date-nav">
        <button className="btn btn-small" aria-label="Previous day" onClick={() => setDate(shiftDate(date, -1))}>‹</button>
        <h1>{dayLabel(date)}</h1>
        <button className="btn btn-small" aria-label="Next day" onClick={() => setDate(shiftDate(date, 1))}>›</button>
      </div>

      <div className="card">
        <MacroBars eaten={eaten} target={targetTotals(settings.targets[settings.phase])} />
      </div>

      <div className="action-grid">
        <button className="btn btn-primary" onClick={() => navigate(`/food/add${q}&scan=1`)}>Scan</button>
        <Link className="btn" to={`/food/add${q}`}>Search</Link>
        <Link className="btn" to={`/food/meals${q}`}>Favourites</Link>
        <Link className="btn" to={`/food/quick${q}`}>Quick add</Link>
      </div>

      <div className="card">
        <div className="row-between">
          <h2>Logged</h2>
          <span className="muted small">{entries.length} items</span>
        </div>
        {entries.length === 0 ? (
          <div className="stack">
            <p className="muted small">Nothing logged yet.</p>
            {!!yesterdayCount && (
              <button
                className="btn btn-block"
                onClick={async () => setMessage(`Copied ${await copyDay(shiftDate(date, -1), date)} items.`)}
              >
                Copy the day before ({yesterdayCount} items)
              </button>
            )}
          </div>
        ) : (
          <ul className="list">
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} open={editing === e.id} onToggle={() => setEditing(editing === e.id ? null : e.id)} />
            ))}
          </ul>
        )}
        {message && <p className="ok small">{message}</p>}
      </div>

      {entries.some((e) => e.foodId) &&
        (mealName === null ? (
          <button className="btn btn-ghost btn-block" onClick={() => setMealName('')}>Save this day's foods as a meal</button>
        ) : (
          <div className="card stack">
            <label className="field">
              <span>Meal name</span>
              <input autoFocus value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Steak and eggs" />
            </label>
            <button
              className="btn btn-primary btn-block"
              onClick={async () => {
                await saveMeal(mealName, entries)
                setMealName(null)
                setMessage('Meal saved. Find it under Meals & favourites.')
              }}
            >
              Save meal
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setMealName(null)}>Cancel</button>
          </div>
        ))}
    </section>
  )
}

function EntryRow({ entry: e, open, onToggle }: { entry: FoodLogEntry; open: boolean; onToggle: () => void }) {
  return (
    <li className="entry">
      <button className="list-row plain" onClick={onToggle} aria-expanded={open}>
        <span>
          {e.name}
          {e.grams ? <span className="muted small"> · {e.grams} g</span> : null}
          <br />
          <span className="muted small">P {Math.round(e.protein)} · C {Math.round(e.netCarbs)} · F {Math.round(e.fat)}</span>
        </span>
        <strong>{e.kcal}</strong>
      </button>
      {open && (
        <div className="row-actions entry-edit">
          {e.grams !== undefined && (
            <div className="grow">
              <MiniStepper label="Grams" value={e.grams} step={10} min={1} max={5000} decimals={0} suffix="g" onChange={(g) => updateEntryGrams(e, g)} />
            </div>
          )}
          <button className="btn btn-small btn-danger" onClick={() => deleteEntry(e.id)}>Delete</button>
        </div>
      )}
    </li>
  )
}
