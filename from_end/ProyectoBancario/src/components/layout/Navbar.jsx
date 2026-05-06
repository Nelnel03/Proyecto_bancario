import { UserCircle } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'

export default function Navbar() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-end px-6">
      <div className="flex items-center gap-2 text-sm">
        <UserCircle size={18} className="text-slate-400" />
        <span className="text-slate-300 font-medium">{user?.full_name ?? 'Usuario'}</span>
      </div>
    </header>
  )
}
