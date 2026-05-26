// frontend/src/pages/InstructorDashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { BookMarked, Clock, CalendarDays } from 'lucide-react'
import { instructorsApi } from '../api/instructors.api'
import { schedulesApi }   from '../api/schedules.api'
import { aiApi }          from '../api/ai.api'
import useAuthStore       from '../store/authStore'
import ScheduleGrid       from '../components/schedule/ScheduleGrid'

export default function InstructorDashboard() {
  const { user } = useAuthStore()

  // Get instructor profile to find instructor_id
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsApi.list().then(r => r.data),
  })
  const myProfile = instructors.find(i => i.email === user?.email)

  // Latest completed schedule
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const latestSchedule = schedules.find(s => s.status === 'completed')

  // My entries in latest schedule
  const { data: myEntries = [], isLoading } = useQuery({
    queryKey: ['my-entries', latestSchedule?.id, myProfile?.id],
    queryFn: () => schedulesApi.getEntries(latestSchedule.id, {
      instructor_id: myProfile.id,
    }).then(r => r.data),
    enabled: !!latestSchedule?.id && !!myProfile?.id,
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['time-slots'],
    queryFn: () => aiApi.getTimeSlots().then(r => r.data),
  })

  // My courses (unique)
  const myCourses = [...new Map(myEntries.map(e => [e.course_code, e])).values()]
  const totalHours = myEntries.length * 1.5  // each slot = 90 min

  return (
    <div className="space-y-6">

      {/* Welcome + stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 col-span-3 lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold mb-3">
            {user?.full_name?.charAt(0)}
          </div>
          <p className="font-bold text-lg">{myProfile?.title} {user?.full_name}</p>
          <p className="text-primary-200 text-sm">{user?.email}</p>
          <div className="mt-3 flex items-center gap-2 text-primary-100 text-sm">
            <Clock size={14}/> Max {myProfile?.max_hours_week}h/week
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookMarked size={18} className="text-blue-600"/>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
            <p className="text-xs text-gray-500">Courses This Semester</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CalendarDays size={18} className="text-emerald-600"/>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(0)}h</p>
            <p className="text-xs text-gray-500">Weekly Teaching Hours</p>
          </div>
        </div>
      </div>

      {/* My courses list */}
      {myCourses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">My Courses</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Code','Course','Sessions','Room','Type'].map(h =>
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {myCourses.map(e => (
                <tr key={e.course_code} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-bold text-primary-700">{e.course_code}</td>
                  <td className="px-4 py-2.5 text-gray-900">{e.course_name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{myEntries.filter(x => x.course_code === e.course_code).length} session(s)</td>
                  <td className="px-4 py-2.5 text-gray-500">{e.room_code}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${e.session_type === 'lab' ? 'badge bg-purple-100 text-purple-700' : 'badge-blue'}`}>
                      {e.session_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* My schedule grid */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CalendarDays size={15}/> My Weekly Schedule
          {latestSchedule && <span className="badge badge-gray ml-1">{latestSchedule.academic_year} {latestSchedule.semester}</span>}
        </h2>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : myEntries.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
            <CalendarDays size={28} className="opacity-30"/>
            <p>No schedule assigned yet</p>
          </div>
        ) : (
          <ScheduleGrid entries={myEntries} slots={slots} canEdit={false}/>
        )}
      </div>
    </div>
  )
}