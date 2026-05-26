// frontend/src/pages/ReportsPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, Calendar, Users, Monitor,
  CheckCircle, AlertTriangle, Clock, TrendingUp,
  Download,
} from 'lucide-react'
import { schedulesApi }   from '../api/schedules.api'
import { instructorsApi } from '../api/instructors.api'
import { classroomsApi }  from '../api/classrooms.api'
import { aiApi }          from '../api/ai.api'
import FitnessChart    from '../components/charts/FitnessChart'
import RoomUsageChart  from '../components/charts/RoomUsageChart'
import { useExportExcel, useExportCSV } from '../hooks/useExport'
import { cn } from '../lib/utils'

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'bg-blue-500' }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 font-mono">{value ?? '—'}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState('')
  const exportExcel = useExportExcel()
  const exportCSV   = useExportCSV()

  // Data
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const completed = schedules.filter(s => s.status === 'completed')
  const active    = completed.find(s => s.id === selectedId) || completed[0]

  const { data: entries = [] } = useQuery({
    queryKey: ['entries-report', active?.id],
    queryFn: () => schedulesApi.getEntries(active.id, {}).then(r => r.data),
    enabled: !!active?.id,
  })
  const { data: logs = [] } = useQuery({
    queryKey: ['logs', active?.id],
    queryFn: () => schedulesApi.getLogs(active.id).then(r => r.data),
    enabled: !!active?.id,
  })
  const { data: slots = [] } = useQuery({
    queryKey: ['time-slots'],
    queryFn: () => aiApi.getTimeSlots().then(r => r.data),
  })
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsApi.list().then(r => r.data),
  })
  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.list({}).then(r => r.data),
  })

  // ── Derived stats ─────────────────────────────────────────────
  const conflictCount = entries.filter(e => e.has_conflict).length
  const editedCount   = entries.filter(e => e.is_manually_edited).length

  // Sessions per instructor
  const instSessions = {}
  entries.forEach(e => {
    if (e.instructor_name) {
      instSessions[e.instructor_name] = (instSessions[e.instructor_name] || 0) + 1
    }
  })
  const topInstructors = Object.entries(instSessions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Room utilization
  const roomSessions = {}
  entries.forEach(e => {
    if (e.room_code) {
      roomSessions[e.room_code] = (roomSessions[e.room_code] || 0) + 1
    }
  })
  const totalSlots  = slots.filter(s => !s.is_break).length
  const avgUtilPct  = classrooms.length && totalSlots
    ? Math.round((entries.length / (classrooms.length * totalSlots)) * 100)
    : 0

  // Sessions per day
  const daySessions = {}
  entries.forEach(e => {
    if (e.day) daySessions[e.day] = (daySessions[e.day] || 0) + 1
  })

  if (completed.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-gray-600">No completed schedules</p>
        <p className="text-sm mt-1">Generate a schedule first to see reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedId || active?.id || ''}
            onChange={e => setSelectedId(e.target.value)}
            className="input py-1.5 text-sm w-52"
          >
            {completed.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.academic_year} ({s.semester})
              </option>
            ))}
          </select>
          <button onClick={() => exportExcel(entries, active?.name || 'schedule')}
            className="btn-secondary text-xs">
            <Download size={13}/> Excel
          </button>
          <button onClick={() => exportCSV(entries, active?.name || 'schedule')}
            className="btn-secondary text-xs">
            <Download size={13}/> CSV
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar}      label="Total Sessions"  value={entries.length}               color="bg-blue-500" />
        <StatCard icon={TrendingUp}    label="Fitness Score"   value={active?.fitness_score?.toFixed(1)}  color="bg-emerald-500" />
        <StatCard
          icon={conflictCount > 0 ? AlertTriangle : CheckCircle}
          label="Hard Violations"
          value={active?.conflicts_count ?? 0}
          color={conflictCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}
        />
        <StatCard icon={Clock}         label="Runtime (s)"     value={active?.runtime_seconds?.toFixed(1)} color="bg-violet-500" />
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Fitness Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-primary-500" /> GA Fitness Progress
          </h2>
          <FitnessChart logs={logs} />
          {logs.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-blue-600">
                  {logs[0]?.best_fitness.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">Initial</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-emerald-600">
                  {logs[logs.length - 1]?.best_fitness.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">Final</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-violet-600">
                  +{(logs[logs.length - 1]?.best_fitness - logs[0]?.best_fitness).toFixed(1)}
                </p>
                <p className="text-xs text-gray-400">Improvement</p>
              </div>
            </div>
          )}
        </div>

        {/* Room Usage Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Monitor size={15} className="text-primary-500" /> Room Usage
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Avg utilization: <span className="font-semibold text-gray-700">{avgUtilPct}%</span>
          </p>
          <RoomUsageChart entries={entries} slots={slots} />
        </div>

        {/* Top Instructors */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={15} className="text-primary-500" /> Instructor Load
          </h2>
          {topInstructors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          ) : (
            <div className="space-y-3">
              {topInstructors.map(([name, count]) => {
                const pct = Math.round((count / Math.max(...Object.values(instSessions))) * 100)
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate max-w-48">{name}</span>
                      <span className="font-mono font-semibold">{count} sessions ({(count * 1.5).toFixed(0)}h)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sessions per day */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-primary-500" /> Sessions per Day
          </h2>
          {Object.keys(daySessions).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          ) : (
            <div className="space-y-3">
              {['sunday','monday','tuesday','wednesday','thursday'].map(day => {
                const count = daySessions[day] || 0
                const max   = Math.max(...Object.values(daySessions), 1)
                const pct   = Math.round((count / max) * 100)
                return (
                  <div key={day}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conflict details */}
      {conflictCount > 0 && (
        <div className="card overflow-hidden border-red-200">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-600" />
            <h2 className="text-sm font-semibold text-red-700">{conflictCount} Conflicting Sessions</h2>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Course','Section','Day','Time','Room','Instructor'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.filter(e => e.has_conflict).map(e => (
                <tr key={e.id} className="bg-red-50/50">
                  <td className="px-4 py-2 font-mono font-bold text-red-700">{e.course_code}</td>
                  <td className="px-4 py-2 text-gray-600">{e.section_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-600 capitalize">{e.day}</td>
                  <td className="px-4 py-2 font-mono text-gray-600">{e.start_time}</td>
                  <td className="px-4 py-2 text-gray-600">{e.room_code}</td>
                  <td className="px-4 py-2 text-gray-600">{e.instructor_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary table — all schedules */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700">All Schedules Summary</h2>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name','Year','Semester','Fitness','Violations','Runtime','Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {schedules.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{s.name || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{s.academic_year}</td>
                <td className="px-4 py-2.5 text-gray-500 capitalize">{s.semester}</td>
                <td className="px-4 py-2.5 font-mono text-emerald-600 font-semibold">
                  {s.fitness_score?.toFixed(1) ?? '—'}
                </td>
                <td className="px-4 py-2.5 font-mono">
                  <span className={s.conflicts_count === 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {s.conflicts_count ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-gray-500">
                  {s.runtime_seconds?.toFixed(1) ?? '—'}s
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn('badge', {
                    completed: 'badge-green', running: 'badge-yellow',
                    pending:   'badge-gray',  failed:  'badge-red',
                  }[s.status] || 'badge-gray')}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}