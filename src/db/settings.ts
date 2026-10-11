import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso, type Phase, type MacroTargets, type Settings } from './schema'
import { DEFAULT_TARGETS } from '../lib/macros'
import { isoDate } from '../lib/dates'

export function defaultSettings(): Settings {
  const now = nowIso()
  return {
    id: 'app',
    onboarded: false,
    heightCm: 190,
    phase: 'bulk',
    targets: structuredClone(DEFAULT_TARGETS),
    backupReminderDays: 7,
    createdAt: now,
    updatedAt: now,
  }
}

/** Live settings. `undefined` while loading; defaults if nothing saved yet. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get('app')) ?? defaultSettings(), [])
}

export async function saveSettings(patch: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<void> {
  const current = (await db.settings.get('app')) ?? defaultSettings()
  await db.settings.put({ ...current, ...patch, updatedAt: nowIso() })
}

/** Adds or replaces the weigh-in for a day (one per day). */
export async function logWeight(kg: number, date = isoDate()): Promise<void> {
  const existing = await db.weights.where('date').equals(date).first()
  const now = nowIso()
  await db.weights.put({
    id: existing?.id ?? newId(),
    date,
    kg,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  })
}

export async function completeOnboarding(input: {
  heightCm: number
  weightKg: number
  phase: Phase
  targets: Record<Phase, MacroTargets>
}): Promise<void> {
  await db.transaction('rw', db.settings, db.weights, async () => {
    await saveSettings({ onboarded: true, heightCm: input.heightCm, phase: input.phase, targets: input.targets })
    await logWeight(input.weightKg)
  })
}
