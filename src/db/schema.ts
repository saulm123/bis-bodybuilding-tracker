import Dexie, { type EntityTable } from 'dexie'

// Dates are stored as local 'YYYY-MM-DD' strings so a day means the same thing
// wherever you are. Timestamps (createdAt/updatedAt) are ISO strings.
// Every record has a string id from crypto.randomUUID().

export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

export type Phase = 'bulk' | 'cut'

/** Fat isn't stored: it fills whatever calories protein and carbs leave. */
export interface MacroTargets {
  kcal: number
  protein: number
  netCarbs: number
}

export interface Settings {
  id: 'app'
  onboarded: boolean
  heightCm: number
  phase: Phase
  targets: Record<Phase, MacroTargets>
  backupReminderDays: number
  lastBackupAt?: string
  /** Training: weeks are counted from the last deload (or the first workout). */
  lastDeloadDate?: string
  deloadUntil?: string
  createdAt: string
  updatedAt: string
}

export interface WeightEntry extends BaseRecord {
  date: string
  kg: number
}

// ---- Training ----

export type DayKind = 'lift' | 'cardio' | 'rest'

export interface ExerciseTemplate {
  id: string
  name: string
  sets: number
  repMin: number
  repMax: number
  /** Seconds of rest after each set. */
  restSec: number
  /** kg to add when you hit the top of the rep range on every set. */
  increment: number
  /** Exercises sharing a letter are done back to back as a superset. */
  superset?: string
  notes?: string
}

export interface DayTemplate {
  id: string
  /** 1 = Monday … 7 = Sunday */
  weekday: number
  name: string
  kind: DayKind
  exercises: ExerciseTemplate[]
}

export interface Program extends BaseRecord {
  days: DayTemplate[]
}

export interface Session extends BaseRecord {
  date: string
  dayId: string
  dayName: string
  startedAt: string
  finishedAt?: string
  deload: boolean
}

export interface SetEntry extends BaseRecord {
  sessionId: string
  exerciseId: string
  exerciseName: string
  date: string
  setIndex: number
  weight: number
  reps: number
  done: boolean
}

export interface CardioEntry extends BaseRecord {
  date: string
  type: string
  minutes: number
  inclinePct?: number
  speedKph?: number
  avgHr?: number
  notes?: string
}

// ---- Nutrition ----

export interface Per100g {
  kcal: number
  protein: number
  carbs: number
  fiber: number
  fat: number
}

export interface Food extends BaseRecord {
  name: string
  brand?: string
  barcode?: string
  per100: Per100g
  /** US/Canadian labels count fibre inside carbs; EU/UK labels don't. */
  carbsIncludeFiber: boolean
  servingG?: number
  source: 'off' | 'custom'
  favourite?: boolean
  lastUsedAt?: string
}

/** Macros are copied in when logged, so editing a food later doesn't change history. */
export interface FoodLogEntry extends BaseRecord {
  date: string
  name: string
  foodId?: string
  grams?: number
  kcal: number
  protein: number
  netCarbs: number
  fat: number
}

export interface MealItem {
  foodId: string
  name: string
  grams: number
}

export interface Meal extends BaseRecord {
  name: string
  favourite: boolean
  items: MealItem[]
}

// Tables for later phases are declared now so the first install already has
// them. Their record types get filled in as each phase is built.
type Later = BaseRecord & Record<string, unknown>

export class BisDb extends Dexie {
  settings!: EntityTable<Settings, 'id'>
  weights!: EntityTable<WeightEntry, 'id'>
  foods!: EntityTable<Food, 'id'>
  meals!: EntityTable<Meal, 'id'>
  foodLog!: EntityTable<FoodLogEntry, 'id'>
  program!: EntityTable<Program, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<SetEntry, 'id'>
  cardio!: EntityTable<CardioEntry, 'id'>
  cycles!: EntityTable<Later, 'id'>
  injections!: EntityTable<Later, 'id'>
  bp!: EntityTable<Later, 'id'>
  bloodPanels!: EntityTable<Later, 'id'>
  supplements!: EntityTable<Later, 'id'>
  supplementLog!: EntityTable<Later, 'id'>

  constructor(name = 'bis-tracker') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      weights: 'id, &date',
      foods: 'id, barcode, name, updatedAt',
      meals: 'id, name, favourite',
      foodLog: 'id, date',
      program: 'id',
      sessions: 'id, date, dayId',
      sets: 'id, sessionId, exerciseId, date',
      cardio: 'id, date',
      cycles: 'id, startDate',
      injections: 'id, date, cycleId',
      bp: 'id, date',
      bloodPanels: 'id, date',
      supplements: 'id, order',
      supplementLog: 'id, date, [date+supplementId]',
    })
    // v2: look up an exercise's history by date quickly
    this.version(2).stores({
      sets: 'id, sessionId, exerciseId, date, [exerciseId+date]',
    })
    // v3: recently used foods
    this.version(3).stores({
      foods: 'id, barcode, name, updatedAt, lastUsedAt',
    })
  }
}

export const db = new BisDb()

/** Bump when a backup's shape changes in a way old versions can't read. */
export const SCHEMA_VERSION = 1

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()
