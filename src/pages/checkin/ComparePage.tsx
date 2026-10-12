import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, type Pose } from '../../db/schema'
import { useSettings } from '../../db/settings'
import Segmented from '../../components/Segmented'
import PhotoView from '../../components/PhotoView'
import { POSES, POSE_LABEL } from '../../checkin/store'
import { formatDate } from '../../lib/dates'
import { unitHelpers } from '../../lib/units'

export default function ComparePage() {
  const settings = useSettings()
  const checkIns = useLiveQuery(() => db.checkIns.orderBy('date').toArray(), [])
  const photos = useLiveQuery(() => db.photos.toArray(), [])
  const [aId, setA] = useState<string | null>(null)
  const [bId, setB] = useState<string | null>(null)
  const [pose, setPose] = useState<Pose>('front')
  if (!settings || !checkIns || !photos) return null
  if (checkIns.length < 2) return <p className="muted">You need two check-ins to compare. <Link to="/checkins">Back</Link></p>

  const u = unitHelpers(settings.units)
  const a = checkIns.find((c) => c.id === aId) ?? checkIns[0]
  const b = checkIns.find((c) => c.id === bId) ?? checkIns[checkIns.length - 1]
  const photo = (id: string) => photos.find((p) => p.checkInId === id && p.pose === pose)
  const weeks = Math.round((new Date(b.date).getTime() - new Date(a.date).getTime()) / (7 * 86_400_000))
  const diff = a.weightKg !== undefined && b.weightKg !== undefined ? b.weightKg - a.weightKg : undefined
  // Comparing on purpose: show both straight away, no blur.
  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {checkIns.map((c) => <option key={c.id} value={c.id}>{formatDate(c.date)}</option>)}
      </select>
    </label>
  )

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Compare</h1>
        <Link to="/checkins" className="btn btn-small">Back</Link>
      </div>
      <div className="two-col">
        {select(a.id, setA, 'Before')}
        {select(b.id, setB, 'After')}
      </div>
      <Segmented label="Pose" value={pose} onChange={setPose} options={POSES.map((p) => ({ value: p, label: POSE_LABEL[p] }))} />
      <div className="compare">
        <figure>
          <PhotoView photo={photo(a.id)} blur={false} alt={`${POSE_LABEL[pose]} before`} />
          <figcaption>{formatDate(a.date)}{a.weightKg !== undefined ? ` · ${u.fmtW(a.weightKg)}` : ''}</figcaption>
        </figure>
        <figure>
          <PhotoView photo={photo(b.id)} blur={false} alt={`${POSE_LABEL[pose]} after`} />
          <figcaption>{formatDate(b.date)}{b.weightKg !== undefined ? ` · ${u.fmtW(b.weightKg)}` : ''}</figcaption>
        </figure>
      </div>
      {diff !== undefined && (
        <div className="card center">
          <strong className="big-number">{diff >= 0 ? '+' : '−'}{Math.abs(u.fromKg(diff)).toFixed(1)} {u.w}</strong>
          <span className="muted small"> over {weeks} week{weeks === 1 ? '' : 's'}</span>
        </div>
      )}
    </section>
  )
}
