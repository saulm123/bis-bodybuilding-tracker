import { useSettings } from '../db/settings'
import MacroSummary from '../components/MacroSummary'
import BackupBanner from '../components/BackupBanner'

export default function Today() {
  const settings = useSettings()
  if (!settings) return null
  const t = settings.targets[settings.phase]
  return (
    <section className="stack">
      <BackupBanner settings={settings} />
      <div className="row-between">
        <h1>Today</h1>
        <span className={`pill pill-${settings.phase}`}>{settings.phase === 'bulk' ? 'Bulking' : 'Cutting'}</span>
      </div>
      <div className="card">
        <h2>Daily targets</h2>
        <MacroSummary t={t} />
      </div>
      <p className="muted">Food logging arrives in Phase 3, workouts in Phase 2.</p>
    </section>
  )
}
