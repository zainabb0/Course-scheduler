// frontend/src/hooks/useSchedule.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schedulesApi } from '../api/schedules.api'
import { aiApi }        from '../api/ai.api'
import useScheduleStore from '../store/scheduleStore'
import useUIStore       from '../store/uiStore'

export default function useSchedule() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const { activeScheduleId, yearFilter } = useScheduleStore()

  // All schedules list
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['schedules'],
    queryFn:  () => schedulesApi.list({}).then(r => r.data),
  })

  // Active schedule entries (timetable)
  const { data: entries = [], isLoading: loadingEntries, refetch: refetchEntries } = useQuery({
    queryKey: ['entries', activeScheduleId, yearFilter],
    queryFn:  () => schedulesApi.getEntries(activeScheduleId, {
      study_year_id: yearFilter || undefined,
    }).then(r => r.data),
    enabled: !!activeScheduleId,
  })

  // GA generation logs (FitnessChart)
  const { data: logs = [] } = useQuery({
    queryKey: ['logs', activeScheduleId],
    queryFn:  () => schedulesApi.getLogs(activeScheduleId).then(r => r.data),
    enabled:  !!activeScheduleId,
  })

  // Time slots for grid
  const { data: slots = [] } = useQuery({
    queryKey: ['time-slots'],
    queryFn:  () => aiApi.getTimeSlots().then(r => r.data),
  })

  // Manual drag-and-drop edit
  const editEntry = useMutation({
    mutationFn: ({ entryId, time_slot_id, room_id }) =>
      schedulesApi.editEntry(activeScheduleId, entryId, { time_slot_id, room_id }),
    onSuccess: () => {
      qc.invalidateQueries(['entries', activeScheduleId])
      addToast({ type: 'success', message: 'Entry moved' })
    },
    onError: () => addToast({ type: 'error', message: 'Move failed' }),
  })

  // Delete schedule
  const deleteSchedule = useMutation({
    mutationFn: (id) => schedulesApi.remove(id),
    onSuccess:  ()   => { qc.invalidateQueries(['schedules']); addToast({ type: 'success', message: 'Schedule deleted' }) },
  })

  const completedSchedules = schedules.filter(s => s.status === 'completed')
  const activeSchedule     = completedSchedules.find(s => s.id === activeScheduleId) || completedSchedules[0]

  return {
    schedules,
    completedSchedules,
    activeSchedule,
    entries,
    logs,
    slots,
    loadingSchedules,
    loadingEntries,
    refetchEntries,
    editEntry,
    deleteSchedule,
  }
}