import { useState } from 'react'
import type { Per100g } from '../db/schema'
import type { OffFood } from '../nutrition/off'
import Stepper from './Stepper'

/** Form for typing in (or correcting) a food's nutrition per 100 g. */
export default function FoodEditor({ initial, onSave, saveLabel }: { initial: OffFood; onSave: (f: OffFood) => void; saveLabel: string }) {
  const [f, setF] = useState<OffFood>(initial)
  const setPer = (patch: Partial<Per100g>) => setF({ ...f, per100: { ...f.per100, ...patch } })
  return (
    <div className="stack">
      <label className="field">
        <span>Name</span>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Chicken thighs" />
      </label>
      <label className="field">
        <span>Brand (optional)</span>
        <input value={f.brand ?? ''} onChange={(e) => setF({ ...f, brand: e.target.value || undefined })} />
      </label>
      <p className="muted small">Nutrition per 100 g (from the label).</p>
      <Stepper label="Calories" value={f.per100.kcal} step={5} max={900} suffix="kcal" onChange={(kcal) => setPer({ kcal })} />
      <Stepper label="Protein" value={f.per100.protein} step={0.5} decimals={1} max={100} suffix="g" onChange={(protein) => setPer({ protein })} />
      <Stepper label="Carbohydrate" value={f.per100.carbs} step={0.5} decimals={1} max={100} suffix="g" onChange={(carbs) => setPer({ carbs })} />
      <Stepper label="Fibre" value={f.per100.fiber} step={0.5} decimals={1} max={100} suffix="g" onChange={(fiber) => setPer({ fiber })} />
      <Stepper label="Fat" value={f.per100.fat} step={0.5} decimals={1} max={100} suffix="g" onChange={(fat) => setPer({ fat })} />
      <label className="toggle">
        <input type="checkbox" checked={f.carbsIncludeFiber} onChange={(e) => setF({ ...f, carbsIncludeFiber: e.target.checked })} />
        <span>Carbs on the label include fibre (US-style label). Net carbs = carbs − fibre.</span>
      </label>
      <Stepper label="Serving size (0 = none)" value={f.servingG ?? 0} step={5} max={2000} suffix="g" onChange={(s) => setF({ ...f, servingG: s || undefined })} />
      <button className="btn btn-primary btn-block" disabled={!f.name.trim()} onClick={() => onSave({ ...f, name: f.name.trim() })}>
        {saveLabel}
      </button>
    </div>
  )
}
