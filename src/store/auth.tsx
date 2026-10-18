import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'

type AuthContext = {
  readonly user: User | null
  readonly token: string | null
  readonly loading: boolean
  signIn: (token: string, user: User) => void
  signOut: () => void
}

const AuthCtx = createContext<AuthContext>(null!)

const USER_KEY = 'lt_user'
const TOKEN_KEY = 'jwt'

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

type AuthProviderProps = {
  readonly children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => loadStoredUser())
  const [loading] = useState(false)

  useEffect(() => {
    if (!token) setUser(null)
  }, [token])

  const signIn = (t: string, u: User): void => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const signOut = (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, token, signIn, signOut, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = (): AuthContext => useContext(AuthCtx)
