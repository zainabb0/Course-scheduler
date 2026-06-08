// frontend/src/components/schedule/ScheduleGrid.jsx
import { useDraggable, useDroppable, DndContext, DragOverlay } from '@dnd-kit/core'
import { cn, DAY_LABELS, DAY_ORDER, YEAR_COLORS } from '../../lib/utils'

// ── Draggable session card ─────────────────────────────────────────
function SessionCard({ entry, studyYears = [], isDragging = false }) {
  const yearIndex = studyYears.findIndex(y =>
    entry.section_id?.includes(y.id) || entry.study_year_id === y.id
  ) % 4

  return (
    <div className={cn(
      'px-2 py-1.5 rounded-lg border text-xs cursor-grab select-none',
      'hover:shadow-sm transition-shadow',
      YEAR_COLORS[Math.max(yearIndex, 0)],
      entry.has_conflict && 'border-red-400 bg-red-50 text-red-800',
      isDragging && 'opacity-50 cursor-grabbing',
      entry.is_manually_edited && 'ring-1 ring-yellow-400',
    )}>
      <p className="font-semibold truncate">{entry.course_code}</p>
      <p className="truncate opacity-75">{entry.section_name && `Sec ${entry.section_name}`}</p>
      <p className="truncate opacity-60">{entry.room_code}</p>
      {entry.session_type === 'lab' && (
        <span className="text-purple-600 font-medium">🔬 Lab</span>
      )}
      {entry.has_conflict && (
        <span className="text-red-600 font-medium">⚠ Conflict</span>
      )}
    </div>
  )
}

// ── Droppable cell ────────────────────────────────────────────────
function DroppableCell({ slotId, children, isOver }) {
  const { setNodeRef } = useDroppable({ id: slotId })
  return (
    <td ref={setNodeRef}
      className={cn(
        'border border-gray-100 p-1 align-top min-w-24 h-16 transition-colors',
        isOver && 'bg-blue-50',
      )}>
      {children}
    </td>
  )
}

// ── Draggable cell content ─────────────────────────────────────────
function DraggableEntry({ entry, studyYears }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: entry,
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <SessionCard entry={entry} studyYears={studyYears} isDragging={isDragging}/>
    </div>
  )
}


/**
 * ScheduleGrid
 *
 * Props:
 *  entries     : ScheduleEntryResponse[]
 *  slots       : TimeSlot[]               (from GET /ai/time-slots)
 *  studyYears  : StudyYear[]              (for color coding)
 *  onDrop      : (entryId, newSlotId, newRoomId) => void  (drag & drop)
 *  canEdit     : boolean                  (admin only)
 */
export default function ScheduleGrid({
  entries = [],
  slots   = [],
  studyYears = [],
  onDrop,
  canEdit = false,
}) {
  const normalizeTime = (time) => time?.toString().slice(0, 5)

  // Unique days in order
  const days = [...new Set(slots.map(s => s.day))].sort(
    (a, b) => DAY_ORDER[a] - DAY_ORDER[b]
  )

  // Unique slot times (same across all days)
  const slotTimes = [...new Set(slots.map(s => normalizeTime(s.start_time)))].sort()

  // Build lookup: { "sunday_08:00": [entry, ...] }
  const entriesBySlot = {}
  entries.forEach(e => {
    if (!e.day || !e.start_time) return
    const key = `${e.day}_${normalizeTime(e.start_time)}`
    if (!entriesBySlot[key]) entriesBySlot[key] = []
    entriesBySlot[key].push(e)
  })

  const [activeEntry, setActiveEntry] = useState(null)
  const [overSlot, setOverSlot]       = useState(null)

  const handleDragEnd = ({ active, over }) => {
    setActiveEntry(null)
    setOverSlot(null)
    if (!over || !active || !onDrop) return
    const entry = active.data.current
    const [day, start] = over.id.split('_')
    const newSlot = slots.find(s => s.day === day && normalizeTime(s.start_time) === start)
    if (newSlot && entry.id) {
      onDrop(entry.id, newSlot.id, entry.room_id)
    }
  }

  const grid = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[700px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-100 px-3 py-2.5 text-gray-500 font-semibold text-left w-20">
              Time
            </th>
            {days.map(day => (
              <th key={day} className="border border-gray-100 px-3 py-2.5 text-gray-600 font-semibold text-center capitalize">
                {DAY_LABELS[day] || day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slotTimes.map(start => (
            <tr key={start} className="hover:bg-gray-50/50">
              <td className="border border-gray-100 px-3 py-2 font-mono text-gray-500 bg-gray-50 whitespace-nowrap">
                {start}
              </td>
              {days.map(day => {
                const key   = `${day}_${start}`
                const cells = entriesBySlot[key] || []
                const isOv  = overSlot === key

                return canEdit ? (
                  <DroppableCell key={day} slotId={key} isOver={isOv}>
                    {cells.map(e => (
                      <DraggableEntry key={e.id} entry={e} studyYears={studyYears}/>
                    ))}
                  </DroppableCell>
                ) : (
                  <td key={day} className="border border-gray-100 p-1 align-top min-w-24 h-16">
                    {cells.map(e => (
                      <SessionCard key={e.id} entry={e} studyYears={studyYears}/>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (!canEdit) return grid

  return (
    <DndContext
      onDragStart={({ active }) => setActiveEntry(active.data.current)}
      onDragOver={({ over }) => setOverSlot(over?.id || null)}
      onDragEnd={handleDragEnd}
    >
      {grid}
      <DragOverlay>
        {activeEntry && <SessionCard entry={activeEntry} studyYears={studyYears}/>}
      </DragOverlay>
    </DndContext>
  )
}

// useState needed inside component
import { useState } from 'react'