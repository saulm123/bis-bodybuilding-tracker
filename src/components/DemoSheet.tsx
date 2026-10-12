import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { ExerciseTemplate } from '../db/schema'
import { demoFor, youtubeSearchUrl } from '../training/demos'
import DemoVideo from './DemoVideo'

/** Pop-up showing how to do an exercise: clip or animated photos, plus form tips. */
export default function DemoSheet({ exercise, onClose }: { exercise: Pick<ExerciseTemplate, 'id' | 'name'>; onClose: () => void }) {
  const demo = demoFor(exercise)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet stack" role="dialog" aria-label={`How to do ${exercise.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2>{exercise.name}</h2>
          <button className="btn btn-small btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {demo ? (
          <>
            <div className="demo-media">
              {demo.clip ? (
                <DemoVideo src={`demos/${demo.slug}/clip.mp4`} poster={`demos/${demo.slug}/0.jpg`} label={`${exercise.name} demo video`} />
              ) : (
                <>
                  <img src={`demos/${demo.slug}/0.jpg`} alt={`${exercise.name}: start position`} />
                  <img src={`demos/${demo.slug}/1.jpg`} alt={`${exercise.name}: end position`} className="demo-end" />
                </>
              )}
            </div>
            <ol className="cues">
              {demo.cues.map((c) => <li key={c}>{c}</li>)}
            </ol>
            <div className="chips">
              {demo.muscles.map((m) => <span key={m} className="chip chip-static">{m}</span>)}
            </div>
          </>
        ) : (
          <p className="muted small">No demo for this exercise yet.</p>
        )}
        <div className="row-actions">
          <Link className="btn btn-small" to={`/train/exercise/${exercise.id}`}>Your history</Link>
          <a className="btn btn-small" href={youtubeSearchUrl(exercise.name)} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
        </div>
        <p className="muted small">YouTube opens in your browser. Nothing is sent until you tap it.</p>
      </div>
    </div>
  )
}
