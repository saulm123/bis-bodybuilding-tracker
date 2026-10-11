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
  createdAt: string
  updatedAt: string
}

export interface WeightEntry extends BaseRecord {
  date: string
  kg: number
}

// Tables for later phases are declared now so the first install already has
// them. Their record types get filled in as each phase is built.
type Later = BaseRecord & Record<string, unknown>

export class BisDb extends Dexie {
  settings!: EntityTable<Settings, 'id'>
  weights!: EntityTable<WeightEntry, 'id'>
  foods!: EntityTable<Later, 'id'>
  meals!: EntityTable<Later, 'id'>
  foodLog!: EntityTable<Later, 'id'>
  program!: EntityTable<Later, 'id'>
  sessions!: EntityTable<Later, 'id'>
  sets!: EntityTable<Later, 'id'>
  cardio!: EntityTable<Later, 'id'>
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
  }
}

export const db = new BisDb()

/** Bump when a backup's shape changes in a way old versions can't read. */
export const SCHEMA_VERSION = 1

export const newId = () => crypto.randomUUID()
export const nowIso = () => new Date().toISOString()
