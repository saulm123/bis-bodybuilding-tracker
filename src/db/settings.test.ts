import { expect, it } from 'vitest'
import { normalizeSettings } from './settings'

it('upgrades a pre-0.4 install without losing anything', () => {
  const old = {
    id: 'app' as const, onboarded: true, heightCm: 191, phase: 'bulk' as const,
    targets: { bulk: { kcal: 3500, protein: 200, netCarbs: 150 }, cut: { kcal: 2700, protein: 220, netCarbs: 100 } },
    backupReminderDays: 7, createdAt: '', updatedAt: '',
  }
  const s = normalizeSettings(old as never)
  expect(s).toMatchObject({ sex: 'male', showCycleLog: true, units: 'metric', phase: 'bulk', heightCm: 191 })
  expect(s.targets.bulk).toEqual({ kcal: 3500, protein: 200, netCarbs: 150 })
  expect(s.targets.maintain).toEqual({ kcal: 3100, protein: 210, netCarbs: 125 })
})

it('new installs start with the cycle log hidden', () => {
  expect(normalizeSettings(undefined).showCycleLog).toBe(false)
  expect(normalizeSettings({ onboarded: true, sex: 'female' } as never).showCycleLog).toBe(false)
})
