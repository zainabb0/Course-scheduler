// frontend/src/pages/AdminDashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, Monitor, CalendarDays,
  Cpu, CheckCircle, AlertCircle, Clock, ArrowRight,
} from 'lucide-react'
import { departmentsApi } from '../api/departments.api'
import { coursesApi }     from '../api/courses.api'
import { instructorsApi } from '../api/instructors.api'
import { classroomsApi }  from '../api/classrooms.api'
import { schedulesApi }   from '../api/schedules.api'
import { cn } from '../lib/utils'

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        {loading
          ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
          : <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        }
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// ── Quick action ──────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, to, color }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="card p-4 text-left hover:shadow-md transition-shadow
                 hover:border-primary-200 group"
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', color)}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-600">
        {label}
        <ArrowRight size={14} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </button>
  )
}

// ── Schedule status badge ─────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    completed: 'badge-green',
    running:   'badge-yellow',
    pending:   'badge-gray',
    failed:    'badge-red',
  }
  return <span className={cn('badge', styles[status] || 'badge-gray')}>{status}</span>
}


export default function AdminDashboard() {
  const { data: depts,       isLoading: l1 } = useQuery({ queryKey: ['departments'],  queryFn: () => departmentsApi.list().then(r => r.data) })
  const { data: courses,     isLoading: l2 } = useQuery({ queryKey: ['courses'],      queryFn: () => coursesApi.list({}).then(r => r.data) })
  const { data: instructors, isLoading: l3 } = useQuery({ queryKey: ['instructors'],  queryFn: () => instructorsApi.list().then(r => r.data) })
  const { data: classrooms,  isLoading: l4 } = useQuery({ queryKey: ['classrooms'],   queryFn: () => classroomsApi.list({}).then(r => r.data) })
  const { data: schedules,   isLoading: l5 } = useQuery({ queryKey: ['schedules'],    queryFn: () => schedulesApi.list({}).then(r => r.data) })

  const latestSchedules = (schedules || []).slice(0, 5)
  const completedCount  = (schedules || []).filter(s => s.status === 'completed').length

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}    label="Courses"     value={courses?.length}     color="bg-blue-500"   loading={l2} />
        <StatCard icon={Users}       label="Instructors" value={instructors?.length} color="bg-violet-500" loading={l3} />
        <StatCard icon={Monitor}     label="Classrooms"  value={classrooms?.length}  color="bg-emerald-500" loading={l4} />
        <StatCard icon={CalendarDays}label="Schedules"   value={completedCount}      color="bg-orange-500" loading={l5} />
      </div>

      {/* Quick Actions + Recent Schedules */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={Cpu}          label="Generate"   desc="Run AI scheduler"  to="/admin/generate"   color="bg-primary-600" />
            <QuickAction icon={CalendarDays} label="View"       desc="See timetable"     to="/admin/schedule"   color="bg-emerald-600" />
            <QuickAction icon={Users}        label="Instructors"desc="Manage faculty"    to="/admin/instructors"color="bg-violet-600" />
            <QuickAction icon={BookOpen}     label="Courses"    desc="Manage courses"    to="/admin/courses"    color="bg-orange-500" />
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Schedules
          </h2>
          <div className="card overflow-hidden">
            {l5 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : latestSchedules.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Cpu size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No schedules yet</p>
                <button
                  onClick={() => useNavigate()('/admin/generate')}
                  className="btn-primary mt-3 text-xs"
                >
                  Generate First Schedule
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Year', 'Semester', 'Status', 'Fitness'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                             text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {latestSchedules.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-36">{s.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.academic_year}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{s.semester}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.fitness_score != null
                          ? <span className="font-mono text-emerald-600">{s.fitness_score.toFixed(1)}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* AI Status hint */}
      {(schedules || []).some(s => s.status === 'running') && (
        <div className="card p-4 border-yellow-200 bg-yellow-50 flex items-center gap-3">
          <Clock size={18} className="text-yellow-600 animate-pulse" />
          <p className="text-sm text-yellow-800">
            AI is currently generating a schedule —
            <a href="/admin/generate" className="font-semibold underline ml-1">
              view progress
            </a>
          </p>
        </div>
      )}

    </div>
  )
}