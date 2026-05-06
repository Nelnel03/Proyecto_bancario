import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute             from './ProtectedRoute'
import PrivateLayout              from '../components/layout/PrivateLayout'

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

      {/* Rutas protegidas — todas comparten PrivateLayout */}
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

      {/* Ruta desconocida → inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
