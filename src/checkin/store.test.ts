import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/schema'
import { checkInDue, deleteCheckIn, saveCheckIn } from './store'

const img = (n: number) => ({ blob: new Blob([new Uint8Array(n)], { type: 'image/jpeg' }), width: 10, height: 20 })

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('weekly check-in', () => {
  it('works out when a check-in is due', () => {
    expect(checkInDue(undefined, '2026-10-12')).toBe(true)
    expect(checkInDue('2026-10-05', '2026-10-12')).toBe(true) // a week
    expect(checkInDue('2026-10-08', '2026-10-12', 1)).toBe(false) // Monday, but only 4 days
    expect(checkInDue('2026-10-07', '2026-10-12', 1)).toBe(true) // Monday, 5 days
    expect(checkInDue('2026-10-07', '2026-10-13', 1)).toBe(false) // Tuesday, 6 days
  })

  it('saves, replaces, removes and deletes photos', async () => {
    const id = await saveCheckIn({ date: '2026-10-12', weightKg: 86, photos: { front: img(5), side: img(6) } })
    expect(await db.photos.where('checkInId').equals(id).count()).toBe(2)
    await saveCheckIn({ id, date: '2026-10-12', weightKg: 86.2, photos: { front: img(7), side: null } })
    const photos = await db.photos.where('checkInId').equals(id).toArray()
    expect(photos.map((p) => [p.pose, p.blob.size])).toEqual([['front', 7]])
    expect((await db.checkIns.get(id))?.weightKg).toBe(86.2)
    await deleteCheckIn(id)
    expect(await db.photos.count()).toBe(0)
    expect(await db.checkIns.count()).toBe(0)
  })
})
