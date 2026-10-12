import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Food } from '../../db/schema'
import Scanner from '../../components/Scanner'
import { lookupBarcode, searchOff, type OffFood } from '../../nutrition/off'
import { recentFoods, saveFood, searchLocal } from '../../nutrition/store'
import { db } from '../../db/schema'
import { useDateParam } from './useDateParam'

export default function AddFood() {
  const [date] = useDateParam()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(params.get('scan') === '1')
  const [query, setQuery] = useState('')
  const [local, setLocal] = useState<Food[]>([])
  const [online, setOnline] = useState<OffFood[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recents = useLiveQuery(() => recentFoods(), [])

  const open = useCallback((food: Food) => navigate(`/food/item/${food.id}?date=${date}`), [navigate, date])
  const openOnline = async (f: OffFood) => open(await saveFood(f))

  useEffect(() => {
    let live = true
    searchLocal(query).then((r) => live && setLocal(r))
    return () => {
      live = false
    }
  }, [query])

  const searchOnline = async () => {
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    try {
      setOnline(await searchOff(query.trim()))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onDetected = useCallback(
    async (code: string) => {
      setScanning(false)
      setBusy(true)
      setError(null)
      try {
        // Already scanned before? Use the saved copy (works offline).
        const saved = await db.foods.where('barcode').equals(code).first()
        if (saved) return open(saved)
        const found = await lookupBarcode(code)
        if (found) return open(await saveFood(found))
        setError(`Barcode ${code} isn't in Open Food Facts yet. Add it as your own food.`)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [open],
  )

  return (
    <section className="stack">
      {scanning && <Scanner onDetected={onDetected} onClose={() => setScanning(false)} />}
      <div className="row-between">
        <h1>Add food</h1>
        <Link to={`/food?date=${date}`} className="btn btn-small">Done</Link>
      </div>

      <form
        className="row-actions"
        onSubmit={(e) => {
          e.preventDefault()
          searchOnline()
        }}
      >
        <input className="input grow" type="search" placeholder="Search foods" value={query} onChange={(e) => { setQuery(e.target.value); setOnline(null) }} />
        <button className="btn" type="button" onClick={() => setScanning(true)} aria-label="Scan barcode">Scan</button>
      </form>

      {busy && <p className="muted">Looking it up…</p>}
      {error && (
        <div className="stack">
          <p className="warn">{error}</p>
        </div>
      )}

      {query && (
        <div className="card">
          <h2>Your foods</h2>
          {local.length ? <FoodList foods={local} onPick={open} /> : <p className="muted small">No saved foods match.</p>}
          {online === null ? (
            <button className="btn btn-block" onClick={searchOnline} disabled={busy}>Search Open Food Facts</button>
          ) : (
            <>
              <h2 className="mt">Open Food Facts</h2>
              {online.length ? <FoodList foods={online} onPick={openOnline} /> : <p className="muted small">No results.</p>}
            </>
          )}
        </div>
      )}

      {!query && !!recents?.length && (
        <div className="card">
          <h2>Recent</h2>
          <FoodList foods={recents} onPick={open} />
        </div>
      )}

      <Link className="btn btn-ghost btn-block" to={`/food/new?date=${date}`}>Create your own food</Link>
    </section>
  )
}

function FoodList<T extends OffFood>({ foods, onPick }: { foods: T[]; onPick: (f: T) => void }) {
  return (
    <ul className="list">
      {foods.map((f, i) => (
        <li key={(f as { id?: string }).id ?? `${f.barcode}-${i}`}>
          <button className="list-row plain" onClick={() => onPick(f)}>
            <span>
              {f.favourite ? '★ ' : ''}
              {f.name}
              {f.brand && <span className="muted small"> · {f.brand}</span>}
            </span>
            <span className="muted small">{f.per100.kcal} kcal/100g</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
