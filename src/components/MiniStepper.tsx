import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  step: number
  min?: number
  max?: number
  decimals?: number
  suffix?: string
}

/** Compact −/+ field for set rows (weight, reps). Tap the number to type. */
export default function MiniStepper({ label, value, onChange, step, min = 0, max = 9999, decimals = 2, suffix }: Props) {
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
  const clean = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10 ** decimals) / 10 ** decimals))
  const nudge = (delta: number) => {
    const v = clean(latest.current + delta)
    latest.current = v
    lastTap.current = Date.now()
    setDraft(String(v))
    onChange(v)
  }

  return (
    <div className="mini">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => nudge(-step)}>
        −
      </button>
      <label>
        <input
          aria-label={label}
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={draft}
          onFocus={(e) => e.target.select()}
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
        />
        {suffix && <span>{suffix}</span>}
      </label>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => nudge(step)}>
        +
      </button>
    </div>
  )
}
