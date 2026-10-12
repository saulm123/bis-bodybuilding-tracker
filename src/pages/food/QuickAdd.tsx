import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Stepper from '../../components/Stepper'
import { quickAdd } from '../../nutrition/store'
import { useDateParam } from './useDateParam'

export default function QuickAdd() {
  const [date] = useDateParam()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [protein, setProtein] = useState(0)
  const [netCarbs, setCarbs] = useState(0)
  const [fat, setFat] = useState(0)
  const [kcalOverride, setKcal] = useState<number | null>(null)
  const kcal = kcalOverride ?? Math.round(protein * 4 + netCarbs * 4 + fat * 9)

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Quick add</h1>
        <Link to={`/food?date=${date}`} className="btn btn-small">Cancel</Link>
      </div>
      <div className="card stack">
        <label className="field">
          <span>What was it? (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant steak" />
        </label>
        <Stepper label="Protein" value={protein} step={5} max={500} suffix="g" onChange={setProtein} />
        <Stepper label="Net carbs" value={netCarbs} step={5} max={800} suffix="g" onChange={setCarbs} />
        <Stepper label="Fat" value={fat} step={5} max={500} suffix="g" onChange={setFat} />
        <Stepper label="Calories (worked out from macros, or set your own)" value={kcal} step={10} max={10000} suffix="kcal" onChange={setKcal} />
        <button
          className="btn btn-primary btn-block"
          disabled={!kcal}
          onClick={async () => {
            await quickAdd(name, { kcal, protein, netCarbs, fat }, date)
            navigate(`/food?date=${date}`)
          }}
        >
          Add
        </button>
      </div>
    </section>
  )
}
