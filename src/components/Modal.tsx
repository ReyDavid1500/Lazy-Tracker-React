import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-surface border border-border pb-safe animate-slide-up">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h3 className="text-text-primary font-semibold text-base">{title}</h3>
            <button onClick={onClose} className="text-text-sub hover:text-text-primary p-1 rounded-lg hover:bg-surface-high">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="px-5 pt-4 pb-6">{children}</div>
      </div>
    </div>
  )
}
