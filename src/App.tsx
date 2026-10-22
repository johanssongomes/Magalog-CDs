import { useState, useEffect } from 'react'
import { Sidebar, navItems } from './components/Sidebar'
import { BlankPage } from './components/BlankPage'
import { PerformancePage } from './components/PerformancePage'
import { DashboardPage } from './components/DashboardPage'
import { EquipmentsPage } from './components/EquipmentsPage'
import { BankHoursPage } from './components/BankHoursPage'
import { CentralOperacionalPage } from './components/CentralOperacionalPage'
import { PmtsPage } from './components/PmtsPage'
import { UsersManagementPage } from './components/UsersManagementPage'
import { BudgetManagementPage } from './components/BudgetManagementPage'
import { LinksPage } from './components/LinksPage'
import { LoginPage } from './components/LoginPage'
import { AuthProvider, useAuth } from './lib/authContext'
import { ShieldAlert, Loader2 } from 'lucide-react'

function AppContent() {
  const { user, loading, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('performance')

  // Se o usuário não tiver permissão para a aba atual, redireciona para a primeira aba permitida
  useEffect(() => {
    if (user && !hasPermission(activeTab)) {
      const firstAllowed = navItems.find(item => hasPermission(item.id))
      if (firstAllowed) {
        setActiveTab(firstAllowed.id)
      }
    }
  }, [user, activeTab, hasPermission])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070d1e] text-white">
        <Loader2 size={36} className="animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Carregando permissões...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

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
        <div className="px-5 sm:px-6 py-4 w-full flex-1">
          {/* Bloqueio de Segurança para páginas não autorizadas */}
          {!hasPermission(activeTab) ? (
            <div className="bg-white border border-rose-200 rounded-3xl p-10 text-center max-w-md mx-auto my-12 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-base font-bold text-slate-800 mb-1">Acesso Restrito</h2>
              <p className="text-xs text-slate-500 mb-4">
                Seu perfil de <strong>{user.role}</strong> não possui permissão para acessar esta página. Contate o Administrador do sistema.
              </p>
              <button
                onClick={() => setActiveTab('performance')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Voltar à Página Principal
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardPage />}
              {activeTab === 'catalog' && <EquipmentsPage />}
              {activeTab === 'performance' && <PerformancePage />}
              {activeTab === 'budget' && <BudgetManagementPage />}
              {activeTab === 'inventory' && <BankHoursPage />}
              {(activeTab === 'pmts' || activeTab === 'reports') && <PmtsPage />}
              {(activeTab === 'settings' || activeTab === 'central-operacional') && <CentralOperacionalPage />}
              {activeTab === 'links' && <LinksPage />}
              {activeTab === 'users' && <UsersManagementPage />}
              {activeTab !== 'dashboard' && activeTab !== 'catalog' && activeTab !== 'performance' && activeTab !== 'inventory' && activeTab !== 'pmts' && activeTab !== 'reports' && activeTab !== 'settings' && activeTab !== 'central-operacional' && activeTab !== 'links' && activeTab !== 'users' && (
                <BlankPage 
                  title={activeItem.label} 
                  description={`Esta é a ${activeItem.description}. Você pode preencher este espaço com componentes, listas e formulários conforme desenvolver a aplicação.`} 
                  icon={activeItem.icon} 
                  badge={`Página 0${navItems.findIndex(i => i.id === activeTab) + 1} de 0${navItems.length}`}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

