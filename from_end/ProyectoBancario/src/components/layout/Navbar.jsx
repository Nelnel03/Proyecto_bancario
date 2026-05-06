import { Menu, UserCircle } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'

export default function Navbar({ onMenuClick }) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Botón hamburguesa — solo visible en mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
      >
        <Menu size={22} />
      </button>

      {/* Spacer en desktop para empujar el usuario a la derecha */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-2 text-sm">
        <UserCircle size={18} className="text-slate-400" />
        <span className="text-slate-300 font-medium">{user?.full_name ?? 'Usuario'}</span>
      </div>
    </header>
  )
}
