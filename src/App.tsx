import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
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
import FoodDay from './pages/food/FoodDay'
import AddFood from './pages/food/AddFood'
import FoodItem from './pages/food/FoodItem'
import QuickAdd from './pages/food/QuickAdd'
import NewFood from './pages/food/NewFood'
import Meals from './pages/food/Meals'
import WeightPage from './pages/WeightPage'
import HealthHome from './pages/health/HealthHome'
import BpPage from './pages/health/BpPage'
import BloodsPage from './pages/health/BloodsPage'
import PanelEditor from './pages/health/PanelEditor'
import SupplementsEditor from './pages/health/SupplementsEditor'
import ReminderSync from './components/ReminderSync'

// The cycle log only exists in the FOSS build. Vite replaces VITE_FLAVOR at build
// time, so in the Play build this whole import disappears from the app.
const CyclePage = import.meta.env.VITE_FLAVOR !== 'play' ? lazy(() => import('./pages/health/CyclePage')) : null

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
          <Route path="/food" element={<FoodDay />} />
          <Route path="/food/add" element={<AddFood />} />
          <Route path="/food/item/:foodId" element={<FoodItem />} />
          <Route path="/food/quick" element={<QuickAdd />} />
          <Route path="/food/new" element={<NewFood />} />
          <Route path="/food/meals" element={<Meals />} />
          <Route path="/health" element={<HealthHome />} />
          <Route path="/health/bp" element={<BpPage />} />
          <Route path="/health/bloods" element={<BloodsPage />} />
          <Route path="/health/bloods/new" element={<PanelEditor />} />
          <Route path="/health/bloods/:panelId" element={<PanelEditor />} />
          <Route path="/health/supplements" element={<SupplementsEditor />} />
          {CyclePage && <Route path="/health/cycle" element={<Suspense fallback={null}><CyclePage /></Suspense>} />}
          <Route path="/weight" element={<WeightPage />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <RestTimerBar />
      <ReminderSync />
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
