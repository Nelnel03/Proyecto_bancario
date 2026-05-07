import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
      <AppRouter />
    </div>
  )
}
