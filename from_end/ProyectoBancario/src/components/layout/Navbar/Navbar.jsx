import './Navbar.css'
import { Menu, UserCircle } from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'

export default function Navbar({ onMenuClick }) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
      {/* Botón hamburguesa — solo visible en mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-1"
      >
        <Menu size={22} />
      </button>

      {/* Spacer en desktop para empujar el usuario a la derecha */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-gray-700 font-medium">{user?.full_name ?? 'Usuario'}</span>
      </div>
    </header>
  )
}
