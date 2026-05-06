import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
      <AppRouter />
    </div>
  )
}
