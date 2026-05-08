import { useState, useEffect } from 'react'
import { Users, CreditCard, ArrowLeftRight, TrendingUp, ShieldCheck, UserCog, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../../../services/adminService'
import { fmt } from '../../../utils/format'
import useAuthStore from '../../../store/useAuthStore'
import { ROLES } from '../../../utils/constants'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-gray-900 text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Encabezado diferenciado por rol */}
      <div>
        {isSuperAdmin ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-red-500" />
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Super Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de control maestro</h1>
            <p className="text-gray-500 text-sm mt-1">
              Visión completa del sistema — usuarios, admins, cuentas y movimientos
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
            <p className="text-gray-500 text-sm mt-1">Resumen global del sistema bancario</p>
          </>
        )}
      </div>

      {/* Tarjetas de estadísticas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Tarjeta de Admins — solo visible para super admin */}
          {isSuperAdmin && (
            <StatCard
              icon={UserCog}
              label="Administradores"
              value={stats.total_admins?.toLocaleString('es-MX') ?? '0'}
              color="bg-orange-100 text-orange-600"
            />
          )}

          <StatCard
            icon={Users}
            label="Usuarios registrados"
            value={stats.total_users.toLocaleString('es-MX')}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={CreditCard}
            label="Cuentas activas"
            value={stats.total_accounts.toLocaleString('es-MX')}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={ArrowLeftRight}
            label="Transacciones totales"
            value={stats.total_transactions.toLocaleString('es-MX')}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Volumen total en el sistema"
            value={fmt(stats.total_balance)}
            color="bg-emerald-100 text-emerald-600"
          />
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No se pudieron cargar las estadísticas</p>
      )}

      {/* Acceso rápido a gestión de admins — solo super admin */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Gestión de Administradores</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Crea admins, promueve usuarios y gestiona el equipo
              </p>
            </div>
          </div>
          <Link
            to="/admin/admins"
            className="flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors shrink-0"
          >
            Gestionar
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

    </div>
  )
}
