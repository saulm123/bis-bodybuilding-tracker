import type { Totals } from '../nutrition/macros'

function Ring({ r, width, pct, colour }: { r: number; width: number; pct: number; colour: string }) {
  const c = 2 * Math.PI * r
  return (
    <>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ring-track)" strokeWidth={width} />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct))} transform="rotate(-90 60 60)" className="ring-arc"
      />
    </>
  )
}

const ROWS: { key: keyof Totals; label: string; colour: string }[] = [
  { key: 'protein', label: 'Protein', colour: 'var(--protein)' },
  { key: 'netCarbs', label: 'Net carbs', colour: 'var(--carbs)' },
  { key: 'fat', label: 'Fat', colour: 'var(--fat)' },
]

/** Calories ring (outer) and protein ring (inner), with carb and fat bars beside. */
export default function MacroRings({ eaten, target }: { eaten: Totals; target: Totals }) {
  const left = Math.round(target.kcal - eaten.kcal)
  const over = left < 0
  return (
    <div className="rings">
      <svg viewBox="0 0 120 120" className="rings-svg" role="img" aria-label={`${Math.round(eaten.kcal)} of ${Math.round(target.kcal)} calories eaten`}>
        <Ring r={52} width={10} pct={target.kcal ? eaten.kcal / target.kcal : 0} colour={over ? 'var(--danger)' : 'var(--accent)'} />
        <Ring r={38} width={7} pct={target.protein ? eaten.protein / target.protein : 0} colour="var(--protein)" />
        <text x="60" y="58" textAnchor="middle" className="ring-big">{Math.abs(left).toLocaleString()}</text>
        <text x="60" y="73" textAnchor="middle" className="ring-small">{over ? 'kcal over' : 'kcal left'}</text>
      </svg>
      <div className="ring-bars">
        {ROWS.map(({ key, label, colour }) => {
          const e = Math.round(eaten[key])
          const t = Math.round(target[key])
          return (
            <div key={key}>
              <div className="row-between small"><span>{label}</span><strong>{e}<span className="muted">/{t}g</span></strong></div>
              <div className="bar"><div className="bar-fill" style={{ width: `${t ? Math.min(100, (e / t) * 100) : 0}%`, background: e > t * 1.05 ? 'var(--danger)' : colour }} /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
