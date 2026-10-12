import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEMOS, demoFor } from './demos'
import { PLANS } from './templates'
import { defaultDays } from './defaultProgram'

describe('exercise demos', () => {
  it('every exercise in every plan has a demo', () => {
    const missing: string[] = []
    for (const days of [...PLANS.map((p) => p.days()), defaultDays()])
      for (const d of days) for (const e of d.exercises) if (!demoFor(e)) missing.push(`${e.id} ${e.name}`)
    expect(missing).toEqual([])
  })

  it('every demo has its photos (and clip, if it says so)', () => {
    for (const d of Object.values(DEMOS)) {
      expect(existsSync(`public/demos/${d.slug}/0.jpg`), d.slug).toBe(true)
      expect(existsSync(`public/demos/${d.slug}/1.jpg`), d.slug).toBe(true)
      if (d.clip) expect(existsSync(`public/demos/${d.slug}/clip.mp4`), d.slug).toBe(true)
      expect(d.cues.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('matches by name for older plans', () => {
    expect(demoFor({ id: 'ex1', name: 'Incline DB press' })?.slug).toBe('incline-db-press')
    expect(demoFor({ id: 'ex99', name: 'Pull-up (or assisted)' })?.slug).toBe('pull-up')
  })
})
