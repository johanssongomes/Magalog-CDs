import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  CalendarDays,
  Hammer,
  Clock,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Database,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Boxes,
  Package,
  Settings2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sliders,
  HelpCircle,
  Pin,
  PinOff,
  Menu
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import {
  getPcpItemsReport,
  getAllPcpSummaryItems,
  clearPcpPlanningCache,
  setPcpPlanningCache,
  triggerOracleSync,
  getOracleSyncStatus,
  type OracleSyncStatus,
  type PcpItem
} from '../lib/pcpService'
import initialSampleRows from '../data/pcp_initial_sample.json'
import initialPlanningSummary from '../data/pcp_planning_summary.json'
import { INITIAL_MODAL_PARAMS, getTipoModal, type ModalParamItem } from '../data/pcp_modal_params'
import { INITIAL_FILIAL_ROTA_PARAMS, type FilialRotaParamItem } from '../data/pcp_filial_rotas_params'

// Definição das 53 Colunas Oficiais da Planilha PCP J'S MARTINS.xlsx + Coluna Auxiliar Dinâmica
export const PCP_COLUMNS: Array<{ key: keyof PcpItem; label: string; width?: string; align?: 'left' | 'center' | 'right'; type?: 'num' | 'cur' | 'date' | 'str' }> = [
  { key: 'filorig', label: 'FILORIG', width: 'w-20', align: 'center' },
  { key: 'codfil', label: 'CODFIL', width: 'w-20', align: 'center' },
  { key: 'filentrega', label: 'FILENTREGA', width: 'w-24', align: 'center' },
  { key: 'destino_calc', label: 'DESTINO (AUX)', width: 'w-48' },
  { key: 'regiao_calc', label: 'REGIÃO (AUX)', width: 'w-32', align: 'center' },
  { key: 'numlote', label: 'NUMLOTE', width: 'w-24' },
  { key: 'fllibfat', label: 'FLLIBFAT', width: 'w-20', align: 'center' },
  { key: 'tpnota', label: 'TPNOTA', width: 'w-20', align: 'center' },
  { key: 'numpedven', label: 'NUMPEDVEN', width: 'w-28' },
  { key: 'numpedcomp', label: 'NUMPEDCOMP', width: 'w-28' },
  { key: 'dtpedido', label: 'DTPEDIDO', width: 'w-24' },
  { key: 'dtentrega', label: 'DTENTREGA', width: 'w-24' },
  { key: 'dtlibfat', label: 'DTLIBFAT', width: 'w-24' },
  { key: 'preventrega', label: 'PREVENTREGA', width: 'w-24' },
  { key: 'item', label: 'ITEM', width: 'w-24' },
  { key: 'ibm', label: 'IBM', width: 'w-28' },
  { key: 'descricao', label: 'DESCRICAO', width: 'min-w-[260px]' },
  { key: 'ref', label: 'REF', width: 'w-28' },
  { key: 'fantasia', label: 'FANTASIA', width: 'w-36' },
  { key: 'qtcomp', label: 'QTCOMP', width: 'w-20', align: 'right', type: 'num' },
  { key: 'fisico', label: 'FISICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'resfis', label: 'RESFIS', width: 'w-20', align: 'right', type: 'num' },
  { key: 'logico', label: 'LOGICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'reslog', label: 'RESLOG', width: 'w-20', align: 'right', type: 'num' },
  { key: 'tecnico', label: 'TECNICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'futuro', label: 'FUTURO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'transito', label: 'TRANSITO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'status', label: 'STATUS', width: 'w-24' },
  { key: 'situacao', label: 'SITUACAO', width: 'w-28' },
  { key: 'linha', label: 'LINHA', width: 'w-44' },
  { key: 'linha_ajustada', label: 'LINHA_AJUSTADA', width: 'w-44' },
  { key: 'nucleo', label: 'NUCLEO', width: 'w-32' },
  { key: 'familia', label: 'FAMILIA', width: 'w-32' },
  { key: 'codrota', label: 'CODROTA', width: 'w-24' },
  { key: 'descricaorota', label: 'DESCRICAOROTA', width: 'w-48' },
  { key: 'codmodal', label: 'CODMODAL', width: 'w-24' },
  // COLUNA AUXILIAR DINÂMICA ALIMENTADA PELA ABA DE CADASTROS
  { key: 'modalidade_calc', label: 'MODALIDADE (AUX)', width: 'w-36', align: 'center' },
  { key: 'tipo_modal_calc', label: 'TIPO MODAL (AUX)', width: 'w-32', align: 'center' },
  { key: 'descricaomodal', label: 'DESCRICAOMODAL', width: 'w-36' },
  { key: 'status_operacao', label: 'STATUS_OPERACAO', width: 'w-32', align: 'center' },
  { key: 'operacao', label: 'OPERACAO', width: 'w-28' },
  { key: 'dtalter', label: 'DTALTER', width: 'w-24' },
  { key: 'cub_tot', label: 'CUB_TOT', width: 'w-24', align: 'right', type: 'num' },
  { key: 'pesoliq', label: 'PESOLIQ', width: 'w-24', align: 'right', type: 'num' },
  { key: 'precounit', label: 'PRECOUNIT', width: 'w-24', align: 'right', type: 'cur' },
  { key: 'vltotal', label: 'VLTOTAL', width: 'w-28', align: 'right', type: 'cur' },
  { key: 'qtped', label: 'QTPED', width: 'w-20', align: 'right', type: 'num' },
  { key: 'flag_estorno_caixa', label: 'FLAG_ESTORNO_CAIXA', width: 'w-28' },
  { key: 'n', label: 'N', width: 'w-16', align: 'center' },
  { key: 'turnoagendado', label: 'TURNOAGENDADO', width: 'w-24', align: 'center' },
  { key: 'dtentregaagendada', label: 'DTENTREGAAGENDADA', width: 'w-28' },
  { key: 'cod_vendedor', label: 'COD_VENDEDOR', width: 'w-24' },
  { key: 'prazo_entrega', label: 'PRAZO_ENTREGA', width: 'w-24' },
  { key: 'data_entrega_prevista', label: 'DATA_ENTREGA_PREVISTA', width: 'w-28' },
  { key: 'cep_entrega', label: 'CEP_ENTREGA', width: 'w-24' },
  { key: 'dt_hr_libfat', label: 'DT_HR_LIBFAT', width: 'w-28' },
  { key: 'faixa_dias_reduzida', label: 'FAIXA_DIAS_REDUZIDA', width: 'w-28' }
]

// Formata data para o padrão brasileiro (DD/MM/YYYY) ou prazo em dias
export const formatDateBR = (val: any): string => {
  if (!val && val !== 0) return '-'
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '-'

  // Se já estiver no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str.substring(0, 10)
  }

  // Formato ISO ou YYYY-MM-DD (ex: 2026-11-23 00:00:00 ou 2026-11-23T...)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`
  }

  // Tentar parse via Date se for válida e não for puramente número
  if (!/^\d+(\.0+)?$/.test(str)) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      return `${dia}/${mes}/${ano}`
    }
  }

  // Se for apenas número de dias (ex: 10 ou 10.0)
  if (/^\d+(\.0+)?$/.test(str)) {
    return `${str.replace(/\.0+$/, '')} dias`
  }

  return str
}

