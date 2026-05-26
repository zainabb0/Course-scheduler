// frontend/src/hooks/useCourses.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi } from '../api/courses.api'
import useUIStore from '../store/uiStore'

export default function useCourses(params = {}) {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', params],
    queryFn:  () => coursesApi.list(params).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data) => coursesApi.create(data),
    onSuccess:  ()     => { qc.invalidateQueries(['courses']); addToast({ type: 'success', message: 'Course created' }) },
    onError:    (e)    => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => coursesApi.update(id, data),
    onSuccess:  ()             => { qc.invalidateQueries(['courses']); addToast({ type: 'success', message: 'Updated' }) },
    onError:    (e)            => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })

  const remove = useMutation({
    mutationFn: (id) => coursesApi.remove(id),
    onSuccess:  ()   => { qc.invalidateQueries(['courses']); addToast({ type: 'success', message: 'Deleted' }) },
  })

  return { courses, isLoading, create, update, remove }
}