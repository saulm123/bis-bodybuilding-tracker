import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Activity, DietStyle, Settings } from '../db/schema'
import { db } from '../db/schema'
import { saveSettings } from '../db/settings'
import { ACTIVITY, ageFrom, computeTargets, DIET, maintenanceKcal } from '../lib/targets'
import { PHASE_LABEL } from '../lib/macros'
import Segmented from './Segmented'
import Stepper from './Stepper'
import { HeightInput } from './BodyInputs'

/** Your details (used for the calorie formula), units, and a "recalculate targets" button. */
export default function DetailsSection({ settings }: { settings: Settings }) {
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const age = ageFrom(settings.birthYear)
  const latest = useLiveQuery(() => db.weights.orderBy('date').last(), [])
  const d = { sex: settings.sex, age, heightCm: settings.heightCm, weightKg: latest?.kg ?? 75, activity: settings.activity, dietStyle: settings.dietStyle }
  const preview = computeTargets(d)[settings.phase]

  const recalc = async () => {
    await saveSettings({ targets: computeTargets(d), lastCalorieReviewAt: new Date().toISOString() })
    setConfirm(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div className="card stack">
      <h2>Your details</h2>
      <Segmented label="Units" value={settings.units} onChange={(units) => saveSettings({ units })} options={[{ value: 'metric', label: 'kg / cm' }, { value: 'imperial', label: 'lb / ft' }]} />
      <Segmented label="Sex" value={settings.sex} onChange={(sex) => saveSettings({ sex })} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
      <Stepper label="Age" value={age} min={14} max={99} suffix="years" onChange={(a) => saveSettings({ birthYear: new Date().getFullYear() - a })} />
      <HeightInput units={settings.units} cm={settings.heightCm} onChange={(heightCm) => saveSettings({ heightCm })} />
      <label className="field">
        <span>Activity</span>
        <select value={settings.activity} onChange={(e) => saveSettings({ activity: e.target.value as Activity })}>
          {Object.entries(ACTIVITY).map(([k, a]) => <option key={k} value={k}>{a.label}: {a.hint}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Diet style</span>
        <select value={settings.dietStyle} onChange={(e) => saveSettings({ dietStyle: e.target.value as DietStyle })}>
          {Object.entries(DIET).map(([k, d]) => <option key={k} value={k}>{d.label}: {d.hint}</option>)}
        </select>
      </label>
      {!confirm ? (
        <button className="btn btn-block" onClick={() => setConfirm(true)}>Recalculate my targets</button>
      ) : (
        <div className="confirm stack">
          <p className="small">
            Estimated maintenance: <strong>{maintenanceKcal(d)} kcal</strong>. New {PHASE_LABEL[settings.phase].toLowerCase()} targets would be{' '}
            <strong>{preview.kcal} kcal</strong>, {preview.protein} g protein, {preview.netCarbs} g net carbs. This replaces your current cut,
            maintain and bulk targets.
          </p>
          <button className="btn btn-primary btn-block" onClick={recalc}>Recalculate</button>
          <button className="btn btn-ghost btn-block" onClick={() => setConfirm(false)}>Cancel</button>
        </div>
      )}
      {done && <p className="ok small">Targets updated.</p>}
    </div>
  )
}
