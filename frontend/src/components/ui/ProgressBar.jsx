// frontend/src/components/ui/ProgressBar.jsx
import { cn } from '../../lib/utils'

export default function ProgressBar({
  value = 0,        // 0–100
  color = 'bg-primary-500',
  showLabel = false,
  size = 'md',      // 'sm' | 'md' | 'lg'
  animated = false,
}) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            color,
            animated && 'animate-pulse',
          )}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{value}%</p>
      )}
    </div>
  )
}