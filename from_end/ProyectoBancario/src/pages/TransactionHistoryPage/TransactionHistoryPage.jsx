import './TransactionHistoryPage.css'
import { useState, useEffect, useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ScrollText, ChevronDown } from 'lucide-react'
import useAccounts from '../../hooks/useAccounts'
import { getHistory } from '../../services/transactionsService'
import { fmt, fmtDate } from '../../utils/format'
import { TYPE_LABELS, STATUS_META } from '../../utils/constants'

function txMeta(tx, accountId) {
  const isIncoming = tx.target_account_id === accountId
  if (tx.type === 'deposit') {
    return { label: 'Depósito', icon: ArrowDownCircle, color: 'text-emerald-500', sign: '+', amountClass: 'text-emerald-600' }
  }
  if (tx.type === 'withdrawal') {
    return { label: 'Retiro', icon: ArrowUpCircle, color: 'text-red-500', sign: '-', amountClass: 'text-red-500' }
  }
  if (tx.type === 'transfer') {
    return isIncoming
      ? { label: 'Transferencia recibida', icon: ArrowDownCircle, color: 'text-emerald-500', sign: '+', amountClass: 'text-emerald-600' }
      : { label: 'Transferencia enviada',  icon: ArrowLeftRight,  color: 'text-red-500',    sign: '-', amountClass: 'text-red-500'   }
  }
  return { label: tx.type, icon: ArrowLeftRight, color: 'text-gray-400', sign: '', amountClass: 'text-gray-900' }
}

function dayLabel(isoDate) {
  const today     = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const d         = new Date(isoDate)
  const sameDay   = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today))     return 'Hoy'
  if (sameDay(d, yesterday)) return 'Ayer'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)
}

const FILTERS = [
  { key: 'all',        label: 'Todos'          },
  { key: 'deposit',    label: 'Depósitos'      },
  { key: 'withdrawal', label: 'Retiros'        },
  { key: 'transfer',   label: 'Transferencias' },
]

export default function TransactionHistoryPage() {
  const { accounts, loading: loadingAccounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions]       = useState([])
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState(null)
  const [activeFilter, setActiveFilter]       = useState('all')

  useEffect(() => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)
    setActiveFilter('all')
    getHistory(selectedAccount.id)
      .then((res) => setTransactions(res.data ?? []))
      .catch((err) => {
        console.error('[History] Error:', err.response)
        setError('No se pudo cargar el historial')
      })
      .finally(() => setLoading(false))
  }, [selectedAccount])

  const handleSelect = (e) => {
    const acc = accounts.find((a) => a.id === e.target.value)
    setSelectedAccount(acc ?? null)
    setTransactions([])
  }

  const filtered = useMemo(
    () => (activeFilter === 'all' ? transactions : transactions.filter((tx) => tx.type === activeFilter)),
    [transactions, activeFilter]
  )

  const grouped = useMemo(() => {
    const map = new Map()
    for (const tx of filtered) {
      const day = tx.createdAt.slice(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day).push(tx)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
        <p className="text-gray-500 text-sm mt-1">Consulta los movimientos de tus cuentas</p>
      </div>

      {/* Selector de cuenta */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <label className="block text-gray-700 text-sm font-medium mb-2">Selecciona una cuenta</label>
        {loadingAccounts ? (
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        ) : (
          <div className="relative">
            <select
              onChange={handleSelect}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors pr-10"
              defaultValue=""
            >
              <option value="" disabled>Elige una cuenta para ver su historial</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_number} — {TYPE_LABELS[a.accountType?.name] ?? a.accountType?.name} — {fmt(a.balance)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Filtros por tipo */}
      {selectedAccount && !loading && transactions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Estado vacío inicial */}
      {!selectedAccount && !loadingAccounts && (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center shadow-sm">
          <ScrollText size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Selecciona una cuenta para ver sus movimientos</p>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Sin movimientos */}
      {!loading && selectedAccount && !error && transactions.length === 0 && (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center shadow-sm">
          <ScrollText size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Sin movimientos</p>
          <p className="text-gray-400 text-sm mt-1">Esta cuenta no tiene transacciones aún</p>
        </div>
      )}

      {/* Sin resultados para el filtro activo */}
      {!loading && selectedAccount && !error && transactions.length > 0 && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No hay movimientos de este tipo</p>
        </div>
      )}

      {/* Lista agrupada por fecha */}
      {!loading && grouped.length > 0 && (
        <div className="space-y-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider px-1">
            {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
          </p>
          {grouped.map(([day, txs]) => (
            <div key={day}>
              <p className="text-gray-400 text-xs font-medium mb-2 px-1">{dayLabel(day)}</p>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-sm">
                {txs.map((tx) => {
                  const meta   = txMeta(tx, selectedAccount.id)
                  const Icon   = meta.icon
                  const status = STATUS_META[tx.status] ?? STATUS_META.completed
                  return (
                    <div
                      key={tx.id}
                      className="px-5 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-medium truncate">{meta.label}</p>
                          <p className="text-gray-400 text-xs truncate">
                            {tx.description ?? '—'} · {fmtDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.class}`}>
                          {status.label}
                        </span>
                        <p className={`text-base font-bold ${meta.amountClass}`}>
                          {meta.sign}{fmt(tx.amount)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
