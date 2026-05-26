// frontend/src/pages/StudentDashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, GraduationCap } from 'lucide-react'
import { studentsApi }    from '../api/students.api'
import { schedulesApi }   from '../api/schedules.api'
import { departmentsApi } from '../api/departments.api'
import useAuthStore from '../store/authStore'

export default function StudentDashboard() {
  const { user } = useAuthStore()

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const latestSchedule = schedules.find(s => s.status === 'completed')

  const { data: myEntries = [] } = useQuery({
    queryKey: ['student-entries', latestSchedule?.id],
    queryFn: () => schedulesApi.getEntries(latestSchedule.id, {}).then(r => r.data),
    enabled: !!latestSchedule?.id,
  })

  const uniqueCourses = [...new Map(myEntries.map(e => [e.course_code, e])).values()]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold mb-3">
          {user?.full_name?.charAt(0)}
        </div>
        <p className="font-bold text-xl">{user?.full_name}</p>
        <p className="text-emerald-200 text-sm">{user?.email}</p>
        <div className="mt-3 flex items-center gap-2 text-emerald-100 text-sm">
          <GraduationCap size={15}/> Computer Science
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-blue-600"/>
          </div>
          <div>
            <p className="text-2xl font-bold">{uniqueCourses.length}</p>
            <p className="text-xs text-gray-500">Enrolled Courses</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CalendarDays size={18} className="text-emerald-600"/>
          </div>
          <div>
            <p className="text-2xl font-bold">{myEntries.length}</p>
            <p className="text-xs text-gray-500">Weekly Sessions</p>
          </div>
        </div>
      </div>

      {/* My courses */}
      {uniqueCourses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">My Courses This Semester</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Code','Course','Day','Time','Room'].map(h =>
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {myEntries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">{e.course_code}</td>
                  <td className="px-4 py-2.5 text-gray-900">{e.course_name}</td>
                  <td className="px-4 py-2.5 text-gray-500 capitalize">{e.day?.slice(0,3)}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{e.start_time}</td>
                  <td className="px-4 py-2.5 text-gray-500">{e.room_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}