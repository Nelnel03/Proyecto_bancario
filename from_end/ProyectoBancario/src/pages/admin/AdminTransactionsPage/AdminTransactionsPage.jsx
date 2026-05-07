import { useState, useEffect, useCallback } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminTransactions } from '../../../services/adminService'
import { fmt, fmtDate } from '../../../utils/format'
import { STATUS_META } from '../../../utils/constants'

const FILTERS = [
  { key: 'all',        label: 'Todos'          },
  { key: 'deposit',    label: 'Depósitos'      },
  { key: 'withdrawal', label: 'Retiros'        },
  { key: 'transfer',   label: 'Transferencias' },
]

const TX_ICON = {
  deposit:    { Icon: ArrowDownCircle, color: 'text-emerald-500', label: 'Depósito'       },
  withdrawal: { Icon: ArrowUpCircle,   color: 'text-red-500',     label: 'Retiro'         },
  transfer:   { Icon: ArrowLeftRight,  color: 'text-blue-500',    label: 'Transferencia'  },
}

export default function AdminTransactionsPage() {
  const [data, setData]         = useState({ transactions: [], total: 0, pages: 1 })
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [page, setPage]         = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    getAdminTransactions({ page, limit: 20, type: filter })
      .then((res) => setData(res.data))
      .catch(() => setData({ transactions: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => { load() }, [load])

  const handleFilter = (key) => {
    setFilter(key)
    setPage(1)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
        <p className="text-gray-500 text-sm mt-1">Historial global de operaciones del sistema</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {data.total.toLocaleString('es-MX')} resultado{data.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((n) => <div key={n} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : data.transactions.length === 0 ? (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No hay transacciones para mostrar</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
          {data.transactions.map((tx) => {
            const meta   = TX_ICON[tx.type] ?? { Icon: ArrowLeftRight, color: 'text-gray-400', label: tx.type }
            const status = STATUS_META[tx.status] ?? { label: tx.status, class: 'bg-gray-100 text-gray-600' }
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`shrink-0 ${meta.color}`}>
                  <meta.Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium">{meta.label}</p>
                  <div className="text-gray-400 text-xs flex gap-2 flex-wrap">
                    {tx.sourceAccount && <span>Desde: <span className="font-mono">{tx.sourceAccount.account_number}</span></span>}
                    {tx.targetAccount && <span>Hacia: <span className="font-mono">{tx.targetAccount.account_number}</span></span>}
                    {tx.description   && <span>· {tx.description}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-gray-900 text-sm font-bold">{fmt(tx.amount)}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <p className="text-gray-400 text-xs shrink-0 hidden md:block w-32 text-right">
                  {fmtDate(tx.createdAt)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-gray-500 text-sm">
            Página <span className="text-gray-900 font-medium">{page}</span> de {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages || loading}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
