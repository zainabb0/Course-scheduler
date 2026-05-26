// frontend/src/components/layout/AppLayout.jsx
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar  from './Sidebar'
import Navbar   from './Navbar'
import Toast    from '../ui/Toast'
import useUIStore from '../../store/uiStore'
import { cn } from '../../lib/utils'

// Map route path → page title
const PAGE_TITLES = {
  '/admin':             'Dashboard',
  '/admin/departments': 'Departments',
  '/admin/classrooms':  'Classrooms',
  '/admin/courses':     'Courses',
  '/admin/instructors': 'Instructors',
  '/admin/students':    'Students',
  '/admin/sections':    'Course Sections',
  '/admin/generate':    'Generate Schedule',
  '/admin/schedule':    'Schedule View',
  '/instructor':               'Dashboard',
  '/instructor/availability':  'My Availability',
  '/instructor/my-courses':    'My Courses',
  '/student':           'Dashboard',
  '/student/schedule':  'My Schedule',
}

export default function AppLayout({ role }) {
  const { sidebarOpen } = useUIStore()
  const { pathname }    = useLocation()
  const title = PAGE_TITLES[pathname] || 'AI Course Scheduler'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />

      {/* Main content — shifts right based on sidebar width */}
      <div className={cn(
        'transition-all duration-300',
        sidebarOpen ? 'ml-60' : 'ml-16',
      )}>
        <Navbar title={title} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <Toast />
    </div>
  )
}