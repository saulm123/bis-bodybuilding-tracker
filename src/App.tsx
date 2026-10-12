import { lazy, Suspense, useEffect } from 'react'
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
import PlanPicker from './pages/train/PlanPicker'
import ExerciseLibrary from './pages/train/ExerciseLibrary'
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
import TabIcon from './components/TabIcon'
import ErrorBoundary from './components/ErrorBoundary'
import WorkoutSummary from './pages/train/WorkoutSummary'
import BadgesPage from './pages/BadgesPage'
import CheckInsPage from './pages/checkin/CheckInsPage'
import CheckInEditor from './pages/checkin/CheckInEditor'
import ComparePage from './pages/checkin/ComparePage'

// The cycle log only exists in the FOSS build. Vite replaces VITE_FLAVOR at build
// time, so in the Play build this whole import disappears from the app.
const CyclePage = import.meta.env.VITE_FLAVOR !== 'play' ? lazy(() => import('./pages/health/CyclePage')) : null

const tabs = [
  { to: '/today', label: 'Today', icon: 'today' },
  { to: '/train', label: 'Train', icon: 'train' },
  { to: '/food', label: 'Food', icon: 'food' },
  { to: '/health', label: 'Health', icon: 'health' },
  { to: '/more', label: 'More', icon: 'more' },
] as const

export default function App() {
  const settings = useSettings()
  const theme = settings?.theme ?? 'dark'
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const light = theme === 'light' || (theme === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f4f4f2' : '#0d0d0d')
  }, [theme])
  if (!settings) return null // first database read takes a few ms
  if (!settings.onboarded) return <Onboarding />

  return (
    <div className="app">
      <main className="screen">
        <ErrorBoundary>
        <Routes>
          <Route path="/today" element={<Today />} />
          <Route path="/train" element={<TrainHome />} />
          <Route path="/train/session/:id" element={<Workout />} />
          <Route path="/train/program" element={<ProgramEditor />} />
          <Route path="/train/plans" element={<PlanPicker />} />
          <Route path="/train/library" element={<ExerciseLibrary />} />
          <Route path="/train/summary/:id" element={<WorkoutSummary />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/checkins" element={<CheckInsPage />} />
          <Route path="/checkins/new" element={<CheckInEditor />} />
          <Route path="/checkins/compare" element={<ComparePage />} />
          <Route path="/checkins/:checkInId" element={<CheckInEditor />} />
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
        </ErrorBoundary>
      </main>
      <RestTimerBar />
      <ReminderSync />
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className="tab">
            <TabIcon name={t.icon} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
