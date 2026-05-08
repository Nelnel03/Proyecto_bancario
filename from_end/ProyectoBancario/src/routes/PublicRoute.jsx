import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  const user  = useAuthStore((s) => s.user)

  if (!token) return children
  return <Navigate to={user?.role <= 3 ? '/admin' : '/'} replace />
}
