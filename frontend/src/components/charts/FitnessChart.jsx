// frontend/src/components/charts/FitnessChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function FitnessChart({ logs = [] }) {
  if (!logs.length) return (
    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
      No generation data yet
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={logs} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="generation_number"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          label={{ value: 'Generation', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          domain={[0, 1000]}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val, name) => [val.toFixed(1), name === 'best_fitness' ? 'Best Fitness' : 'Avg Fitness']}
          labelFormatter={(l) => `Gen ${l}`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(val) => val === 'best_fitness' ? 'Best Fitness' : 'Avg Fitness'}
        />
        <Line
          type="monotone" dataKey="best_fitness"
          stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
        />
        <Line
          type="monotone" dataKey="avg_fitness"
          stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}