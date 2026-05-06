import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowUpCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { withdrawal } from '../services/transactionsService'
import useAccounts from '../hooks/useAccounts'

const fmt = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const TYPE_LABELS = { savings: 'Ahorros', checking: 'Corriente', payroll: 'Nómina' }

export default function WithdrawalPage() {
  const { accounts, loading } = useAccounts()
  const [result, setResult]   = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    console.log('[Withdrawal] Enviando:', data)
    try {
      const res = await withdrawal({
        account_number: data.account_number,
        amount:         parseFloat(data.amount),
        description:    data.description || undefined,
      })
      console.log('[Withdrawal] Respuesta:', res)
      setResult(res.data)
      toast.success('Retiro realizado')
      reset()
    } catch (err) {
      console.error('[Withdrawal] Error:', err.response)
      toast.error(err.response?.data?.error ?? 'Error al realizar el retiro')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Retiro</h1>
        <p className="text-slate-400 text-sm mt-1">Retira fondos de una de tus cuentas</p>
      </div>

      {result && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 flex items-start gap-4">
          <CheckCircle size={22} className="text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-blue-400 font-medium text-sm">Retiro exitoso</p>
            <p className="text-slate-300 text-sm mt-1">
              Nuevo saldo: <span className="text-white font-bold">{fmt(result.new_balance)}</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">ID: {result.transaction_id}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Cuenta origen</label>
          {loading ? (
            <div className="h-10 bg-slate-700 rounded-lg animate-pulse" />
          ) : (
            <select
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              {...register('account_number', { required: 'Selecciona una cuenta' })}
            >
              <option value="">Selecciona una cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.account_number}>
                  {a.account_number} — {TYPE_LABELS[a.accountType?.name] ?? a.accountType?.name} — {fmt(a.balance)}
                </option>
              ))}
            </select>
          )}
          {errors.account_number && <p className="text-red-400 text-xs mt-1">{errors.account_number.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              {...register('amount', {
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto mínimo es $0.01' },
              })}
            />
          </div>
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">
            Descripción <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Gastos personales"
            className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            {...register('description')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loading || accounts.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          <ArrowUpCircle size={17} />
          {isSubmitting ? 'Procesando...' : 'Realizar retiro'}
        </button>

        {!loading && accounts.length === 0 && (
          <p className="text-slate-500 text-xs text-center">No tienes cuentas disponibles para retirar</p>
        )}
      </form>
    </div>
  )
}