// Formata data e hora para o padrão brasileiro (DD/MM/YYYY às HH:mm)
export const formatDateTimeBR = (val: any): string => {
  if (!val) return ''
  const str = String(val).trim()
  if (!str || str === '-' || str === 'null' || str === 'undefined') return ''

  // Prioriza extração direta de ano, mês, dia, hora e minuto para evitar distorção de fuso horário
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (match) {
    const [, y, m, d, hh, mm] = match
    return `${d}/${m}/${y} às ${hh}:${mm}`
  }

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      const hora = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${dia}/${mes}/${ano} às ${hora}:${min}`
    }
  } catch { }

  return str
}

// Remove casas decimais espúrias de código de item (ex: 8131690.0 -> 8131690)
export const formatItemCode = (val: any): string => {
  if (!val && val !== 0) return '-'
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '-'
  return str.replace(/\.0+$/, '')
}

// Converte data ou prazo em valor numérico para ordenação crescente (do menor para o maior vencimento)
export const parseDateOrPrazoToTimestamp = (val: any): number => {
  if (!val && val !== 0) return 9999999999999
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return 9999999999999

  // Se estiver no formato DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
  }

  // Se estiver no formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
  }

  // Se for apenas número de dias (ex: "10" ou "10 dias")
  const daysMatch = str.match(/^(\d+)/)
  if (daysMatch) {
    return Number(daysMatch[1]) * 86400000
  }

  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.getTime()
  }

  return 9999999999999
}

export const PcpJsMartinsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planejamento' | 'programacao' | 'controle' | 'cadastros'>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_active_tab')
      if (saved && ['planejamento', 'programacao', 'controle', 'cadastros'].includes(saved)) {
        return saved as any
      }
    } catch { }
    return 'planejamento'
  })

  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_active_tab', activeTab)
    } catch { }
  }, [activeTab])

  // Estado para auto-ocultação do menu para ganhar espaço de tela
  const [isMenuAutoHide, setIsMenuAutoHide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('magalog_pcp_menu_autohide') === 'true'
    } catch {
      return false
    }
  })
  const [isMenuHovered, setIsMenuHovered] = useState<boolean>(false)

  const toggleMenuAutoHide = () => {
    setIsMenuAutoHide(prev => {
      const next = !prev
      try {
        localStorage.setItem('magalog_pcp_menu_autohide', String(next))
      } catch { }
      return next
    })
  }

  const [activeSubParam, setActiveSubParam] = useState<'modal' | 'rotas'>('rotas')

  // --------------------------------------------------------------------------
  // ESTADOS DA ABA CADASTROS AUXILIARES (DE-PARA DE MODAIS & ROTAS)
  // --------------------------------------------------------------------------
  const [modalParams, setModalParams] = useState<ModalParamItem[]>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_modal_params')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao carregar parâmetros locais de modal:', e)
    }
    return INITIAL_MODAL_PARAMS
  })

  const [filialRotaParams, setFilialRotaParams] = useState<FilialRotaParamItem[]>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_filial_rotas_params')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao carregar parâmetros locais de rotas:', e)
    }
    return INITIAL_FILIAL_ROTA_PARAMS
  })

  // Mapas rápidos de consulta
  const modalMap = useMemo(() => {
    const map: Record<string, string> = {}
    modalParams.forEach(p => {
      const k = (p.codmodal || '').trim().toUpperCase()
      if (k) map[k] = (p.modalidade || '').trim().toUpperCase()
    })
    return map
  }, [modalParams])

  const rotaMap = useMemo(() => {
    const map: Record<string, { destino: string; regiao: string }> = {}
    filialRotaParams.forEach(p => {
      const k = (p.filialRota || '').trim().toUpperCase()
      if (k) map[k] = { destino: p.destino, regiao: p.regiao.trim().toUpperCase() }
    })
    return map
  }, [filialRotaParams])

  // Estados de formulário da aba Cadastros Auxiliares (Modal)
  const [newCodModal, setNewCodModal] = useState('')
  const [newModalidade, setNewModalidade] = useState('')
  const [searchParam, setSearchParam] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingModalidade, setEditingModalidade] = useState('')

  // Estados de formulário da aba Cadastros Auxiliares (Filiais/Rotas)
  const [newFilialRota, setNewFilialRota] = useState('')
  const [newDestino, setNewDestino] = useState('')
  const [newRegiao, setNewRegiao] = useState('INTERIOR')
  const [searchRotaParam, setSearchRotaParam] = useState('')
  const [editingRotaIndex, setEditingRotaIndex] = useState<number | null>(null)
  const [editingRotaDestino, setEditingRotaDestino] = useState('')
  const [editingRotaRegiao, setEditingRotaRegiao] = useState('')

  // Estados dos filtros da aba Planejamento (persistentes no navegador)
  const [planFilterRegiao, setPlanFilterRegiao] = useState<string>(() => {
    try { return localStorage.getItem('magalog_pcp_plan_regiao') || 'TODOS' } catch { return 'TODOS' }
  })
  const [planFilterModalidade, setPlanFilterModalidade] = useState<string>(() => {
    try { return localStorage.getItem('magalog_pcp_plan_modalidade') || 'TODOS' } catch { return 'TODOS' }
  })
  const [planFilterTipoModal, setPlanFilterTipoModal] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_tipo_modal')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterFllibfat, setPlanFilterFllibfat] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_fllibfat')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterStatusOp, setPlanFilterStatusOp] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_status_op')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterLinha, setPlanFilterLinha] = useState<string>(() => {
    try { return localStorage.getItem('magalog_pcp_plan_linha') || 'TODOS' } catch { return 'TODOS' }
  })
  const [planSearchTerm, setPlanSearchTerm] = useState<string>(() => {
    try { return localStorage.getItem('magalog_pcp_plan_search') || '' } catch { return '' }
  })

  // Sincronizar filtros com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_plan_regiao', planFilterRegiao)
      localStorage.setItem('magalog_pcp_plan_modalidade', planFilterModalidade)
      localStorage.setItem('magalog_pcp_plan_tipo_modal', JSON.stringify(planFilterTipoModal))
      localStorage.setItem('magalog_pcp_plan_fllibfat', JSON.stringify(planFilterFllibfat))
      localStorage.setItem('magalog_pcp_plan_status_op', JSON.stringify(planFilterStatusOp))
      localStorage.setItem('magalog_pcp_plan_linha', planFilterLinha)
      localStorage.setItem('magalog_pcp_plan_search', planSearchTerm)
    } catch { }
  }, [planFilterRegiao, planFilterModalidade, planFilterTipoModal, planFilterFllibfat, planFilterStatusOp, planFilterLinha, planSearchTerm])

  // Alternância de visualização dos painéis: 'regiao' (Quadro por Região) | 'comparativo' (Visão Comparativa por Destino)
  const [planViewMode, setPlanViewMode] = useState<'regiao' | 'comparativo'>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_plan_view_mode')
      return saved === 'comparativo' ? 'comparativo' : 'regiao'
    } catch {
      return 'regiao'
    }
  })

  // Sincronizar modo de visualização com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_plan_view_mode', planViewMode)
    } catch { }
  }, [planViewMode])

  // Ordenação da Visão Comparativa (padrão: Cubagem da Carteira decrescente)
  const [compSortField, setCompSortField] = useState<'destino' | 'carteiraQtd' | 'carteiraCub' | 'processoQtd' | 'processoCub' | 'totalQtd' | 'totalCub'>('carteiraCub')
  const [compSortAsc, setCompSortAsc] = useState<boolean>(false)

  const handleCompSort = (field: 'destino' | 'carteiraQtd' | 'carteiraCub' | 'processoQtd' | 'processoCub' | 'totalQtd' | 'totalCub') => {
    if (compSortField === field) {
      setCompSortAsc(prev => !prev)
    } else {
      setCompSortField(field)
      setCompSortAsc(field === 'destino' ? true : false)
    }
  }

  // Controle de destinos expandidos no Planejamento
  const [expandedDestinos, setExpandedDestinos] = useState<Record<string, boolean>>({})
  // Controle de regiões recolhidas no Planejamento
  const [collapsedRegioes, setCollapsedRegioes] = useState<Record<string, boolean>>({})
  // Controle de modalidades expandidas dentro de destinos
  const [expandedModalidades, setExpandedModalidades] = useState<Record<string, boolean>>({})
  // Controle de status de lote expandidos dentro de modalidades
  const [expandedStatusLotes, setExpandedStatusLotes] = useState<Record<string, boolean>>({})

  const toggleDestino = (destino: string) => {
    setExpandedDestinos(prev => ({ ...prev, [destino]: !prev[destino] }))
  }

  const toggleRegiao = (regiao: string) => {
    setCollapsedRegioes(prev => ({ ...prev, [regiao]: !prev[regiao] }))
  }

  const toggleModalidade = (key: string) => {
    setExpandedModalidades(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleStatusLote = (key: string) => {
    setExpandedStatusLotes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Sincronizar parâmetros
  const saveModalParams = (list: ModalParamItem[]) => {
    setModalParams(list)
    try {
      localStorage.setItem('magalog_pcp_modal_params', JSON.stringify(list))
    } catch { }
  }

  const saveFilialRotaParams = (list: FilialRotaParamItem[]) => {
    setFilialRotaParams(list)
    try {
      localStorage.setItem('magalog_pcp_filial_rotas_params', JSON.stringify(list))
    } catch { }
  }

  const handleAddParam = () => {
    const cod = newCodModal.trim().toUpperCase()
    const mod = newModalidade.trim().toUpperCase()
    if (!cod || !mod) return

    const existingIdx = modalParams.findIndex(p => p.codmodal.toUpperCase() === cod)
    let updated: ModalParamItem[]
    if (existingIdx >= 0) {
      updated = [...modalParams]
      updated[existingIdx] = { codmodal: cod, modalidade: mod }
    } else {
      updated = [{ codmodal: cod, modalidade: mod }, ...modalParams]
    }

    saveModalParams(updated)
    setNewCodModal('')
    setNewModalidade('')
  }

  const handleDeleteParam = (cod: string) => {
    const updated = modalParams.filter(p => p.codmodal.toUpperCase() !== cod.toUpperCase())
    saveModalParams(updated)
  }

  const handleSaveEdit = (idx: number) => {
    if (!editingModalidade.trim()) return
    const updated = [...modalParams]
    updated[idx] = { ...updated[idx], modalidade: editingModalidade.trim().toUpperCase() }
    saveModalParams(updated)
    setEditingIndex(null)
    setEditingModalidade('')
  }

  const handleAddRotaParam = () => {
    const rot = newFilialRota.trim()
    const des = newDestino.trim()
    const reg = newRegiao.trim().toUpperCase()
    if (!rot || !des) return

    const existingIdx = filialRotaParams.findIndex(p => p.filialRota.toUpperCase() === rot.toUpperCase())
    let updated: FilialRotaParamItem[]
    if (existingIdx >= 0) {
      updated = [...filialRotaParams]
      updated[existingIdx] = { filialRota: rot, destino: des, regiao: reg }
    } else {
      updated = [{ filialRota: rot, destino: des, regiao: reg }, ...filialRotaParams]
    }

    saveFilialRotaParams(updated)
    setNewFilialRota('')
    setNewDestino('')
  }

  const handleDeleteRotaParam = (rot: string) => {
    const updated = filialRotaParams.filter(p => p.filialRota.toUpperCase() !== rot.toUpperCase())
    saveFilialRotaParams(updated)
  }

  const handleSaveRotaEdit = (idx: number) => {
    if (!editingRotaDestino.trim()) return
    const updated = [...filialRotaParams]
    updated[idx] = {
      ...updated[idx],
      destino: editingRotaDestino.trim(),
      regiao: editingRotaRegiao.trim().toUpperCase()
    }
    saveFilialRotaParams(updated)
    setEditingRotaIndex(null)
    setEditingRotaDestino('')
    setEditingRotaRegiao('')
  }

  // --------------------------------------------------------------------------
  // ESTADOS DA ABA CONTROLE & ACOMPANHAMENTO (TABELA BASE DO BANCO DE DADOS)
  // --------------------------------------------------------------------------
  const [items, setItems] = useState<PcpItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedStatusOperacao, setSelectedStatusOperacao] = useState<string>('TODOS')
  const [selectedFilEntrega, setSelectedFilEntrega] = useState<string>('TODOS')

  // Upload e Sincronização
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fallback Local Storage
  const getLocalData = (): PcpItem[] => {
    try {
      const local = localStorage.getItem('magalog_pcp_js_martins_data')
      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao ler dados locais de PCP:', e)
    }
    return (initialSampleRows as any[]) || []
  }

  // Base completa de registros para o Planejamento (inicia instantaneamente com a base completa pré-processada)
  const [fullPlanningData, setFullPlanningData] = useState<PcpItem[]>(() => {
    return (initialPlanningSummary as any[]) || []
  })
  const [isLoadingPlanning, setIsLoadingPlanning] = useState<boolean>(false)

  // Referência da versão de sincronização atualmente carregada em tela
  const lastLoadedSyncVersionRef = useRef<string | null>(null)

  // Carregar todos os dados completos para o planejamento (com cache inteligente e atualização em segundo plano)
  const loadPlanningData = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoadingPlanning(true)
    try {
      // 1. Obter versão remota atual no Supabase (para validar se o cache local é válido)
      const syncStatus = await getOracleSyncStatus().catch(() => null)
      const remoteVersion = syncStatus?.updated_at || undefined
      if (remoteVersion) {
        setLastSyncDateStr(remoteVersion)
      }

      const dbRows = await getAllPcpSummaryItems(forceRefresh, (fresh) => {
        if (fresh && fresh.length > 0) {
          setFullPlanningData(fresh)
        }
      }, remoteVersion)

      if (dbRows && dbRows.length > 0) {
        setFullPlanningData(dbRows)
        if (remoteVersion) {
          lastLoadedSyncVersionRef.current = remoteVersion
        }
      } else {
        const local = getLocalData()
        if (local && local.length > 0) {
          setFullPlanningData(local)
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados consolidados do planejamento:', e)
      const local = getLocalData()
      if (local && local.length > 0) {
        setFullPlanningData(local)
      }
    } finally {
      setIsLoadingPlanning(false)
    }
  }, [])

  useEffect(() => {
    loadPlanningData()
  }, [loadPlanningData])

  // --------------------------------------------------------------------------
  // ESTADOS E CONTROLE DA SINCRONIZAÇÃO DIRETA COM ORACLE MLPDW
  // --------------------------------------------------------------------------
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false)
  const [isSyncingOracle, setIsSyncingOracle] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<OracleSyncStatus>({ status: 'idle' })

  // Timestamp oficial da última sincronização central da Carteira (Supabase / Nuvem)
  const [lastSyncDateStr, setLastSyncDateStr] = useState<string>('2026-11-20T12:22:19')

  const refreshLastSyncTimestamp = useCallback(async () => {
    try {
      const status = await getOracleSyncStatus()
      if (status && status.updated_at) {
        setLastSyncDateStr(status.updated_at)

        // Se detectar que houve uma nova sincronização na nuvem diferente da versão carregada na tela,
        // atualiza os dados automaticamente para todos os usuários sem precisar de F5!
        if (lastLoadedSyncVersionRef.current && status.updated_at !== lastLoadedSyncVersionRef.current) {
          console.log('⚡ Detectada nova sincronização na nuvem por outro usuário/servidor. Atualizando tela automaticamente...', status.updated_at)
          lastLoadedSyncVersionRef.current = status.updated_at
          await loadPlanningData(true)
        }
        return
      }
    } catch { }

    // Fallback: se não encontrar no status, busca a data de alteração mais recente da base
    if (fullPlanningData && fullPlanningData.length > 0) {
      const dates = fullPlanningData
        .map(r => r.dtalter || (r as any).DTALTER)
        .filter(Boolean)
      if (dates.length > 0) {
        dates.sort().reverse()
        setLastSyncDateStr(dates[0])
      }
    }
  }, [fullPlanningData, loadPlanningData])

  useEffect(() => {
    refreshLastSyncTimestamp()
    // Polling a cada 20 segundos para captar atualizações feitas por qualquer outro usuário
    const interval = window.setInterval(refreshLastSyncTimestamp, 20000)
    return () => window.clearInterval(interval)
  }, [refreshLastSyncTimestamp])

  // Ouvinte em tempo real via Supabase Realtime (WebSocket):
  // Quando qualquer usuário ou o servidor corporativo rodar a sincronização,
  // TODOS os navegadores abertos no Magalog recebem o evento e atualizam automaticamente na hora!
  useEffect(() => {
    const channel = supabase
      .channel('pcp_sync_realtime_broadcast')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_metrics',
          filter: 'cell_key=eq.pcp_sync_command'
        },
        () => {
          console.log('⚡ Evento Realtime recebido: Carteira atualizada no servidor! Recarregando dados para todos...')
          refreshLastSyncTimestamp()
          loadPlanningData(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPlanningData, refreshLastSyncTimestamp])

  const handleSyncOracleCarteira = async () => {
    setIsSyncModalOpen(true)
    setIsSyncingOracle(true)
    setSyncStatus({
      status: 'running',
      step: 'starting',
      progress: 10,
      message: '🔌 Conectando ao banco de dados Oracle MLPDW (verificando VPN)...'
    })

    const res = await triggerOracleSync()
    if (!res.success) {
      setIsSyncingOracle(false)
      setSyncStatus({
        status: 'error',
        step: 'failed',
        progress: 0,
        message: res.message || 'Falha ao iniciar sincronização.'
      })
      return
    }

    let ticks = 0
    const pollInterval = window.setInterval(async () => {
      ticks++
      try {
        const current = await getOracleSyncStatus()

        // Se estiver como requested há mais de 8 segundos, orienta o usuário
        if (current.status === 'requested' && ticks >= 5) {
          setSyncStatus({
            ...current,
            message: 'Aguardando o sincronizador no computador. Dê 2 cliques em "iniciar_sincronizador.bat" na pasta do projeto.'
          })
        } else {
          setSyncStatus(current)
        }

        if (current.status === 'success') {
          window.clearInterval(pollInterval)
          setIsSyncingOracle(false)
          await loadPlanningData(true)
          await refreshLastSyncTimestamp()
        } else if (current.status === 'error' || current.status === 'warning') {
          window.clearInterval(pollInterval)
          setIsSyncingOracle(false)
        }
      } catch {
        // Polling contínuo
      }
    }, 1500)
  }

  // Buscar dados com aplicação da coluna auxiliar Modalidade
  const loadData = useCallback(async (p: number = page, search: string = searchTerm) => {
    setIsLoading(true)
    try {
      const res = await getPcpItemsReport({
        page: p,
        pageSize,
        statusOperacao: selectedStatusOperacao,
        filentrega: selectedFilEntrega,
        search
      })

      if (res.count > 0) {
        // Vincula dinamicamente a modalidade, destino e região calculadas
        const enriched = res.data.map(item => {
          const cod = (item.codmodal || '').trim().toUpperCase()
          const modalidadeCalc = modalMap[cod] || item.descricaomodal || '-'
          const isAba = modalidadeCalc.trim().toUpperCase() === 'ABA'

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(item.filentrega || '').trim().toUpperCase()
          const rotaKey = String(item.descricaorota || '').trim().toUpperCase()

          if (isAba) {
            // Prioridade máxima para FILENTREGA se Modalidade for ABA
            rotaInfo = rotaMap[filEntregaKey] || rotaMap[rotaKey] || { destino: '-', regiao: '-' }
          } else {
            // Outras modalidades priorizam a rota
            rotaInfo = rotaMap[rotaKey] || rotaMap[filEntregaKey] || { destino: '-', regiao: '-' }
          }

          const tipoModalCalc = getTipoModal(modalidadeCalc)

          return {
            ...item,
            modalidade_calc: modalidadeCalc,
            tipo_modal_calc: tipoModalCalc,
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (item.descricaorota || (item.filentrega ? `Filial ${item.filentrega}` : '-')),
            regiao_calc: rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR'
          }
        })
        setItems(enriched)
        setTotalCount(res.count)
      } else {
        // Fallback para cache local / amostra
        const local = getLocalData()
        let filtered = local

        if (selectedStatusOperacao !== 'TODOS') {
          filtered = filtered.filter(item => (item.status_operacao || (item as any).STATUS_OPERACAO) === selectedStatusOperacao)
        }

        if (selectedFilEntrega !== 'TODOS') {
          filtered = filtered.filter(item => String(item.filentrega || (item as any).FILENTREGA) === selectedFilEntrega)
        }

        if (search && search.trim()) {
          const terms = search.split(/[,;\n]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
          filtered = filtered.filter(item => {
            const cod = String(item.item || (item as any).ITEM || '').toLowerCase()
            const desc = String(item.descricao || (item as any).DESCRICAO || '').toLowerCase()
            const ibm = String(item.ibm || (item as any).IBM || '').toLowerCase()
            const ped = String(item.numpedven || (item as any).NUMPEDVEN || '').toLowerCase()
            return terms.some(t => cod.includes(t) || desc.includes(t) || ibm.includes(t) || ped.includes(t))
          })
        }

        setTotalCount(filtered.length)
        const from = (p - 1) * pageSize
        const slice = filtered.slice(from, from + pageSize).map((r: any, idx) => {
          const cod = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          const modalidadeCalc = modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-')
          const isAba = modalidadeCalc.trim().toUpperCase() === 'ABA'

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(r.filentrega || r.FILENTREGA || '').trim().toUpperCase()
          const rotaKey = String(r.descricaorota || r.DESCRICAOROTA || '').trim().toUpperCase()

          if (isAba) {
            rotaInfo = rotaMap[filEntregaKey] || rotaMap[rotaKey] || { destino: '-', regiao: '-' }
          } else {
            rotaInfo = rotaMap[rotaKey] || rotaMap[filEntregaKey] || { destino: '-', regiao: '-' }
          }

          return {
            id: idx + from + 1,
            filorig: Number(r.filorig || r.FILORIG) || 994,
            codfil: Number(r.codfil || r.CODFIL) || 994,
            filentrega: Number(r.filentrega || r.FILENTREGA) || 0,
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (r.descricaorota || r.DESCRICAOROTA || (r.filentrega || r.FILENTREGA ? `Filial ${r.filentrega || r.FILENTREGA}` : '-')),
            regiao_calc: rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR',
            numlote: String(r.numlote || r.NUMLOTE || ''),
            fllibfat: String(r.fllibfat || r.FLLIBFAT || ''),
            tpnota: Number(r.tpnota || r.TPNOTA) || 0,
            numpedven: String(r.numpedven || r.NUMPEDVEN || ''),
            numpedcomp: String(r.numpedcomp || r.NUMPEDCOMP || ''),
            dtpedido: String(r.dtpedido || r.DTPEDIDO || ''),
            dtentrega: String(r.dtentrega || r.DTENTREGA || ''),
            dtlibfat: String(r.dtlibfat || r.DTLIBFAT || ''),
            preventrega: String(r.preventrega || r.PREVENTREGA || r.data_entrega_prevista || r.DATA_ENTREGA_PREVISTA || r.prazo_entrega || r.PRAZO_ENTREGA || ''),
            item: formatItemCode(r.item || r.ITEM || ''),
            ibm: String(r.ibm || r.IBM || ''),
            descricao: String(r.descricao || r.DESCRICAO || ''),
            ref: String(r.ref || r.REF || ''),
            fantasia: String(r.fantasia || r.FANTASIA || ''),
            qtcomp: Number(r.qtcomp || r.QTCOMP) || 0,
            fisico: Number(r.fisico || r.FISICO) || 0,
            resfis: Number(r.resfis || r.RESFIS) || 0,
            logico: Number(r.logico || r.LOGICO) || 0,
            reslog: Number(r.reslog || r.RESLOG) || 0,
            tecnico: Number(r.tecnico || r.TECNICO) || 0,
            futuro: Number(r.futuro || r.FUTURO) || 0,
            transito: Number(r.transito || r.TRANSITO) || 0,
            status: String(r.status || r.STATUS || ''),
            situacao: String(r.situacao || r.SITUACAO || ''),
            linha: String(r.linha || r.LINHA || ''),
            linha_ajustada: String(r.linha_ajustada || r.LINHA_AJUSTADA || ''),
            nucleo: String(r.nucleo || r.NUCLEO || ''),
            familia: String(r.familia || r.FAMILIA || ''),
            codrota: String(r.codrota || r.CODROTA || ''),
            descricaorota: String(r.descricaorota || r.DESCRICAOROTA || ''),
            codmodal: cod,
            modalidade_calc: modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-'),
            descricaomodal: String(r.descricaomodal || r.DESCRICAOMODAL || ''),
            status_operacao: String(r.status_operacao || r.STATUS_OPERACAO || 'EM PROCESSO'),
            operacao: String(r.operacao || r.OPERACAO || ''),
            dtalter: String(r.dtalter || r.DTALTER || ''),
            cub_tot: Number(r.cub_tot || r.CUB_TOT) || 0,
            pesoliq: Number(r.pesoliq || r.PESOLIQ) || 0,
            precounit: Number(r.precounit || r.PRECOUNIT) || 0,
            vltotal: Number(r.vltotal || r.VLTOTAL) || 0,
            qtped: Number(r.qtped || r.QTPED) || 0,
            flag_estorno_caixa: String(r.flag_estorno_caixa || r.FLAG_ESTORNO_CAIXA || ''),
            n: String(r.n || r.N || ''),
            turnoagendado: String(r.turnoagendado || r.TURNOAGENDADO || ''),
            dtentregaagendada: String(r.dtentregaagendada || r.DTENTREGAAGENDADA || ''),
            cod_vendedor: String(r.cod_vendedor || r.COD_VENDEDOR || ''),
            prazo_entrega: String(r.prazo_entrega || r.PRAZO_ENTREGA || ''),
            data_entrega_prevista: String(r.data_entrega_prevista || r.DATA_ENTREGA_PREVISTA || ''),
            cep_entrega: String(r.cep_entrega || r.CEP_ENTREGA || ''),
            dt_hr_libfat: String(r.dt_hr_libfat || r.DT_HR_LIBFAT || ''),
            faixa_dias_reduzida: String(r.faixa_dias_reduzida || r.FAIXA_DIAS_REDUZIDA || '')
          }
        })
        setItems(slice)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de PCP:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedStatusOperacao, selectedFilEntrega, searchTerm, modalMap, rotaMap])

  useEffect(() => {
    if (activeTab === 'controle') {
      loadData(page, searchTerm)
    }
  }, [loadData, page, activeTab, searchTerm])

  // Métricas rápidas dos dados carregados
  const stats = useMemo(() => {
    const local = getLocalData()
    const totalVolume = local.reduce((acc, r: any) => acc + (Number(r.fisico || r.FISICO) || 0), 0)
    const totalCubagem = local.reduce((acc, r: any) => acc + (Number(r.cub_tot || r.CUB_TOT) || 0), 0)
    const totalValor = local.reduce((acc, r: any) => {
      const qt = Number(r.qtcomp || r.QTCOMP || 0)
      const pr = Number(r.precounit || r.PRECOUNIT || 0)
      const vl = (pr > 0 && qt > 0) ? (pr * qt) : (Number(r.vltotal || r.VLTOTAL) || 0)
      return acc + vl
    }, 0)
    const emProcesso = local.filter((r: any) => (r.status_operacao || r.STATUS_OPERACAO) === 'EM PROCESSO').length
    const emCarteira = local.filter((r: any) => (r.status_operacao || r.STATUS_OPERACAO) === 'EM CARTEIRA').length

    return {
      totalItens: local.length,
      totalVolume,
      totalCubagem,
      totalValor,
      emProcesso,
      emCarteira
    }
  }, [totalCount])

  // Upload manual da planilha
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress('Lendo arquivo Excel...')
    setUploadFeedback(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['Plan1'] || wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<any>(ws)

      if (rawRows.length === 0) {
        throw new Error('A planilha selecionada está vazia.')
      }

      setUploadProgress(`Preparando ${rawRows.length.toLocaleString('pt-BR')} registros...`)

      // Tenta salvar no localStorage de forma segura com fallback (evita erro de cota de 5MB do navegador)
      try {
        localStorage.setItem('magalog_pcp_js_martins_data', JSON.stringify(rawRows))
      } catch (storageErr) {
        console.warn('A base completa ultrapassa o limite do localStorage do navegador (5MB). Os dados serão enviados diretamente ao banco de dados Supabase.', storageErr)
        // Salva apenas uma amostra segura no localStorage caso o navegador tenha cota estrita
        try {
          localStorage.setItem('magalog_pcp_js_martins_data', JSON.stringify(rawRows.slice(0, 500)))
        } catch { }
      }

      // Envio em lotes para o Supabase (se a tabela existir)
      const mappedRows = rawRows.map(r => ({
        filorig: Number(r.FILORIG) || 994,
        codfil: Number(r.CODFIL) || 994,
        filentrega: Number(r.FILENTREGA) || null,
        numlote: r.NUMLOTE !== undefined ? String(r.NUMLOTE) : null,
        fllibfat: r.FLLIBFAT !== undefined ? String(r.FLLIBFAT) : null,
        tpnota: Number(r.TPNOTA) || null,
        numpedven: r.NUMPEDVEN !== undefined ? String(r.NUMPEDVEN) : null,
        numpedcomp: r.NUMPEDCOMP !== undefined ? String(r.NUMPEDCOMP) : null,
        dtpedido: r.DTPEDIDO !== undefined ? String(r.DTPEDIDO) : null,
        dtentrega: r.DTENTREGA !== undefined ? String(r.DTENTREGA) : null,
        dtlibfat: r.DTLIBFAT !== undefined ? String(r.DTLIBFAT) : null,
        preventrega: r.PREVENTREGA !== undefined ? String(r.PREVENTREGA) : null,
        item: String(r.ITEM || ''),
        ibm: r.IBM !== undefined ? String(r.IBM) : null,
        descricao: String(r.DESCRICAO || ''),
        ref: r.REF !== undefined ? String(r.REF) : null,
        fantasia: r.FANTASIA !== undefined ? String(r.FANTASIA) : null,
        qtcomp: Number(r.QTCOMP) || 0,
        fisico: Number(r.FISICO) || 0,
        resfis: Number(r.RESFIS) || 0,
        logico: Number(r.LOGICO) || 0,
        reslog: Number(r.RESLOG) || 0,
        tecnico: Number(r.TECNICO) || 0,
        futuro: Number(r.FUTURO) || 0,
        transito: Number(r.TRANSITO) || 0,
        status: r.STATUS !== undefined ? String(r.STATUS) : null,
        situacao: r.SITUACAO !== undefined ? String(r.SITUACAO) : null,
        linha: r.LINHA !== undefined ? String(r.LINHA) : null,
        linha_ajustada: r.LINHA_AJUSTADA !== undefined ? String(r.LINHA_AJUSTADA) : null,
        nucleo: r.NUCLEO !== undefined ? String(r.NUCLEO) : null,
        familia: r.FAMILIA !== undefined ? String(r.FAMILIA) : null,
        codrota: r.CODROTA !== undefined ? String(r.CODROTA) : null,
        descricaorota: r.DESCRICAOROTA !== undefined ? String(r.DESCRICAOROTA) : null,
        codmodal: r.CODMODAL !== undefined ? String(r.CODMODAL) : null,
        descricaomodal: r.DESCRICAOMODAL !== undefined ? String(r.DESCRICAOMODAL) : null,
        status_operacao: r.STATUS_OPERACAO ? String(r.STATUS_OPERACAO) : 'EM PROCESSO',
        operacao: r.OPERACAO !== undefined ? String(r.OPERACAO) : null,
        dtalter: r.DTALTER !== undefined ? String(r.DTALTER) : null,
        cub_tot: Number(r.CUB_TOT) || 0,
        pesoliq: Number(r.PESOLIQ) || 0,
        precounit: Number(r.PRECOUNIT) || 0,
        vltotal: Number(r.VLTOTAL) || 0,
        qtped: Number(r.QTPED) || 0,
        flag_estorno_caixa: r.FLAG_ESTORNO_CAIXA !== undefined ? String(r.FLAG_ESTORNO_CAIXA) : null,
        n: r.N !== undefined ? String(r.N) : null,
        turnoagendado: r.TURNOAGENDADO !== undefined ? String(r.TURNOAGENDADO) : null,
        dtentregaagendada: r.DTENTREGAAGENDADA !== undefined ? String(r.DTENTREGAAGENDADA) : null,
        cod_vendedor: r.COD_VENDEDOR !== undefined ? String(r.COD_VENDEDOR) : null,
        prazo_entrega: r.PRAZO_ENTREGA !== undefined ? String(r.PRAZO_ENTREGA) : null,
        data_entrega_prevista: r.DATA_ENTREGA_PREVISTA !== undefined ? String(r.DATA_ENTREGA_PREVISTA) : null,
        cep_entrega: r.CEP_ENTREGA !== undefined ? String(r.CEP_ENTREGA) : null,
        dt_hr_libfat: r.DT_HR_LIBFAT !== undefined ? String(r.DT_HR_LIBFAT) : null,
        faixa_dias_reduzida: r.FAIXA_DIAS_REDUZIDA !== undefined ? String(r.FAIXA_DIAS_REDUZIDA) : null
      }))

      try {
        setUploadProgress('Sincronizando com o banco de dados Supabase...')
        await supabase.from('pcp_js_martins').delete().neq('id', 0)

        const batchSize = 1000
        for (let i = 0; i < mappedRows.length; i += batchSize) {
          const batch = mappedRows.slice(i, i + batchSize)
          const { error: insErr } = await supabase.from('pcp_js_martins').insert(batch)
          if (insErr) {
            console.warn('Erro ao inserir lote no Supabase:', insErr.message)
            break
          }
          setUploadProgress(`Enviado ${Math.min(i + batchSize, mappedRows.length)} de ${mappedRows.length}...`)
        }
      } catch (errDb) {
        console.warn('Banco Supabase em fallback local:', errDb)
      }

      // Atualiza instantaneamente a visualização e o cache persistente (IndexedDB)
      const summaryForPlanning: PcpItem[] = mappedRows.map(r => ({
        filentrega: r.filentrega,
        fllibfat: r.fllibfat || 'S',
        codmodal: r.codmodal || '',
        descricaomodal: r.descricaomodal || '',
        descricaorota: r.descricaorota || '',
        status_operacao: r.status_operacao || 'EM PROCESSO',
        linha: r.linha || '',
        numpedven: r.numpedven || '',
        numlote: r.numlote,
        item: r.item,
        descricao: r.descricao,
        qtcomp: r.qtcomp,
        fisico: r.fisico,
        qtped: r.qtped,
        cub_tot: r.cub_tot,
        precounit: r.precounit,
        vltotal: r.vltotal,
        pesoliq: r.pesoliq
      }))
      await setPcpPlanningCache(summaryForPlanning)
      setFullPlanningData(summaryForPlanning)

      setUploadFeedback({
        type: 'success',
        message: `${rawRows.length.toLocaleString('pt-BR')} registros importados com sucesso para o banco de dados!`
      })
      loadData(1, searchTerm)
      loadPlanningData(true)
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: `Falha na importação: ${err.message || 'Erro desconhecido'}`
      })
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      if (e.target) e.target.value = ''
    }
  }

  // 4 ABAS DA PÁGINA PCP J'S MARTINS
  const tabs = [
    {
      id: 'planejamento',
      label: 'Planejamento',
      subtitle: 'Previsão de Demanda, Capacidade e S&OP (Consumo da Base)',
      icon: <Layers size={15} />
    },
    {
      id: 'programacao',
      label: 'Programação',
      subtitle: 'Agendamentos Diários, Linhas e Sequenciamento',
      icon: <CalendarDays size={15} />
    },
    {
      id: 'controle',
      label: 'Controle & Acompanhamento',
      subtitle: 'Banco de Dados Operacional (53 Colunas + Coluna Auxiliar)',
      icon: <Database size={15} />
    },
    {
      id: 'cadastros',
      label: 'Cadastros Auxiliares',
      subtitle: 'Parâmetros de De-Para (Modalidade, Linhas e Regras de Negócio)',
      icon: <Settings2 size={15} />
    }
  ] as const

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Renderizador formatado de célula
  const renderCell = (row: PcpItem, col: typeof PCP_COLUMNS[number]) => {
    const val = (row as any)[col.key]
    if (val === null || val === undefined || val === '') return '-'

    if (col.key === 'item' || col.key === 'ibm' || col.key === 'codrota') {
      return formatItemCode(val)
    }

    if (col.key === 'preventrega' || col.key === 'dtpedido' || col.key === 'dtentrega' || col.key === 'dtlibfat' || col.key === 'dtalter') {
      return formatDateBR(val)
    }

    if (col.type === 'num') {
      const num = Number(val)
      return isNaN(num) ? String(val) : num.toLocaleString('pt-BR')
    }

    if (col.type === 'cur') {
      const num = Number(val)
      return isNaN(num) ? String(val) : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (col.key === 'modalidade_calc') {
      const mod = String(val).toUpperCase()
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (mod === 'RODOVIARIO') color = 'bg-blue-100 text-blue-800 border-blue-200'
      if (mod === 'ABA') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (mod === 'COURRIER') color = 'bg-amber-100 text-amber-800 border-amber-200'
      if (mod === 'TRANSFERENCIA') color = 'bg-purple-100 text-purple-800 border-purple-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {mod}
        </span>
      )
    }

    if (col.key === 'tipo_modal_calc') {
      const tipo = String(val)
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (tipo === 'Venda') color = 'bg-blue-100 text-blue-800 border-blue-200'
      if (tipo === 'Abastecimento') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (tipo === 'Tranfs') color = 'bg-purple-100 text-purple-800 border-purple-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {tipo}
        </span>
      )
    }

    if (col.key === 'regiao_calc') {
      const reg = String(val).toUpperCase()
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (reg === 'CAPITAL') color = 'bg-cyan-100 text-cyan-800 border-cyan-200'
      if (reg === 'METROPOLITANA') color = 'bg-indigo-100 text-indigo-800 border-indigo-200'
      if (reg === 'INTERIOR') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (reg.includes('ABASTECIMENTO')) color = 'bg-amber-100 text-amber-800 border-amber-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {reg}
        </span>
      )
    }

    if (col.key === 'destino_calc') {
      return (
        <span className="font-semibold text-slate-800">
          {String(val)}
        </span>
      )
    }

    if (col.key === 'status_operacao') {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase whitespace-nowrap ${val === 'EM PROCESSO'
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
          }`}>
          {val}
        </span>
      )
    }

    return String(val)
  }

  // Filtragem dos parâmetros da tabela de De-Para (Modal)
  const filteredParams = useMemo(() => {
    if (!searchParam.trim()) return modalParams
    const q = searchParam.trim().toLowerCase()
    return modalParams.filter(p =>
      p.codmodal.toLowerCase().includes(q) ||
      p.modalidade.toLowerCase().includes(q)
    )
  }, [modalParams, searchParam])

  // Filtragem dos parâmetros da tabela de De-Para (Filiais/Rotas)
  const filteredRotaParams = useMemo(() => {
    if (!searchRotaParam.trim()) return filialRotaParams
    const q = searchRotaParam.trim().toLowerCase()
    return filialRotaParams.filter(p =>
      p.filialRota.toLowerCase().includes(q) ||
      p.destino.toLowerCase().includes(q) ||
      p.regiao.toLowerCase().includes(q)
    )
  }, [filialRotaParams, searchRotaParam])

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* BARRA DE MENUS NO CANTO ESQUERDO COM OPÇÃO DE AUTO-OCULTAR         */}
      {/* ------------------------------------------------------------------ */}
      {!isMenuAutoHide ? (
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
          {/* Menus alinhados no canto esquerdo */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-0.5 flex-wrap sm:flex-nowrap">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Botão para ativar modo auto-ocultar */}
          <button
            type="button"
            onClick={toggleMenuAutoHide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Ocultar menus automaticamente para ganhar mais espaço de tela (só exibe ao passar o mouse)"
          >
            <Pin size={12} className="text-slate-400 rotate-45" />
            <span className="hidden sm:inline">Auto-ocultar menus</span>
          </button>
        </div>
      ) : (
        <div
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
          className="relative z-40 -mb-2"
        >
          {/* Faixa / Gatilho fino de ativação no canto esquerdo */}
          <div className="flex items-center justify-between py-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100/80 hover:bg-blue-50 border border-slate-200/80 text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer shadow-2xs transition-all">
              <Menu size={12} className="text-blue-600" />
              <span>Menu: <strong className="text-blue-700 capitalize">{currentTabInfo.label}</strong></span>
              <span className="text-[9.5px] text-slate-400 font-normal ml-1">(passe o mouse aqui para navegar)</span>
            </div>

            <button
              type="button"
              onClick={toggleMenuAutoHide}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Fixar menus permanentemente visíveis na tela"
            >
              <PinOff size={11} className="text-amber-500" />
              <span className="hidden sm:inline">Fixar menu</span>
            </button>
          </div>

          {/* Menu Flutuante que surge sobreposto ao passar o mouse */}
          {isMenuHovered && (
            <div className="absolute top-0 left-0 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 shadow-xl p-2 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150 min-w-[520px]">
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-0.5 flex-wrap sm:flex-nowrap">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id)
                        setIsMenuHovered(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={toggleMenuAutoHide}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                title="Fixar menus permanentemente visíveis na tela"
              >
                <Pin size={12} className="text-blue-600" />
                <span className="hidden sm:inline">Fixar menu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK DE UPLOAD */}
      {uploadFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${uploadFeedback.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          <div className="flex items-center gap-2">
            {uploadFeedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            <span>{uploadFeedback.message}</span>
          </div>
          <button type="button" onClick={() => setUploadFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold px-1.5">✕</button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 4: CADASTROS AUXILIARES (DE-PARA DE PARÂMETROS E REGRAS)       */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'cadastros' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Settings2 size={18} className="text-blue-600" /> Parâmetros de Colunas Auxiliares
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre e edite as regras de De-Para. Os parâmetros alimentam automaticamente as colunas auxiliares calculadas (<strong>MODALIDADE</strong>, <strong>DESTINO</strong> e <strong>REGIÃO</strong>) em todo o sistema.
              </p>
            </div>
            {/* SUB-ABAS DE CADASTRO */}
            <div className="flex items-center p-1 bg-white rounded-xl border border-blue-200 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setActiveSubParam('rotas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubParam === 'rotas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Truck size={13} />
                <span>Filiais / Rotas & Regiões ({filialRotaParams.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubParam('modal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubParam === 'modal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Layers size={13} />
                <span>Modalidade ({modalParams.length})</span>
              </button>
            </div>
          </div>

          {/* SUBPÁGINA 1: FILIAIS / ROTAS & REGIÕES */}
          {activeSubParam === 'rotas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* FORMULÁRIO DE CADASTRO RÁPIDO ROTAS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Plus size={16} className="text-emerald-600" /> Nova Regra (Filial/Rota $\rightarrow$ Região)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Filial / Rota
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 710, 994-EC1 CE SOBRAL..."
                      value={newFilialRota}
                      onChange={(e) => setNewFilialRota(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Destino / Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 710-Fortaleza QUA - SAB, SOBRAL..."
                      value={newDestino}
                      onChange={(e) => setNewDestino(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Região
                    </label>
                    <select
                      value={newRegiao}
                      onChange={(e) => setNewRegiao(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold bg-white cursor-pointer uppercase"
                    >
                      <option value="INTERIOR">INTERIOR</option>
                      <option value="CAPITAL">CAPITAL</option>
                      <option value="METROPOLITANA">METROPOLITANA</option>
                      <option value="ABASTECIMENTO CDs">ABASTECIMENTO CDs</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRotaParam}
                    disabled={!newFilialRota.trim() || !newDestino.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salvar Parâmetro de Rota</span>
                  </button>
                </div>
              </div>

              {/* TABELA DE GERENCIAMENTO DE FILIAIS/ROTAS */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Mapeamento (Filial/Rotas $\rightarrow$ Destino & Região)</h3>
                    <p className="text-xs text-slate-500">Total de {filialRotaParams.length} regras cadastradas.</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar filial, destino ou região..."
                      value={searchRotaParam}
                      onChange={(e) => setSearchRotaParam(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-[10.5px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Filial / Rota</th>
                        <th className="py-2.5 px-4">Destino</th>
                        <th className="py-2.5 px-4 text-center">Região</th>
                        <th className="py-2.5 px-4 text-center w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRotaParams.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Nenhum parâmetro de rota encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredRotaParams.map((param, idx) => {
                          const isEditing = editingRotaIndex === idx
                          return (
                            <tr key={`${param.filialRota}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900 truncate max-w-[200px]" title={param.filialRota}>
                                {param.filialRota}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingRotaDestino}
                                    onChange={(e) => setEditingRotaDestino(e.target.value)}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-medium w-full"
                                    autoFocus
                                  />
                                ) : (
                                  param.destino
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <select
                                    value={editingRotaRegiao}
                                    onChange={(e) => setEditingRotaRegiao(e.target.value)}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-bold"
                                  >
                                    <option value="INTERIOR">INTERIOR</option>
                                    <option value="CAPITAL">CAPITAL</option>
                                    <option value="METROPOLITANA">METROPOLITANA</option>
                                    <option value="ABASTECIMENTO CDs">ABASTECIMENTO CDs</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${param.regiao === 'CAPITAL' ? 'bg-cyan-100 text-cyan-800' :
                                    param.regiao === 'METROPOLITANA' ? 'bg-indigo-100 text-indigo-800' :
                                      param.regiao === 'INTERIOR' ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                    {param.regiao}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRotaEdit(idx)}
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                      title="Salvar alteração"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRotaIndex(null)}
                                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRotaIndex(idx)
                                        setEditingRotaDestino(param.destino)
                                        setEditingRotaRegiao(param.regiao)
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                      title="Editar parâmetro"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRotaParam(param.filialRota)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir regra"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBPÁGINA 2: MODALIDADES */}
          {activeSubParam === 'modal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* CARD 1: FORMULÁRIO DE CADASTRO RÁPIDO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Plus size={16} className="text-emerald-600" /> Novo Parâmetro (Modalidade)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Código do Modal (CODMODAL)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RD1, EAL, CD0..."
                      value={newCodModal}
                      onChange={(e) => setNewCodModal(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Modalidade Atribuída
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RODOVIARIO, ABA, COURRIER..."
                      value={newModalidade}
                      onChange={(e) => setNewModalidade(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold uppercase"
                    />
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {['RODOVIARIO', 'ABA', 'COURRIER', 'TRANSFERENCIA'].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewModalidade(sug)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParam}
                    disabled={!newCodModal.trim() || !newModalidade.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salvar Regra de Modalidade</span>
                  </button>
                </div>
              </div>

              {/* CARD 2 E 3: TABELA DE GERENCIAMENTO E EDIÇÃO DOS PARÂMETROS */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Tabela de Mapeamento (CODMODAL $\rightarrow$ MODALIDADE)</h3>
                    <p className="text-xs text-slate-500">Edite os valores em linha ou adicione novos códigos.</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar código ou modalidade..."
                      value={searchParam}
                      onChange={(e) => setSearchParam(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-[10.5px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">CODMODAL</th>
                        <th className="py-2.5 px-4">MODALIDADE</th>
                        <th className="py-2.5 px-4 text-center">TIPO MODAL</th>
                        <th className="py-2.5 px-4 text-center w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredParams.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Nenhum parâmetro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredParams.map((param, idx) => {
                          const isEditing = editingIndex === idx
                          const tipoModal = getTipoModal(param.modalidade)
                          return (
                            <tr key={param.codmodal} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                                {param.codmodal}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingModalidade}
                                    onChange={(e) => setEditingModalidade(e.target.value.toUpperCase())}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-bold"
                                    autoFocus
                                  />
                                ) : (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${param.modalidade === 'RODOVIARIO' ? 'bg-blue-100 text-blue-800' :
                                    param.modalidade === 'ABA' ? 'bg-emerald-100 text-emerald-800' :
                                      param.modalidade === 'COURRIER' ? 'bg-amber-100 text-amber-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {param.modalidade}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tipoModal === 'Venda' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  tipoModal === 'Abastecimento' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                  {tipoModal}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(idx)}
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                      title="Salvar alteração"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndex(null)}
                                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingIndex(idx)
                                        setEditingModalidade(param.modalidade)
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                      title="Editar modalidade"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteParam(param.codmodal)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir regra"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 3: CONTROLE & ACOMPANHAMENTO (BASE DE DADOS COM 53 COLS + AUX) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'controle' && (
        <div className="space-y-4">
          {/* CARDS DE RESUMO DA BASE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Database size={13} className="text-blue-500" /> Total Registros
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {(totalCount || stats.totalItens).toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Linhas na base</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Boxes size={13} className="text-amber-500" /> Em Processo
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {stats.emProcesso.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Separação / Docas</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Package size={13} className="text-indigo-500" /> Em Carteira
              </span>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {stats.emCarteira.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Backlog de Pedidos</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Truck size={13} className="text-emerald-500" /> Volume Peças
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {stats.totalVolume.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Estoque Físico CD</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Layers size={13} className="text-purple-500" /> Cubagem Total
              </span>
              <p className="text-xl font-black text-purple-700 mt-1">
                {stats.totalCubagem.toFixed(1)} <span className="text-xs font-normal">m³</span>
              </p>
              <span className="text-[10px] text-slate-400">Metragem Cúbica</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <BarChart3 size={13} className="text-slate-500" /> Valor Total
              </span>
              <p className="text-lg font-black text-slate-800 mt-1">
                R$ {(stats.totalValor / 1_000_000).toFixed(1)}M
              </p>
              <span className="text-[10px] text-slate-400">Faturamento Previsto</span>
            </div>
          </div>

          {/* BARRA DE CONTROLE, FILTROS E UPLOAD */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Campo de Busca Rápida com Separador de Vírgula */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar Item, Pedido, Descrição (separados por vírgula)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Filtros Dropdown e Botões de Ação */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Status Operação */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Filter size={12} className="text-slate-400" />
                <span className="text-[10.5px] font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={selectedStatusOperacao}
                  onChange={(e) => {
                    setSelectedStatusOperacao(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="EM PROCESSO">EM PROCESSO</option>
                  <option value="EM CARTEIRA">EM CARTEIRA</option>
                </select>
              </div>

              {/* Indicador de 53 colunas + Auxiliar */}
              <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                53 Colunas + Coluna Auxiliar Ativa
              </div>

              {/* Botão Recarregar */}
              <button
                type="button"
                onClick={() => loadData(page, searchTerm)}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Recarregar dados"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              </button>

              {/* Botão Atualizar Carteira Direto no Oracle */}
              <button
                type="button"
                onClick={handleSyncOracleCarteira}
                disabled={isSyncingOracle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-2xs disabled:opacity-60 active:scale-95"
                title="Consultar Carteira diretamente do Oracle MLPDW e sincronizar com Supabase"
              >
                <Database size={14} className={isSyncingOracle ? 'animate-spin' : ''} />
                <span>{isSyncingOracle ? 'Atualizando...' : 'Atualizar Carteira (Oracle)'}</span>
              </button>

              {/* Botão de Upload / Importar PCP J'S MARTINS.xlsx */}
              <label
                htmlFor="pcp-file-upload"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-2xs ${isUploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                title="Atualizar base a partir de PCP J'S MARTINS.xlsx"
              >
                <UploadCloud size={14} />
                <span>{isUploading ? uploadProgress || 'Importando...' : "Importar PCP J'S MARTINS.xlsx"}</span>
              </label>
              <input
                id="pcp-file-upload"
                type="file"
                accept=".xlsx, .xls"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* TABELA DE DADOS DA BASE COM AS 53 COLUNAS + COLUNA AUXILIAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[620px] scrollbar-thin">
              <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 bg-slate-100 text-slate-700 text-center w-12 sticky left-0 z-20 border-r border-slate-200">
                      #
                    </th>
                    {PCP_COLUMNS.map((col, cIdx) => (
                      <th
                        key={col.key}
                        className={`py-2.5 px-3 ${col.width || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          } border-r border-slate-200/60 hover:bg-slate-100 transition-colors ${col.key === 'modalidade_calc' ? 'bg-amber-50/70 text-amber-900 border-amber-200' : ''
                          }`}
                        title={`Coluna ${cIdx + 1}: ${col.label}`}
                      >
                        <span className="text-slate-400 font-normal mr-1 text-[9px]">#{cIdx + 1}</span>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={PCP_COLUMNS.length + 1} className="py-14 text-center text-slate-400">
                        <RefreshCw size={26} className="animate-spin mx-auto mb-2 text-blue-600" />
                        Carregando registros da base PCP...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={PCP_COLUMNS.length + 1} className="py-14 text-center text-slate-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2 px-2.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        {PCP_COLUMNS.map(col => (
                          <td
                            key={col.key}
                            className={`py-2 px-3 border-r border-slate-100 ${col.align === 'right'
                              ? 'text-right font-mono'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                              } ${col.key === 'item' || col.key === 'numpedven' ? 'font-mono font-bold text-slate-900' : ''
                              } ${col.key === 'descricao' ? 'font-medium text-slate-800' : 'text-slate-600'
                              } ${col.key === 'vltotal' ? 'font-bold text-emerald-700' : ''
                              } ${col.key === 'cub_tot' ? 'font-semibold text-purple-700' : ''
                              } ${col.key === 'modalidade_calc' ? 'bg-amber-50/30' : ''
                              }`}
                          >
                            {renderCell(row, col)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-500 gap-3">
              <div>
                Exibindo <span className="font-bold text-slate-800">{items.length}</span> de{' '}
                <span className="font-bold text-slate-800">{totalCount.toLocaleString('pt-BR')}</span> registros (com coluna auxiliar ativa)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Página <strong className="text-slate-800">{page}</strong> de <strong className="text-slate-800">{totalPages}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 1: PLANEJAMENTO (VISÃO RESUMO DESTINOS & REGIÕES COM FILTROS)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'planejamento' && (() => {
        // Obter toda a base consolidada de registros (do Supabase ou cache local)
        const allRows = fullPlanningData.length > 0 ? fullPlanningData : getLocalData()

        // Opções únicas para os filtros
        const uniqueRegioes = ['TODOS', 'CAPITAL', 'METROPOLITANA', 'INTERIOR', 'ABASTECIMENTO CDs']
        const uniqueModalidades = ['TODOS', ...Array.from(new Set(allRows.map(r => {
          const cod = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          return modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '')
        }))).filter(Boolean).sort()]
        const uniqueStatusOp = ['TODOS', ...Array.from(new Set(allRows.map(r => String(r.status_operacao || r.STATUS_OPERACAO || '')))).filter(Boolean).sort()]
        const uniqueLinhas = ['TODOS', ...Array.from(new Set(allRows.map(r => String(r.linha || r.LINHA || '')))).filter(Boolean).sort()]

        // Enriquecer e filtrar a base conforme filtros da aba Planejamento
        const enrichedBase = allRows.map((r: any) => {
          const cod = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          const modalidade = modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-')
          const isAba = modalidade.trim().toUpperCase() === 'ABA'

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(r.filentrega || r.FILENTREGA || '').trim().toUpperCase()
          const rotaKey = String(r.descricaorota || r.DESCRICAOROTA || '').trim().toUpperCase()

          if (isAba) {
            // Se modalidade for ABA, busca com prioridade máxima pelo código da FILENTREGA no cadastro
            rotaInfo = rotaMap[filEntregaKey] || rotaMap[rotaKey] || { destino: '-', regiao: '-' }
          } else {
            // Outras modalidades buscam pela rota cadastrada primeiro
            rotaInfo = rotaMap[rotaKey] || rotaMap[filEntregaKey] || { destino: '-', regiao: '-' }
          }

          const regiao = rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR'
          const destino = rotaInfo.destino !== '-' ? rotaInfo.destino : (r.descricaorota || r.DESCRICAOROTA || (r.filentrega || r.FILENTREGA ? `Filial ${r.filentrega || r.FILENTREGA}` : 'OUTROS'))
          const statusOperacao = String(r.status_operacao || r.STATUS_OPERACAO || '')
          const linha = String(r.linha || r.LINHA || '')
          const fllibfat = String(r.fllibfat || r.FLLIBFAT || 'S').trim().toUpperCase()
          const tipoModal = getTipoModal(modalidade)

          return {
            ...r,
            calc_regiao: regiao,
            calc_destino: destino,
            calc_modalidade: modalidade,
            calc_tipo_modal: tipoModal,
            calc_fllibfat: fllibfat,
            calc_status_op: statusOperacao,
            calc_linha: linha,
            calc_ped: String(r.numpedven || r.NUMPEDVEN || ''),
            calc_qtd: (() => {
              const q = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              return q || Number(r.fisico || r.FISICO || r.qtped || r.QTPED) || 1
            })(),
            calc_cub: Number(r.cub_tot || r.CUB_TOT) || 0,
            calc_vltotal: (() => {
              const qt = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              const pr = Number(r.precounit !== undefined ? r.precounit : (r.PRECOUNIT !== undefined ? r.PRECOUNIT : 0))
              return (pr > 0 && qt > 0) ? (pr * qt) : (Number(r.vltotal || r.VLTOTAL) || 0)
            })(),
            calc_peso: (() => {
              const qt = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              const ps = Number(r.pesoliq !== undefined ? r.pesoliq : (r.PESOLIQ !== undefined ? r.PESOLIQ : 0))
              return (ps > 0 && qt > 0) ? (ps * qt) : (Number(r.pesoliq || r.PESOLIQ) || 0)
            })()
          }
        })

        const enrichedFiltered = enrichedBase.filter(r => {
          if (planFilterRegiao !== 'TODOS' && r.calc_regiao !== planFilterRegiao) return false
          if (planFilterModalidade !== 'TODOS' && r.calc_modalidade !== planFilterModalidade) return false
          if (planFilterTipoModal.length > 0 && !planFilterTipoModal.includes(r.calc_tipo_modal)) return false
          if (planFilterFllibfat.length > 0 && !planFilterFllibfat.includes(r.calc_fllibfat)) return false
          if (planFilterStatusOp.length > 0) {
            const raw = String(r.calc_status_op || '').toUpperCase()
            const matchStatus = planFilterStatusOp.some(st => {
              if (st === 'EM CARTEIRA') return raw.includes('CARTEIRA')
              if (st === 'EM PROCESSO') return raw.includes('PROCESSO')
              return raw === st
            })
            if (!matchStatus) return false
          }
          if (planFilterLinha !== 'TODOS' && r.calc_linha !== planFilterLinha) return false
          if (planSearchTerm.trim()) {
            const term = planSearchTerm.toLowerCase()
            const matchDest = r.calc_destino.toLowerCase().includes(term)
            const matchReg = r.calc_regiao.toLowerCase().includes(term)
            const matchPed = r.calc_ped.toLowerCase().includes(term)
            if (!matchDest && !matchReg && !matchPed) return false
          }
          return true
        })

        // Base para a Visão Comparativa (sempre mantém Carteira + Processo para o comparativo lado a lado)
        const enrichedForComparative = enrichedBase.filter(r => {
          if (planFilterRegiao !== 'TODOS' && r.calc_regiao !== planFilterRegiao) return false
          if (planFilterModalidade !== 'TODOS' && r.calc_modalidade !== planFilterModalidade) return false
          if (planFilterTipoModal.length > 0 && !planFilterTipoModal.includes(r.calc_tipo_modal)) return false
          if (planFilterFllibfat.length > 0 && !planFilterFllibfat.includes(r.calc_fllibfat)) return false
          if (planFilterLinha !== 'TODOS' && r.calc_linha !== planFilterLinha) return false
          if (planSearchTerm.trim()) {
            const term = planSearchTerm.toLowerCase()
            const matchDest = r.calc_destino.toLowerCase().includes(term)
            const matchReg = r.calc_regiao.toLowerCase().includes(term)
            const matchPed = r.calc_ped.toLowerCase().includes(term)
            if (!matchDest && !matchReg && !matchPed) return false
          }
          return true
        })

        // Estrutura Hierárquica do Planejamento: Região -> Destino -> Status do Lote -> Modalidade -> Itens
        interface DestinoItemDetail {
          modalidade: string
          linha: string
          codmodal: string
          preventrega: string
          statusOperacao: string
          numlote: string
          numpedven: string
          item: string
          descricao: string
          quantidade: number
          cubagem: number
          valorTotal: number
          peso: number
        }

        interface ModalidadeGroup {
          modalidade: string // 'RODOVIARIO' | 'COURRIER' | 'ABA' | 'TRANSFERENCIA'
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
        }

        interface StatusLoteGroup {
          status: string // 'EM CARTEIRA' | 'EM PROCESSO'
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
          modalidades: ModalidadeGroup[]
        }

        interface DestinoSummary {
          destino: string
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          statusGroups: StatusLoteGroup[]
        }

        interface RegiaoGroup {
          regiao: string
          destinos: DestinoSummary[]
          totalPedidosSet: Set<string>
          totalPedidos: number
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
        }

        // Mapa de agrupamento: Regiao -> Destino -> Status -> Modalidade
        const groupsMap = new Map<string, Map<string, Map<string, Map<string, {
          pedidosSet: Set<string>
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
        }>>>>()

        enrichedFiltered.forEach(row => {
          const reg = row.calc_regiao || 'INTERIOR'
          const dest = row.calc_destino || 'OUTROS'
          const mod = row.calc_modalidade || '-'
          // Normaliza status: 'EM CARTEIRA' ou 'EM PROCESSO'
          const rawSt = String(row.calc_status_op || row.status_operacao || row.STATUS_OPERACAO || '').toUpperCase().trim()
          const st = rawSt.includes('CARTEIRA') ? 'EM CARTEIRA' : (rawSt.includes('PROCESSO') ? 'EM PROCESSO' : (rawSt || 'EM CARTEIRA'))

          if (!groupsMap.has(reg)) groupsMap.set(reg, new Map())
          const regMap = groupsMap.get(reg)!

          if (!regMap.has(dest)) regMap.set(dest, new Map())
          const destMap = regMap.get(dest)!

          if (!destMap.has(st)) destMap.set(st, new Map())
          const stMap = destMap.get(st)!

          if (!stMap.has(mod)) {
            stMap.set(mod, {
              pedidosSet: new Set<string>(),
              quantidade: 0,
              cubagem: 0,
              valorTotal: 0,
              pesoTotal: 0,
              itens: []
            })
          }

          const modData = stMap.get(mod)!
          if (row.calc_ped) modData.pedidosSet.add(row.calc_ped)
          modData.quantidade += row.calc_qtd
          modData.cubagem += row.calc_cub
          modData.valorTotal += row.calc_vltotal
          modData.pesoTotal += row.calc_peso

          modData.itens.push({
            modalidade: mod,
            linha: String(row.calc_linha || row.linha || row.LINHA || '-'),
            codmodal: formatItemCode(row.codmodal || row.CODMODAL || '-'),
            preventrega: String(row.preventrega || row.PREVENTREGA || row.data_entrega_prevista || row.DATA_ENTREGA_PREVISTA || row.prazo_entrega || row.PRAZO_ENTREGA || ''),
            numlote: formatItemCode(row.numlote || row.NUMLOTE || '-'),
            statusOperacao: st,
            numpedven: String(row.numpedven || row.NUMPEDVEN || ''),
            item: formatItemCode(row.item || row.ITEM || ''),
            descricao: String(row.descricao || row.DESCRICAO || ''),
            quantidade: row.calc_qtd,
            cubagem: row.calc_cub,
            valorTotal: row.calc_vltotal,
            peso: row.calc_peso
          })
        })

        // Ordem preferencial das modalidades
        const modalPriority = ['RODOVIARIO', 'COURRIER', 'ABA', 'TRANSFERENCIA']
        const sortModalidades = (a: string, b: string) => {
          const idxA = modalPriority.indexOf(a)
          const idxB = modalPriority.indexOf(b)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
          return a.localeCompare(b)
        }

        // Ordem de status: EM CARTEIRA primeiro, depois EM PROCESSO
        const sortStatus = (a: string, b: string) => {
          if (a === 'EM CARTEIRA') return -1
          if (b === 'EM CARTEIRA') return 1
          return a.localeCompare(b)
        }

        // Ordem preferencial das regiões como no relatório do usuário
        const regiaoPriority = ['CAPITAL', 'METROPOLITANA', 'INTERIOR', 'ABASTECIMENTO CDs', '#N/D']
        const allPresentRegioes = Array.from(groupsMap.keys()).sort((a, b) => {
          const idxA = regiaoPriority.indexOf(a)
          const idxB = regiaoPriority.indexOf(b)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
          return a.localeCompare(b)
        })

        const regiaoGroups: RegiaoGroup[] = allPresentRegioes.map(reg => {
          const destMap = groupsMap.get(reg)!
          const destinos: DestinoSummary[] = Array.from(destMap.entries()).map(([destName, stMap]) => {
            const destPedidosSet = new Set<string>()
            let destQtd = 0
            let destCub = 0
            let destValor = 0
            let destPeso = 0

            const statusGroups: StatusLoteGroup[] = Array.from(stMap.entries())
              .sort(([a], [b]) => sortStatus(a, b))
              .map(([stName, modMap]) => {
                const stPedidosSet = new Set<string>()
                let stQtd = 0
                let stCub = 0
                let stValor = 0
                let stPeso = 0
                const stItens: DestinoItemDetail[] = []

                const modalidades: ModalidadeGroup[] = Array.from(modMap.entries())
                  .sort(([a], [b]) => sortModalidades(a, b))
                  .map(([modName, modData]) => {
                    modData.pedidosSet.forEach(p => {
                      stPedidosSet.add(p)
                      destPedidosSet.add(p)
                    })
                    stQtd += modData.quantidade
                    stCub += modData.cubagem
                    stValor += modData.valorTotal
                    stPeso += modData.pesoTotal

                    // Ordena os itens do menor vencimento para o maior dentro de cada modalidade
                    const sortedItens = [...modData.itens].sort((a, b) => {
                      const tA = parseDateOrPrazoToTimestamp(a.preventrega)
                      const tB = parseDateOrPrazoToTimestamp(b.preventrega)
                      if (tA !== tB) return tA - tB
                      return (a.numpedven || '').localeCompare(b.numpedven || '')
                    })

                    stItens.push(...sortedItens)

                    return {
                      modalidade: modName,
                      pedidosSet: modData.pedidosSet,
                      pedidosCount: modData.pedidosSet.size || 1,
                      quantidade: modData.quantidade,
                      cubagem: modData.cubagem,
                      valorTotal: modData.valorTotal,
                      pesoTotal: modData.pesoTotal,
                      itens: sortedItens
                    }
                  })

                destQtd += stQtd
                destCub += stCub
                destValor += stValor
                destPeso += stPeso

                return {
                  status: stName,
                  pedidosSet: stPedidosSet,
                  pedidosCount: stPedidosSet.size || 1,
                  quantidade: stQtd,
                  cubagem: stCub,
                  valorTotal: stValor,
                  pesoTotal: stPeso,
                  modalidades,
                  itens: stItens
                }
              })

            return {
              destino: destName,
              pedidosSet: destPedidosSet,
              pedidosCount: destPedidosSet.size || 1,
              quantidade: destQtd,
              cubagem: destCub,
              valorTotal: destValor,
              pesoTotal: destPeso,
              statusGroups
            }
          }).sort((a, b) => a.destino.localeCompare(b.destino))

          const totalPedidosSet = new Set<string>()
          let totalQtd = 0
          let totalCub = 0
          let totalValor = 0
          let totalPeso = 0

          destinos.forEach(d => {
            d.pedidosSet.forEach(p => totalPedidosSet.add(p))
            totalQtd += d.quantidade
            totalCub += d.cubagem
            totalValor += d.valorTotal
            totalPeso += d.pesoTotal
          })

          return {
            regiao: reg,
            destinos,
            totalPedidosSet,
            totalPedidos: totalPedidosSet.size || destinos.reduce((acc, d) => acc + d.pedidosCount, 0),
            totalQtd,
            totalCub,
            totalValor,
            totalPeso
          }
        })

        // Totais Gerais
        const geralPedidosSet = new Set<string>()
        let geralQtd = 0
        let geralCub = 0
        let geralValor = 0
        let geralPeso = 0

        regiaoGroups.forEach(g => {
          g.totalPedidosSet.forEach(p => geralPedidosSet.add(p))
          geralQtd += g.totalQtd
          geralCub += g.totalCub
          geralValor += g.totalValor
          geralPeso += g.totalPeso
        })
        const geralPedidos = geralPedidosSet.size || regiaoGroups.reduce((acc, g) => acc + g.totalPedidos, 0)

        // Helper para semáforo de cubagem conforme regra condicional:
        // 0 a 9: Vermelho | 10 a 16: Laranja | 17 a 1000+: Verde
        const renderCubSemaforo = (cub: number) => {
          let dotBg = '#22c55e' // verde (17 a 1000)
          if (cub < 10) {
            dotBg = '#ef4444' // vermelho (0 a 9)
          } else if (cub < 17) {
            dotBg = '#f59e0b' // laranja (10 a 16)
          } else {
            dotBg = '#22c55e' // verde (17 a 1000)
          }

          return (
            <span
              className="inline-block w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
              style={{
                backgroundColor: dotBg,
                border: '1px solid rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.4)'
              }}
            />
          )
        }

        // ------------------------------------------------------------
        // Cálculo da Visão Comparativa por Destino (Carteira vs Processo)
        // ------------------------------------------------------------
        interface ComparativeDestinoItem {
          destino: string
          regiao: string
          pedidosSet: Set<string>
          carteiraQtd: number
          carteiraCub: number
          processoQtd: number
          processoCub: number
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
        }

        const compDestMap = new Map<string, ComparativeDestinoItem>()
        const compGeralPedidosSet = new Set<string>()

        enrichedForComparative.forEach(row => {
          const dest = row.calc_destino || 'OUTROS'
          const reg = row.calc_regiao || 'INTERIOR'
          const rawSt = String(row.calc_status_op || row.status_operacao || row.STATUS_OPERACAO || '').toUpperCase().trim()
          const isProcesso = rawSt.includes('PROCESSO')

          if (!compDestMap.has(dest)) {
            compDestMap.set(dest, {
              destino: dest,
              regiao: reg,
              pedidosSet: new Set<string>(),
              carteiraQtd: 0,
              carteiraCub: 0,
              processoQtd: 0,
              processoCub: 0,
              totalQtd: 0,
              totalCub: 0,
              totalValor: 0,
              totalPeso: 0
            })
          }

          const item = compDestMap.get(dest)!
          const qtd = row.calc_qtd || 0
          const cub = row.calc_cub || 0
          const vltotal = row.calc_vltotal || 0
          const peso = row.calc_peso || 0

          if (row.calc_ped) {
            item.pedidosSet.add(row.calc_ped)
            compGeralPedidosSet.add(row.calc_ped)
          }

          if (isProcesso) {
            item.processoQtd += qtd
            item.processoCub += cub
          } else {
            item.carteiraQtd += qtd
            item.carteiraCub += cub
          }
          item.totalQtd += qtd
          item.totalCub += cub
          item.totalValor += vltotal
          item.totalPeso += peso
        })

        const comparativeDestinos = Array.from(compDestMap.values()).sort((a, b) => {
          let diff = 0
          if (compSortField === 'destino') {
            diff = a.destino.localeCompare(b.destino)
          } else {
            diff = (a[compSortField] as number) - (b[compSortField] as number)
          }
          return compSortAsc ? diff : -diff
        })

        const compTotals = {
          carteiraQtd: comparativeDestinos.reduce((acc, d) => acc + d.carteiraQtd, 0),
          carteiraCub: comparativeDestinos.reduce((acc, d) => acc + d.carteiraCub, 0),
          processoQtd: comparativeDestinos.reduce((acc, d) => acc + d.processoQtd, 0),
          processoCub: comparativeDestinos.reduce((acc, d) => acc + d.processoCub, 0),
          totalQtd: comparativeDestinos.reduce((acc, d) => acc + d.totalQtd, 0),
          totalCub: comparativeDestinos.reduce((acc, d) => acc + d.totalCub, 0),
          totalValor: comparativeDestinos.reduce((acc, d) => acc + d.totalValor, 0),
          totalPeso: comparativeDestinos.reduce((acc, d) => acc + d.totalPeso, 0),
          totalPedidos: compGeralPedidosSet.size || comparativeDestinos.reduce((acc, d) => acc + d.pedidosSet.size, 0)
        }

        return (
          <div className="space-y-4">
            {/* ------------------------------------------------------------ */}
            {/* FAIXA HORIZONTAL AMPLA DEDICADA ÀS SEGMENTAÇÕES DE DADOS     */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
              {/* Barra de Título e Ações Rápidas da Faixa de Segmentações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80">
                    <Sliders size={15} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Segmentações de Dados & Filtros do Planejamento
                    </h3>
                    {(planFilterTipoModal.length > 0 ||
                      planFilterStatusOp.length > 0 ||
                      planFilterFllibfat.length > 0 ||
                      planFilterRegiao !== 'TODOS' ||
                      planFilterModalidade !== 'TODOS' ||
                      planFilterLinha !== 'TODOS' ||
                      planSearchTerm.trim() !== '') && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Filtros ativos
                        </span>
                      )}

                    {/* Badge da Última Atualização Central da Carteira */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] border shadow-2xs transition-all ${isSyncingOracle
                        ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                        : 'bg-slate-50 text-slate-600 border-slate-200/90'
                        }`}
                      title={lastSyncDateStr ? `Sincronizado no Supabase: ${lastSyncDateStr} (Clique no botão para recarregar da nuvem)` : 'Sincronização da Carteira'}
                    >
                      <Clock size={11} className={isSyncingOracle ? 'animate-spin text-blue-600' : 'text-blue-500'} />
                      <span className="text-slate-400 font-medium hidden sm:inline">Última atualização:</span>
                      <strong className="font-mono font-bold text-slate-800">
                        {isSyncingOracle
                          ? 'Sincronizando agora...'
                          : (lastSyncDateStr ? formatDateTimeBR(lastSyncDateStr) : '20/11/2026 às 12:22')}
                      </strong>
                      <button
                        type="button"
                        onClick={() => loadPlanningData(true)}
                        disabled={isLoadingPlanning}
                        title="Recarregar dados mais recentes da nuvem agora"
                        className="ml-0.5 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={11} className={isLoadingPlanning ? 'animate-spin text-blue-600' : ''} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isLoadingPlanning && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                      <RefreshCw size={11} className="animate-spin text-blue-600" />
                      Sincronizando base...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPlanFilterRegiao('TODOS')
                      setPlanFilterModalidade('TODOS')
                      setPlanFilterTipoModal([])
                      setPlanFilterFllibfat([])
                      setPlanFilterStatusOp([])
                      setPlanFilterLinha('TODOS')
                      setPlanSearchTerm('')
                      try {
                        localStorage.removeItem('magalog_pcp_plan_regiao')
                        localStorage.removeItem('magalog_pcp_plan_modalidade')
                        localStorage.removeItem('magalog_pcp_plan_tipo_modal')
                        localStorage.removeItem('magalog_pcp_plan_fllibfat')
                        localStorage.removeItem('magalog_pcp_plan_status_op')
                        localStorage.removeItem('magalog_pcp_plan_linha')
                        localStorage.removeItem('magalog_pcp_plan_search')
                      } catch { }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Redefinir todas as segmentações"
                  >
                    <RefreshCw size={11} />
                    Limpar Segmentações
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncOracleCarteira}
                    disabled={isSyncingOracle}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xs hover:shadow-xs rounded-lg transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                    title="Consultar Carteira diretamente do Oracle MLPDW e sincronizar com Supabase"
                  >
                    <Database size={12} className={isSyncingOracle ? 'animate-spin' : ''} />
                    <span>{isSyncingOracle ? 'Atualizando...' : 'Atualizar Carteira'}</span>
                  </button>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-800 border border-blue-200/80">
                    {enrichedFiltered.length.toLocaleString('pt-BR')} itens ativos
                  </span>
                </div>
              </div>

              {/* Segmentações Rápidas por Botões Interativos (Slicers) - Empilhadas */}
              <div className="flex flex-col gap-2 pt-1 pb-1">
                {/* 1ª Linha: Liberação de Faturamento (FLLIBFAT) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Lib. Faturamento:
                    </span>
                    {planFilterFllibfat.length > 0 && (
                      <span className="text-[9.5px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterFllibfat.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterFllibfat([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterFllibfat.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'S', label: 'S', desc: 'Liberado', activeColor: 'bg-emerald-600 text-white' },
                      { id: 'N', label: 'N', desc: 'Bloqueado', activeColor: 'bg-amber-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterFllibfat.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterFllibfat(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span className="font-extrabold">{item.label}</span>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-sans ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {item.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterFllibfat.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterFllibfat([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* 2ª Linha: Status Operação */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Status Operação:
                    </span>
                    {planFilterStatusOp.length > 0 && (
                      <span className="text-[9.5px] text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterStatusOp.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterStatusOp([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterStatusOp.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'EM CARTEIRA', label: 'Em Carteira', activeColor: 'bg-blue-600 text-white' },
                      { id: 'EM PROCESSO', label: 'Em Processo', activeColor: 'bg-amber-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterStatusOp.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterStatusOp(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterStatusOp.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterStatusOp([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* 3ª Linha: Tipo Modal */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Tipo Modal:
                    </span>
                    {planFilterTipoModal.length > 0 && (
                      <span className="text-[9.5px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterTipoModal.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterTipoModal([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterTipoModal.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'Venda', label: 'Venda', badge: 'RD/COU', activeColor: 'bg-blue-600 text-white' },
                      { id: 'Abastecimento', label: 'Abastecimento', badge: 'ABA', activeColor: 'bg-emerald-600 text-white' },
                      { id: 'Tranfs', label: 'Tranfs', badge: 'TRF', activeColor: 'bg-purple-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterTipoModal.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterTipoModal(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span>{item.label}</span>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {item.badge}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterTipoModal.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterTipoModal([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Linha 2: Segmentações por Seleção & Busca Rápida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                {/* Busca Destino / Rota / Pedido */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Busca Rápida</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      value={planSearchTerm}
                      onChange={e => setPlanSearchTerm(e.target.value)}
                      placeholder="Destino, rota ou pedido..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Filtro de Região */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Região</label>
                  <select
                    value={planFilterRegiao}
                    onChange={e => setPlanFilterRegiao(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white font-medium text-slate-700 transition-colors"
                  >
                    {uniqueRegioes.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Modalidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Modalidade (Aux)</label>
                  <select
                    value={planFilterModalidade}
                    onChange={e => setPlanFilterModalidade(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white font-medium text-slate-700 transition-colors"
                  >
                    {uniqueModalidades.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Linha */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Linha</label>
                  <select
                    value={planFilterLinha}
                    onChange={e => setPlanFilterLinha(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white font-medium text-slate-700 transition-colors"
                  >
                    {uniqueLinhas.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* CORPO: CANTO ESQUERDO (TABELA FORMATO OFICIAL) + LADO DIREITO */}
            {/* ------------------------------------------------------------ */}
            <div className="flex flex-col xl:flex-row gap-5 items-start w-full">
              {/* CANTO ESQUERDO (TABELA COM O TEMA MODERNO BLUE/SLATE CLEAN) */}
              <div className="w-full xl:w-auto xl:min-w-[780px] 2xl:min-w-[840px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col shrink-0">
                <div className="px-3.5 py-2.5 bg-[#0e3b66] text-white flex items-center justify-between border-b border-[#0a2c4d] gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-sky-300 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide uppercase">
                      {planViewMode === 'regiao' ? 'Quadro Consolidado por Destino & Região' : 'Visão Comparativa por Destino'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão de Alternância de Visão */}
                    <div className="flex items-center bg-[#072440] p-0.5 rounded-lg border border-sky-400/25 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setPlanViewMode('regiao')}
                        title="Visualização Consolidada por Região (Hierárquica)"
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${planViewMode === 'regiao'
                            ? 'bg-blue-600 text-white shadow-xs font-black'
                            : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <Layers size={12} />
                        <span>Por Região</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanViewMode('comparativo')}
                        title="Visualização Comparativa por Destino (Carteira vs Processo)"
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${planViewMode === 'comparativo'
                            ? 'bg-blue-600 text-white shadow-xs font-black'
                            : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <BarChart3 size={12} />
                        <span>Comparativo</span>
                      </button>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#164e85] text-sky-100 border border-sky-500/30 font-bold whitespace-nowrap">
                      {planViewMode === 'regiao'
                        ? `${regiaoGroups.reduce((acc, g) => acc + g.destinos.length, 0)} destinos`
                        : `${comparativeDestinos.length} destinos`}
                    </span>
                  </div>
                </div>

                {/* Alternância entre as visualizações dos painéis */}
                {planViewMode === 'regiao' ? (
                  /* Tabela estilizada com tema clean (linhas brancas com hover suave e bordas sutis) */
                  <div className="w-full">
                    <table className="w-full border-collapse font-sans text-slate-800 text-[10.5px] table-auto select-text">
                      <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[9.5px] font-black tracking-wider border-b border-slate-200">
                        <tr className="divide-x divide-white/10">
                          <th className="py-2 px-2.5 text-left font-bold w-24">
                            <div className="flex items-center justify-between gap-1">
                              <span>REGIÃO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2.5 text-left font-bold min-w-[260px]">
                            <div className="flex items-center justify-between gap-1">
                              <span>DESTINO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-14">
                            <div className="flex items-center justify-center gap-0.5">
                              <span>PEDIDO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[80px] min-w-[80px] max-w-[80px]">
                            <span>QUANTIDADE</span>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[90px] min-w-[90px] max-w-[90px]">
                            <span>CUBAGEM</span>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[110px] min-w-[110px] max-w-[110px]">
                            <div className="flex items-center justify-center gap-0.5">
                              <span>VALOR$</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[65px] min-w-[65px] max-w-[65px]">
                            <span>PESO</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {regiaoGroups.map((group) => {
                          const isRegiaoCollapsed = !!collapsedRegioes[group.regiao]
                          return (
                            <React.Fragment key={group.regiao}>
                              {/* Cabeçalho de Grupo da Região:
                                - Se RECOLHIDA: fica em UMA ÚNICA LINHA já com os totais de Pedidos, Quantidade, Cubagem, Valor$ e Peso.
                                - Se EXPANDIDA: vira uma barra de cabeçalho simples [-] REGIAO, os destinos vêm abaixo e o subtotal vem no rodapé.
                            */}
                              {isRegiaoCollapsed ? (
                                <tr className="bg-slate-100/95 hover:bg-slate-200/80 transition-colors text-slate-900 font-extrabold border-y border-slate-200 divide-x divide-slate-200">
                                  <td colSpan={2} className="py-1 px-2.5 uppercase tracking-wide text-[11px] whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => toggleRegiao(group.regiao)}
                                      className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                    >
                                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs bg-blue-600 border-blue-600 text-white">
                                        +
                                      </span>
                                      <span className="text-slate-900 font-black">{group.regiao}</span>
                                      <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                        ({group.destinos.length} destinos - clique para expandir)
                                      </span>
                                    </button>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                    {group.totalPedidos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                    {Math.round(group.totalQtd).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                    <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                      <div className="flex justify-center items-center">
                                        {renderCubSemaforo(group.totalCub)}
                                      </div>
                                      <span className="text-right text-slate-900 font-black">
                                        {group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                    <div className="inline-flex items-center justify-center gap-1 w-full text-slate-900">
                                      <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                                      <span className="text-slate-900">
                                        {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                    {Math.round(group.totalPeso).toLocaleString('pt-BR')}
                                  </td>
                                </tr>
                              ) : (
                                <tr className="bg-slate-100/90 hover:bg-slate-200/70 transition-colors text-slate-900 font-extrabold border-y border-slate-200">
                                  <td colSpan={7} className="py-1 px-2.5 uppercase tracking-wide text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => toggleRegiao(group.regiao)}
                                      className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                    >
                                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs border-slate-400/80 bg-white text-slate-700">
                                        -
                                      </span>
                                      <span className="text-slate-900 font-black">{group.regiao}</span>
                                      <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                        ({group.destinos.length} destinos)
                                      </span>
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Linhas de Destino com suporte a expansão detalhada (visíveis se a região não estiver recolhida) */}
                              {!isRegiaoCollapsed && group.destinos.map((dest, idx) => {
                                const isExpanded = !!expandedDestinos[dest.destino]
                                return (
                                  <React.Fragment key={dest.destino}>
                                    <tr
                                      className={`transition-colors divide-x divide-slate-100 hover:bg-sky-50/50 ${isExpanded ? 'bg-blue-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                        }`}
                                      style={isExpanded ? { borderTop: '2px solid #0e3b66', borderLeft: '2px solid #0e3b66', borderRight: '2px solid #0e3b66' } : undefined}
                                    >
                                      <td className="py-1 px-2.5 text-slate-600 text-[10.5px] font-bold whitespace-nowrap">
                                        {idx === 0 ? group.regiao : ''}
                                      </td>
                                      <td className="py-1 px-2.5 font-bold text-slate-800 text-[11px] whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => toggleDestino(dest.destino)}
                                          className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                          <span className={`inline-flex items-center justify-center w-3 h-3 text-[9px] border rounded-xs leading-none shrink-0 font-mono font-bold select-none ${isExpanded ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-100 text-slate-600'
                                            }`}>
                                            {isExpanded ? '-' : '+'}
                                          </span>
                                          <span className={isExpanded ? 'text-blue-700 font-extrabold select-text' : 'select-text'}>{dest.destino}</span>
                                        </button>
                                      </td>
                                      <td className="py-1 px-2 text-center font-bold text-slate-700 text-[11px] whitespace-nowrap font-mono">
                                        {dest.pedidosCount.toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-1 px-2 text-center font-bold text-slate-700 text-[11px] whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                        {Math.round(dest.quantidade).toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] whitespace-nowrap font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                        <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                          <div className="flex justify-center items-center">
                                            {renderCubSemaforo(dest.cubagem)}
                                          </div>
                                          <span className="text-right font-bold text-slate-800">
                                            {dest.cubagem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] whitespace-nowrap font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                        <div className="inline-flex items-center justify-center gap-1 w-full font-bold text-slate-800">
                                          <span className="text-slate-400 font-normal text-[9.5px]">R$</span>
                                          <span>{dest.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] text-slate-700 font-bold whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                        {Math.round(dest.pesoTotal).toLocaleString('pt-BR')}
                                      </td>
                                    </tr>

                                    {/* DETALHAMENTO EXPANDIDO (Hierarquia: Status do Lote -> Itens Diretos com Colunas Perfeitamente Alinhadas) */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={7} className="p-0 bg-slate-50/40">
                                          <div className="w-full border-b-2 border-x-2 border-[#0e3b66] divide-y divide-slate-200">
                                            {dest.statusGroups.map((stGroup) => {
                                              const stKey = `${dest.destino}__${stGroup.status}`
                                              const isStExpanded = !!expandedStatusLotes[stKey]

                                              return (
                                                <div key={stKey} className="w-full bg-white overflow-hidden">
                                                  {/* Cabeçalho do Status do Lote (Alinhado exatamente com o cabeçalho pai) */}
                                                  <div
                                                    onClick={() => toggleStatusLote(stKey)}
                                                    className={`transition-colors cursor-pointer flex items-center justify-between border-b border-slate-200 ${stGroup.status === 'EM CARTEIRA'
                                                      ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-950'
                                                      : 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950'
                                                      }`}
                                                  >
                                                    <div className="flex items-center gap-2 pl-4 sm:pl-6 py-2 flex-1 min-w-0">
                                                      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none font-mono font-black shrink-0 ${isStExpanded
                                                        ? (stGroup.status === 'EM CARTEIRA' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-600 border-amber-600 text-white')
                                                        : 'border-slate-400 bg-white text-slate-700'
                                                        }`}>
                                                        {isStExpanded ? '-' : '+'}
                                                      </span>
                                                      <span className="text-[11px] font-black uppercase tracking-wide truncate">
                                                        Status: {stGroup.status}
                                                      </span>
                                                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                                                        ({stGroup.itens.length} {stGroup.itens.length === 1 ? 'item' : 'itens'})
                                                      </span>
                                                      <span className="text-slate-300 font-normal mx-1 hidden sm:inline">|</span>
                                                      <span className="text-[10px] font-mono text-slate-600 shrink-0 hidden sm:inline">
                                                        Ped: <strong className="text-slate-900">{stGroup.pedidosCount.toLocaleString('pt-BR')}</strong>
                                                      </span>
                                                    </div>

                                                    {/* Métricas do Status travadas com a mesma largura das colunas superiores */}
                                                    <div className="flex items-center divide-x divide-slate-200/80 shrink-0 text-[10px] font-mono font-bold text-slate-800">
                                                      <div className="w-[80px] min-w-[80px] max-w-[80px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        {Math.round(stGroup.quantidade).toLocaleString('pt-BR')}
                                                      </div>
                                                      <div className="w-[90px] min-w-[90px] max-w-[90px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                                          <div className="flex justify-center items-center">
                                                            {renderCubSemaforo(stGroup.cubagem)}
                                                          </div>
                                                          <span className="text-right font-bold text-slate-800">
                                                            {stGroup.cubagem.toFixed(2)}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className="w-[110px] min-w-[110px] max-w-[110px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                                        <span>{stGroup.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                      </div>
                                                      <div className="w-[65px] min-w-[65px] max-w-[65px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        {Math.round(stGroup.pesoTotal).toLocaleString('pt-BR')}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Tabela Direta dos Itens (Alinhada perfeitamente coluna por coluna) */}
                                                  {isStExpanded && (
                                                    <div className="overflow-x-auto w-full select-text">
                                                      <table className="w-full text-[10px] border-collapse bg-white select-text">
                                                        <thead>
                                                          <tr className="bg-[#0e3b66] text-white font-bold text-[9px] uppercase tracking-wider divide-x divide-white/10">
                                                            <th className="py-1.5 px-2 text-center w-24">STATUS</th>
                                                            <th className="py-1.5 px-2 text-center w-20">MODALIDADE</th>
                                                            <th className="py-1.5 px-2 text-center w-28">LINHA</th>
                                                            <th className="py-1.5 px-2 text-center w-20">CODMODAL</th>
                                                            <th className="py-1.5 px-2 text-center w-24">PREVENTREGA</th>
                                                            <th className="py-1.5 px-2 text-center w-24">NUMLOTE</th>
                                                            <th className="py-1.5 px-2 text-center w-24">NUMPEDVEN</th>
                                                            <th className="py-1.5 px-2 text-center w-20">ITEM</th>
                                                            <th className="py-1.5 px-3 text-left">DESCRIÇÃO</th>
                                                            <th className="py-1.5 px-2 text-center w-[80px] min-w-[80px] max-w-[80px]">QTD</th>
                                                            <th className="py-1.5 px-2 text-center w-[90px] min-w-[90px] max-w-[90px]">CUBAGEM</th>
                                                            <th className="py-1.5 px-2 text-center w-[110px] min-w-[110px] max-w-[110px]">VALOR$</th>
                                                            <th className="py-1.5 px-2 text-center w-[65px] min-w-[65px] max-w-[65px]">PESO</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-sans">
                                                          {stGroup.itens.map((det, dIdx) => (
                                                            <tr key={`${det.item}-${det.numpedven}-${dIdx}`} className="hover:bg-blue-50/40 transition-colors divide-x divide-slate-100">
                                                              <td className="py-1 px-2 text-center text-slate-700 font-medium">
                                                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${det.statusOperacao === 'EM PROCESSO' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                                  }`}>
                                                                  {det.statusOperacao}
                                                                </span>
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-bold text-slate-700">
                                                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[9px]">
                                                                  {det.modalidade}
                                                                </span>
                                                              </td>
                                                              <td className="py-1 px-2 text-center text-slate-700 font-medium truncate max-w-[130px]" title={det.linha}>
                                                                {det.linha || '-'}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-800">
                                                                {det.codmodal || '-'}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-medium text-slate-700 whitespace-nowrap">
                                                                {formatDateBR(det.preventrega)}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-800">
                                                                {det.numlote && det.numlote !== '-' ? det.numlote : '-'}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-800">
                                                                {det.numpedven || '-'}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-blue-700">
                                                                {formatItemCode(det.item)}
                                                              </td>
                                                              <td className="py-1 px-3 text-slate-800 truncate max-w-xs" title={det.descricao}>
                                                                {det.descricao || '-'}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-800 w-[80px] min-w-[80px] max-w-[80px]">
                                                                {det.quantidade}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                                                <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                                                  <div className="flex justify-center items-center">
                                                                    {renderCubSemaforo(det.cubagem)}
                                                                  </div>
                                                                  <span className="text-right font-bold text-slate-800">{det.cubagem.toFixed(2)}</span>
                                                                </div>
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-bold text-slate-800 w-[110px] min-w-[110px] max-w-[110px]">
                                                                <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                                                {det.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                              </td>
                                                              <td className="py-1 px-2 text-center font-mono font-medium text-slate-700 w-[65px] min-w-[65px] max-w-[65px]">
                                                                {Math.round(det.peso)}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                              })}

                              {/* Subtotal da Região (Ex: CAPITAL TOTAL) - SÓ EXIBE SE A REGIÃO ESTIVER EXPANDIDA */}
                              {!isRegiaoCollapsed && (
                                <tr className="bg-slate-100/90 text-slate-900 font-black border-y border-slate-200 divide-x divide-slate-200">
                                  <td colSpan={2} className="py-1 px-2.5 tracking-wide uppercase text-[10.5px] font-black whitespace-nowrap text-slate-900">
                                    {group.regiao} TOTAL
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                    {group.totalPedidos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                    {Math.round(group.totalQtd).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                    <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                      <div className="flex justify-center items-center">
                                        {renderCubSemaforo(group.totalCub)}
                                      </div>
                                      <span className="text-right text-slate-900 font-black">
                                        {group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                    <div className="inline-flex items-center justify-center gap-1 w-full text-slate-900">
                                      <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                                      <span className="text-slate-900">
                                        {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                    {Math.round(group.totalPeso).toLocaleString('pt-BR')}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}

                        {/* Total Geral Consolidado */}
                        <tr className="bg-slate-200/90 text-slate-950 font-black text-[11px] border-t-2 border-slate-300 divide-x divide-slate-300">
                          <td colSpan={2} className="py-1.5 px-2.5 uppercase tracking-wider whitespace-nowrap font-black">
                            Total Geral
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black">
                            {geralPedidos.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black w-[80px] min-w-[80px] max-w-[80px]">
                            {Math.round(geralQtd).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-mono font-black w-[90px] min-w-[90px] max-w-[90px]">
                            <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                              <div className="flex justify-center items-center">
                                {renderCubSemaforo(geralCub)}
                              </div>
                              <span className="text-right text-slate-950 font-black">
                                {geralCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-mono font-black w-[110px] min-w-[110px] max-w-[110px]">
                            <div className="inline-flex items-center justify-center gap-1 w-full">
                              <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                              <span>{geralValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black w-[65px] min-w-[65px] max-w-[65px]">
                            {Math.round(geralPeso).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* TABELA COMPARATIVA POR DESTINO (CARTEIRA X PROCESSO) */
                  <div className="w-full overflow-x-auto select-text">
                    <table className="w-full border-collapse font-sans text-slate-800 text-[10.5px] table-auto select-text">
                      <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[9.5px] font-black tracking-wider border-b border-[#0a2c4d]">
                        {/* Linha 1 de Cabeçalho: Super-headers */}
                        <tr className="divide-x divide-white/10 text-center">
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('destino')}
                            className="py-2.5 px-3 text-left font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none min-w-[240px]"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span>DESTINO</span>
                              <span className="text-[9px] opacity-80">
                                {compSortField === 'destino' ? (compSortAsc ? '▲' : '▼') : '▾'}
                              </span>
                            </div>
                          </th>

                          {/* Bloco EM CARTEIRA */}
                          <th
                            colSpan={2}
                            className="py-1.5 px-2 bg-[#123e6b] text-sky-200 border-b border-white/10 font-black tracking-widest text-[10px]"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                              <span>EM CARTEIRA</span>
                            </div>
                          </th>

                          {/* Bloco EM PROCESSO */}
                          <th
                            colSpan={2}
                            className="py-1.5 px-2 bg-[#184880] text-blue-100 border-b border-white/10 font-black tracking-widest text-[10px]"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                              <span>EM PROCESSO</span>
                            </div>
                          </th>

                          {/* TOTAL PÇS */}
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('totalQtd')}
                            className="py-2 px-2 text-center font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none w-[80px] min-w-[80px] bg-[#0a2c4d]"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>Total PÇS</span>
                              <span className="text-[8px] opacity-70">
                                {compSortField === 'totalQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>

                          {/* TOTAL CUB */}
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('totalCub')}
                            className="py-2 px-2 text-center font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#0a2c4d]"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>Total Cub</span>
                              <span className="text-[8px] opacity-70">
                                {compSortField === 'totalCub' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>
                        </tr>

                        {/* Linha 2 de Cabeçalho: Subcolunas */}
                        <tr className="divide-x divide-white/10 text-center text-[9px]">
                          {/* Subcolunas Carteira */}
                          <th
                            onClick={() => handleCompSort('carteiraQtd')}
                            className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[85px] min-w-[85px] bg-[#123e6b] text-sky-100"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>QUANTIDADE</span>
                              <span className="text-[7.5px] opacity-70">
                                {compSortField === 'carteiraQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>
                          <th
                            onClick={() => handleCompSort('carteiraCub')}
                            className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#123e6b] text-sky-100"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>CUBAGEM</span>
                              <span className="text-[7.5px] opacity-70">
                                {compSortField === 'carteiraCub' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>

                          {/* Subcolunas Processo */}
                          <th
                            onClick={() => handleCompSort('processoQtd')}
                            className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[85px] min-w-[85px] bg-[#184880] text-blue-100"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>QUANTIDADE</span>
                              <span className="text-[7.5px] opacity-70">
                                {compSortField === 'processoQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>
                          <th
                            onClick={() => handleCompSort('processoCub')}
                            className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#184880] text-blue-100"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>CUBAGEM</span>
                              <span className="text-[7.5px] opacity-70">
                                {compSortField === 'processoCub' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-sans">
                        {comparativeDestinos.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                              Nenhum destino encontrado com os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          comparativeDestinos.map((row, idx) => (
                            <tr
                              key={row.destino}
                              className={`divide-x divide-slate-100 transition-colors hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                }`}
                            >
                              {/* DESTINO */}
                              <td className="py-1.5 px-3 font-semibold text-slate-800 whitespace-nowrap text-left">
                                {row.destino}
                              </td>

                              {/* EM CARTEIRA - QUANTIDADE */}
                              <td className="py-1.5 px-2 text-center text-slate-700 font-mono font-medium whitespace-nowrap">
                                {row.carteiraQtd > 0 ? Math.round(row.carteiraQtd).toLocaleString('pt-BR') : '-'}
                              </td>

                              {/* EM CARTEIRA - CUBAGEM */}
                              <td className="py-1.5 px-2 text-center text-slate-800 font-mono font-bold whitespace-nowrap">
                                {row.carteiraCub > 0
                                  ? row.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                  : '-'}
                              </td>

                              {/* EM PROCESSO - QUANTIDADE */}
                              <td className="py-1.5 px-2 text-center text-blue-700 bg-blue-50/30 font-mono font-medium whitespace-nowrap">
                                {row.processoQtd > 0 ? Math.round(row.processoQtd).toLocaleString('pt-BR') : '-'}
                              </td>

                              {/* EM PROCESSO - CUBAGEM */}
                              <td className="py-1.5 px-2 text-center text-blue-900 bg-blue-50/30 font-mono font-bold whitespace-nowrap">
                                {row.processoCub > 0
                                  ? row.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                  : '-'}
                              </td>

                              {/* TOTAL PÇS */}
                              <td className="py-1.5 px-2 text-center text-slate-900 bg-slate-100/40 font-mono font-bold whitespace-nowrap">
                                {row.totalQtd > 0 ? Math.round(row.totalQtd).toLocaleString('pt-BR') : '-'}
                              </td>

                              {/* TOTAL CUB */}
                              <td className="py-1.5 px-2 text-center text-slate-950 bg-slate-100/40 font-mono font-black whitespace-nowrap">
                                {row.totalCub > 0
                                  ? row.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                  : '-'}
                              </td>
                            </tr>
                          ))
                        )}

                        {/* TOTAL GERAL */}
                        {comparativeDestinos.length > 0 && (
                          <tr className="bg-[#0e3b66] text-white font-extrabold uppercase text-[10px] tracking-wide border-t-2 border-[#0a2c4d] divide-x divide-white/10 sticky bottom-0 z-10 shadow-md">
                            <td className="py-2.5 px-3 text-left font-black">
                              TOTAL GERAL
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-200">
                              {Math.round(compTotals.carteiraQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-sky-100">
                              {compTotals.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-200 bg-[#164e85]">
                              {Math.round(compTotals.processoQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-sky-100 bg-[#164e85]">
                              {compTotals.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-white bg-[#0a2c4d]">
                              {Math.round(compTotals.totalQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-white bg-[#0a2c4d]">
                              {compTotals.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* LADO DIREITO: ÁREA RESERVADA PARA GRÁFICOS, ONDAS E CRONOGRAMAS */}
              <div className="flex-1 space-y-4 w-full">
                {/* Cards Rápidos de Visão Geral */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Pedidos</span>
                    <span className="text-xl font-black text-slate-800">
                      {(planViewMode === 'comparativo' ? compTotals.totalPedidos : geralPedidos).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {planViewMode === 'comparativo' ? 'Carteira + Processo' : 'Backlog filtrado'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Volume Peças</span>
                    <span className="text-xl font-black text-blue-600">
                      {Math.round(planViewMode === 'comparativo' ? compTotals.totalQtd : geralQtd).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Total de unidades</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cubagem (m³)</span>
                    <span className="text-xl font-black text-purple-600">
                      {(planViewMode === 'comparativo' ? compTotals.totalCub : geralCub).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Espaço cúbico</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Faturamento</span>
                    <span className="text-xl font-black text-emerald-600">
                      {(planViewMode === 'comparativo' ? compTotals.totalValor : geralValor).toLocaleString('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {planViewMode === 'comparativo' ? 'Valor consolidado' : 'Valor em carteira'}
                    </span>
                  </div>
                </div>

                {/* Painel Central Livre para Próximos Gráficos / Planejamento de Carga */}
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                    <Layers size={30} />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h4 className="text-lg font-bold text-slate-800">Área de Visualização Gráfica & Cronogramas</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Este lado direito está totalmente reservado para os próximos módulos: gráficos de cubagem por região, balanceamento de linhas, previsão de saída e distribuição por turnos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      📈 Gráfico de Distribuição
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      🚚 Planejamento de Cargas
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      ⏱️ Sequenciamento por Doca
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 2: PROGRAMAÇÃO (EM CONSTRUÇÃO)                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'programacao' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-2xs flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-50 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <Hammer size={38} className="animate-bounce" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-blue-600 text-white shadow-xs">
              <Sparkles size={13} />
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase tracking-wider">
              Aba: {currentTabInfo.label}
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Módulo em Desenvolvimento
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {currentTabInfo.subtitle}. Esta área consumirá diretamente a tabela da base de dados e os parâmetros configurados na aba <strong>Cadastros Auxiliares</strong>.
            </p>
          </div>

          {/* Cards de Prévia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Database size={14} className="text-blue-600" />
                <span>Base Vinculada</span>
              </div>
              <p className="text-[11px] text-slate-500">Planilha PCP J'S MARTINS.xlsx estruturada e pronta para alimentar o cálculo.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Layers size={14} className="text-purple-600" />
                <span>Planejamento Dinâmico</span>
              </div>
              <p className="text-[11px] text-slate-500">Agrupamento por Modalidade, status de operação, cubagem de saída e linha.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <CalendarDays size={14} className="text-emerald-600" />
                <span>Programação Diária</span>
              </div>
              <p className="text-[11px] text-slate-500">Sequenciamento de pedidos e distribuição por docas e rotas.</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL DE SINCRONIZAÇÃO DIRETA COM ORACLE MLPDW                     */}
      {/* ------------------------------------------------------------------ */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#002f5c] to-[#0a4a82] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Database size={18} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Sincronização da Carteira</h3>
                  <p className="text-[11px] text-blue-200">Oracle MLPDW ➔ Supabase (pcp_js_martins)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSyncingOracle) setIsSyncModalOpen(false)
                }}
                disabled={isSyncingOracle}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-4">
              {/* Barra de Progresso */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Progresso</span>
                  <span className="text-blue-600 font-bold">{syncStatus.progress || (isSyncingOracle ? 15 : 0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${syncStatus.status === 'error'
                      ? 'bg-rose-500'
                      : syncStatus.status === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse'
                      }`}
                    style={{ width: `${Math.max(5, syncStatus.progress || (isSyncingOracle ? 15 : 0))}%` }}
                  />
                </div>
              </div>

              {/* Mensagem de Status */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${syncStatus.status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : syncStatus.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  {syncStatus.status === 'error' ? (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  ) : syncStatus.status === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw size={18} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">
                      {syncStatus.status === 'error'
                        ? 'Status da Conexão'
                        : syncStatus.status === 'success'
                          ? 'Sincronização Concluída'
                          : 'Executando Sincronização'}
                    </p>
                    <p className="text-[11.5px] opacity-90 break-words whitespace-pre-line">
                      {syncStatus.message || (isSyncingOracle ? 'Aguardando resposta do Oracle...' : 'Pronto para atualizar.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerta de Orientação quando der erro de VPN ou aguardando servidor */}
              {(syncStatus.status === 'error' || syncStatus.status === 'requested') && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle size={13} /> Dica de Conexão no Servidor da Empresa:
                  </p>
                  <p>
                    1. Certifique-se de que o arquivo <strong><code>atualizar_carteira_servidor.bat</code></strong> (ou <code>sincronizador_servidor.py</code>) está aberto no servidor corporativo (ele fica ouvindo os cliques do site em segundo plano).
                  </p>
                  <p>
                    2. Você também pode dar 2 cliques diretamente no <code>atualizar_carteira_servidor.bat</code> na Área de Trabalho do servidor a qualquer momento.
                  </p>
                </div>
              )}

              {/* Etapas do Processo */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Etapas da Consulta:</div>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 10 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">1</span>
                    <span>Conexão VPN & Oracle MLPDW (DSN MLPDW)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 30 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">2</span>
                    <span>Execução da Query da Carteira (53 colunas)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 60 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">3</span>
                    <span>Gravação em Lote no Supabase (pcp_js_martins)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 100 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">4</span>
                    <span>Atualização Instantânea da Página</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              {isSyncingOracle ? (
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 cursor-pointer"
                >
                  Minimizar (continua em segundo plano)
                </button>
              ) : syncStatus.status === 'error' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncOracleCarteira}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
