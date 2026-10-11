import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Placeholder from './pages/Placeholder'
import More from './pages/More'
import Today from './pages/Today'
import Onboarding from './pages/Onboarding'
import { useSettings } from './db/settings'
import TrainHome from './pages/train/TrainHome'
import Workout from './pages/train/Workout'
import { DayEditor, ProgramEditor } from './pages/train/ProgramEditor'
import ExerciseHistory from './pages/train/ExerciseHistory'
import CardioLog from './pages/train/CardioLog'
import RestTimerBar from './components/RestTimerBar'

const tabs = [
  { to: '/today', label: 'Today', icon: '◎' },
  { to: '/train', label: 'Train', icon: '▮▮' },
  { to: '/food', label: 'Food', icon: '◐' },
  { to: '/health', label: 'Health', icon: '♥' },
  { to: '/more', label: 'More', icon: '≡' },
]

export default function App() {
  const settings = useSettings()
  if (!settings) return null // first database read takes a few ms
  if (!settings.onboarded) return <Onboarding />

  return (
    <div className="app">
      <main className="screen">
        <Routes>
          <Route path="/today" element={<Today />} />
          <Route path="/train" element={<TrainHome />} />
          <Route path="/train/session/:id" element={<Workout />} />
          <Route path="/train/program" element={<ProgramEditor />} />
          <Route path="/train/program/:dayId" element={<DayEditor />} />
          <Route path="/train/exercise/:exerciseId" element={<ExerciseHistory />} />
          <Route path="/train/cardio" element={<CardioLog />} />
          <Route path="/food" element={<Placeholder title="Food" phase="Phase 3" />} />
          <Route path="/health" element={<Placeholder title="Health" phase="Phase 5" />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <RestTimerBar />
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
