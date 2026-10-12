import { expect, it } from 'vitest'
import { MARKERS, rangeFor } from './markers'

it('uses female ranges where they differ, and your own overrides first', () => {
  const hct = MARKERS.find((m) => m.key === 'haematocrit')!
  expect(rangeFor(hct, undefined, 'male')).toEqual({ low: 40, high: 52 })
  expect(rangeFor(hct, undefined, 'female')).toEqual({ low: 36, high: 46 })
  expect(rangeFor(hct, { haematocrit: { low: 38, high: 50 } }, 'female')).toEqual({ low: 38, high: 50 })
  const ldl = MARKERS.find((m) => m.key === 'ldl')!
  expect(rangeFor(ldl, undefined, 'female')).toEqual({ low: undefined, high: 3 })
})
