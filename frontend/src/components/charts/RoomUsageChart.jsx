// frontend/src/components/charts/RoomUsageChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']

export default function RoomUsageChart({ entries = [], slots = [] }) {
  if (!entries.length) return (
    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
      No data available
    </div>
  )

  // Count sessions per room
  const roomCounts = {}
  entries.forEach(e => {
    if (!e.room_code) return
    roomCounts[e.room_code] = (roomCounts[e.room_code] || 0) + 1
  })

  // Total available slots per room (approx)
  const totalSlots = slots.filter(s => !s.is_break).length

  const data = Object.entries(roomCounts)
    .map(([room, count]) => ({
      room,
      sessions: count,
      utilization: totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="room" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val, name) => [
            name === 'sessions' ? `${val} sessions` : `${val}%`,
            name === 'sessions' ? 'Sessions' : 'Utilization',
          ]}
        />
        <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}