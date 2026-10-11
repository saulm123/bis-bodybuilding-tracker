import { useState } from 'react'
import Stepper from '../components/Stepper'
import Segmented from '../components/Segmented'
import TargetsEditor from '../components/TargetsEditor'
import { completeOnboarding } from '../db/settings'
import type { Phase } from '../db/schema'
import { DEFAULT_TARGETS } from '../lib/macros'

export default function Onboarding() {
  const [heightCm, setHeightCm] = useState(190)
  const [weightKg, setWeightKg] = useState(86)
  const [phase, setPhase] = useState<Phase>('bulk')
  const [targets, setTargets] = useState(() => structuredClone(DEFAULT_TARGETS))
  const [saving, setSaving] = useState(false)

  const start = async () => {
    setSaving(true)
    await completeOnboarding({ heightCm, weightKg, phase, targets })
  }

  return (
    <main className="screen onboarding">
      <img src="favicon.svg" alt="" width={80} height={80} className="logo" />
      <h1>Welcome to BIS Tracker</h1>
      <p className="muted">A few numbers to get started. You can change all of these later in More.</p>

      <section className="card stack">
        <h2>You</h2>
        <Stepper label="Height" value={heightCm} min={120} max={230} suffix="cm" onChange={setHeightCm} />
        <Stepper label="Today's weight" value={weightKg} step={0.1} decimals={1} min={30} max={300} suffix="kg" onChange={setWeightKg} />
      </section>

      <section className="card stack">
        <h2>Goal right now</h2>
        <Segmented
          label="Phase"
          value={phase}
          onChange={setPhase}
          options={[
            { value: 'bulk', label: 'Bulk' },
            { value: 'cut', label: 'Cut' },
          ]}
        />
        <h3>{phase === 'bulk' ? 'Bulk' : 'Cut'} targets</h3>
        <TargetsEditor value={targets[phase]} onChange={(t) => setTargets({ ...targets, [phase]: t })} />
        <p className="muted small">
          Your {phase === 'bulk' ? 'cut' : 'bulk'} targets are set to sensible defaults. Switching phase later swaps to them.
        </p>
      </section>

      <button className="btn btn-primary btn-block" onClick={start} disabled={saving}>
        Start tracking
      </button>
    </main>
  )
}
