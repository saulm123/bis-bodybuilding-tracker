import type { DayTemplate, ExerciseTemplate } from '../db/schema'

// Built-in 5-day split. Fully editable in the app; this is only the starting point.
// Compounds get longer rest and bigger weight jumps than isolation work.

let n = 0
const ex = (
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  kind: 'compound' | 'db' | 'isolation' = 'isolation',
  extra: Partial<ExerciseTemplate> = {},
): ExerciseTemplate => ({
  id: `ex${++n}`,
  name,
  sets,
  repMin,
  repMax,
  restSec: kind === 'compound' ? 150 : 90,
  increment: kind === 'compound' ? 2.5 : kind === 'db' ? 2 : 1,
  ...extra,
})

export function defaultDays(): DayTemplate[] {
  n = 0
  return [
    {
      id: 'mon', weekday: 1, name: 'Push', kind: 'lift',
      exercises: [
        ex('Incline DB press', 4, 6, 10, 'db', { restSec: 150 }),
        ex('Machine / flat press', 3, 8, 10, 'compound'),
        ex('Seated DB shoulder press', 3, 8, 12, 'db', { restSec: 120 }),
        ex('Cable lateral raise', 4, 12, 20),
        ex('Cable fly', 3, 12, 15),
        ex('Tricep pushdown', 3, 10, 15),
        ex('Overhead cable extension', 3, 10, 15),
      ],
    },
    {
      id: 'tue', weekday: 2, name: 'Pull', kind: 'lift',
      exercises: [
        ex('Pull-ups / lat pulldown', 4, 6, 10, 'compound'),
        ex('Chest-supported row', 4, 8, 12, 'compound'),
        ex('Single-arm cable row', 3, 10, 12),
        ex('Rear delt fly', 3, 15, 20),
        ex('EZ curl', 3, 8, 12),
        ex('Incline DB curl', 3, 10, 12, 'db', { restSec: 90 }),
        ex('Hammer curl', 2, 12, 12, 'db', { restSec: 90 }),
      ],
    },
    {
      id: 'wed', weekday: 3, name: 'Legs', kind: 'lift',
      exercises: [
        ex('Hack squat / squat', 4, 6, 10, 'compound', { restSec: 180 }),
        ex('Romanian deadlift', 3, 8, 10, 'compound'),
        ex('Leg press', 3, 10, 15, 'compound'),
        ex('Leg curl', 4, 10, 15),
        ex('Leg extension', 3, 12, 15),
        ex('Calf raise', 4, 10, 15),
        ex('Hanging leg raise', 3, 10, 15, 'isolation', { increment: 0 }),
      ],
    },
    { id: 'thu', weekday: 4, name: 'Rest or incline walk', kind: 'cardio', exercises: [] },
    {
      id: 'fri', weekday: 5, name: 'Upper', kind: 'lift',
      exercises: [
        ex('Flat bench', 4, 5, 8, 'compound', { restSec: 180 }),
        ex('Weighted pull-up', 3, 6, 8, 'compound'),
        ex('Seated row', 3, 8, 12, 'compound'),
        ex('Machine shoulder press', 3, 8, 12, 'compound', { restSec: 120 }),
        ex('Lateral raise', 3, 15, 15, 'db', { restSec: 60 }),
        ex('Curl', 3, 10, 12, 'isolation', { superset: 'A', restSec: 0 }),
        ex('Pushdown', 3, 10, 12, 'isolation', { superset: 'A' }),
      ],
    },
    {
      id: 'sat', weekday: 6, name: 'Lower', kind: 'lift',
      exercises: [
        ex('Trap bar deadlift', 3, 4, 6, 'compound', { restSec: 180, increment: 5 }),
        ex('Bulgarian split squat', 3, 8, 10, 'db', { restSec: 120 }),
        ex('Leg curl', 3, 12, 12),
        ex('Leg extension', 3, 12, 12),
        ex('Calves', 4, 10, 15),
        ex('Abs', 3, 10, 15, 'isolation', { increment: 0, restSec: 60 }),
      ],
    },
    { id: 'sun', weekday: 7, name: 'Rest', kind: 'rest', exercises: [] },
  ]
}
