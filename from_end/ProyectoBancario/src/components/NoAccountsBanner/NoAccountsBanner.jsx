import './NoAccountsBanner.css'
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export default function NoAccountsBanner({
  message     = 'No tienes cuentas aún',
  description = 'Crea una cuenta para comenzar a operar',
  actionLabel = 'Crear cuenta',
  actionTo    = '/accounts',
  informative = false,
}) {
  const navigate = useNavigate()

  return (
    <div className={`rounded-2xl p-8 flex flex-col items-center text-center border ${
      informative
        ? 'bg-blue-50 border-blue-200'
        : 'bg-white border-gray-200 border-dashed shadow-sm'
    }`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        informative ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        <Wallet size={26} className={informative ? 'text-blue-600' : 'text-gray-400'} />
      </div>
      <p className="text-gray-900 font-semibold text-base">{message}</p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs">{description}</p>
      <button
        onClick={() => navigate(actionTo)}
        className="mt-5 text-sm font-medium px-5 py-2 rounded-lg transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
      >
        {actionLabel}
      </button>
    </div>
  )
}
