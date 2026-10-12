import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Boxes } from 'lucide-react'
import { login } from '../api/auth'
import { useAuth } from '../store/auth'
import { useToast } from '../store/toast'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setLoading(true)
    try {
      const { data } = await login(identifier.trim(), password)
      signIn(data.accessToken, data.user)
      navigate('/scan', { replace: true })
    } catch (err: any) {
      const msg = err.response?.status === 401
        ? 'Wrong identifier or password'
        : 'Could not reach the server — check your connection'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-bg px-4 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-accent-bg flex items-center justify-center border border-accent/30">
          <Boxes size={32} className="text-accent" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">LazyTracker</h1>
          <p className="text-text-sub text-sm mt-1">Inventory management made simple</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-sub uppercase tracking-wider">Identifier</label>
          <input
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="you@company.com"
            required
            autoComplete="identifier"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-border-focus transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-sub uppercase tracking-wider">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-text-primary placeholder-text-muted text-sm outline-none focus:border-border-focus transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-primary"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-[0_0_24px_rgba(79,106,255,0.35)]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={18} />
              Sign in
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-text-muted text-xs text-center">
        API: {import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}
      </p>
    </div>
  )
}
