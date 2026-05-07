import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ScrollText, LogOut } from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import { ROLES, ROLE_LABELS, ROLE_BADGE } from '../../../utils/constants'

// Links disponibles según el rol
const ALL_LINKS = [
  { to: '/admin',              label: 'Dashboard',     icon: LayoutDashboard, minRole: ROLES.ADMIN },
  { to: '/admin/users',        label: 'Usuarios',      icon: Users,           minRole: ROLES.EVALUATOR },
  { to: '/admin/transactions', label: 'Transacciones', icon: ScrollText,      minRole: ROLES.ADMIN },
]

// Color del acento según el rol del usuario logueado
const ROLE_ACCENT = {
  1: { dot: 'bg-red-500',    text: 'text-red-400',    letter: 'S' },
  2: { dot: 'bg-orange-500', text: 'text-orange-400', letter: 'A' },
  3: { dot: 'bg-blue-500',   text: 'text-blue-400',   letter: 'E' },
}

export default function AdminSidebar({ onNavigate }) {
  const logout = useAuthStore((s) => s.logout)
  const user   = useAuthStore((s) => s.user)
  const role   = user?.role ?? ROLES.USER

  const accent    = ROLE_ACCENT[role] ?? ROLE_ACCENT[2]
  const roleLabel = ROLE_LABELS[role] ?? 'Panel'

  // Filtrar links según el rol (evaluador no ve Dashboard ni Transacciones)
  const links = ALL_LINKS.filter((l) => role <= l.minRole)

  return (
    <aside className="w-60 h-full min-h-screen bg-slate-900 flex flex-col">

      {/* Logo + rol */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className={`w-8 h-8 rounded-lg ${accent.dot} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {accent.letter}
        </div>
        <div>
          <p className="text-white font-semibold text-sm tracking-tight">Banco App</p>
          <p className={`text-xs font-medium ${accent.text}`}>{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}
