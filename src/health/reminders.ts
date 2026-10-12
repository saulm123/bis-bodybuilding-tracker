import { LocalNotifications } from '@capacitor/local-notifications'
import { db, type Settings } from '../db/schema'
import { isoDate } from '../lib/dates'
import { cancelNotifications, notificationsSupported, NOTIFY, ensureNotificationPermission } from '../lib/notify'
import { HAS_CYCLE_LOG } from '../flavor'
import { bloodsDue, dosesFor } from './schedule'
import { currentCycle } from './store'

const at = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d
}

const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i)

/**
 * Re-schedules every reminder from the current data. Called on start-up and when
 * settings change. Android app only; does nothing in the browser.
 */
export async function syncReminders(settings: Settings): Promise<void> {
  if (!notificationsSupported()) return
  await cancelNotifications([NOTIFY.supplementsDaily, NOTIFY.checkInWeekly, ...range(NOTIFY.injectionBase, 30), ...range(NOTIFY.bloodsBase, 5)])

  const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = []
  const now = Date.now()

  if (settings.supplementReminder) {
    const [hour, minute] = settings.supplementReminder.split(':').map(Number)
    notifications.push({ id: NOTIFY.supplementsDaily, title: 'Supplements', body: 'Tick off today’s supplements.', schedule: { on: { hour, minute }, allowWhileIdle: true } })
  }

  if (settings.checkInReminder) {
    const [hour, minute] = settings.checkInReminder.split(':').map(Number)
    // Capacitor counts weekdays from Sunday = 1; ours start Monday = 1.
    const weekday = ((settings.checkInDay ?? 1) % 7) + 1
    notifications.push({ id: NOTIFY.checkInWeekly, title: 'Weekly check-in', body: 'Time for your photos and weigh-in.', schedule: { on: { weekday, hour, minute }, allowWhileIdle: true } })
  }

  const cycle = HAS_CYCLE_LOG && settings.showCycleLog ? await currentCycle() : undefined
  if (HAS_CYCLE_LOG && cycle && settings.injectionReminder) {
    const injections = await db.injections.where('cycleId').equals(cycle.id).toArray()
    let id = NOTIFY.injectionBase
    for (let i = 0; i < 21 && id < NOTIFY.injectionBase + 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const date = isoDate(d)
      const due = dosesFor(cycle, date, injections).filter((x) => !x.logged)
      const when = at(date, settings.injectionReminder)
      if (due.length && when.getTime() > now) {
        notifications.push({ id: id++, title: 'Injection day', body: due.map((x) => x.compound.name).join(', '), schedule: { at: when, allowWhileIdle: true } })
      }
    }
  }

  const panels = await db.bloodPanels.toArray()
  let bid = NOTIFY.bloodsBase
  for (const due of bloodsDue(panels, cycle, isoDate(), settings.bloodsIntervalWeeks ?? 12)) {
    const when = at(due.date, '09:00')
    if (due.status === 'upcoming' && when.getTime() > now && bid < NOTIFY.bloodsBase + 5) {
      notifications.push({ id: bid++, title: 'Blood test due', body: due.label, schedule: { at: when, allowWhileIdle: true } })
    }
  }

  // Only asks for notification permission when there's actually something to remind you about.
  if (notifications.length && (await ensureNotificationPermission())) await LocalNotifications.schedule({ notifications })
}
