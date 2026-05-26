// frontend/src/pages/AvailabilityPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { instructorsApi } from '../api/instructors.api'
import useAuthStore from '../store/authStore'
import useUIStore   from '../store/uiStore'
import { cn } from '../lib/utils'

const DAYS  = ['sunday','monday','tuesday','wednesday','thursday']
const SLOTS = [
  { start: '08:00', end: '09:30', label: '08:00–09:30' },
  { start: '09:30', end: '11:00', label: '09:30–11:00' },
  { start: '11:00', end: '12:30', label: '11:00–12:30' },
  { start: '13:00', end: '14:30', label: '13:00–14:30' },
  { start: '14:30', end: '16:00', label: '14:30–16:00' },
]

export default function AvailabilityPage() {
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const qc = useQueryClient()

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsApi.list().then(r => r.data),
  })
  const myProfile = instructors.find(i => i.email === user?.email)

  const { data: availability = [] } = useQuery({
    queryKey: ['availability', myProfile?.id],
    queryFn: () => instructorsApi.getAvailability(myProfile.id).then(r => r.data),
    enabled: !!myProfile?.id,
  })

  const toggle = useMutation({
    mutationFn: ({ day, start_time, is_available }) =>
      instructorsApi.updateAvailability(myProfile.id, { day, start_time, is_available }),
    onSuccess: () => qc.invalidateQueries(['availability', myProfile?.id]),
    onError: () => addToast({ type: 'error', message: 'Update failed' }),
  })

  const isAvailable = (day, start) => {
    const found = availability.find(s => s.day === day && s.start_time === start)
    return found ? found.is_available : true
  }

  const blockedCount = availability.filter(s => !s.is_available).length

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">My Availability</h1>
        <span className="badge badge-gray">{blockedCount} slots blocked</span>
      </div>

      <div className="card p-2">
        <p className="text-xs text-gray-500 px-3 py-2">
          Click a slot to toggle availability. <span className="text-emerald-600 font-medium">Green = available</span>,
          <span className="text-red-600 font-medium ml-1">Red = blocked</span> (AI won't schedule you here)
        </p>
        <table className="w-full text-xs mt-1">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">Time</th>
              {DAYS.map(d => (
                <th key={d} className="px-3 py-2.5 text-center text-gray-500 font-semibold capitalize">{d.slice(0,3)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {SLOTS.map(slot => (
              <tr key={slot.start}>
                <td className="px-3 py-2 font-mono text-gray-500 bg-gray-50 whitespace-nowrap">{slot.label}</td>
                {DAYS.map(day => {
                  const avail = isAvailable(day, slot.start)
                  return (
                    <td key={day} className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => toggle.mutate({ day, start_time: slot.start, is_available: !avail })}
                        disabled={toggle.isPending}
                        className={cn(
                          'w-full py-2 rounded-lg font-medium transition-colors',
                          avail
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200',
                          toggle.isPending && 'opacity-50'
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