import { Link, useNavigate } from 'react-router-dom'
import FoodEditor from '../../components/FoodEditor'
import { saveFood } from '../../nutrition/store'
import { useDateParam } from './useDateParam'

export default function NewFood() {
  const [date] = useDateParam()
  const navigate = useNavigate()
  return (
    <section className="stack">
      <div className="row-between">
        <h1>Your own food</h1>
        <Link to={`/food/add?date=${date}`} className="btn btn-small">Cancel</Link>
      </div>
      <div className="card">
        <FoodEditor
          initial={{ name: '', per100: { kcal: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 }, carbsIncludeFiber: false, source: 'custom' }}
          saveLabel="Save food"
          onSave={async (f) => {
            const food = await saveFood(f)
            navigate(`/food/item/${food.id}?date=${date}`, { replace: true })
          }}
        />
      </div>
    </section>
  )
}
