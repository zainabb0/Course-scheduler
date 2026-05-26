// frontend/src/components/schedule/ScheduleCell.jsx
// Single cell in the timetable grid — shows one session's info
import { cn, YEAR_COLORS } from '../../lib/utils'

export default function ScheduleCell({
  entry,
  yearIndex = 0,
  compact   = false,
}) {
  if (!entry) return null

  return (
    <div className={cn(
      'px-2 py-1.5 rounded-lg border text-xs select-none',
      YEAR_COLORS[yearIndex % 4],
      entry.has_conflict       && 'border-red-400 bg-red-50 text-red-800',
      entry.is_manually_edited && 'ring-1 ring-yellow-400',
    )}>
      <p className="font-semibold truncate">{entry.course_code}</p>
      {!compact && (
        <>
          {entry.section_name  && <p className="truncate opacity-75">Sec {entry.section_name}</p>}
          <p className="truncate opacity-60">{entry.room_code}</p>
          {entry.session_type === 'lab' && (
            <span className="text-purple-700 font-medium text-xs">🔬 Lab</span>
          )}
        </>
      )}
      {entry.has_conflict && (
        <span className="text-red-600 font-medium text-xs block">⚠ Conflict</span>
      )}
    </div>
  )
}