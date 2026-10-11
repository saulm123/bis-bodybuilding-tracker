import type { MacroTargets } from '../db/schema'
import { fatGrams } from '../lib/macros'

export default function MacroSummary({ t }: { t: MacroTargets }) {
  return (
    <div className="macro-grid">
      <div><span>Calories</span><strong>{t.kcal}</strong></div>
      <div><span>Protein</span><strong>{t.protein}g</strong></div>
      <div><span>Net carbs</span><strong>{t.netCarbs}g</strong></div>
      <div><span>Fat</span><strong>{fatGrams(t)}g</strong></div>
    </div>
  )
}
