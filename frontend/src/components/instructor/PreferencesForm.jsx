// frontend/src/components/instructor/PreferencesForm.jsx
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { instructorsApi } from '../../api/instructors.api'
import useUIStore from '../../store/uiStore'
import { DAYS, DAY_LABELS } from '../../lib/constants'

export default function PreferencesForm({ instructorId }) {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences', instructorId],
    queryFn:  () => instructorsApi.getPreferences(instructorId).then(r => r.data),
    enabled:  !!instructorId,
  })

  const { register, handleSubmit } = useForm({
    values: {
      preferred_time:      prefs?.preferred_time      || 'no_preference',
      max_consecutive_hrs: prefs?.max_consecutive_hrs || 3,
      preferred_days_off:  prefs?.preferred_days_off  || [],
    },
  })

  const save = useMutation({
    mutationFn: (data) => instructorsApi.updatePreferences(instructorId, data),
    onSuccess:  ()     => { qc.invalidateQueries(['preferences', instructorId]); addToast({ type: 'success', message: 'Preferences saved' }) },
    onError:    (e)    => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  if (isLoading) return <div className="text-sm text-gray-400 py-4">Loading...</div>

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">

      {/* Preferred Time */}
      <div>
        <label className="label">Preferred Teaching Time</label>
        <select {...register('preferred_time')} className="input">
          <option value="no_preference">No Preference</option>
          <option value="morning">Morning (before 12:00)</option>
          <option value="afternoon">Afternoon (after 12:00)</option>
        </select>
      </div>

      {/* Max consecutive hours */}
      <div>
        <label className="label">Max Consecutive Hours</label>
        <input
          {...register('max_consecutive_hrs')}
          type="number" min={1} max={6}
          className="input"
        />
        <p className="text-xs text-gray-400 mt-1">
          AI will try not to schedule more than this many back-to-back hours
        </p>
      </div>

      {/* Preferred days off */}
      <div>
        <label className="label">Preferred Days Off</label>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {DAYS.map(day => (
            <label key={day} className="flex flex-col items-center gap-1 cursor-pointer">
              <input
                {...register('preferred_days_off')}
                type="checkbox" value={day}
                className="rounded"
              />
              <span className="text-xs text-gray-600 capitalize">{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}