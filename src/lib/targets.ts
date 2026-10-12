import type { Activity, DietStyle, MacroTargets, Phase, Sex } from '../db/schema'
import { KCAL_PER_G } from './macros'

// Works out starting calorie and macro targets from your details.
// Mifflin-St Jeor for resting energy, times an activity factor for maintenance,
// then a surplus (bulk) or deficit (cut). These are starting points: the weight
// trend fine-tunes them every two weeks.

export const ACTIVITY: Record<Activity, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Mostly sitting', hint: 'Desk job, little exercise' },
  light: { factor: 1.375, label: 'Lightly active', hint: 'Desk job, train 2–3× a week' },
  moderate: { factor: 1.55, label: 'Active', hint: 'On your feet a lot or train 3–5× a week' },
  physicalJob: { factor: 1.725, label: 'Very active', hint: 'Physical job and you train' },
  veryActive: { factor: 1.9, label: 'Extremely active', hint: 'Hard physical job and hard training' },
}

export const DIET: Record<DietStyle, { label: string; hint: string }> = {
  balanced: { label: 'Balanced', hint: 'Carbs about 40% of calories' },
  lowCarb: { label: 'Low carb', hint: 'About 100 g net carbs' },
  keto: { label: 'Keto / carnivore', hint: 'About 30 g net carbs' },
}

export interface Details {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  dietStyle: DietStyle
}

export function bmr({ sex, age, heightCm, weightKg }: Pick<Details, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

export function maintenanceKcal(d: Details): number {
  return round(bmr(d) * ACTIVITY[d.activity].factor, 50)
}

const PROTEIN_G_PER_KG: Record<Phase, number> = { cut: 2.2, maintain: 1.8, bulk: 2.0 }

export function computeTargets(d: Details): Record<Phase, MacroTargets> {
  const tdee = maintenanceKcal(d)
  const kcal: Record<Phase, number> = {
    // ~20% deficit (300–700 kcal) and ~10% surplus (200–450 kcal)
    cut: round(tdee - clamp(tdee * 0.2, 300, 700), 50),
    maintain: tdee,
    bulk: round(tdee + clamp(tdee * 0.1, 200, 450), 50),
  }
  const out = {} as Record<Phase, MacroTargets>
  for (const phase of ['cut', 'maintain', 'bulk'] as Phase[]) {
    // Protein capped so very heavy people don't get silly numbers.
    const protein = round(Math.min(d.weightKg * PROTEIN_G_PER_KG[phase], 260), 5)
    let netCarbs = d.dietStyle === 'keto' ? 30 : d.dietStyle === 'lowCarb' ? 100 : round((kcal[phase] * 0.4) / KCAL_PER_G.carbs, 5)
    // Keep at least 0.6 g/kg of fat (hormones need it): take it from carbs if necessary.
    const minFatKcal = d.weightKg * 0.6 * KCAL_PER_G.fat
    const left = kcal[phase] - protein * KCAL_PER_G.protein - netCarbs * KCAL_PER_G.carbs
    if (left < minFatKcal) netCarbs = Math.max(0, round(netCarbs - (minFatKcal - left) / KCAL_PER_G.carbs, 5))
    out[phase] = { kcal: kcal[phase], protein, netCarbs }
  }
  return out
}

export function ageFrom(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear
}

function round(n: number, step: number) {
  return Math.round(n / step) * step
}
function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}
