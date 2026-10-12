import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  decimals?: number
  suffix?: string
}

/** Big −/+ number field that's easy to hit at the gym. You can also type into it. */
export default function Stepper({ label, value, onChange, step = 1, min = 0, max = 99999, decimals = 0, suffix }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  // The latest value, updated instantly on each tap. Saving is async, so reading the
  // `value` prop would lose taps made in quick succession.
  const latest = useRef(value)
  const lastTap = useRef(0)
  useEffect(() => {
    // Ignore older saved values arriving while you're still tapping.
    if (value !== latest.current && Date.now() - lastTap.current < 1500) return
    latest.current = value
    setDraft(String(value))
  }, [value])

  const clean = (n: number) => {
    const f = 10 ** decimals
    return Math.min(max, Math.max(min, Math.round(n * f) / f))
  }
  const nudge = (delta: number) => {
    const v = clean(latest.current + delta)
    latest.current = v
    lastTap.current = Date.now()
    setDraft(String(v))
    onChange(v)
  }

  return (
    <div className="stepper">
      <label htmlFor={id}>{label}</label>
      <div className="stepper-row">
        <button type="button" className="stepper-btn" onClick={() => nudge(-step)} aria-label={`Decrease ${label}`}>
          −
        </button>
        <div className="stepper-value">
          <input
            id={id}
            inputMode={decimals ? 'decimal' : 'numeric'}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              const n = parseFloat(e.target.value.replace(',', '.'))
              if (Number.isFinite(n) && n >= min && n <= max) {
                latest.current = clean(n)
              lastTap.current = Date.now()
                onChange(latest.current)
              }
            }}
            onBlur={() => setDraft(String(value))}
            onFocus={(e) => e.target.select()}
          />
          {suffix && <span className="stepper-suffix">{suffix}</span>}
        </div>
        <button type="button" className="stepper-btn" onClick={() => nudge(step)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}
