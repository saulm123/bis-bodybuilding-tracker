import { db, newId, nowIso, type BpReading, type Cycle, type Supplement } from '../db/schema'

const DEFAULT_SUPPLEMENTS: [string, Supplement['timing']][] = [
  ['Omega-3', 'AM'],
  ['Creatine', 'AM'],
  ['D3 + K2', 'AM'],
  ['Garlic', 'AM'],
  ['GlyNAC', 'AM'],
  ['Magnesium glycinate', 'PM'],
  ['L-theanine', 'PM'],
]

let seeding: Promise<void> | undefined

/** Adds the starter supplement list once. Edit or remove them afterwards. */
export function ensureSupplements(): Promise<void> {
  // One transaction (and one shared promise) so two callers at once can't both add the list.
  seeding ??= db.transaction('rw', db.settings, db.supplements, async () => {
    const settings = await db.settings.get('app')
    if (!settings || settings.supplementsSeeded) return
    const now = nowIso()
    if ((await db.supplements.count()) === 0) {
      await db.supplements.bulkAdd(
        DEFAULT_SUPPLEMENTS.map(([name, timing], order) => ({ id: newId(), name, timing, order, active: true, createdAt: now, updatedAt: now })),
      )
    }
    await db.settings.update('app', { supplementsSeeded: true, updatedAt: now })
  }).finally(() => {
    seeding = undefined
  })
  return seeding
}

export async function toggleSupplement(supplementId: string, date: string): Promise<void> {
  const existing = await db.supplementLog.where('[date+supplementId]').equals([date, supplementId]).first()
  if (existing) await db.supplementLog.delete(existing.id)
  else await db.supplementLog.add({ id: newId(), date, supplementId, createdAt: nowIso(), updatedAt: nowIso() })
}

export async function saveSupplement(s: Partial<Supplement> & { name: string }): Promise<void> {
  const now = nowIso()
  const order = s.order ?? (await db.supplements.count())
  await db.supplements.put({ timing: 'AM', active: true, ...s, order, id: s.id ?? newId(), createdAt: s.createdAt ?? now, updatedAt: now } as Supplement)
}

export async function saveBp(r: Omit<BpReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = nowIso()
  await db.bp.add({ ...r, id: newId(), createdAt: now, updatedAt: now })
}

export async function saveCycle(c: Omit<Cycle, 'createdAt' | 'updatedAt' | 'id'> & { id?: string; createdAt?: string }): Promise<string> {
  const now = nowIso()
  const id = c.id ?? newId()
  await db.cycles.put({ ...c, id, createdAt: c.createdAt ?? now, updatedAt: now })
  return id
}

/** The cycle running today, else the most recent one. */
export async function currentCycle(): Promise<Cycle | undefined> {
  const all = await db.cycles.orderBy('startDate').reverse().toArray()
  return all[0]
}
