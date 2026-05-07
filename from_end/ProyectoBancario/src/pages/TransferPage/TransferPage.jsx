import './TransferPage.css'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeftRight, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { transfer } from '../../services/transactionsService'
import useAccounts from '../../hooks/useAccounts'
import NoAccountsBanner from '../../components/NoAccountsBanner/NoAccountsBanner'
import { fmt, fmtAccountNumber, ACCOUNT_NUMBER_PATTERN } from '../../utils/format'
import { TYPE_LABELS } from '../../utils/constants'

export default function TransferPage() {
  const { accounts, loading, refetch } = useAccounts()
  const [result, setResult]   = useState(null)
  const [confirm, setConfirm] = useState(null)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm()

  const sourceNumber    = watch('source_account_number')
  const enteredAmount   = watch('amount')
  const sourceAccount   = accounts.find((a) => a.account_number === sourceNumber)
  const insufficientFunds =
    sourceAccount &&
    enteredAmount &&
    parseFloat(enteredAmount) > parseFloat(sourceAccount.balance)

  const onSubmit = (data) => {
    if (insufficientFunds) return
    setConfirm(data)
  }

  const executeTransfer = async () => {
    console.log('[Transfer] Enviando:', confirm)
    try {
      const res = await transfer({
        source_account_number: confirm.source_account_number,
        target_account_number: confirm.target_account_number.trim(),
        amount:                parseFloat(confirm.amount),
        description:           confirm.description || undefined,
      })
      console.log('[Transfer] Respuesta:', res)
      setResult(res.data)
      setConfirm(null)
      toast.success('Transferencia realizada')
      reset()
      refetch()
    } catch (err) {
      console.error('[Transfer] Error:', err.response)
      setConfirm(null)
      toast.error(err.response?.data?.error ?? 'Error al realizar la transferencia')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transferencia</h1>
        <p className="text-gray-500 text-sm mt-1">Envía dinero a otra cuenta</p>
      </div>

      {/* Sin cuentas — bloquea el formulario */}
      {!loading && accounts.length === 0 ? (
        <NoAccountsBanner
          message="No tienes cuentas para transferir"
          description="Necesitas al menos una cuenta con saldo para poder realizar transferencias"
          actionLabel="Ir a mis cuentas"
          actionTo="/accounts"
        />
      ) : (
        <>
          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
              <CheckCircle size={22} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-blue-700 font-medium text-sm">Transferencia exitosa</p>
                <p className="text-gray-600 text-sm mt-1">
                  Nuevo saldo en cuenta origen:{' '}
                  <span className="text-gray-900 font-bold">{fmt(result.source_new_balance)}</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">ID: {result.transaction_id}</p>
              </div>
            </div>
          )}

          {/* Modal de confirmación */}
          {confirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={22} className="text-amber-500" />
                  <h2 className="text-gray-900 font-semibold">Confirmar transferencia</h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Desde</span>
                    <span className="text-gray-900 font-mono">{confirm.source_account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hacia</span>
                    <span className="text-gray-900 font-mono">{confirm.target_account_number}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-500">Monto</span>
                    <span className="text-gray-900 font-bold text-base">{fmt(parseFloat(confirm.amount))}</span>
                  </div>
                  {confirm.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Descripción</span>
                      <span className="text-gray-700">{confirm.description}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirm(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeTransfer}
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Cuenta origen</label>
              {loading ? (
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
              ) : (
                <select
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  {...register('source_account_number', { required: 'Selecciona la cuenta origen' })}
                >
                  <option value="">Selecciona tu cuenta</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.account_number}>
                      {a.account_number} — {TYPE_LABELS[a.accountType?.name] ?? a.accountType?.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.source_account_number && (
                <p className="text-red-500 text-xs mt-1">{errors.source_account_number.message}</p>
              )}
              {sourceAccount && (
                <p className="text-gray-500 text-xs mt-1.5">
                  Saldo disponible:{' '}
                  <span className="text-gray-900 font-medium">{fmt(sourceAccount.balance)}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Cuenta destino</label>
              {(() => {
                const { onChange, ...rest } = register('target_account_number', {
                  required: 'El número de cuenta destino es obligatorio',
                  pattern:  { value: ACCOUNT_NUMBER_PATTERN, message: 'Formato inválido — usa XXXX-XXXX-XXXX' },
                  validate: (v) => v.trim() !== sourceNumber || 'La cuenta destino debe ser diferente a la origen',
                })
                return (
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength={14}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                    onChange={(e) => { e.target.value = fmtAccountNumber(e.target.value); onChange(e) }}
                    {...rest}
                  />
                )
              })()}
              {errors.target_account_number && (
                <p className="text-red-500 text-xs mt-1">{errors.target_account_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={`w-full bg-gray-50 border text-gray-900 placeholder-gray-400 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors ${
                    insufficientFunds
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:border-slate-500 focus:ring-slate-500'
                  }`}
                  {...register('amount', {
                    required: 'El monto es obligatorio',
                    min: { value: 0.01, message: 'El monto mínimo es $0.01' },
                  })}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
              )}
              {insufficientFunds && (
                <p className="text-red-500 text-xs mt-1">
                  Saldo insuficiente — disponible: {fmt(sourceAccount.balance)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Pago de deuda"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                {...register('description')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || insufficientFunds}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              <ArrowLeftRight size={17} />
              Continuar
            </button>

          </form>
        </>
      )}
    </div>
  )
}
