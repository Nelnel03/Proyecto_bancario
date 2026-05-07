import axiosClient from './axiosClient'

/** Métricas globales (solo roles 1 y 2) */
export const getAdminStats = () =>
  axiosClient.get('/admin/stats').then((r) => r.data)

/** Lista de usuarios visibles según jerarquía del solicitante */
export const getAdminUsers = () =>
  axiosClient.get('/admin/users').then((r) => r.data)

/** Activar / suspender un usuario */
export const toggleUserStatus = (userId) =>
  axiosClient.patch(`/admin/users/${userId}/toggle`).then((r) => r.data)

/** Cambiar el rol de un usuario (roles 1 y 2 con restricciones) */
export const changeUserRole = (userId, role) =>
  axiosClient.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data)

/** Historial global de transacciones paginado (solo roles 1 y 2) */
export const getAdminTransactions = ({ page = 1, limit = 20, type = 'all' } = {}) =>
  axiosClient.get('/admin/transactions', { params: { page, limit, type } }).then((r) => r.data)
