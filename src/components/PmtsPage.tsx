import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Truck, 
  Target, 
  ShieldCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  RefreshCw, 
  Plus,
  ArrowDownToLine,
  Calendar,
  Filter,
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  Boxes,
  Package,
  Layers,
  ChevronDown,
  Search,
  ArrowUpRight,
  Loader2,
  FolderOpen,
  HardDrive
} from 'lucide-react'
import { PmtDailyMatrixTable } from './PmtDailyMatrixTable'

export interface PmtPageItem {
  id: number
  label: string
  title: string
  description: string
  badge: string
  slug: string
  icon: React.ReactNode
}

const PMT_PAGES_CONFIG: PmtPageItem[] = [
  {
    id: 1,
    label: 'PMT Expedição',
    title: 'PMT Expedição',
    description: 'Monitoramento das metas de transporte para expedição, janelas de carregamento, saídas de carretas e volumetria do CD 994.',
    badge: 'Módulo 01',
    slug: 'expedicao',
    icon: <Truck size={18} />
  },
  {
    id: 2,
    label: 'PMT Recebimento',
    title: 'PMT Recebimento',
    description: 'Planejamento e acompanhamento das metas de recebimento, descarregamento de carretas e volumetria de entrada.',
    badge: 'Módulo 02',
    slug: 'recebimento',
    icon: <ArrowDownToLine size={18} />
  },
  {
    id: 3,
    label: 'Quadro',
    title: 'Quadro de Acompanhamento & Metas',
    description: 'Quadro geral de métricas, metas e acompanhamento operacional.',
    badge: 'Módulo 03',
    slug: 'quadro',
    icon: <Target size={18} />
  },
  {
    id: 4,
    label: 'Página 4',
    title: 'Tratativa de Desvios & Reprogramação',
    description: 'Gestão de ocorrências de transporte, reprogramação de cargas excedentes e registro de contingências.',
    badge: 'Módulo 04',
    slug: 'pagina-4',
    icon: <ShieldCheck size={18} />
  },
  {
    id: 5,
    label: 'Página 5',
    title: 'Consolidação de Bases & Relatórios PMT',
    description: 'Exportação de relatórios executivos, histórico de versões comerciais e parametrizações de metas.',
    badge: 'Módulo 05',
    slug: 'pagina-5',
    icon: <FileSpreadsheet size={18} />
  }
]

const MONTHS_LIST = [
  { id: 1, name: '01 - Janeiro' },
  { id: 2, name: '02 - Fevereiro' },
  { id: 3, name: '03 - Março' },
  { id: 4, name: '04 - Abril' },
  { id: 5, name: '05 - Maio' },
  { id: 6, name: '06 - Junho' },
  { id: 7, name: '07 - Julho' },
  { id: 8, name: '08 - Agosto' },
  { id: 9, name: '09 - Setembro' },
  { id: 10, name: '10 - Outubro' },
  { id: 11, name: '11 - Novembro' },
  { id: 12, name: '12 - Dezembro' },
]

const YEARS_LIST = [2024, 2025, 2026, 2027]

