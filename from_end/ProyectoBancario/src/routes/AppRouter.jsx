import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute    from './PublicRoute'
import AdminRoute     from './AdminRoute'

import PrivateLayout from '../components/layout/PrivateLayout/PrivateLayout'
import AdminLayout   from '../components/layout/AdminLayout/AdminLayout'

// Páginas de usuario
import LoginPage              from '../pages/LoginPage/LoginPage'
import RegisterPage           from '../pages/RegisterPage/RegisterPage'
import DashboardPage          from '../pages/DashboardPage/DashboardPage'
import AccountsPage           from '../pages/AccountsPage/AccountsPage'
import DepositPage            from '../pages/DepositPage/DepositPage'
import WithdrawalPage         from '../pages/WithdrawalPage/WithdrawalPage'
import TransferPage           from '../pages/TransferPage/TransferPage'
import TransactionHistoryPage from '../pages/TransactionHistoryPage/TransactionHistoryPage'

// Páginas de administrador
import AdminDashboardPage    from '../pages/admin/AdminDashboardPage/AdminDashboardPage'
import AdminUsersPage        from '../pages/admin/AdminUsersPage/AdminUsersPage'
import AdminTransactionsPage from '../pages/admin/AdminTransactionsPage/AdminTransactionsPage'
import SuperAdminPage        from '../pages/admin/SuperAdminPage/SuperAdminPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Rutas públicas — redirigen al dashboard si ya hay sesión ── */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />

      {/* ── Rutas de usuario — layout bancario estándar ── */}
      <Route element={
        <ProtectedRoute>
          <PrivateLayout />
        </ProtectedRoute>
      }>
        <Route path="/"           element={<DashboardPage />} />
        <Route path="/accounts"   element={<AccountsPage />} />
        <Route path="/deposit"    element={<DepositPage />} />
        <Route path="/withdrawal" element={<WithdrawalPage />} />
        <Route path="/transfer"   element={<TransferPage />} />
        <Route path="/history"    element={<TransactionHistoryPage />} />
      </Route>

      {/* ── Rutas de administrador — layout y guard propios ── */}
      <Route element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route path="/admin"              element={<AdminDashboardPage />} />
        <Route path="/admin/users"        element={<AdminUsersPage />} />
        <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
        <Route path="/admin/admins"       element={<SuperAdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
