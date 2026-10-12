import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db, type Pose } from '../../db/schema'
import { useSettings } from '../../db/settings'
import { WeightInput } from '../../components/BodyInputs'
import { deleteCheckIn, POSES, POSE_LABEL, saveCheckIn, shrinkImage, type PhotoInput } from '../../checkin/store'
import { isoDate } from '../../lib/dates'
import { movingAverage } from '../../weight/trend'

type Draft = Partial<Record<Pose, PhotoInput>>

export default function CheckInEditor() {
  const { checkInId } = useParams()
  const navigate = useNavigate()
  const settings = useSettings()
  const existing = useLiveQuery(() => (checkInId ? db.checkIns.get(checkInId) : undefined), [checkInId])
  const saved = useLiveQuery(() => (checkInId ? db.photos.where('checkInId').equals(checkInId).toArray() : []), [checkInId])
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [])
  const [date, setDate] = useState(isoDate())
  const [weightKg, setWeightKg] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [draft, setDraft] = useState<Draft>({})
  const [busy, setBusy] = useState<Pose | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!existing) return
    setDate(existing.date)
    setWeightKg(existing.weightKg ?? null)
    setNotes(existing.notes ?? '')
  }, [existing])

  if (!settings || !weights || !saved || (checkInId && existing === undefined)) return null
  // Default weight: your 7-day average (smooths out daily water swings).
  const avg = movingAverage(weights).at(-1)?.kg
  const weight = weightKg ?? avg ?? 80

  const pick = async (pose: Pose, file: File | undefined) => {
    if (!file) return
    setBusy(pose)
    setError(null)
    try {
      setDraft((d) => ({ ...d, [pose]: null }))
      const img = await shrinkImage(file)
      setDraft((d) => ({ ...d, [pose]: img }))
    } catch {
      setError("Couldn't read that photo. Try another one.")
      setDraft((d) => {
        const next = { ...d }
        delete next[pose]
        return next
      })
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    setBusy('save')
    const id = await saveCheckIn({ id: existing?.id, date, weightKg: weight, notes, photos: draft })
    navigate(`/checkins`, { replace: true })
    return id
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>{existing ? 'Check-in' : 'New check-in'}</h1>
        <button className="btn btn-small" onClick={() => navigate('/checkins')}>Cancel</button>
      </div>

      <div className="card stack">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} max={isoDate()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <WeightInput units={settings.units} kg={weight} onChange={setWeightKg} label={weightKg === null && avg ? 'Weight (your 7-day average)' : 'Weight'} />
      </div>

      <div className="card stack">
        <h2>Photos</h2>
        <p className="muted small">Same spot, same light, same time of day (morning, before food) makes them easy to compare. Relaxed, then flexed if you like.</p>
        <div className="pose-grid">
          {POSES.map((pose) => (
            <PoseSlot
              key={pose}
              pose={pose}
              draft={draft[pose]}
              hasDraft={pose in draft}
              saved={saved.find((p) => p.pose === pose)?.blob}
              busy={busy === pose}
              onPick={(f) => pick(pose, f)}
              onRemove={() => setDraft((d) => ({ ...d, [pose]: null }))}
            />
          ))}
        </div>
        {error && <p className="warn small">{error}</p>}
      </div>

      <label className="field card">
        <span>Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Feeling lean, sleep has been good…" />
      </label>

      <button className="btn btn-primary btn-block" onClick={save} disabled={!!busy}>Save check-in</button>

      {existing &&
        (!confirmDelete ? (
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(true)}>Delete this check-in</button>
        ) : (
          <div className="confirm stack">
            <p>Delete this check-in and its photos? This can't be undone.</p>
            <button className="btn btn-danger btn-block" onClick={async () => { await deleteCheckIn(existing.id); navigate('/checkins', { replace: true }) }}>Delete</button>
            <button className="btn btn-ghost btn-block" onClick={() => setConfirmDelete(false)}>Keep it</button>
          </div>
        ))}
    </section>
  )
}

function PoseSlot(p: { pose: Pose; draft?: PhotoInput; hasDraft: boolean; saved?: Blob; busy: boolean; onPick: (f?: File) => void; onRemove: () => void }) {
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  // A new photo (or removal) wins over the saved one.
  const blob = p.hasDraft ? p.draft?.blob : p.saved
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  return (
    <div className="pose-slot">
      <div className="photo">
        {p.busy ? <span className="muted small">Processing…</span> : url ? <img src={url} alt={`${POSE_LABEL[p.pose]} photo`} /> : <span className="muted small">{POSE_LABEL[p.pose]}</span>}
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { p.onPick(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => { p.onPick(e.target.files?.[0]); e.target.value = '' }} />
      <button type="button" className="btn btn-small" onClick={() => camera.current?.click()}>📷 Camera</button>
      <button type="button" className="btn btn-small btn-ghost" onClick={() => gallery.current?.click()}>Gallery</button>
      {url && <button type="button" className="btn btn-small btn-ghost" onClick={p.onRemove}>Remove</button>}
    </div>
  )
}
