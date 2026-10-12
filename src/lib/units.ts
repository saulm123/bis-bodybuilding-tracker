import type { Units } from '../db/schema'
import { useSettings } from '../db/settings'

// Everything is stored in kg and cm. These helpers convert for display and input.
export const KG_PER_LB = 0.45359237

export interface UnitHelpers {
  units: Units
  /** 'kg' or 'lb' */
  w: string
  /** kg → number shown on screen */
  fromKg: (kg: number) => number
  /** number typed on screen → kg */
  toKg: (shown: number) => number
  /** e.g. "86.4 kg" / "190.5 lb" */
  fmtW: (kg: number, decimals?: number) => string
  /** Sensible step for a body-weight stepper */
  bodyStep: number
}

export function unitHelpers(units: Units): UnitHelpers {
  const imperial = units === 'imperial'
  const fromKg = (kg: number) => (imperial ? kg / KG_PER_LB : kg)
  const toKg = (n: number) => (imperial ? n * KG_PER_LB : n)
  const w = imperial ? 'lb' : 'kg'
  return {
    units,
    w,
    fromKg,
    toKg,
    fmtW: (kg, decimals = 1) => `${+fromKg(kg).toFixed(decimals)} ${w}`,
    bodyStep: imperial ? 0.2 : 0.1,
  }
}

export function useUnits(): UnitHelpers {
  const settings = useSettings()
  return unitHelpers(settings?.units ?? 'metric')
}

/** Round a shown number for display without float noise (e.g. 225.00000001 → 225). */
export function tidy(n: number, decimals = 1): number {
  return +n.toFixed(decimals)
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const total = Math.round(cm / 2.54)
  return { ft: Math.floor(total / 12), inch: total % 12 }
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54)
}

/** Plate-friendly increment in kg: 2.5 kg ≈ 5 lb, 1 kg ≈ 2.5 lb, 5 kg ≈ 10 lb. */
export function incrementFor(units: Units, kgIncrement: number): number {
  if (units === 'metric' || kgIncrement === 0) return kgIncrement
  const lb = kgIncrement >= 5 ? 10 : kgIncrement >= 2 ? 5 : 2.5
  return lb * KG_PER_LB
}
