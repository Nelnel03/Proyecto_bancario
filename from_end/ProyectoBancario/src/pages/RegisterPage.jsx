import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { register as registerService } from '../services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    console.log('[Register] Enviando:', data)
    try {
      const res = await registerService({
        full_name: data.full_name,
        email:     data.email,
        password:  data.password,
      })
      console.log('[Register] Respuesta del backend:', res)
      toast.success('Cuenta creada. Ahora inicia sesión.')
      navigate('/login')
    } catch (err) {
      console.error('[Register] Error completo:', err)
      console.error('[Register] Respuesta de error:', err.response)
      toast.error(err.response?.data?.error ?? 'Error al registrarse')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mb-4">
            B
          </div>
          <h1 className="text-white text-2xl font-bold">Crear cuenta</h1>
          <p className="text-slate-400 text-sm mt-1">Únete a Banco App</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-800 rounded-2xl p-8 shadow-xl space-y-5">

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Juan Pérez"
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              {...register('full_name', {
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
          </div>

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
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                {...register('confirm_password', {
                  required: 'Confirma tu contraseña',
                  validate: (v) => v === password || 'Las contraseñas no coinciden',
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Inicia sesión
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}
