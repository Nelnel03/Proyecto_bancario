import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  ScrollText,
  LogOut,
} from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'

const links = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/accounts',   label: 'Cuentas',       icon: CreditCard },
  { to: '/deposit',    label: 'Depósito',      icon: ArrowDownCircle },
  { to: '/withdrawal', label: 'Retiro',        icon: ArrowUpCircle },
  { to: '/transfer',   label: 'Transferencia', icon: ArrowLeftRight },
  { to: '/history',    label: 'Historial',     icon: ScrollText },
]

export default function Sidebar({ onNavigate }) {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-60 h-full min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col">

      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          B
        </div>
        <span className="text-white font-semibold text-sm">Banco App</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}
