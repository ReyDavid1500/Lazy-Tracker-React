import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: number
  msg: string
  type: ToastType
}

type ShowFn = (msg: string, type?: ToastType) => void

const Ctx = createContext<ShowFn>(null!)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle }
  const colors = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-bg',
  }

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="fixed top-4 inset-x-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type]
          return (
            <div key={t.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${colors[t.type]}`}>
              <Icon size={18} className="shrink-0" />
              <span>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
