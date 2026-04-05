import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface PublicRouteProps {
  children: React.ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
