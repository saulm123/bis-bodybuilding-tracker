import { useEffect, useState } from 'react'
import { badges, type Stats } from '../training/records'
import { loadStats } from '../training/useStats'

export default function BadgesPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    loadStats().then(setStats)
  }, [])
  if (!stats) return null
  const list = badges(stats)
  const earned = list.filter((b) => b.earned).length

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Badges</h1>
        <button className="btn btn-small" onClick={() => history.back()}>Back</button>
      </div>
      <p className="muted">{earned} of {list.length} unlocked</p>
      <div className="macro-grid three">
        <div><span>Workouts</span><strong>{stats.workouts}</strong></div>
        <div><span>PRs</span><strong>{stats.prs}</strong></div>
        <div><span>Weeks in a row</span><strong>{stats.weeksTrainedInARow}</strong></div>
      </div>
      <div className="badge-grid">
        {list.map(({ badge, earned }) => (
          <div key={badge.id} className={`badge-tile ${earned ? 'earned' : ''}`}>
            <span className="badge-icon">{earned ? badge.icon : '🔒'}</span>
            <strong>{badge.name}</strong>
            <span className="muted small">{badge.hint}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
