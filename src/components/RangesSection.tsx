import { useState } from 'react'
import type { Settings } from '../db/schema'
import { saveSettings } from '../db/settings'
import { MARKERS, rangeFor } from '../health/markers'

/** Edit the reference ranges used to flag blood results, to match your lab. */
export default function RangesSection({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false)
  const set = (key: string, side: 'low' | 'high', text: string) => {
    const n = parseFloat(text.replace(',', '.'))
    const current = { ...rangeFor(MARKERS.find((m) => m.key === key)!, settings.markerRanges, settings.sex) }
    current[side] = Number.isFinite(n) ? n : undefined
    saveSettings({ markerRanges: { ...settings.markerRanges, [key]: current } })
  }
  return (
    <div className="card stack">
      <button className="row-between plain" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h2>Bloods ranges</h2>
        <span className="muted small">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <>
          <p className="muted small">Copy the reference ranges from your lab report. Blank = no limit.</p>
          {MARKERS.map((m) => {
            const r = rangeFor(m, settings.markerRanges, settings.sex)
            return (
              <div key={m.key} className="range-row">
                <span className="small">{m.name} <span className="muted">({m.unit})</span></span>
                <input className="input" inputMode="decimal" aria-label={`${m.name} low`} defaultValue={r.low ?? ''} placeholder="low" onBlur={(e) => set(m.key, 'low', e.target.value)} />
                <input className="input" inputMode="decimal" aria-label={`${m.name} high`} defaultValue={r.high ?? ''} placeholder="high" onBlur={(e) => set(m.key, 'high', e.target.value)} />
              </div>
            )
          })}
          <button className="btn btn-ghost btn-block" onClick={() => { saveSettings({ markerRanges: undefined }); setOpen(false) }}>Reset to defaults</button>
        </>
      )}
    </div>
  )
}
