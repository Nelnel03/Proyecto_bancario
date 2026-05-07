export const TYPE_LABELS = {
  savings:  'Ahorros',
  checking: 'Corriente',
  payroll:  'Nómina',
}

export const TYPE_BADGE = {
  savings:  'bg-blue-100 text-blue-700',
  checking: 'bg-purple-100 text-purple-700',
  payroll:  'bg-emerald-100 text-emerald-700',
}

export const STATUS_META = {
  completed: { label: 'Completada', class: 'bg-emerald-100 text-emerald-700' },
  pending:   { label: 'Pendiente',  class: 'bg-amber-100 text-amber-700' },
  failed:    { label: 'Fallida',    class: 'bg-red-100 text-red-600' },
}

// ─── Roles de usuario ─────────────────────────────────────────────────────────
// Valores numéricos que coinciden con la columna `role` de la tabla `users`.
// Menor número = mayor autoridad en la jerarquía.

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN:       2,
  EVALUATOR:   3,
  USER:        4,
}

export const ROLE_LABELS = {
  1: 'Super Admin',
  2: 'Admin',
  3: 'Evaluador',
  4: 'Usuario',
}

/** Badge visual para cada rol en la UI del panel admin */
export const ROLE_BADGE = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-gray-100 text-gray-600',
}

/** Opciones de rol que cada rol puede asignar a otros — parallel al backend */
export const ASSIGNABLE_ROLES = {
  1: [2, 3, 4], // super_admin puede asignar admin, evaluador y usuario
  2: [3, 4],    // admin puede asignar evaluador y usuario
  3: [],        // evaluador no puede cambiar roles
}
