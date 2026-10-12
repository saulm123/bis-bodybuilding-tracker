import type { Muscle } from '../training/demos'

const ORDER: Muscle[] = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs']

/** One chip per muscle group, brighter the more sets it got (10+ sets a week is a good target). */
export default function MuscleChips({ counts }: { counts: Partial<Record<Muscle, number>> }) {
  return (
    <div className="chips">
      {ORDER.map((m) => {
        const n = counts[m] ?? 0
        const level = n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : 3
        return (
          <span key={m} className={`chip chip-static muscle-${level}`} title={`${n} sets`}>
            {m} <span className="muscle-n">{n}</span>
          </span>
        )
      })}
    </div>
  )
}
