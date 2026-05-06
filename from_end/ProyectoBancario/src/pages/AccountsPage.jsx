import { useState } from 'react'
import { CreditCard, Plus, X, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import useAccounts from '../hooks/useAccounts'
import { createAccount } from '../services/accountsService'

const ACCOUNT_TYPES = [
  { id: 1, name: 'savings',  label: 'Ahorros',   description: 'Ideal para guardar y hacer crecer tu dinero', color: 'border-blue-500 bg-blue-600/10',   badge: 'bg-blue-600/20 text-blue-400' },
  { id: 2, name: 'checking', label: 'Corriente',  description: 'Para tus gastos diarios y pagos frecuentes',  color: 'border-purple-500 bg-purple-600/10', badge: 'bg-purple-600/20 text-purple-400' },
  { id: 3, name: 'payroll',  label: 'Nómina',     description: 'Recibe tu sueldo y maneja tus prestaciones',  color: 'border-green-500 bg-green-600/10',  badge: 'bg-green-600/20 text-green-400' },
]

const TYPE_META = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.name, t]))

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(n))

function CreateAccountModal({ onClose, onCreated }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await createAccount({ account_type_id: selected })
      toast.success(`Cuenta ${res.data.account_number} creada`)
      onCreated()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Error al crear la cuenta'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Nueva cuenta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">Elige el tipo de cuenta que deseas abrir:</p>

        <div className="space-y-3 mb-6">
          {ACCOUNT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelected(type.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === type.id
                  ? type.color
                  : 'border-slate-700 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-sm">{type.label}</span>
                {selected === type.id && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type.badge}`}>
                    Seleccionada
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">{type.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={!selected || loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Creando...' : 'Abrir cuenta'}
        </button>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const { accounts, loading, error, refetch } = useAccounts()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis cuentas</h1>
          <p className="text-slate-400 text-sm mt-1">Administra todas tus cuentas bancarias</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nueva cuenta
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 border-dashed rounded-xl p-12 text-center">
          <Wallet size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No tienes cuentas</p>
          <p className="text-slate-500 text-sm mt-1">Abre tu primera cuenta para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Abrir cuenta
          </button>
        </div>
      )}

      {!loading && !error && accounts.length > 0 && (
        <div className="space-y-3">
          {accounts.map((account) => {
            const meta = TYPE_META[account.accountType?.name]
            return (
              <div
                key={account.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center">
                    <CreditCard size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium font-mono text-sm tracking-wide">
                      {account.account_number}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${meta?.badge ?? 'bg-slate-700 text-slate-400'}`}>
                      {meta?.label ?? account.accountType?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xl">{fmt(account.balance)}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Saldo disponible</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CreateAccountModal
          onClose={() => setShowModal(false)}
          onCreated={refetch}
        />
      )}

    </div>
  )
}