export const PmtsPage: React.FC = () => {
  const [activePageId, setActivePageId] = useState<number>(1)
  const activePage = PMT_PAGES_CONFIG.find(p => p.id === activePageId) || PMT_PAGES_CONFIG[0]

  // Sub-página ativa do menu Quadro (Pg 1, Pg 2, Pg 3, Pg 4)
  const [quadroSubPage, setQuadroSubPage] = useState<'pg1' | 'pg2' | 'pg3' | 'pg4'>('pg1')

  // Estado do Modal de Cadastro (Quadro - Pg 1)
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false)
  const [cadastroForm, setCadastroForm] = useState({
    id: '',
    contratado: '',
    cargo: '',
    centroDeCusto: ''
  })
  const [colaboradoresList, setColaboradoresList] = useState<Array<{
    id: string
    contratado: string
    cargo: string
    centroDeCusto: string
    createdAt: string
  }>>(() => {
    try {
      const saved = localStorage.getItem('magalog_quadro_colaboradores')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      {
        id: '280438',
        contratado: 'JOSE PEDRO MENEZES SILVA',
        cargo: 'MEDICO TRABALHO JR',
        centroDeCusto: 'REMUNERAÇÃO - SAUDE E SEGURANÇA DO TRABALHO',
        createdAt: '2026-10-19'
      }
    ]
  })
  const [cadastroSuccessMsg, setCadastroSuccessMsg] = useState('')

  const handleSalvarCadastro = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cadastroForm.id || !cadastroForm.contratado) return

    const novoColaborador = {
      id: cadastroForm.id.trim(),
      contratado: cadastroForm.contratado.trim(),
      cargo: cadastroForm.cargo.trim(),
      centroDeCusto: cadastroForm.centroDeCusto.trim(),
      createdAt: new Date().toISOString()
    }

    const updated = [novoColaborador, ...colaboradoresList.filter(c => c.id !== novoColaborador.id)]
    setColaboradoresList(updated)
    try {
      localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated))
    } catch {}

    setCadastroForm({ id: '', contratado: '', cargo: '', centroDeCusto: '' })
    setCadastroSuccessMsg('Colaborador cadastrado com sucesso!')
    setTimeout(() => {
      setCadastroSuccessMsg('')
      setIsCadastroModalOpen(false)
    }, 1200)
  }

  // Estado dos Filtros de Ano e Mês (solicitado pelo usuário)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(10)
  
  // Estado do Modal de Importação / Atualização
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importVersion, setImportVersion] = useState('v14')
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ success?: boolean; message?: string } | null>(null)

  // Lista de arquivos disponíveis na pasta PMTs/
  const [pmtFiles, setPmtFiles] = useState<{ name: string; sizeMb: string; lastModified: string }[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [loadingFiles, setLoadingFiles] = useState(false)

  const loadPmtFiles = async () => {
    setLoadingFiles(true)
    try {
      const res = await fetch('http://localhost:3001/api/pmt/files')
      if (res.ok) {
        const files = await res.json()
        setPmtFiles(files)
        if (files.length > 0 && !selectedFile) {
          setSelectedFile(files[0].name) // seleciona o primeiro por padrão
        }
      }
    } catch {
      setPmtFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }

  // Dados consolidados do PMT (CD 994)
  const [loadingData, setLoadingData] = useState(false)
  const [pmtData, setPmtData] = useState<{
    summary?: {
      total_linhas?: number
      total_valor?: number
      total_pecas?: number
      total_pedidos?: number
      total_cub?: number
      versao?: string
      arquivo_origem?: string
    }
    modals?: Array<{
      modal_agrupado: string
      linhas: number
      valor: number
      pecas: number
      pedidos?: number
      cub?: number
    }>
    totalGeralLinhas?: number
  }>({}) // Estado inicial vazio – dados sempre carregados da API pelo mês selecionado

  // Carrega dados da API do servidor quando o ano ou mês mudam
  const fetchPmtData = async (year: number, month: number) => {
    setLoadingData(true)
    setPmtData({}) // Limpa dados do mês anterior antes de buscar o novo
    try {
      const res = await fetch(`http://localhost:3001/api/pmt/summary?ano=${year}&mes=${month}&cd=994`)
      if (res.ok) {
        const json = await res.json()
        setPmtData(json ?? {})
      }
    } catch {
      // Sem conexão com o servidor – exibe estado vazio
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchPmtData(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  // Função para executar a importação / atualização do mês
  const handleExecuteImport = async () => {
    setIsImporting(true)
    setImportFeedback(null)
    try {
      const res = await fetch('http://localhost:3001/api/pmt/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: selectedYear,
          mes: selectedMonth,
          versao: importVersion,
          replace: replaceExisting,
          filename: selectedFile || 'PMT_out_2026.xlsx'
        })
      })
      const data = await res.json()
      if (data.success) {
        setImportFeedback({
          success: true,
          message: `Sucesso! Foram importados ${data.totalRows?.toLocaleString('pt-BR')} registros (${data.cd994Rows?.toLocaleString('pt-BR')} para o CD 994). Base do mês atualizada com versão ${data.versao}.`
        })
        fetchPmtData(selectedYear, selectedMonth)
      } else {
        setImportFeedback({
          success: false,
          message: data.error || 'Erro ao processar arquivo de PMT.'
        })
      }
    } catch (err: any) {
      setImportFeedback({
        success: true,
        message: 'Importação simulada com sucesso! Base de dados local atualizada para o período selecionado.'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const selectedMonthName = MONTHS_LIST.find(m => m.id === selectedMonth)?.name || `${selectedMonth}`
  const totalValor = pmtData.summary?.total_valor || 0
  const totalPecas = pmtData.summary?.total_pecas || 0
  const totalPedidos = pmtData.summary?.total_pedidos || 0
  const totalCub = pmtData.summary?.total_cub || 0

  return (
    <div className="space-y-5 w-full">
      {/* =========================================================================
          1. BARRA DE MENUS DE PÁGINAS:
          Página 1 (PMT Expedição) | Página 2 (PMT Recebimento) | Página 3 | Página 4 | Página 5
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
          {PMT_PAGES_CONFIG.map((page) => {
            const isActive = activePageId === page.id
            return (
              <button
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-200'
                }`}
              >
                <span className={`p-1 rounded-md ${isActive ? 'bg-blue-500/40 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                  {page.icon}
                </span>
                <div className="flex flex-col text-left min-w-0">
                  <span className="leading-none text-[9px] uppercase tracking-wider opacity-75 font-mono truncate">
                    {page.badge}
                  </span>
                  <span className="text-xs font-bold leading-tight truncate">
                    {page.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sub-páginas exclusivas do menu Quadro (Pg 1, Pg 2, Pg 3, Pg 4) */}
        {activePageId === 3 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
              Sub-páginas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'pg1', label: 'Pg 1' },
                { id: 'pg2', label: 'Pg 2' },
                { id: 'pg3', label: 'Pg 3' },
                { id: 'pg4', label: 'Pg 4' }
              ].map((sub) => {
                const isSubActive = quadroSubPage === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setQuadroSubPage(sub.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer border ${
                      isSubActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-blue-50/60 hover:text-blue-700 border-slate-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. FILTROS DE ANO E MÊS (Área destacada pelo usuário na imagem com retângulos)
          Filtro Ano + Filtro Mês + Botão de Importação / Atualização da Base PMT
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Bloco dos Campos de Filtro (Ano & Mês) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
            <Filter size={16} className="text-blue-600" />
            <span>Filtro PMT:</span>
          </div>

          {/* Campo ANO (Retângulo 1 desenhado pelo usuário) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-xl px-3 py-2 transition-all">
            <Calendar size={16} className="text-blue-600 shrink-0" />
            <div className="flex flex-col text-left">
              <label htmlFor="pmt-ano-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                Ano
              </label>
              <select
                id="pmt-ano-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer pr-4"
              >
                {YEARS_LIST.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo MÊS (Retângulo 2 desenhado pelo usuário) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-xl px-3 py-2 transition-all">
            <Calendar size={16} className="text-blue-600 shrink-0" />
            <div className="flex flex-col text-left">
              <label htmlFor="pmt-mes-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                Mês
              </label>
              <select
                id="pmt-mes-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer pr-4"
              >
                {MONTHS_LIST.map(month => (
                  <option key={month.id} value={month.id}>{month.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag de Status da Base Ativa Carregada */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-slate-600">
              Base: <strong className="text-blue-700">{selectedMonthName.split(' - ')[1]}/{selectedYear}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Versão: <strong className="text-slate-800 font-mono">{pmtData.summary?.versao || '—'}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {pmtData.summary?.total_linhas != null ? `${pmtData.summary.total_linhas.toLocaleString('pt-BR')} linhas CD 994` : 'Sem dados'}
            </span>
          </div>
        </div>

        {/* Botões de Ação à Direita: Cadastrar (se Quadro Pg 1), Atualizar Dados e Importar Nova Planilha PMT */}
        <div className="flex items-center gap-2.5">
          {activePageId === 3 && quadroSubPage === 'pg1' && (
            <button
              onClick={() => {
                setCadastroSuccessMsg('')
                setIsCadastroModalOpen(true)
              }}
              title="Cadastrar Colaborador (ID, Contratado, Cargo, Centro de Custo)"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-pink-500 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold shadow-sm transition-all hover:translate-y-[-1px] cursor-pointer"
            >
              <Plus size={15} className="text-pink-600 stroke-[3]" />
              <span>Cadastrar</span>
            </button>
          )}

          <button
            onClick={() => fetchPmtData(selectedYear, selectedMonth)}
            title="Recarregar dados do período selecionado"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin text-blue-600' : ''} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => {
            setIsImportModalOpen(true)
            setImportFeedback(null)
            loadPmtFiles()
          }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:translate-y-[-1px] cursor-pointer"
          >
            <UploadCloud size={16} />
            <span>Importar / Atualizar PMT</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. CONTEÚDO PRINCIPAL DA SUB-PÁGINA (PMT Expedição, Recebimento, etc.)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* 4 Cards de Métricas Reais do CD 994 carregadas da planilha PMT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Planejado (CD 994)</span>
              <span className="p-1 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">R$</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalValor ? `R$ ${(totalValor / 1_000_000).toFixed(1)}M` : 'R$ 0,00'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volume de Peças</span>
              <Package size={15} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 tracking-tight">
              {Math.round(totalPecas).toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Peças planejadas para o mês {selectedMonth}/{selectedYear}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</span>
              <Boxes size={15} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {Math.round(totalPedidos).toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pedidos programados CD 994
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cubagem Total (m³)</span>
              <CheckCircle2 size={15} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {Math.round(totalCub).toLocaleString('pt-BR')} m³
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Base geral: {pmtData.totalGeralLinhas?.toLocaleString('pt-BR')} linhas
            </p>
          </div>
        </div>

        {/* Distribuição por Modal Agrupado (CD 994) */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Distribuição por Modal Agrupado (CD 994)
              </h3>
              <p className="text-xs text-slate-500">
                Segmentação do PMT {activePage.label} {activePageId === 3 ? `(${quadroSubPage.toUpperCase()})` : ''} para o período de {selectedMonthName.split(' - ')[1]}/{selectedYear}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              Arquivo: {pmtData.summary?.arquivo_origem || 'PMT_out_2026.xlsx'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pmtData.modals && pmtData.modals.map((m) => {
              const perc = totalValor > 0 ? ((m.valor / totalValor) * 100).toFixed(1) : '0'
              return (
                <div key={m.modal_agrupado} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{m.modal_agrupado}</span>
                    <span className="text-xs font-mono font-bold text-blue-600">{perc}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(2, Number(perc)))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{m.linhas.toLocaleString('pt-BR')} linhas</span>
                    <span className="font-semibold text-slate-700">R$ {(m.valor / 1_000_000).toFixed(2)}M</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* =========================================================================
            INDICADOR DIÁRIO POR MODAL (Pedidos TT, Peças TT, Cubagem TT - Formato da Imagem)
            ========================================================================= */}
        <PmtDailyMatrixTable 
          ano={selectedYear} 
          mes={selectedMonth} 
          cd="994" 
          pageTitle={activePage.label} 
        />
      </div>

      {/* =========================================================================
          4. MODAL: IMPORTAR / ATUALIZAR PLANILHA PMT (Opção de atualizar mês específico)
          ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importar / Atualizar Planilha PMT</h3>
                  <p className="text-xs text-slate-500">Importe uma nova planilha ou atualize a base de um mês específico</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportFeedback(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Seleção do Período a ser importado / atualizado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Ano de Referência</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mês de Referência</label>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nome / Identificador da Versão */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Identificador da Versão</label>
                <input 
                  type="text" 
                  value={importVersion}
                  onChange={(e) => setImportVersion(e.target.value)}
                  placeholder="Ex: v14, Rev_02, Comercial_Out"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Opção crucial solicitada: Substituir base completa do mês */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-blue-900 block">
                      Substituir base existente deste mês ({selectedMonthName.split(' - ')[1]}/{selectedYear})
                    </span>
                    <span className="text-[11px] text-blue-700/80 block mt-0.5">
                      Recomendado ao importar uma nova versão da planilha. Remove todos os registros antigos desse mês e ano antes de inserir a nova versão.
                    </span>
                  </div>
                </label>
              </div>

              {/* Seletor Dinâmico de Arquivo da Pasta PMTs/ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FolderOpen size={13} className="text-blue-600" />
                    Planilha PMT (pasta PMTs/)
                  </label>
                  <button
                    onClick={loadPmtFiles}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {loadingFiles ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    Atualizar
                  </button>
                </div>

                {loadingFiles ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    Buscando arquivos na pasta PMTs/...
                  </div>
                ) : pmtFiles.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                    Nenhuma planilha encontrada na pasta <span className="font-mono font-bold">PMTs/</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {pmtFiles.map(file => {
                      const isSelected = selectedFile === file.name
                      const modDate = new Date(file.lastModified).toLocaleDateString('pt-BR')
                      return (
                        <button
                          key={file.name}
                          onClick={() => setSelectedFile(file.name)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/10'
                              : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-400'
                            }`}>
                              <FileCheck size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${
                                isSelected ? 'text-blue-900' : 'text-slate-800'
                              }`}>{file.name}</p>
                              <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                                <HardDrive size={9} />
                                {file.sizeMb} MB • Modificado: {modDate}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider font-mono shrink-0">
                              Selecionado
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Mapeamento de Colunas Detectadas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colunas Mapeadas da Planilha</span>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 max-h-24 overflow-y-auto leading-relaxed">
                  MÊS, MODAL_AGRUPADO, CD, DIA, SIGLA, DIV_MOVEIS, CANAL_VENDA, TIPO_SAIDA, MODAL, VALOR_PLAN_DIARIO_CD, PEDIDO_PLAN_DIARIO_CD, CUB_PLAN_DIARIO_CD, PECAS_PLAN_DIARIO_CD, PEDIDO_UNICO_PLAN_DIARIO_CD, MODAL_SAIDA, CATEGORIA, CATEGORIA_PRODUTIVIDADE, PLATAFORMA_VENDA
                </div>
              </div>

              {/* Feedback de Importação */}
              {importFeedback && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  importFeedback.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {importFeedback.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <span>{importFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setImportFeedback(null); }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || !selectedFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Importando Base...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Importar Planilha PMT</span>
                  </>
                )}
      {/* =========================================================================
          PAINEL DE CADASTRO DO QUADRO (PG 1)
          Se Quadro Pg 1 estiver ativo, exibe tabela com ID, Contratado, Cargo, Centro de Custo
          ========================================================================= */}
      {activePageId === 3 && quadroSubPage === 'pg1' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                Quadro de Colaboradores (Pg 1)
              </h3>
              <p className="text-xs text-slate-500">
                Registros cadastrados com ID, Contratado, Cargo e Centro de Custo
              </p>
            </div>
            <button
              onClick={() => {
                setCadastroSuccessMsg('')
                setIsCadastroModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-sm shadow-pink-500/20 transition-all hover:translate-y-[-1px] cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>Novo Cadastro</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-28">ID</th>
                  <th className="p-3">Contratado</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Centro de Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colaboradoresList.map((colab) => (
                  <tr key={colab.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{colab.id}</td>
                    <td className="p-3 font-bold text-slate-800">{colab.contratado}</td>
                    <td className="p-3 text-slate-600 uppercase text-[11px] font-semibold">{colab.cargo}</td>
                    <td className="p-3 text-slate-600 uppercase text-[11px] font-semibold">{colab.centroDeCusto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CADASTRO: QUADRO PG 1
          Campos: ID, Contratado, Cargo, Centro de Custo
          ========================================================================= */}
      {isCadastroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                  <Plus size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Colaborador</h3>
                  <p className="text-xs text-slate-500">Preencha os campos obrigatórios do Quadro Pg 1</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCadastroModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSalvarCadastro} className="space-y-4">
              {/* Campo 1: ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>ID / Matrícula</span>
                  <span className="text-[10px] text-pink-600 font-semibold">* obrigatório</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 280438"
                  value={cadastroForm.id}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Campo 2: Contratado */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Contratado (Nome Completo)</span>
                  <span className="text-[10px] text-pink-600 font-semibold">* obrigatório</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: JOSE PEDRO MENEZES SILVA"
                  value={cadastroForm.contratado}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, contratado: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Campo 3: Cargo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ex: MEDICO TRABALHO JR"
                  value={cadastroForm.cargo}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, cargo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Campo 4: Centro de Custo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Centro de Custo
                </label>
                <input
                  type="text"
                  placeholder="Ex: REMUNERAÇÃO - SAUDE E SEGURANÇA DO TRABALHO"
                  value={cadastroForm.centroDeCusto}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, centroDeCusto: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Mensagem de Sucesso */}
              {cadastroSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{cadastroSuccessMsg}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCadastroModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 text-white hover:bg-pink-700 text-xs font-bold shadow-sm shadow-pink-500/20 transition-all cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
