import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useSettings } from '../db/settings'
import { syncReminders } from '../health/reminders'
import { notificationsSupported } from '../lib/notify'

/** Keeps Android's scheduled reminders in line with your data. Renders nothing. */
export default function ReminderSync() {
  const settings = useSettings()
  // Re-sync when anything that affects reminders changes.
  const stamp = useLiveQuery(async () => {
    const [c, i, p] = await Promise.all([db.cycles.count(), db.injections.count(), db.bloodPanels.count()])
    const latest = await db.cycles.orderBy('updatedAt').last()
    return `${c}-${i}-${p}-${latest?.updatedAt ?? ''}`
  }, [])

  useEffect(() => {
    if (!settings?.onboarded || !notificationsSupported() || stamp === undefined) return
    syncReminders(settings).catch(() => {})
    // Only these fields matter; re-running on every settings save would re-ask permission needlessly.
  }, [settings?.supplementReminder, settings?.injectionReminder, settings?.bloodsIntervalWeeks, settings?.onboarded, settings?.showCycleLog, settings?.checkInReminder, settings?.checkInDay, stamp])

  return null
}
