// Default blood markers with typical UK adult male reference ranges.
// Labs differ, so every range can be changed in the app to match your report.

export interface Marker {
  key: string
  name: string
  unit: string
  low?: number
  high?: number
  note?: string
}

export const MARKERS: Marker[] = [
  { key: 'haematocrit', name: 'Haematocrit', unit: '%', low: 40, high: 52, note: 'Reports may show L/L: 0.48 L/L = 48%.' },
  { key: 'haemoglobin', name: 'Haemoglobin', unit: 'g/L', low: 130, high: 170 },
  { key: 'totalChol', name: 'Total cholesterol', unit: 'mmol/L', high: 5 },
  { key: 'hdl', name: 'HDL', unit: 'mmol/L', low: 1 },
  { key: 'ldl', name: 'LDL', unit: 'mmol/L', high: 3 },
  { key: 'trig', name: 'Triglycerides', unit: 'mmol/L', high: 1.7 },
  { key: 'alt', name: 'ALT (liver)', unit: 'U/L', high: 45 },
  { key: 'ast', name: 'AST (liver)', unit: 'U/L', high: 40 },
  { key: 'ggt', name: 'GGT (liver)', unit: 'U/L', high: 60 },
  { key: 'creatinine', name: 'Creatinine (kidney)', unit: 'µmol/L', low: 60, high: 120, note: 'Runs higher with more muscle and with creatine.' },
  { key: 'egfr', name: 'eGFR (kidney)', unit: 'mL/min', low: 60 },
  { key: 'oestradiol', name: 'Oestradiol', unit: 'pmol/L', low: 40, high: 160 },
  { key: 'prolactin', name: 'Prolactin', unit: 'mIU/L', low: 86, high: 324 },
  { key: 'testosterone', name: 'Total testosterone', unit: 'nmol/L', low: 8.6, high: 29 },
]

export type Flag = 'low' | 'high' | 'ok'

export function rangeFor(m: Marker, overrides?: Record<string, { low?: number; high?: number }>) {
  const o = overrides?.[m.key]
  return { low: o && 'low' in o ? o.low : m.low, high: o && 'high' in o ? o.high : m.high }
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
