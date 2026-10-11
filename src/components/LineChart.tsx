export interface Series {
  points: { x: number; y: number }[]
  colour: string
  dots?: boolean
  width?: number
}

interface Props {
  series: Series[]
  height?: number
  /** Formats x values (timestamps) for the axis. */
  formatX?: (x: number) => string
  formatY?: (y: number) => string
  /** Optional shaded band, e.g. a target range. */
  band?: { from: number; to: number }
}

/** Small dependency-free SVG line chart. Scales to its container width. */
export default function LineChart({ series, height = 180, formatX, formatY = (y) => String(Math.round(y)), band }: Props) {
  const all = series.flatMap((s) => s.points)
  if (all.length < 2) return <p className="muted small">Not enough data for a chart yet.</p>

  const W = 340
  const H = height
  const pad = { l: 40, r: 8, t: 10, b: 22 }
  const xs = all.map((p) => p.x)
  let ys = all.map((p) => p.y)
  if (band) ys = ys.concat([band.from, band.to])
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  let [y0, y1] = [Math.min(...ys), Math.max(...ys)]
  const spread = y1 - y0 || 1
  y0 -= spread * 0.1
  y1 += spread * 0.1

  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r)
  const sy = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0)) * (H - pad.t - pad.b)
  const yTicks = [y0 + (y1 - y0) * 0.15, (y0 + y1) / 2, y1 - (y1 - y0) * 0.15]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Chart">
      {band && <rect x={pad.l} width={W - pad.l - pad.r} y={sy(band.to)} height={Math.max(0, sy(band.from) - sy(band.to))} className="chart-band" />}
      {yTicks.map((y) => (
        <g key={y}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(y)} y2={sy(y)} className="chart-grid" />
          <text x={pad.l - 6} y={sy(y) + 4} textAnchor="end" className="chart-label">
            {formatY(y)}
          </text>
        </g>
      ))}
      {formatX && (
        <>
          <text x={pad.l} y={H - 6} className="chart-label">{formatX(x0)}</text>
          <text x={W - pad.r} y={H - 6} textAnchor="end" className="chart-label">{formatX(x1)}</text>
        </>
      )}
      {series.map((s, i) => (
        <g key={i}>
          <polyline
            fill="none"
            stroke={s.colour}
            strokeWidth={s.width ?? 2}
            strokeLinejoin="round"
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
          />
          {s.dots && s.points.map((p, j) => <circle key={j} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill={s.colour} />)}
        </g>
      ))}
    </svg>
  )
}

export const shortDate = (x: number) => new Date(x).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
export const dayMs = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
