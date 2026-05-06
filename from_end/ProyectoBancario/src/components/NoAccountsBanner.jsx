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
        ? 'bg-blue-500/5 border-blue-500/20'
        : 'bg-slate-800 border-slate-700 border-dashed'
    }`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        informative ? 'bg-blue-600/20' : 'bg-slate-700'
      }`}>
        <Wallet size={26} className={informative ? 'text-blue-400' : 'text-slate-500'} />
      </div>
      <p className="text-white font-semibold text-base">{message}</p>
      <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>
      <button
        onClick={() => navigate(actionTo)}
        className={`mt-5 text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
          informative
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {actionLabel}
      </button>
    </div>
  )
}
