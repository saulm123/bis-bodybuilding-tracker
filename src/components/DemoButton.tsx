import { useState } from 'react'
import type { ExerciseTemplate } from '../db/schema'
import { demoFor } from '../training/demos'
import DemoSheet from './DemoSheet'

/** "▶ name" chip that opens the exercise video. Use anywhere an exercise is listed. */
export default function DemoButton({ exercise, label }: { exercise: Pick<ExerciseTemplate, 'id' | 'name'>; label?: string }) {
  const [open, setOpen] = useState(false)
  if (!demoFor(exercise)) return label ? <span>{label}</span> : null
  return (
    <>
      <button
        type="button"
        className="demo-chip"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={`Watch how to do ${exercise.name}`}
      >
        <span aria-hidden="true">▶</span> {label ?? 'Video'}
      </button>
      {open && <DemoSheet exercise={exercise} onClose={() => setOpen(false)} />}
    </>
  )
}
