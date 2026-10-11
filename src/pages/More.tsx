import { useState } from 'react'
import { useSettings, saveSettings } from '../db/settings'
import Segmented from '../components/Segmented'
import Stepper from '../components/Stepper'
import TargetsEditor from '../components/TargetsEditor'
import BackupSection from '../components/BackupSection'
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
        <h2>Bulk or cut</h2>
        <Segmented
          label="Phase"
          value={settings.phase}
          onChange={(phase) => saveSettings({ phase })}
          options={[
            { value: 'bulk', label: 'Bulk' },
            { value: 'cut', label: 'Cut' },
          ]}
        />
        <p className="muted small">Switching changes today's targets straight away. Both sets of targets are kept.</p>
      </div>

      <div className="card stack">
        <h2>Targets</h2>
        <Segmented
          label="Targets to edit"
          value={editing ?? settings.phase}
          onChange={setEditing}
          options={[
            { value: 'bulk', label: 'Bulk targets' },
            { value: 'cut', label: 'Cut targets' },
          ]}
        />
        <TargetsEditor
          value={settings.targets[editing ?? settings.phase]}
          onChange={(t) => saveSettings({ targets: { ...settings.targets, [editing ?? settings.phase]: t } })}
        />
      </div>

      <div className="card stack">
        <h2>Body</h2>
        <Stepper label="Height" value={settings.heightCm} min={120} max={230} suffix="cm" onChange={(heightCm) => saveSettings({ heightCm })} />
      </div>

      <BackupSection settings={settings} />

      <div className="card about">
        <img src="favicon.svg" alt="" width={56} height={56} className="logo" />
        <div>
          <strong>BIS Bodybuilding Tracker</strong>
          <p className="muted small">
            Version {APP_VERSION} ({FLAVOR}). All your data stays on this device. The only thing sent anywhere is food lookups to Open Food Facts.
          </p>
        </div>
      </div>
    </section>
  )
}
