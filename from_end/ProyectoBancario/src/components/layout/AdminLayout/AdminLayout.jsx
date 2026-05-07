import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import AdminSidebar from '../AdminSidebar/AdminSidebar'
import useAuthStore from '../../../store/useAuthStore'
import { ROLE_LABELS, ROLE_BADGE } from '../../../utils/constants'

// Color del badge en la navbar según rol
const NAVBAR_BADGE = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-blue-100 text-blue-700',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Navbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shadow-sm">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="md:hidden text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NAVBAR_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABELS[role] ?? 'Panel'}
            </span>
            <span className="text-gray-700 text-sm font-medium">
              {user?.full_name}
            </span>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
