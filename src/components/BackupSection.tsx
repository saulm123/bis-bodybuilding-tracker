import { useState } from 'react'
import type { Settings } from '../db/schema'
import { saveSettings } from '../db/settings'
import { backupFileName, BackupError, exportAll, importBackup, parseBackup, type Backup, type ImportMode } from '../db/backup'
import { canShareFiles, pickTextFile, saveTextFile, shareTextFile } from '../lib/files'
import { formatDate } from '../lib/dates'
import Stepper from './Stepper'

type Status = { kind: 'ok' | 'error'; text: string } | null

export default function BackupSection({ settings }: { settings: Settings }) {
  const [status, setStatus] = useState<Status>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setStatus(null)
    try {
      await fn()
    } catch (e) {
      const cancelled = e instanceof Error && /cancel/i.test(e.message)
      if (!cancelled) setStatus({ kind: 'error', text: e instanceof BackupError ? e.message : `Something went wrong: ${String(e)}` })
    } finally {
      setBusy(false)
    }
  }

  // Writes the backup with `send`, and only records the backup time once that succeeded.
  // The time is also stamped inside the file so a restored copy doesn't nag straight away.
  const backUp = async (send: (name: string, text: string) => Promise<void>) => {
    const now = new Date().toISOString()
    const backup = await exportAll()
    for (const row of backup.tables.settings ?? []) row.lastBackupAt = now
    await send(backupFileName(), JSON.stringify(backup, null, 1))
    await saveSettings({ lastBackupAt: now })
  }

  const exportFile = () =>
    run(() =>
      backUp(async (name, text) => {
        const where = await saveTextFile(name, text)
        setStatus({ kind: 'ok', text: `Backup saved to ${where}.` })
      }),
    )

  const shareFile = () => run(() => backUp(shareTextFile))

  const chooseFile = () =>
    run(async () => {
      const text = await pickTextFile()
      if (text) setPending(parseBackup(text))
    })

  const confirmImport = (mode: ImportMode) =>
    run(async () => {
      if (!pending) return
      const { records } = await importBackup(pending, mode)
      setPending(null)
      setStatus({ kind: 'ok', text: `Imported ${records} records.` })
    })

  const counts = pending ? Object.values(pending.tables).reduce((n, rows) => n + rows.length, 0) : 0

  return (
    <div className="card stack">
      <h2>Backup</h2>
      <p className="muted small">
        {settings.lastBackupAt ? `Last backup: ${formatDate(settings.lastBackupAt)}.` : 'No backup yet.'} Everything lives only on this phone, so
        keep a copy somewhere else (another device, USB stick, encrypted cloud).
      </p>
      <button className="btn btn-primary btn-block" onClick={exportFile} disabled={busy}>
        Save backup file
      </button>
      {canShareFiles() && (
        <button className="btn btn-block" onClick={shareFile} disabled={busy}>
          Share backup…
        </button>
      )}
      <button className="btn btn-block" onClick={chooseFile} disabled={busy}>
        Restore from file…
      </button>

      {pending && (
        <div className="confirm stack">
          <p>
            Backup from <strong>{formatDate(pending.exportedAt)}</strong> with {counts} records. How do you want to restore it?
          </p>
          <button className="btn btn-block" onClick={() => confirmImport('merge')} disabled={busy}>
            Merge: add to what's on this phone
          </button>
          <button className="btn btn-danger btn-block" onClick={() => confirmImport('replace')} disabled={busy}>
            Replace: wipe this phone's data first
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      )}

      {status && <p className={status.kind === 'ok' ? 'ok' : 'warn'}>{status.text}</p>}

      <Stepper
        label="Remind me to back up every"
        value={settings.backupReminderDays}
        min={1}
        max={60}
        suffix="days"
        onChange={(backupReminderDays) => saveSettings({ backupReminderDays })}
      />
    </div>
  )
}
