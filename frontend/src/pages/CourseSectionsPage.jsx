// frontend/src/pages/CourseSectionsPage.jsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Layers, Users } from 'lucide-react'
import { sectionsApi }    from '../api/sections.api'
import { coursesApi }     from '../api/courses.api'
import { instructorsApi } from '../api/instructors.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'
import { cn }        from '../lib/utils'

const assignSchema = z.object({
  course_id:     z.string().min(1),
  instructor_id: z.string().min(1),
  session_type:  z.enum(['lecture','lab']),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
})

// Get current academic year dynamically
function getCurrentAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`
}

export default function CourseSectionsPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [tab, setTab]           = useState('assignments')
  const [modal, setModal]       = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const currentYear = getCurrentAcademicYear()
  const [yearFilter, setYearFilter] = useState('')

  // Fetch all assignments to extract available years dynamically
  const { data: allAssignments = [] } = useQuery({
    queryKey: ['assignments-all'],
    queryFn: () => sectionsApi.listAssignments({}).then(r => r.data),
  })

  // Extract unique years from assignments + always include current year
  const availableYears = useMemo(() => {
    const yearsFromData = allAssignments.map(a => a.academic_year).filter(Boolean)
    const uniqueYears = [...new Set([currentYear, ...yearsFromData])]
    return uniqueYears.sort((a, b) => b.localeCompare(a)) // newest first
  }, [allAssignments, currentYear])

  const { data: assignments = [], isLoading: loadA } = useQuery({
    queryKey: ['assignments', yearFilter],
    queryFn: () => sectionsApi.listAssignments(yearFilter ? { academic_year: yearFilter } : {}).then(r => r.data),
  })
  const { data: sections = [], isLoading: loadS } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.listSections({}).then(r => r.data),
  })
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list({}).then(r => r.data),
  })
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorsApi.list().then(r => r.data),
  })

  const createAssign = useMutation({
    mutationFn: (data) => sectionsApi.createAssignment(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries(['assignments'])
      qc.invalidateQueries(['assignments-all'])
      setModal(null)
      // Switch to the year of the new assignment
      setYearFilter(variables.academic_year)
      addToast({ type: 'success', message: 'Assignment created' })
    },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const removeAssign = useMutation({
    mutationFn: (id) => sectionsApi.removeAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries(['assignments'])
      qc.invalidateQueries(['assignments-all'])
      addToast({ type: 'success', message: 'Removed' })
    },
  })
  const removeSection = useMutation({
    mutationFn: (id) => sectionsApi.removeSection(id),
    onSuccess: () => { qc.invalidateQueries(['sections']); addToast({ type: 'success', message: 'Removed' }) },
  })

  function AssignForm() {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(assignSchema),
      defaultValues: { academic_year: currentYear, session_type: 'lecture' },
    })
    return (
      <form onSubmit={handleSubmit((d) => createAssign.mutate(d))} className="space-y-4">
        <div>
          <label className="label">Course</label>
          <select {...register('course_id')} className="input">
            <option value="">Select course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
          {errors.course_id && <p className="mt-1 text-xs text-red-500">{errors.course_id.message}</p>}
        </div>
        <div>
          <label className="label">Instructor</label>
          <select {...register('instructor_id')} className="input">
            <option value="">Select instructor</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.title} {i.full_name}</option>)}
          </select>
          {errors.instructor_id && <p className="mt-1 text-xs text-red-500">{errors.instructor_id.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Session Type</label>
            <select {...register('session_type')} className="input">
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input {...register('academic_year')} className="input" placeholder="2025-2026" />
            {errors.academic_year && <p className="mt-1 text-xs text-red-500">{errors.academic_year.message}</p>}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={createAssign.isPending} className="btn-primary">
            {createAssign.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    )
  }

  const assignCols = [
    {
      key: 'course_code', label: 'Course',
      render: (row) => (
        <div>
          <p className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded inline-block">{row.course_code}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.course_name}</p>
        </div>
      ),
    },
    {
      key: 'instructor_name', label: 'Instructor',
      render: (row) => <span className="text-gray-700">{row.instructor_name || '—'}</span>,
    },
    {
      key: 'session_type', label: 'Type',
      render: (row) => (
        <span className={cn('badge', row.session_type === 'lecture' ? 'badge-blue' : 'badge bg-purple-100 text-purple-700')}>
          {row.session_type}
        </span>
      ),
    },
    { key: 'academic_year', label: 'Year',
      render: (row) => <span className="badge badge-gray">{row.academic_year}</span> },
  ]

  const sectionCols = [
    {
      key: 'name', label: 'Section',
      render: (row) => <span className="font-bold text-gray-900 bg-blue-50 px-3 py-0.5 rounded-full text-sm">{row.name}</span>,
    },
    {
      key: 'student_count', label: 'Students',
      render: (row) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Users size={13}/> {row.student_count}
        </div>
      ),
    },
    { key: 'course_id', label: 'Course ID',
      render: (row) => <span className="font-mono text-xs text-gray-400">{row.course_id.slice(0,8)}...</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Course Sections</h1>
        {tab === 'assignments' && (
          <button className="btn-primary" onClick={() => setModal('assign')}>
            <Plus size={16}/> Assign Instructor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['assignments','Assignments'],['sections','Sections']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'assignments' && (
        <>
          {/* Year filter — dynamic */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Academic Year:</span>
            <button onClick={() => setYearFilter('')}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium border',
                yearFilter === '' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
              All Years
            </button>
            {availableYears.map(y => (
              <button key={y} onClick={() => setYearFilter(y)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium border',
                  yearFilter === y ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
                {y}
              </button>
            ))}
          </div>
          <DataTable
            columns={assignCols} data={assignments} loading={loadA}
            searchKeys={['course_code','course_name','instructor_name']}
            emptyText="No assignments for this year"
            actions={(row) => (
              <button onClick={() => setConfirm({ id: row.id, name: `${row.course_code} / ${row.session_type}` })}
                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                <Trash2 size={14}/>
              </button>
            )}
          />
        </>
      )}

      {tab === 'sections' && (
        <DataTable
          columns={sectionCols} data={sections} loading={loadS}
          searchKeys={['name']} emptyText="No sections found"
          actions={(row) => (
            <button onClick={() => removeSection.mutate(row.id)}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
              <Trash2 size={14}/>
            </button>
          )}
        />
      )}

      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title="Assign Instructor to Course">
        <AssignForm />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => removeAssign.mutate(confirm.id)}
        title="Remove Assignment" message={`Remove assignment "${confirm?.name}"?`} danger
      />
    </div>
  )
}