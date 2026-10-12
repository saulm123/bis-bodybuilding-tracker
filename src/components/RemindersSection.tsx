import type { Settings } from '../db/schema'
import { saveSettings } from '../db/settings'
import { notificationsSupported } from '../lib/notify'
import Stepper from './Stepper'

const HAS_CYCLE = import.meta.env.VITE_FLAVOR !== 'play'

function TimeToggle({ label, value, onChange }: { label: string; value?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div className="row-between">
      <label className="toggle grow">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? '08:00' : undefined)} />
        <span>{label}</span>
      </label>
      {value && <input className="input time" type="time" value={value} onChange={(e) => onChange(e.target.value || undefined)} />}
    </div>
  )
}

export default function RemindersSection({ settings }: { settings: Settings }) {
  return (
    <div className="card stack">
      <h2>Reminders</h2>
      {!notificationsSupported() && <p className="muted small">Notifications work in the Android app. The web version shows reminders when you open it.</p>}
      <TimeToggle label="Daily supplements" value={settings.supplementReminder} onChange={(supplementReminder) => saveSettings({ supplementReminder })} />
      {HAS_CYCLE && <TimeToggle label="Injection days" value={settings.injectionReminder} onChange={(injectionReminder) => saveSettings({ injectionReminder })} />}
      <p className="muted small">Blood test reminders are sent at 9:00 on the due date. Rest timer alerts are always on.</p>
      <Stepper
        label={HAS_CYCLE ? 'Routine bloods every (when no cycle is set)' : 'Routine bloods every'}
        value={settings.bloodsIntervalWeeks ?? 12}
        min={2}
        max={52}
        suffix="weeks"
        onChange={(bloodsIntervalWeeks) => saveSettings({ bloodsIntervalWeeks })}
      />
    </div>
  )
}
