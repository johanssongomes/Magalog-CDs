import React, { useState } from 'react'
import { 
  Layers, 
  Activity, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  Filter, 
  Search, 
  RefreshCw,
  FolderKanban,
  Truck,
  AlertCircle
} from 'lucide-react'

import { useAuth } from '../lib/authContext'

interface OperationalPageItem {
  id: number
  label: string
  title: string
  description: string
  badge: string
  icon: React.ReactNode
}

const PAGES_CONFIG: OperationalPageItem[] = [
  {
    id: 1,
    label: 'Página 1',
    title: 'Visão Geral & Fluxo Operacional',
    description: 'Monitoramento em tempo real dos processos centrais, recebimento e triagem da Central Operacional.',
    badge: 'Módulo 01',
    icon: <Activity size={18} />
  },
  {
    id: 2,
    label: 'Página 2',
    title: 'Gestão de Docas & Expedição',
    description: 'Acompanhamento de janelas de carregamento, ocupação de docas e saída de cargas.',
    badge: 'Módulo 02',
    icon: <Truck size={18} />
  },
  {
    id: 3,
    label: 'Página 3',
    title: 'Métricas & Indicadores de Turno',
    description: 'Produtividade por equipe, metas horárias e comparativos operacionais do CD.',
    badge: 'Módulo 03',
    icon: <BarChart3 size={18} />
  },
  {
    id: 4,
    label: 'Página 4',
    title: 'Auditoria & Não Conformidades',
    description: 'Registro de ocorrências em pista, conferência de lotes e tratativas de exceções.',
    badge: 'Módulo 04',
    icon: <ShieldCheck size={18} />
  },
  {
    id: 5,
    label: 'Página 5',
    title: 'Parâmetros & Configurações da Central',
    description: 'Regras de alocação de pedidos, cadastros auxiliares e integrações de sistema.',
    badge: 'Módulo 05',
    icon: <Sliders size={18} />
  }
]

export const CentralOperacionalPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const visiblePages = PAGES_CONFIG.filter(page => hasPermission('settings', `sub-settings-p${page.id}`))
  const [activePageId, setActivePageId] = useState<number>(() => visiblePages[0]?.id || 1)
  
  const currentActiveId = visiblePages.some(p => p.id === activePageId)
    ? activePageId
    : visiblePages[0]?.id || 1
  const activePage = visiblePages.find(p => p.id === currentActiveId) || PAGES_CONFIG[0]

  return (
    <div className="space-y-5 w-full">
      {/* =========================================================================
          BARRA DE MENUS DE PÁGINAS (Região indicada pelo usuário)
          Página 1 | Página 2 | Página 3 | Página 4 | Página 5
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {visiblePages.map((page) => {
            const isActive = currentActiveId === page.id
            return (
              <button
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
                    : 'bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90 hover:border-blue-200'
                }`}
              >
                <span className={`p-1 rounded-lg ${isActive ? 'bg-blue-500/40 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                  {page.icon}
                </span>
                <div className="flex flex-col text-left">
                  <span className="leading-tight text-xs uppercase tracking-wider opacity-75 font-mono">
                    {page.badge}
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    {page.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo dinâmico da página selecionada */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Cabeçalho da Sub-Página Ativa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5">
              {activePage.icon}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {activePage.label}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Módulo Ativo
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {activePage.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {activePage.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button 
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
            <button 
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <Plus size={14} />
              Nova Ação ({activePage.label})
            </button>
          </div>
        </div>

        {/* Cards e Área de Conteúdo da Página */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Status do Módulo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800">Operando</div>
            <p className="text-[11px] text-slate-500 mt-1">Central Operacional CD 994</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Sub-menu Selecionado</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 font-mono">{activePage.badge}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{activePage.label}</div>
            <p className="text-[11px] text-slate-500 mt-1">Navegação ativa na barra superior</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Pronto para Customização</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800">100% Livre</div>
            <p className="text-[11px] text-slate-500 mt-1">Pronto para inclusão de tabelas, gráficos ou formulários</p>
          </div>
        </div>

        {/* Espaço de Trabalho / Placeholder com design limpo */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/30">
          <div className="p-3.5 rounded-full bg-blue-50 text-blue-600 mb-3 border border-blue-100">
            {activePage.icon}
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Área de Trabalho da {activePage.label}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            Você está navegando na <strong className="text-slate-700">{activePage.label}</strong> da Central Operacional. 
            Este espaço pode ser abastecido com tabelas operacionais, controles de estoque, listas de carregamento ou integrações.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-mono shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            central-operacional/{activePage.label.toLowerCase().replace(' ', '-')}
          </div>
        </div>
      </div>
    </div>
  )
}
