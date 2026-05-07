import { useState, useEffect } from 'react'
import { Users, CreditCard, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { getAdminStats } from '../../../services/adminService'
import { fmt } from '../../../utils/format'

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen global del sistema bancario</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            color="bg-orange-100 text-orange-600"
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
    </div>
  )
}
