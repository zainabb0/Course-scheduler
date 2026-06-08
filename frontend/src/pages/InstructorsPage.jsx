// frontend/src/pages/InstructorsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { instructorsApi } from '../api/instructors.api'
import { departmentsApi } from '../api/departments.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'
import { cn }        from '../lib/utils'

const createSchema = z.object({
  full_name:      z.string().min(2),
  email:          z.string().email(),
  password:       z.string().min(6),
  department_id:  z.string().min(1),
  title:          z.string().optional(),
  max_hours_week: z.coerce.number().int().min(1).max(40),
})
const updateSchema = z.object({
  full_name:      z.string().min(2),
  title:          z.string().optional(),
  max_hours_week: z.coerce.number().int().min(1).max(40),
})

// ── Availability Grid ─────────────────────────────────────────────
const DAYS  = ['sunday','monday','tuesday','wednesday','thursday']
const SLOTS = ['08:00','09:30','11:00','13:00','14:30']

function AvailabilityGrid({ instructorId }) {
  const qc = useQueryClient()
  const { addToast } = useUIStore()

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['availability', instructorId],
    queryFn: () => instructorsApi.getAvailability(instructorId).then(r => r.data),
    enabled: !!instructorId,
  })

  const toggle = useMutation({
    mutationFn: ({ day, start_time, is_available }) =>
      instructorsApi.updateAvailability(instructorId, { day, start_time, is_available }),
    onSuccess: () => qc.invalidateQueries(['availability', instructorId]),
    onError: () => addToast({ type: 'error', message: 'Update failed' }),
  })

  const isAvailable = (day, start) => {
    const found = slots.find(s => s.day === day && s.start_time === start)
    return found ? found.is_available : true
  }

  if (isLoading) return <div className="text-sm text-gray-400 py-4">Loading availability...</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="py-2 px-3 text-left text-gray-500 font-semibold">Slot</th>
            {DAYS.map(d => (
              <th key={d} className="py-2 px-3 text-center text-gray-500 font-semibold capitalize">{d.slice(0,3)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {SLOTS.map(start => (
            <tr key={start}>
              <td className="py-2 px-3 font-mono text-gray-500">{start}</td>
              {DAYS.map(day => {
                const avail = isAvailable(day, start)
                return (
                  <td key={day} className="py-2 px-3 text-center">
                    <button
                      onClick={() => toggle.mutate({ day, start_time: start, is_available: !avail })}
                      className={`w-8 h-8 rounded-lg transition-colors text-xs font-bold
                        ${avail ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
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
      <p className="mt-2 text-xs text-gray-400">
        ✓ Available — ✗ Blocked (click to toggle)
      </p>
    </div>
  )
}

export default function InstructorsPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [deptFilter, setDeptFilter] = useState('')

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })
  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['instructors', deptFilter],
    queryFn: () => instructorsApi.list({ department_id: deptFilter || undefined }).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data) => instructorsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['instructors']); setModal(null); addToast({ type: 'success', message: 'Instructor created' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => instructorsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['instructors']); setModal(null); addToast({ type: 'success', message: 'Updated' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const remove = useMutation({
    mutationFn: (id) => instructorsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['instructors']); addToast({ type: 'success', message: 'Deleted' }) },
  })

  // Form for create
  const CreateForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(createSchema),
      defaultValues: { max_hours_week: 20 },
    })
    return (
      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name</label>
            <input {...register('full_name')} className="input" placeholder="Dr. Sara Al-Hashimi" />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="sara@cs.edu" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" className="input" placeholder="min 6 chars" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" placeholder="Dr. / Prof." />
          </div>
          <div>
            <label className="label">Max Hours/Week</label>
            <input {...register('max_hours_week')} type="number" className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Department</label>
            <select {...register('department_id')} className="input">
              <option value="">Select department</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id.message}</p>}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Creating...' : 'Create Instructor'}
          </button>
        </div>
      </form>
    )
  }

  // Form for edit
  const EditForm = ({ inst }) => {
    const { register, handleSubmit } = useForm({
      resolver: zodResolver(updateSchema),
      defaultValues: { full_name: inst.full_name, title: inst.title, max_hours_week: inst.max_hours_week },
    })
    return (
      <form onSubmit={handleSubmit((d) => update.mutate({ id: inst.id, data: d }))} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input {...register('full_name')} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input" placeholder="Dr. / Prof." />
          </div>
          <div>
            <label className="label">Max Hours/Week</label>
            <input {...register('max_hours_week')} type="number" className="input" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={update.isPending} className="btn-primary">
            {update.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    )
  }

  const deptLabel = (deptId) => depts.find(d => d.id === deptId)?.name || '—'

  const columns = [
    {
      key: 'full_name', label: 'Instructor', sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
            {row.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.title && `${row.title} `}{row.full_name}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department_id', label: 'Department',
      render: (row) => <span className="badge badge-blue">{deptLabel(row.department_id)}</span>,
    },
    {
      key: 'max_hours_week', label: 'Max Hrs/Week',
      render: (row) => <span className="badge badge-gray">{row.max_hours_week}h</span>,
    },
    {
      key: 'preferred_time', label: 'Preference',
      render: (row) => (
        <span className="badge badge-gray capitalize">
          {row.preferences?.preferred_time?.replace('_',' ') || '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Instructors</h1>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <Plus size={16}/> Add Instructor
        </button>
      </div>

      {/* Department filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDeptFilter('')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !deptFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
          All Departments
        </button>
        {depts.map(d => (
          <button key={d.id} onClick={() => setDeptFilter(d.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              deptFilter === d.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
            {d.name}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns} data={instructors} loading={isLoading}
        searchKeys={['full_name','email']} emptyText="No instructors yet"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setSelected(row); setModal('availability') }}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="View availability">
              <Clock size={14}/>
            </button>
            <button onClick={() => { setSelected(row); setModal('edit') }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              <Pencil size={14}/>
            </button>
            <button onClick={() => setConfirm({ id: row.id, name: row.full_name })}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
              <Trash2 size={14}/>
            </button>
          </div>
        )}
      />

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Instructor" size="lg">
        <CreateForm />
      </Modal>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Instructor">
        {selected && <EditForm inst={selected} />}
      </Modal>

      <Modal open={modal === 'availability'} onClose={() => setModal(null)} size="lg"
        title={`Availability — ${selected?.full_name}`}>
        {selected && <AvailabilityGrid instructorId={selected.id} />}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate(confirm.id)}
        title="Delete Instructor" message={`Delete "${confirm?.name}"? Their account will also be removed.`}
        danger
      />
    </div>
  )
}