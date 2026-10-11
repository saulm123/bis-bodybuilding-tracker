import { useEffect, useId, useState } from 'react'

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
  useEffect(() => setDraft(String(value)), [value])

  const clean = (n: number) => {
    const f = 10 ** decimals
    return Math.min(max, Math.max(min, Math.round(n * f) / f))
  }
  const nudge = (delta: number) => onChange(clean(value + delta))

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
              if (Number.isFinite(n) && n >= min && n <= max) onChange(clean(n))
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
