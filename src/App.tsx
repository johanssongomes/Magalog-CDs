import { useState } from 'react'
import { Sidebar, navItems } from './components/Sidebar'
import { BlankPage } from './components/BlankPage'
import { PerformancePage } from './components/PerformancePage'
import { DashboardPage } from './components/DashboardPage'
import { EquipmentsPage } from './components/EquipmentsPage'

export function App() {
  const [activeTab, setActiveTab] = useState('performance')
  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0]

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans notranslate" translate="no">
      {/* Menu Lateral */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={true} 
        setIsOpen={() => {}} 
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="h-14 px-6 border-b border-slate-200 bg-white shadow-xs flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono border border-blue-200 font-semibold">
              PáginaAtiva: {activeTab}
            </span>
            <span className="text-slate-400">/</span>
            <h2 className="text-sm font-bold text-slate-800">{activeItem.label}</h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Conectado
            </span>
          </div>
        </header>

        {/* Área de Conteúdo da Página */}
        <div className="p-5 w-full flex-1">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'catalog' && <EquipmentsPage />}
          {activeTab === 'performance' && <PerformancePage />}
          {activeTab !== 'dashboard' && activeTab !== 'catalog' && activeTab !== 'performance' && (
            <BlankPage 
              title={activeItem.label} 
              description={`Esta é a ${activeItem.description}. Você pode preencher este espaço com componentes, listas e formulários conforme desenvolver a aplicação.`} 
              icon={activeItem.icon} 
              badge={`Página 0${navItems.findIndex(i => i.id === activeTab) + 1} de 0${navItems.length}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
