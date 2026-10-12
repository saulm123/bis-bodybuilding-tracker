import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import Segmented from '../../components/Segmented'
import { saveSupplement } from '../../health/store'

export default function SupplementsEditor() {
  const supplements = useLiveQuery(() => db.supplements.orderBy('order').toArray(), [])
  const [name, setName] = useState('')
  if (!supplements) return null

  const move = async (i: number, dir: -1 | 1) => {
    const a = supplements[i]
    const b = supplements[i + dir]
    if (!a || !b) return
    await db.transaction('rw', db.supplements, async () => {
      await db.supplements.update(a.id, { order: b.order })
      await db.supplements.update(b.id, { order: a.order })
    })
  }

  return (
    <section className="stack">
      <div className="row-between">
        <h1>Supplements</h1>
        <Link to="/health" className="btn btn-small">Done</Link>
      </div>
      {supplements.map((s, i) => (
        <div key={s.id} className={`card stack ${s.active ? '' : 'inactive'}`}>
          <label className="field">
            <span>Name</span>
            <input value={s.name} onChange={(e) => saveSupplement({ ...s, name: e.target.value })} />
          </label>
          <Segmented
            label="When"
            value={s.timing}
            onChange={(timing) => saveSupplement({ ...s, timing })}
            options={[{ value: 'AM', label: 'Morning' }, { value: 'PM', label: 'Evening' }]}
          />
          <div className="row-actions">
            <button className="btn btn-small" onClick={() => move(i, -1)} disabled={i === 0}>Up</button>
            <button className="btn btn-small" onClick={() => move(i, 1)} disabled={i === supplements.length - 1}>Down</button>
            <button className="btn btn-small" onClick={() => saveSupplement({ ...s, active: !s.active })}>{s.active ? 'Pause' : 'Resume'}</button>
            <button className="btn btn-small btn-danger" onClick={() => db.supplements.delete(s.id)}>Remove</button>
          </div>
        </div>
      ))}
      <form
        className="row-actions"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          await saveSupplement({ name: name.trim(), order: supplements.length })
          setName('')
        }}
      >
        <input className="input grow" placeholder="Add a supplement" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" type="submit">Add</button>
      </form>
    </section>
  )
}
