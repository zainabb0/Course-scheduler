// frontend/src/components/schedule/ConflictBadge.jsx
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ConflictBadge({ count = 0, size = 'sm' }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 badge badge-green">
        <CheckCircle size={12} /> No conflicts
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 badge badge-red',
      size === 'lg' && 'text-sm px-3 py-1',
    )}>
      <AlertTriangle size={12} />
      {count} conflict{count !== 1 ? 's' : ''}
    </span>
  )
}