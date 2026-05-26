// frontend/src/pages/StudentSchedulePage.jsx
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { Printer, CalendarDays } from 'lucide-react'
import { schedulesApi } from '../api/schedules.api'
import { aiApi }        from '../api/ai.api'
import ScheduleGrid     from '../components/schedule/ScheduleGrid'
import useAuthStore     from '../store/authStore'

export default function StudentSchedulePage() {
  const { user } = useAuthStore()
  const printRef = useRef()

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })
  const latestSchedule = schedules.find(s => s.status === 'completed')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['student-schedule', latestSchedule?.id],
    queryFn: () => schedulesApi.getEntries(latestSchedule.id, {}).then(r => r.data),
    enabled: !!latestSchedule?.id,
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['time-slots'],
    queryFn: () => aiApi.getTimeSlots().then(r => r.data),
  })

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `My Schedule — ${user?.full_name}`,
  })

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">My Schedule</h1>
        <button onClick={handlePrint} className="btn-secondary text-xs">
          <Printer size={14}/> Print
        </button>
      </div>

      {latestSchedule && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays size={15}/>
          {latestSchedule.name || latestSchedule.academic_year} — {latestSchedule.semester}
        </div>
      )}

      <div className="card p-4" ref={printRef}>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-400">Loading schedule...</div>
        ) : entries.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 flex-col gap-2">
            <CalendarDays size={32} className="opacity-30"/>
            <p>No schedule available</p>
          </div>
        ) : (
          <ScheduleGrid entries={entries} slots={slots} canEdit={false}/>
        )}
      </div>
    </div>
  )
}