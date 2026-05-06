import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginService } from '../services/authService'
import useAuthStore from '../store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

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
      const msg = err.response?.data?.error ?? 'Error al iniciar sesión'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4">
            B
          </div>
          <h1 className="text-white text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-slate-400 text-sm mt-1">Accede a tu cuenta bancaria</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-800 rounded-2xl p-8 shadow-xl space-y-5">

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
              })}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => console.log('[Login] Botón clickeado — errores de validación:', errors)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Regístrate
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
