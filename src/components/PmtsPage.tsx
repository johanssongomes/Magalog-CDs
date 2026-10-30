import React, { useState, useEffect, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
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
  HardDrive,
  Users,
  Briefcase,
  Building2,
  Download,
  Trash2,
  UserCheck,
  Edit,
  Eye,
  User,
  Save,
  FileText,
  Check,
  LayoutDashboard,
  BarChart2,
  ExternalLink,
  Maximize2,
  Tag,
  TrendingUp,
  Percent
} from 'lucide-react'
import initialColaboradoresData from '../data/initialColaboradores.json'
import { QuadroMedioTable } from './QuadroMedioTable'
import { ApontamentoPage } from './ApontamentoPage'
import { PmtDailyMatrixTable } from './PmtDailyMatrixTable'
import { BankHoursPage } from './BankHoursPage'
import { getAderenciaData, type AderenciaDataState } from '../lib/aderenciaService'
import initialAderenciaOct from '../data/initialAderencia202610.json'
import { PromocionaisTable } from './PromocionaisTable'
import { TableauIndicadoresPage } from './TableauIndicadoresPage'
import { LookerCarteiraPage } from './LookerCarteiraPage'
import { supabase } from '../lib/supabase'
import { getPmtSummaryFromSupabase } from '../lib/pmtService'
import { useAuth, LISTA_SITUACAO_SISTEMA_OPCOES } from '../lib/authContext'
import { getHierarchyUserIds } from '../lib/hierarchyService'

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
    title: 'Quadro de Colaboradores & Acompanhamento de Efetivo',
    description: 'Gestão de headcount, lotação por cargo, centros de custo e cadastro individual ou em massa da equipe.',
    badge: 'Módulo 03',
    slug: 'quadro',
    icon: <Target size={18} />
  },
  {
    id: 4,
    label: 'Promocionais',
    title: 'Itens Promocionais • Aba NE/NO/CO',
    description: 'Acompanhamento de SKUs promocionais, campanhas vigentes, datas de início e validade integrados com o Google Sheets.',
    badge: 'Módulo 04',
    slug: 'promocionais',
    icon: <Tag size={18} />
  },
  {
    id: 5,
    label: 'Tableau Indicadores',
    title: 'Nível de Serviço 1P • SAIDA CD ENTREGA A DOMICILIO (Tableau)',
    description: 'Painel corporativo do BI Luizalabs com indicadores de nível de serviço, ofensores e desempenho de transportadores.',
    badge: 'Módulo 05',
    slug: 'tableau-indicadores',
    icon: <BarChart2 size={18} />
  },
  {
    id: 6,
    label: 'Carteira CDs',
    title: 'Carteira CDs • Looker Studio',
    description: 'Painel operacional de Carteira Rodo, Currier, Prazos e Transferências integrado ao Google Looker Studio.',
    badge: 'Módulo 06',
    slug: 'carteira-cds',
    icon: <Layers size={18} />
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

export interface ColaboradorItem {
  id: string
  contratado: string
  cargo: string
  centroDeCusto: string
  // Campos detalhados conforme "Modelo Pessoas Modelo 1.xlsx"
  cd?: string
  login?: string
  cpf?: string
  rg?: string
  sexo?: string
  cargoAnterior?: string
  dataAdmissao?: string
  dataNascimento?: string
  situacaoSistema?: string
  status?: string
  possuiMedidas?: string
  possuiFeedback?: string
  idLider?: string
  nomeLider?: string
  setor?: string
  area?: string
  turno?: string
  ferias?: string
  codCentroCusto?: string
  gerencia?: string
  periodo45Dias?: string
  periodo90Dias?: string
  diaNiver?: string
  mesNiver?: string
  aniversario?: string
  novaIdade?: string
  tempoDeEmpresa?: string
  mesAdm?: string
  diaAdm?: string
  anoAdm?: string
  createdAt?: string
}

export const LISTA_AREAS_OPCOES = [
  'PLANEJAMENTO',
  'EXPEDIÇÃO',
  'RECEBIMENTO',
  'TRANSPORTE',
  'CONTROLE DE ESTOQUE',
  'REVERSA (DQS)',
  'APOIO (OUTRAS AREAS)',
  'GENRENCIA',
  'C&D'
] as const

const defaultColaboradorForm: ColaboradorItem = {
  id: '',
  contratado: '',
  cargo: '',
  centroDeCusto: '',
  cd: '994',
  login: '',
  cpf: '',
  rg: '',
  sexo: '',
  cargoAnterior: '',
  dataAdmissao: '',
  dataNascimento: '',
  situacaoSistema: 'Em Atividade Normal',
  status: '',
  possuiMedidas: '',
  possuiFeedback: '',
  idLider: '',
  nomeLider: '',
  setor: '',
  area: '',
  turno: '',
  ferias: '',
  codCentroCusto: '',
  gerencia: '',
  periodo45Dias: '',
  periodo90Dias: '',
  diaNiver: '',
  mesNiver: '',
  aniversario: '',
  novaIdade: '',
  tempoDeEmpresa: '',
  mesAdm: '',
  diaAdm: '',
  anoAdm: ''
}

export const PmtsPage: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth()
  const [activePageId, setActivePageId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('magalog_pmt_active_page_id')
      if (saved) {
        const parsed = Number(saved)
        if (!isNaN(parsed) && PMT_PAGES_CONFIG.some(p => p.id === parsed)) {
          return parsed
        }
      }
      return 3
    } catch {
      return 3
    }
  })
  const activePage = PMT_PAGES_CONFIG.find(p => p.id === activePageId) || PMT_PAGES_CONFIG[0]

  // Salva o submódulo do PMT ativo no localStorage
  useEffect(() => {
    try {
      if (activePageId) {
        localStorage.setItem('magalog_pmt_active_page_id', activePageId.toString())
      }
    } catch {
      // Ignora erro se indisponível
    }
  }, [activePageId])

  // Escuta troca de página disparada pelo Command Palette (Ctrl + L)
  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      if (customEvent.detail && PMT_PAGES_CONFIG.some(p => p.id === customEvent.detail)) {
        setActivePageId(customEvent.detail)
      }
    }

    window.addEventListener('magalog_change_pmt_page', handleCustomChange)
    return () => window.removeEventListener('magalog_change_pmt_page', handleCustomChange)
  }, [])

  // Sub-página ativa do menu Quadro (Dashboard, Quadro TT, BH, Pg 3, Pg 4, Pg 5)
  const [quadroSubPage, setQuadroSubPage] = useState<'dashboard' | 'pg1' | 'pg2' | 'pg3' | 'pg4' | 'pg5'>(() => {
    try {
      const saved = localStorage.getItem('magalog_quadro_subpage') as any
      if (['dashboard', 'pg1', 'pg2', 'pg3', 'pg4', 'pg5'].includes(saved)) {
        return saved
      }
      return 'dashboard'
    } catch {
      return 'dashboard'
    }
  })

  // Salva quadroSubPage no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_quadro_subpage', quadroSubPage)
    } catch {
      // Ignora
    }
  }, [quadroSubPage])

  // Sub-página ativa do menu PMT Expedição (pg1, pg2, pg3, pg4)
  const [expedicaoSubPage, setExpedicaoSubPage] = useState<'pg1' | 'pg2' | 'pg3' | 'pg4'>(() => {
    try {
      const saved = localStorage.getItem('magalog_expedicao_subpage') as any
      if (['pg1', 'pg2', 'pg3', 'pg4'].includes(saved)) {
        return saved
      }
      return 'pg1'
    } catch {
      return 'pg1'
    }
  })

  // Salva expedicaoSubPage no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_expedicao_subpage', expedicaoSubPage)
    } catch {
      // Ignora
    }
  }, [expedicaoSubPage])

  // Escuta troca de sub-aba do Quadro disparada pelo Command Palette (Ctrl + L)
  useEffect(() => {
    const handleQuadroSubPageChange = (e: Event) => {
      const customEvent = e as CustomEvent<'dashboard' | 'pg1' | 'pg2' | 'pg3' | 'pg4'>
      if (customEvent.detail && ['dashboard', 'pg1', 'pg2', 'pg3', 'pg4'].includes(customEvent.detail)) {
        setQuadroSubPage(customEvent.detail)
      }
    }

    window.addEventListener('magalog_change_quadro_subpage', handleQuadroSubPageChange)
    return () => window.removeEventListener('magalog_change_quadro_subpage', handleQuadroSubPageChange)
  }, [])

  // Filtros contextuais do Quadro (Múltipla Seleção)
  const [filtrosCargo, setFiltrosCargo] = useState<string[]>([])
  const [filtrosCentroCusto, setFiltrosCentroCusto] = useState<string[]>([])
  const [filtrosGerencia, setFiltrosGerencia] = useState<string[]>([])
  const [filtrosArea, setFiltrosArea] = useState<string[]>([])
  const [filtrosSituacao, setFiltrosSituacao] = useState<string[]>([])
  const [buscaColaborador, setBuscaColaborador] = useState<string>('')

  // Controle de abertura dos dropdowns de múltipla seleção
  const [openDropdown, setOpenDropdown] = useState<'cargo' | 'cc' | 'gerencia' | 'area' | 'situacao' | null>(null)

  // Estado do Modal de Cadastro Individual (Quadro - Pg 1)
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false)
  const [cadastroForm, setCadastroForm] = useState<ColaboradorItem>(defaultColaboradorForm)

  // Estado do Modal de Edição Completa dos Dados do Colaborador
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<ColaboradorItem | null>(null)
  const [editTab, setEditTab] = useState<'geral' | 'funcional' | 'admissao' | 'pessoal'>('geral')
  const [editSuccessMsg, setEditSuccessMsg] = useState('')

  // Estado do Modal de Importação em Massa de Colaboradores
  const [isImportColaboradoresModalOpen, setIsImportColaboradoresModalOpen] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [bulkParsedData, setBulkParsedData] = useState<ColaboradorItem[]>([])
  const [bulkFileName, setBulkFileName] = useState<string>('')
  const [replaceExistingColab, setReplaceExistingColab] = useState(false)
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0)
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [colaboradoresList, setColaboradoresList] = useState<ColaboradorItem[]>(() => {
    // 1. Carrega usuários ativos da Central de Usuários (Fonte Primária da Aplicação)
    let activeUsersList: any[] = []
    try {
      const storedUsers = localStorage.getItem('magalog_users_list')
      if (storedUsers) {
        activeUsersList = JSON.parse(storedUsers)
      }
    } catch {}

    const activeUserIds = new Set<string>()
    const activeUserNames = new Set<string>()
    if (Array.isArray(activeUsersList) && activeUsersList.length > 0) {
      activeUsersList.forEach(u => {
        if (u.active !== false) {
          const id = String(u.id || u.colaborador_id || '').toLowerCase().trim()
          const name = String(u.name || u.dados_colaborador?.contratado || '').toLowerCase().trim()
          if (id) activeUserIds.add(id)
          if (name) activeUserNames.add(name)
        }
      })
    }

    // 2. Carrega IDs deletados e desconsidera qualquer ID que esteja ATIVO na Central de Usuários
    let deletedIds: string[] = []
    try {
      const storedDeleted = localStorage.getItem('magalog_deleted_user_ids')
      if (storedDeleted) deletedIds = JSON.parse(storedDeleted)
    } catch {}

    if (activeUserIds.size > 0) {
      const cleanedDeleted = deletedIds.filter(id => {
        const low = String(id || '').toLowerCase().trim()
        return !activeUserIds.has(low) && !activeUserNames.has(low)
      })
      if (cleanedDeleted.length !== deletedIds.length) {
        try {
          localStorage.setItem('magalog_deleted_user_ids', JSON.stringify(cleanedDeleted))
        } catch {}
      }
      deletedIds = cleanedDeleted
    }

    const deletedSet = new Set(
      deletedIds
        .map(id => String(id || '').toLowerCase().trim())
        .filter(id => id.length > 0 && id !== 'undefined' && id !== 'null')
    )

    const initialRaw = (initialColaboradoresData as ColaboradorItem[]) || []
    const fullDataMap = new Map<string, ColaboradorItem>()
    initialRaw.forEach(item => {
      if (item.id) fullDataMap.set(item.id.trim().toLowerCase(), item)
      if (item.contratado) fullDataMap.set(item.contratado.trim().toUpperCase(), item)
    })

    // Se houver usuários na Central de Usuários com dados_colaborador ou correspondência, usa como fonte direta
    if (Array.isArray(activeUsersList) && activeUsersList.length > 0) {
      const listFromUsers = activeUsersList
        .filter(u => u.active !== false)
        .map(u => {
          const uId = String(u.id || u.colaborador_id || '').trim()
          const uName = String(u.name || '').trim().toUpperCase()
          const baseMatch = fullDataMap.get(uId.toLowerCase()) || fullDataMap.get(uName)
          const dados = u.dados_colaborador || {}

          const item: ColaboradorItem = {
            ...(baseMatch || {}),
            ...dados,
            id: uId || dados.id || baseMatch?.id || '',
            contratado: uName || dados.contratado || baseMatch?.contratado || '',
            cargo: dados.cargo || u.cargo || u.role || baseMatch?.cargo || 'CONFERENTE',
            centroDeCusto: dados.centroDeCusto || baseMatch?.centroDeCusto || 'GERAL CD 6994',
            cd: dados.cd || baseMatch?.cd || '6994',
            situacaoSistema: dados.situacaoSistema || baseMatch?.situacaoSistema || 'Em Atividade Normal',
            login: dados.login || (u.email ? u.email.split('@')[0].toUpperCase() : '') || baseMatch?.login || '',
            cpf: dados.cpf || baseMatch?.cpf || '',
            rg: dados.rg || baseMatch?.rg || '',
            sexo: dados.sexo || baseMatch?.sexo || 'M',
            dataNascimento: dados.dataNascimento || baseMatch?.dataNascimento || '',
            dataAdmissao: dados.dataAdmissao || baseMatch?.dataAdmissao || '',
            novaIdade: dados.novaIdade || baseMatch?.novaIdade || '',
            diaNiver: dados.diaNiver || baseMatch?.diaNiver || '',
            mesNiver: dados.mesNiver || baseMatch?.mesNiver || '',
            idLider: dados.idLider || baseMatch?.idLider || '',
            nomeLider: dados.nomeLider || baseMatch?.nomeLider || '',
            setor: dados.setor || baseMatch?.setor || '',
            turno: dados.turno || baseMatch?.turno || '1º'
          }
          return item
        })
        .filter(colab => {
          const cId = String(colab.id || '').toLowerCase().trim()
          const cName = String(colab.contratado || '').toLowerCase().trim()
          return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
        })

      if (listFromUsers.length > 0) {
        try {
          localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(listFromUsers))
        } catch {}
        return listFromUsers
      }
    }

    try {
      const saved = localStorage.getItem('magalog_quadro_colaboradores')
      if (saved) {
        const parsed: ColaboradorItem[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const upgraded = parsed
            .filter(colab => {
              const cId = String(colab.id || '').toLowerCase().trim()
              const cName = String(colab.contratado || '').toLowerCase().trim()
              return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
            })
            .map(colab => {
              const match = fullDataMap.get(String(colab.id || '').trim().toLowerCase()) || 
                            fullDataMap.get(String(colab.contratado || '').trim().toUpperCase())
              if (match) {
                const isCcNumeric = /^\d+$/.test(colab.centroDeCusto || '')
                const fixedCentroDeCusto = isCcNumeric ? match.centroDeCusto : (colab.centroDeCusto || match.centroDeCusto)
                const fixedCodCentroCusto = colab.codCentroCusto || (isCcNumeric ? colab.centroDeCusto : match.codCentroCusto)

                return {
                  ...match,
                  ...colab,
                  centroDeCusto: fixedCentroDeCusto,
                  codCentroCusto: fixedCodCentroCusto,
                  login: colab.login || match.login,
                  cpf: colab.cpf || match.cpf,
                  rg: colab.rg || match.rg,
                  sexo: colab.sexo || match.sexo,
                  dataNascimento: colab.dataNascimento || match.dataNascimento,
                  dataAdmissao: colab.dataAdmissao || match.dataAdmissao,
                  novaIdade: colab.novaIdade || match.novaIdade,
                  diaNiver: colab.diaNiver || match.diaNiver,
                  mesNiver: colab.mesNiver || match.mesNiver,
                  idLider: colab.idLider || match.idLider,
                  nomeLider: colab.nomeLider || match.nomeLider,
                  setor: colab.setor || match.setor,
                  turno: colab.turno || match.turno,
                  situacaoSistema: colab.situacaoSistema || match.situacaoSistema
                }
              }
              return colab
            })

          let mergedList = upgraded
          if (upgraded.length < initialRaw.length) {
            // Se o cache tiver apenas uma amostra parcial (ex: 11 itens), complementa com a base completa
            const existingIdSet = new Set(upgraded.map(u => String(u.id || '').trim().toLowerCase()))
            const missing = initialRaw.filter(i => {
              const iId = String(i.id || '').trim().toLowerCase()
              const iName = String(i.contratado || '').trim().toLowerCase()
              return !existingIdSet.has(iId) && (!iId || !deletedSet.has(iId)) && (!iName || !deletedSet.has(iName))
            })
            mergedList = [...upgraded, ...missing]
          }

          if (mergedList.length > 0) {
            try {
              localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(mergedList))
            } catch {}
            return mergedList
          }
        }
      }
    } catch {}

    // Carrega a base padrão com os colaboradores completos, excluindo os IDs deletados
    return initialRaw.filter(c => {
      const cId = String(c.id || '').toLowerCase().trim()
      const cName = String(c.contratado || '').toLowerCase().trim()
      return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
    })
  })
  const [cadastroSuccessMsg, setCadastroSuccessMsg] = useState('')
  const [isSyncingDb, setIsSyncingDb] = useState(false)

  // Helpers para mapeamento de coluna Supabase (snake_case) <-> Frontend (camelCase)
  const mapFromSupabase = (row: any): ColaboradorItem => ({
    id: String(row.id || ''),
    contratado: row.contratado || '',
    cargo: row.cargo || '',
    centroDeCusto: row.centro_de_custo || '',
    cd: row.cd || '994',
    login: row.login || '',
    cpf: row.cpf || '',
    rg: row.rg || '',
    sexo: row.sexo || '',
    cargoAnterior: row.cargo_anterior || '',
    dataAdmissao: row.data_admissao || '',
    dataNascimento: row.data_nascimento || '',
    situacaoSistema: row.situacao_sistema || 'Em Atividade Normal',
    status: row.status || '',
    possuiMedidas: row.possui_medidas || '',
    possuiFeedback: row.possui_feedback || '',
    idLider: row.id_lider || '',
    nomeLider: row.nome_lider || '',
    setor: row.setor || '',
    area: row.area || '',
    turno: row.turno || '',
    ferias: row.ferias || '',
    codCentroCusto: row.cod_centro_custo || '',
    gerencia: row.gerencia || '',
    periodo45Dias: row.periodo_45_dias || '',
    periodo90Dias: row.periodo_90_dias || '',
    diaNiver: row.dia_niver || '',
    mesNiver: row.mes_niver || '',
    aniversario: row.aniversario || '',
    novaIdade: row.nova_idade || '',
    tempoDeEmpresa: row.tempo_de_empresa || '',
    mesAdm: row.mes_adm || '',
    diaAdm: row.dia_adm || '',
    anoAdm: row.ano_adm || '',
    createdAt: row.created_at || new Date().toISOString()
  })

  const mapToSupabase = (item: ColaboradorItem) => ({
    id: String(item.id || ''),
    contratado: item.contratado || '',
    cargo: item.cargo || '',
    centro_de_custo: item.centroDeCusto || '',
    cd: item.cd || '994',
    login: item.login || '',
    cpf: item.cpf || '',
    rg: item.rg || '',
    sexo: item.sexo || '',
    cargo_anterior: item.cargoAnterior || '',
    data_admissao: item.dataAdmissao || '',
    data_nascimento: item.dataNascimento || '',
    situacao_sistema: item.situacaoSistema || 'Em Atividade Normal',
    status: item.status || '',
    possui_medidas: item.possuiMedidas || '',
    possui_feedback: item.possuiFeedback || '',
    id_lider: item.idLider || '',
    nome_lider: item.nomeLider || '',
    setor: item.setor || '',
    area: item.area || '',
    turno: item.turno || '',
    ferias: item.ferias || '',
    cod_centro_custo: item.codCentroCusto || '',
    gerencia: item.gerencia || '',
    periodo_45_dias: item.periodo45Dias || '',
    periodo_90_dias: item.periodo90Dias || '',
    dia_niver: item.diaNiver || '',
    mes_niver: item.mesNiver || '',
    aniversario: item.aniversario || '',
    nova_idade: item.novaIdade || '',
    tempo_de_empresa: item.tempoDeEmpresa || '',
    mes_adm: item.mesAdm || '',
    dia_adm: item.diaAdm || '',
    ano_adm: item.anoAdm || '',
    updated_at: new Date().toISOString()
  })

  // Carregar dados da tabela do Banco de Dados (Supabase na Vercel + API Local)
  const fetchColaboradoresFromDb = async () => {
    try {
      setIsSyncingDb(true)

      // 1. Carrega usuários ativos da Central de Usuários (Fonte Principal de Cadastro)
      let activeUsersList: any[] = []
      try {
        const storedUsers = localStorage.getItem('magalog_users_list')
        if (storedUsers) {
          activeUsersList = JSON.parse(storedUsers)
        }
      } catch {}

      const activeUserIds = new Set<string>()
      const activeUserNames = new Set<string>()
      if (Array.isArray(activeUsersList) && activeUsersList.length > 0) {
        activeUsersList.forEach(u => {
          if (u.active !== false) {
            const id = String(u.id || u.colaborador_id || '').toLowerCase().trim()
            const name = String(u.name || u.dados_colaborador?.contratado || '').toLowerCase().trim()
            if (id) activeUserIds.add(id)
            if (name) activeUserNames.add(name)
          }
        })
      }

      // 2. Carregar lista de IDs excluídos (local e nuvem Supabase)
      let deletedIds: string[] = []
      try {
        const storedDeleted = localStorage.getItem('magalog_deleted_user_ids')
        if (storedDeleted) deletedIds = JSON.parse(storedDeleted)
      } catch {}

      try {
        const { data: globalDelRes } = await supabase
          .from('performance_metrics')
          .select('value')
          .eq('cell_key', 'global_deleted_user_ids')
          .maybeSingle()
        if (globalDelRes?.value) {
          const parsedGlobal: string[] = JSON.parse(globalDelRes.value)
          if (Array.isArray(parsedGlobal)) {
            parsedGlobal.forEach(id => {
              if (!deletedIds.includes(id)) deletedIds.push(id)
            })
            try {
              localStorage.setItem('magalog_deleted_user_ids', JSON.stringify(deletedIds))
            } catch {}
          }
        }
      } catch {}

      if (activeUserIds.size > 0) {
        const cleanedDeleted = deletedIds.filter(id => {
          const low = String(id || '').toLowerCase().trim()
          return !activeUserIds.has(low) && !activeUserNames.has(low)
        })
        if (cleanedDeleted.length !== deletedIds.length) {
          try {
            localStorage.setItem('magalog_deleted_user_ids', JSON.stringify(cleanedDeleted))
          } catch {}
        }
        deletedIds = cleanedDeleted
      }

      const deletedSet = new Set(
        deletedIds
          .map(id => String(id || '').toLowerCase().trim())
          .filter(id => id.length > 0 && id !== 'undefined' && id !== 'null')
      )

      const initialList = (initialColaboradoresData as ColaboradorItem[]) || []
      const fullDataMap = new Map<string, ColaboradorItem>()
      initialList.forEach(item => {
        if (item.id) fullDataMap.set(item.id.trim().toLowerCase(), item)
        if (item.contratado) fullDataMap.set(item.contratado.trim().toUpperCase(), item)
      })

      // Se temos a Central de Usuários ativa com dados, sincroniza diretamente para que o Quadro TT reflita 100% da Central
      if (Array.isArray(activeUsersList) && activeUsersList.length > 0) {
        const listFromUsers = activeUsersList
          .filter(u => u.active !== false)
          .map(u => {
            const uId = String(u.id || u.colaborador_id || '').trim()
            const uName = String(u.name || '').trim().toUpperCase()
            const baseMatch = fullDataMap.get(uId.toLowerCase()) || fullDataMap.get(uName)
            const dados = u.dados_colaborador || {}

            const item: ColaboradorItem = {
              ...(baseMatch || {}),
              ...dados,
              id: uId || dados.id || baseMatch?.id || '',
              contratado: uName || dados.contratado || baseMatch?.contratado || '',
              cargo: dados.cargo || u.cargo || u.role || baseMatch?.cargo || 'CONFERENTE',
              centroDeCusto: dados.centroDeCusto || baseMatch?.centroDeCusto || 'GERAL CD 6994',
              cd: dados.cd || baseMatch?.cd || '6994',
              situacaoSistema: dados.situacaoSistema || baseMatch?.situacaoSistema || 'Em Atividade Normal',
              login: dados.login || (u.email ? u.email.split('@')[0].toUpperCase() : '') || baseMatch?.login || '',
              cpf: dados.cpf || baseMatch?.cpf || '',
              rg: dados.rg || baseMatch?.rg || '',
              sexo: dados.sexo || baseMatch?.sexo || 'M',
              dataNascimento: dados.dataNascimento || baseMatch?.dataNascimento || '',
              dataAdmissao: dados.dataAdmissao || baseMatch?.dataAdmissao || '',
              novaIdade: dados.novaIdade || baseMatch?.novaIdade || '',
              diaNiver: dados.diaNiver || baseMatch?.diaNiver || '',
              mesNiver: dados.mesNiver || baseMatch?.mesNiver || '',
              idLider: dados.idLider || baseMatch?.idLider || '',
              nomeLider: dados.nomeLider || baseMatch?.nomeLider || '',
              setor: dados.setor || baseMatch?.setor || '',
              area: dados.area || (u as any).area || baseMatch?.area || '',
              turno: dados.turno || baseMatch?.turno || '1º'
            }
            return item
          })
          .filter(c => {
            const cId = String(c.id || '').toLowerCase().trim()
            const cName = String(c.contratado || '').toLowerCase().trim()
            return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
          })

        if (listFromUsers.length > 0) {
          setColaboradoresList(listFromUsers)
          try {
            localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(listFromUsers))
          } catch {}
          return
        }
      }

      // 1. Tenta carregar direto do Supabase (Essencial para Vercel)
      try {
        const { data: supaData, error: supaErr } = await supabase
          .from('colaboradores')
          .select('*')
          .order('contratado', { ascending: true })

        if (!supaErr && Array.isArray(supaData) && supaData.length > 0) {
          const supaList = supaData.map(mapFromSupabase)
          
          // Mapeia por ID e Nome os dados vindos do Supabase
          const supaMap = new Map<string, ColaboradorItem>()
          supaList.forEach(item => {
            if (item.id) supaMap.set(String(item.id).trim().toLowerCase(), item)
            if (item.contratado) supaMap.set(String(item.contratado).trim().toUpperCase(), item)
          })

          // Mescla com a base completa de colaboradores padrão
          const mergedBase = initialList.map(baseItem => {
            const dbMatch = supaMap.get(String(baseItem.id).trim().toLowerCase()) ||
                            supaMap.get(String(baseItem.contratado).trim().toUpperCase())
            return dbMatch ? { ...baseItem, ...dbMatch } : baseItem
          })

          // Adiciona quaisquer novos colaboradores criados no Supabase que não estavam na base inicial
          const initialIdSet = new Set(initialList.map(i => String(i.id).trim().toLowerCase()))
          supaList.forEach(supaItem => {
            if (supaItem.id && !initialIdSet.has(String(supaItem.id).trim().toLowerCase())) {
              mergedBase.unshift(supaItem)
            }
          })

          const finalList = mergedBase.filter(c => {
            const cId = String(c.id || '').toLowerCase().trim()
            const cName = String(c.contratado || '').toLowerCase().trim()
            return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
          })

          if (finalList.length > 0) {
            setColaboradoresList(finalList)
            try {
              localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(finalList))
            } catch {}
            return
          }
        }
      } catch (e) {
        // Ignora e tenta local API
      }

      // 2. Se não estiver no Supabase ou estiver rodando localmente com server Node
      try {
        const res = await fetch('http://localhost:3001/api/colaboradores')
        const json = await res.json()
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const list = (json.data as ColaboradorItem[])
            .filter(c => {
              const cId = String(c.id || '').toLowerCase().trim()
              const cName = String(c.contratado || '').toLowerCase().trim()
              return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
            })

          if (list.length > 0) {
            setColaboradoresList(list)
            try {
              localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(list))
            } catch {}
            return
          }
        }
      } catch (e) {
        // Local server indisponível (ex: ambiente Vercel)
      }

      // 3. Fallback: Base local inicial enriquecida (187 colaboradores padrão)
      const filteredInitial = initialList.filter(c => {
        const cId = String(c.id || '').toLowerCase().trim()
        const cName = String(c.contratado || '').toLowerCase().trim()
        return (!cId || !deletedSet.has(cId)) && (!cName || !deletedSet.has(cName))
      })

      if (filteredInitial.length > 0) {
        setColaboradoresList(prev => prev.length > 0 ? prev : filteredInitial)
        try {
          const existing = localStorage.getItem('magalog_quadro_colaboradores')
          if (!existing || JSON.parse(existing).length === 0) {
            localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(filteredInitial))
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Banco de dados local/remoto não respondeu, utilizando base em memória/local:', err)
    } finally {
      setIsSyncingDb(false)
    }
  }

  // Executa o carregamento inicial do Banco de Dados e assina atualizações em tempo real (Supabase Realtime)
  useEffect(() => {
    fetchColaboradoresFromDb()

    // Sincronização entre abas e eventos do mesmo navegador (quando um usuário é deletado, alterado ou importado)
    const handleStorageUpdate = (e?: StorageEvent | CustomEvent) => {
      try {
        fetchColaboradoresFromDb()
      } catch {}
    }

    window.addEventListener('storage', handleStorageUpdate)
    window.addEventListener('magalog_users_updated', handleStorageUpdate)

    // Supabase Realtime para sincronização automática instantânea com tratamento de status
    let channel: any = null
    try {
      channel = supabase
        .channel('colaboradores_quadro_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'colaboradores' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = mapFromSupabase(payload.new)
              setColaboradoresList((prev) => {
                const updated = [newItem, ...prev.filter((c) => String(c.id).trim() !== String(newItem.id).trim())]
                try { localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated)) } catch {}
                return updated
              })
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = mapFromSupabase(payload.new)
              setColaboradoresList((prev) => {
                const updated = prev.map((c) => String(c.id).trim() === String(updatedItem.id).trim() ? updatedItem : c)
                try { localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated)) } catch {}
                return updated
              })
            } else if (payload.eventType === 'DELETE') {
              const deletedId = String(payload.old?.id || (payload as any).old_record?.id || '').trim().toLowerCase()
              if (deletedId) {
                setColaboradoresList((prev) => {
                  const updated = prev.filter((c) => {
                    const cId = String(c.id).trim().toLowerCase()
                    return cId !== deletedId
                  })
                  try { localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated)) } catch {}
                  return updated
                })
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // Realtime conectado
          }
        })
    } catch (realtimeErr) {
      console.warn('Realtime subscription error ignored:', realtimeErr)
    }

    return () => {
      window.removeEventListener('storage', handleStorageUpdate)
      window.removeEventListener('magalog_users_updated', handleStorageUpdate)
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [])

  const handleSalvarCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cadastroForm.id || !cadastroForm.contratado) return

    const normalizedId = cadastroForm.id.trim()
    const normalizedNome = cadastroForm.contratado.trim().toUpperCase()

    // Validação de duplicidade no cadastro individual
    const exists = colaboradoresList.some(
      c => c.id.toLowerCase() === normalizedId.toLowerCase() || 
           c.contratado.toLowerCase() === normalizedNome.toLowerCase()
    )

    if (exists) {
      alert(`Atenção: Já existe um colaborador cadastrado com o ID "${normalizedId}" ou Nome "${normalizedNome}". Duplicados não são permitidos.`)
      return
    }

    const novoColaborador: ColaboradorItem = {
      ...cadastroForm,
      id: normalizedId,
      contratado: normalizedNome,
      cargo: (cadastroForm.cargo || 'NÃO DEFINIDO').trim().toUpperCase(),
      centroDeCusto: (cadastroForm.centroDeCusto || 'GERAL CD 994').trim().toUpperCase(),
      createdAt: new Date().toISOString()
    }

    const updated = [novoColaborador, ...colaboradoresList]
    setColaboradoresList(updated)
    try {
      localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated))
    } catch {}

    // Grava no Banco de Dados via Supabase (Vercel) e API local
    try {
      await supabase.from('colaboradores').upsert(mapToSupabase(novoColaborador), { onConflict: 'id' })
    } catch {}

    try {
      await fetch('http://localhost:3001/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoColaborador)
      })
    } catch (err) {
      // Local server indisponível (ex: ambiente Vercel)
    }

    setCadastroForm(defaultColaboradorForm)
    setCadastroSuccessMsg('Colaborador cadastrado e gravado no Banco de Dados!')
    setTimeout(() => {
      setCadastroSuccessMsg('')
      setIsCadastroModalOpen(false)
    }, 1200)
  }

  // Abrir modal de edição para um colaborador específico
  const handleOpenEdit = (colab: ColaboradorItem) => {
    setEditingColaborador({ ...colab })
    setEditTab('geral')
    setEditSuccessMsg('')
    setIsEditModalOpen(true)
  }

  // Salvar alterações da edição do colaborador
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingColaborador || !editingColaborador.id || !editingColaborador.contratado) return

    const updatedList = colaboradoresList.map(c => 
      c.id === editingColaborador.id ? { ...editingColaborador } : c
    )

    setColaboradoresList(updatedList)
    try {
      localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updatedList))
    } catch {}

    // Grava alteração no Banco de Dados (Supabase Vercel + API Local)
    try {
      await supabase.from('colaboradores').upsert(mapToSupabase(editingColaborador), { onConflict: 'id' })
    } catch {}

    try {
      await fetch('http://localhost:3001/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingColaborador)
      })
    } catch (err) {
      // Local server indisponível (ex: ambiente Vercel)
    }

    // Sincroniza com magalog_users_list e dispara evento para Controle de Usuários
    try {
      const storedUsers = localStorage.getItem('magalog_users_list')
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers)
        const colabId = String(editingColaborador.id).trim().toLowerCase()
        const updatedUsersList = usersList.map((u: any) => {
          const uId = String(u.id || u.colaborador_id || '').trim().toLowerCase()
          if (uId === colabId) {
            return {
              ...u,
              area: editingColaborador.area,
              dados_colaborador: { ...(u.dados_colaborador || {}), ...editingColaborador }
            }
          }
          return u
        })
        localStorage.setItem('magalog_users_list', JSON.stringify(updatedUsersList))
      }
      window.dispatchEvent(new CustomEvent('magalog_users_updated', {
        detail: { action: 'update', id: editingColaborador.id, colaborador: editingColaborador, area: editingColaborador.area }
      }))
    } catch {}

    setEditSuccessMsg('Dados do colaborador atualizados e salvos no Banco de Dados!')
    setTimeout(() => {
      setEditSuccessMsg('')
      setIsEditModalOpen(false)
      setEditingColaborador(null)
    }, 1000)
  }

  // Processamento da Planilha Excel / CSV para Cadastro em Massa com suporte completo aos campos do Modelo 1.xlsx
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkFileName(file.name)
    setBulkFeedback(null)
    setDuplicatesCount(0)

    const formatExcelDate = (val: any) => {
      if (!val) return ''
      if (typeof val === 'number') {
        const d = (XLSX.SSF as any).parse_date_code(val)
        if (d) {
          const pad = (n: number) => String(n).padStart(2, '0')
          return `${pad(d.d)}/${pad(d.m)}/${d.y}`
        }
      }
      return String(val).trim()
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (!rawJson || rawJson.length === 0) {
          setBulkFeedback({ type: 'error', message: 'A planilha selecionada está vazia.' })
          setBulkParsedData([])
          return
        }

        // Sets para impedir duplicados internos na própria planilha
        const seenIds = new Set<string>()
        const seenNames = new Set<string>()

        // Sets de colaboradores já cadastrados no sistema (quando não for substituir tudo)
        const existingIds = new Set(colaboradoresList.map(c => c.id.trim().toLowerCase()))
        const existingNames = new Set(colaboradoresList.map(c => c.contratado.trim().toUpperCase()))

        const parsed: ColaboradorItem[] = []
        let duplicatesBlocked = 0

        for (const row of rawJson) {
          const keys = Object.keys(row)
          const findVal = (terms: string[]) => {
            // Primeiro tenta correspondência exata do nome da coluna
            const exactKey = keys.find(k => terms.some(t => k.toLowerCase().trim() === t.toLowerCase().trim()))
            if (exactKey) return row[exactKey]
            // Se não houver exata, tenta substring mas evitando conflito de cod_centro_custo com centro_custo
            const partialKey = keys.find(k => terms.some(t => {
              const normK = k.toLowerCase().trim()
              const normT = t.toLowerCase().trim()
              if (normT === 'centro_custo' || normT === 'centro de custo') {
                return (normK === 'centro_custo' || normK === 'centro de custo') || (normK.includes('centro') && !normK.includes('cod'))
              }
              return normK.includes(normT)
            }))
            return partialKey ? row[partialKey] : ''
          }

          const rawId = String(findVal(['id', 'matrícula', 'matricula', 'crachá', 'cracha', 'codigo', 'código'])).trim()
          const rawContratado = String(findVal(['contratado', 'nome', 'colaborador', 'funcionario', 'funcionário'])).trim()
          
          if (rawId || rawContratado) {
            const normId = (rawId || `AUTO-${Math.floor(100000 + Math.random() * 900000)}`).trim()
            const normNome = (rawContratado || 'SEM NOME').trim().toUpperCase()
            const idKey = normId.toLowerCase()

            // 1. Verifica se já apareceu antes na mesma planilha
            if (seenIds.has(idKey) || (normNome !== 'SEM NOME' && seenNames.has(normNome))) {
              duplicatesBlocked++
              continue
            }

            // 2. Se NÃO estiver marcado para substituir tudo, verifica se já existe na base atual
            if (!replaceExistingColab && (existingIds.has(idKey) || (normNome !== 'SEM NOME' && existingNames.has(normNome)))) {
              duplicatesBlocked++
              continue
            }

            seenIds.add(idKey)
            if (normNome !== 'SEM NOME') seenNames.add(normNome)

            const rawCentroCusto = String(findVal(['centro_custo', 'centro de custo', 'centro custo'])).trim().toUpperCase()
            const rawCodCentroCusto = String(findVal(['cod_centro_custo', 'cod centro custo', 'codigo centro de custo'])).trim()

            parsed.push({
              id: normId,
              contratado: normNome,
              cargo: String(findVal(['cargo']) || 'NÃO DEFINIDO').trim().toUpperCase(),
              centroDeCusto: rawCentroCusto && !/^\d+$/.test(rawCentroCusto) ? rawCentroCusto : (rawCentroCusto || 'GERAL CD 994'),
              cd: String(findVal(['cd']) || '994').trim(),
              login: String(findVal(['login'])).trim(),
              cpf: String(findVal(['cpf'])).trim(),
              rg: String(findVal(['rg'])).trim(),
              sexo: String(findVal(['sexo'])).trim(),
              cargoAnterior: String(findVal(['cargo anterior'])).trim(),
              dataAdmissao: formatExcelDate(findVal(['data_admissao', 'data admissao', 'admissao'])),
              dataNascimento: formatExcelDate(findVal(['data_nascimento', 'data nascimento', 'nascimento'])),
              situacaoSistema: String(findVal(['situacao sistema', 'situação sistema', 'situacao']) || 'Em Atividade Normal').trim(),
              status: String(findVal(['status'])).trim(),
              possuiMedidas: String(findVal(['possui medidas'])).trim(),
              possuiFeedback: String(findVal(['possui feedback'])).trim(),
              idLider: String(findVal(['id lider', 'id líder'])).trim(),
              nomeLider: String(findVal(['nome lider', 'nome líder'])).trim(),
              setor: String(findVal(['setor'])).trim(),
              area: String(findVal(['area', 'área'])).trim(),
              turno: String(findVal(['turno'])).trim(),
              ferias: String(findVal(['férias', 'ferias'])).trim(),
              codCentroCusto: rawCodCentroCusto,
              gerencia: String(findVal(['gerência', 'gerencia'])).trim(),
              periodo45Dias: formatExcelDate(findVal(['período 45 dias', 'periodo 45 dias'])),
              periodo90Dias: formatExcelDate(findVal(['período 90 dias', 'periodo 90 dias'])),
              diaNiver: String(findVal(['dia niver'])).trim(),
              mesNiver: String(findVal(['mes niver'])).trim(),
              aniversario: formatExcelDate(findVal(['aniversário', 'aniversario'])),
              novaIdade: String(findVal(['nova idade'])).trim(),
              tempoDeEmpresa: String(findVal(['tempo de empresa'])).trim(),
              mesAdm: String(findVal(['mês adm', 'mes adm'])).trim(),
              diaAdm: String(findVal(['dia adm'])).trim(),
              anoAdm: String(findVal(['ano adm'])).trim(),
              createdAt: new Date().toISOString()
            })
          }
        }

        setDuplicatesCount(duplicatesBlocked)

        if (parsed.length === 0) {
          if (duplicatesBlocked > 0) {
            setBulkFeedback({
              type: 'warning',
              message: `Todos os ${duplicatesBlocked} registros da planilha foram ignorados por já estarem cadastrados ou serem duplicados.`
            })
          } else {
            setBulkFeedback({
              type: 'error',
              message: 'Não foi possível encontrar colunas válidas de ID ou Nome na planilha.'
            })
          }
          setBulkParsedData([])
        } else {
          setBulkParsedData(parsed)
          setBulkFeedback({
            type: 'success',
            message: `${parsed.length} novos colaboradores prontos para importação com todos os dados do Modelo 1.${duplicatesBlocked > 0 ? ` (${duplicatesBlocked} duplicados ignorados e bloqueados)` : ''}`
          })
        }
      } catch (err: any) {
        setBulkFeedback({
          type: 'error',
          message: 'Erro ao processar planilha: ' + (err.message || 'formato inválido')
        })
        setBulkParsedData([])
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirmBulkImport = async () => {
    if (bulkParsedData.length === 0) return

    let updatedList: ColaboradorItem[]
    if (replaceExistingColab) {
      updatedList = [...bulkParsedData]
    } else {
      // Mescla atualizando e enriquecendo colaboradores existentes pelo ID/Nome com os novos campos da planilha
      const map = new Map<string, ColaboradorItem>()
      colaboradoresList.forEach(c => map.set(c.id.toLowerCase(), c))

      bulkParsedData.forEach(item => {
        const key = item.id.toLowerCase()
        if (map.has(key)) {
          // Se já existia, preserva mas enriquece com todos os dados da planilha
          map.set(key, { ...map.get(key)!, ...item })
        } else {
          map.set(key, item)
        }
      })
      updatedList = Array.from(map.values())
    }

    setColaboradoresList(updatedList)
    try {
      localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updatedList))
    } catch {}

    // Grava todos os registros na tabela do Banco de Dados (Supabase Vercel + API Local)
    try {
      const supaRows = bulkParsedData.map(mapToSupabase)
      if (replaceExistingColab) {
        await supabase.from('colaboradores').delete().neq('id', '___all___')
      }
      // Upsert em lotes de 100 para o Supabase
      for (let i = 0; i < supaRows.length; i += 100) {
        await supabase.from('colaboradores').upsert(supaRows.slice(i, i + 100), { onConflict: 'id' })
      }
    } catch {}

    try {
      await fetch('http://localhost:3001/api/colaboradores/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: bulkParsedData,
          replaceAll: replaceExistingColab
        })
      })
    } catch (err) {
      // Local server indisponível (ex: ambiente Vercel)
    }

    setBulkFeedback({
      type: 'success',
      message: `Sucesso! ${bulkParsedData.length} colaboradores foram cadastrados e gravados na tabela do Banco de Dados.`
    })
    setTimeout(() => {
      setIsImportColaboradoresModalOpen(false)
      setBulkParsedData([])
      setBulkFileName('')
      setBulkFeedback(null)
      setDuplicatesCount(0)
    }, 1200)
  }

  const handleDownloadTemplate = () => {
    // Tenta baixar o arquivo original do Modelo 1 se disponível
    const link = document.createElement('a')
    link.href = '/modelo_cadastro_colaboradores.xlsx'
    link.download = 'Modelo 1.xlsx'
    link.click()
  }

  // Exclusão individual de colaborador
  const handleDeleteColaborador = async (id: string) => {
    const updated = colaboradoresList.filter(c => c.id !== id)
    setColaboradoresList(updated)
    try {
      localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updated))
    } catch {}

    // Remove do Banco de Dados (Supabase Vercel + API Local)
    try {
      await supabase.from('colaboradores').delete().eq('id', id)
    } catch {}

    try {
      await fetch(`http://localhost:3001/api/colaboradores/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
    } catch (err) {
      // Local server indisponível (ex: ambiente Vercel)
    }
  }

  // Deletar todos os colaboradores
  const handleClearAllColaboradores = async () => {
    setColaboradoresList([])
    try {
      localStorage.removeItem('magalog_quadro_colaboradores')
    } catch {}

    // Limpa a tabela no Banco de Dados (Supabase Vercel + API Local)
    try {
      await supabase.from('colaboradores').delete().neq('id', '___all___')
    } catch {}

    try {
      await fetch('http://localhost:3001/api/colaboradores', {
        method: 'DELETE'
      })
    } catch (err) {
      // Local server indisponível (ex: ambiente Vercel)
    }

    setIsClearAllModalOpen(false)
  }

  // Filtragem de colaboradores para Quadro (Suporta Múltipla Seleção e Hierarquia de Liderança)
  const filteredColaboradores = useMemo(() => {
    const isMasterOrAdmin =
      currentUser?.id === 'admin-master' ||
      currentUser?.email === 'johansson.gomes@magazineluiza.com.br' ||
      currentUser?.email === 'joh_gomes@magalog.com.br' ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'gerente' ||
      currentUser?.role === 'coordenador' ||
      (currentUser?.cargo && (currentUser.cargo.toUpperCase().includes('COORDENADOR') || currentUser.cargo.toUpperCase().includes('GERENTE')))

    const currentUserId = currentUser?.colaborador_id || currentUser?.id
    const allowedHierarchyIds = getHierarchyUserIds(currentUserId, colaboradoresList, isMasterOrAdmin)

    return colaboradoresList.filter(colab => {
      // 1. Filtro hierárquico (Líder / Supervisor / Coordenador)
      if (allowedHierarchyIds) {
        const cId = String(colab.id || '').trim().toLowerCase()
        if (!allowedHierarchyIds.has(cId)) {
          return false
        }
      }

      // 2. Filtros de interface
      const matchBusca = !buscaColaborador || 
        colab.contratado.toLowerCase().includes(buscaColaborador.toLowerCase()) ||
        colab.id.toLowerCase().includes(buscaColaborador.toLowerCase())
      const matchCargo = filtrosCargo.length === 0 || filtrosCargo.includes(colab.cargo)
      const matchCC = filtrosCentroCusto.length === 0 || filtrosCentroCusto.includes(colab.centroDeCusto || '(vazio)')
      const matchGer = filtrosGerencia.length === 0 || filtrosGerencia.includes(colab.gerencia || '(vazio)')
      const matchArea = filtrosArea.length === 0 || filtrosArea.includes(colab.area || '(sem área)')
      const matchSituacao = filtrosSituacao.length === 0 || filtrosSituacao.includes(colab.situacaoSistema || 'Em Atividade Normal')
      return matchBusca && matchCargo && matchCC && matchGer && matchArea && matchSituacao
    })
  }, [colaboradoresList, buscaColaborador, filtrosCargo, filtrosCentroCusto, filtrosGerencia, filtrosArea, filtrosSituacao, currentUser])

  // Lista de valores únicos para filtros e resumos
  const listaCargos = Array.from(new Set(colaboradoresList.map(c => c.cargo).filter(Boolean))).sort()
  const listaCentrosCusto = Array.from(new Set(colaboradoresList.map(c => c.centroDeCusto || '(vazio)'))).sort()
  const listaGerencias = Array.from(new Set(colaboradoresList.map(c => c.gerencia || '(vazio)'))).sort()
  const listaAreas = Array.from(new Set([
    ...LISTA_AREAS_OPCOES,
    ...colaboradoresList.map(c => c.area).filter(Boolean) as string[]
  ])).sort()
  const listaSituacoes = Array.from(new Set(colaboradoresList.map(c => c.situacaoSistema || 'Em Atividade Normal').filter(Boolean))).sort()

  // Lista de líderes disponíveis com ID e Nome para autocompletar e seleção bidirecional
  const listaLideresOpcoes = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>()
    colaboradoresList.forEach(c => {
      const cargo = (c.cargo || '').toUpperCase()
      const isLeaderRole = cargo.includes('LIDER') || cargo.includes('SUPERVISOR') || cargo.includes('COORDENADOR') || cargo.includes('GERENTE')
      if (isLeaderRole && c.contratado && c.id) {
        map.set(c.id.trim(), { id: c.id.trim(), nome: c.contratado.trim().toUpperCase() })
      }
      if (c.idLider && c.nomeLider) {
        const idTrim = c.idLider.trim()
        if (!map.has(idTrim)) {
          map.set(idTrim, { id: idTrim, nome: c.nomeLider.trim().toUpperCase() })
        }
      }
    })
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [colaboradoresList])

  // Tabelas de resumo ordenadas por quantidade descrescente (igual à tabela dinâmica solicitada)
  const totalGeral = colaboradoresList.length

  const resumoCargos = useMemo(() => {
    const map = new Map<string, number>()
    colaboradoresList.forEach(c => {
      const key = c.cargo || '(vazio)'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([nome, qnts]) => ({
        nome,
        qnts,
        perc: totalGeral > 0 ? (qnts / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.qnts - a.qnts || a.nome.localeCompare(b.nome))
  }, [colaboradoresList, totalGeral])

  const resumoCentrosCusto = useMemo(() => {
    const map = new Map<string, number>()
    colaboradoresList.forEach(c => {
      const key = c.centroDeCusto || '(vazio)'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([nome, qnts]) => ({
        nome,
        qnts,
        perc: totalGeral > 0 ? (qnts / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.qnts - a.qnts || a.nome.localeCompare(b.nome))
  }, [colaboradoresList, totalGeral])

  const resumoGerencias = useMemo(() => {
    const map = new Map<string, number>()
    colaboradoresList.forEach(c => {
      const key = c.gerencia || '(vazio)'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([nome, qnts]) => ({
        nome,
        qnts,
        perc: totalGeral > 0 ? (qnts / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.qnts - a.qnts || a.nome.localeCompare(b.nome))
  }, [colaboradoresList, totalGeral])

  // Agrupamento de Cargos por Área (Área como cabeçalho e seus cargos listados abaixo)
  const resumoCargosPorArea = useMemo(() => {
    const areaMap = new Map<string, { totalArea: number; cargos: Map<string, number> }>()

    colaboradoresList.forEach(c => {
      const area = (c.area || 'NÃO INFORMADA').trim().toUpperCase()
      const cargo = (c.cargo || 'NÃO DEFINIDO').trim().toUpperCase()

      if (!areaMap.has(area)) {
        areaMap.set(area, { totalArea: 0, cargos: new Map<string, number>() })
      }

      const item = areaMap.get(area)!
      item.totalArea += 1
      item.cargos.set(cargo, (item.cargos.get(cargo) || 0) + 1)
    })

    return Array.from(areaMap.entries())
      .map(([area, data]) => {
        const cargosList = Array.from(data.cargos.entries())
          .map(([cargo, qnts]) => ({
            cargo,
            qnts,
            percArea: data.totalArea > 0 ? (qnts / data.totalArea) * 100 : 0,
            percTotal: totalGeral > 0 ? (qnts / totalGeral) * 100 : 0
          }))
          .sort((a, b) => b.qnts - a.qnts || a.cargo.localeCompare(b.cargo))

        return {
          area,
          totalArea: data.totalArea,
          percTotal: totalGeral > 0 ? (data.totalArea / totalGeral) * 100 : 0,
          cargos: cargosList
        }
      })
      .sort((a, b) => b.totalArea - a.totalArea || a.area.localeCompare(b.area))
  }, [colaboradoresList, totalGeral])

  // Estado dos Filtros de Ano e Mês (para PMT Expedição/Recebimento)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(10)
  
  // Estado do Modal de Importação / Atualização PMT
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
          setSelectedFile(files[0].name)
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
  }>({})

  // Carrega dados do Supabase (ou servidor local como fallback) quando o ano ou mês mudam
  const fetchPmtData = async (year: number, month: number) => {
    setLoadingData(true)
    setPmtData({})
    try {
      // 1. Tenta carregar direto do Supabase (funciona na Vercel e fora da rede)
      const cloudSummary = await getPmtSummaryFromSupabase(year, month, '994')
      if (cloudSummary && cloudSummary.summary && (cloudSummary.summary.total_linhas || 0) > 0) {
        setPmtData(cloudSummary)
        return
      }

      // 2. Fallback para API local caso esteja rodando offline com SQLite
      const res = await fetch(`http://localhost:3001/api/pmt/summary?ano=${year}&mes=${month}&cd=994`)
      if (res.ok) {
        const json = await res.json()
        setPmtData(json ?? {})
      }
    } catch {
      // Sem conexão – exibe estado vazio
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (activePageId !== 3) {
      fetchPmtData(selectedYear, selectedMonth)
    }
  }, [selectedYear, selectedMonth, activePageId])

  // Função para executar a importação / atualização do mês PMT
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
          message: `Falha na importação: ${data.error || 'Erro desconhecido'}`
        })
      }
    } catch (err: any) {
      setImportFeedback({
        success: false,
        message: `Erro ao conectar com servidor de importação: ${err.message}`
      })
    } finally {
      setIsImporting(false)
    }
  }

  const selectedMonthName = MONTHS_LIST.find(m => m.id === selectedMonth)?.name || '10 - Outubro'
  const totalValor = pmtData.summary?.total_valor ?? 0
  const totalPecas = pmtData.summary?.total_pecas ?? 0
  const totalPedidos = pmtData.summary?.total_pedidos ?? 0
  const totalCub = pmtData.summary?.total_cub ?? 0

  // Estado de Aderência para os Cards Superiores
  const [aderenciaState, setAderenciaState] = useState<AderenciaDataState | null>(() => {
    if (selectedYear === 2026 && selectedMonth === 10) {
      return initialAderenciaOct as unknown as AderenciaDataState
    }
    return null
  })

  useEffect(() => {
    let isMounted = true
    if (selectedYear === 2026 && selectedMonth === 10) {
      setAderenciaState(initialAderenciaOct as unknown as AderenciaDataState)
    } else {
      setAderenciaState(null)
    }

    getAderenciaData(selectedYear, selectedMonth, '994').then(data => {
      if (isMounted && data) {
        // Se for Outubro/2026 e o dado do banco/cache não tiver valor, mescla com initialAderenciaOct
        if (selectedYear === 2026 && selectedMonth === 10) {
          const oct = initialAderenciaOct as unknown as AderenciaDataState
          const merged: AderenciaDataState = {
            ...data,
            liberado: {
              ...data.liberado,
              totals: {
                ...data.liberado?.totals,
                valor: (data.liberado?.totals?.valor && Object.keys(data.liberado.totals.valor).length > 0)
                  ? data.liberado.totals.valor
                  : oct.liberado.totals.valor
              }
            },
            faturado: {
              ...data.faturado,
              totals: {
                ...data.faturado?.totals,
                valor: (data.faturado?.totals?.valor && Object.keys(data.faturado.totals.valor).length > 0)
                  ? data.faturado.totals.valor
                  : oct.faturado.totals.valor
              }
            }
          }
          setAderenciaState(merged)
        } else {
          setAderenciaState(data)
        }
      }
    })

    const handleAderenciaUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AderenciaDataState>
      if (customEvent.detail && customEvent.detail.ano === selectedYear && customEvent.detail.mes === selectedMonth) {
        setAderenciaState(customEvent.detail)
      }
    }
    window.addEventListener('aderenciaDataUpdated', handleAderenciaUpdated)

    return () => { 
      isMounted = false 
      window.removeEventListener('aderenciaDataUpdated', handleAderenciaUpdated)
    }
  }, [selectedYear, selectedMonth])

  // Cálculos de Liberado, Faturado x Planejado e Projeção de Atingimento
  const kpiStats = useMemo(() => {
    const libTotals = aderenciaState?.liberado?.totals
    const fatTotals = aderenciaState?.faturado?.totals

    // 1. Liberado (Acumulados)
    const sumLiberadoValor = Object.values(libTotals?.valor || {}).reduce((a, b) => a + b, 0)
    const sumLiberadoPecas = Object.values(libTotals?.pecas || {}).reduce((a, b) => a + b, 0)
    const sumLiberadoPedidos = Object.values(libTotals?.pedidos || {}).reduce((a, b) => a + b, 0)
    const sumLiberadoCub = Object.values(libTotals?.cubagem || {}).reduce((a, b) => a + b, 0)

    // 2. Faturado (Acumulados)
    const sumFaturadoValor = Object.values(fatTotals?.valor || {}).reduce((a, b) => a + b, 0)
    const sumFaturadoPecas = Object.values(fatTotals?.pecas || {}).reduce((a, b) => a + b, 0)
    const sumFaturadoPedidos = Object.values(fatTotals?.pedidos || {}).reduce((a, b) => a + b, 0)
    const sumFaturadoCub = Object.values(fatTotals?.cubagem || {}).reduce((a, b) => a + b, 0)

    // Dias transcorridos com liberação
    const daysWithData = Object.keys(libTotals?.pedidos || {}).map(Number).filter(d => !isNaN(d) && d > 0)
    const maxDayRecorded = daysWithData.length > 0 ? Math.max(...daysWithData) : 0
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

    // Projeção: média diária realizada * total de dias do mês
    const dailyAvgValor = maxDayRecorded > 0 ? sumLiberadoValor / maxDayRecorded : 0
    const projectedValor = dailyAvgValor * totalDaysInMonth
    const percRealizedValor = totalValor > 0 ? (sumLiberadoValor / totalValor) * 100 : 0
    const percFaturadoValor = totalValor > 0 ? (sumFaturadoValor / totalValor) * 100 : 0
    const percProjectedValor = totalValor > 0 ? (projectedValor / totalValor) * 100 : 0

    const percRealizedPecas = totalPecas > 0 ? (sumLiberadoPecas / totalPecas) * 100 : 0
    const percFaturadoPecas = totalPecas > 0 ? (sumFaturadoPecas / totalPecas) * 100 : 0
    const projectedPecas = maxDayRecorded > 0 ? (sumLiberadoPecas / maxDayRecorded) * totalDaysInMonth : 0
    const percProjectedPecas = totalPecas > 0 ? (projectedPecas / totalPecas) * 100 : 0

    const percRealizedPedidos = totalPedidos > 0 ? (sumLiberadoPedidos / totalPedidos) * 100 : 0
    const percFaturadoPedidos = totalPedidos > 0 ? (sumFaturadoPedidos / totalPedidos) * 100 : 0
    const projectedPedidos = maxDayRecorded > 0 ? (sumLiberadoPedidos / maxDayRecorded) * totalDaysInMonth : 0
    const percProjectedPedidos = totalPedidos > 0 ? (projectedPedidos / totalPedidos) * 100 : 0

    const percRealizedCub = totalCub > 0 ? (sumLiberadoCub / totalCub) * 100 : 0
    const percFaturadoCub = totalCub > 0 ? (sumFaturadoCub / totalCub) * 100 : 0
    const projectedCub = maxDayRecorded > 0 ? (sumLiberadoCub / maxDayRecorded) * totalDaysInMonth : 0
    const percProjectedCub = totalCub > 0 ? (projectedCub / totalCub) * 100 : 0

    return {
      hasLiberado: sumLiberadoPedidos > 0 || sumLiberadoValor > 0,
      hasFaturado: sumFaturadoPedidos > 0 || sumFaturadoValor > 0,
      maxDayRecorded,
      totalDaysInMonth,
      // Valor
      sumLiberadoValor,
      sumFaturadoValor,
      percRealizedValor,
      percFaturadoValor,
      projectedValor,
      percProjectedValor,
      // Peças
      sumLiberadoPecas,
      sumFaturadoPecas,
      percRealizedPecas,
      percFaturadoPecas,
      projectedPecas,
      percProjectedPecas,
      // Pedidos
      sumLiberadoPedidos,
      sumFaturadoPedidos,
      percRealizedPedidos,
      percFaturadoPedidos,
      projectedPedidos,
      percProjectedPedidos,
      // Cubagem
      sumLiberadoCub,
      sumFaturadoCub,
      percRealizedCub,
      percFaturadoCub,
      projectedCub,
      percProjectedCub
    }
  }, [aderenciaState, totalValor, totalPecas, totalPedidos, totalCub, selectedYear, selectedMonth])

  const isQuadro = activePageId === 3
  const isExpedicao = activePageId === 1

  return (
    <div className={activePageId === 6 ? 'space-y-3' : 'space-y-6'}>
      {/* =========================================================================
          1. HEADER DA PÁGINA PMTS COM OS 6 MÓDULOS DE NAVEGAÇÃO
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Abas Superiores dos Módulos PMT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PMT_PAGES_CONFIG.filter(page => {
            const subId = page.id === 1 ? 'sub-pmt-expedicao' :
                          page.id === 2 ? 'sub-pmt-recebimento' :
                          page.id === 3 ? 'sub-pmt-quadro' :
                          page.id === 4 ? 'sub-pmt-promocionais' :
                          page.id === 5 ? 'sub-pmt-tableau' : 'sub-pmt-carteira-cds'
            return hasPermission('pmts', subId)
          }).map((page) => {
            const isActive = activePageId === page.id
            return (
              <button
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {page.icon}
                  </span>
                  <span className="truncate">
                    {page.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sub-páginas do menu PMT Expedição (pg1, pg2, pg3, pg4) */}
        {isExpedicao && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
              Sub-páginas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'pg1', label: 'pg1', subId: 'sub-pmt-expedicao-pg1' },
                { id: 'pg2', label: 'pg2', subId: 'sub-pmt-expedicao-pg2' },
                { id: 'pg3', label: 'pg3', subId: 'sub-pmt-expedicao-pg3' },
                { id: 'pg4', label: 'pg4', subId: 'sub-pmt-expedicao-pg4' }
              ].filter(sub => hasPermission('pmts', sub.subId)).map((sub) => {
                const isSubActive = expedicaoSubPage === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setExpedicaoSubPage(sub.id as any)}
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

        {/* Sub-páginas exclusivas do menu Quadro (Quadro TT, Pg 2, Pg 3, Pg 4) */}
        {isQuadro && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
              Sub-páginas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'dashboard', label: 'Dashboard', subId: 'sub-quadro-dashboard' },
                { id: 'pg1', label: 'Quadro TT', subId: 'sub-quadro-tt' },
                { id: 'pg2', label: 'BH', subId: 'sub-quadro-bh' },
                { id: 'pg3', label: 'Controle PADU', subId: 'sub-quadro-padu' },
                { id: 'pg4', label: 'Qd Médio', subId: 'sub-quadro-medio' },
                { id: 'pg5', label: 'Apontamento', subId: 'sub-apontamento' }
              ].filter(sub => hasPermission('pmts', sub.subId)).map((sub) => {
                const isSubActive = quadroSubPage === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setQuadroSubPage(sub.id as any)}
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
          2. FILTROS E AÇÕES DE CABEÇALHO
          - Se Dashboard ou Quadro TT: Filtros com sentido de RH/Quadro (Busca, Cargo, Centro de Custo, Status do Headcount)
          - Botões no Quadro: "Cadastrar" e "Importar Planilha (Cadastro em Massa)", SEM o botão "Atualizar"
          - Se Outros PMTs: Filtro Ano + Mês, Atualizar e Importar PMT
          ========================================================================= */}
      {activePageId !== 1 && activePageId !== 4 && activePageId !== 5 && activePageId !== 6 && (!isQuadro || quadroSubPage === 'pg1' || quadroSubPage === 'dashboard') && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {isQuadro ? (
          /* FILTROS ESPECÍFICOS DO QUADRO */
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
              <Filter size={15} className="text-blue-600" />
              <span>Filtro Quadro:</span>
            </div>

            {/* Busca por Colaborador ou ID */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou ID..."
                value={buscaColaborador}
                onChange={(e) => setBuscaColaborador(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400"
              />
              {buscaColaborador && (
                <button 
                  onClick={() => setBuscaColaborador('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filtro por Cargo (Múltipla Seleção) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'cargo' ? null : 'cargo')}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left ${
                  filtrosCargo.length > 0 
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800'
                }`}
              >
                <Briefcase size={14} className={filtrosCargo.length > 0 ? 'text-blue-600' : 'text-slate-500'} />
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                    Cargo
                  </label>
                  <span className="text-xs font-bold truncate max-w-[140px]">
                    {filtrosCargo.length === 0 
                      ? 'Todos os Cargos' 
                      : filtrosCargo.length === 1 
                        ? filtrosCargo[0] 
                        : `${filtrosCargo.length} selecionados`}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'cargo' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'cargo' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Filtrar por Cargos</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltrosCargo([...listaCargos])}
                          className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFiltrosCargo([])}
                          className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {listaCargos.map((cargo) => {
                        const isChecked = filtrosCargo.includes(cargo)
                        return (
                          <label
                            key={cargo}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFiltrosCargo(filtrosCargo.filter(c => c !== cargo))
                                } else {
                                  setFiltrosCargo([...filtrosCargo, cargo])
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                              {cargo}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtro por Centro de Custo (Múltipla Seleção) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'cc' ? null : 'cc')}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left ${
                  filtrosCentroCusto.length > 0 
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800'
                }`}
              >
                <Building2 size={14} className={filtrosCentroCusto.length > 0 ? 'text-blue-600' : 'text-slate-500'} />
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                    Centro de Custo
                  </label>
                  <span className="text-xs font-bold truncate max-w-[140px]">
                    {filtrosCentroCusto.length === 0 
                      ? 'Todos os Centros' 
                      : filtrosCentroCusto.length === 1 
                        ? filtrosCentroCusto[0] 
                        : `${filtrosCentroCusto.length} selecionados`}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'cc' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'cc' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Filtrar Centros de Custo</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltrosCentroCusto([...listaCentrosCusto])}
                          className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Marcar Todos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFiltrosCentroCusto([])}
                          className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {listaCentrosCusto.map((cc) => {
                        const isChecked = filtrosCentroCusto.includes(cc)
                        return (
                          <label
                            key={cc}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFiltrosCentroCusto(filtrosCentroCusto.filter(c => c !== cc))
                                } else {
                                  setFiltrosCentroCusto([...filtrosCentroCusto, cc])
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                              {cc}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtro por Gerência (Múltipla Seleção) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'gerencia' ? null : 'gerencia')}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left ${
                  filtrosGerencia.length > 0 
                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-800'
                }`}
              >
                <Layers size={14} className={filtrosGerencia.length > 0 ? 'text-indigo-600' : 'text-slate-500'} />
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                    Gerência
                  </label>
                  <span className="text-xs font-bold truncate max-w-[140px]">
                    {filtrosGerencia.length === 0 
                      ? 'Todas as Gerências' 
                      : filtrosGerencia.length === 1 
                        ? filtrosGerencia[0] 
                        : `${filtrosGerencia.length} selecionadas`}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'gerencia' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'gerencia' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Filtrar Gerências</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltrosGerencia([...listaGerencias])}
                          className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                        >
                          Marcar Todas
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFiltrosGerencia([])}
                          className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {listaGerencias.map((ger) => {
                        const isChecked = filtrosGerencia.includes(ger)
                        return (
                          <label
                            key={ger}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFiltrosGerencia(filtrosGerencia.filter(g => g !== ger))
                                } else {
                                  setFiltrosGerencia([...filtrosGerencia, ger])
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                              {ger}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtro por Área (Múltipla Seleção) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left ${
                  filtrosArea.length > 0 
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800'
                }`}
              >
                <Building2 size={14} className={filtrosArea.length > 0 ? 'text-blue-600' : 'text-slate-500'} />
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                    Área
                  </label>
                  <span className="text-xs font-bold truncate max-w-[140px]">
                    {filtrosArea.length === 0 
                      ? 'Todas as Áreas' 
                      : filtrosArea.length === 1 
                        ? filtrosArea[0] 
                        : `${filtrosArea.length} selecionadas`}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'area' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'area' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Filtrar Áreas</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltrosArea([...listaAreas])}
                          className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Marcar Todas
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFiltrosArea([])}
                          className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {listaAreas.map((area) => {
                        const isChecked = filtrosArea.includes(area)
                        return (
                          <label
                            key={area}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFiltrosArea(filtrosArea.filter(a => a !== area))
                                } else {
                                  setFiltrosArea([...filtrosArea, area])
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                              {area}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filtro por Situação Sistema (Múltipla Seleção) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'situacao' ? null : 'situacao')}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all cursor-pointer text-left ${
                  filtrosSituacao.length > 0 
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-400 text-slate-800'
                }`}
              >
                <ShieldCheck size={14} className={filtrosSituacao.length > 0 ? 'text-emerald-600' : 'text-slate-500'} />
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
                    Situação Sistema
                  </label>
                  <span className="text-xs font-bold truncate max-w-[140px]">
                    {filtrosSituacao.length === 0 
                      ? 'Todas as Situações' 
                      : filtrosSituacao.length === 1 
                        ? filtrosSituacao[0] 
                        : `${filtrosSituacao.length} selecionadas`}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'situacao' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'situacao' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Filtrar Situação Sistema</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltrosSituacao([...listaSituacoes])}
                          className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                        >
                          Marcar Todas
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFiltrosSituacao([])}
                          className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {listaSituacoes.map((situacao) => {
                        const isChecked = filtrosSituacao.includes(situacao)
                        return (
                          <label
                            key={situacao}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFiltrosSituacao(filtrosSituacao.filter(s => s !== situacao))
                                } else {
                                  setFiltrosSituacao([...filtrosSituacao, situacao])
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-emerald-900' : 'text-slate-700'}`}>
                              {situacao}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tag de Resumo do Quadro */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-slate-600">
                Efetivo Total: <strong className="text-blue-700 font-bold">{colaboradoresList.length}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px]">
                Exibindo: <strong className="text-slate-800">{filteredColaboradores.length}</strong>
              </span>
            </div>
          </div>
        ) : (
          /* FILTROS PADRÃO DOS DEMAIS PMTS */
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
              <Filter size={16} className="text-blue-600" />
              <span>Filtro PMT:</span>
            </div>

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
        )}

        {/* BOTÕES DE AÇÃO À DIREITA */}
        <div className="flex items-center gap-2 shrink-0">
          {isQuadro ? null : (
            /* BOTÕES DOS DEMAIS PMTS */
            <>
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
            </>
          )}
        </div>
      </div>
      )}

      {/* =========================================================================
          3. REGIÃO DO MEIO (CONTEÚDO PRINCIPAL)
          - No Quadro: Adaptada para fazer total sentido com o Quadro de Colaboradores
            (Efetivo Total CD 994, Total de Cargos, Total de Centros de Custo, Conferentes & Operacionais,
             Distribuição por Cargos, Tabela e Ações)
          - Nos demais PMTs: Métricas padrão e Indicador Diário por Modal
          ========================================================================= */}
      {isQuadro ? (
        quadroSubPage === 'dashboard' ? (
          /* =========================================================================
             SUB-PÁGINA DASHBOARD: CARDS DE MÉTRICAS + TABELAS DINÂMICAS CONSOLIDADAS
             ========================================================================= */
          <div className="space-y-6">
            {/* CARDS COM SENTIDO DO QUADRO DE COLABORADORES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Efetivo Total Cadastrado */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Efetivo Cadastrado (CD 994)</span>
                  <span className="p-1 rounded bg-blue-100 text-blue-700">
                    <Users size={15} />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {colaboradoresList.length} <span className="text-sm font-semibold text-slate-500">colaboradores</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <UserCheck size={12} className="text-emerald-500" />
                  <span>Base ativa do Quadro TT</span>
                </p>
              </div>

              {/* Card 2: Total de Cargos Diferentes */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Funções / Cargos</span>
                  <span className="p-1 rounded bg-purple-100 text-purple-700">
                    <Briefcase size={15} />
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-700 tracking-tight">
                  {listaCargos.length} <span className="text-sm font-semibold text-slate-500">cargos mapeados</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Segmentação funcional da equipe
                </p>
              </div>

              {/* Card 3: Centros de Custo */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Centros de Custo Ativos</span>
                  <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <Building2 size={15} />
                  </span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 tracking-tight">
                  {listaCentrosCusto.length} <span className="text-sm font-semibold text-slate-500">áreas de lotação</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lotações e setores do CD 994
                </p>
              </div>

              {/* Card 4: Operacionais & Conferentes */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operacional & Conferência</span>
                  <span className="p-1 rounded bg-amber-100 text-amber-700">
                    <Boxes size={15} />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">
                  {colaboradoresList.filter(c => c.cargo.includes('CONFERENTE') || c.cargo.includes('OPERADOR') || c.cargo.includes('OP')).length} <span className="text-sm font-semibold text-slate-500">operacionais</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Equipe chave de movimentação
                </p>
              </div>
            </div>

            {/* RESUMO CONSOLIDADO COMPACTO EM TABELAS DINÂMICAS: CARGOS | CENTRO DE CUSTO | GERÊNCIA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Distribuição Consolidada do Efetivo - Quadro TT (CD 994)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Visão comparativa compacta por Cargo, Centro de Custo e Gerência. Selecione uma ou mais linhas para filtrar os dados.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(filtrosCargo.length > 0 || filtrosCentroCusto.length > 0 || filtrosGerencia.length > 0 || filtrosArea.length > 0 || filtrosSituacao.length > 0) && (
                    <button
                      onClick={() => {
                        setFiltrosCargo([])
                        setFiltrosCentroCusto([])
                        setFiltrosGerencia([])
                        setFiltrosArea([])
                        setFiltrosSituacao([])
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer px-2 py-1 rounded bg-blue-50 border border-blue-200"
                    >
                      Limpar Filtros Ativos ({filtrosCargo.length + filtrosCentroCusto.length + filtrosGerencia.length + filtrosArea.length + filtrosSituacao.length})
                    </button>
                  )}
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    Total Geral: {totalGeral}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* TABELA 1: CARGOS */}
                <div className="border border-sky-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-sky-100/90 border-b border-sky-200 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Briefcase size={13} className="text-sky-700" />
                      Cargos {filtrosCargo.length > 0 && `(${filtrosCargo.length})`}
                    </span>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-sky-900 font-mono">
                      <span className="w-12 text-right">QNTs</span>
                      <span className="w-14 text-right">%</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {resumoCargos.map((item) => {
                      const isSelected = filtrosCargo.includes(item.nome)
                      return (
                        <div
                          key={item.nome}
                          onClick={() => {
                            if (isSelected) {
                              setFiltrosCargo(filtrosCargo.filter(c => c !== item.nome))
                            } else {
                              setFiltrosCargo([...filtrosCargo, item.nome])
                            }
                          }}
                          title={`Clique para ${isSelected ? 'remover' : 'adicionar'} filtro: ${item.nome}`}
                          className={`flex items-center justify-between px-2.5 py-1 cursor-pointer transition-colors text-[10.5px] ${
                            isSelected
                              ? 'bg-blue-100/90 font-bold text-blue-900'
                              : 'hover:bg-sky-50/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none scale-85"
                            />
                            <span className="truncate font-medium" title={item.nome}>
                              {item.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono shrink-0 font-semibold text-[10.5px]">
                            <span className="w-10 text-right text-slate-800">{item.qnts}</span>
                            <span className="w-12 text-right text-slate-600">
                              {item.perc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé TT Geral */}
                  <div className="bg-sky-100/90 border-t border-sky-200 px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-sky-950 font-mono">
                    <span>TT Geral</span>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">{totalGeral}</span>
                      <span className="w-12 text-right">100,00%</span>
                    </div>
                  </div>
                </div>

                {/* TABELA 2: CENTRO DE CUSTO */}
                <div className="border border-sky-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-sky-100/90 border-b border-sky-200 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Building2 size={13} className="text-sky-700" />
                      Centro de Custo {filtrosCentroCusto.length > 0 && `(${filtrosCentroCusto.length})`}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-sky-900 font-mono">
                      <span className="w-10 text-right">QNTs</span>
                      <span className="w-12 text-right">%</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {resumoCentrosCusto.map((item) => {
                      const isSelected = filtrosCentroCusto.includes(item.nome)
                      return (
                        <div
                          key={item.nome}
                          onClick={() => {
                            if (isSelected) {
                              setFiltrosCentroCusto(filtrosCentroCusto.filter(c => c !== item.nome))
                            } else {
                              setFiltrosCentroCusto([...filtrosCentroCusto, item.nome])
                            }
                          }}
                          title={`Clique para ${isSelected ? 'remover' : 'adicionar'} filtro: ${item.nome}`}
                          className={`flex items-center justify-between px-2.5 py-1 cursor-pointer transition-colors text-[10.5px] ${
                            isSelected
                              ? 'bg-blue-100/90 font-bold text-blue-900'
                              : 'hover:bg-sky-50/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none scale-85"
                            />
                            <span className="truncate font-medium" title={item.nome}>
                              {item.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono shrink-0 font-semibold text-[10.5px]">
                            <span className="w-10 text-right text-slate-800">{item.qnts}</span>
                            <span className="w-12 text-right text-slate-600">
                              {item.perc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé TT Geral */}
                  <div className="bg-sky-100/90 border-t border-sky-200 px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-sky-950 font-mono">
                    <span>TT Geral</span>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">{totalGeral}</span>
                      <span className="w-12 text-right">100,00%</span>
                    </div>
                  </div>
                </div>

                {/* TABELA 3: GERÊNCIA */}
                <div className="border border-sky-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-sky-100/90 border-b border-sky-200 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Layers size={13} className="text-sky-700" />
                      Gerência {filtrosGerencia.length > 0 && `(${filtrosGerencia.length})`}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-sky-900 font-mono">
                      <span className="w-10 text-right">QNTs</span>
                      <span className="w-12 text-right">%</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {resumoGerencias.map((item) => {
                      const isSelected = filtrosGerencia.includes(item.nome)
                      return (
                        <div
                          key={item.nome}
                          onClick={() => {
                            if (isSelected) {
                              setFiltrosGerencia(filtrosGerencia.filter(g => g !== item.nome))
                            } else {
                              setFiltrosGerencia([...filtrosGerencia, item.nome])
                            }
                          }}
                          title={`Clique para ${isSelected ? 'remover' : 'adicionar'} filtro: ${item.nome}`}
                          className={`flex items-center justify-between px-2.5 py-1 cursor-pointer transition-colors text-[10.5px] ${
                            isSelected
                              ? 'bg-blue-100/90 font-bold text-blue-900'
                              : 'hover:bg-sky-50/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-slate-300 text-indigo-600 focus:ring-blue-500 cursor-pointer pointer-events-none scale-85"
                            />
                            <span className="truncate font-medium" title={item.nome}>
                              {item.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono shrink-0 font-semibold text-[10.5px]">
                            <span className="w-10 text-right text-slate-800">{item.qnts}</span>
                            <span className="w-12 text-right text-slate-600">
                              {item.perc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé TT Geral */}
                  <div className="bg-sky-100/90 border-t border-sky-200 px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-sky-950 font-mono">
                    <span>TT Geral</span>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">{totalGeral}</span>
                      <span className="w-12 text-right">100,00%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO AGRUPADA: CARGOS POR ÁREA (Área como Cabeçalho e Cargos Listados Abaixo) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span>Distribuição de Cargos por Área</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Visão agrupada com cada Área como cabeçalho e os respectivos cargos com quantidades e percentuais.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {filtrosArea.length > 0 && (
                    <button
                      onClick={() => setFiltrosArea([])}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200"
                    >
                      Limpar Filtro de Área ({filtrosArea.length})
                    </button>
                  )}
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-800">
                    {resumoCargosPorArea.length} Áreas Mapeadas
                  </span>
                </div>
              </div>

              {/* Grid de Cards de Áreas com seus Cargos */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                {resumoCargosPorArea
                  .filter(grupo => filtrosArea.length === 0 || filtrosArea.includes(grupo.area))
                  .map((grupo) => {
                    const isAreaSelected = filtrosArea.includes(grupo.area)
                    return (
                      <div
                        key={grupo.area}
                        className={`rounded-xl border overflow-hidden transition-all shadow-2xs ${
                          isAreaSelected
                            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        {/* Cabeçalho da Área */}
                        <div
                          onClick={() => {
                            if (isAreaSelected) {
                              setFiltrosArea(filtrosArea.filter(a => a !== grupo.area))
                            } else {
                              setFiltrosArea([...filtrosArea, grupo.area])
                            }
                          }}
                          title={`Clique para ${isAreaSelected ? 'remover' : 'aplicar'} filtro nesta área`}
                          className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b transition-colors ${
                            isAreaSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <input
                              type="checkbox"
                              checked={isAreaSelected}
                              readOnly
                              className={`rounded border-slate-300 cursor-pointer pointer-events-none scale-90 ${
                                isAreaSelected ? 'accent-white text-indigo-600' : 'text-indigo-600'
                              }`}
                            />
                            <span className="font-bold text-xs uppercase tracking-tight truncate" title={grupo.area}>
                              {grupo.area}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] font-bold shrink-0">
                            <span className={`px-2 py-0.5 rounded-md ${isAreaSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-800'}`}>
                              {grupo.totalArea} colab.
                            </span>
                            <span className={`text-[10px] ${isAreaSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {grupo.percTotal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </span>
                          </div>
                        </div>

                        {/* Lista de Cargos dentro da Área */}
                        <div className="divide-y divide-slate-100 text-xs max-h-64 overflow-y-auto">
                          {grupo.cargos.map((cargoItem) => {
                            const isCargoSelected = filtrosCargo.includes(cargoItem.cargo)
                            return (
                              <div
                                key={cargoItem.cargo}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isCargoSelected) {
                                    setFiltrosCargo(filtrosCargo.filter(c => c !== cargoItem.cargo))
                                  } else {
                                    setFiltrosCargo([...filtrosCargo, cargoItem.cargo])
                                  }
                                }}
                                title={`Filtrar pelo cargo: ${cargoItem.cargo}`}
                                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-[11px] transition-colors ${
                                  isCargoSelected
                                    ? 'bg-blue-100 font-bold text-blue-900'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <Briefcase size={12} className={isCargoSelected ? 'text-blue-700' : 'text-slate-400'} />
                                  <span className="truncate font-medium" title={cargoItem.cargo}>
                                    {cargoItem.cargo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 font-mono shrink-0 font-semibold text-[10.5px]">
                                  <span className="w-8 text-right text-slate-800">{cargoItem.qnts}</span>
                                  <span className="w-12 text-right text-slate-500" title={`${cargoItem.percArea.toFixed(1)}% da Área`}>
                                    {cargoItem.percArea.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        ) : quadroSubPage === 'pg1' ? (
          /* =========================================================================
             SUB-PÁGINA QUADRO TT: TABELA COMPLETA DE COLABORADORES
             ========================================================================= */
          <div className="space-y-6">
            {/* TABELA DETALHADA DO QUADRO DE COLABORADORES */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                      Quadro de Colaboradores (Quadro TT)
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Banco de Dados Ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Registros salvos em tabela de Banco de Dados com ID, Contratado, Cargo, Centro de Custo e Situação Sistema ({filteredColaboradores.length} exibidos)
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Sincronização em Tempo Real Ativa</span>
                  </span>
                </div>
              </div>

              {filteredColaboradores.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Nenhum colaborador encontrado</p>
                  <p className="text-xs text-slate-400">Verifique os filtros selecionados ou cadastre colaboradores na tela de Controle de Usuários & Permissões.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3 w-28">ID</th>
                        <th className="p-3">Contratado</th>
                        <th className="p-3">Cargo</th>
                        <th className="p-3">Centro de Custo</th>
                        <th className="p-3">Área</th>
                        <th className="p-3">Situação Sistema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredColaboradores.map((colab) => {
                        const isCurrentColab = 
                          (currentUser?.colaborador_id && String(currentUser.colaborador_id) === String(colab.id)) ||
                          (currentUser?.id && String(currentUser.id) === String(colab.id)) ||
                          (currentUser?.name && colab.contratado && currentUser.name.toLowerCase().trim() === colab.contratado.toLowerCase().trim())
                        
                        let colabAvatar = isCurrentColab && currentUser?.avatar_url ? currentUser.avatar_url : ''
                        if (!colabAvatar) {
                          try {
                            const storedUsers = localStorage.getItem('magalog_users_list')
                            if (storedUsers) {
                              const list = JSON.parse(storedUsers)
                              const found = list.find((u: any) => 
                                (u.colaborador_id && String(u.colaborador_id) === String(colab.id)) ||
                                (u.id && String(u.id) === String(colab.id)) ||
                                (u.name && colab.contratado && u.name.toLowerCase().trim() === colab.contratado.toLowerCase().trim())
                              )
                              if (found?.avatar_url) colabAvatar = found.avatar_url
                            }
                          } catch {}
                        }

                        return (
                          <tr key={colab.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="p-3 font-mono font-bold text-blue-700">{colab.id}</td>
                            <td className="p-3 font-bold text-slate-800">
                              <div className="flex items-center gap-2.5">
                                <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs border border-slate-200">
                                  {colabAvatar ? (
                                    <img src={colabAvatar} alt={colab.contratado} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{(colab.contratado || 'CO').slice(0, 2).toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="truncate">{colab.contratado}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 uppercase text-[11px] font-semibold">{colab.cargo}</td>
                            <td className="p-3 text-slate-600 uppercase text-[11px] font-semibold">{colab.centroDeCusto}</td>
                            <td className="p-3">
                              {colab.area ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {colab.area}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                (colab.situacaoSistema || '').toLowerCase().includes('atividade normal')
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : (colab.situacaoSistema || '').toLowerCase().includes('férias') || (colab.situacaoSistema || '').toLowerCase().includes('ferias')
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                    : (colab.situacaoSistema || '').toLowerCase().includes('licença') || (colab.situacaoSistema || '').toLowerCase().includes('licenca') || (colab.situacaoSistema || '').toLowerCase().includes('maternidade')
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                      : (colab.situacaoSistema || '').toLowerCase().includes('auxílio') || (colab.situacaoSistema || '').toLowerCase().includes('doença')
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {colab.situacaoSistema || 'Em Atividade Normal'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    </table>
                </div>
              )}
            </div>
          </div>
        ) : quadroSubPage === 'pg2' ? (
          /* PÁGINA DEDICADA DO BANCO DE HORAS (BH) DENTRO DO QUADRO */
          <div className="pt-1">
            <BankHoursPage />
          </div>
        ) : quadroSubPage === 'pg3' ? (
          /* =========================================================================
             SUB-PÁGINA: CONTROLE PADU (INTEGRAÇÃO EXTERNA EMBUTIDA)
             ========================================================================= */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Barra Superior Informativa com Controles */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <LayoutDashboard size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Recrutamento e Seleção • Controle PADU
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Ao Vivo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    https://controlepadu.netlify.app
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://controlepadu.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir em nova aba caso prefira tela cheia externa"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:text-blue-700"
                >
                  <ExternalLink size={13} />
                  <span>Abrir em Nova Aba</span>
                </a>
              </div>
            </div>

            {/* Container Iframe Responsivo em Altura Otimizada */}
            <div className="w-full relative bg-slate-100" style={{ height: 'calc(100vh - 210px)', minHeight: '680px' }}>
              <iframe
                src="https://controlepadu.netlify.app"
                title="Controle PADU - Recrutamento e Seleção"
                className="w-full h-full border-0 rounded-b-2xl bg-white"
                loading="lazy"
                allow="fullscreen"
              />
            </div>
          </div>
        ) : quadroSubPage === 'pg4' ? (
          /* PÁGINA QUADRO MÉDIO (PG 4) - MODELO DE GRADE COM CÁLCULOS DINÂMICOS */
          <QuadroMedioTable />
        ) : quadroSubPage === 'pg5' ? (
          /* PÁGINA DE APONTAMENTO DIÁRIO (PG 5) - LANÇAMENTOS, DSR E BH */
          <ApontamentoPage />
        ) : (
          /* DEMAIS PÁGINAS DEDICADAS DO QUADRO SE HOUVER */
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <FileSpreadsheet size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Quadro de Colaboradores &bull; {quadroSubPage.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500">
                Esta página ({quadroSubPage.toUpperCase()}) está reservada para métricas e dados complementares específicos deste módulo.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQuadroSubPage('pg1')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Users size={14} />
                <span>Ir para Quadro TT (Base Completa)</span>
              </button>
            </div>
          </div>
        )
      ) : activePageId === 4 ? (
        /* PÁGINA 4: PROMICIONAIS (CONECTADA À PLANILHA GOOGLE NA ABA NE/NO/CO) */
        <PromocionaisTable />
      ) : activePageId === 5 ? (
        /* PÁGINA 5: TABLEAU INDICADORES (PAINEL EMBUTIDO DO BI LUIZALABS) */
        <TableauIndicadoresPage />
      ) : activePageId === 6 ? (
        /* PÁGINA 6: CARTEIRA CDS (LOOKER STUDIO EMBED / PAINEL OPERACIONAL) */
        <LookerCarteiraPage />
      ) : (isExpedicao && expedicaoSubPage !== 'pg1') ? (
        /* PÁGINAS EM CONSTRUÇÃO APENAS PARA DEMAIS SUB-PÁGINAS DO PMT EXPEDIÇÃO (pg2, pg3, pg4) */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Truck size={30} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 text-[11px] font-bold font-mono">
              PMT Expedição &bull; {expedicaoSubPage.toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Página {expedicaoSubPage.toUpperCase()} em Construção
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Esta subpágina está reservada para relatórios e indicadores operacionais complementares da Expedição.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            {(['pg1', 'pg2', 'pg3', 'pg4'] as const).map(pg => (
              <button
                key={pg}
                type="button"
                onClick={() => setExpedicaoSubPage(pg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  expedicaoSubPage === pg
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-blue-50/60 hover:text-blue-700 border-slate-200'
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* CONTEÚDO PADRÃO PARA DEMAIS SUB-PÁGINAS PMT (Recebimento, etc.) */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* INDICADOR DIÁRIO POR MODAL COM CONTROLES ACIMA DOS CARDS */}
          <PmtDailyMatrixTable 
            ano={selectedYear} 
            mes={selectedMonth} 
            cd="994" 
            pageTitle={activePage.label} 
            onAderenciaChange={setAderenciaState}
            cardsContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: VALOR */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Planejado (CD 994)</span>
                      <span className="p-1 rounded-md bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">R$</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {totalValor ? `R$ ${(totalValor / 1_000_000).toFixed(1)}M` : 'R$ 0,00'}
                      </div>
                      {kpiStats.hasLiberado && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          kpiStats.percRealizedValor >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {kpiStats.percRealizedValor.toFixed(1)}% lib.
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 font-mono">
                      Meta: R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {kpiStats.hasLiberado || kpiStats.hasFaturado ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                      {/* Liberado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Liberado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800 font-mono">
                            R$ {(kpiStats.sumLiberadoValor / 1_000_000).toFixed(1)}M
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {kpiStats.percRealizedValor.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Faturado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Faturado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-800 font-mono">
                            R$ {(kpiStats.sumFaturadoValor / 1_000_000).toFixed(1)}M
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            {kpiStats.percFaturadoValor.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de progresso da Liberação */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(kpiStats.percRealizedValor, 100)}%` }} 
                        />
                      </div>

                      {/* Projeção */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp size={12} className={kpiStats.percProjectedValor >= 100 ? 'text-emerald-500' : 'text-amber-500'} />
                          Projeção Lib.:
                        </span>
                        <span className={`font-bold font-mono ${
                          kpiStats.percProjectedValor >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          R$ {(kpiStats.projectedValor / 1_000_000).toFixed(1)}M ({kpiStats.percProjectedValor.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                      Aguardando importação
                    </p>
                  )}
                </div>

                {/* CARD 2: VOLUME DE PEÇAS */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volume de Peças</span>
                      <Package size={15} className="text-blue-600" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-blue-600 tracking-tight">
                        {Math.round(totalPecas).toLocaleString('pt-BR')}
                      </div>
                      {kpiStats.hasLiberado && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          kpiStats.percRealizedPecas >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {kpiStats.percRealizedPecas.toFixed(1)}% lib.
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Peças planejadas para {selectedMonth}/{selectedYear}
                    </p>
                  </div>

                  {kpiStats.hasLiberado || kpiStats.hasFaturado ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                      {/* Liberado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Liberado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800 font-mono">
                            {Math.round(kpiStats.sumLiberadoPecas).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {kpiStats.percRealizedPecas.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Faturado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Faturado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-800 font-mono">
                            {Math.round(kpiStats.sumFaturadoPecas).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            {kpiStats.percFaturadoPecas.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(kpiStats.percRealizedPecas, 100)}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp size={12} className={kpiStats.percProjectedPecas >= 100 ? 'text-emerald-500' : 'text-amber-500'} />
                          Projeção Lib.:
                        </span>
                        <span className={`font-bold font-mono ${
                          kpiStats.percProjectedPecas >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {Math.round(kpiStats.projectedPecas).toLocaleString('pt-BR')} ({kpiStats.percProjectedPecas.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                      Aguardando importação
                    </p>
                  )}
                </div>

                {/* CARD 3: TOTAL DE PEDIDOS */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</span>
                      <Boxes size={15} className="text-emerald-600" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {Math.round(totalPedidos).toLocaleString('pt-BR')}
                      </div>
                      {kpiStats.hasLiberado && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          kpiStats.percRealizedPedidos >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {kpiStats.percRealizedPedidos.toFixed(1)}% lib.
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Pedidos programados CD 994
                    </p>
                  </div>

                  {kpiStats.hasLiberado || kpiStats.hasFaturado ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                      {/* Liberado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Liberado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800 font-mono">
                            {Math.round(kpiStats.sumLiberadoPedidos).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {kpiStats.percRealizedPedidos.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Faturado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Faturado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-800 font-mono">
                            {Math.round(kpiStats.sumFaturadoPedidos).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            {kpiStats.percFaturadoPedidos.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(kpiStats.percRealizedPedidos, 100)}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp size={12} className={kpiStats.percProjectedPedidos >= 100 ? 'text-emerald-500' : 'text-amber-500'} />
                          Projeção Lib.:
                        </span>
                        <span className={`font-bold font-mono ${
                          kpiStats.percProjectedPedidos >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {Math.round(kpiStats.projectedPedidos).toLocaleString('pt-BR')} ({kpiStats.percProjectedPedidos.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                      Aguardando importação
                    </p>
                  )}
                </div>

                {/* CARD 4: CUBAGEM TOTAL */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cubagem Total (m³)</span>
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {Math.round(totalCub).toLocaleString('pt-BR')} m³
                      </div>
                      {kpiStats.hasLiberado && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          kpiStats.percRealizedCub >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {kpiStats.percRealizedCub.toFixed(1)}% lib.
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Base geral: {pmtData.totalGeralLinhas?.toLocaleString('pt-BR')} linhas
                    </p>
                  </div>

                  {kpiStats.hasLiberado || kpiStats.hasFaturado ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                      {/* Liberado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Liberado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800 font-mono">
                            {Math.round(kpiStats.sumLiberadoCub).toLocaleString('pt-BR')} m³
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {kpiStats.percRealizedCub.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Faturado x Planejado */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Faturado:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-800 font-mono">
                            {Math.round(kpiStats.sumFaturadoCub).toLocaleString('pt-BR')} m³
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            {kpiStats.percFaturadoCub.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(kpiStats.percRealizedCub, 100)}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp size={12} className={kpiStats.percProjectedCub >= 100 ? 'text-emerald-500' : 'text-amber-500'} />
                          Projeção Lib.:
                        </span>
                        <span className={`font-bold font-mono ${
                          kpiStats.percProjectedCub >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {Math.round(kpiStats.projectedCub).toLocaleString('pt-BR')} m³ ({kpiStats.percProjectedCub.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                      Aguardando importação
                    </p>
                  )}
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* =========================================================================
          4. MODAL: IMPORTAR PLANILHA PARA CADASTRO EM MASSA DE COLABORADORES (QUADRO)
          ========================================================================= */}
      {isImportColaboradoresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importar Planilha de Colaboradores</h3>
                  <p className="text-xs text-slate-500">Cadastre a equipe em massa através de arquivo Excel (.xlsx, .xls) ou CSV</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsImportColaboradoresModalOpen(false); setBulkFeedback(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Opção de Baixar Modelo */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet size={18} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">Precisa da planilha modelo?</p>
                    <p className="text-[11px] text-blue-700/80">Baixe o modelo com as colunas ID, CONTRATADO, CARGO e CENTRO DE CUSTO.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>Baixar Modelo</span>
                </button>
              </div>

              {/* Área de Seleção de Arquivo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-blue-600" />
                  Selecione o arquivo no seu computador
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <UploadCloud size={28} className="mx-auto text-blue-500" />
                  {bulkFileName ? (
                    <div>
                      <p className="text-xs font-bold text-blue-700">{bulkFileName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Clique para escolher outro arquivo se desejar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">Clique para selecionar a planilha (.xlsx, .xls, .csv)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mapeamento automático de colunas: ID, Contratado, Cargo e Centro de Custo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Opção Substituir ou Incrementar com Bloqueio de Duplicados */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={replaceExistingColab}
                    onChange={(e) => setReplaceExistingColab(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Substituir toda a lista atual de colaboradores
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Se marcado, apaga a lista anterior e insere os registros da planilha (sem duplicados). Se desmarcado, adiciona apenas novos colaboradores e ignora quem já estiver cadastrado.
                    </span>
                  </div>
                </label>
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Proteção contra duplicados: Registros com mesmo ID ou Nome idêntico são automaticamente desduplicados e bloqueados.</span>
                </div>
              </div>

              {/* Feedback de Importação */}
              {bulkFeedback && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  bulkFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {bulkFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold">{bulkFeedback.message}</span>
                </div>
              )}

              {/* Pré-visualização dos Primeiros 5 Registros Identificados */}
              {bulkParsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Prévia dos Colaboradores ({bulkParsedData.length} registros)</span>
                    <span className="text-emerald-600 font-semibold font-mono text-[11px]">Pronto para importar</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Cargo</th>
                          <th className="p-2">Centro de Custo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkParsedData.slice(0, 5).map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-700 font-bold">{c.id}</td>
                            <td className="p-2 font-semibold text-slate-800">{c.contratado}</td>
                            <td className="p-2 text-slate-600">{c.cargo}</td>
                            <td className="p-2 text-slate-600">{c.centroDeCusto}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkParsedData.length > 5 && (
                    <p className="text-[10px] text-slate-400 text-right">+ {bulkParsedData.length - 5} colaboradores adicionais</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsImportColaboradoresModalOpen(false); setBulkFeedback(null); }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={bulkParsedData.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Cadastrar {bulkParsedData.length > 0 ? `(${bulkParsedData.length})` : ''} em Massa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAL: IMPORTAR / ATUALIZAR PLANILHA PMT (Opção de atualizar mês específico)
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

              {/* Substituir base completa do mês */}
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
                  {importFeedback.success ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold">{importFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setImportFeedback(null); }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || !selectedFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Importando Dados...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Importar Planilha PMT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL DE CADASTRO INDIVIDUAL: QUADRO PG 1
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
                  <p className="text-xs text-slate-500">Preencha os campos obrigatórios do Quadro ({quadroSubPage.toUpperCase()})</p>
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

      {/* =========================================================================
          8. MODAL DE EDIÇÃO E VISUALIZAÇÃO COMPLETA: MODELO PESSOAS (MODELO 1.XLSX)
          Exibe todas as informações cadastrais em uma página única e ampla
          ========================================================================= */}
      {isEditModalOpen && editingColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-5 md:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{editingColaborador.contratado || 'Colaborador'}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-bold">
                      MATRÍCULA / ID: {editingColaborador.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ficha cadastral completa com todos os dados do formato <span className="font-semibold text-slate-700">Modelo Pessoas (Modelo 1)</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingColaborador(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário de Edição - Todas as seções em uma única página */}
            <form onSubmit={handleSalvarEdicao} className="flex flex-col flex-1 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 md:pr-2 space-y-5 flex-1">
                
                {/* SEÇÃO 1: DADOS PRINCIPAIS & LOTAÇÃO */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Dados Principais & Lotação</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">ID / Matrícula</label>
                      <input
                        type="text"
                        disabled
                        value={editingColaborador.id}
                        className="w-full bg-slate-200/70 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                      <label className="text-[11px] font-bold text-slate-700">Nome do Contratado</label>
                      <input
                        type="text"
                        required
                        value={editingColaborador.contratado}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, contratado: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Cargo Atual</label>
                      <input
                        type="text"
                        required
                        value={editingColaborador.cargo}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, cargo: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Cargo Anterior</label>
                      <input
                        type="text"
                        value={editingColaborador.cargoAnterior || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, cargoAnterior: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">CD</label>
                      <input
                        type="text"
                        value={editingColaborador.cd || '6994'}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, cd: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Centro de Custo</label>
                      <input
                        type="text"
                        value={editingColaborador.centroDeCusto}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, centroDeCusto: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">Cód. Centro Custo</label>
                      <input
                        type="text"
                        value={editingColaborador.codCentroCusto || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, codCentroCusto: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Gerência</label>
                      <input
                        type="text"
                        value={editingColaborador.gerencia || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, gerencia: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Situação Sistema</label>
                      <select
                        value={editingColaborador.situacaoSistema || 'Em Atividade Normal'}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, situacaoSistema: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        {LISTA_SITUACAO_SISTEMA_OPCOES.map((sit) => (
                          <option key={sit} value={sit}>
                            {sit}
                          </option>
                        ))}
                        {editingColaborador.situacaoSistema && !LISTA_SITUACAO_SISTEMA_OPCOES.includes(editingColaborador.situacaoSistema as any) && (
                          <option value={editingColaborador.situacaoSistema}>
                            {editingColaborador.situacaoSistema}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: LIDERANÇA, TURNO & SETOR */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">2</span>
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Liderança, Turno & Setor</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">ID Líder</label>
                      <input
                        type="text"
                        list="pmt-lideres-id-list"
                        value={editingColaborador.idLider || ''}
                        onChange={(e) => {
                          const newId = e.target.value
                          const found = listaLideresOpcoes.find(l => l.id.toLowerCase() === newId.trim().toLowerCase())
                          setEditingColaborador({
                            ...editingColaborador,
                            idLider: newId,
                            nomeLider: found ? found.nome : editingColaborador.nomeLider
                          })
                        }}
                        placeholder="Ex: 204403"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                      <datalist id="pmt-lideres-id-list">
                        {listaLideresOpcoes.map(l => (
                          <option key={`id-${l.id}`} value={l.id}>{l.nome}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                      <label className="text-[11px] font-bold text-slate-700">Nome do Líder</label>
                      <input
                        type="text"
                        list="pmt-lideres-nome-list"
                        value={editingColaborador.nomeLider || ''}
                        onChange={(e) => {
                          const newName = e.target.value.toUpperCase()
                          const found = listaLideresOpcoes.find(l => l.nome.toLowerCase() === newName.trim().toLowerCase())
                          setEditingColaborador({
                            ...editingColaborador,
                            nomeLider: newName,
                            idLider: found ? found.id : editingColaborador.idLider
                          })
                        }}
                        placeholder="Ex: FRANCISCO MICHAEL LIMA BATISTA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                      <datalist id="pmt-lideres-nome-list">
                        {listaLideresOpcoes.map(l => (
                          <option key={`nome-${l.id}`} value={l.nome}>{`ID: ${l.id}`}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Setor</label>
                      <input
                        type="text"
                        value={editingColaborador.setor || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, setor: e.target.value.toUpperCase() })}
                        placeholder="Ex: SUPRIMENTO, EXPEDIÇÃO"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Área</span>
                        <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">Pré-seleção</span>
                      </label>
                      <select
                        value={editingColaborador.area || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, area: e.target.value })}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all ${
                          editingColaborador.area && editingColaborador.area.trim()
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:border-emerald-500'
                            : 'bg-rose-50 text-rose-700 border-rose-300 focus:border-rose-500'
                        }`}
                      >
                        <option value="" className="bg-white text-slate-500 font-normal">Selecione uma Área...</option>
                        {LISTA_AREAS_OPCOES.map((areaOpcao) => (
                          <option key={areaOpcao} value={areaOpcao} className="bg-white text-slate-800 font-semibold">
                            {areaOpcao}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Turno</label>
                      <input
                        type="text"
                        value={editingColaborador.turno || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, turno: e.target.value })}
                        placeholder="Ex: 1º, 2º, 3º, Adm"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">Status</label>
                      <input
                        type="text"
                        value={editingColaborador.status || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, status: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">Possui Medidas</label>
                      <input
                        type="text"
                        value={editingColaborador.possuiMedidas || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, possuiMedidas: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Possui Feedback</label>
                      <input
                        type="text"
                        value={editingColaborador.possuiFeedback || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, possuiFeedback: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 3: ADMISSÃO, EXPERIÊNCIA & FÉRIAS */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold">3</span>
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Admissão, Experiência & Férias</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Data de Admissão</label>
                      <input
                        type="text"
                        value={editingColaborador.dataAdmissao || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, dataAdmissao: e.target.value })}
                        placeholder="DD/MM/AAAA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Tempo de Empresa</label>
                      <input
                        type="text"
                        value={editingColaborador.tempoDeEmpresa || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, tempoDeEmpresa: e.target.value })}
                        placeholder="Ex: 6a-10m-10d"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Férias</label>
                      <input
                        type="text"
                        value={editingColaborador.ferias || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, ferias: e.target.value })}
                        placeholder="Ex: Gozando Férias"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Período 45 Dias (Experiência)</label>
                      <input
                        type="text"
                        value={editingColaborador.periodo45Dias || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, periodo45Dias: e.target.value })}
                        placeholder="DD/MM/AAAA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Período 90 Dias (Experiência)</label>
                      <input
                        type="text"
                        value={editingColaborador.periodo90Dias || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, periodo90Dias: e.target.value })}
                        placeholder="DD/MM/AAAA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Dia / Mês / Ano Adm</label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          value={editingColaborador.diaAdm || ''}
                          onChange={(e) => setEditingColaborador({ ...editingColaborador, diaAdm: e.target.value })}
                          placeholder="Dia"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                        />
                        <input
                          type="text"
                          value={editingColaborador.mesAdm || ''}
                          onChange={(e) => setEditingColaborador({ ...editingColaborador, mesAdm: e.target.value })}
                          placeholder="Mês"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                        />
                        <input
                          type="text"
                          value={editingColaborador.anoAdm || ''}
                          onChange={(e) => setEditingColaborador({ ...editingColaborador, anoAdm: e.target.value })}
                          placeholder="Ano"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 4: DOCUMENTOS, PESSOAL & ANIVERSÁRIO */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">4</span>
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Documentos & Dados Pessoais</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Login Corporativo</label>
                      <input
                        type="text"
                        value={editingColaborador.login || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, login: e.target.value })}
                        placeholder="Ex: JSEP_SILVA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">CPF</label>
                      <input
                        type="text"
                        value={editingColaborador.cpf || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">RG</label>
                      <input
                        type="text"
                        value={editingColaborador.rg || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, rg: e.target.value })}
                        placeholder="Registro Geral"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">Sexo</label>
                      <select
                        value={editingColaborador.sexo || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, sexo: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino (M)</option>
                        <option value="F">Feminino (F)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Data de Nascimento</label>
                      <input
                        type="text"
                        value={editingColaborador.dataNascimento || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, dataNascimento: e.target.value })}
                        placeholder="DD/MM/AAAA"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-700">Idade Atual</label>
                      <input
                        type="text"
                        value={editingColaborador.novaIdade || ''}
                        onChange={(e) => setEditingColaborador({ ...editingColaborador, novaIdade: e.target.value })}
                        placeholder="Ex: 54"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700">Dia e Mês de Aniversário</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editingColaborador.diaNiver || ''}
                          onChange={(e) => setEditingColaborador({ ...editingColaborador, diaNiver: e.target.value })}
                          placeholder="Dia (Ex: 20)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                        />
                        <input
                          type="text"
                          value={editingColaborador.mesNiver || ''}
                          onChange={(e) => setEditingColaborador({ ...editingColaborador, mesNiver: e.target.value })}
                          placeholder="Mês (Ex: 9)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Mensagem de Sucesso na Edição */}
              {editSuccessMsg && (
                <div className="p-3 my-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 mt-3">
                <span className="text-[11px] text-slate-600 hidden sm:inline font-medium">
                  Todas as seções disponíveis para visualização e edição direta.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditingColaborador(null); }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. MODAL DE CONFIRMAÇÃO: EXCLUIR TODOS OS COLABORADORES
          ========================================================================= */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deletar Todos os Colaboradores?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação apagará permanentemente todos os <strong className="text-red-600 font-bold">{colaboradoresList.length} colaboradores</strong> cadastrados na base do Quadro.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold text-left flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>Atenção: Os dados serão removidos do armazenamento local. Você poderá importar a planilha Modelo 1 a qualquer momento.</span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAllColaboradores}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Sim, Deletar Todos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
