import { useState, useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ScrollText, ChevronDown } from 'lucide-react'
import useAccounts from '../hooks/useAccounts'
import { getHistory } from '../services/transactionsService'

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(n))

const fmtDate = (iso) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))

const TYPE_LABELS  = { savings: 'Ahorros', checking: 'Corriente', payroll: 'Nómina' }
const STATUS_META  = {
  completed: { label: 'Completada', class: 'bg-green-600/20 text-green-400' },
  pending:   { label: 'Pendiente',  class: 'bg-yellow-600/20 text-yellow-400' },
  failed:    { label: 'Fallida',    class: 'bg-red-600/20 text-red-400' },
}

function txMeta(tx, accountId) {
  const isIncoming = tx.target_account_id === accountId

  if (tx.type === 'deposit') {
    return { label: 'Depósito', icon: ArrowDownCircle, color: 'text-green-400', sign: '+', amountClass: 'text-green-400' }
  }
  if (tx.type === 'withdrawal') {
    return { label: 'Retiro', icon: ArrowUpCircle, color: 'text-red-400', sign: '-', amountClass: 'text-red-400' }
  }
  if (tx.type === 'transfer') {
    return isIncoming
      ? { label: 'Transferencia recibida', icon: ArrowDownCircle, color: 'text-green-400', sign: '+', amountClass: 'text-green-400' }
      : { label: 'Transferencia enviada',  icon: ArrowLeftRight,  color: 'text-red-400',   sign: '-', amountClass: 'text-red-400'   }
  }
  return { label: tx.type, icon: ArrowLeftRight, color: 'text-slate-400', sign: '', amountClass: 'text-white' }
}

export default function TransactionHistoryPage() {
  const { accounts, loading: loadingAccounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions]       = useState([])
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState(null)

  useEffect(() => {
    if (!selectedAccount) return
    setLoading(true)
    setError(null)
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

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="text-2xl font-bold text-white">Historial</h1>
        <p className="text-slate-400 text-sm mt-1">Consulta los movimientos de tus cuentas</p>
      </div>

      {/* Selector de cuenta */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <label className="block text-slate-300 text-sm font-medium mb-2">Selecciona una cuenta</label>
        {loadingAccounts ? (
          <div className="h-10 bg-slate-700 rounded-lg animate-pulse" />
        ) : (
          <div className="relative">
            <select
              onChange={handleSelect}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
              defaultValue=""
            >
              <option value="" disabled>Elige una cuenta para ver su historial</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_number} — {TYPE_LABELS[a.accountType?.name] ?? a.accountType?.name} — {fmt(a.balance)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Estados */}
      {!selectedAccount && !loadingAccounts && (
        <div className="bg-slate-800 border border-slate-700 border-dashed rounded-2xl p-12 text-center">
          <ScrollText size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Selecciona una cuenta para ver sus movimientos</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && selectedAccount && !error && transactions.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 border-dashed rounded-2xl p-12 text-center">
          <ScrollText size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Sin movimientos</p>
          <p className="text-slate-500 text-sm mt-1">Esta cuenta no tiene transacciones aún</p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-slate-500 text-xs uppercase tracking-wider px-1">
            {transactions.length} movimiento{transactions.length !== 1 ? 's' : ''}
          </p>
          {transactions.map((tx) => {
            const meta   = txMeta(tx, selectedAccount.id)
            const Icon   = meta.icon
            const status = STATUS_META[tx.status] ?? STATUS_META.completed

            return (
              <div
                key={tx.id}
                className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{meta.label}</p>
                    <p className="text-slate-500 text-xs truncate">
                      {tx.description ?? '—'} · {fmtDate(tx.created_at)}
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
      )}

    </div>
  )
}
