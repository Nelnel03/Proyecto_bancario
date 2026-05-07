import './DepositPage.css'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDownCircle, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { deposit } from '../../services/transactionsService'
import useAccounts from '../../hooks/useAccounts'
import NoAccountsBanner from '../../components/NoAccountsBanner/NoAccountsBanner'
import { fmt, fmtAccountNumber, ACCOUNT_NUMBER_PATTERN } from '../../utils/format'

export default function DepositPage() {
  const { accounts, loading, refetch } = useAccounts()
  const [result, setResult]     = useState(null)
  const [confirm, setConfirm]   = useState(null)
  const [executing, setExecuting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = (data) => setConfirm(data)

  const executeDeposit = async () => {
    setExecuting(true)
    console.log('[Deposit] Enviando:', confirm)
    try {
      const res = await deposit({
        account_number: confirm.account_number.trim(),
        amount:         parseFloat(confirm.amount),
        description:    confirm.description || undefined,
      })
      console.log('[Deposit] Respuesta:', res)
      setResult(res.data)
      setConfirm(null)
      toast.success('Depósito realizado')
      reset()
      refetch()
    } catch (err) {
      console.error('[Deposit] Error:', err.response)
      setConfirm(null)
      toast.error(err.response?.data?.error ?? 'Error al realizar el depósito')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Depósito</h1>
        <p className="text-gray-500 text-sm mt-1">Agrega fondos a cualquier cuenta activa</p>
      </div>

      {/* Modal de confirmación */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={22} className="text-amber-500" />
              <h2 className="text-gray-900 font-semibold">Confirmar depósito</h2>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Cuenta destino</span>
                <span className="text-gray-900 font-mono">{confirm.account_number}</span>
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
                onClick={executeDeposit}
                disabled={executing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {executing ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-4">
          <CheckCircle size={22} className="text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-emerald-700 font-medium text-sm">Depósito exitoso</p>
            <p className="text-gray-600 text-sm mt-1">
              Nuevo saldo: <span className="text-gray-900 font-bold">{fmt(result.new_balance)}</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">ID: {result.transaction_id}</p>
          </div>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <NoAccountsBanner
          message="Aún no tienes cuentas propias"
          description="Puedes depositar en cualquier cuenta del banco, pero si quieres recibir depósitos primero crea la tuya"
          actionLabel="Crear mi cuenta"
          actionTo="/accounts"
          informative
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1.5">
            Número de cuenta destino
          </label>
          {(() => {
            const { onChange, ...rest } = register('account_number', {
              required: 'El número de cuenta es obligatorio',
              pattern:  { value: ACCOUNT_NUMBER_PATTERN, message: 'Formato inválido — usa XXXX-XXXX-XXXX' },
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
          {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number.message}</p>}
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
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              {...register('amount', {
                required: 'El monto es obligatorio',
                min: { value: 0.01, message: 'El monto mínimo es $0.01' },
              })}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1.5">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Pago de renta"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
            {...register('description')}
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          <ArrowDownCircle size={17} />
          Continuar
        </button>
      </form>
    </div>
  )
}
