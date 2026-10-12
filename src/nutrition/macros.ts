import type { Food, FoodLogEntry, MacroTargets } from '../db/schema'
import { fatGrams } from '../lib/macros'

export interface Totals {
  kcal: number
  protein: number
  netCarbs: number
  fat: number
}

export const ZERO: Totals = { kcal: 0, protein: 0, netCarbs: 0, fat: 0 }

export function netCarbsPer100(food: Pick<Food, 'per100' | 'carbsIncludeFiber'>): number {
  const { carbs, fiber } = food.per100
  return food.carbsIncludeFiber ? Math.max(0, carbs - fiber) : carbs
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Macros for a given weight of a food. */
export function macrosFor(food: Pick<Food, 'per100' | 'carbsIncludeFiber'>, grams: number): Totals {
  const k = grams / 100
  return {
    kcal: Math.round(food.per100.kcal * k),
    protein: r1(food.per100.protein * k),
    netCarbs: r1(netCarbsPer100(food) * k),
    fat: r1(food.per100.fat * k),
  }
}

export function sum(entries: Totals[]): Totals {
  return entries.reduce(
    (t, e) => ({ kcal: t.kcal + e.kcal, protein: t.protein + e.protein, netCarbs: t.netCarbs + e.netCarbs, fat: t.fat + e.fat }),
    { ...ZERO },
  )
}

export function targetTotals(t: MacroTargets): Totals {
  return { kcal: t.kcal, protein: t.protein, netCarbs: t.netCarbs, fat: fatGrams(t) }
}

export function entryTotals(e: FoodLogEntry): Totals {
  return { kcal: e.kcal, protein: e.protein, netCarbs: e.netCarbs, fat: e.fat }
}
