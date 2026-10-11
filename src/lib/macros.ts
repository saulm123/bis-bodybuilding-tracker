import type { MacroTargets, Phase } from '../db/schema'

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/** Starting targets from the plan. Every number is editable in Settings. */
export const DEFAULT_TARGETS: Record<Phase, MacroTargets> = {
  bulk: { kcal: 3500, protein: 200, netCarbs: 150 },
  cut: { kcal: 2700, protein: 220, netCarbs: 100 },
}

/** Grams of fat that fill the calories left after protein and carbs (never below 0). */
export function fatGrams(t: MacroTargets): number {
  const left = t.kcal - t.protein * KCAL_PER_G.protein - t.netCarbs * KCAL_PER_G.carbs
  return Math.max(0, Math.round(left / KCAL_PER_G.fat))
}

/** True when protein and carbs alone already use up the calorie target. */
export function isOverBudget(t: MacroTargets): boolean {
  return t.protein * KCAL_PER_G.protein + t.netCarbs * KCAL_PER_G.carbs > t.kcal
}
