import React, { useState, useEffect, useRef } from 'react'
import { 
  Save, CheckCircle2, FileSpreadsheet, Server, Plus, Trash2, X, Edit3, 
  Filter, ChevronRight, ClipboardList, AlertTriangle, Calendar, FileText,
  Bold, Italic, List, ListOrdered, CheckSquare, Maximize2, Minimize2, User, Clock, Flag, Tag, HelpCircle, Type
} from 'lucide-react'



export type DataType = 'text' | 'percentage' | 'number' | 'decimal' | 'currency'

export type GroupType = 'cx_clientes' | 'operacoes' | 'gestao' | 'qualidade_cte' | 'outros'

interface GroupInfo {
  id: GroupType
  name: string
  color: string
}

const DEFAULT_GROUPS: GroupInfo[] = [
  { id: 'cx_clientes', name: 'CX Clientes', color: 'bg-blue-600 text-white' },
  { id: 'operacoes', name: 'Operações', color: 'bg-indigo-600 text-white' },
  { id: 'gestao', name: 'Gestão', color: 'bg-emerald-600 text-white' },
  { id: 'qualidade_cte', name: 'Qualidade CTE', color: 'bg-amber-600 text-white' },
  { id: 'outros', name: 'Outros', color: 'bg-slate-600 text-white' }
]

interface IndicatorSubRow {
  id: string
  label: string
  defaultValue: string
  metaDefault?: string
  dataType?: DataType
}

interface IndicatorCategory {
  id: string
  category: string
  groupId: GroupType
  metaGroupDefault?: string[]
  subRows: IndicatorSubRow[]
}

interface SubItemDraft {
  id?: string
  name: string
  meta: string
  dataType: DataType
}

