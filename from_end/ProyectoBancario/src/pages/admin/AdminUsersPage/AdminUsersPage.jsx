import { useState, useEffect } from 'react'
import { UserCheck, UserX, CreditCard, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAdminUsers, toggleUserStatus, changeUserRole } from '../../../services/adminService'
import { fmt, fmtDate } from '../../../utils/format'
import { TYPE_LABELS, TYPE_BADGE, ROLE_LABELS, ROLE_BADGE, ASSIGNABLE_ROLES } from '../../../utils/constants'
import useAuthStore from '../../../store/useAuthStore'

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const myRole      = currentUser?.role ?? 4

  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [changingRole, setChangingRole] = useState(null)

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data ?? []))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (userId) => {
    setToggling(userId)
    try {
      const res = await toggleUserStatus(userId)
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, is_active: res.data.is_active } : u)
      )
      toast.success(res.data.is_active ? 'Usuario activado' : 'Usuario suspendido')
    } catch {
      toast.error('Error al cambiar estado del usuario')
    } finally {
      setToggling(null)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId)
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
      setChangingRole(null)
    }
  }

  const totalBalance = (user) =>
    (user.accounts ?? []).reduce((s, a) => s + parseFloat(a.balance ?? 0), 0)

  const assignableRoles = ASSIGNABLE_ROLES[myRole] ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 text-sm mt-1">
          {myRole <= 2 ? 'Gestiona roles y estado de todos los usuarios bajo tu jerarquía' : 'Gestiona el estado de los usuarios'}
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((n) => <div key={n} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No hay usuarios en tu alcance</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider px-1">
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
            {users.map((user) => (
              <div key={user.id}>

                {/* ── Fila principal ── */}
                <div className="flex items-center gap-3 px-5 py-4">

                  {/* Expandir */}
                  <button
                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                    className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                  >
                    {expanded === user.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>

                  {/* Badge de rol */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[user.role] ?? user.role_label ?? `Rol ${user.role}`}
                  </span>

                  {/* Selector de rol (solo si el solicitante puede cambiar roles) */}
                  {assignableRoles.length > 0 && (
                    <select
                      value={user.role}
                      disabled={changingRole === user.id}
                      onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:border-slate-400 disabled:opacity-50 shrink-0"
                    >
                      {assignableRoles.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}

                  {/* Balance */}
                  <span className="text-gray-900 text-sm font-semibold shrink-0 hidden sm:block">
                    {fmt(totalBalance(user))}
                  </span>

                  {/* Badge estado */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Activo' : 'Suspendido'}
                  </span>

                  {/* Toggle activo/inactivo */}
                  <button
                    onClick={() => handleToggle(user.id)}
                    disabled={toggling === user.id}
                    title={user.is_active ? 'Suspender usuario' : 'Activar usuario'}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      user.is_active
                        ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                </div>

                {/* ── Panel expandible: cuentas ── */}
                {expanded === user.id && (
                  <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Registrado el {fmtDate(user.created_at)}
                      {' · '}Rol #{user.role} — {ROLE_LABELS[user.role] ?? user.role_label}
                    </p>
                    {(user.accounts ?? []).length === 0 ? (
                      <p className="text-gray-400 text-xs">Sin cuentas bancarias</p>
                    ) : (
                      user.accounts.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                          <CreditCard size={15} className="text-gray-400 shrink-0" />
                          <span className="text-gray-700 text-sm font-mono flex-1">{acc.account_number}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TYPE_BADGE[acc.accountType?.name] ?? 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_LABELS[acc.accountType?.name] ?? acc.accountType?.name}
                          </span>
                          <span className="text-gray-900 text-sm font-semibold">{fmt(acc.balance)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
