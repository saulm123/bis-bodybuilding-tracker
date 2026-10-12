import { useEffect, useRef, useState } from 'react'
import Stepper from '../components/Stepper'
import Segmented from '../components/Segmented'
import RadioCards from '../components/RadioCards'
import TargetsEditor from '../components/TargetsEditor'
import { HeightInput, WeightInput } from '../components/BodyInputs'
import { completeOnboarding, saveSettings } from '../db/settings'
import { db, newId, nowIso, type Activity, type DietStyle, type MacroTargets, type Phase, type Sex, type Units } from '../db/schema'
import { ACTIVITY, computeTargets, DIET, maintenanceKcal } from '../lib/targets'
import { PHASE_LABEL } from '../lib/macros'
import { PLANS, recommendPlan, type Equipment, type Level } from '../training/templates'
import { applyPlan } from '../training/store'

const SUPPLEMENTS: [string, 'AM' | 'PM'][] = [
  ['Creatine', 'AM'],
  ['Vitamin D3 + K2', 'AM'],
  ['Omega-3', 'AM'],
  ['Multivitamin', 'AM'],
  ['Protein shake', 'AM'],
  ['Electrolytes', 'AM'],
  ['Garlic', 'AM'],
  ['GlyNAC', 'AM'],
  ['Zinc', 'PM'],
  ['Magnesium glycinate', 'PM'],
  ['L-theanine', 'PM'],
]

