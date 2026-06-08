// frontend/src/pages/ClassroomsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Monitor, FlaskConical } from 'lucide-react'
import { classroomsApi }  from '../api/classrooms.api'
import { departmentsApi } from '../api/departments.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'
import { cn }        from '../lib/utils'

const schema = z.object({
  name:          z.string().min(1),
  code:          z.string().min(1).max(20),
  capacity:      z.coerce.number().int().min(1).max(500),
  room_type:     z.enum(['lecture','lab','both']),
  has_projector: z.boolean().default(true),
  has_computers: z.boolean().default(false),
  is_shared:     z.boolean().default(false),
  department_id: z.string().optional(),
}).refine((data) => data.is_shared || !!data.department_id, {
  message: 'Department is required for non-shared rooms',
  path: ['department_id'],
})

const ROOM_TYPE_ICON = {
  lecture: <Monitor size={14} className="text-blue-500" />,
  lab:     <FlaskConical size={14} className="text-purple-500" />,
  both:    <Monitor size={14} className="text-emerald-500" />,
}
const ROOM_TYPE_BADGE = {
  lecture: 'badge-blue',
  lab:     'badge bg-purple-100 text-purple-700',
  both:    'badge-green',
}

function ClassroomForm({ defaultValues, onSubmit, loading, depts }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { has_projector: true, has_computers: false, is_shared: false, ...defaultValues },
  })
  const isShared = watch('is_shared')
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Name</label>
          <input {...register('name')} className="input" placeholder="Hall A" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Code</label>
          <input {...register('code')} className="input" placeholder="HALL-A" />
          {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Capacity</label>
          <input {...register('capacity')} type="number" className="input" />
          {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}
        </div>
        <div>
          <label className="label">Room Type</label>
          <select {...register('room_type')} className="input">
            <option value="lecture">Lecture Hall</option>
            <option value="lab">Lab</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Department</label>
        <select {...register('department_id')} disabled={isShared} className="input">
          <option value="">Select department</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <p className="mt-1 text-xs text-gray-500">Department is optional for shared rooms.</p>
        {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id.message}</p>}
      </div>
      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('is_shared')} type="checkbox" className="rounded" />
          Shared across all departments
        </label>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('has_projector')} type="checkbox" className="rounded" />
          Has Projector
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('has_computers')} type="checkbox" className="rounded" />
          Has Computers
        </label>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function ClassroomsPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [typeFilter, setTypeFilter] = useState('')

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ['classrooms', typeFilter],
    queryFn: () => classroomsApi.list({ room_type: typeFilter || undefined, active_only: true }).then(r => r.data),
  })
  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  const getDeptName = (deptId) => depts.find(d => d.id === deptId)?.name || '—'

  const create = useMutation({
    mutationFn: (data) => classroomsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['classrooms']); setModal(null); addToast({ type: 'success', message: 'Classroom created' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => classroomsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['classrooms']); setModal(null); addToast({ type: 'success', message: 'Updated' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const remove = useMutation({
    mutationFn: (id) => classroomsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['classrooms']); addToast({ type: 'success', message: 'Deleted' }) },
  })

  const columns = [
    {
      key: 'name', label: 'Room', sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          {ROOM_TYPE_ICON[row.room_type]}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-400 font-mono">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'room_type', label: 'Type', sortable: true,
      render: (row) => <span className={cn('badge', ROOM_TYPE_BADGE[row.room_type])}>{row.room_type}</span>,
    },
    {
      key: 'capacity', label: 'Capacity', sortable: true,
      render: (row) => <span className="font-mono text-sm">{row.capacity}</span>,
    },
    {
      key: 'department_id', label: 'Department',
      render: (row) => row.is_shared
        ? <span className="badge bg-yellow-100 text-yellow-700">Shared</span>
        : <span className="badge badge-blue">{getDeptName(row.department_id)}</span>,
    },
    {
      key: 'features', label: 'Features',
      render: (row) => (
        <div className="flex gap-1">
          {row.has_projector && <span className="badge badge-gray">📽 Projector</span>}
          {row.has_computers && <span className="badge badge-gray">💻 Computers</span>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Classrooms</h1>
        <button className="btn-primary" onClick={() => { setSelected(null); setModal('form') }}>
          <Plus size={16}/> Add Classroom
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {['','lecture','lab','both'].map(t => (
          <button key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              typeFilter === t
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            )}>
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns} data={classrooms} loading={isLoading}
        searchKeys={['name','code']} emptyText="No classrooms found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setSelected(row); setModal('form') }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              <Pencil size={14}/>
            </button>
            <button onClick={() => setConfirm({ id: row.id, name: row.name })}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
              <Trash2 size={14}/>
            </button>
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)}
        title={selected ? 'Edit Classroom' : 'New Classroom'}>
        <ClassroomForm
          defaultValues={selected || {}}
          depts={depts}
          onSubmit={(data) => selected ? update.mutate({ id: selected.id, data }) : create.mutate(data)}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate(confirm.id)}
        title="Delete Classroom" message={`Delete "${confirm?.name}"?`} danger
      />
    </div>
  )
}