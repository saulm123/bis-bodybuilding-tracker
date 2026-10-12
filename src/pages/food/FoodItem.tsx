import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/schema'
import FoodEditor from '../../components/FoodEditor'
import Stepper from '../../components/Stepper'
import { macrosFor } from '../../nutrition/macros'
import { logFood, saveFood, toggleFavourite } from '../../nutrition/store'
import { dayLabel, useDateParam } from './useDateParam'

export default function FoodItem() {
  const { foodId = '' } = useParams()
  const [date] = useDateParam()
  const navigate = useNavigate()
  const food = useLiveQuery(() => db.foods.get(foodId), [foodId])
  const [grams, setGrams] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)

  if (food === undefined) return null
  const g = grams ?? food.servingG ?? 100
  const m = macrosFor(food, g)
  const chips = [...new Set([food.servingG, food.servingG && food.servingG * 2, 100, 200].filter((n): n is number => !!n))]

  if (editing) {
    return (
      <section className="stack">
        <div className="row-between">
          <h1>Edit food</h1>
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
        </div>
        <FoodEditor initial={food} saveLabel="Save changes" onSave={async (f) => { await saveFood({ ...f, id: food.id }); setEditing(false) }} />
      </section>
    )
  }

  return (
    <section className="stack">
      <div className="row-between">
        <div>
          <h1>{food.name}</h1>
          {food.brand && <span className="muted small">{food.brand}</span>}
        </div>
        <button className={`btn btn-small fav ${food.favourite ? 'on' : ''}`} aria-pressed={!!food.favourite} aria-label="Favourite" onClick={() => toggleFavourite(food.id)}>
          ★
        </button>
      </div>

      <div className="card stack">
        <Stepper label="Amount" value={g} step={10} min={1} max={5000} suffix="g" onChange={setGrams} />
        <div className="row-actions">
          {chips.map((c) => (
            <button key={c} className={`btn btn-small ${c === g ? 'chip-on' : ''}`} onClick={() => setGrams(c)}>
              {c === food.servingG ? `1 serving (${c} g)` : c === (food.servingG ?? 0) * 2 ? `2 servings` : `${c} g`}
            </button>
          ))}
        </div>
        <div className="macro-grid">
          <div><span>Calories</span><strong>{m.kcal}</strong></div>
          <div><span>Protein</span><strong>{Math.round(m.protein)}g</strong></div>
          <div><span>Net carbs</span><strong>{Math.round(m.netCarbs)}g</strong></div>
          <div><span>Fat</span><strong>{Math.round(m.fat)}g</strong></div>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={async () => {
            await logFood(food, g, date)
            navigate(`/food?date=${date}`)
          }}
        >
          Add to {dayLabel(date).toLowerCase() === 'today' ? 'today' : dayLabel(date)}
        </button>
      </div>

      <div className="card small">
        <div className="row-between"><span className="muted">Per 100 g</span><button className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>Edit</button></div>
        <p className="muted">
          {food.per100.kcal} kcal · P {food.per100.protein} · carbs {food.per100.carbs} · fibre {food.per100.fiber} · F {food.per100.fat}
          {food.carbsIncludeFiber ? ' · net carbs = carbs − fibre' : ''}
        </p>
        {food.source === 'off' && <p className="muted">Data from Open Food Facts (ODbL). Check it against the label.</p>}
      </div>
    </section>
  )
}
