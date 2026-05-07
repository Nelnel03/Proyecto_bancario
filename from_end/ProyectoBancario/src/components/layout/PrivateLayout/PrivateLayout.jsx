import './PrivateLayout.css'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Navbar from '../Navbar/Navbar'

export default function PrivateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fijo en desktop, drawer en mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
