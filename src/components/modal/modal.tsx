import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { ModalProps } from './modal.type'

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/70 md:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl md:rounded-2xl bg-surface border border-border pb-safe md:pb-0 animate-slide-up md:animate-none">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h3 id="modal-title" className="text-text-primary font-semibold text-base">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-text-sub hover:text-text-primary p-1 rounded-lg hover:bg-surface-high"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="px-5 pt-4 pb-6">{children}</div>
      </div>
    </div>
  )
}
