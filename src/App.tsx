import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Placeholder from './pages/Placeholder'
import More from './pages/More'

const tabs = [
  { to: '/today', label: 'Today', icon: '◎' },
  { to: '/train', label: 'Train', icon: '▮▮' },
  { to: '/food', label: 'Food', icon: '◐' },
  { to: '/health', label: 'Health', icon: '♥' },
  { to: '/more', label: 'More', icon: '≡' },
]

export default function App() {
  return (
    <div className="app">
      <main className="screen">
        <Routes>
          <Route path="/today" element={<Placeholder title="Today" phase="Phases 3–5" />} />
          <Route path="/train" element={<Placeholder title="Train" phase="Phase 2" />} />
          <Route path="/food" element={<Placeholder title="Food" phase="Phase 3" />} />
          <Route path="/health" element={<Placeholder title="Health" phase="Phase 5" />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className="tab">
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
