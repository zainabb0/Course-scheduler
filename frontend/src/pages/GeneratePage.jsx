// frontend/src/pages/GeneratePage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  Cpu, Play, CheckCircle, AlertCircle,
  Clock, Zap, BarChart3, ArrowRight,
} from 'lucide-react'
import { departmentsApi } from '../api/departments.api'
import { schedulesApi }   from '../api/schedules.api'
import useGenerateSchedule from '../hooks/useGenerateSchedule'
import FitnessChart from '../components/charts/FitnessChart'
import { cn } from '../lib/utils'

const schema = z.object({
  department_id:               z.string().min(1, 'Select a department'),
  academic_year:               z.string().regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
  semester:                    z.enum(['fall','spring']),
  name:                        z.string().optional(),
  generations:                 z.coerce.number().int().min(10).max(500),
  population_size:             z.coerce.number().int().min(10).max(200),
  mutation_rate:               z.coerce.number().min(0.001).max(0.5),
  crossover_rate:              z.coerce.number().min(0.3).max(1),
  weight_preferred_time:       z.coerce.number().min(0).max(10),
  weight_days_off:             z.coerce.number().min(0).max(10),
  weight_consecutive_overload: z.coerce.number().min(0).max(10),
  weight_spread_sessions:      z.coerce.number().min(0).max(10),
})

function ProgressBar({ pct, color = 'bg-primary-500' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function MetricCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card p-4 text-center">
      <p className={cn('text-2xl font-bold font-mono', color)}>{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function GeneratePage() {
  const navigate = useNavigate()
  const [showWeights, setShowWeights] = useState(false)
  const { generate, isStarting, scheduleId, status, logs, isRunning, reset } = useGenerateSchedule()

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then(r => r.data),
  })
  const { data: pastSchedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.list({}).then(r => r.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      academic_year: '2024-2025', semester: 'fall',
      generations: 100, population_size: 50,
      mutation_rate: 0.02, crossover_rate: 0.8,
      weight_preferred_time: 2, weight_days_off: 2,
      weight_consecutive_overload: 1.5, weight_spread_sessions: 1,
    },
  })

  const onSubmit = (data) => { reset(); generate(data) }

  const fitnessColor =
    !status ? 'text-gray-900' :
    status.hard_violations === 0 ? 'text-emerald-600' :
    status.hard_violations <= 3  ? 'text-yellow-600'  : 'text-red-600'

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">CSP + Genetic Algorithm schedule generation</p>
        </div>
        {status?.status === 'completed' && (
          <button onClick={() => navigate('/admin/schedule')} className="btn-primary">
            View Schedule <ArrowRight size={16}/>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap size={15} className="text-primary-500"/> Basic Settings
              </h2>
              <div>
                <label className="label">Department</label>
                <select {...register('department_id')} className="input">
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Academic Year</label>
                  <input {...register('academic_year')} className="input" placeholder="2024-2025"/>
                  {errors.academic_year && <p className="mt-1 text-xs text-red-500">{errors.academic_year.message}</p>}
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select {...register('semester')} className="input">
                    <option value="fall">Fall</option>
                    <option value="spring">Spring</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Name (optional)</label>
                <input {...register('name')} className="input" placeholder="Fall 2024-2025"/>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Cpu size={15} className="text-primary-500"/> GA Parameters
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['generations','Generations','number'],
                  ['population_size','Population','number'],
                  ['mutation_rate','Mutation Rate','number'],
                  ['crossover_rate','Crossover Rate','number'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input {...register(key)} type={type} step={key.includes('rate') ? '0.01' : '1'} className="input"/>
                  </div>
                ))}
              </div>
            </div>

            {/* Soft weights (collapsible) */}
            <div className="card p-5 space-y-3">
              <button type="button" onClick={() => setShowWeights(!showWeights)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-2"><BarChart3 size={15} className="text-primary-500"/> Soft Weights</span>
                <span className="text-xs text-gray-400">{showWeights ? '▲' : '▼'}</span>
              </button>
              {showWeights && (
                <div className="space-y-3 pt-1">
                  {[
                    ['weight_preferred_time','Preferred Time'],
                    ['weight_days_off','Days Off'],
                    ['weight_consecutive_overload','Consecutive Limit'],
                    ['weight_spread_sessions','Spread Sessions'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-xs text-gray-600">{label}</label>
                      <input {...register(key)} type="number" step="0.5" min="0" max="10"
                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-center"/>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={isRunning}
              className={cn('w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm')}>
              {isRunning
                ? <><Cpu size={16} className="animate-spin"/> Running...</>
                : <><Play size={16}/> Start Generation</>}
            </button>
          </form>
        </div>

        {/* Progress */}
        <div className="lg:col-span-3 space-y-4">

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Progress</h2>
              {status && (
                <div className={cn('flex items-center gap-1.5 text-xs font-medium',
                  status.status === 'completed' ? 'text-emerald-600' :
                  status.status === 'failed'    ? 'text-red-600' :
                  status.status === 'running'   ? 'text-blue-600' : 'text-yellow-600')}>
                  {status.status === 'completed' && <CheckCircle size={14}/>}
                  {status.status === 'failed'    && <AlertCircle size={14}/>}
                  {status.status === 'running'   && <Cpu size={14} className="animate-spin"/>}
                  {status.status === 'pending'   && <Clock size={14} className="animate-pulse"/>}
                  {status.message}
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{status ? `Gen ${status.current_gen} / ${status.total_gen}` : 'Not started'}</span>
                <span className="font-semibold">{status?.progress_pct ?? 0}%</span>
              </div>
              <ProgressBar pct={status?.progress_pct ?? 0}
                color={status?.status === 'completed' ? 'bg-emerald-500' : status?.status === 'failed' ? 'bg-red-500' : 'bg-primary-500'}/>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Best Fitness" value={status?.best_fitness?.toFixed(1)} sub="Max: 1000" color={fitnessColor}/>
              <MetricCard label="Hard Violations" value={status?.hard_violations} sub="Target: 0"
                color={status?.hard_violations === 0 ? 'text-emerald-600' : status?.hard_violations != null ? 'text-red-600' : 'text-gray-400'}/>
              <MetricCard label="Progress" value={status ? `${status.progress_pct}%` : '—'}/>
            </div>

            {status?.status === 'completed' && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                  <CheckCircle size={15}/> Done! Fitness: {status.best_fitness?.toFixed(1)}, Violations: {status.hard_violations}
                </span>
                <button onClick={() => navigate('/admin/schedule')} className="btn-primary text-xs px-3 py-1.5">
                  View Schedule <ArrowRight size={13}/>
                </button>
              </div>
            )}
            {status?.status === 'failed' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={15}/> Generation failed. Check data configuration.
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-primary-500"/> Fitness Over Generations
            </h2>
            <FitnessChart logs={logs}/>
          </div>

          {pastSchedules.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Previous Runs</h2>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Name','Year','Status','Fitness','Violations'].map(h =>
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pastSchedules.slice(0, 5).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900 max-w-32 truncate">{s.name || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.academic_year}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('badge', {completed:'badge-green',running:'badge-yellow',pending:'badge-gray',failed:'badge-red'}[s.status] || 'badge-gray')}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{s.fitness_score?.toFixed(1) ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono">{s.conflicts_count ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}