import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowUpCircle, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { withdrawal } from '../services/transactionsService'
import useAccounts from '../hooks/useAccounts'
import NoAccountsBanner from '../components/NoAccountsBanner'
import { fmt } from '../utils/format'
import { TYPE_LABELS } from '../utils/constants'

export default function WithdrawalPage() {
  const { accounts, loading, refetch } = useAccounts()
  const [result, setResult]   = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [executing, setExecuting] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const selectedNumber  = watch('account_number')
  const enteredAmount   = watch('amount')
  const selectedAccount = accounts.find((a) => a.account_number === selectedNumber)
  const insufficientFunds =
    selectedAccount &&
    enteredAmount &&
    parseFloat(enteredAmount) > parseFloat(selectedAccount.balance)

  const onSubmit = (data) => {
    if (insufficientFunds) return
    setConfirm(data)
  }

  const executeWithdrawal = async () => {
    setExecuting(true)
    console.log('[Withdrawal] Enviando:', confirm)
    try {
      const res = await withdrawal({
        account_number: confirm.account_number,
        amount:         parseFloat(confirm.amount),
        description:    confirm.description || undefined,
      })
      console.log('[Withdrawal] Respuesta:', res)
      setResult(res.data)
      setConfirm(null)
      toast.success('Retiro realizado')
      reset()
      refetch()
    } catch (err) {
      console.error('[Withdrawal] Error:', err.response)
      setConfirm(null)
      toast.error(err.response?.data?.error ?? 'Error al realizar el retiro')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Retiro</h1>
        <p className="text-slate-400 text-sm mt-1">Retira fondos de una de tus cuentas</p>
      </div>

      {/* Sin cuentas — bloquea el formulario */}
      {!loading && accounts.length === 0 ? (
        <NoAccountsBanner
          message="No tienes cuentas para retirar"
          description="Primero debes abrir una cuenta y agregar fondos antes de poder retirar"
          actionLabel="Ir a mis cuentas"
          actionTo="/accounts"
        />
      ) : (
        <>
          {/* Modal de confirmación */}
          {confirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirm(null)} />
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={22} className="text-yellow-400" />
                  <h2 className="text-white font-semibold">Confirmar retiro</h2>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cuenta origen</span>
                    <span className="text-white font-mono">{confirm.account_number}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                    <span className="text-slate-400">Monto</span>
                    <span className="text-white font-bold text-base">{fmt(parseFloat(confirm.amount))}</span>
                  </div>
                  {confirm.description && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Descripción</span>
                      <span className="text-slate-300">{confirm.description}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirm(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeWithdrawal}
                    disabled={executing}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {executing ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
              {errors.account_number && (
                <p className="text-red-400 text-xs mt-1">{errors.account_number.message}</p>
              )}
              {selectedAccount && (
                <p className="text-slate-400 text-xs mt-1.5">
                  Saldo disponible:{' '}
                  <span className="text-white font-medium">{fmt(selectedAccount.balance)}</span>
                </p>
              )}
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
                  className={`w-full bg-slate-700 border text-white placeholder-slate-500 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors ${
                    insufficientFunds
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  {...register('amount', {
                    required: 'El monto es obligatorio',
                    min: { value: 0.01, message: 'El monto mínimo es $0.01' },
                  })}
                />
              </div>
              {errors.amount && (
                <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>
              )}
              {insufficientFunds && (
                <p className="text-red-400 text-xs mt-1">
                  Saldo insuficiente — disponible: {fmt(selectedAccount.balance)}
                </p>
              )}
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
              disabled={loading || insufficientFunds}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              <ArrowUpCircle size={17} />
              Continuar
            </button>

          </form>
        </>
      )}
    </div>
  )
}
