// Exercise demos: form tips plus either a short video clip or a start/end photo
// pair that the app cross-fades as a simple animation.
//
// Photos: free-exercise-db (github.com/yuhonas/free-exercise-db), public domain (Unlicense).
// Clips: generated with Higgsfield for this app (we own them; commercial use allowed).
// Files live in public/demos/<slug>/ (0.jpg, 1.jpg, optional clip.mp4).

export type Muscle = 'chest' | 'shoulders' | 'triceps' | 'back' | 'biceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs'

export interface Demo {
  slug: string
  cues: string[]
  muscles: Muscle[]
  /** Has public/demos/<slug>/clip.mp4 */
  clip?: boolean
}

const d = (slug: string, muscles: Muscle[], cues: string[], clip = false): Demo => ({ slug, muscles, cues, clip })

export const DEMOS: Record<string, Demo> = Object.fromEntries(
  [
    d('bench-press', ['chest', 'triceps', 'shoulders'], ['Shoulder blades squeezed together and down', 'Lower the bar to mid-chest, elbows about 45° from your body', 'Feet planted, press up and slightly back over your shoulders']),
    d('incline-db-press', ['chest', 'shoulders', 'triceps'], ['Bench at 30–45°', 'Lower the dumbbells to upper chest, elbows under the weights', 'Press up and slightly together without clanging them']),
    d('db-bench-press', ['chest', 'triceps', 'shoulders'], ['Shoulder blades pinned back', 'Lower until the dumbbells are level with your chest', 'Press up in a slight arc, wrists straight']),
    d('machine-press', ['chest', 'triceps'], ['Handles at mid-chest height', 'Keep your back flat against the pad', 'Press out without locking hard, control the return']),
    d('cable-fly', ['chest'], ['Slight bend in the elbows, keep it fixed', 'Bring your hands together in a hugging arc', 'Feel the stretch on the way back, don’t let the weight yank you']),
    d('overhead-press', ['shoulders', 'triceps'], ['Squeeze glutes and brace your core', 'Press the bar straight up, moving your head back then through', 'Finish with the bar over the middle of your feet']),
    d('db-shoulder-press', ['shoulders', 'triceps'], ['Start with dumbbells at ear height, palms forward', 'Press up until arms are nearly straight', 'Lower under control, don’t arch your lower back']),
    d('machine-shoulder-press', ['shoulders', 'triceps'], ['Seat so handles start at shoulder height', 'Press up smoothly, keep your back on the pad', 'Lower slowly to the start']),
    d('lateral-raise', ['shoulders'], ['Slight bend in the elbows', 'Raise out to the sides until arms are level with shoulders', 'Lead with the elbows, lower slowly, no swinging']),
    d('cable-lateral-raise', ['shoulders'], ['Cable from low, across the front of your body', 'Raise out to the side to shoulder height', 'Keep tension at the bottom, slow on the way down']),
    d('rear-delt-fly', ['shoulders', 'back'], ['Hinge forward with a flat back (or use the machine)', 'Open your arms out wide with soft elbows', 'Squeeze the back of the shoulders, don’t shrug']),
    d('face-pull', ['shoulders', 'back'], ['Rope at face height', 'Pull towards your eyes, elbows high and wide', 'Rotate so your hands finish beside your ears']),
    d('tricep-pushdown', ['triceps'], ['Elbows pinned to your sides', 'Push down until arms are straight, squeeze', 'Let the forearms rise to just above 90°']),
    d('overhead-cable-extension', ['triceps'], ['Face away from the cable, rope behind your head', 'Keep elbows pointing forward and still', 'Straighten your arms overhead, stretch at the bottom']),
    d('db-overhead-extension', ['triceps'], ['Hold one dumbbell overhead with both hands', 'Lower behind your head, elbows pointing up', 'Extend back up without flaring the elbows']),
    d('pull-up', ['back', 'biceps'], ['Start from a dead hang, shoulders engaged', 'Pull your chest towards the bar, elbows down', 'Lower all the way under control']),
    d('lat-pulldown', ['back', 'biceps'], ['Grip just wider than shoulders', 'Lean back slightly, pull the bar to your upper chest', 'Drive elbows down, control it back up']),
    d('barbell-row', ['back', 'biceps'], ['Hinge until your torso is about 45°, back flat', 'Pull the bar to your lower ribs', 'Lower to straight arms without bouncing']),
    d('chest-supported-row', ['back', 'biceps'], ['Chest on the incline pad', 'Pull the weights towards your hips', 'Squeeze shoulder blades together at the top']),
    d('one-arm-row', ['back', 'biceps'], ['Hand and knee on the bench, back flat', 'Pull the dumbbell to your hip', 'Don’t twist your torso to lift it']),
    d('seated-row', ['back', 'biceps'], ['Sit tall, slight bend in the knees', 'Pull the handle to your belly', 'Squeeze your shoulder blades, don’t rock back']),
    d('single-arm-cable-row', ['back', 'biceps'], ['Sit or kneel side-on to the cable', 'Pull the handle to your hip, elbow close', 'Reach forward for a full stretch']),
    d('db-curl', ['biceps'], ['Elbows pinned to your sides', 'Curl up without swinging your body', 'Lower all the way to straight arms'], true),
    d('ez-curl', ['biceps'], ['Grip the angled parts of the bar', 'Keep elbows still at your sides', 'Squeeze at the top, lower slowly']),
    d('incline-db-curl', ['biceps'], ['Lie back on a bench at about 45°', 'Arms hang straight down, palms forward', 'Curl up without letting elbows move forward']),
    d('hammer-curl', ['biceps'], ['Palms facing each other throughout', 'Elbows stay at your sides', 'Curl up, lower under control']),
    d('squat', ['quads', 'glutes'], ['Bar on your upper back, brace hard', 'Sit down and back, knees track over toes', 'Go to at least parallel, drive up through mid-foot']),
    d('hack-squat', ['quads', 'glutes'], ['Back and shoulders flat on the pads', 'Feet shoulder-width, lower until thighs are parallel', 'Push through your whole foot, don’t lock out hard']),
    d('goblet-squat', ['quads', 'glutes'], ['Hold the dumbbell at your chest', 'Squat between your knees, chest up', 'Elbows inside the knees at the bottom']),
    d('leg-press', ['quads', 'glutes'], ['Lower back stays on the pad', 'Lower until knees are about 90°', 'Press through your heels, don’t lock your knees']),
    d('bulgarian-split-squat', ['quads', 'glutes'], ['Back foot on a bench, front foot well forward', 'Drop straight down until the back knee nearly touches', 'Push up through the front heel']),
    d('walking-lunge', ['quads', 'glutes'], ['Long step forward, torso upright', 'Lower until both knees are about 90°', 'Push through the front heel into the next step']),
    d('db-reverse-lunge', ['quads', 'glutes'], ['Step back, lowering your back knee', 'Keep the front shin fairly upright', 'Drive through the front heel to stand']),
    d('leg-extension', ['quads'], ['Pad just above your ankles', 'Straighten your legs fully, squeeze', 'Lower slowly, don’t let the stack crash']),
    d('rdl', ['hamstrings', 'glutes'], ['Soft knees, push your hips back', 'Bar slides down your thighs, back flat', 'Stop when you feel a strong hamstring stretch, then stand tall']),
    d('db-rdl', ['hamstrings', 'glutes'], ['Dumbbells close to your legs', 'Hinge at the hips with a flat back', 'Squeeze glutes to stand up']),
    d('deadlift', ['hamstrings', 'glutes', 'back'], ['Bar over mid-foot, shins close', 'Flat back, chest up, pull the slack out of the bar', 'Push the floor away, lock out with glutes']),
    d('trap-bar-deadlift', ['quads', 'glutes', 'hamstrings'], ['Stand in the middle of the bar', 'Hips down, chest up, grip the handles', 'Drive up through your legs, stand tall']),
    d('leg-curl', ['hamstrings'], ['Pad just above your heels', 'Curl as far as you can, hips stay down', 'Lower slowly']),
    d('hip-thrust', ['glutes', 'hamstrings'], ['Upper back on the bench, bar over your hips', 'Drive hips up until your body is flat', 'Chin tucked, squeeze glutes hard at the top']),
    d('db-hip-thrust', ['glutes', 'hamstrings'], ['Dumbbell on your hips', 'Feet flat, push through your heels', 'Squeeze at the top, don’t over-arch']),
    d('cable-kickback', ['glutes'], ['Ankle strap on, hold the machine', 'Kick the leg back and slightly up', 'Squeeze the glute, keep your back flat']),
    d('hip-abduction', ['glutes'], ['Sit tall in the machine', 'Push your knees out wide', 'Control the return, don’t let the plates bang']),
    d('calf-raise', ['calves'], ['Balls of feet on the edge, heels hanging', 'Rise up as high as you can, pause', 'Lower into a full stretch']),
    d('hanging-leg-raise', ['abs'], ['Hang with straight arms', 'Raise your legs by curling your pelvis up', 'Lower slowly, no swinging']),
    d('plank', ['abs'], ['Elbows under shoulders', 'Body in a straight line, squeeze glutes', 'Breathe, don’t let your hips sag']),
    d('push-up', ['chest', 'triceps', 'shoulders'], ['Hands just wider than shoulders', 'Body straight from head to heels', 'Lower your chest to the floor, push back up']),
    d('abs', ['abs'], ['Curl your ribs towards your hips', 'Lower back stays on the floor', 'Slow and controlled, breathe out as you crunch']),
  ].map((x) => [x.slug, x]),
)

