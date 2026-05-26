// frontend/src/components/ui/Toast.jsx
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import useUIStore from '../../store/uiStore'
import { cn } from '../../lib/utils'

const ICONS = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error:   <AlertCircle size={16} className="text-red-500" />,
  info:    <Info        size={16} className="text-blue-500" />,
}

export default function Toast() {
  const { toasts, removeToast } = useUIStore()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
            'bg-white border min-w-64 max-w-sm',
            t.type === 'success' ? 'border-green-200' :
            t.type === 'error'   ? 'border-red-200'   : 'border-blue-200',
          )}
        >
          {ICONS[t.type] || ICONS.info}
          <p className="flex-1 text-sm text-gray-800">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}