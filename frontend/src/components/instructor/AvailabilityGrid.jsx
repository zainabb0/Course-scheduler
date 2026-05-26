// frontend/src/components/instructor/AvailabilityGrid.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { instructorsApi } from '../../api/instructors.api'
import useUIStore from '../../store/uiStore'
import { cn } from '../../lib/utils'

const DAYS  = ['sunday','monday','tuesday','wednesday','thursday']
const SLOTS = [
  { start: '08:00', label: '08:00–09:00' },
  { start: '09:00', label: '09:00–10:00' },
  { start: '10:00', label: '10:00–11:00' },
  { start: '11:00', label: '11:00–12:00' },
  { start: '12:00', label: '12:00–13:00' },
  { start: '13:00', label: '13:00–14:00' },
]

export default function AvailabilityGrid({ instructorId, readOnly = false }) {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['availability', instructorId],
    queryFn:  () => instructorsApi.getAvailability(instructorId).then(r => r.data),
    enabled:  !!instructorId,
  })

  const toggle = useMutation({
    mutationFn: ({ day, start_time, is_available }) =>
      instructorsApi.updateAvailability(instructorId, { day, start_time, is_available }),
    onSuccess: () => qc.invalidateQueries(['availability', instructorId]),
    onError:   () => addToast({ type: 'error', message: 'Update failed' }),
  })

  const isAvailable = (day, start) => {
    const found = slots.find(s => s.day === day && s.start_time === start)
    return found ? found.is_available : true
  }

  const blockedCount = slots.filter(s => !s.is_available).length

  if (isLoading) return (
    <div className="text-sm text-gray-400 py-4 text-center">Loading availability...</div>
  )

  return (
    <div className="space-y-2">
      {!readOnly && (
        <p className="text-xs text-gray-500 pb-1">
          Click to toggle.
          <span className="text-emerald-600 font-medium ml-1">Green = available</span>,
          <span className="text-red-600 font-medium ml-1">Red = blocked</span>
          {blockedCount > 0 && <span className="text-gray-400 ml-2">({blockedCount} blocked)</span>}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-500">Slot</th>
              {DAYS.map(d => (
                <th key={d} className="px-3 py-2 text-center font-semibold text-gray-500 capitalize">
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {SLOTS.map(slot => (
              <tr key={slot.start}>
                <td className="px-3 py-2 font-mono text-gray-500 bg-gray-50 whitespace-nowrap">
                  {slot.label}
                </td>
                {DAYS.map(day => {
                  const avail = isAvailable(day, slot.start)
                  return (
                    <td key={day} className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => !readOnly && toggle.mutate({ day, start_time: slot.start, is_available: !avail })}
                        disabled={readOnly || toggle.isPending}
                        className={cn(
                          'w-full py-2 rounded-lg font-bold transition-colors text-xs',
                          avail
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200',
                          readOnly && 'cursor-default',
                          toggle.isPending && 'opacity-50',
                        )}
                      >
                        {avail ? '✓' : '✗'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}