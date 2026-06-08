// frontend/src/pages/DepartmentsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { departmentsApi } from '../api/departments.api'
import DataTable     from '../components/ui/DataTable'
import Modal         from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useUIStore    from '../store/uiStore'

const deptSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(20),
})
const yearSchema = z.object({
  year_number: z.coerce.number().int().min(1).max(6),
  label: z.string().min(2),
  student_count: z.coerce.number().int().min(0).default(0),
})

function DeptForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(deptSchema), defaultValues,
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Department Name</label>
        <input {...register('name')} className="input" placeholder="Computer Science" />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Code</label>
        <input {...register('code')} className="input" placeholder="CS" />
        {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function YearForm({ deptId, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(yearSchema), defaultValues: { year_number: '', label: '', student_count: 0 },
  })
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(deptId, d))} className="space-y-4">
      <div>
        <label className="label">Year Number (1–6)</label>
        <input {...register('year_number')} type="number" min={1} max={6} className="input" />
        {errors.year_number && <p className="mt-1 text-xs text-red-500">{errors.year_number.message}</p>}
      </div>
      <div>
        <label className="label">Label</label>
        <input {...register('label')} className="input" placeholder="First Year" />
        {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label.message}</p>}
      </div>
      <div>
        <label className="label">Students</label>
        <input {...register('student_count')} type="number" min={0} className="input" />
        {errors.student_count && <p className="mt-1 text-xs text-red-500">{errors.student_count.message}</p>}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Add Year'}
        </button>
      </div>
    </form>
  )
}

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [confirmYear, setConfirmYear] = useState(null)
  const [expanded, setExpanded]   = useState({})

  const { data: depts = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })

  const { data: yearsMap = {} } = useQuery({
    queryKey: ['all-study-years', Object.keys(expanded).filter(k => expanded[k])],
    queryFn: async () => {
      const ids = Object.keys(expanded).filter(k => expanded[k])
      const results = {}
      await Promise.all(ids.map(async id => {
        const r = await departmentsApi.listYears(id)
        results[id] = r.data
      }))
      return results
    },
    enabled: Object.values(expanded).some(Boolean),
  })

  const createDept = useMutation({
    mutationFn: (data) => departmentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['departments']); setModal(null); addToast({ type: 'success', message: 'Department created' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const updateDept = useMutation({
    mutationFn: ({ id, data }) => departmentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['departments']); setModal(null); addToast({ type: 'success', message: 'Updated' }) },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const deleteDept = useMutation({
    mutationFn: (id) => departmentsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['departments']); addToast({ type: 'success', message: 'Deleted' }) },
  })
  const addYear = useMutation({
    mutationFn: ({ deptId, data }) => departmentsApi.addYear(deptId, { ...data, department_id: deptId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['all-study-years'], exact: false })
      setModal(null)
      addToast({ type: 'success', message: 'Study year added' })
    },
    onError: (e) => addToast({ type: 'error', message: e.response?.data?.detail || 'Error' }),
  })
  const deleteYear = useMutation({
    mutationFn: ({ deptId, yrId }) => departmentsApi.removeYear(deptId, yrId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-study-years'], exact: false })
      setConfirmYear(null)
      addToast({ type: 'success', message: 'Study year deleted' })
    },
    onError: (e) => {
      setConfirmYear(null)
      addToast({ type: 'error', message: e.response?.data?.detail || 'Error deleting year' })
    },
  })

  const columns = [
    {
      key: 'expand', label: '', className: 'w-8',
      render: (row) => (
        <button onClick={() => setExpanded(e => ({ ...e, [row.id]: !e[row.id] }))}
          className="p-1 rounded hover:bg-gray-100 text-gray-400">
          {expanded[row.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </button>
      ),
    },
    { key: 'name', label: 'Department', sortable: true },
    {
      key: 'code', label: 'Code', sortable: true,
      render: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{row.code}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Departments</h1>
        <button className="btn-primary" onClick={() => { setSelected(null); setModal('create') }}>
          <Plus size={16}/> Add Department
        </button>
      </div>

      <DataTable
        columns={columns} data={depts} loading={isLoading}
        searchKeys={['name','code']} emptyText="No departments yet"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setSelected(row); setModal('addYear') }}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Add study year">
              <Plus size={14}/>
            </button>
            <button onClick={() => { setSelected(row); setModal('edit') }}
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

      {/* Expanded rows */}
      {depts.map(dept => expanded[dept.id] && (
        <div key={`yr-${dept.id}`} className="card overflow-hidden border-l-4 border-l-blue-400 ml-6">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700">{dept.name} — Study Years</p>
            <button onClick={() => { setSelected(dept); setModal('addYear') }}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus size={12}/> Add Year
            </button>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>{['Year #','Label','Students',''].map(h => <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {(yearsMap[dept.id] || []).map(yr => (
                <tr key={yr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-bold text-blue-700">{yr.year_number}</td>
                  <td className="px-4 py-2 text-gray-700">{yr.label}</td>
                  <td className="px-4 py-2 text-gray-700">{yr.student_count ?? 0}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setConfirmYear({ deptId: dept.id, yrId: yr.id, label: yr.label })}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
              {!(yearsMap[dept.id] || []).length && (
                <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-400">No study years</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Department' : 'New Department'}>
        <DeptForm
          defaultValues={modal === 'edit' ? selected : {}}
          onSubmit={(data) => modal === 'edit' ? updateDept.mutate({ id: selected.id, data }) : createDept.mutate(data)}
          loading={createDept.isPending || updateDept.isPending}
        />
      </Modal>

      <Modal open={modal === 'addYear'} onClose={() => setModal(null)} title="Add Study Year">
        <YearForm deptId={selected?.id}
          onSubmit={(deptId, data) => addYear.mutate({ deptId, data })}
          loading={addYear.isPending}
        />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => deleteDept.mutate(confirm.id)}
        title="Delete Department" message={`Delete "${confirm?.name}"? All related data will be removed.`}
        danger
      />

      <ConfirmDialog open={!!confirmYear} onClose={() => setConfirmYear(null)}
        onConfirm={() => deleteYear.mutate({ deptId: confirmYear?.deptId, yrId: confirmYear?.yrId })}
        title="Delete Study Year"
        message={`Delete the study year "${confirmYear?.label}"? This will remove only the year, not the department.`}
        danger
      />
    </div>
  )
}