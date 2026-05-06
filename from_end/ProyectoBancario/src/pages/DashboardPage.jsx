import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, CreditCard, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import useAccounts from '../hooks/useAccounts'
import NoAccountsBanner from '../components/NoAccountsBanner'
import { fmt, fmtDate } from '../utils/format'
import { TYPE_LABELS, TYPE_BADGE, STATUS_META } from '../utils/constants'
import { getRecentTransactions } from '../services/transactionsService'

const quickActions = [
  { label: 'Depósito',      icon: ArrowDownCircle, to: '/deposit',    color: 'hover:border-green-500 hover:text-green-400' },
  { label: 'Retiro',        icon: ArrowUpCircle,   to: '/withdrawal', color: 'hover:border-red-500 hover:text-red-400' },
  { label: 'Transferencia', icon: ArrowLeftRight,  to: '/transfer',   color: 'hover:border-blue-500 hover:text-blue-400' },
  { label: 'Historial',     icon: CreditCard,      to: '/history',    color: 'hover:border-purple-500 hover:text-purple-400' },
]

const TX_ICON = {
  deposit:    { Icon: ArrowDownCircle, color: 'text-green-400' },
  withdrawal: { Icon: ArrowUpCircle,   color: 'text-red-400'   },
  transfer:   { Icon: ArrowLeftRight,  color: 'text-blue-400'  },
}

const TX_LABELS = { deposit: 'Depósito', withdrawal: 'Retiro', transfer: 'Transferencia' }

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { accounts, loading, error } = useAccounts()
  const navigate = useNavigate()

  const [recent, setRecent]           = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    getRecentTransactions(5)
      .then((res) => setRecent(res.data ?? []))
      .catch(() => setRecent([]))
      .finally(() => setRecentLoading(false))
  }, [])

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Aquí tienes un resumen de tus finanzas
        </p>
      </div>

      {/* Balance total */}
      {!loading && accounts.length === 0 ? (
        <NoAccountsBanner
          message="Aún no tienes cuentas"
          description="Abre tu primera cuenta para comenzar a gestionar tu dinero"
          actionLabel="Abrir mi primera cuenta"
          actionTo="/accounts"
        />
      ) : (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <TrendingUp size={15} />
            Balance total
          </div>
          {loading ? (
            <div className="h-10 w-48 bg-blue-500/40 rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-white tracking-tight">{fmt(totalBalance)}</p>
          )}
          <p className="text-blue-200 text-xs mt-2">
            {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
          </p>
        </div>
      )}

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 text-sm font-medium transition-all ${color}`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mis cuentas */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Mis cuentas
        </h2>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <CreditCard size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium font-mono">
                      {account.account_number}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[account.accountType?.name] ?? 'bg-slate-700 text-slate-400'}`}>
                      {TYPE_LABELS[account.accountType?.name] ?? account.accountType?.name}
                    </span>
                  </div>
                </div>
                <p className="text-white font-semibold text-lg">
                  {fmt(parseFloat(account.balance))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimos movimientos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Últimos movimientos
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
          >
            Ver historial completo →
          </button>
        </div>

        {recentLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!recentLoading && recent.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center text-slate-500 text-sm">
            Aún no hay movimientos registrados
          </div>
        )}

        {!recentLoading && recent.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700 overflow-hidden">
            {recent.map((tx) => {
              const meta   = TX_ICON[tx.type] ?? { Icon: ArrowLeftRight, color: 'text-slate-400' }
              const status = STATUS_META[tx.status] ?? { label: tx.status, class: 'bg-slate-700 text-slate-400' }
              return (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`shrink-0 ${meta.color}`}>
                    <meta.Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{TX_LABELS[tx.type] ?? tx.type}</p>
                    <p className="text-slate-500 text-xs truncate">{tx.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">{fmt(tx.amount)}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs shrink-0 hidden sm:block">{fmtDate(tx.createdAt)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
