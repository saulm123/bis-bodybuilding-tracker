import type { MacroTargets, Phase } from '../db/schema'

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/** Fallback targets before anything is worked out from your details. */
export const DEFAULT_TARGETS: Record<Phase, MacroTargets> = {
  cut: { kcal: 2200, protein: 170, netCarbs: 150 },
  maintain: { kcal: 2600, protein: 150, netCarbs: 250 },
  bulk: { kcal: 2900, protein: 160, netCarbs: 300 },
}

export const PHASE_LABEL: Record<Phase, string> = { cut: 'Cut', maintain: 'Maintain', bulk: 'Bulk' }
export const PHASE_STATUS: Record<Phase, string> = { cut: 'Cutting', maintain: 'Maintaining', bulk: 'Bulking' }

/** Grams of fat that fill the calories left after protein and carbs (never below 0). */
export function fatGrams(t: MacroTargets): number {
  const left = t.kcal - t.protein * KCAL_PER_G.protein - t.netCarbs * KCAL_PER_G.carbs
  return Math.max(0, Math.round(left / KCAL_PER_G.fat))
}

/** True when protein and carbs alone already use up the calorie target. */
export function isOverBudget(t: MacroTargets): boolean {
  return t.protein * KCAL_PER_G.protein + t.netCarbs * KCAL_PER_G.carbs > t.kcal
}
