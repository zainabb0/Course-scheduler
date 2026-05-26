// frontend/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Monitor, BookOpen, Users,
  GraduationCap, Layers, Cpu, CalendarDays,
  Calendar, Clock, BookMarked, LogOut, ChevronLeft, BarChart3,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore   from '../../store/uiStore'
import { cn }       from '../../lib/utils'

// ── Nav configs per role ─────────────────────────────────────────
const ADMIN_NAV = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard',       end: true },
  { to: '/admin/departments', icon: Building2,       label: 'Departments' },
  { to: '/admin/classrooms',  icon: Monitor,         label: 'Classrooms' },
  { to: '/admin/courses',     icon: BookOpen,        label: 'Courses' },
  { to: '/admin/instructors', icon: Users,           label: 'Instructors' },
  { to: '/admin/students',    icon: GraduationCap,   label: 'Students' },
  { to: '/admin/sections',    icon: Layers,          label: 'Course Sections' },
  { divider: true, label: 'AI Engine' },
  { to: '/admin/generate',    icon: Cpu,             label: 'Generate' },
  { to: '/admin/schedule',    icon: CalendarDays,    label: 'Schedule View' },
  { to: '/admin/reports',     icon: BarChart3,       label: 'Reports' },
]

const INSTRUCTOR_NAV = [
  { to: '/instructor',              icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/instructor/availability', icon: Clock,           label: 'My Availability' },
  { to: '/instructor/my-courses',   icon: BookMarked,      label: 'My Courses' },
]

const STUDENT_NAV = [
  { to: '/student',          icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/student/schedule', icon: Calendar,        label: 'My Schedule' },
]

const NAV_MAP = { admin: ADMIN_NAV, instructor: INSTRUCTOR_NAV, student: STUDENT_NAV }

// ── Role badge colors ────────────────────────────────────────────
const ROLE_STYLE = {
  admin:      'bg-red-100 text-red-700',
  instructor: 'bg-blue-100 text-blue-700',
  student:    'bg-green-100 text-green-700',
}


export default function Sidebar({ role }) {
  const { user, logout }  = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const nav = NAV_MAP[role] || ADMIN_NAV

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className={cn(
      'fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-30',
      'flex flex-col transition-all duration-300',
      sidebarOpen ? 'w-60' : 'w-16',
    )}>

      {/* Logo + collapse button */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 flex-shrink-0">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">AI Scheduler</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 ml-auto"
        >
          <ChevronLeft size={16} className={cn(
            'transition-transform duration-300',
            !sidebarOpen && 'rotate-180',
          )} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map((item, i) => {
          if (item.divider) return (
            <div key={i} className="pt-4 pb-1">
              {sidebarOpen && (
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
              )}
              {!sidebarOpen && <hr className="border-gray-200 mx-2" />}
            </div>
          )

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'group relative',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={cn(
                    'flex-shrink-0',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600',
                  )} />
                  {sidebarOpen && <span>{item.label}</span>}

                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white
                                    text-xs rounded whitespace-nowrap opacity-0 pointer-events-none
                                    group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-700">
                {user?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <span className={cn('badge text-xs', ROLE_STYLE[user?.role])}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg
                       hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}