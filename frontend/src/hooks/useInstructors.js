// frontend/src/hooks/useInstructors.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { instructorsApi } from '../api/instructors.api'
import useUIStore from '../store/uiStore'

export default function useInstructors() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn:  () => instructorsApi.list().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data)         => instructorsApi.create(data),
    onSuccess:  ()             => { qc.invalidateQueries(['instructors']); addToast({ type: 'success', message: 'Instructor created' }) },
    onError:    (e)            => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => instructorsApi.update(id, data),
    onSuccess:  ()             => { qc.invalidateQueries(['instructors']); addToast({ type: 'success', message: 'Updated' }) },
    onError:    (e)            => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  const remove = useMutation({
    mutationFn: (id)   => instructorsApi.remove(id),
    onSuccess:  ()     => { qc.invalidateQueries(['instructors']); addToast({ type: 'success', message: 'Deleted' }) },
  })

  const updatePreferences = useMutation({
    mutationFn: ({ id, data }) => instructorsApi.updatePreferences(id, data),
    onSuccess:  ()             => { qc.invalidateQueries(['instructors']); addToast({ type: 'success', message: 'Preferences saved' }) },
    onError:    (e)            => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  return { instructors, isLoading, create, update, remove, updatePreferences }
}