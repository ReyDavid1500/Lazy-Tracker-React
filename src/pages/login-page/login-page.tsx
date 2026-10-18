import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Boxes } from 'lucide-react'
import { login } from '@/api/auth'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/toast'

const styles = {
  root: 'min-h-full flex flex-col items-center justify-center bg-bg px-4 py-12',
  card: 'w-full max-w-sm md:bg-surface md:border md:border-border md:rounded-2xl md:p-8 md:shadow-xl',
  logoWrapper: 'flex flex-col items-center gap-3 mb-10',
  logoIcon: 'w-16 h-16 rounded-2xl bg-accent-bg flex items-center justify-center border border-accent/30',
  form: 'flex flex-col gap-4',
  fieldGroup: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold text-text-sub uppercase tracking-wider',
  input: 'w-full bg-surface md:bg-surface-high border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none focus:border-border-focus transition-colors',
  submitBtn: 'mt-2 w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-[0_0_24px_rgba(79,106,255,0.35)]',
} as const

export function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!identifier.trim() || !password) return

    setLoading(true)
    try {
      const { data } = await login(identifier.trim(), password)
      signIn(data.accessToken, data.user)
      navigate('/scan', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      const msg = axiosErr.response?.status === 401
        ? 'Wrong identifier or password'
        : 'Could not reach the server — check your connection'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <Boxes size={32} className="text-accent" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">LazyTracker</h1>
            <p className="text-text-sub text-sm mt-1">Inventory management made simple</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="identifier" className={styles.label}>Identifier</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="username"
              aria-required="true"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                aria-required="true"
                className="w-full bg-surface md:bg-surface-high border border-border rounded-xl px-4 py-3 pr-12 text-text-primary placeholder-text-muted text-sm outline-none focus:border-border-focus transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Signing in" />
            ) : (
              <>
                <LogIn size={18} aria-hidden="true" />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-text-muted text-xs text-center">
        API: {import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}
      </p>
    </main>
  )
}
