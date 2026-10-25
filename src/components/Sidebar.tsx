import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Package, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Database,
  Layers,
  Server,
  Zap,
  Globe,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  LogOut,
  DollarSign,
  Radio,
  Activity,
  CalendarDays
} from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { OnlineUsersModal } from './OnlineUsersModal'

export interface NavItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

interface SidebarProps {
  activeTab: string
  setActiveTab: (id: string) => void
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  isCollapsed?: boolean
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  onOpenSearch?: () => void
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Página em branco 1 - Painel Principal',
    icon: <LayoutDashboard size={20} />
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Monitoramento de Desempenho e Indicadores Diários do CD',
    icon: <Zap size={20} />
  },
  {
    id: 'catalog',
    label: 'Equipamentos',
    description: 'Página em branco 2 - Gestão de Equipamentos dos CDs',
    icon: <FolderKanban size={20} />
  },
  {
    id: 'pmts',
    label: 'Gestão 360°',
    description: 'Gestão e Acompanhamento de PMTs e Indicadores 360°',
    icon: <BarChart3 size={20} />
  },
  {
    id: 'agenda',
    label: 'Agenda Corporativa',
    description: 'Gestão de reuniões, atas, eventos e planos de ação',
    icon: <CalendarDays size={20} />
  },
  {
    id: 'budget',
    label: 'Gestão Orçamentária',
    description: 'Controle de Custos, Orçamento Disponível e Previsto x Realizado',
    icon: <DollarSign size={20} />
  },
  {
    id: 'inventory',
    label: 'Banco de Horas',
    description: 'Gestão e Apontamento do Banco de Horas',
    icon: <Clock size={20} />
  },
  {
    id: 'settings',
    label: 'Central Operacional',
    description: 'Central Operacional',
    icon: <Settings size={20} />
  },
  {
    id: 'links',
    label: 'Links',
    description: 'Links Úteis, Sites e Ferramentas Operacionais',
    icon: <Globe size={20} />
  },
  {
    id: 'users',
    label: 'Usuários & Permissões',
    description: 'Controle de Acessos e Usuários',
    icon: <Users size={20} />
  }
]

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  isCollapsed: controlledIsCollapsed,
  setIsCollapsed: controlledSetIsCollapsed,
  onOpenSearch
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed
  const setIsCollapsed = controlledSetIsCollapsed || setInternalCollapsed

  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false)
  const { user, logout, hasPermission, onlineUsers } = useAuth()

  // Filtra itens de acordo com a permissão do usuário
  const visibleNavItems = navItems.filter((item) => hasPermission(item.id))

  // Navegação na Barra Lateral usando as Setas do Teclado (ArrowUp e ArrowDown)
  useEffect(() => {
    const handleSidebarArrowNavigation = (e: KeyboardEvent) => {
      // Ignora se o usuário estiver digitando em campos de input, textarea ou com modal aberto
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIndex = visibleNavItems.findIndex(item => item.id === activeTab)
        if (currentIndex === -1) return

        let nextIndex = currentIndex
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % visibleNavItems.length
        } else if (e.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + visibleNavItems.length) % visibleNavItems.length
        }

        if (visibleNavItems[nextIndex]) {
          setActiveTab(visibleNavItems[nextIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleSidebarArrowNavigation)
    return () => window.removeEventListener('keydown', handleSidebarArrowNavigation)
  }, [visibleNavItems, activeTab, setActiveTab])

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-80'} bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 z-40 relative`}>
      {/* Faixa decorativa em gradiente colorido na lateral esquerda */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-[4px] pointer-events-none z-10 bg-gradient-to-b from-[#00ff66] via-[#00f2fe] via-[#0066ff] via-[#7b2cbf] to-[#d900ff] shadow-[0_0_12px_rgba(0,242,254,0.4)]" 
      />
      {/* Faixa decorativa em gradiente colorido na lateral direita */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-[4px] pointer-events-none z-10 bg-gradient-to-b from-[#00ff66] via-[#00f2fe] via-[#0066ff] via-[#7b2cbf] to-[#d900ff] shadow-[0_0_12px_rgba(0,242,254,0.4)]" 
      />
      {/* Header / Brand */}
      <div className="relative px-3 py-3.5 border-b border-slate-700/60 flex items-center justify-between bg-[#0b1329]/80 backdrop-blur-sm gap-2">
        {/* Marcador lateral ciano/turquesa estilizado */}
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
          {/* Logo container estilo botão arredondado com a logo Magalog */}
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-600/30 flex items-center justify-center shrink-0 border border-blue-400/30 bg-slate-900">
            <img 
              src="/magalog-logo.png" 
              alt="Magalog CD 994" 
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-black text-white uppercase leading-tight whitespace-nowrap">
                CD 994 <span className="text-slate-400 font-light mx-0.5">|</span> GESTÃO LOGÍSTICA
              </h1>
              <p className="text-[9px] font-bold text-blue-400 tracking-[0.16em] uppercase mt-0.5 whitespace-nowrap">
                PAINEL OPERACIONAL
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menu lateral (Ctrl+B)' : 'Recolher menu lateral (Ctrl+B)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
        >
          <ChevronRight size={18} className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-all">
            Menu Principal
          </div>
        )}
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <span className={`transition-colors shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 shrink-0 ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Perfil Conectado & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                {/* Indicador de presença verde no próprio avatar */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {user?.name || 'Usuário'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    (user?.role || '').toLowerCase().includes('admin')
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30' 
                      : (user?.role || '').toLowerCase().includes('gerente')
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {user?.cargo || user?.role || 'Colaborador'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Botão Ver Quem Está Online */}
              <button
                onClick={() => setIsOnlineModalOpen(true)}
                title="Ver usuários online e horários de login"
                className="relative p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer group flex items-center gap-1"
              >
                <Radio size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                  {Math.max(onlineUsers.length, 1)}
                </span>
              </button>

              <button
                onClick={() => logout()}
                title="Encerrar Sessão (Sair)"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              title={`Ver usuários online (${Math.max(onlineUsers.length, 1)})`}
              className="relative p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Radio size={16} className="text-emerald-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>

            <button
              onClick={() => logout()}
              title="Encerrar Sessão (Sair)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Usuários Online */}
      <OnlineUsersModal 
        isOpen={isOnlineModalOpen} 
        onClose={() => setIsOnlineModalOpen(false)} 
      />
    </aside>
  )
}
