import 'fake-indexeddb/auto'
import { beforeEach, expect, it } from 'vitest'
import { db } from '../db/schema'
import { saveSettings } from '../db/settings'
import { ensureSupplements } from './store'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await saveSettings({ onboarded: true })
})

it('adds the starter supplements once, even when called twice at the same time', async () => {
  await Promise.all([ensureSupplements(), ensureSupplements()])
  await ensureSupplements()
  expect(await db.supplements.count()).toBe(7)
})
