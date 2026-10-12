import type { DayTemplate, ExerciseTemplate, Units } from '../db/schema'
import { incrementFor } from '../lib/units'
import { defaultDays } from './defaultProgram'

// Built-in workout plans. Every plan is fully editable once chosen.
// Exercise ids are shared between plans (e.g. 'bench-press'), so switching plans
// keeps your history and "last time" numbers for the same lift.

type Kind = 'compound' | 'db' | 'isolation' | 'bodyweight'

const ex = (id: string, name: string, sets: number, repMin: number, repMax: number, kind: Kind = 'isolation', extra: Partial<ExerciseTemplate> = {}): ExerciseTemplate => ({
  id,
  name,
  sets,
  repMin,
  repMax,
  restSec: kind === 'compound' ? 150 : kind === 'bodyweight' ? 60 : 90,
  increment: kind === 'compound' ? 2.5 : kind === 'db' ? 2 : kind === 'bodyweight' ? 0 : 1,
  ...extra,
})

const lift = (id: string, weekday: number, name: string, exercises: ExerciseTemplate[]): DayTemplate => ({ id, weekday, name, kind: 'lift', exercises })
const rest = (weekday: number, name = 'Rest'): DayTemplate => ({ id: `rest${weekday}`, weekday, name, kind: 'rest', exercises: [] })

/** Fills any weekdays a plan doesn't use with rest days. */
const week = (days: DayTemplate[]): DayTemplate[] =>
  [1, 2, 3, 4, 5, 6, 7].map((d) => days.find((x) => x.weekday === d) ?? rest(d))

export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export type Equipment = 'Gym' | 'Dumbbells'

export interface PlanTemplate {
  id: string
  name: string
  daysPerWeek: number
  level: Level
  equipment: Equipment
  description: string
  days: () => DayTemplate[]
}

