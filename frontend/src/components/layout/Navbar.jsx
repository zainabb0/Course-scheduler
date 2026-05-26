// frontend/src/components/layout/Navbar.jsx
import { Menu, Bell } from 'lucide-react'
import useUIStore   from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

export default function Navbar({ title }) {
  const { toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center
                       justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* Left: menu button + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-primary-700">
            {user?.full_name?.charAt(0) || '?'}
          </span>
        </div>
      </div>
    </header>
  )
}