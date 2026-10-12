import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso, type MacroTargets, type Settings } from './schema'
import { DEFAULT_TARGETS } from '../lib/macros'
import { isoDate } from '../lib/dates'

export function defaultSettings(): Settings {
  const now = nowIso()
  return {
    id: 'app',
    onboarded: false,
    heightCm: 175,
    sex: 'male',
    birthYear: new Date().getFullYear() - 30,
    activity: 'moderate',
    dietStyle: 'balanced',
    units: 'metric',
    showCycleLog: false,
    phase: 'maintain',
    targets: structuredClone(DEFAULT_TARGETS),
    backupReminderDays: 7,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Fills in fields added in later versions, so older saved settings still work.
 * Installs from before 0.4.0 were set up for one person: male, with the cycle log shown.
 */
export function normalizeSettings(saved: Partial<Settings> | undefined): Settings {
  const base = defaultSettings()
  if (!saved) return base
  const legacy = saved.onboarded && saved.sex === undefined
  return {
    ...base,
    ...(legacy ? { sex: 'male' as const, showCycleLog: true, activity: 'physicalJob' as const } : {}),
    ...saved,
    targets: {
      ...base.targets,
      // Old installs had no "maintain": start it halfway between cut and bulk.
      ...(saved.targets && !saved.targets.maintain && saved.targets.cut && saved.targets.bulk
        ? { maintain: midpoint(saved.targets.cut, saved.targets.bulk) }
        : {}),
      ...saved.targets,
    },
  } as Settings
}

function midpoint(a: MacroTargets, b: MacroTargets): MacroTargets {
  const r5 = (n: number) => Math.round(n / 5) * 5
  return { kcal: r5((a.kcal + b.kcal) / 2), protein: r5((a.protein + b.protein) / 2), netCarbs: r5((a.netCarbs + b.netCarbs) / 2) }
}

/** Live settings. `undefined` while loading; defaults if nothing saved yet. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => normalizeSettings(await db.settings.get('app')), [])
}

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await db.settings.get('app'))
}

export async function saveSettings(patch: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<void> {
  const current = await getSettings()
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

export async function completeOnboarding(
  input: Pick<Settings, 'heightCm' | 'sex' | 'birthYear' | 'activity' | 'dietStyle' | 'units' | 'phase' | 'targets'> & { weightKg: number },
): Promise<void> {
  const { weightKg, ...details } = input
  await db.transaction('rw', db.settings, db.weights, async () => {
    await saveSettings({ ...details, onboarded: true })
    await logWeight(weightKg)
  })
}
