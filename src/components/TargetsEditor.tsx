import type { MacroTargets } from '../db/schema'
import { fatGrams, isOverBudget } from '../lib/macros'
import Stepper from './Stepper'

export default function TargetsEditor({ value, onChange }: { value: MacroTargets; onChange: (t: MacroTargets) => void }) {
  const set = (patch: Partial<MacroTargets>) => onChange({ ...value, ...patch })
  return (
    <div className="stack">
      <Stepper label="Calories" value={value.kcal} step={50} min={1000} max={8000} suffix="kcal" onChange={(kcal) => set({ kcal })} />
      <Stepper label="Protein" value={value.protein} step={5} max={500} suffix="g" onChange={(protein) => set({ protein })} />
      <Stepper label="Net carbs" value={value.netCarbs} step={5} max={800} suffix="g" onChange={(netCarbs) => set({ netCarbs })} />
      <div className="derived">
        <span>Fat (fills the rest)</span>
        <strong>{fatGrams(value)} g</strong>
      </div>
      {isOverBudget(value) && <p className="warn">Protein and carbs already go over your calories. Lower one of them or raise calories.</p>}
    </div>
  )
}
