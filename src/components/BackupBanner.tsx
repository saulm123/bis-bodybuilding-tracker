import { Link } from 'react-router-dom'
import type { Settings } from '../db/schema'
import { daysBetween } from '../lib/dates'

/** Nags when the last backup is older than the reminder setting. Data only lives on this phone. */
export default function BackupBanner({ settings }: { settings: Settings }) {
  const since = daysBetween(settings.lastBackupAt ?? settings.createdAt)
  if (since < settings.backupReminderDays) return null
  return (
    <div className="banner">
      <span>{settings.lastBackupAt ? `Last backup was ${since} days ago.` : "You haven't backed up yet."} Your data only lives on this phone.</span>
      <Link to="/more" className="btn btn-small">Back up</Link>
    </div>
  )
}
