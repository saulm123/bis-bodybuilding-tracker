import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/schema'
import { logMeal } from '../../nutrition/store'
import { useDateParam } from './useDateParam'

export default function Meals() {
  const [date] = useDateParam()
  const navigate = useNavigate()
  const meals = useLiveQuery(() => db.meals.orderBy('name').toArray(), [])
  const favourites = useLiveQuery(() => db.foods.filter((f) => !!f.favourite).sortBy('name'), [])
  const [confirm, setConfirm] = useState<string | null>(null)

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Meals & favourites</h1>
        <Link to={`/food?date=${date}`} className="btn btn-small">Done</Link>
      </div>

      <div className="card">
        <h2>Saved meals</h2>
        {!meals?.length ? (
          <p className="muted small">No meals yet. Log some foods, then "Save this day's foods as a meal" on the Food screen.</p>
        ) : (
          <ul className="list">
            {meals.map((m) => (
              <li key={m.id} className="list-row">
                <span>
                  {m.name}
                  <br />
                  <span className="muted small">{m.items.map((i) => i.name).join(', ')}</span>
                </span>
                <span className="row-actions nowrap">
                  <button className="btn btn-small btn-primary" onClick={async () => { await logMeal(m, date); navigate(`/food?date=${date}`) }}>
                    Log
                  </button>
                  {confirm === m.id ? (
                    <button className="btn btn-small btn-danger" onClick={() => db.meals.delete(m.id)}>Delete?</button>
                  ) : (
                    <button className="btn btn-small btn-ghost" aria-label={`Delete ${m.name}`} onClick={() => setConfirm(m.id)}>✕</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Favourite foods</h2>
        {!favourites?.length ? (
          <p className="muted small">Tap ★ on any food to keep it here.</p>
        ) : (
          <ul className="list">
            {favourites.map((f) => (
              <li key={f.id}>
                <Link to={`/food/item/${f.id}?date=${date}`} className="list-row">
                  <span>★ {f.name}</span>
                  <span className="muted small">{f.servingG ? `${f.servingG} g` : '100 g'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