// Names used in the original 5-day split (and common alternatives) → demo.
const ALIASES: Record<string, string> = {
  'flat bench': 'bench-press',
  'incline db press': 'incline-db-press',
  'machine / flat press': 'machine-press',
  'seated db shoulder press': 'db-shoulder-press',
  'cable lateral raise': 'cable-lateral-raise',
  'tricep pushdown': 'tricep-pushdown',
  'pushdown': 'tricep-pushdown',
  'pull-ups / lat pulldown': 'pull-up',
  'weighted pull-up': 'pull-up',
  'chest-supported row': 'chest-supported-row',
  'single-arm cable row': 'single-arm-cable-row',
  'rear delt fly': 'rear-delt-fly',
  'ez curl': 'ez-curl',
  'incline db curl': 'incline-db-curl',
  'curl': 'db-curl',
  'hack squat / squat': 'hack-squat',
  'romanian deadlift': 'rdl',
  'seated row': 'seated-row',
  'machine shoulder press': 'machine-shoulder-press',
  'calves': 'calf-raise',
  'abs': 'abs',
}

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').trim()

/** Finds the demo for an exercise by its id, then by its name. */
export function demoFor(ex: { id: string; name: string }): Demo | undefined {
  if (DEMOS[ex.id]) return DEMOS[ex.id]
  const n = norm(ex.name)
  const loose = (s: string) => s.replace(/-/g, ' ')
  const slug = ALIASES[n] ?? Object.values(DEMOS).find((x) => loose(x.slug) === loose(n))?.slug
  return slug ? DEMOS[slug] : undefined
}

export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`)}`
}
