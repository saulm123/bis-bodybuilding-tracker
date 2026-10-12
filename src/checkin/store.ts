import { useEffect, useState } from 'react'
import { db, newId, nowIso, type CheckIn, type Photo, type Pose } from '../db/schema'

export const POSES: Pose[] = ['front', 'side', 'back']
export const POSE_LABEL: Record<Pose, string> = { front: 'Front', side: 'Side', back: 'Back' }

/**
 * Shrinks a photo to at most 1280 px on the long side (JPEG), so a year of weekly
 * check-ins stays around 30–40 MB. Runs on the phone; the photo never leaves it.
 */
export async function shrinkImage(file: Blob, maxSide = 1280): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process photo'))), 'image/jpeg', 0.82))
  return { blob, width, height }
}

export type PhotoInput = { blob: Blob; width: number; height: number } | null

/** Saves a check-in. `photos`: a new image to store, null to remove, or leave out to keep what's there. */
export async function saveCheckIn(input: { id?: string; date: string; weightKg?: number; notes?: string; photos: Partial<Record<Pose, PhotoInput>> }): Promise<string> {
  const now = nowIso()
  const id = input.id ?? newId()
  await db.transaction('rw', db.checkIns, db.photos, async () => {
    const existing = input.id ? await db.checkIns.get(input.id) : undefined
    const record: CheckIn = { id, date: input.date, weightKg: input.weightKg, notes: input.notes || undefined, createdAt: existing?.createdAt ?? now, updatedAt: now }
    await db.checkIns.put(record)
    for (const pose of POSES) {
      if (!(pose in input.photos)) continue
      await db.photos.where('checkInId').equals(id).filter((p) => p.pose === pose).delete()
      const p = input.photos[pose]
      if (p) await db.photos.add({ id: newId(), checkInId: id, pose, ...p, createdAt: now, updatedAt: now })
    }
  })
  return id
}

export async function deleteCheckIn(id: string): Promise<void> {
  await db.transaction('rw', db.checkIns, db.photos, async () => {
    await db.photos.where('checkInId').equals(id).delete()
    await db.checkIns.delete(id)
  })
}

const DAY = 86_400_000
const weekdayOf = (iso: string) => ((new Date(`${iso}T12:00:00`).getDay() + 6) % 7) + 1

/**
 * A check-in is due if you've never done one, it's been a week or more, or it's
 * your check-in day and the last one was at least 5 days ago.
 */
export function checkInDue(lastDate: string | undefined, today: string, checkInDay = 1): boolean {
  if (!lastDate) return true
  const days = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${lastDate}T12:00:00`).getTime()) / DAY)
  return days >= 7 || (weekdayOf(today) === checkInDay && days >= 5)
}

/** An object URL for a stored photo, cleaned up automatically. */
export function usePhotoUrl(photo: Pick<Photo, 'blob'> | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!photo) return setUrl(undefined)
    const u = URL.createObjectURL(photo.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photo])
  return url
}
