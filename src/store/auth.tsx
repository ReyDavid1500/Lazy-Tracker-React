import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  token: string | null
  signIn: (token: string, user: User) => void
  signOut: () => void
  loading: boolean
}

const Ctx = createContext<AuthCtx>(null!)

const USER_KEY = 'lt_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'))
  const [user, setUser] = useState<User | null>(() => loadUser())
  const [loading] = useState(false)

  // If token is gone (e.g. cleared by 401 interceptor) wipe user too
  useEffect(() => {
    if (!token) setUser(null)
  }, [token])

  const signIn = (t: string, u: User) => {
    localStorage.setItem('jwt', t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const signOut = () => {
    localStorage.removeItem('jwt')
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, token, signIn, signOut, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
