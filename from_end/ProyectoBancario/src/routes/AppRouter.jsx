import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LoginPage              from '../pages/LoginPage'
import RegisterPage           from '../pages/RegisterPage'
import DashboardPage          from '../pages/DashboardPage'
import AccountsPage           from '../pages/AccountsPage'
import DepositPage            from '../pages/DepositPage'
import WithdrawalPage         from '../pages/WithdrawalPage'
import TransferPage           from '../pages/TransferPage'
import TransactionHistoryPage from '../pages/TransactionHistoryPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute>
          <AccountsPage />
        </ProtectedRoute>
      } />
      <Route path="/deposit" element={
        <ProtectedRoute>
          <DepositPage />
        </ProtectedRoute>
      } />
      <Route path="/withdrawal" element={
        <ProtectedRoute>
          <WithdrawalPage />
        </ProtectedRoute>
      } />
      <Route path="/transfer" element={
        <ProtectedRoute>
          <TransferPage />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <TransactionHistoryPage />
        </ProtectedRoute>
      } />

      {/* Cualquier ruta desconocida → inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
