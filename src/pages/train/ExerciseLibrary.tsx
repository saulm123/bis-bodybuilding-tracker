import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMOS, type Muscle } from '../../training/demos'
import DemoSheet from '../../components/DemoSheet'

const GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Shoulders', muscles: ['shoulders'] },
  { label: 'Back', muscles: ['back'] },
  { label: 'Arms', muscles: ['biceps', 'triceps'] },
  { label: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Core', muscles: ['abs'] },
]

const title = (slug: string) => {
  const s = slug.replace(/-/g, ' ').replace(/\bdb\b/g, 'dumbbell').replace(/\brdl\b/g, 'Romanian deadlift').replace(/\bez\b/g, 'EZ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Every exercise video in one place, grouped by the main muscle worked. */
export default function ExerciseLibrary() {
  const [open, setOpen] = useState<string | null>(null)
  const [group, setGroup] = useState(0)
  const list = Object.values(DEMOS).filter((d) => GROUPS[group].muscles.includes(d.muscles[0]))

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Exercise videos</h1>
        <Link to="/train" className="btn btn-small">Back</Link>
      </div>
      <div className="chips">
        {GROUPS.map((g, i) => (
          <button key={g.label} className={`chip ${i === group ? 'chip-done' : ''}`} onClick={() => setGroup(i)}>{g.label}</button>
        ))}
      </div>
      <div className="library-grid">
        {list.map((d) => (
          <button key={d.slug} className="library-tile" onClick={() => setOpen(d.slug)}>
            <img src={`demos/${d.slug}/0.jpg`} alt="" loading="lazy" />
            <span className="library-name">{title(d.slug)}</span>
            {d.clip && <span className="library-play" aria-hidden="true">▶</span>}
          </button>
        ))}
      </div>
      {open && <DemoSheet exercise={{ id: open, name: title(open) }} onClose={() => setOpen(null)} />}
    </section>
  )
}
