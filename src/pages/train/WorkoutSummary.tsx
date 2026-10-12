import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/schema'
import { formatDate, isoDate } from '../../lib/dates'
import { unitHelpers } from '../../lib/units'
import { useSettings } from '../../db/settings'
import { haptic } from '../../lib/haptics'
import { canShareFiles, saveImage, shareImage } from '../../lib/files'
import Confetti from '../../components/Confetti'
import MuscleChips from '../../components/MuscleChips'
import { musclesWorked, newBadges, summarize, type Badge, type Summary } from '../../training/records'
import { loadStats } from '../../training/useStats'

export default function WorkoutSummary() {
  const { id = '' } = useParams()
  const settings = useSettings()
  const session = useLiveQuery(() => db.sessions.get(id), [id])
  const [data, setData] = useState<{ summary: Summary; unlocked: Badge[]; week: ReturnType<typeof musclesWorked> } | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let live = true
    ;(async () => {
      const sets = await db.sets.where('sessionId').equals(session.id).toArray()
      const names = new Set(sets.map((s) => s.exerciseName.toLowerCase()))
      const earlier = (await db.sets.where('date').belowOrEqual(session.date).toArray()).filter((s) => s.sessionId !== session.id && names.has(s.exerciseName.toLowerCase()))
      const previous = (await db.sessions.where('date').belowOrEqual(session.date).toArray())
        .filter((s) => s.dayId === session.dayId && s.id !== session.id && s.finishedAt && s.startedAt < session.startedAt)
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
      const previousSets = previous ? await db.sets.where('sessionId').equals(previous.id).toArray() : undefined
      const summary = summarize(session, sets, earlier, previousSets)
      const [before, after] = await Promise.all([loadStats(session.id), loadStats()])
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 6)
      const week = musclesWorked(await db.sets.where('date').aboveOrEqual(isoDate(weekAgo)).toArray())
      if (!live) return
      setData({ summary, unlocked: newBadges(before, after), week })
      if (summary.prs.length) haptic.success()
    })()
    return () => {
      live = false
    }
  }, [session?.id, session?.finishedAt])

  if (!session || !settings || !data) return null
  const u = unitHelpers(settings.units)
  const { summary, unlocked, week } = data
  const celebrate = summary.prs.length > 0 || unlocked.length > 0

  const card = () => drawShareCard({ dayName: session.dayName, date: formatDate(session.date), summary, fmtW: u.fmtW, w: u.w, fromKg: u.fromKg })
  const fileName = `bis-workout-${session.date}.png`

  return (
    <section className="stack summary">
      {celebrate && <Confetti />}
      <div className="summary-head">
        <div className="trophy" aria-hidden="true">{summary.prs.length ? '🏆' : '💪'}</div>
        <h1>Workout complete</h1>
        <span className="muted">{session.dayName} · {summary.minutes} min · {summary.sets} sets</span>
      </div>

      <div className="macro-grid three">
        <div><span>Volume</span><strong>{Math.round(u.fromKg(summary.volume)).toLocaleString()}<small> {u.w}</small></strong></div>
        <div><span>vs last time</span><strong className={summary.vsLast === undefined ? '' : summary.vsLast >= 0 ? 'ok' : 'warn'}>{summary.vsLast === undefined ? '–' : `${summary.vsLast >= 0 ? '+' : ''}${summary.vsLast}%`}</strong></div>
        <div><span>PRs</span><strong className={summary.prs.length ? 'accent' : ''}>{summary.prs.length}</strong></div>
      </div>

      {summary.prs.length > 0 && (
        <div className="card stack pr-card">
          <span className="eyebrow">New personal records</span>
          {summary.prs.map((p) => (
            <div key={p.exerciseName} className="row-between">
              <span>{p.exerciseName}</span>
              <strong>{u.fmtW(p.weight)} × {p.reps}</strong>
            </div>
          ))}
        </div>
      )}

      {unlocked.map((b) => (
        <div key={b.id} className="card badge-unlock">
          <span className="badge-icon">{b.icon}</span>
          <div><strong>Badge unlocked: {b.name}</strong><br /><span className="muted small">{b.hint}</span></div>
        </div>
      ))}

      <div className="card stack">
        <span className="muted small">Muscles trained in the last 7 days (sets)</span>
        <MuscleChips counts={week} />
      </div>

      <div className="row-actions two-buttons">
        <button
          className="btn"
          onClick={async () => {
            const png = await card()
            if (canShareFiles()) await shareImage(fileName, png).catch(() => {})
            else setSaved(await saveImage(fileName, png))
          }}
        >
          Share card
        </button>
        <Link to="/today" className="btn btn-primary">Done</Link>
      </div>
      {canShareFiles() && (
        <button className="btn btn-ghost btn-block" onClick={async () => setSaved(await saveImage(fileName, await card()))}>Save card to phone</button>
      )}
      {saved && <p className="ok small">Saved to {saved}.</p>}
      <Link to="/badges" className="muted small center">See all badges</Link>
    </section>
  )
}

