// frontend/src/pages/ScheduleViewPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { useRef } from 'react'
import {
  CalendarDays, Filter, Printer, Download,
  AlertTriangle, CheckCircle, RefreshCw,
} from 'lucide-react'
import { schedulesApi }   from '../api/schedules.api'
import { departmentsApi } from '../api/departments.api'
import { aiApi }          from '../api/ai.api'
import ScheduleGrid from '../components/schedule/ScheduleGrid'
import useUIStore   from '../store/uiStore'
import useAuthStore from '../store/authStore'
import { cn }       from '../lib/utils'

// ── Excel export ──────────────────────────────────────────────────
function exportToExcel(entries, scheduleName) {
  import('xlsx').then(XLSX => {
    const rows = entries.map(e => ({
      Day: e.day, Time: e.start_time, Course: e.course_code,
      Name: e.course_name, Section: e.section_name,
      Instructor: e.instructor_name, Room: e.room_code,
      Type: e.session_type, Conflict: e.has_conflict ? 'Yes' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule')
    XLSX.writeFile(wb, `${scheduleName || 'schedule'}.xlsx`)
  })
}

export default function ScheduleViewPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  const printRef = useRef()

  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [yearFilter, setYearFilter]                  = useState('')
  const [showConflictsOnly, setShowConflictsOnly]    = useState(false)

  const isAdmin = user?.role === 'admin'

  // ── Data ─────────────────────────────────────────────────────
  const {
    data: schedules = [],
    isError: schedulesError,
    error: schedulesErrorObj,
  } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const completedSchedules = schedules.filter(s => s.status === 'completed')

  const activeSchedule = completedSchedules.find(s => s.id === selectedScheduleId)
    || completedSchedules[0]

  const {
    data: entries = [],
    isLoading: loadEntries,
    isError: entriesError,
    error: entriesErrorObj,
  } = useQuery({
    queryKey: ['entries', activeSchedule?.id, yearFilter],
    queryFn: () => schedulesApi.getEntries(activeSchedule.id, {
      study_year_id: yearFilter || undefined,
    }).then(r => r.data),
    enabled: !!activeSchedule?.id,
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['time-slots'],
    queryFn: () => aiApi.getTimeSlots().then(r => r.data),
  })

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  // Flatten study years for filter
  const { data: allYears = [] } = useQuery({
    queryKey: ['all-study-years-flat'],
    queryFn: async () => {
      const all = []
      for (const d of depts) {
        const r = await departmentsApi.listYears(d.id)
        all.push(...r.data)
      }
      return all
    },
    enabled: depts.length > 0,
  })

  // ── Drag & drop mutation ──────────────────────────────────────
  const editEntry = useMutation({
    mutationFn: ({ entryId, time_slot_id, room_id }) =>
      schedulesApi.editEntry(activeSchedule.id, entryId, { time_slot_id, room_id }),
    onSuccess: () => {
      qc.invalidateQueries(['entries', activeSchedule?.id])
      addToast({ type: 'success', message: 'Entry moved' })
    },
    onError: () => addToast({ type: 'error', message: 'Move failed' }),
  })

  // ── Print ─────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: activeSchedule?.name || 'Schedule',
  })

  // ── Derived stats ─────────────────────────────────────────────
  const conflictCount  = entries.filter(e => e.has_conflict).length
  const editedCount    = entries.filter(e => e.is_manually_edited).length
  const displayEntries = showConflictsOnly
    ? entries.filter(e => e.has_conflict)
    : entries

  if (schedulesError) {
    return (
      <div className="card p-10 text-center text-red-500">
        <CalendarDays size={40} className="mx-auto mb-3 opacity-30"/>
        <p className="font-semibold">تعذر تحميل الجداول</p>
        <p className="text-sm mt-1">{schedulesErrorObj?.message || 'حدث خطأ في الاتصال بالخادم'}</p>
      </div>
    )
  }

  if (completedSchedules.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        <CalendarDays size={40} className="mx-auto mb-3 opacity-30"/>
        <p className="font-semibold text-gray-600">No completed schedules yet</p>
        <p className="text-sm mt-1">Generate a schedule first from the Generate page</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="page-header flex-wrap gap-3">
        <h1 className="page-title">Schedule View</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {conflictCount > 0 && (
            <span className="badge badge-red flex items-center gap-1">
              <AlertTriangle size={12}/> {conflictCount} conflicts
            </span>
          )}
          {editedCount > 0 && (
            <span className="badge badge-yellow">✏ {editedCount} manually edited</span>
          )}
          <button onClick={handlePrint} className="btn-secondary text-xs">
            <Printer size={14}/> Print
          </button>
          <button
            onClick={() => exportToExcel(entries, activeSchedule?.name)}
            className="btn-secondary text-xs"
          >
            <Download size={14}/> Excel
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-4">

        {/* Schedule selector */}
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-gray-400"/>
          <select
            value={selectedScheduleId || activeSchedule?.id || ''}
            onChange={e => setSelectedScheduleId(e.target.value)}
            className="input py-1.5 text-sm w-56"
          >
            {completedSchedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.academic_year} ({s.semester})
              </option>
            ))}
          </select>
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400"/>
          <button
            onClick={() => setYearFilter('')}
            className={cn('px-3 py-1 rounded-lg text-xs font-medium border',
              !yearFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
            All
          </button>
          {allYears.map(y => (
            <button key={y.id} onClick={() => setYearFilter(y.id)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium border',
                yearFilter === y.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
              {y.label}
            </button>
          ))}
        </div>

        {/* Conflicts toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={showConflictsOnly}
            onChange={e => setShowConflictsOnly(e.target.checked)} className="rounded"/>
          Show conflicts only
        </label>
      </div>

      {/* Stats row */}
      {activeSchedule && (
        <div className="grid grid-cols-4 gap-3">
          {[
            ['Total Sessions',  entries.length,                    'text-gray-900'],
            ['Fitness Score',   activeSchedule.fitness_score?.toFixed(1), 'text-emerald-600'],
            ['Hard Violations', activeSchedule.conflicts_count,    conflictCount > 0 ? 'text-red-600' : 'text-emerald-600'],
            ['Runtime (s)',     activeSchedule.runtime_seconds?.toFixed(1), 'text-gray-700'],
          ].map(([label, val, color]) => (
            <div key={label} className="card p-3 text-center">
              <p className={cn('text-xl font-bold font-mono', color)}>{val ?? '—'}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="card p-4" ref={printRef}>
        {/* Print header */}
        <div className="hidden print:block mb-4">
          <h2 className="text-lg font-bold">{activeSchedule?.name}</h2>
          <p className="text-sm text-gray-500">{activeSchedule?.academic_year} — {activeSchedule?.semester}</p>
          {yearFilter && <p className="text-sm text-gray-500">Year: {allYears.find(y => y.id === yearFilter)?.label}</p>}
        </div>

        {loadEntries ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2"/> Loading schedule...
          </div>
        ) : entriesError ? (
          <div className="h-48 flex items-center justify-center text-red-500 flex-col gap-2">
            <CalendarDays size={32} className="opacity-30"/>
            <p>خطأ في تحميل البيانات</p>
            <p className="text-sm">{entriesErrorObj?.message || 'تحقق من الخادم أو اتصال الشبكة'}</p>
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 flex-col gap-2">
            <CalendarDays size={32} className="opacity-30"/>
            <p>{showConflictsOnly ? 'No conflicts found!' : 'No entries to display'}</p>
            {showConflictsOnly && (
              <span className="badge badge-green"><CheckCircle size={12}/> All clear</span>
            )}
          </div>
        ) : (
          <ScheduleGrid
            entries={displayEntries}
            slots={slots}
            studyYears={allYears}
            canEdit={isAdmin}
            onDrop={(entryId, time_slot_id, room_id) =>
              editEntry.mutate({ entryId, time_slot_id, room_id })
            }
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="font-semibold">Color legend:</span>
        {['Year 1','Year 2','Year 3','Year 4'].map((y, i) => (
          <span key={y} className={cn('px-2 py-0.5 rounded border text-xs', YEAR_COLORS[i])}>{y}</span>
        ))}
        <span className="px-2 py-0.5 rounded border border-red-300 bg-red-50 text-red-700">⚠ Conflict</span>
        <span className="px-2 py-0.5 rounded border border-yellow-300 bg-yellow-50 text-yellow-700">✏ Edited</span>
        {isAdmin && <span className="text-gray-400 italic">Drag cards to reschedule</span>}
      </div>
    </div>
  )
}

import { YEAR_COLORS } from '../lib/utils'