const STEPS = ['You', 'Lifestyle', 'Targets', 'Training', 'Supplements']

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [units, setUnits] = useState<Units>('metric')
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState(30)
  const [heightCm, setHeightCm] = useState(178)
  const [weightKg, setWeightKg] = useState(80)
  const [activity, setActivity] = useState<Activity>('moderate')
  const [phase, setPhase] = useState<Phase>('maintain')
  const [dietStyle, setDiet] = useState<DietStyle>('balanced')
  const [edited, setEdited] = useState<Partial<Record<Phase, MacroTargets>>>({})
  const [days, setDays] = useState('4')
  const [equipment, setEquipment] = useState<Equipment>('Gym')
  const [level, setLevel] = useState<Level>('Beginner')
  const [planId, setPlanId] = useState<string | null>(null)
  const [supps, setSupps] = useState<Set<string>>(new Set(['Creatine', 'Vitamin D3 + K2', 'Omega-3']))
  const [saving, setSaving] = useState(false)
  const main = useRef<HTMLElement>(null)
  useEffect(() => {
    main.current?.scrollTo({ top: 0 }) // each step starts at the top
  }, [step])

  const details = { sex, age, heightCm, weightKg, activity, dietStyle }
  const computed = computeTargets(details)
  const targets = { ...computed, ...edited }
  const recommended = recommendPlan(Number(days), equipment, level)
  const chosenPlan = planId ?? recommended.id

  const finish = async () => {
    setSaving(true)
    const now = nowIso()
    await applyPlan(chosenPlan, units)
    await db.transaction('rw', db.supplements, async () => {
      if ((await db.supplements.count()) === 0) {
        await db.supplements.bulkAdd(
          SUPPLEMENTS.filter(([n]) => supps.has(n)).map(([name, timing], order) => ({ id: newId(), name, timing, order, active: true, createdAt: now, updatedAt: now })),
        )
      }
    })
    // Mark supplements as chosen first, so the starter list isn't added on top (even if you picked none).
    await saveSettings({ supplementsSeeded: true })
    await completeOnboarding({ units, sex, birthYear: new Date().getFullYear() - age, heightCm, weightKg, activity, dietStyle, phase, targets })
  }

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  return (
    <main className="screen onboarding" ref={main}>
      <div className="row-between">
        <img src="favicon.svg" alt="" width={48} height={48} className="logo" />
        <span className="muted small">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </span>
      </div>
      <div className="progress" aria-hidden="true"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      {step === 0 && (
        <>
          <h1>Welcome to BIS Tracker</h1>
          <p className="muted">A few questions to set your targets and pick a training plan. You can change everything later.</p>
          <section className="card stack">
            <Segmented label="Units" value={units} onChange={setUnits} options={[{ value: 'metric', label: 'kg / cm' }, { value: 'imperial', label: 'lb / ft' }]} />
            <Segmented label="Sex" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            <p className="muted small">Used for the calorie formula and blood test ranges.</p>
            <Stepper label="Age" value={age} min={14} max={99} suffix="years" onChange={setAge} />
            <HeightInput units={units} cm={heightCm} onChange={setHeightCm} />
            <WeightInput units={units} kg={weightKg} onChange={setWeightKg} label="Today's weight" />
          </section>
        </>
      )}

      {step === 1 && (
        <>
          <h1>Your day and your goal</h1>
          <section className="card stack">
            <h2>How active are you?</h2>
            <RadioCards label="Activity" value={activity} onChange={setActivity} options={Object.entries(ACTIVITY).map(([value, a]) => ({ value: value as Activity, label: a.label, hint: a.hint }))} />
          </section>
          <section className="card stack">
            <h2>Goal right now</h2>
            <RadioCards
              label="Goal"
              value={phase}
              onChange={setPhase}
              options={[
                { value: 'cut', label: 'Lose fat (cut)', hint: 'Eat a bit less, keep muscle' },
                { value: 'maintain', label: 'Maintain', hint: 'Stay the same weight, get stronger' },
                { value: 'bulk', label: 'Build muscle (bulk)', hint: 'Eat a bit more, gain slowly' },
              ]}
            />
          </section>
          <section className="card stack">
            <h2>How do you like to eat?</h2>
            <RadioCards label="Diet style" value={dietStyle} onChange={setDiet} options={Object.entries(DIET).map(([value, d]) => ({ value: value as DietStyle, label: d.label, hint: d.hint }))} />
          </section>
        </>
      )}

      {step === 2 && (
        <>
          <h1>Your targets</h1>
          <p className="muted">
            Estimated maintenance: <strong>{maintenanceKcal(details)} kcal</strong> a day. Your {PHASE_LABEL[phase].toLowerCase()} targets are below. Adjust anything
            you like; the app also fine-tunes calories every two weeks from your weight trend.
          </p>
          <section className="card stack">
            <h2>{PHASE_LABEL[phase]}</h2>
            <TargetsEditor value={targets[phase]} onChange={(t) => setEdited({ ...edited, [phase]: t })} />
          </section>
        </>
      )}

      {step === 3 && (
        <>
          <h1>Pick a training plan</h1>
          <section className="card stack">
            <span className="muted small">Days a week you can train</span>
            <Segmented label="Days per week" value={days} onChange={(d) => { setDays(d); setPlanId(null) }} options={['3', '4', '5', '6'].map((d) => ({ value: d, label: d }))} />
            <Segmented label="Equipment" value={equipment} onChange={(e) => { setEquipment(e); setPlanId(null) }} options={[{ value: 'Gym', label: 'Gym' }, { value: 'Dumbbells', label: 'Dumbbells only' }]} />
            <Segmented label="Experience" value={level} onChange={(l) => { setLevel(l); setPlanId(null) }} options={[{ value: 'Beginner', label: 'New' }, { value: 'Intermediate', label: '1–3 yrs' }, { value: 'Advanced', label: '3+ yrs' }]} />
          </section>
          <RadioCards
            label="Plan"
            value={chosenPlan}
            onChange={setPlanId}
            options={PLANS.map((p) => ({
              value: p.id,
              label: `${p.name} · ${p.daysPerWeek} days`,
              hint: `${p.level} · ${p.equipment === 'Dumbbells' ? 'dumbbells only' : 'gym'}. ${p.description}`,
              badge: p.id === recommended.id ? 'Suggested' : undefined,
            }))}
          />
        </>
      )}

      {step === 4 && (
        <>
          <h1>Supplements</h1>
          <p className="muted">Tick the ones you take for a daily checklist. Skip this if you don't take any; you can add your own later.</p>
          <section className="card">
            <div className="chips">
              {SUPPLEMENTS.map(([name]) => (
                <button
                  key={name}
                  className={`chip ${supps.has(name) ? 'chip-done' : ''}`}
                  aria-pressed={supps.has(name)}
                  onClick={() => {
                    const n = new Set(supps)
                    if (n.has(name)) n.delete(name)
                    else n.add(name)
                    setSupps(n)
                  }}
                >
                  {supps.has(name) ? '✓ ' : ''}
                  {name}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="wizard-nav">
        {step > 0 && <button className="btn" onClick={back}>Back</button>}
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary grow" onClick={next}>Next</button>
        ) : (
          <button className="btn btn-primary grow" onClick={finish} disabled={saving}>Start tracking</button>
        )}
      </div>
    </main>
  )
}
