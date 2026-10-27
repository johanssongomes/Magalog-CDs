import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, 
  ArrowRight, 
  Zap, 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  DollarSign, 
  Clock, 
  Settings, 
  Globe, 
  Users, 
  Truck, 
  ArrowDownToLine, 
  Target, 
  Tag, 
  BarChart2, 
  Layers, 
  X, 
  Command, 
  CornerDownLeft,
  ChevronRight,
  CalendarDays,
  Calendar,
  User
} from 'lucide-react'

export interface NavigationTarget {
  id: string
  title: string
  subtitle: string
  category: string
  tabId: string
  pmtPageId?: number
  quadroSubPage?: 'dashboard' | 'pg1' | 'pg2' | 'pg3' | 'pg4' | 'pg5'
  icon: React.ReactNode
  keywords: string[]
}

const ALL_NAVIGATION_TARGETS: NavigationTarget[] = [
  // Módulos Principais (Sidebar)
  {
    id: 'nav-dashboard',
    title: 'Dashboard Geral',
    subtitle: 'Painel principal consolidado com status operacional dos CDs',
    category: 'Módulos Principais',
    tabId: 'dashboard',
    icon: <LayoutDashboard size={18} className="text-blue-500" />,
    keywords: ['dashboard', 'painel', 'inicio', 'home', 'resumo', 'indicadores', 'geral']
  },
  {
    id: 'nav-performance',
    title: 'Performance',
    subtitle: 'Monitoramento de Desempenho e Indicadores Diários',
    category: 'Módulos Principais',
    tabId: 'performance',
    icon: <Zap size={18} className="text-amber-500" />,
    keywords: ['performance', 'desempenho', 'produtividade', 'metas', 'diario']
  },
  {
    id: 'nav-catalog',
    title: 'Equipamentos',
    subtitle: 'Gestão, controle e manutenção de equipamentos dos CDs',
    category: 'Módulos Principais',
    tabId: 'catalog',
    icon: <FolderKanban size={18} className="text-emerald-500" />,
    keywords: ['equipamentos', 'paleteiras', 'maquinas', 'bens', 'manutencao']
  },
  {
    id: 'nav-pmts',
    title: 'Gestão 360° (PMTs)',
    subtitle: 'Acompanhamento integrado de transportes, quadro e indicadores',
    category: 'Módulos Principais',
    tabId: 'pmts',
    icon: <BarChart3 size={18} className="text-indigo-500" />,
    keywords: ['gestao 360', 'pmt', 'pmts', 'transporte', 'metas', 'operacao']
  },
  {
    id: 'nav-agenda',
    title: 'Agenda & Reuniões',
    subtitle: 'Gestão de reuniões, atas (ATAs), eventos e planos de ação',
    category: 'Módulos Principais',
    tabId: 'agenda',
    icon: <CalendarDays size={18} className="text-blue-600" />,
    keywords: ['agenda', 'agenda e reunioes', 'reunioes', 'atas', 'ata', 'eventos', 'planos de acao', 'pendencias', 'calendario']
  },
  {
    id: 'nav-budget',
    title: 'Gestão Orçamentária',
    subtitle: 'Controle de custos, previsto x realizado e verbas',
    category: 'Módulos Principais',
    tabId: 'budget',
    icon: <DollarSign size={18} className="text-green-500" />,
    keywords: ['orcamento', 'budget', 'custos', 'gastos', 'financeiro', 'verba']
  },
  {
    id: 'nav-inventory',
    title: 'Banco de Horas',
    subtitle: 'Gestão de saldo, horas extras e apontamentos da equipe',
    category: 'Módulos Principais',
    tabId: 'inventory',
    icon: <Clock size={18} className="text-purple-500" />,
    keywords: ['banco de horas', 'bh', 'horas', 'ponto', 'folha', 'saldo']
  },
  {
    id: 'nav-settings',
    title: 'Central Operacional',
    subtitle: 'Parâmetros, canais de comunicação e rotinas do CD',
    category: 'Módulos Principais',
    tabId: 'settings',
    icon: <Settings size={18} className="text-slate-500" />,
    keywords: ['central operacional', 'configuracoes', 'operacional', 'suporte']
  },
  {
    id: 'nav-links',
    title: 'Links Úteis',
    subtitle: 'Atalhos e sistemas corporativos Magalu / Logística',
    category: 'Módulos Principais',
    tabId: 'links',
    icon: <Globe size={18} className="text-sky-500" />,
    keywords: ['links', 'sites', 'sistemas', 'atalhos', 'ferramentas']
  },
  {
    id: 'nav-users',
    title: 'Usuários & Permissões',
    subtitle: 'Controle de acessos, níveis e auditoria de usuários',
    category: 'Módulos Principais',
    tabId: 'users',
    icon: <Users size={18} className="text-rose-500" />,
    keywords: ['usuarios', 'permissoes', 'acesso', 'contas', 'seguranca']
  },
  {
    id: 'nav-profile',
    title: 'Meu Perfil & Ficha Cadastral',
    subtitle: 'Acessar página de perfil geral, foto, biografia e tempo de casa',
    category: 'Módulos Principais',
    tabId: 'profile',
    icon: <User size={18} className="text-blue-500" />,
    keywords: ['perfil', 'minha conta', 'foto', 'bio', 'tempo de casa', 'senha', 'cracha', 'meu perfil']
  },

  // Sub-Páginas da Gestão 360° (PMT)
  {
    id: 'sub-pmt-expedicao',
    title: 'PMT Expedição',
    subtitle: 'Metas de transporte para expedição, janelas de carregamento e volumetria',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 1,
    icon: <Truck size={18} className="text-blue-600" />,
    keywords: ['pmt expedicao', 'expedicao', 'carregamento', 'saidas', 'carretas', 'viagens']
  },
  {
    id: 'sub-pmt-recebimento',
    title: 'PMT Recebimento',
    subtitle: 'Metas de descarregamento, recebimento e volumetria de entrada',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 2,
    icon: <ArrowDownToLine size={18} className="text-cyan-600" />,
    keywords: ['pmt recebimento', 'recebimento', 'descarregamento', 'entrada', 'docas']
  },
  {
    id: 'sub-pmt-quadro',
    title: 'Quadro de Colaboradores',
    subtitle: 'Dashboard de headcount, lotação por cargo e centros de custo',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 3,
    icon: <Target size={18} className="text-purple-600" />,
    keywords: ['quadro', 'colaboradores', 'efetivo', 'headcount', 'rh', 'pessoas', 'equipe', 'turnover']
  },
  {
    id: 'sub-pmt-promocionais',
    title: 'Itens Promocionais • NE/NO/CO',
    subtitle: 'Acompanhamento de SKUs promocionais, campanhas e validades (Google Sheets)',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 4,
    icon: <Tag size={18} className="text-amber-600" />,
    keywords: ['promocionais', 'skus', 'campanhas', 'planilha', 'itens', 'promocoes']
  },
  {
    id: 'sub-pmt-tableau',
    title: 'Tableau Indicadores',
    subtitle: 'Nível de Serviço 1P, SLA e painéis oficiais do BI Luizalabs',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 5,
    icon: <BarChart2 size={18} className="text-blue-700" />,
    keywords: ['tableau', 'bi luizalabs', 'indicadores', 'sla', 'nivel de servico', 'bi']
  },
  {
    id: 'sub-pmt-carteira-cds',
    title: 'Carteira CDs • Looker Studio',
    subtitle: 'Painel interativo de modais Rodo, Courier, prazos e transferências',
    category: 'Gestão 360° • Sub-páginas',
    tabId: 'pmts',
    pmtPageId: 6,
    icon: <Layers size={18} className="text-indigo-600" />,
    keywords: ['carteira cds', 'looker studio', 'data studio', 'rodo', 'courier', 'transferencias', 'filiais', 'carteira']
  },

  // Sub-abas específicas do Quadro
  {
    id: 'sub-quadro-dashboard',
    title: 'Quadro • Dashboard Geral',
    subtitle: 'Métricas de Headcount, Lotação por Cargo e Centros de Custo',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'dashboard',
    icon: <Target size={18} className="text-purple-600" />,
    keywords: ['quadro dashboard', 'headcount', 'efetivo', 'cargos', 'centros de custo']
  },
  {
    id: 'sub-quadro-tt',
    title: 'Quadro TT (Base Completa & Cadastro)',
    subtitle: 'Lista individual de colaboradores, filtros avançados e importação em massa',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'pg1',
    icon: <Users size={18} className="text-pink-600" />,
    keywords: ['quadro tt', 'base completa', 'cadastro', 'importar colaboradores', 'efetivo tt', 'colaboradores']
  },
  {
    id: 'sub-quadro-bh',
    title: 'Banco de Horas (No Quadro)',
    subtitle: 'Apontamentos e horas extras da equipe do Quadro',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'pg2',
    icon: <Clock size={18} className="text-indigo-600" />,
    keywords: ['banco de horas quadro', 'bh quadro', 'horas quadro']
  },
  {
    id: 'sub-quadro-padu',
    title: 'Controle PADU (Recrutamento & Seleção)',
    subtitle: 'Painel integrado ao vivo do Controle PADU Netlify',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'pg3',
    icon: <LayoutDashboard size={18} className="text-emerald-600" />,
    keywords: ['padu', 'controle padu', 'recrutamento', 'selecao', 'vagas']
  },
  {
    id: 'sub-quadro-medio',
    title: 'Quadro Médio (Grade & Dimensionamento)',
    subtitle: 'Cálculo de turno, lotação média mensal e dimensionamento operacional',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'pg4',
    icon: <BarChart3 size={18} className="text-amber-600" />,
    keywords: ['quadro medio', 'grade', 'dimensionamento', 'media turno']
  },
  {
    id: 'sub-apontamento',
    title: 'Apontamento Diário (Presenças, DSR, BH)',
    subtitle: 'Matriz mensal de presenças, folgas, faltas ATM, férias, DSRs e banco de horas',
    category: 'Quadro • Sub-abas',
    tabId: 'pmts',
    pmtPageId: 3,
    quadroSubPage: 'pg5',
    icon: <Calendar size={18} className="text-blue-600" />,
    keywords: ['apontamento', 'presenca', 'folga', 'falta', 'ferias', 'dsr', 'banco de horas']
  }
]

interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tabId: string, pmtPageId?: number, quadroSubPage?: 'dashboard' | 'pg1' | 'pg2' | 'pg3' | 'pg4' | 'pg5') => void
  hasPermission: (tabId: string, subpageId?: string) => boolean
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  hasPermission
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtra de acordo com o que o usuário tem permissão (página e subpágina)
  const permittedTargets = useMemo(() => {
    return ALL_NAVIGATION_TARGETS.filter(target => {
      // Se for subpágina (prefixo sub-), valida a subpágina
      if (target.id.startsWith('sub-')) {
        return hasPermission(target.tabId, target.id)
      }
      return hasPermission(target.tabId)
    })
  }, [hasPermission])

  // Busca fuzzy / por palavras-chave
  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return permittedTargets

    return permittedTargets.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchSubtitle = item.subtitle.toLowerCase().includes(q)
      const matchCategory = item.category.toLowerCase().includes(q)
      const matchKeyword = item.keywords.some(k => k.includes(q))
      return matchTitle || matchSubtitle || matchCategory || matchKeyword
    })
  }, [permittedTargets, query])

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Reseta selectedIndex ao digitar
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Navegação por teclado (Cima, Baixo, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (filteredTargets.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredTargets.length) % (filteredTargets.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredTargets[selectedIndex]) {
          const target = filteredTargets[selectedIndex]
          onNavigate(target.tabId, target.pmtPageId, target.quadroSubPage)
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredTargets, selectedIndex, onNavigate, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop com blur escuro */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Caixa do Command Palette */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[80vh]">
        {/* Campo de Busca Superior */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite para buscar qualquer página ou painel... (Ex: Carteira, Performance, PMT)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Lista de Resultados */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
          {filteredTargets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search size={18} />
              </div>
              <p className="text-xs font-bold text-slate-700">Nenhuma página encontrada para "{query}"</p>
              <p className="text-[11px] text-slate-400">Tente buscar por termos como PMT, Quadro, Carteira, Performance ou Horas.</p>
            </div>
          ) : (
            filteredTargets.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.tabId, item.pmtPageId, item.quadroSubPage)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/90 text-blue-900 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                      isSelected ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950 font-extrabold' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 font-bold bg-blue-100/70 px-2 py-0.5 rounded-md">
                        Pressione Enter <CornerDownLeft size={10} />
                      </span>
                    )}
                    <ChevronRight size={14} className={isSelected ? 'text-blue-600 translate-x-0.5 transition-transform' : 'text-slate-300'} />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Rodapé com Dicas de Atalhos */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[10px]">↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[10px]">Enter</kbd>
              Abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[10px]">Ctrl+B</kbd>
              Minimizar Barra
            </span>
          </div>

          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[10px]">Ctrl+L</kbd> Busca Rápida
          </span>
        </div>
      </div>
    </div>
  )
}
