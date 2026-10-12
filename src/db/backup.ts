import { z } from 'zod'
import { db, nowIso, SCHEMA_VERSION } from './schema'
import { HAS_CYCLE_LOG, APP_VERSION, FLAVOR } from '../flavor'

const APP_ID = 'bis-bodybuilding-tracker'

// Tables left out of the Play build's backups and imports.
const CYCLE_TABLES = ['cycles', 'injections']

const tableNames = (includePhotos = false) =>
  db.tables
    .map((t) => t.name)
    .filter((name) => HAS_CYCLE_LOG || !CYCLE_TABLES.includes(name))
    .filter((name) => includePhotos || name !== 'photos')

// Photos are stored as Blobs; in a backup file they become base64 data: URLs.
async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(',')
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

const rowSchema = z.looseObject({ id: z.string().min(1) })

const backupSchema = z.object({
  app: z.literal(APP_ID),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  appVersion: z.string().optional(),
  tables: z.record(z.string(), z.array(rowSchema)),
})

export type Backup = z.infer<typeof backupSchema>

/** Everything on the phone. Progress photos only when asked (they make the file much bigger). */
export async function exportAll(opts: { includePhotos?: boolean } = {}): Promise<Backup> {
  const tables: Backup['tables'] = {}
  const names = tableNames(opts.includePhotos)
  await db.transaction('r', names, async () => {
    for (const name of names) tables[name] = await db.table(name).toArray()
  })
  if (tables.photos) {
    tables.photos = await Promise.all(
      tables.photos.map(async ({ blob, ...row }) => ({ ...row, dataUrl: await blobToDataUrl(blob as Blob) })),
    )
  }
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
  const hasPhotos = Array.isArray(backup.tables.photos)
  const names = tableNames(true)
  let records = 0
  await db.transaction('rw', names, async () => {
    for (const name of names) {
      const table = db.table(name)
      // A backup without photos leaves the photos on this phone alone.
      if (name === 'photos' && !hasPhotos) continue
      if (mode === 'replace') await table.clear()
      let rows = backup.tables[name] ?? []
      if (name === 'photos') rows = rows.map(({ dataUrl, ...row }) => ({ ...row, blob: dataUrlToBlob(String(dataUrl)) }))
      if (rows.length) await table.bulkPut(rows)
      records += rows.length
    }
    // Drop photos whose check-in no longer exists (e.g. after a replace).
    const checkIns = new Set((await db.checkIns.toCollection().primaryKeys()) as string[])
    await db.photos.filter((p) => !checkIns.has(p.checkInId)).delete()
  })
  return { records }
}

export function backupFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return `bis-tracker-backup-${stamp}.json`
}
