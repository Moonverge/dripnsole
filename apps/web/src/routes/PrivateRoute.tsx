import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface PrivateRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function PrivateRoute({ children, fallback = null }: PrivateRouteProps) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return fallback ?? <Navigate to="/login" replace />
  }

  return <>{children}</>
}