/** Draws a 1080×1350 summary image. Made on the phone; nothing is uploaded. */
async function drawShareCard(p: { dayName: string; date: string; summary: Summary; fmtW: (kg: number) => string; w: string; fromKg: (kg: number) => number }): Promise<string> {
  await document.fonts?.load('80px "Archivo Black"').catch(() => {})
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1350
  const g = c.getContext('2d')!
  const heavy = '"Archivo Black", system-ui, sans-serif'
  g.fillStyle = '#0d0d0d'
  g.fillRect(0, 0, 1080, 1350)
  g.fillStyle = '#ef9f27'
  g.fillRect(0, 0, 1080, 14)
  g.fillStyle = '#f2f2f2'
  g.font = `64px ${heavy}`
  g.fillText('BIS', 80, 150)
  g.fillStyle = '#ef9f27'
  g.fillText('TRACKER', 245, 150)
  g.fillStyle = '#9a9a9a'
  g.font = '40px system-ui, sans-serif'
  g.fillText(`${p.dayName} · ${p.date}`, 80, 230)

  const tiles: [string, string][] = [
    ['TIME', `${p.summary.minutes} min`],
    ['SETS', String(p.summary.sets)],
    ['VOLUME', `${Math.round(p.fromKg(p.summary.volume)).toLocaleString()} ${p.w}`],
  ]
  tiles.forEach(([label, value], i) => {
    const x = 80 + i * 320
    g.fillStyle = '#1c1c1c'
    roundRect(g, x, 300, 290, 200, 28)
    g.fillStyle = '#9a9a9a'
    g.font = '32px system-ui, sans-serif'
    g.fillText(label, x + 30, 360)
    g.fillStyle = '#f2f2f2'
    g.font = `${value.length > 9 ? 44 : 56}px ${heavy}`
    g.fillText(value, x + 30, 450)
  })

  let y = 600
  if (p.summary.prs.length) {
    g.fillStyle = '#ef9f27'
    g.font = `44px ${heavy}`
    g.fillText(`🏆 ${p.summary.prs.length} PERSONAL RECORD${p.summary.prs.length > 1 ? 'S' : ''}`, 80, y)
    y += 80
    g.font = '42px system-ui, sans-serif'
    for (const pr of p.summary.prs.slice(0, 6)) {
      g.fillStyle = '#f2f2f2'
      g.fillText(pr.exerciseName, 80, y)
      const v = `${p.fmtW(pr.weight)} × ${pr.reps}`
      g.fillText(v, 1000 - g.measureText(v).width, y)
      y += 70
    }
  } else {
    g.fillStyle = '#f2f2f2'
    g.font = `56px ${heavy}`
    g.fillText('Another one done. 💪', 80, y)
  }
  g.fillStyle = '#5a5a5a'
  g.font = '30px system-ui, sans-serif'
  g.fillText('Tracked with BIS Bodybuilding Tracker', 80, 1280)
  return c.toDataURL('image/png')
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
}
