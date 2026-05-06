import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

export default function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/" replace /> : children
}
