import { useState } from 'react'
import { useSettings, saveSettings } from '../db/settings'
import Segmented from '../components/Segmented'
import TargetsEditor from '../components/TargetsEditor'
import BackupSection from '../components/BackupSection'
import RemindersSection from '../components/RemindersSection'
import RangesSection from '../components/RangesSection'
import InstallHint from '../components/InstallHint'
import DetailsSection from '../components/DetailsSection'
import { PHASE_LABEL } from '../lib/macros'
import type { Phase } from '../db/schema'
import { APP_VERSION, FLAVOR } from '../flavor'

export default function More() {
  const settings = useSettings()
  const [editing, setEditing] = useState<Phase | null>(null)
  if (!settings) return null

  return (
    <section className="stack">
      <h1>Settings</h1>

      <div className="card stack">
        <h2>Goal</h2>
        <Segmented
          label="Phase"
          value={settings.phase}
          onChange={(phase) => saveSettings({ phase })}
          options={(['cut', 'maintain', 'bulk'] as const).map((p) => ({ value: p, label: PHASE_LABEL[p] }))}
        />
        <p className="muted small">Switching changes today's targets straight away. Each goal keeps its own targets.</p>
      </div>

      <div className="card stack">
        <h2>Targets</h2>
        <Segmented
          label="Targets to edit"
          value={editing ?? settings.phase}
          onChange={setEditing}
          options={(['cut', 'maintain', 'bulk'] as const).map((p) => ({ value: p, label: PHASE_LABEL[p] }))}
        />
        <TargetsEditor
          value={settings.targets[editing ?? settings.phase]}
          onChange={(t) => saveSettings({ targets: { ...settings.targets, [editing ?? settings.phase]: t } })}
        />
      </div>

      <DetailsSection settings={settings} />

      {import.meta.env.VITE_FLAVOR !== 'play' && (
        <div className="card stack">
          <h2>Extra features</h2>
          <label className="toggle">
            <input type="checkbox" checked={settings.showCycleLog} onChange={(e) => saveSettings({ showCycleLog: e.target.checked })} />
            <span>Cycle log (compounds, injection days and site rotation). Also adds before / mid / after blood test reminders.</span>
          </label>
        </div>
      )}

      <RemindersSection settings={settings} />

      <RangesSection settings={settings} />

      <BackupSection settings={settings} />

      <InstallHint />

      <div className="card about">
        <img src="favicon.svg" alt="" width={56} height={56} className="logo" />
        <div>
          <strong>BIS Bodybuilding Tracker</strong>
          <p className="muted small">
            Version {APP_VERSION} ({FLAVOR}). All your data stays on this device. The only thing sent anywhere is food lookups to Open Food Facts.
          </p>
          <p className="small">
            <a href="https://github.com/saulm123/bis-bodybuilding-tracker">Source code</a> · <a href="privacy.html">Privacy policy</a> · MIT licence
          </p>
        </div>
      </div>
    </section>
  )
}
