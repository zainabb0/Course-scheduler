// frontend/src/pages/StudentsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { studentsApi }    from '../api/students.api'
import { departmentsApi } from '../api/departments.api'
import { sectionsApi }    from '../api/sections.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'
import { cn }        from '../lib/utils'

const createSchema = z.object({
  full_name:     z.string().min(2),
  email:         z.string().email(),
  password:      z.string().min(6),
  department_id: z.string().min(1),
  study_year_id: z.string().min(1),
  enrollment_year: z.coerce.number().int().min(2000).optional(),
})

export default function StudentsPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [yearFilter, setYearFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', yearFilter, deptFilter],
    queryFn: () => studentsApi.list({ study_year_id: yearFilter || undefined, department_id: deptFilter || undefined }).then(r => r.data),
  })
  const { data: studentSummary = { total: 0, counts: [] } } = useQuery({
    queryKey: ['students-summary', yearFilter, deptFilter],
    queryFn: () => studentsApi.summary({ study_year_id: yearFilter || undefined, department_id: deptFilter || undefined }).then(r => r.data),
  })
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', selected?.id],
    queryFn: () => studentsApi.listEnrollments(selected.id).then(r => r.data),
    enabled: !!selected?.id && modal === 'enrollments',
  })

  // Flatten years
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

  const create = useMutation({
    mutationFn: (data) => studentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['students']); setModal(null); addToast({ type: 'success', message: 'Student created' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const remove = useMutation({
    mutationFn: (id) => studentsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['students']); addToast({ type: 'success', message: 'Deleted' }) },
  })
  const removeEnrollment = useMutation({
    mutationFn: ({ studentId, enrollId }) => studentsApi.removeEnrollment(studentId, enrollId),
    onSuccess: () => { qc.invalidateQueries(['enrollments', selected?.id]); addToast({ type: 'success', message: 'Enrollment removed' }) },
  })

  function CreateForm() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
      resolver: zodResolver(createSchema),
      defaultValues: { enrollment_year: new Date().getFullYear() },
    })
    const selectedDept = watch('department_id')
    const { data: deptYears = [] } = useQuery({
      queryKey: ['study-years-for-dept', selectedDept],
      queryFn: () => departmentsApi.listYears(selectedDept).then(r => r.data),
      enabled: !!selectedDept,
    })
    return (
      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Full Name</label>
            <input {...register('full_name')} className="input" placeholder="Ali Hassan" />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password')} type="password" className="input" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Department</label>
            <select {...register('department_id')} className="input">
              <option value="">Select</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Study Year</label>
            <select {...register('study_year_id')} className="input" disabled={!selectedDept}>
              <option value="">Select</option>
              {deptYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Enrollment Year</label>
            <input {...register('enrollment_year')} type="number" className="input" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={create.isPending} className="btn-primary">
            {create.isPending ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    )
  }

  const yearLabel = (yearId) => allYears.find(y => y.id === yearId)?.label || '—'
  const deptLabel = (deptId) => depts.find(d => d.id === deptId)?.name || '—'

  const columns = [
    {
      key: 'full_name', label: 'Student', sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
            {row.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.full_name}</p>
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
      key: 'study_year_id', label: 'Year',
      render: (row) => <span className="badge badge-green">{yearLabel(row.study_year_id)}</span>,
    },
    {
      key: 'enrollment_year', label: 'Enrolled',
      render: (row) => <span className="text-gray-500">{row.enrollment_year || '—'}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <Plus size={16}/> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Department</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setDeptFilter('')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !deptFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200')}>
              All
            </button>
            {depts.map(d => (
              <button key={d.id} onClick={() => setDeptFilter(d.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  deptFilter === d.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200')}>
                {d.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Year</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setYearFilter('')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !yearFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
              All Years
            </button>
            {allYears.map(y => (
              <button key={y.id} onClick={() => setYearFilter(y.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  yearFilter === y.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
                {y.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total students</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{studentSummary.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Students by year</p>
          </div>
          {studentSummary.counts.length === 0 ? (
            <p className="text-sm text-gray-500">No students found for this filter.</p>
          ) : (
            <div className="space-y-2">
              {studentSummary.counts.map((item) => (
                <div key={item.study_year_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.student_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DataTable
        columns={columns} data={students} loading={isLoading}
        searchKeys={['full_name','email']} emptyText="No students found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setSelected(row); setModal('enrollments') }}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="View enrollments">
              <BookOpen size={14}/>
            </button>
            <button onClick={() => setConfirm({ id: row.id, name: row.full_name })}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
              <Trash2 size={14}/>
            </button>
          </div>
        )}
      />

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Student" size="lg">
        <CreateForm />
      </Modal>

      <Modal open={modal === 'enrollments'} onClose={() => setModal(null)} size="lg"
        title={`Enrollments — ${selected?.full_name}`}>
        <div className="space-y-2">
          {enrollments.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">No enrollments</p>
            : enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Section: <span className="font-mono">{e.section_id}</span></span>
                <button onClick={() => removeEnrollment.mutate({ studentId: selected.id, enrollId: e.id })}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate(confirm.id)}
        title="Delete Student" message={`Delete "${confirm?.name}"?`} danger
      />
    </div>
  )
}