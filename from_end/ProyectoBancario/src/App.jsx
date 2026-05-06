import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState('comprobando...')

  useEffect(() => {
    axios.get('http://localhost:3000/health')
      .then((r) => setStatus(`Backend online — ${r.data.status ?? 'OK'}`))
      .catch(() => setStatus('Backend no disponible'))
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-10 shadow-xl flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
          B
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Banco App</h1>
        <p className="text-slate-400 text-sm">Stack listo: React 19 · Vite 8 · Tailwind v4</p>
        <div className="flex gap-2 mt-2">
          <span className="bg-blue-600/20 text-blue-400 text-xs font-medium px-3 py-1 rounded-full">React Router v7</span>
          <span className="bg-purple-600/20 text-purple-400 text-xs font-medium px-3 py-1 rounded-full">Zustand</span>
          <span className="bg-green-600/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full">Axios</span>
        </div>
        <div className="mt-4 px-4 py-2 rounded-lg bg-slate-700 text-xs text-slate-300">
          {status}
        </div>
      </div>
    </div>
  )
}

export default App
