import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, type Photo } from '../../db/schema'
import { useSettings } from '../../db/settings'
import PhotoView from '../../components/PhotoView'
import { checkInDue, POSES, POSE_LABEL } from '../../checkin/store'
import { formatDate, isoDate } from '../../lib/dates'
import { unitHelpers } from '../../lib/units'

export default function CheckInsPage() {
  const settings = useSettings()
  const checkIns = useLiveQuery(() => db.checkIns.orderBy('date').reverse().toArray(), [])
  const photos = useLiveQuery(() => db.photos.toArray(), [])
  if (!settings || !checkIns || !photos) return null
  const u = unitHelpers(settings.units)
  const blur = settings.blurPhotos ?? true
  const due = checkInDue(checkIns[0]?.date, isoDate(), settings.checkInDay ?? 1)
  const byCheckIn = new Map<string, Photo[]>()
  for (const p of photos) byCheckIn.set(p.checkInId, [...(byCheckIn.get(p.checkInId) ?? []), p])

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Check-ins</h1>
        <Link to="/health" className="btn btn-small">Back</Link>
      </div>
      <p className="muted small">Once a week: your weight plus front, side and back photos. Photos stay on this phone only, inside the app (not in your gallery).</p>

      <Link to="/checkins/new" className={`btn btn-block ${due ? 'btn-primary' : ''}`}>{due ? '📸 Weekly check-in due: start' : '+ New check-in'}</Link>
      {checkIns.length >= 2 && <Link to="/checkins/compare" className="btn btn-block">Compare photos</Link>}

      {checkIns.length === 0 && <p className="muted">No check-ins yet. Do your first one today, then compare as the weeks go by.</p>}

      {checkIns.map((c, i) => {
        const prev = checkIns[i + 1]
        const diff = c.weightKg !== undefined && prev?.weightKg !== undefined ? c.weightKg - prev.weightKg : undefined
        const ps = byCheckIn.get(c.id) ?? []
        return (
          <Link key={c.id} to={`/checkins/${c.id}`} className="card stack plain-link">
            <div className="row-between">
              <strong>{formatDate(c.date)}</strong>
              <span>
                {c.weightKg !== undefined ? u.fmtW(c.weightKg) : '–'}
                {diff !== undefined && <span className={`small ${diff > 0 ? 'accent' : 'ok'}`}> {diff >= 0 ? '+' : '−'}{Math.abs(u.fromKg(diff)).toFixed(1)}</span>}
              </span>
            </div>
            {ps.length > 0 && (
              <div className="photo-row">
                {POSES.map((pose) => (
                  <PhotoView key={pose} photo={ps.find((p) => p.pose === pose)} blur={blur} alt={`${POSE_LABEL[pose]}, ${formatDate(c.date)}`} className="thumb" interactive={false} />
                ))}
              </div>
            )}
            {c.notes && <span className="muted small">{c.notes}</span>}
          </Link>
        )
      })}
    </section>
  )
}
