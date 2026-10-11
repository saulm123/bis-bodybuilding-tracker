import { z } from 'zod'
import { db, nowIso, SCHEMA_VERSION } from './schema'
import { HAS_CYCLE_LOG, APP_VERSION, FLAVOR } from '../flavor'

const APP_ID = 'bis-bodybuilding-tracker'

// Tables left out of the Play build's backups and imports.
const CYCLE_TABLES = ['cycles', 'injections']

const tableNames = () =>
  db.tables.map((t) => t.name).filter((name) => HAS_CYCLE_LOG || !CYCLE_TABLES.includes(name))

const rowSchema = z.looseObject({ id: z.string().min(1) })

const backupSchema = z.object({
  app: z.literal(APP_ID),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  appVersion: z.string().optional(),
  tables: z.record(z.string(), z.array(rowSchema)),
})

export type Backup = z.infer<typeof backupSchema>

export async function exportAll(): Promise<Backup> {
  const tables: Backup['tables'] = {}
  await db.transaction('r', tableNames(), async () => {
    for (const name of tableNames()) tables[name] = await db.table(name).toArray()
  })
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), appVersion: `${APP_VERSION} (${FLAVOR})`, tables }
}

export class BackupError extends Error {}

/** Checks a file's contents and returns the parsed backup, or throws a BackupError with a readable message. */
export function parseBackup(text: string): Backup {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError("That file isn't a valid backup (not JSON).")
  }
  const result = backupSchema.safeParse(json)
  if (!result.success) {
    throw new BackupError("That file isn't a BIS Tracker backup, or it's damaged.")
  }
  if (result.data.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError('This backup is from a newer version of the app. Update the app first, then import it.')
  }
  return result.data
}

export type ImportMode = 'merge' | 'replace'

/**
 * merge: adds records from the backup and overwrites ones with the same id; keeps everything else.
 * replace: wipes this device's data first, so it ends up exactly like the backup.
 * Unknown tables in the file are ignored. Runs in one transaction, so a failure changes nothing.
 */
export async function importBackup(backup: Backup, mode: ImportMode): Promise<{ records: number }> {
  const names = tableNames()
  let records = 0
  await db.transaction('rw', names, async () => {
    for (const name of names) {
      const table = db.table(name)
      if (mode === 'replace') await table.clear()
      const rows = backup.tables[name] ?? []
      if (rows.length) await table.bulkPut(rows)
      records += rows.length
    }
  })
  return { records }
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return `bis-tracker-backup-${stamp}.json`
}
