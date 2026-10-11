import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './schema'
import { logWeight, saveSettings } from './settings'
import { BackupError, exportAll, importBackup, parseBackup } from './backup'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('backup', () => {
  it('round-trips everything through replace', async () => {
    await saveSettings({ onboarded: true, phase: 'cut' })
    await logWeight(86.4, '2026-10-01')
    await logWeight(86.9, '2026-10-02')

    const text = JSON.stringify(await exportAll())
    await db.delete()
    await db.open()

    const { records } = await importBackup(parseBackup(text), 'replace')
    expect(records).toBe(3)
    expect((await db.settings.get('app'))?.phase).toBe('cut')
    expect((await db.weights.orderBy('date').toArray()).map((w) => w.kg)).toEqual([86.4, 86.9])
  })

  it('merge keeps local records and replace removes them', async () => {
    await logWeight(85, '2026-09-01')
    const backup = await exportAll()
    await logWeight(87, '2026-10-05')

    await importBackup(backup, 'merge')
    expect(await db.weights.count()).toBe(2)

    await importBackup(backup, 'replace')
    expect(await db.weights.count()).toBe(1)
  })

  it('logging the same day twice keeps one weigh-in', async () => {
    await logWeight(86, '2026-10-01')
    await logWeight(86.5, '2026-10-01')
    expect(await db.weights.count()).toBe(1)
    expect((await db.weights.toArray())[0].kg).toBe(86.5)
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
    expect(() => parseBackup('{"hello":1}')).toThrow(BackupError)
    const future = { app: 'bis-bodybuilding-tracker', schemaVersion: 999, exportedAt: 'x', tables: {} }
    expect(() => parseBackup(JSON.stringify(future))).toThrow(/newer version/)
  })
})
