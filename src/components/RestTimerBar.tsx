import { useEffect, useState } from 'react'
import { addRest, stopRest, useRestTimer } from '../training/restTimer'
import { formatRest } from '../training/logic'

/** Floating rest countdown shown above the tab bar while a rest is running. */
export default function RestTimerBar() {
  const timer = useRestTimer()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!timer) return
    const tick = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(tick)
  }, [timer])

  const left = timer ? Math.ceil((timer.endsAt - now) / 1000) : 0
  const done = left <= 0

  useEffect(() => {
    if (!timer || !done) return
    navigator.vibrate?.([300, 150, 300])
    const clear = setTimeout(stopRest, 4000)
    return () => clearTimeout(clear)
  }, [timer, done])

  if (!timer) return null
  const pct = done ? 100 : 100 - (left / timer.total) * 100

  return (
    <div className={`rest-bar ${done ? 'rest-done' : ''}`} role="timer" aria-live="polite">
      <div className="rest-progress" style={{ width: `${pct}%` }} />
      <div className="rest-content">
        <div>
          <strong>{done ? 'Rest over' : formatRest(left)}</strong>
          <span className="muted small"> {done ? `Go: ${timer.label}` : 'rest'}</span>
        </div>
        {!done && (
          <button className="btn btn-small" onClick={() => addRest(30)}>
            +30s
          </button>
        )}
        <button className="btn btn-small" onClick={stopRest}>
          {done ? 'OK' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
