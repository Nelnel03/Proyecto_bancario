import './LoginPage.css'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { login as loginService } from '../../services/authService'
import useAuthStore from '../../store/useAuthStore'

export default function LoginPage() {
  const navigate   = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    console.log('[Login] Enviando:', data)
    try {
      const res = await loginService(data)
      console.log('[Login] Respuesta del backend:', res)
      loginStore(res.data.token, res.data.user)
      toast.success(`Bienvenido, ${res.data.user.full_name}`)
      navigate('/')
    } catch (err) {
      console.error('[Login] Error completo:', err)
      console.error('[Login] Respuesta de error:', err.response)
      toast.error(err.response?.data?.error ?? 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg">
            B
          </div>
          <h1 className="text-gray-900 text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mt-1">Accede a tu cuenta bancaria</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 space-y-5">

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-slate-900 font-medium hover:underline transition-colors">
              Regístrate
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
