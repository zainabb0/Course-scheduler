// frontend/src/pages/MyCoursesPage.jsx
import { useQuery } from '@tanstack/react-query'
import { BookMarked, Users, FlaskConical } from 'lucide-react'
import { instructorsApi } from '../api/instructors.api'
import { schedulesApi }   from '../api/schedules.api'
import useAuthStore from '../store/authStore'
import { cn } from '../lib/utils'

export default function MyCoursesPage() {
  const { user } = useAuthStore()

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsApi.list().then(r => r.data),
  })
  const myProfile = instructors.find(i => i.email === user?.email)

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const latestSchedule = schedules.find(s => s.status === 'completed')

  const { data: myEntries = [], isLoading } = useQuery({
    queryKey: ['my-entries', latestSchedule?.id, myProfile?.id],
    queryFn: () => schedulesApi.getEntries(latestSchedule.id, {
      instructor_id: myProfile.id,
    }).then(r => r.data),
    enabled: !!latestSchedule?.id && !!myProfile?.id,
  })

  // Group by course
  const grouped = myEntries.reduce((acc, e) => {
    const key = `${e.course_code}_${e.session_type}`
    if (!acc[key]) acc[key] = { ...e, sessions: [] }
    acc[key].sessions.push(e)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <span className="badge badge-blue">{Object.keys(grouped).length} course-sections</span>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <BookMarked size={32} className="mx-auto mb-2 opacity-30"/>
          No courses assigned yet
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(grouped).map(g => (
            <div key={`${g.course_code}_${g.session_type}`} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  g.session_type === 'lab' ? 'bg-purple-100' : 'bg-blue-100'
                )}>
                  {g.session_type === 'lab'
                    ? <FlaskConical size={18} className="text-purple-600"/>
                    : <BookMarked size={18} className="text-blue-600"/>
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900">{g.course_code}</span>
                    <span className={cn('badge', g.session_type === 'lab' ? 'badge bg-purple-100 text-purple-700' : 'badge-blue')}>
                      {g.session_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{g.course_name}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {g.sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 capitalize">{s.day?.slice(0,3)}</span>
                      <span className="font-mono text-gray-500">{s.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{s.room_code}</span>
                      {s.section_name && <span className="badge badge-gray">Sec {s.section_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}