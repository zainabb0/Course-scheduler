// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AppLayout from './components/layout/AppLayout'

// Pages — Admin
import LoginPage          from './pages/LoginPage'
import AdminDashboard     from './pages/AdminDashboard'
import DepartmentsPage    from './pages/DepartmentsPage'
import ClassroomsPage     from './pages/ClassroomsPage'
import CoursesPage        from './pages/CoursesPage'
import InstructorsPage    from './pages/InstructorsPage'
import StudentsPage       from './pages/StudentsPage'
import CourseSectionsPage from './pages/CourseSectionsPage'
import GeneratePage       from './pages/GeneratePage'
import ScheduleViewPage   from './pages/ScheduleViewPage'
import ReportsPage        from './pages/ReportsPage'

// Pages — Instructor
import InstructorDashboard from './pages/InstructorDashboard'
import AvailabilityPage    from './pages/AvailabilityPage'
import MyCoursesPage       from './pages/MyCoursesPage'

// Pages — Student
import StudentDashboard    from './pages/StudentDashboard'
import StudentSchedulePage from './pages/StudentSchedulePage'


// ── Protected Route ──────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore()

  if (!token || !user) return <Navigate to="/" replace />

  if (roles && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    if (user.role === 'admin')      return <Navigate to="/admin"      replace />
    if (user.role === 'instructor') return <Navigate to="/instructor" replace />
    if (user.role === 'student')    return <Navigate to="/student"    replace />
  }
  return children
}

// ── Role-based home redirect ─────────────────────────────────────
function HomeRedirect() {
  const { user, token } = useAuthStore()
  if (!token || !user) return <LoginPage />
  if (user.role === 'admin')      return <Navigate to="/admin"      replace />
  if (user.role === 'instructor') return <Navigate to="/instructor" replace />
  if (user.role === 'student')    return <Navigate to="/student"    replace />
  return <LoginPage />
}


// ── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route index              element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="classrooms"  element={<ClassroomsPage />} />
          <Route path="courses"     element={<CoursesPage />} />
          <Route path="instructors" element={<InstructorsPage />} />
          <Route path="students"    element={<StudentsPage />} />
          <Route path="sections"    element={<CourseSectionsPage />} />
          <Route path="generate"    element={<GeneratePage />} />
          <Route path="schedule"    element={<ScheduleViewPage />} />
          <Route path="reports"     element={<ReportsPage />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={
          <ProtectedRoute roles={['instructor', 'admin']}>
            <AppLayout role="instructor" />
          </ProtectedRoute>
        }>
          <Route index              element={<InstructorDashboard />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="my-courses"   element={<MyCoursesPage />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute roles={['student', 'admin']}>
            <AppLayout role="student" />
          </ProtectedRoute>
        }>
          <Route index           element={<StudentDashboard />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}