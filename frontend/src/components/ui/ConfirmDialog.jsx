// frontend/src/components/ui/ConfirmDialog.jsx
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center
                        ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle size={24} className={danger ? 'text-red-600' : 'text-yellow-600'} />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  )
}