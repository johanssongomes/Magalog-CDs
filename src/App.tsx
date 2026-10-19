import { useState } from 'react'
import { Sidebar, navItems } from './components/Sidebar'
import { BlankPage } from './components/BlankPage'
import { PerformancePage } from './components/PerformancePage'
import { DashboardPage } from './components/DashboardPage'
import { EquipmentsPage } from './components/EquipmentsPage'
import { BankHoursPage } from './components/BankHoursPage'
import { CentralOperacionalPage } from './components/CentralOperacionalPage'
import { PmtsPage } from './components/PmtsPage'

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
        {/* Área de Conteúdo da Página */}
        <div className="p-4 w-full flex-1">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'catalog' && <EquipmentsPage />}
          {activeTab === 'performance' && <PerformancePage />}
          {activeTab === 'inventory' && <BankHoursPage />}
          {(activeTab === 'pmts' || activeTab === 'reports') && <PmtsPage />}
          {(activeTab === 'settings' || activeTab === 'central-operacional') && <CentralOperacionalPage />}
          {activeTab !== 'dashboard' && activeTab !== 'catalog' && activeTab !== 'performance' && activeTab !== 'inventory' && activeTab !== 'pmts' && activeTab !== 'reports' && activeTab !== 'settings' && activeTab !== 'central-operacional' && (
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
