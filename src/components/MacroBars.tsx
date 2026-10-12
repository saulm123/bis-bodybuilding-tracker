import type { Totals } from '../nutrition/macros'

const ROWS: { key: keyof Totals; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: '' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'netCarbs', label: 'Net carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
]

/** Eaten vs target for each macro, with how much is left. */
export default function MacroBars({ eaten, target }: { eaten: Totals; target: Totals }) {
  return (
    <div className="bars">
      {ROWS.map(({ key, label, unit }) => {
        const e = Math.round(eaten[key])
        const t = Math.round(target[key])
        const pct = t ? Math.min(100, (e / t) * 100) : 0
        const left = t - e
        const over = left < 0
        return (
          <div key={key} className="bar-row">
            <div className="row-between small">
              <span>{label}</span>
              <span>
                <strong>{e}</strong>
                <span className="muted"> / {t}{unit}</span>
                <span className={over ? 'warn' : 'muted'}> · {over ? `${-left}${unit} over` : `${left}${unit} left`}</span>
              </span>
            </div>
            <div className="bar"><div className={`bar-fill bar-${key} ${over ? 'bar-over' : ''}`} style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}
