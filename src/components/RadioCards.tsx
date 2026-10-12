interface Option<T extends string> {
  value: T
  label: string
  hint?: string
  badge?: string
}

/** A list of big tappable choices, one selected. */
export default function RadioCards<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  return (
    <div className="radio-cards" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`radio-card ${value === o.value ? 'on' : ''}`} onClick={() => onChange(o.value)}>
          <span className="row-between">
            <strong>{o.label}</strong>
            {o.badge && <span className="badge">{o.badge}</span>}
          </span>
          {o.hint && <span className="muted small">{o.hint}</span>}
        </button>
      ))}
    </div>
  )
}
