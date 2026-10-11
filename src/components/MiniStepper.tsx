import { useEffect, useState } from 'react'

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
  useEffect(() => setDraft(String(value)), [value])
  const clean = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10 ** decimals) / 10 ** decimals))

  return (
    <div className="mini">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clean(value - step))}>
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
            if (Number.isFinite(n) && n >= min && n <= max) onChange(clean(n))
          }}
          onBlur={() => setDraft(String(value))}
        />
        {suffix && <span>{suffix}</span>}
      </label>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clean(value + step))}>
        +
      </button>
    </div>
  )
}
