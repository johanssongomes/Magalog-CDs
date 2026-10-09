import React, { useState } from 'react'
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
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

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
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Página em branco 1 - Painel Principal',
    icon: <LayoutDashboard size={20} />
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    description: 'Página em branco 2 - Gestão de Catálogo de CDs',
    icon: <FolderKanban size={20} />
  },
  {
    id: 'inventory',
    label: 'Estoque',
    description: 'Página em branco 3 - Controle de Estoque e Produtos',
    icon: <Package size={20} />
  },
  {
    id: 'reports',
    label: 'Relatórios',
    description: 'Página em branco 4 - Análise e Estatísticas',
    icon: <BarChart3 size={20} />
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Monitoramento de Desempenho e Indicadores Diários do CD',
    icon: <Zap size={20} />
  },
  {
    id: 'settings',
    label: 'Configurações',
    description: 'Página em branco 5 - Configurações do Sistema',
    icon: <Settings size={20} />
  }
]

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 z-40`}>
      {/* Header / Brand */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 shrink-0">
            <Layers size={20} />
          </div>
          {!isCollapsed && (
            <div className="truncate transition-opacity duration-200">
              <h1 className="text-sm font-bold text-white leading-tight truncate">Magalog CDs</h1>
              <p className="text-[10px] text-blue-400 font-medium truncate">Painel Administrativo</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider transition-all">
            Menu Principal
          </div>
        )}
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
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

      {/* Tech Stack Info Footer */}
      {!isCollapsed ? (
        <div className="p-3 m-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs animate-fade-in">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1.5">
            <Zap size={14} className="text-amber-400" />
            <span>Tech Stack</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1"><Globe size={10} className="text-blue-400"/> React/Vite</span>
            <span className="flex items-center gap-1"><Zap size={10} className="text-sky-400"/> Tailwind</span>
            <span className="flex items-center gap-1"><Server size={10} className="text-emerald-400"/> Express</span>
            <span className="flex items-center gap-1"><Database size={10} className="text-indigo-400"/> Prisma</span>
          </div>
        </div>
      ) : (
        <div className="p-3 mb-2 flex justify-center text-slate-500">
          <Zap size={16} className="text-amber-400" />
        </div>
      )}
    </aside>
  )
}
