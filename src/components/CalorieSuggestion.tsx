import type { Settings } from '../db/schema'
import { saveSettings } from '../db/settings'
import type { TrendInfo } from '../weight/useTrend'

/** The every-two-weeks "eat ±200 kcal" nudge, based on the weight trend. */
export default function CalorieSuggestion({ settings, trend }: { settings: Settings; trend: TrendInfo }) {
  if (!trend.suggest || !trend.assessment) return null
  const { kcalChange, message } = trend.assessment
  const current = settings.targets[settings.phase]
  const next = current.kcal + kcalChange

  const accept = () =>
    saveSettings({
      targets: { ...settings.targets, [settings.phase]: { ...current, kcal: next } },
      lastCalorieReviewAt: new Date().toISOString(),
    })
  const dismiss = () => saveSettings({ lastCalorieReviewAt: new Date().toISOString() })

  return (
    <div className="card stack suggestion">
      <h2>Calorie check-in</h2>
      <p className="small">{message}</p>
      <p className="small">
        Suggestion: {kcalChange > 0 ? 'add' : 'drop'} 200 kcal a day ({current.kcal} → <strong>{next}</strong>). Fat absorbs the change; protein
        and carbs stay the same.
      </p>
      <button className="btn btn-primary btn-block" onClick={accept}>
        {kcalChange > 0 ? 'Add' : 'Drop'} 200 kcal
      </button>
      <button className="btn btn-ghost btn-block" onClick={dismiss}>Not now (ask again in 2 weeks)</button>
    </div>
  )
}
