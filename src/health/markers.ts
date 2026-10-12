// Default blood markers with typical UK adult reference ranges (male, with female
// ranges where they differ). Labs differ, so every range can be changed in the app.

import type { Sex } from '../db/schema'

interface Range {
  low?: number
  high?: number
}

export interface Marker extends Range {
  key: string
  name: string
  unit: string
  note?: string
  /** Female range where it differs from the male default */
  female?: Range
}

export const MARKERS: Marker[] = [
  { key: 'haematocrit', name: 'Haematocrit', unit: '%', low: 40, high: 52, female: { low: 36, high: 46 }, note: 'Reports may show L/L: 0.48 L/L = 48%.' },
  { key: 'haemoglobin', name: 'Haemoglobin', unit: 'g/L', low: 130, high: 170, female: { low: 115, high: 160 } },
  { key: 'totalChol', name: 'Total cholesterol', unit: 'mmol/L', high: 5 },
  { key: 'hdl', name: 'HDL', unit: 'mmol/L', low: 1, female: { low: 1.2 } },
  { key: 'ldl', name: 'LDL', unit: 'mmol/L', high: 3 },
  { key: 'trig', name: 'Triglycerides', unit: 'mmol/L', high: 1.7 },
  { key: 'alt', name: 'ALT (liver)', unit: 'U/L', high: 45, female: { high: 35 } },
  { key: 'ast', name: 'AST (liver)', unit: 'U/L', high: 40 },
  { key: 'ggt', name: 'GGT (liver)', unit: 'U/L', high: 60, female: { high: 40 } },
  { key: 'creatinine', name: 'Creatinine (kidney)', unit: 'µmol/L', low: 60, high: 120, female: { low: 45, high: 90 }, note: 'Runs higher with more muscle and with creatine.' },
  { key: 'egfr', name: 'eGFR (kidney)', unit: 'mL/min', low: 60 },
  { key: 'oestradiol', name: 'Oestradiol', unit: 'pmol/L', low: 40, high: 160, female: {}, note: 'For women the normal range depends on the point in your cycle; use your lab\u2019s range.' },
  { key: 'prolactin', name: 'Prolactin', unit: 'mIU/L', low: 86, high: 324, female: { low: 102, high: 496 } },
  { key: 'testosterone', name: 'Total testosterone', unit: 'nmol/L', low: 8.6, high: 29, female: { low: 0.3, high: 2.4 } },
]

export type Flag = 'low' | 'high' | 'ok'

export function rangeFor(m: Marker, overrides?: Record<string, Range>, sex: Sex = 'male'): Range {
  const base = sex === 'female' && m.female ? m.female : m
  const o = overrides?.[m.key]
  return { low: o && 'low' in o ? o.low : base.low, high: o && 'high' in o ? o.high : base.high }
}

export function flag(value: number, range: { low?: number; high?: number }): Flag {
  if (range.low !== undefined && value < range.low) return 'low'
  if (range.high !== undefined && value > range.high) return 'high'
  return 'ok'
}

export function rangeText(range: { low?: number; high?: number }): string {
  if (range.low !== undefined && range.high !== undefined) return `${range.low}–${range.high}`
  if (range.high !== undefined) return `under ${range.high}`
  if (range.low !== undefined) return `over ${range.low}`
  return 'no range'
}
