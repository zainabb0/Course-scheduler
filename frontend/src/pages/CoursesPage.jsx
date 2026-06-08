// frontend/src/pages/CoursesPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, FlaskConical, Layers } from 'lucide-react'
import { coursesApi }     from '../api/courses.api'
import { departmentsApi } from '../api/departments.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'
import { cn }        from '../lib/utils'

const schema = z.object({
  name:               z.string().min(2),
  code:               z.string().min(2).max(20),
  study_year_id:      z.string().min(1, 'Select a year'),
  department_id:      z.string().min(1, 'Select a department'),
  credit_hours:       z.coerce.number().int().min(1).max(9),
  has_lab:            z.boolean().default(false),
  lecture_hours_week: z.coerce.number().int().min(1).max(6),
  lab_hours_week:     z.coerce.number().int().min(0).max(4),
  has_sections:       z.boolean().default(false),
  min_capacity:       z.coerce.number().int().min(1).max(500),
  description:        z.string().optional(),
})

function CourseForm({ defaultValues, onSubmit, loading, depts }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      credit_hours: 3, lecture_hours_week: 2, lab_hours_week: 0,
      min_capacity: 30, has_lab: false, has_sections: false,
      ...defaultValues,
    },
  })
  const selectedDept = watch('department_id')
  const hasLab       = watch('has_lab')

  const { data: years = [] } = useQuery({
    queryKey: ['study-years-for-dept', selectedDept],
    queryFn: () => departmentsApi.listYears(selectedDept).then(r => r.data),
    enabled: !!selectedDept,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Course Name</label>
          <input {...register('name')} className="input" placeholder="Introduction to Programming" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Code</label>
          <input {...register('code')} className="input" placeholder="CS101" />
          {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
        </div>
        <div>
          <label className="label">Credit Hours</label>
          <input {...register('credit_hours')} type="number" min={1} max={9} className="input" />
        </div>
        <div>
          <label className="label">Department</label>
          <select {...register('department_id')} className="input">
            <option value="">Select department</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id.message}</p>}
        </div>
        <div>
          <label className="label">Study Year</label>
          <select {...register('study_year_id')} className="input" disabled={!selectedDept}>
            <option value="">Select year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
          </select>
          {errors.study_year_id && <p className="mt-1 text-xs text-red-500">{errors.study_year_id.message}</p>}
        </div>
        <div>
          <label className="label">Lecture Hours/Week</label>
          <input {...register('lecture_hours_week')} type="number" min={1} max={6} className="input" />
        </div>
        <div>
          <label className="label">Min Capacity</label>
          <input {...register('min_capacity')} type="number" className="input" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('has_lab')} type="checkbox" className="rounded" />
          <FlaskConical size={14} className="text-purple-500" />
          Has Lab Sessions
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('has_sections')} type="checkbox" className="rounded" />
          <Layers size={14} className="text-blue-500" />
          Has Sections (A/B)
        </label>
      </div>

      {hasLab && (
        <div>
          <label className="label">Lab Hours/Week</label>
          <input {...register('lab_hours_week')} type="number" min={1} max={4} className="input" />
        </div>
      )}

      <div>
        <label className="label">Description (optional)</label>
        <textarea {...register('description')} className="input resize-none" rows={2} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function CoursesPage() {
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
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', yearFilter, deptFilter],
    queryFn: () => coursesApi.list({ study_year_id: yearFilter || undefined, department_id: deptFilter || undefined }).then(r => r.data),
  })

  // Flatten all study years for filter bar
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
    mutationFn: (data) => coursesApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['courses']); setModal(null); addToast({ type: 'success', message: 'Course created' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => coursesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['courses']); setModal(null); addToast({ type: 'success', message: 'Updated' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const remove = useMutation({
    mutationFn: (id) => coursesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['courses']); addToast({ type: 'success', message: 'Deleted' }) },
  })

  const columns = [
    {
      key: 'code', label: 'Code', sortable: true,
      render: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">{row.code}</span>,
    },
    { key: 'name', label: 'Course Name', sortable: true },
    {
      key: 'department_id', label: 'Department',
      render: (row) => {
        const dept = depts.find(d => d.id === row.department_id)
        return <span className="badge badge-blue">{dept?.name || '—'}</span>
      },
    },
    {
      key: 'credit_hours', label: 'Credits',
      render: (row) => <span className="badge badge-gray">{row.credit_hours} cr</span>,
    },
    {
      key: 'features', label: 'Features',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          <span className="badge badge-gray">{row.lecture_hours_week}h lec</span>
          {row.has_lab && <span className="badge bg-purple-100 text-purple-700">🔬 Lab {row.lab_hours_week}h</span>}
          {row.has_sections && <span className="badge bg-orange-100 text-orange-700">A/B Sections</span>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <button className="btn-primary" onClick={() => { setSelected(null); setModal('form') }}>
          <Plus size={16}/> Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Department</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setDeptFilter('')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !deptFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
              All
            </button>
            {depts.map(d => (
              <button key={d.id} onClick={() => setDeptFilter(d.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  deptFilter === d.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
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
                !yearFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300')}
            >
              All Years
            </button>
            {allYears.map(y => (
              <button key={y.id} onClick={() => setYearFilter(y.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  yearFilter === y.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300')}>
                {y.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns} data={courses} loading={isLoading}
        searchKeys={['name','code']} emptyText="No courses found"
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

      <Modal open={modal === 'form'} onClose={() => setModal(null)} size="lg"
        title={selected ? 'Edit Course' : 'New Course'}>
        <CourseForm
          defaultValues={selected || {}}
          depts={depts}
          onSubmit={(data) => selected ? update.mutate({ id: selected.id, data }) : create.mutate(data)}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => remove.mutate(confirm.id)}
        title="Delete Course" message={`Delete "${confirm?.name}"?`} danger
      />
    </div>
  )
}