export const PLANS: PlanTemplate[] = [
  {
    id: 'full-body-3',
    name: 'Full body',
    daysPerWeek: 3,
    level: 'Beginner',
    equipment: 'Gym',
    description: 'Three whole-body sessions a week (Mon, Wed, Fri). The best start if you’re new or short on time.',
    days: () =>
      week([
        lift('fb1', 1, 'Full body A', [
          ex('squat', 'Squat', 3, 5, 8, 'compound', { restSec: 180 }),
          ex('bench-press', 'Bench press', 3, 5, 8, 'compound'),
          ex('lat-pulldown', 'Lat pulldown', 3, 8, 12, 'compound', { restSec: 120 }),
          ex('rdl', 'Romanian deadlift', 2, 8, 10, 'compound'),
          ex('lateral-raise', 'Lateral raise', 2, 12, 15, 'db', { restSec: 60 }),
          ex('plank', 'Plank (seconds)', 2, 30, 60, 'bodyweight'),
        ]),
        lift('fb2', 3, 'Full body B', [
          ex('leg-press', 'Leg press', 3, 8, 12, 'compound'),
          ex('overhead-press', 'Overhead press', 3, 6, 10, 'compound'),
          ex('seated-row', 'Seated cable row', 3, 8, 12, 'compound', { restSec: 120 }),
          ex('leg-curl', 'Leg curl', 3, 10, 12),
          ex('incline-db-press', 'Incline dumbbell press', 2, 8, 12, 'db'),
          ex('db-curl', 'Dumbbell curl', 2, 10, 12, 'db', { restSec: 60 }),
        ]),
        lift('fb3', 5, 'Full body C', [
          ex('trap-bar-deadlift', 'Trap bar deadlift', 3, 4, 6, 'compound', { restSec: 180, increment: 5 }),
          ex('incline-db-press', 'Incline dumbbell press', 3, 8, 10, 'db'),
          ex('pull-up', 'Pull-up (or assisted)', 3, 6, 10, 'bodyweight', { restSec: 120 }),
          ex('bulgarian-split-squat', 'Bulgarian split squat', 2, 8, 10, 'db'),
          ex('tricep-pushdown', 'Tricep pushdown', 2, 10, 15),
          ex('hanging-leg-raise', 'Hanging leg raise', 2, 10, 15, 'bodyweight'),
        ]),
      ]),
  },
  {
    id: 'home-db-3',
    name: 'Home dumbbells',
    daysPerWeek: 3,
    level: 'Beginner',
    equipment: 'Dumbbells',
    description: 'Only needs a pair of dumbbells and a bench (or the floor). Mon, Wed, Fri.',
    days: () =>
      week([
        lift('db1', 1, 'Dumbbell A', [
          ex('goblet-squat', 'Goblet squat', 3, 8, 15, 'db'),
          ex('db-bench-press', 'Dumbbell bench / floor press', 3, 8, 12, 'db'),
          ex('one-arm-row', 'One-arm dumbbell row', 3, 8, 12, 'db'),
          ex('db-rdl', 'Dumbbell Romanian deadlift', 3, 8, 12, 'db'),
          ex('lateral-raise', 'Lateral raise', 2, 12, 20, 'db', { restSec: 60 }),
        ]),
        lift('db2', 3, 'Dumbbell B', [
          ex('bulgarian-split-squat', 'Bulgarian split squat', 3, 8, 12, 'db'),
          ex('db-shoulder-press', 'Dumbbell shoulder press', 3, 8, 12, 'db'),
          ex('push-up', 'Push-up', 3, 8, 20, 'bodyweight'),
          ex('db-hip-thrust', 'Dumbbell hip thrust', 3, 10, 15, 'db'),
          ex('db-curl', 'Dumbbell curl', 2, 10, 15, 'db', { restSec: 60 }),
        ]),
        lift('db3', 5, 'Dumbbell C', [
          ex('db-reverse-lunge', 'Reverse lunge', 3, 8, 12, 'db'),
          ex('incline-db-press', 'Incline dumbbell press', 3, 8, 12, 'db'),
          ex('chest-supported-row', 'Chest-supported dumbbell row', 3, 10, 12, 'db'),
          ex('db-overhead-extension', 'Overhead tricep extension', 2, 10, 15, 'db', { restSec: 60 }),
          ex('plank', 'Plank (seconds)', 3, 30, 60, 'bodyweight'),
        ]),
      ]),
  },
  {
    id: 'strength-3',
    name: 'Strength basics',
    daysPerWeek: 3,
    level: 'Intermediate',
    equipment: 'Gym',
    description: 'Heavy barbell lifts for 5s, adding weight whenever you get all your reps. Mon, Wed, Fri.',
    days: () =>
      week([
        lift('st1', 1, 'Strength A', [
          ex('squat', 'Squat', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('bench-press', 'Bench press', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('barbell-row', 'Barbell row', 3, 5, 5, 'compound'),
          ex('db-curl', 'Dumbbell curl', 2, 8, 12, 'db', { restSec: 60 }),
        ]),
        lift('st2', 3, 'Strength B', [
          ex('squat', 'Squat', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('overhead-press', 'Overhead press', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('deadlift', 'Deadlift', 1, 5, 5, 'compound', { restSec: 180, increment: 5 }),
          ex('pull-up', 'Pull-up', 3, 5, 10, 'bodyweight', { restSec: 120 }),
        ]),
        lift('st3', 5, 'Strength A (again)', [
          ex('squat', 'Squat', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('bench-press', 'Bench press', 3, 5, 5, 'compound', { restSec: 180 }),
          ex('barbell-row', 'Barbell row', 3, 5, 5, 'compound'),
          ex('hanging-leg-raise', 'Hanging leg raise', 2, 10, 15, 'bodyweight'),
        ]),
      ]),
  },
  {
    id: 'upper-lower-4',
    name: 'Upper / lower',
    daysPerWeek: 4,
    level: 'Intermediate',
    equipment: 'Gym',
    description: 'Upper body and lower body twice each a week. Mon, Tue, Thu, Fri.',
    days: () =>
      week([
        lift('ul1', 1, 'Upper (heavy)', [
          ex('bench-press', 'Bench press', 4, 5, 8, 'compound', { restSec: 180 }),
          ex('barbell-row', 'Barbell row', 4, 6, 10, 'compound'),
          ex('overhead-press', 'Overhead press', 3, 6, 10, 'compound'),
          ex('lat-pulldown', 'Lat pulldown', 3, 8, 12, 'compound', { restSec: 120 }),
          ex('ez-curl', 'EZ bar curl', 2, 8, 12),
          ex('tricep-pushdown', 'Tricep pushdown', 2, 10, 15),
        ]),
        lift('ul2', 2, 'Lower (heavy)', [
          ex('squat', 'Squat', 4, 5, 8, 'compound', { restSec: 180 }),
          ex('rdl', 'Romanian deadlift', 3, 6, 10, 'compound'),
          ex('leg-press', 'Leg press', 3, 10, 12, 'compound'),
          ex('leg-curl', 'Leg curl', 3, 10, 12),
          ex('calf-raise', 'Calf raise', 4, 10, 15),
        ]),
        lift('ul3', 4, 'Upper (volume)', [
          ex('incline-db-press', 'Incline dumbbell press', 3, 8, 12, 'db', { restSec: 120 }),
          ex('seated-row', 'Seated cable row', 3, 10, 12, 'compound', { restSec: 120 }),
          ex('db-shoulder-press', 'Dumbbell shoulder press', 3, 8, 12, 'db'),
          ex('pull-up', 'Pull-up', 3, 6, 10, 'bodyweight', { restSec: 120 }),
          ex('lateral-raise', 'Lateral raise', 3, 12, 20, 'db', { restSec: 60 }),
          ex('db-curl', 'Dumbbell curl', 2, 10, 12, 'db', { restSec: 60 }),
        ]),
        lift('ul4', 5, 'Lower (volume)', [
          ex('trap-bar-deadlift', 'Trap bar deadlift', 3, 5, 8, 'compound', { restSec: 180, increment: 5 }),
          ex('bulgarian-split-squat', 'Bulgarian split squat', 3, 8, 10, 'db'),
          ex('leg-extension', 'Leg extension', 3, 12, 15),
          ex('leg-curl', 'Leg curl', 3, 12, 15),
          ex('hanging-leg-raise', 'Hanging leg raise', 3, 10, 15, 'bodyweight'),
        ]),
      ]),
  },
  {
    id: 'glutes-4',
    name: 'Glutes & legs focus',
    daysPerWeek: 4,
    level: 'Intermediate',
    equipment: 'Gym',
    description: 'Two lower days built around glutes and legs, two lighter upper days. Mon, Tue, Thu, Fri.',
    days: () =>
      week([
        lift('gl1', 1, 'Lower: glutes', [
          ex('hip-thrust', 'Barbell hip thrust', 4, 8, 12, 'compound'),
          ex('rdl', 'Romanian deadlift', 3, 8, 10, 'compound'),
          ex('bulgarian-split-squat', 'Bulgarian split squat', 3, 8, 12, 'db'),
          ex('cable-kickback', 'Cable kickback', 3, 12, 15, 'isolation', { restSec: 60 }),
          ex('hip-abduction', 'Hip abduction machine', 3, 15, 20, 'isolation', { restSec: 60 }),
        ]),
        lift('gl2', 2, 'Upper', [
          ex('lat-pulldown', 'Lat pulldown', 3, 8, 12, 'compound', { restSec: 120 }),
          ex('db-shoulder-press', 'Dumbbell shoulder press', 3, 8, 12, 'db'),
          ex('seated-row', 'Seated cable row', 3, 10, 12, 'compound', { restSec: 120 }),
          ex('incline-db-press', 'Incline dumbbell press', 3, 8, 12, 'db'),
          ex('lateral-raise', 'Lateral raise', 3, 12, 20, 'db', { restSec: 60 }),
        ]),
        lift('gl3', 4, 'Lower: legs', [
          ex('squat', 'Squat', 4, 6, 10, 'compound', { restSec: 180 }),
          ex('leg-press', 'Leg press (feet high)', 3, 10, 15, 'compound'),
          ex('walking-lunge', 'Walking lunge', 3, 10, 12, 'db'),
          ex('leg-curl', 'Leg curl', 3, 10, 15),
          ex('hip-abduction', 'Hip abduction machine', 3, 15, 20, 'isolation', { restSec: 60 }),
        ]),
        lift('gl4', 5, 'Upper & core', [
          ex('pull-up', 'Pull-up (or assisted)', 3, 6, 10, 'bodyweight', { restSec: 120 }),
          ex('db-bench-press', 'Dumbbell bench press', 3, 8, 12, 'db'),
          ex('face-pull', 'Face pull', 3, 12, 15),
          ex('tricep-pushdown', 'Tricep pushdown', 2, 10, 15),
          ex('hanging-leg-raise', 'Hanging leg raise', 3, 10, 15, 'bodyweight'),
        ]),
      ]),
  },
  {
    id: 'ppl-ul-5',
    name: 'Push / pull / legs + upper / lower',
    daysPerWeek: 5,
    level: 'Intermediate',
    equipment: 'Gym',
    description: 'Bodybuilding split: push, pull, legs, then upper and lower. Mon–Wed, Fri, Sat, with optional cardio Thursday.',
    days: defaultDays,
  },
  {
    id: 'ppl-6',
    name: 'Push / pull / legs ×2',
    daysPerWeek: 6,
    level: 'Advanced',
    equipment: 'Gym',
    description: 'Each muscle twice a week with lots of volume. Mon–Sat. For experienced lifters with time to recover.',
    days: () =>
      week([
        lift('p1', 1, 'Push (heavy)', [
          ex('bench-press', 'Bench press', 4, 5, 8, 'compound', { restSec: 180 }),
          ex('overhead-press', 'Overhead press', 3, 6, 10, 'compound'),
          ex('incline-db-press', 'Incline dumbbell press', 3, 8, 12, 'db'),
          ex('lateral-raise', 'Lateral raise', 4, 12, 20, 'db', { restSec: 60 }),
          ex('tricep-pushdown', 'Tricep pushdown', 3, 10, 15),
        ]),
        lift('pl1', 2, 'Pull (heavy)', [
          ex('deadlift', 'Deadlift', 3, 4, 6, 'compound', { restSec: 180, increment: 5 }),
          ex('pull-up', 'Weighted pull-up', 3, 6, 8, 'compound'),
          ex('barbell-row', 'Barbell row', 3, 6, 10, 'compound'),
          ex('face-pull', 'Face pull', 3, 12, 15),
          ex('ez-curl', 'EZ bar curl', 3, 8, 12),
        ]),
        lift('l1', 3, 'Legs (heavy)', [
          ex('squat', 'Squat', 4, 5, 8, 'compound', { restSec: 180 }),
          ex('rdl', 'Romanian deadlift', 3, 8, 10, 'compound'),
          ex('leg-press', 'Leg press', 3, 10, 12, 'compound'),
          ex('leg-curl', 'Leg curl', 3, 10, 12),
          ex('calf-raise', 'Calf raise', 4, 10, 15),
        ]),
        lift('p2', 4, 'Push (volume)', [
          ex('incline-db-press', 'Incline dumbbell press', 4, 8, 12, 'db', { restSec: 120 }),
          ex('machine-press', 'Machine chest press', 3, 10, 12, 'compound'),
          ex('db-shoulder-press', 'Dumbbell shoulder press', 3, 8, 12, 'db'),
          ex('cable-fly', 'Cable fly', 3, 12, 15),
          ex('lateral-raise', 'Lateral raise', 4, 15, 20, 'db', { restSec: 60 }),
          ex('overhead-cable-extension', 'Overhead cable extension', 3, 10, 15),
        ]),
        lift('pl2', 5, 'Pull (volume)', [
          ex('lat-pulldown', 'Lat pulldown', 4, 8, 12, 'compound', { restSec: 120 }),
          ex('chest-supported-row', 'Chest-supported row', 4, 8, 12, 'compound'),
          ex('single-arm-cable-row', 'Single-arm cable row', 3, 10, 12),
          ex('rear-delt-fly', 'Rear delt fly', 3, 15, 20),
          ex('incline-db-curl', 'Incline dumbbell curl', 3, 10, 12, 'db'),
          ex('hammer-curl', 'Hammer curl', 2, 12, 15, 'db'),
        ]),
        lift('l2', 6, 'Legs (volume)', [
          ex('hack-squat', 'Hack squat', 4, 8, 12, 'compound', { restSec: 150 }),
          ex('bulgarian-split-squat', 'Bulgarian split squat', 3, 8, 12, 'db'),
          ex('leg-extension', 'Leg extension', 3, 12, 15),
          ex('leg-curl', 'Leg curl', 4, 10, 15),
          ex('calf-raise', 'Calf raise', 4, 12, 20),
          ex('hanging-leg-raise', 'Hanging leg raise', 3, 10, 15, 'bodyweight'),
        ]),
      ]),
  },
]

/** The plan's days, with weight increments converted to plate-friendly pounds if needed. */
export function planDays(plan: PlanTemplate, units: Units): DayTemplate[] {
  return plan.days().map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e, increment: incrementFor(units, e.increment) })) }))
}

/** Suggests a plan from days available and equipment. */
export function recommendPlan(daysPerWeek: number, equipment: Equipment, level: Level): PlanTemplate {
  if (equipment === 'Dumbbells') return PLANS.find((p) => p.id === 'home-db-3')!
  if (daysPerWeek <= 3) return PLANS.find((p) => p.id === (level === 'Beginner' ? 'full-body-3' : 'strength-3'))!
  if (daysPerWeek === 4) return PLANS.find((p) => p.id === 'upper-lower-4')!
  if (daysPerWeek === 5) return PLANS.find((p) => p.id === 'ppl-ul-5')!
  return PLANS.find((p) => p.id === (level === 'Advanced' ? 'ppl-6' : 'ppl-ul-5'))!
}

