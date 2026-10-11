import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

// Local notifications are scheduled by Android itself (AlarmManager). No server,
// no Google services. In the browser/PWA these are no-ops and the app shows
// in-app reminders instead.

export const notificationsSupported = () => Capacitor.isNativePlatform()

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const asked = await LocalNotifications.requestPermissions()
  return asked.display === 'granted'
}

export async function scheduleNotification(n: { id: number; at: Date; title: string; body: string }): Promise<void> {
  if (!(await ensureNotificationPermission())) return
  await LocalNotifications.schedule({
    notifications: [{ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true } }],
  })
}

export async function cancelNotifications(ids: number[]): Promise<void> {
  if (!notificationsSupported() || !ids.length) return
  await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
}

/** Fixed notification ids so each kind can be replaced or cancelled. */
export const NOTIFY = {
  restTimer: 1001,
  supplementsDaily: 2001,
  // Injection reminders use 3000-3099, bloods reminders 4000-4099.
  injectionBase: 3000,
  bloodsBase: 4000,
} as const
