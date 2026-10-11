import { useSyncExternalStore } from 'react'
import { cancelNotifications, NOTIFY, scheduleNotification } from '../lib/notify'

// The rest timer stores when it ends (not a countdown), so it stays correct if the
// screen turns off or the app is reopened. On Android a notification fires at the
// end time even when the app is in the background.

export interface RestTimer {
  endsAt: number
  total: number
  label: string
}

const KEY = 'bis-rest-timer'
let state: RestTimer | null = load()
const listeners = new Set<() => void>()

function load(): RestTimer | null {
  try {
    const raw = localStorage.getItem(KEY)
    const t = raw ? (JSON.parse(raw) as RestTimer) : null
    return t && t.endsAt > Date.now() - 5000 ? t : null
  } catch {
    return null
  }
}

function set(next: RestTimer | null) {
  state = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable: the timer still works for this session
  }
  listeners.forEach((l) => l())
}

export function startRest(seconds: number, label: string) {
  if (seconds <= 0) return
  const endsAt = Date.now() + seconds * 1000
  set({ endsAt, total: seconds, label })
  scheduleNotification({ id: NOTIFY.restTimer, at: new Date(endsAt), title: 'Rest over', body: `Next set: ${label}` }).catch(() => {})
}

export function addRest(seconds: number) {
  if (!state) return
  const endsAt = Math.max(Date.now(), state.endsAt) + seconds * 1000
  set({ ...state, endsAt, total: state.total + seconds })
  scheduleNotification({ id: NOTIFY.restTimer, at: new Date(endsAt), title: 'Rest over', body: `Next set: ${state.label}` }).catch(() => {})
}

export function stopRest() {
  set(null)
  cancelNotifications([NOTIFY.restTimer]).catch(() => {})
}

export function useRestTimer(): RestTimer | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