const DEFAULT_CATEGORIES: IndicatorCategory[] = [
  {
    id: 'ns_cliente',
    category: 'NS Cliente',
    groupId: 'cx_clientes',
    metaGroupDefault: ['97,0% 100%', '96,0% 75%', '94,5% 50%'],
    subRows: [
      { id: 'micro', label: 'Micro', defaultValue: '98%', dataType: 'percentage' },
      { id: 'rodo', label: 'Rodo', defaultValue: '97%', dataType: 'percentage' },
      { id: 'courrie', label: 'Courrie', defaultValue: '95%', dataType: 'percentage' },
      { id: 'ns_diario', label: 'NS Diário', defaultValue: '97%', dataType: 'percentage' },
      { id: 'ns_mensal', label: 'NS Mensal', defaultValue: '97%', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'fulfillment',
    category: 'Fulfillment',
    groupId: 'cx_clientes',
    metaGroupDefault: ['>99,2% 100%', '>98,7% 75%', '>98,2% 50%'],
    subRows: [
      { id: 'full_diario', label: 'Full Diário', defaultValue: '', dataType: 'percentage' },
      { id: 'full_mensal', label: 'Full Mensal', defaultValue: '', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'ns_saida_eclusa',
    category: 'NS Saída Eclusa',
    groupId: 'cx_clientes',
    metaGroupDefault: ['>99,2% 100%', '>98,7% 75%', '>98,2% 50%'],
    subRows: [
      { id: 'micro', label: 'Micro', defaultValue: '98%', dataType: 'percentage' },
      { id: 'rodo', label: 'Rodo', defaultValue: '97%', dataType: 'percentage' },
      { id: 'courrie', label: 'Courrie', defaultValue: '95%', dataType: 'percentage' },
      { id: 'eclusa_diario', label: 'Eclusa Diário', defaultValue: '97%', dataType: 'percentage' },
      { id: 'eclusa_mensal', label: 'Eclusa Mensal', defaultValue: '97%', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'ns_rle',
    category: 'NS RLE',
    groupId: 'cx_clientes',
    metaGroupDefault: ['95%'],
    subRows: [
      { id: 'rle_diario', label: 'RLE Diário', defaultValue: '100%', dataType: 'percentage' },
      { id: 'rle_mensal', label: 'RLE Mensal', defaultValue: '99%', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'gestao_cx',
    category: 'Gestão de Atendimento e Reclamações (CX)',
    groupId: 'cx_clientes',
    subRows: [
      { id: 'rec_mes', label: '% Reclamações (Mês)', defaultValue: '0,96%', metaDefault: '<1,5%', dataType: 'percentage' },
      { id: 'rec_diario', label: '% Reclamações (Diário)', defaultValue: '0%', metaDefault: '<1,5%', dataType: 'percentage' },
      { id: 'backlog_zendesk', label: 'Backlog zendesk (Diário)', defaultValue: '21', metaDefault: '>5 dias = 0', dataType: 'number' },
      { id: 'chamados_loja', label: 'Chamados de loja (Diário)', defaultValue: '23', metaDefault: '>10 dias = 0', dataType: 'number' },
      { id: 'nps_lojas', label: 'NPS lojas (Diário)', defaultValue: '88%', metaDefault: '80%', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'consta_entregue',
    category: 'Consta Entregue',
    groupId: 'cx_clientes',
    metaGroupDefault: ['0,38% 80%', '0,27% 100%', '0,15% 120%'],
    subRows: [
      { id: 'consta_diario', label: 'Consta Diário', defaultValue: '', dataType: 'percentage' },
      { id: 'consta_mensal', label: 'Consta Mensal', defaultValue: '', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'coletas',
    category: 'Coletas',
    groupId: 'cx_clientes',
    metaGroupDefault: ['-'],
    subRows: [
      { id: 'coletas_diario', label: 'Coletas Diário', defaultValue: '', dataType: 'number' },
      { id: 'coletas_mensal', label: 'Coletas Mensal', defaultValue: '', dataType: 'number' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'expedicao',
    category: 'Expedição',
    groupId: 'operacoes',
    subRows: [
      { id: 'pedidos', label: 'Pedidos', defaultValue: '3.500', metaDefault: '7.000', dataType: 'number' },
      { id: 'pecas', label: 'Peças', defaultValue: '8.000', metaDefault: '800', dataType: 'number' },
      { id: 'cubagem', label: 'Cubagem', defaultValue: '920', metaDefault: '27', dataType: 'decimal' },
      { id: 'qnts_veiculos', label: 'Qnts Veículos', defaultValue: '32', metaDefault: '-', dataType: 'number' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'recebimento',
    category: 'Recebimento',
    groupId: 'operacoes',
    subRows: [
      { id: 'pecas', label: 'Peças', defaultValue: '12000', metaDefault: '-', dataType: 'number' },
      { id: 'cubagem', label: 'Cubagem', defaultValue: '1400', metaDefault: '14', dataType: 'decimal' },
      { id: 'agendas', label: 'Agendas', defaultValue: '15', metaDefault: '2', dataType: 'number' },
      { id: 'transfs', label: 'Transfs', defaultValue: '3', metaDefault: '-', dataType: 'number' },
      { id: 'no_show', label: 'No Show', defaultValue: '10%', metaDefault: '15%', dataType: 'percentage' },
      { id: 'backlog', label: 'Backlog', defaultValue: '0', metaDefault: '0', dataType: 'number' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'quadro',
    category: 'Quadro',
    groupId: 'gestao',
    subRows: [
      { id: 'conferente', label: 'Conferente(s)', defaultValue: '31', metaDefault: '33', dataType: 'number' },
      { id: 'cd', label: 'C&D', defaultValue: '22', metaDefault: '24', dataType: 'number' },
      { id: 'quadro_op', label: 'Quadro Op', defaultValue: '91', metaDefault: '92', dataType: 'number' },
      { id: 'quadro_cd', label: 'Quadro C&D', defaultValue: '40', metaDefault: '43', dataType: 'number' },
      { id: 'absenteismo_conf', label: 'Abesenteísmo Conf e C&D', defaultValue: '2%', metaDefault: '<3%', dataType: 'percentage' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'pcp',
    category: 'PCP - PLANEJAMENTO E CONTROLE DA PRODUÇÃO',
    groupId: 'operacoes',
    subRows: [
      { id: 'carteira_tt', label: 'Carteira TT', defaultValue: '1.0', metaDefault: '1.0', dataType: 'decimal' },
      { id: 'aba', label: 'ABA', defaultValue: '400', metaDefault: '-', dataType: 'number' },
      { id: 'courrie', label: 'Courrie', defaultValue: '', metaDefault: '-', dataType: 'text' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  },
  {
    id: 'controle_estoque',
    category: 'CONTROLE DE ESTOQUE',
    groupId: 'qualidade_cte',
    subRows: [
      { id: 'qualidade_estoque', label: 'Qualidade de Estoque (Bloqueios)', defaultValue: '99,80', metaDefault: '99,80', dataType: 'percentage' },
      { id: 'avaria', label: 'Avaria', defaultValue: '16.00', metaDefault: '16.00', dataType: 'decimal' },
      { id: 'rotativo', label: 'Rotativo', defaultValue: '', metaDefault: '-', dataType: 'percentage' },
      { id: 'bloqueios_geral_tt', label: 'Bloqueios Geral TT Valor', defaultValue: '', metaDefault: '-', dataType: 'currency' },
      { id: 'plano_acao', label: 'Plano de Ação', defaultValue: '', metaDefault: '-', dataType: 'text' }
    ]
  }
]

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Gerar dinamicamente todos os 31 dias de Outubro de 2026
const DAYS_HEADER = Array.from({ length: 31 }, (_, i) => {
  const dayNum = i + 1
  const dateObj = new Date(2026, 9, dayNum) // Outubro = mês index 9
  const dayName = WEEKDAYS_PT[dateObj.getDay()]
  const dateStr = `${dayNum.toString().padStart(2, '0')}/out`
  return {
    day: dayName,
    date: dateStr,
    colId: dateStr,
    dayNum
  }
})

import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/performance'


function formatValueByType(val: string, type?: DataType): string {
  if (!val || val.trim() === '' || val === '-') return val
  const trimmed = val.trim()

  switch (type) {
    case 'percentage': {
      if (!trimmed.includes('%') && !isNaN(Number(trimmed.replace(',', '.')))) {
        return `${trimmed}%`
      }
      return trimmed
    }
    case 'currency': {
      if (!trimmed.startsWith('R$') && !isNaN(Number(trimmed.replace(/[^0-9,-]/g, '').replace(',', '.')))) {
        return `R$ ${trimmed}`
      }
      return trimmed
    }
    case 'decimal': {
      const parsed = parseFloat(trimmed.replace(',', '.'))
      if (!isNaN(parsed) && !trimmed.includes(',')) {
        return parsed.toFixed(2).replace('.', ',')
      }
      return trimmed
    }
    default:
      return trimmed
  }
}

export const PerformancePage: React.FC = () => {
  const [groupsList, setGroupsList] = useState<GroupInfo[]>(() => {
    const saved = localStorage.getItem('magalog_custom_groups')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Erro ao carregar agrupamentos salvos', e)
      }
    }
    return DEFAULT_GROUPS
  })

  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const [categories, setCategories] = useState<IndicatorCategory[]>(() => {
    const saved = localStorage.getItem('magalog_custom_categories')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Erro ao ler categorias salvas', e)
      }
    }
    return DEFAULT_CATEGORIES
  })

  // Filtro Nível 1: Agrupamentos Selecionados ([] = Todos)
  const [selectedGroupFilters, setSelectedGroupFilters] = useState<GroupType[]>([])

  // Filtro Nível 2: Indicadores Selecionados ([] = Todos)
  const [selectedIndicatorFilters, setSelectedIndicatorFilters] = useState<string[]>([])

  // Filtro Nível 3: Sub-indicadores Selecionados ([] = Todos)
  const [selectedSubIndicatorFilters, setSelectedSubIndicatorFilters] = useState<string[]>([])

  // Filtro Nível 4: Datas Selecionadas (Faixa De/Até e Chips de Seleção)
  const [selectedDateFilters, setSelectedDateFilters] = useState<string[]>([])
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)

  const toggleDateFilter = (colId: string) => {
    setSelectedDateFilters(prev =>
      prev.includes(colId) ? prev.filter(d => d !== colId) : [...prev, colId]
    )
  }

  // Datas filtradas para as colunas da tabela
  const filteredDays = DAYS_HEADER.filter(d => {
    // Se houver datas específicas selecionadas por chips
    if (selectedDateFilters.length > 0) {
      if (!selectedDateFilters.includes(d.colId)) return false
    }

    // Se houver faixa de data (De / Até)
    if (startDateFilter || endDateFilter) {
      // Data da coluna no formato '2026-10-DD'
      const colDateStr = `2026-10-${d.dayNum.toString().padStart(2, '0')}`

      if (startDateFilter && colDateStr < startDateFilter) {
        return false
      }
      if (endDateFilter && colDateStr > endDateFilter) {
        return false
      }
    }

    return true
  })

  // Estados de Abertura dos Dropdowns Customizados
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false)
  const [isSubIndicatorDropdownOpen, setIsSubIndicatorDropdownOpen] = useState(false)

  // Referência para detectar cliques fora do painel de filtros e fechar os dropdowns automaticamente
  const filterBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setIsIndicatorDropdownOpen(false)
        setIsSubIndicatorDropdownOpen(false)
        setIsDateDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handlers de Alternância de Agrupamento
  const toggleGroupFilter = (groupId: GroupType) => {
    setSelectedGroupFilters(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    )
  }

  const toggleIndicatorFilter = (id: string) => {
    setSelectedIndicatorFilters(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSubIndicatorFilter = (id: string) => {
    setSelectedSubIndicatorFilters(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Modal para Criar Novo Indicador ou Editar Categoria Existente
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [indicatorName, setIndicatorName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<GroupType>('cx_clientes')
  const [subItemsDraft, setSubItemsDraft] = useState<SubItemDraft[]>([
    { name: '', meta: '', dataType: 'percentage' }
  ])

  // Modal para Formulário de Plano de Ação e Ocorrências por dia
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isActionModalExpanded, setIsActionModalExpanded] = useState(false)
  const [actionModalCellKey, setActionModalCellKey] = useState('')
  const [actionModalTitle, setActionModalTitle] = useState('')
  const [actionModalDate, setActionModalDate] = useState('')
  
  const [ocorrenciasInput, setOcorrenciasInput] = useState('')
  const [planoAcaoInput, setPlanoAcaoInput] = useState('')
  const [responsavelInput, setResponsavelInput] = useState('')
  const [prazoInput, setPrazoInput] = useState('')
  const [prioridadeInput, setPrioridadeInput] = useState<'baixa' | 'media' | 'alta' | 'critica'>('media')
  const [statusAcaoInput, setStatusAcaoInput] = useState<'pendente' | 'em_andamento' | 'concluido'>('pendente')
  const [ocorrenciasFontSize, setOcorrenciasFontSize] = useState<number>(14)
  const [planoAcaoFontSize, setPlanoAcaoFontSize] = useState<number>(14)

  const ocorrenciasRef = useRef<HTMLTextAreaElement>(null)
  const planoAcaoRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.max(textarea.scrollHeight + 4, 180)}px`
  }

  useEffect(() => {
    if (isActionModalOpen) {
      setTimeout(() => {
        adjustTextareaHeight(ocorrenciasRef.current)
        adjustTextareaHeight(planoAcaoRef.current)
      }, 50)
    }
  }, [isActionModalOpen, ocorrenciasInput, planoAcaoInput, isActionModalExpanded])

  const insertFormatting = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    prefix: string,
    suffix: string = ''
  ) => {
    const textarea = ref.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)
    const replacement = `${prefix}${selectedText || 'texto'}${suffix}`
    const newText = text.substring(0, start) + replacement + text.substring(end)
    setValue(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      adjustTextareaHeight(textarea)
    }, 50)
  }

  const handleOpenActionModal = (catName: string, dateLabel: string, cellKey: string) => {
    setActionModalCellKey(cellKey)
    setActionModalTitle(catName)
    setActionModalDate(dateLabel)
    setIsActionModalExpanded(false)

    // Tentar ler JSON de ação salvo ou converter texto simples
    const rawVal = data[cellKey] || ''
    if (rawVal.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawVal)
        setOcorrenciasInput(parsed.ocorrencias || '')
        setPlanoAcaoInput(parsed.planoAcao || '')
        setResponsavelInput(parsed.responsavel || '')
        setPrazoInput(parsed.prazo || '')
        setPrioridadeInput(parsed.prioridade || 'media')
        setStatusAcaoInput(parsed.statusAcao || 'pendente')
        setOcorrenciasFontSize(parsed.ocorrenciasFontSize || 14)
        setPlanoAcaoFontSize(parsed.planoAcaoFontSize || 14)
      } catch (e) {
        setOcorrenciasInput('')
        setPlanoAcaoInput(rawVal)
        setResponsavelInput('')
        setPrazoInput('')
        setPrioridadeInput('media')
        setStatusAcaoInput('pendente')
        setOcorrenciasFontSize(14)
        setPlanoAcaoFontSize(14)
      }
    } else {
      setOcorrenciasInput('')
      setPlanoAcaoInput(rawVal)
      setResponsavelInput('')
      setPrazoInput('')
      setPrioridadeInput('media')
      setStatusAcaoInput('pendente')
      setOcorrenciasFontSize(14)
      setPlanoAcaoFontSize(14)
    }

    setIsActionModalOpen(true)
  }

  const handleSaveActionModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionModalCellKey) return

    const hasText = Boolean(
      (ocorrenciasInput && ocorrenciasInput.trim() !== '') ||
      (planoAcaoInput && planoAcaoInput.trim() !== '')
    )

    if (!hasText) {
      saveCell(actionModalCellKey, '')
    } else {
      const payload = JSON.stringify({
        ocorrencias: ocorrenciasInput,
        planoAcao: planoAcaoInput,
        responsavel: responsavelInput,
        prazo: prazoInput,
        prioridade: prioridadeInput,
        statusAcao: statusAcaoInput,
        ocorrenciasFontSize,
        planoAcaoFontSize
      })

      saveCell(actionModalCellKey, payload)
    }

    setIsActionModalOpen(false)
  }

  const handleClearActionModal = () => {
    if (!actionModalCellKey) return
    saveCell(actionModalCellKey, '')
    setIsActionModalOpen(false)
  }


  const [data, setData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    DEFAULT_CATEGORIES.forEach(cat => {
      cat.subRows.forEach(sub => {
        if (sub.defaultValue) {
          initial[`${cat.id}_${sub.id}_01/out`] = sub.defaultValue
        }
        if (sub.metaDefault) {
          initial[`meta_${cat.id}_${sub.id}`] = sub.metaDefault
        }
      })
      if (cat.metaGroupDefault) {
        cat.metaGroupDefault.forEach((m, idx) => {
          initial[`metaGroup_${cat.id}_${idx}`] = m
        })
      }
    })
    return initial
  })

  const [savedStatus, setSavedStatus] = useState(false)
  const [isDbSynced, setIsDbSynced] = useState(false)

  useEffect(() => {
    // Carregar dados iniciais do Supabase
    const loadFromSupabase = async () => {
      try {
        const { data: dbRows, error } = await supabase
          .from('performance_metrics')
          .select('cell_key, value')

        if (!error && dbRows && dbRows.length > 0) {
          const map: Record<string, string> = {}
          dbRows.forEach(row => {
            map[row.cell_key] = row.value
          })
          setData(prev => ({ ...prev, ...map }))
          setIsDbSynced(true)
        } else {
          // Fallback para API Node local caso necessário
          fetch(API_URL)
            .then(res => res.json())
            .then(dbData => {
              if (dbData && Object.keys(dbData).length > 0) {
                setData(prev => ({ ...prev, ...dbData }))
                setIsDbSynced(true)
              }
            })
            .catch(err => console.warn('Usando backup local.', err))
        }
      } catch (e) {
        console.warn('Erro ao carregar do Supabase:', e)
      }
    }

    loadFromSupabase()

    // Inscrição em tempo real no Supabase para sincronizar Vercel <-> Local instantaneamente
    const channel = supabase
      .channel('performance_metrics_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_metrics' },
        (payload: any) => {
          if (payload.new && payload.new.cell_key) {
            setData(prev => ({
              ...prev,
              [payload.new.cell_key]: payload.new.value
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const saveCell = async (cellKey: string, value: string) => {
    setData(prev => ({
      ...prev,
      [cellKey]: value
    }))

    // Salvar diretamente no Supabase (funciona na Vercel e no Local)
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .upsert({ cell_key: cellKey, value }, { onConflict: 'cell_key' })

      if (!error) {
        setIsDbSynced(true)
      } else {
        // Tenta API Node local como fallback
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cellKey, value })
        }).catch(err => console.error('Erro ao gravar no banco:', err))
      }
    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err)
    }

    localStorage.setItem('magalog_performance_data', JSON.stringify({ ...data, [cellKey]: value }))
    setSavedStatus(true)
    setTimeout(() => setSavedStatus(false), 2000)
  }

  const handleCellBlur = (cellKey: string, rawValue: string, type?: DataType) => {
    const formatted = formatValueByType(rawValue, type)
    if (formatted !== rawValue) {
      saveCell(cellKey, formatted)
    }
  }

  const handleSave = async () => {
    const records = Object.keys(data).map(key => ({
      cell_key: key,
      value: String(data[key])
    }))

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .upsert(records, { onConflict: 'cell_key' })

      if (!error) {
        setIsDbSynced(true)
        setSavedStatus(true)
        setTimeout(() => setSavedStatus(false), 3000)
      } else {
        fetch(`${API_URL}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(err => console.error('Erro bulk:', err))
      }
    } catch (err) {
      console.error('Erro ao salvar lote no Supabase:', err)
    }

    localStorage.setItem('magalog_performance_data', JSON.stringify(data))
  }


  const handleCreateNewGroupInline = () => {
    if (!newGroupName.trim()) return
    const newId = newGroupName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now() as GroupType
    const colors = [
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
      'bg-cyan-600 text-white',
      'bg-teal-600 text-white',
      'bg-violet-600 text-white',
      'bg-amber-600 text-white'
    ]
    const randomColor = colors[groupsList.length % colors.length]
    
    const newGroupInfo: GroupInfo = {
      id: newId,
      name: newGroupName.trim(),
      color: randomColor
    }

    const updatedGroups = [...groupsList, newGroupInfo]
    setGroupsList(updatedGroups)
    localStorage.setItem('magalog_custom_groups', JSON.stringify(updatedGroups))
    setSelectedGroupId(newId)
    setNewGroupName('')
    setIsCreatingNewGroup(false)
  }

  const handleOpenCreateModal = () => {
    setEditingCategoryId(null)
    setIndicatorName('')
    setSelectedGroupId('cx_clientes')
    setSubItemsDraft([{ name: '', meta: '', dataType: 'percentage' }])
    setIsCreatingNewGroup(false)
    setNewGroupName('')
    setIsModalOpen(true)
  }

  const handleOpenEditCategoryModal = (cat: IndicatorCategory) => {
    setEditingCategoryId(cat.id)
    setIndicatorName(cat.category)
    setSelectedGroupId(cat.groupId || 'cx_clientes')
    setSubItemsDraft(
      cat.subRows.map(sub => ({
        id: sub.id,
        name: sub.label,
        meta: data[`meta_${cat.id}_${sub.id}`] !== undefined ? data[`meta_${cat.id}_${sub.id}`] : sub.metaDefault || '',
        dataType: sub.dataType || 'percentage'
      }))
    )
    setIsModalOpen(true)
  }

  const handleAddSubItemDraft = () => {
    setSubItemsDraft(prev => [...prev, { name: '', meta: '', dataType: 'percentage' }])
  }

  const handleRemoveSubItemDraft = (index: number) => {
    setSubItemsDraft(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSubItemChange = (index: number, field: keyof SubItemDraft, value: any) => {
    setSubItemsDraft(prev => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!indicatorName.trim()) return

    const validSubItems = subItemsDraft.filter(item => item.name.trim() !== '')
    if (validSubItems.length === 0) return

    const catId = editingCategoryId || indicatorName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()

    const createdSubRows: IndicatorSubRow[] = validSubItems.map((item, idx) => {
      const subId = item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + idx
      if (item.meta.trim()) {
        saveCell(`meta_${catId}_${subId}`, item.meta.trim())
      }
      return {
        id: subId,
        label: item.name.trim(),
        defaultValue: '',
        metaDefault: item.meta.trim() || '-',
        dataType: item.dataType
      }
    })

    if (editingCategoryId) {
      const updatedCategories = categories.map(cat => {
        if (cat.id === editingCategoryId) {
          return {
            ...cat,
            category: indicatorName.trim(),
            groupId: selectedGroupId,
            subRows: createdSubRows
          }
        }
        return cat
      })
      setCategories(updatedCategories)
      localStorage.setItem('magalog_custom_categories', JSON.stringify(updatedCategories))
    } else {
      const newCategory: IndicatorCategory = {
        id: catId,
        category: indicatorName.trim(),
        groupId: selectedGroupId,
        subRows: createdSubRows
      }
      const updatedCategories = [...categories, newCategory]
      setCategories(updatedCategories)
      localStorage.setItem('magalog_custom_categories', JSON.stringify(updatedCategories))
    }

    setIsModalOpen(false)
  }

  // Lista de Indicadores disponíveis com base nos agrupamentos filtrados
  const availableIndicators = selectedGroupFilters.length === 0
    ? categories
    : categories.filter(c => selectedGroupFilters.includes(c.groupId))

  // Sub-indicadores disponíveis com chave composta única (categoryId::subId)
  const availableSubRowsWithKey = selectedIndicatorFilters.length === 0
    ? availableIndicators.flatMap(c => c.subRows.map(sub => ({ ...sub, fullKey: `${c.id}::${sub.id}`, catCategory: c.category })))
    : availableIndicators.filter(c => selectedIndicatorFilters.includes(c.id)).flatMap(c => c.subRows.map(sub => ({ ...sub, fullKey: `${c.id}::${sub.id}`, catCategory: c.category })))

  // Filtrar a estrutura de categorias de acordo com os 3 níveis de filtros selecionados
  const filteredCategories = categories
    .filter(cat => {
      const matchesGroup = selectedGroupFilters.length === 0 || selectedGroupFilters.includes(cat.groupId)
      const matchesIndicator = selectedIndicatorFilters.length === 0 || selectedIndicatorFilters.includes(cat.id)
      return matchesGroup && matchesIndicator
    })
    .map(cat => {
      if (selectedSubIndicatorFilters.length === 0) return cat
      return {
        ...cat,
        subRows: cat.subRows.filter(sub => {
          const fullKey = `${cat.id}::${sub.id}`
          return selectedSubIndicatorFilters.includes(fullKey) || selectedSubIndicatorFilters.includes(sub.id) || selectedSubIndicatorFilters.includes(sub.label)
        })
      }
    })
    .filter(cat => cat.subRows.length > 0)

  return (
    <div className="space-y-4 w-full">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Painel Diário de Performance & Indicadores Operacionais
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>Insira diariamente os valores de metas, expedição, recebimento, CX, PCP e controle de estoque dos CDs.</span>
              {isDbSynced && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Server size={11} /> Conectado ao Banco de Dados
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {savedStatus && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={14} /> Salvo no Banco!
            </span>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all"
          >
            <Plus size={15} />
            Novo Indicador
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Save size={15} />
            Salvar Lançamentos
          </button>
        </div>
      </div>

      {/* Painel Duplo de Filtros de Múltipla Seleção (Segmentação por Agrupamento + Multi-select Popovers para Indicador e Sub-indicador) */}
      <div ref={filterBarRef} className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {/* Nível 1: Botões de Segmentação de Agrupamentos (Múltipla Seleção) */}
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-2 pl-1 shrink-0">
            <Filter size={14} className="text-blue-600" />
            <span>Agrupamentos:</span>
          </div>

          <button
            onClick={() => setSelectedGroupFilters([])}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGroupFilters.length === 0
                ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({categories.length})
          </button>

          {groupsList.map(group => {
            const count = categories.filter(c => c.groupId === group.id).length
            const isActive = selectedGroupFilters.includes(group.id)
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroupFilter(group.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? `${group.color} shadow-sm ring-2 ring-offset-1 ring-blue-500 font-bold`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  readOnly
                  className="rounded text-blue-600 focus:ring-0 pointer-events-none w-3.5 h-3.5"
                />
                <span>{group.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Nível 2 e 3: Multi-Select Popovers Alinhados com as Colunas da Tabela */}
        <div className="p-2.5 bg-slate-50/70 rounded-b-xl flex items-center gap-2 relative">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 shrink-0 w-44">
            <ChevronRight size={14} className="text-blue-600" />
            <span>Sub-filtros (Múltipla Seleção):</span>
          </div>

          {/* Dropdown Multi-Select 1: Indicador (Largura Alinhada com a Coluna 1 da Tabela: w-48 / 12rem) */}
          <div className="relative w-48 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen)
                setIsSubIndicatorDropdownOpen(false)
              }}
              className="w-full flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-xs text-xs font-bold text-blue-900 hover:border-blue-400 transition-all text-left"
            >
              <div className="truncate flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Ind:</span>
                <span className="truncate">
                  {selectedIndicatorFilters.length === 0
                    ? 'Todos Indicadores'
                    : `${selectedIndicatorFilters.length} selecionado(s)`}
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                {selectedIndicatorFilters.length === 0 ? availableIndicators.length : selectedIndicatorFilters.length}
              </span>
            </button>

            {isIndicatorDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 md:w-[420px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-1.5 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Indicadores</span>
                  {selectedIndicatorFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndicatorFilters([])
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Limpar ({selectedIndicatorFilters.length})
                    </button>
                  )}
                </div>

                <div
                  onClick={() => setSelectedIndicatorFilters([])}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800 select-none border-b border-slate-100 mb-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndicatorFilters.length === 0}
                    onChange={() => setSelectedIndicatorFilters([])}
                    className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                  />
                  <span>Todos os Indicadores</span>
                </div>

                {availableIndicators.map(cat => {
                  const isChecked = selectedIndicatorFilters.includes(cat.id)
                  return (
                    <div
                      key={cat.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleIndicatorFilter(cat.id)
                      }}
                      className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all select-none ${
                        isChecked ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none shrink-0"
                        />
                        <span className="leading-snug break-words">{cat.category}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dropdown Multi-Select 2: Sub-indicador */}
          <div className="relative w-48 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSubIndicatorDropdownOpen(!isSubIndicatorDropdownOpen)
                setIsIndicatorDropdownOpen(false)
                setIsDateDropdownOpen(false)
              }}
              className="w-full flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-xs text-xs font-bold text-indigo-900 hover:border-indigo-400 transition-all text-left"
            >
              <div className="truncate flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Sub:</span>
                <span className="truncate">
                  {selectedSubIndicatorFilters.length === 0
                    ? 'Todos Sub-ind.'
                    : `${selectedSubIndicatorFilters.length} selecionado(s)`}
                </span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                {selectedSubIndicatorFilters.length === 0 ? availableSubRowsWithKey.length : selectedSubIndicatorFilters.length}
              </span>
            </button>

            {isSubIndicatorDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 md:w-[480px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-1.5 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Sub-indicadores</span>
                  {selectedSubIndicatorFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSubIndicatorFilters([])
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      Limpar ({selectedSubIndicatorFilters.length})
                    </button>
                  )}
                </div>

                <div
                  onClick={() => setSelectedSubIndicatorFilters([])}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800 select-none border-b border-slate-100 mb-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubIndicatorFilters.length === 0}
                    onChange={() => setSelectedSubIndicatorFilters([])}
                    className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                  />
                  <span>Todos os Sub-indicadores</span>
                </div>

                {availableSubRowsWithKey.map((sub) => {
                  const isChecked = selectedSubIndicatorFilters.includes(sub.fullKey)
                  return (
                    <div
                      key={sub.fullKey}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSubIndicatorFilter(sub.fullKey)
                      }}
                      className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all select-none ${
                        isChecked ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none shrink-0"
                        />
                        <span className="leading-snug break-words">{sub.label}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold shrink-0 border border-slate-200">
                        {sub.catCategory}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dropdown Multi-Select 3: Filtro por Período / Calendário Contínuo */}
          <div className="relative w-48 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen)
                setIsIndicatorDropdownOpen(false)
                setIsSubIndicatorDropdownOpen(false)
              }}
              className="w-full flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-xs text-xs font-bold text-amber-900 hover:border-amber-400 transition-all text-left"
            >
              <div className="truncate flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Data:</span>
                <span className="truncate">
                  {startDateFilter || endDateFilter
                    ? `${startDateFilter ? startDateFilter.split('-').reverse().slice(0,2).join('/') : 'Início'} à ${endDateFilter ? endDateFilter.split('-').reverse().slice(0,2).join('/') : 'Fim'}`
                    : selectedDateFilters.length === 0
                      ? `Todas as Datas (${DAYS_HEADER.length})`
                      : `${selectedDateFilters.length} dia(s)`}
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                {filteredDays.length}
              </span>
            </button>

            {isDateDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 space-y-2.5 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">Calendário & Período (Dia/Mês/Ano)</span>
                  {(selectedDateFilters.length > 0 || startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDateFilters([])
                        setStartDateFilter('')
                        setEndDateFilter('')
                      }}
                      className="text-[10px] text-amber-700 hover:underline font-bold"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                {/* Seleção Contínua por Calendário (De / Até) */}
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-amber-900 uppercase">Faixa de Datas Contínua:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">De (Início):</label>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={e => {
                          setStartDateFilter(e.target.value)
                          setSelectedDateFilters([])
                        }}
                        className="w-full px-2 py-1 rounded-md text-xs border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Até (Fim):</label>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={e => {
                          setEndDateFilter(e.target.value)
                          setSelectedDateFilters([])
                        }}
                        className="w-full px-2 py-1 rounded-md text-xs border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedDateFilters([])
                    setStartDateFilter('')
                    setEndDateFilter('')
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800 select-none border-b border-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedDateFilters.length === 0 && !startDateFilter && !endDateFilter}
                    onChange={() => {
                      setSelectedDateFilters([])
                      setStartDateFilter('')
                      setEndDateFilter('')
                    }}
                    className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                  />
                  <span>Exibir Todos os Dias ({DAYS_HEADER.length})</span>
                </div>

                {/* Seleção Rápida por Chips de Dias */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Seleção Rápida por Dia:</span>
                  <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                    {DAYS_HEADER.map((d) => {
                      const isChecked = selectedDateFilters.includes(d.colId)
                      const isWeekend = d.day === 'Sábado' || d.day === 'Domingo'
                      return (
                        <div
                          key={d.colId}
                          onClick={(e) => {
                            e.stopPropagation()
                            setStartDateFilter('')
                            setEndDateFilter('')
                            toggleDateFilter(d.colId)
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all select-none border ${
                            isChecked
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                              : 'border-slate-100 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 pointer-events-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none shrink-0"
                            />
                            <span className="font-semibold text-[11px]">{d.date}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1 rounded ${isWeekend ? 'bg-amber-200 text-amber-900' : 'text-slate-500'}`}>
                            {d.day.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Header Row */}
              <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-700">
                <th className="p-2.5 border-r border-slate-700 text-center w-48 font-bold bg-slate-950 sticky left-0 z-30 shadow-md">
                  Indicador
                </th>
                <th className="p-2 border-r border-slate-700 text-center min-w-[155px] w-44 font-bold bg-blue-950 text-blue-100">
                  Meta (Editável)
                </th>
                <th className="p-2 border-r border-slate-700 text-center w-48 font-bold bg-slate-900">
                  Sub-indicador
                </th>
                {filteredDays.map((d) => {
                  const isWeekend = d.day === 'Sábado' || d.day === 'Domingo'
                  return (
                    <th
                      key={d.colId}
                      className={`p-2 border-r border-slate-700 text-center min-w-[84px] font-sans transition-colors ${
                        isWeekend ? 'bg-amber-950/70 border-b-2 border-b-amber-500' : 'bg-slate-900'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isWeekend ? 'text-amber-300' : 'text-slate-400'}`}>
                          {d.day}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-200 text-xs font-mono font-bold border border-blue-400/30 shadow-2xs">
                          {d.date}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCategories.map((cat, catIdx) => {
                const subRowsCount = cat.subRows.length
                const hasMetaGroup = Boolean(cat.metaGroupDefault && cat.metaGroupDefault.length > 0)
                const groupInfo = groupsList.find(g => g.id === cat.groupId) || groupsList[0] || DEFAULT_GROUPS[4]

                return cat.subRows.map((sub, subIdx) => {
                  const isFirstSub = subIdx === 0

                  return (
                    <tr
                      key={`${cat.id}_${sub.id}_${subIdx}`}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        subIdx === subRowsCount - 1 ? 'border-b-2 border-slate-300' : 'border-b border-slate-200'
                      }`}
                    >
                      {/* Category Label Cell (Span multi rows) */}
                      {isFirstSub && (
                        <td
                          rowSpan={subRowsCount}
                          className="p-3 border-r border-slate-200 font-bold text-slate-800 bg-slate-50 align-middle text-center sticky left-0 z-20 shadow-sm border-b-2 border-slate-300 group"
                        >
                          <div className="text-xs uppercase tracking-tight text-blue-900 font-extrabold">{cat.category}</div>
                          
                          {/* Badge do Agrupamento */}
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                              {groupInfo.name}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenEditCategoryModal(cat)}
                            title="Editar este Indicador e seus Sub-indicadores"
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:text-white bg-blue-100 hover:bg-blue-600 px-2 py-0.5 rounded-md shadow-xs"
                          >
                            <Edit3 size={11} /> Editar Indicador
                          </button>
                        </td>
                      )}

                      {/* Meta Cell: Caso Seja Meta Unificada/Grupo (rowSpan com múltiplos inputs editáveis) */}
                      {hasMetaGroup && isFirstSub && (
                        <td
                          rowSpan={subRowsCount}
                          className="p-2 border-r border-slate-200 bg-blue-50/80 text-blue-900 font-semibold align-middle text-center font-mono text-[11px] border-b-2 border-slate-300"
                        >
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {cat.metaGroupDefault?.map((_, i) => {
                              const metaKey = `metaGroup_${cat.id}_${i}`
                              const val = data[metaKey] !== undefined ? data[metaKey] : cat.metaGroupDefault![i]
                              return (
                                <input
                                  key={i}
                                  type="text"
                                  value={val}
                                  onChange={e => saveCell(metaKey, e.target.value)}
                                  placeholder="Meta"
                                  className="w-full text-center bg-white/90 hover:bg-white text-blue-950 font-bold font-mono text-xs rounded-md border border-blue-300 focus:ring-2 focus:ring-blue-600 focus:outline-none px-2 py-1 shadow-2xs transition-colors"
                                />
                              )
                            })}
                          </div>
                        </td>
                      )}

                      {/* Meta Cell: Caso Seja Meta Individual por Sub-indicador (1 input editável por linha) */}
                      {!hasMetaGroup && (
                        <td className="p-1 border-r border-slate-200 bg-blue-50/60 text-blue-900 font-semibold text-center font-mono text-[11px]">
                          {(() => {
                            const metaKey = `meta_${cat.id}_${sub.id}`
                            const val = data[metaKey] !== undefined ? data[metaKey] : sub.metaDefault || ''
                            return (
                              <input
                                type="text"
                                value={val}
                                onChange={e => saveCell(metaKey, e.target.value)}
                                placeholder="Meta"
                                className="w-full text-center bg-white/90 hover:bg-white text-blue-950 font-bold font-mono text-xs rounded-md border border-blue-300 focus:ring-2 focus:ring-blue-600 focus:outline-none px-2 py-1 shadow-2xs transition-colors"
                              />
                            )
                          })()}
                        </td>
                      )}

                      {/* Sub-row Label Cell */}
                      <td className={`p-2 border-r border-slate-200 pl-3 text-[11px] ${
                        sub.id === 'plano_acao' 
                          ? 'bg-amber-50/50 font-bold text-amber-900' 
                          : 'bg-white font-medium text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between gap-1.5 whitespace-nowrap">
                          <span>{sub.label}</span>
                          {sub.id === 'plano_acao' && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded font-extrabold uppercase shrink-0">
                              Ação
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Days Input Cells */}
                      {filteredDays.map((d, colIdx) => {
                        const key = `${cat.id}_${sub.id}_${d.colId}`
                        const rawVal = data[key] || ''
                        const isPlanoAcao = sub.id === 'plano_acao'

                        if (isPlanoAcao) {
                          let hasData = Boolean(rawVal && rawVal.trim() !== '')
                          let previewText = ''

                          if (rawVal.startsWith('{')) {
                            try {
                              const parsed = JSON.parse(rawVal)
                              previewText = parsed.planoAcao || parsed.ocorrencias || 'Ação Registrada'
                              hasData = Boolean(parsed.planoAcao || parsed.ocorrencias)
                            } catch {
                              previewText = rawVal
                            }
                          } else {
                            previewText = rawVal
                          }

                          return (
                            <td
                              key={d.colId}
                              className={`p-1 border-r border-slate-200 text-center ${
                                colIdx % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(cat.category, d.date, key)}
                                title={`Clique para descrever Ocorrência / Plano de Ação de ${cat.category} em ${d.date}`}
                                className={`w-full min-h-[30px] px-1.5 py-0.5 rounded-md text-[11px] flex items-center justify-center gap-1 transition-all border ${
                                  hasData
                                    ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-xs hover:bg-amber-600'
                                    : 'bg-slate-50/50 text-slate-400 border-dashed border-slate-200 font-normal hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                                }`}
                              >
                                <ClipboardList size={12} className={`shrink-0 ${hasData ? 'text-white' : 'text-slate-300'}`} />
                                <span className="truncate max-w-[70px]">
                                  {hasData ? previewText : 'Preencher'}
                                </span>
                              </button>
                            </td>
                          )
                        }

                        return (
                          <td
                            key={d.colId}
                            className={`p-0 border-r border-slate-200 text-center ${
                              colIdx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            <input
                              type="text"
                              value={rawVal}
                              onChange={e => saveCell(key, e.target.value)}
                              onBlur={e => handleCellBlur(key, e.target.value, sub.dataType)}
                              placeholder="-"
                              className="w-full h-8 text-center bg-transparent text-slate-800 font-mono text-xs font-semibold focus:bg-blue-100/80 focus:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-inset border-none transition-colors px-1"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Elegante e Completo para Criar ou Editar Indicador, Agrupamento e seus Sub-indicadores */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-600" />
                  {editingCategoryId ? 'Editar Indicador Operacional' : 'Criar Novo Indicador Operacional'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie o nome do indicador, agrupamento, sub-indicadores, metas e formatos de dados.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nome do Indicador Principal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PCP - Planejamento e Controle da Produção"
                    value={indicatorName}
                    onChange={e => setIndicatorName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Agrupamento / Categoria *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      {isCreatingNewGroup ? '← Selecionar da lista' : '+ Novo Agrupamento'}
                    </button>
                  </div>

                  {!isCreatingNewGroup ? (
                    <select
                      value={selectedGroupId}
                      onChange={e => {
                        if (e.target.value === '__new__') {
                          setIsCreatingNewGroup(true)
                        } else {
                          setSelectedGroupId(e.target.value as GroupType)
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-semibold text-slate-800"
                    >
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                      <option value="__new__">+ Criar Novo Agrupamento...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Nome do Agrupamento"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-blue-400 focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewGroupInline}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                      >
                        Salvar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista Completa e Elegante de Sub-indicadores */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Sub-indicadores, Metas & Tipos de Dados *
                    </label>
                    <p className="text-[11px] text-slate-500">Adicione ou edite os sub-itens pertencentes a este indicador.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubItemDraft}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-xs"
                  >
                    <Plus size={13} /> + Adicionar Sub-indicador
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {subItemsDraft.map((sub, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 sm:hidden">Nome do Sub-indicador</label>
                        <input
                          type="text"
                          required
                          placeholder={`Sub-indicador #${index + 1}`}
                          value={sub.name}
                          onChange={e => handleSubItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 focus:ring-1 focus:ring-blue-600 bg-white font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 sm:hidden">Meta</label>
                        <input
                          type="text"
                          placeholder="Meta (ex: 95%)"
                          value={sub.meta}
                          onChange={e => handleSubItemChange(index, 'meta', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 focus:ring-1 focus:ring-blue-600 bg-white text-center font-mono font-semibold text-blue-900"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 sm:hidden">Tipo de Dado</label>
                        <select
                          value={sub.dataType}
                          onChange={e => handleSubItemChange(index, 'dataType', e.target.value as DataType)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs border border-slate-300 focus:ring-1 focus:ring-blue-600 bg-white font-medium"
                        >
                          <option value="percentage">% Porcentagem</option>
                          <option value="number">123 Inteiro</option>
                          <option value="decimal">1,00 Decimal</option>
                          <option value="currency">R$ Moeda</option>
                          <option value="text">Texto Livre</option>
                        </select>
                      </div>

                      {subItemsDraft.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubItemDraft(index)}
                          title="Remover este sub-indicador"
                          className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors self-end sm:self-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {editingCategoryId ? 'Salvar Alterações do Indicador' : 'Criar Indicador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Interativo e Robusto de Ocorrências & Plano de Ação (Estilo Folha A4 Ampliada) */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 md:p-6 transition-all duration-300">
          <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-2xl w-full flex flex-col transition-all duration-300 ${
              isActionModalExpanded
                ? 'h-[98vh] max-w-[98vw]'
                : 'max-w-5xl h-[92vh]'
            }`}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Plano de Ação & Ocorrências
                    </h3>
                    <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      {actionModalTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                      <Calendar size={13} className="text-amber-600" /> Data de Registro: {actionModalDate}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsActionModalExpanded(!isActionModalExpanded)}
                  title={isActionModalExpanded ? 'Restaurar Tamanho Normal' : 'Expandir Formulário (Tela Cheia)'}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                >
                  {isActionModalExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form Corpo */}
            <form onSubmit={handleSaveActionModal} className="flex flex-col flex-1 overflow-hidden p-6 space-y-4">
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                
                {/* Meta Bar: Status e Prioridade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Flag size={12} className="text-amber-600" /> Nível de Prioridade
                    </label>
                    <select
                      value={prioridadeInput}
                      onChange={e => setPrioridadeInput(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="baixa">🟢 Baixa</option>
                      <option value="media">🟡 Média</option>
                      <option value="alta">🟠 Alta</option>
                      <option value="critica">🔴 Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock size={12} className="text-blue-600" /> Status do Plano
                    </label>
                    <select
                      value={statusAcaoInput}
                      onChange={e => setStatusAcaoInput(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="pendente">⏳ Pendente</option>
                      <option value="em_andamento">🚀 Em Andamento</option>
                      <option value="concluido">✅ Concluído</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <User size={12} className="text-emerald-600" /> Responsável
                    </label>
                    <input
                      type="text"
                      value={responsavelInput}
                      onChange={e => setResponsavelInput(e.target.value)}
                      placeholder="Ex: João Silva (Gerente OP)"
                      className="w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar size={12} className="text-purple-600" /> Prazo de Resolução
                    </label>
                    <input
                      type="text"
                      value={prazoInput}
                      onChange={e => setPrazoInput(e.target.value)}
                      placeholder="Ex: Até 05/Out ou Imediato"
                      className="w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bloco 1: Descrição de Ocorrências / Causa Raiz */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-500" />
                      <span>1. Descrição das Ocorrências, Análises e Causa Raiz</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Use a barra abaixo para formatar o texto</span>
                  </div>

                  {/* Toolbar de Formatação Ocorrências */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-t-xl border border-slate-300 border-b-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertFormatting(ocorrenciasRef, setOcorrenciasInput, '**', '**')}
                      title="Negrito (**texto**)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(ocorrenciasRef, setOcorrenciasInput, '_', '_')}
                      title="Itálico (_texto_)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <Italic size={13} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertFormatting(ocorrenciasRef, setOcorrenciasInput, '\n- ')}
                      title="Item de Lista (- Item)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(ocorrenciasRef, setOcorrenciasInput, '\n1. ')}
                      title="Lista Numerada (1. Item)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <ListOrdered size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(ocorrenciasRef, setOcorrenciasInput, '\n[ ] ')}
                      title="Caixa de Seleção ([ ] Tarefa)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <CheckSquare size={13} />
                    </button>

                    {/* Botões A- e A+ para Ajuste do Tamanho do Texto */}
                    <div className="flex items-center gap-1 ml-auto bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 pl-1">Tamanho:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSize = Math.max(ocorrenciasFontSize - 2, 12)
                          setOcorrenciasFontSize(newSize)
                          setTimeout(() => adjustTextareaHeight(ocorrenciasRef.current), 50)
                        }}
                        disabled={ocorrenciasFontSize <= 12}
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        title="Diminuir tamanho do texto (A-)"
                      >
                        A-
                      </button>
                      <span className="text-[11px] font-extrabold text-amber-700 px-1 font-mono min-w-[32px] text-center">
                        {ocorrenciasFontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSize = Math.min(ocorrenciasFontSize + 2, 26)
                          setOcorrenciasFontSize(newSize)
                          setTimeout(() => adjustTextareaHeight(ocorrenciasRef.current), 50)
                        }}
                        disabled={ocorrenciasFontSize >= 26}
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        title="Aumentar tamanho do texto (A+)"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={ocorrenciasRef}
                    rows={6}
                    value={ocorrenciasInput}
                    onChange={e => {
                      setOcorrenciasInput(e.target.value)
                      adjustTextareaHeight(e.target)
                    }}
                    style={{ fontSize: `${ocorrenciasFontSize}px`, lineHeight: '1.5' }}
                    placeholder="Descreva detalhadamente o que causou o desvio do indicador (ex: Atraso na entrega dos fornecedores, quebra de equipamento, falta de efetivo no turno...)"
                    className="w-full px-4 py-3 rounded-b-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50 font-sans text-slate-800 placeholder:text-slate-400 shadow-inner resize-y overflow-hidden min-h-[160px] transition-all"
                  />
                </div>

                {/* Bloco 2: Plano de Ação Proposto */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <FileText size={15} className="text-amber-600" />
                      <span>2. Plano de Ação Proposto e Contra-Medidas</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Use a barra abaixo para formatar o texto</span>
                  </div>

                  {/* Toolbar de Formatação Plano de Ação */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-t-xl border border-slate-300 border-b-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertFormatting(planoAcaoRef, setPlanoAcaoInput, '**', '**')}
                      title="Negrito (**texto**)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(planoAcaoRef, setPlanoAcaoInput, '_', '_')}
                      title="Itálico (_texto_)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <Italic size={13} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertFormatting(planoAcaoRef, setPlanoAcaoInput, '\n- ')}
                      title="Item de Lista (- Item)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(planoAcaoRef, setPlanoAcaoInput, '\n1. ')}
                      title="Lista Numerada (1. Item)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <ListOrdered size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(planoAcaoRef, setPlanoAcaoInput, '\n[ ] ')}
                      title="Caixa de Seleção ([ ] Tarefa)"
                      className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-black transition-colors"
                    >
                      <CheckSquare size={13} />
                    </button>

                    {/* Botões A- e A+ para Ajuste do Tamanho do Texto */}
                    <div className="flex items-center gap-1 ml-auto bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 pl-1">Tamanho:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSize = Math.max(planoAcaoFontSize - 2, 12)
                          setPlanoAcaoFontSize(newSize)
                          setTimeout(() => adjustTextareaHeight(planoAcaoRef.current), 50)
                        }}
                        disabled={planoAcaoFontSize <= 12}
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        title="Diminuir tamanho do texto (A-)"
                      >
                        A-
                      </button>
                      <span className="text-[11px] font-extrabold text-amber-700 px-1 font-mono min-w-[32px] text-center">
                        {planoAcaoFontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSize = Math.min(planoAcaoFontSize + 2, 26)
                          setPlanoAcaoFontSize(newSize)
                          setTimeout(() => adjustTextareaHeight(planoAcaoRef.current), 50)
                        }}
                        disabled={planoAcaoFontSize >= 26}
                        className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                        title="Aumentar tamanho do texto (A+)"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={planoAcaoRef}
                    rows={8}
                    value={planoAcaoInput}
                    onChange={e => {
                      setPlanoAcaoInput(e.target.value)
                      adjustTextareaHeight(e.target)
                    }}
                    style={{ fontSize: `${planoAcaoFontSize}px`, lineHeight: '1.5' }}
                    placeholder="Especifique as etapas do plano de ação (ex: 1. Remanejar 5 conferentes do setor X; 2. Notificar transportadora Y; 3. Reavaliar meta...)"
                    className="w-full px-4 py-3 rounded-b-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50 font-sans text-slate-800 placeholder:text-slate-400 shadow-inner resize-y overflow-hidden min-h-[200px] transition-all"
                  />
                </div>

              </div>

              {/* Footer e Botões */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
                <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  💡 Os dados são salvos em tempo real e sincronizados na nuvem Supabase.
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {actionModalCellKey && Boolean(data[actionModalCellKey]) && (
                    <button
                      type="button"
                      onClick={handleClearActionModal}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
                      title="Limpar todos os campos e voltar o status para pendente/cinza"
                    >
                      <Trash2 size={13} />
                      Limpar Ação
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Save size={15} />
                    Salvar Plano de Ação
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
