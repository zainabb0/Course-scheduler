// frontend/src/components/schedule/DraggableSession.jsx
// Wraps ScheduleCell with dnd-kit draggable behavior
import { useDraggable } from '@dnd-kit/core'
import ScheduleCell from './ScheduleCell'

export default function DraggableSession({ entry, yearIndex, disabled = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:       entry.id,
    data:     entry,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: disabled ? 'default' : 'grab' }}
    >
      <ScheduleCell entry={entry} yearIndex={yearIndex} />
    </div>
  )
}