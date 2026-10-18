import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { ProtectedRouteProps } from './protected-route.type'

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}
