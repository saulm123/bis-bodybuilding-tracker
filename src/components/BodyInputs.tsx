import type { Units } from '../db/schema'
import { cmToFtIn, ftInToCm, tidy, unitHelpers } from '../lib/units'
import Stepper from './Stepper'
import MiniStepper from './MiniStepper'

/** Height in cm, or feet + inches. Always reports cm. */
export function HeightInput({ units, cm, onChange }: { units: Units; cm: number; onChange: (cm: number) => void }) {
  if (units === 'metric') return <Stepper label="Height" value={cm} min={120} max={230} suffix="cm" onChange={onChange} />
  const { ft, inch } = cmToFtIn(cm)
  return (
    <div className="stepper">
      <label>Height</label>
      <div className="two-col">
        <MiniStepper label="Height, feet" value={ft} step={1} min={4} max={7} decimals={0} suffix="ft" onChange={(f) => onChange(ftInToCm(f, inch))} />
        <MiniStepper label="Height, inches" value={inch} step={1} min={0} max={11} decimals={0} suffix="in" onChange={(i) => onChange(ftInToCm(ft, i))} />
      </div>
    </div>
  )
}

/** Body weight in kg or lb. Always reports kg. */
export function WeightInput({ units, kg, onChange, label = 'Weight' }: { units: Units; kg: number; onChange: (kg: number) => void; label?: string }) {
  const u = unitHelpers(units)
  return (
    <Stepper
      label={label}
      value={tidy(u.fromKg(kg))}
      step={u.bodyStep}
      decimals={1}
      min={units === 'metric' ? 30 : 66}
      max={units === 'metric' ? 300 : 660}
      suffix={u.w}
      onChange={(shown) => onChange(u.toKg(shown))}
    />
  )
}
