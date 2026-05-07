import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { ROLES } from '../utils/constants'

/**
 * Guard para rutas del panel de administración.
 * - Sin token          → redirige a /login
 * - role > 3 (usuario) → redirige al dashboard bancario (/)
 * - role ≤ 3           → renderiza el panel admin
 */
export default function AdminRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  const user  = useAuthStore((s) => s.user)

  if (!token)                        return <Navigate to="/login" replace />
  if (!user || user.role > ROLES.EVALUATOR) return <Navigate to="/" replace />
  return children
}
