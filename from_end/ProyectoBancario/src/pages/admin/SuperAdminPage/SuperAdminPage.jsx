import { useState, useEffect } from 'react'
import { UserPlus, ArrowUp, ArrowDown, X, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAdminUsers, changeUserRole, createAdmin } from '../../../services/adminService'
import { ROLE_BADGE, ROLES } from '../../../utils/constants'
import { fmtDate } from '../../../utils/format'

const EMPTY_FORM = { full_name: '', email: '', password: '' }

function UserRow({ user, actions, changing }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
        user.role === ROLES.ADMIN ? 'bg-orange-500' :
        user.role === ROLES.EVALUATOR ? 'bg-blue-500' : 'bg-slate-700'
      }`}>
        {user.full_name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm font-medium truncate">{user.full_name}</p>
        <p className="text-gray-400 text-xs truncate">{user.email}</p>
      </div>

      <span className="text-xs text-gray-400 hidden sm:block shrink-0">
        {fmtDate(user.created_at)}
      </span>

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
        user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>
        {user.is_active ? 'Activo' : 'Suspendido'}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {actions.map(({ label, targetRole, variant }) => (
          <button
            key={targetRole}
            onClick={() => variant.handler(user.id, targetRole)}
            disabled={changing === user.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${variant.classes}`}
          >
            {variant.icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({ title, badge, badgeStyle, emptyText, users, actions, changing }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyle}`}>
          {badge}
        </span>
      </div>
      {users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400 text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
          {users.map((user) => (
            <UserRow key={user.id} user={user} actions={actions} changing={changing} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function SuperAdminPage() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [changing, setChanging] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data ?? []))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const admins     = users.filter((u) => u.role === ROLES.ADMIN)
  const evaluators = users.filter((u) => u.role === ROLES.EVALUATOR)
  const normals    = users.filter((u) => u.role === ROLES.USER)

  const handleChangeRole = async (userId, newRole) => {
    setChanging(userId)
    try {
      const res = await changeUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => u.id === userId
          ? { ...u, role: res.data.role, role_label: res.data.role_label }
          : u
        )
      )
      toast.success(`Rol actualizado a "${res.data.role_label}"`)
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al cambiar rol')
    } finally {
      setChanging(null)
    }
  }

  const up   = { handler: handleChangeRole, icon: <ArrowUp size={13} />,   classes: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' }
  const down = { handler: handleChangeRole, icon: <ArrowDown size={13} />, classes: 'text-red-600 bg-red-50 hover:bg-red-100' }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await createAdmin(form)
      setUsers((prev) => [res.data, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Administrador creado exitosamente')
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al crear administrador')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de personal</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra admins y evaluadores — promueve, degrada y crea nuevos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shrink-0"
        >
          <UserPlus size={15} />
          Nuevo administrador
        </button>
      </div>

      {/* Modal: crear administrador */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Crear Administrador</h2>
              </div>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Ej. María García"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  placeholder="admin@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* Sección: Administradores */}
          <Section
            title="Administradores"
            badge={admins.length}
            badgeStyle={ROLE_BADGE[2]}
            emptyText="No hay administradores registrados"
            users={admins}
            changing={changing}
            actions={[
              { label: 'Bajar a Evaluador', targetRole: ROLES.EVALUATOR, variant: down },
              { label: 'Bajar a Usuario',   targetRole: ROLES.USER,      variant: down },
            ]}
          />

          {/* Sección: Evaluadores */}
          <Section
            title="Evaluadores"
            badge={evaluators.length}
            badgeStyle={ROLE_BADGE[3]}
            emptyText="No hay evaluadores registrados"
            users={evaluators}
            changing={changing}
            actions={[
              { label: 'Subir a Admin',   targetRole: ROLES.ADMIN, variant: up   },
              { label: 'Bajar a Usuario', targetRole: ROLES.USER,  variant: down },
            ]}
          />

          {/* Sección: Usuarios */}
          <Section
            title="Usuarios"
            badge={normals.length}
            badgeStyle={ROLE_BADGE[4]}
            emptyText="No hay usuarios disponibles"
            users={normals}
            changing={changing}
            actions={[
              { label: 'Subir a Admin',     targetRole: ROLES.ADMIN,     variant: up },
              { label: 'Subir a Evaluador', targetRole: ROLES.EVALUATOR, variant: up },
            ]}
          />
        </>
      )}
    </div>
  )
}
