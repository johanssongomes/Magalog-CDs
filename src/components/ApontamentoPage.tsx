import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sun,
  Home,
  Briefcase,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  Users,
  Building2,
  CalendarDays,
  Palmtree,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/authContext'
import { getHierarchyUserIds } from '../lib/hierarchyService'
import initialColaboradoresData from '../data/initialColaboradores.json'

// Parser simples e seguro de CSV considerando aspas
function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentField.trim())
      if (currentRow.some(field => field.length > 0)) {
        lines.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(field => field.length > 0)) {
      lines.push(currentRow)
    }
  }

  return lines
}

// Tipos de Apontamento disponíveis
export type ApontamentoStatus =
  | 'T'    // Trabalhou
  | 'FLG'  // Folga
  | 'F'    // Compatibilidade Folga antiga
  | 'FLT'  // Falta
  | 'ATM'  // Falta ATM
  | 'FER'  // Férias
  | 'REM'  // Remoto
  | 'HO'   // Compatibilidade Home Office antigo
  | 'BH'   // Banco de Horas
  | 'DSR'  // DSR Feriado

export interface StatusConfig {
  code: ApontamentoStatus
  label: string
  shortLabel: string
  bg: string
  text: string
  border: string
  badgeBg: string
  badgeText: string
}

export const APONTAMENTO_STATUS_CONFIG: Record<string, StatusConfig> = {
  T: {
    code: 'T',
    label: 'T',
    shortLabel: 'T',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-700 font-extrabold',
    border: 'border-emerald-300',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white'
  },
  FLG: {
    code: 'FLG',
    label: 'FLG',
    shortLabel: 'FLG',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700 font-extrabold',
    border: 'border-blue-300',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white'
  },
  F: {
    code: 'FLG',
    label: 'FLG',
    shortLabel: 'FLG',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700 font-extrabold',
    border: 'border-blue-300',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white'
  },
  FLT: {
    code: 'FLT',
    label: 'FLT',
    shortLabel: 'FLT',
    bg: 'bg-red-50 hover:bg-red-100',
    text: 'text-red-700 font-extrabold',
    border: 'border-red-300',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white'
  },
  ATM: {
    code: 'ATM',
    label: 'ATM',
    shortLabel: 'ATM',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-700 font-extrabold',
    border: 'border-rose-300',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white'
  },
  FER: {
    code: 'FER',
    label: 'FER',
    shortLabel: 'FER',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700 font-extrabold',
    border: 'border-amber-300',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white'
  },
  REM: {
    code: 'REM',
    label: 'REM',
    shortLabel: 'REM',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-700 font-extrabold',
    border: 'border-purple-300',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white'
  },
  HO: {
    code: 'REM',
    label: 'REM',
    shortLabel: 'REM',
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-700 font-extrabold',
    border: 'border-purple-300',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white'
  },
  BH: {
    code: 'BH',
    label: 'BH',
    shortLabel: 'BH',
    bg: 'bg-sky-50 hover:bg-sky-100',
    text: 'text-sky-700 font-extrabold',
    border: 'border-sky-300',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white'
  },
  DSR: {
    code: 'DSR',
    label: 'DSR',
    shortLabel: 'DSR',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    text: 'text-indigo-700 font-extrabold',
    border: 'border-indigo-300',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white'
  }
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const WEEKDAY_NAMES_LOWER = [
  'domingo', 'segunda feira', 'terça feira', 'quarta feira', 'quinta feira', 'sexta feira', 'sábado'
]

const DEFAULT_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1rOqQq0CvzT2LNIvHB6zWmgtmbK7rDU3idyI7rbf_j5g/gviz/tq?tqx=out:csv&gid=0'

export function ApontamentoPage() {
  const { user } = useAuth()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()) // 0 = Jan, 9 = Out
  
  // Colaboradores e Saldos de BH da Planilha
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [bhBalances, setBhBalances] = useState<Record<string, { saldoStr: string; saldoDec: number }>>({})
  const [loadingBh, setLoadingBh] = useState(false)

  // Apontamentos Diários: Record<colabId, Record<dia, ApontamentoStatus>>
  const [apontamentos, setApontamentos] = useState<Record<string, Record<number, ApontamentoStatus>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')

  // Filtros de Múltipla Escolha
  const [search, setSearch] = useState('')
  const [selectedSetores, setSelectedSetores] = useState<string[]>([])
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([])
  const [selectedCargos, setSelectedCargos] = useState<string[]>([])
  const [selectedSupervisores, setSelectedSupervisores] = useState<string[]>([])
  const [selectedLideres, setSelectedLideres] = useState<string[]>([])
  const [openFilterDropdown, setOpenFilterDropdown] = useState<'setor' | 'turno' | 'cargo' | 'supervisor' | 'lider' | null>(null)

  // Filtro Interativo de Calendário (Dias e Período)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')

  // Modal para Marcar Intervalo (ex: Férias de dia X até dia Y)
  const [intervalModal, setIntervalModal] = useState<{
    isOpen: boolean
    colabId?: string
    colabNome?: string
    startDay: number
    endDay: number
    status: ApontamentoStatus
  }>({
    isOpen: false,
    startDay: 1,
    endDay: 15,
    status: 'FER'
  })

  // Dias no mês selecionado
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }, [selectedYear, selectedMonth])

  // Lista de todos os dias do mês com metadados
  const monthDaysList = useMemo(() => {
    const list: { day: number; dateStr: string; weekdayName: string; isSunday: boolean; isSaturday: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(selectedYear, selectedMonth, d)
      const wDay = dt.getDay()
      const dStr = `${String(d).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`
      list.push({
        day: d,
        dateStr: dStr,
        weekdayName: WEEKDAY_NAMES_LOWER[wDay],
        isSunday: wDay === 0,
        isSaturday: wDay === 6
      })
    }
    return list
  }, [selectedYear, selectedMonth, daysInMonth])

  // Dias ativos filtrados pelo Calendário Interativo
  const activeFilteredDays = useMemo(() => {
    if (selectedDays.length === 0 && !startDateFilter && !endDateFilter) {
      return monthDaysList
    }

    return monthDaysList.filter(d => {
      // 1. Filtro por clique em dias individuais ou presets
      const matchDayClick = selectedDays.length > 0 && selectedDays.includes(d.day)

      // 2. Filtro por Range de Datas (Início / Fim)
      let matchRange = false
      if (startDateFilter || endDateFilter) {
        const dayIso = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
        if (startDateFilter && endDateFilter) {
          matchRange = dayIso >= startDateFilter && dayIso <= endDateFilter
        } else if (startDateFilter) {
          matchRange = dayIso >= startDateFilter
        } else if (endDateFilter) {
          matchRange = dayIso <= endDateFilter
        }
      }

      if (selectedDays.length > 0 && (startDateFilter || endDateFilter)) {
        return matchDayClick || matchRange
      }
      if (selectedDays.length > 0) return matchDayClick
      if (startDateFilter || endDateFilter) return matchRange
      return true
    })
  }, [monthDaysList, selectedDays, startDateFilter, endDateFilter, selectedYear, selectedMonth])

  // Presets do Calendário
  const applyDatePreset = (preset: 'all' | 'workdays' | 'q1' | 'q2') => {
    setStartDateFilter('')
    setEndDateFilter('')
    if (preset === 'all') {
      setSelectedDays([])
    } else if (preset === 'workdays') {
      setSelectedDays(monthDaysList.filter(d => !d.isSunday && !d.isSaturday).map(d => d.day))
    } else if (preset === 'q1') {
      setSelectedDays(monthDaysList.filter(d => d.day <= 15).map(d => d.day))
    } else if (preset === 'q2') {
      setSelectedDays(monthDaysList.filter(d => d.day > 15).map(d => d.day))
    }
  }

  const toggleDayFilter = (day: number) => {
    setStartDateFilter('')
    setEndDateFilter('')
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  // 1. Carregar Colaboradores (sincronizado com Quadro e Cadastro)
  useEffect(() => {
    const loadColaboradores = async () => {
      let baseList: any[] = []

      // 1. Tenta carregar da lista mais atualizada do Quadro de Colaboradores ou Usuários
      try {
        const quadroCached = localStorage.getItem('magalog_quadro_colaboradores')
        if (quadroCached) {
          const parsed = JSON.parse(quadroCached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseList = parsed
          }
        }
      } catch {}

      if (baseList.length === 0) {
        try {
          const usersCached = localStorage.getItem('magalog_users_list')
          if (usersCached) {
            const parsed = JSON.parse(usersCached)
            if (Array.isArray(parsed) && parsed.length > 0) {
              baseList = parsed.map(u => ({
                id: u.colaborador_id || u.id || '',
                contratado: u.colaborador?.contratado || u.name || '',
                cargo: u.cargo || u.colaborador?.cargo || '',
                setor: u.setor || u.colaborador?.setor || '',
                turno: u.turno || u.colaborador?.turno || '',
                cd: u.cd || '6994',
                idLider: u.dados_colaborador?.idLider || u.colaborador?.idLider || u.idLider || '',
                nomeLider: u.dados_colaborador?.nomeLider || u.colaborador?.nomeLider || u.nomeLider || ''
              }))
            }
          }
        } catch {}
      }

      if (baseList.length === 0) {
        baseList = initialColaboradoresData
      }

      // 2. Mescla com nomes e dados atualizados do Supabase (tabela colaboradores)
      try {
        const { data: supaColabs } = await supabase.from('colaboradores').select('*')
        if (supaColabs && supaColabs.length > 0) {
          const supaMap = new Map<string, any>()
          supaColabs.forEach(sc => {
            if (sc.id) supaMap.set(String(sc.id).trim(), sc)
          })

          baseList = baseList.map(item => {
            const sc = supaMap.get(String(item.id || '').trim())
            if (sc) {
              return {
                ...item,
                contratado: sc.contratado || item.contratado,
                cargo: sc.cargo || item.cargo,
                setor: sc.setor || item.setor,
                turno: sc.turno || item.turno,
                idLider: sc.id_lider !== undefined ? sc.id_lider : item.idLider,
                nomeLider: sc.nome_lider !== undefined ? sc.nome_lider : item.nomeLider
              }
            }
            return item
          })
        }
      } catch (e) {
        console.warn('Aviso ao sincronizar colaboradores com Supabase:', e)
      }

      setColaboradores(baseList)
    }

    loadColaboradores()
  }, [])

  // 2. Carregar Saldos de Banco de Horas (Saldo Líquido Débito ou Crédito) da planilha Google Sheets
  useEffect(() => {
    const loadBh = async () => {
      setLoadingBh(true)
      try {
        const cachedBh = localStorage.getItem('magalog_bank_hours_cache')
        let records: any[] = cachedBh ? JSON.parse(cachedBh) : []

        if (!records || records.length === 0) {
          const res = await fetch(`${DEFAULT_SHEET_CSV_URL}&_ts=${Date.now()}`)
          if (res.ok) {
            const text = await res.text()
            const parsed = parseCSV(text)
            if (parsed.length > 1) {
              const headers = parsed[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
              const idxData = headers.findIndex(h => h.includes('data'))
              const idxId = headers.findIndex(h => h === 'id' || h.includes('matricula'))
              const idxNome = headers.findIndex(h => h.includes('contratado') || h.includes('nome'))
              const idxTipo = headers.findIndex(h => h.includes('tipo') || h.includes('credito') || h.includes('debito'))
              const idxHoras = headers.findIndex(h => h.includes('hora') || h.includes('qtd'))

              records = parsed.slice(1).map(r => ({
                data: r[idxData] || '',
                id: r[idxId] || '',
                contratado: r[idxNome] || '',
                tipo: r[idxTipo] || '',
                qtdHoras: r[idxHoras] || '00:00'
              }))
            }
          }
        }

        // Identifica a data mais recente registrada para cada colaborador na planilha
        // (A planilha contém snapshots diários cumulativos; somar todos os dias acumula o saldo repetidas vezes)
        const parseDateBR = (dateStr: string): number => {
          if (!dateStr) return 0
          const parts = dateStr.split('/').map(Number)
          if (parts.length < 3) return 0
          const [dia, mes, ano] = parts
          return new Date(ano || 2026, (mes || 1) - 1, dia || 1).getTime()
        }

        const latestDateByEmp = new Map<string, string>()
        const sortedRecords = [...records].sort((a, b) => parseDateBR(a.data) - parseDateBR(b.data))
        sortedRecords.forEach(item => {
          const key = `${item.id}-${item.contratado}`
          latestDateByEmp.set(key, item.data)
        })

        // Filtra mantendo apenas a posição atual / data mais recente do colaborador
        const snapshotRecords = records.filter(item => {
          const key = `${item.id}-${item.contratado}`
          return latestDateByEmp.get(key) === item.data
        })

        // Calcula o Saldo Líquido da Posição Atual (Crédito - Débito)
        const employeeNetMap = new Map<string, { totalCredito: number; totalDebito: number }>()

        snapshotRecords.forEach(r => {
          if (!r.id && !r.contratado) return
          const key = String(r.id || r.contratado).trim().toUpperCase()
          const current = employeeNetMap.get(key) || { totalCredito: 0, totalDebito: 0 }

          // Converte tempo para horas decimais
          const timeParts = (r.qtdHoras || '00:00').trim().replace(/["\s]/g, '').split(':').map(Number)
          const decHours = (timeParts[0] || 0) + ((timeParts[1] || 0) / 60) + ((timeParts[2] || 0) / 3600)

          const normTipo = (r.tipo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          if (normTipo.includes('credito')) {
            current.totalCredito += decHours
          } else if (normTipo.includes('debito')) {
            current.totalDebito += decHours
          }

          employeeNetMap.set(key, current)
          if (r.id) employeeNetMap.set(String(r.id).trim(), current)
          if (r.contratado) employeeNetMap.set(String(r.contratado).trim().toUpperCase(), current)
        })

        const map: Record<string, { saldoStr: string; saldoDec: number }> = {}

        employeeNetMap.forEach((val, key) => {
          const netDecimal = val.totalCredito - val.totalDebito
          const isNegative = netDecimal < 0
          const abs = Math.abs(netDecimal)
          const h = Math.floor(abs)
          const m = Math.round((abs - h) * 60)
          const sign = isNegative ? '-' : '+'
          const formatted = `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`

          map[key] = {
            saldoStr: formatted,
            saldoDec: netDecimal
          }
        })

        setBhBalances(map)
      } catch (err) {
        console.warn('Erro ao carregar saldo líquido de BH para Apontamento:', err)
      } finally {
        setLoadingBh(false)
      }
    }
    loadBh()
  }, [])

  // 3. Carregar Apontamentos do Mês/Ano atual (Supabase + localStorage fallback)
  useEffect(() => {
    const storageKey = `magalog_apontamentos_${selectedYear}_${selectedMonth + 1}`
    
    // Tenta carregar do localStorage primeiro para exibição imediata
    try {
      const local = localStorage.getItem(storageKey)
      if (local) {
        setApontamentos(JSON.parse(local))
      } else {
        setApontamentos({})
      }
    } catch {
      setApontamentos({})
    }

    // Busca do Supabase
    const fetchFromSupabase = async () => {
      try {
        const { data } = await supabase
          .from('performance_metrics')
          .select('value')
          .eq('cell_key', `_apontamentos_${selectedYear}_${selectedMonth + 1}`)
          .maybeSingle()

        if (data?.value) {
          const parsed = JSON.parse(data.value)
          setApontamentos(parsed)
          localStorage.setItem(storageKey, data.value)
        }
      } catch (e) {
        console.warn('Aviso ao carregar apontamentos do banco:', e)
      }
    }

    fetchFromSupabase()
  }, [selectedYear, selectedMonth])

  // Salvar apontamentos no Supabase e LocalStorage
  const persistApontamentos = async (newApontamentos: Record<string, Record<number, ApontamentoStatus>>) => {
    setApontamentos(newApontamentos)
    const storageKey = `magalog_apontamentos_${selectedYear}_${selectedMonth + 1}`
    const jsonStr = JSON.stringify(newApontamentos)
    
    try {
      localStorage.setItem(storageKey, jsonStr)
    } catch (e) {
      console.warn('Erro ao salvar local:', e)
    }

    setIsSaving(true)
    try {
      await supabase
        .from('performance_metrics')
        .upsert({
          cell_key: `_apontamentos_${selectedYear}_${selectedMonth + 1}`,
          value: jsonStr,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cell_key' })
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      console.warn('Erro ao salvar apontamentos no Supabase:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Atualizar célula individual
  const handleCellChange = (colabId: string, day: number, status: ApontamentoStatus | '') => {
    const updated = { ...apontamentos }
    if (!updated[colabId]) {
      updated[colabId] = {}
    }
    if (!status) {
      delete updated[colabId][day]
    } else {
      updated[colabId][day] = status
    }
    persistApontamentos(updated)
  }

  // Preencher intervalo (Férias, Home Office, etc.)
  const handleApplyInterval = () => {
    if (!intervalModal.colabId) return
    const updated = { ...apontamentos }
    if (!updated[intervalModal.colabId]) {
      updated[intervalModal.colabId] = {}
    }

    const start = Math.min(intervalModal.startDay, intervalModal.endDay)
    const end = Math.max(intervalModal.startDay, intervalModal.endDay)

    for (let d = start; d <= end && d <= daysInMonth; d++) {
      updated[intervalModal.colabId][d] = intervalModal.status
    }

    persistApontamentos(updated)
    setIntervalModal({ ...intervalModal, isOpen: false })
  }

  // Cálculo de DSR para um colaborador:
  // Domingos trabalhados (+1) - DSR concedido (-1)
  const calculateDsr = (colabId: string): number => {
    const colabRecords = apontamentos[colabId] || {}
    let dsrBalance = 0

    monthDaysList.forEach(({ day, isSunday }) => {
      const status = colabRecords[day]
      if (isSunday && status === 'T') {
        dsrBalance += 1 // Domingo trabalhado dá direito a +1 DSR
      }
      if (status === 'DSR') {
        dsrBalance -= 1 // DSR usufruído / concedido subtrai 1
      }
    })

    return dsrBalance
  }

  // Opções para os filtros de múltipla escolha
  const setoresUnicos = useMemo(() => {
    const s = new Set<string>()
    colaboradores.forEach(c => {
      const val = c.setor || c.gerencia || 'Não informado'
      if (val) s.add(val.trim())
    })
    return Array.from(s).sort()
  }, [colaboradores])

  const turnosUnicos = useMemo(() => {
    const s = new Set<string>()
    colaboradores.forEach(c => {
      const val = c.turno || '1º Turno'
      if (val) s.add(val.trim())
    })
    return Array.from(s).sort()
  }, [colaboradores])

  const cargosUnicos = useMemo(() => {
    const s = new Set<string>()
    colaboradores.forEach(c => {
      if (c.cargo) s.add(c.cargo.trim())
    })
    return Array.from(s).sort()
  }, [colaboradores])

  // Mapeamento de Colaborador -> Primeiro Nome do Líder e Primeiro Nome do Supervisor
  // 1. Cada colaborador tem idLider e nomeLider. Se o líder dele tiver cargo de Supervisor, o supervisor é o próprio líder.
  // Se o líder dele for Líder de Logística/Movimentação, buscamos quem é o líder do líder (que é o Supervisor).
  const colabMapById = useMemo(() => {
    const map = new Map<string, any>()
    colaboradores.forEach(c => {
      const id = String(c.id || '').trim().toLowerCase()
      if (id) map.set(id, c)
    })
    return map
  }, [colaboradores])

  const getFirstName = (fullName: string | undefined | null) => {
    if (!fullName) return '-'
    const clean = fullName.trim()
    if (!clean) return '-'
    const parts = clean.split(/\s+/)
    const first = parts[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }

  const getLeadershipNames = (colab: any) => {
    const directLeaderName = (colab.nomeLider || '').trim()
    const directLeaderId = String(colab.idLider || '').trim().toLowerCase()

    // Se o colaborador não possui ID nem Nome de líder cadastrado
    if (!directLeaderName && !directLeaderId) {
      return {
        supervisorFirstName: '-',
        liderFirstName: '-'
      }
    }

    const directLeaderObj = directLeaderId ? colabMapById.get(directLeaderId) : null

    let liderNome = directLeaderName
    let supervisorNome = ''

    if (directLeaderObj) {
      const leaderCargo = (directLeaderObj.cargo || '').toUpperCase()
      if (leaderCargo.includes('SUPERVISOR')) {
        // Se o líder direto já é Supervisor
        supervisorNome = directLeaderObj.contratado || directLeaderName
        liderNome = colab.contratado === directLeaderObj.contratado ? '-' : directLeaderObj.contratado
      } else {
        // O líder direto é um Líder. Buscamos o líder desse líder (Supervisor)
        liderNome = directLeaderObj.contratado || directLeaderName
        const supId = String(directLeaderObj.idLider || '').trim().toLowerCase()
        const supObj = supId ? colabMapById.get(supId) : null
        if (supObj) {
          supervisorNome = supObj.contratado || directLeaderObj.nomeLider || ''
        } else {
          supervisorNome = directLeaderObj.nomeLider || ''
        }
      }
    } else {
      liderNome = directLeaderName
    }

    return {
      supervisorFirstName: getFirstName(supervisorNome),
      liderFirstName: getFirstName(liderNome)
    }
  }

  // Listas únicas de Supervisores e Líderes para os filtros
  const supervisoresUnicos = useMemo(() => {
    const s = new Set<string>()
    colaboradores.forEach(c => {
      const lead = getLeadershipNames(c)
      if (lead.supervisorFirstName && lead.supervisorFirstName !== '-') {
        s.add(lead.supervisorFirstName)
      }
    })
    return Array.from(s).sort()
  }, [colaboradores, colabMapById])

  const lideresUnicos = useMemo(() => {
    const s = new Set<string>()
    colaboradores.forEach(c => {
      const lead = getLeadershipNames(c)
      if (lead.liderFirstName && lead.liderFirstName !== '-') {
        s.add(lead.liderFirstName)
      }
    })
    return Array.from(s).sort()
  }, [colaboradores, colabMapById])

  // Filtragem dos colaboradores respeitando hierarquia de liderança e ordenando por Setor, Turno e Cargo
  const filteredColaboradores = useMemo(() => {
    const isMasterOrAdmin =
      user?.id === 'admin-master' ||
      user?.email === 'johansson.gomes@magazineluiza.com.br' ||
      user?.role === 'admin'

    const currentUserId = user?.colaborador_id || user?.id
    const allowedHierarchyIds = getHierarchyUserIds(currentUserId, colaboradores, isMasterOrAdmin)

    const result = colaboradores.filter(c => {
      // 1. Filtro hierárquico (Líder / Supervisor / Coordenador)
      if (allowedHierarchyIds) {
        const cId = String(c.id || '').trim().toLowerCase()
        if (!allowedHierarchyIds.has(cId)) {
          return false
        }
      }

      // 2. Filtros de interface (Busca, Setor, Turno, Cargo, Liderança)
      const q = search.toLowerCase().trim()
      const matchSearch =
        !search ||
        (c.contratado && c.contratado.toLowerCase().includes(q)) ||
        (c.id && String(c.id).toLowerCase().includes(q)) ||
        (c.cargo && c.cargo.toLowerCase().includes(q))

      const cSetor = (c.setor || c.gerencia || 'Não informado').trim()
      const matchSetor = selectedSetores.length === 0 || selectedSetores.includes(cSetor)

      const cTurno = (c.turno || '1º Turno').trim()
      const matchTurno = selectedTurnos.length === 0 || selectedTurnos.includes(cTurno)

      const cCargo = (c.cargo || '').trim()
      const matchCargo = selectedCargos.length === 0 || selectedCargos.includes(cCargo)

      const leadInfo = getLeadershipNames(c)
      const matchSupervisor = selectedSupervisores.length === 0 || selectedSupervisores.includes(leadInfo.supervisorFirstName)
      const matchLider = selectedLideres.length === 0 || selectedLideres.includes(leadInfo.liderFirstName)

      return matchSearch && matchSetor && matchTurno && matchCargo && matchSupervisor && matchLider
    })

    // Classificação ordenada por Setor -> Turno -> Cargo -> Nome
    return result.sort((a, b) => {
      const setorA = (a.setor || a.gerencia || '').trim().toLowerCase()
      const setorB = (b.setor || b.gerencia || '').trim().toLowerCase()
      if (setorA !== setorB) return setorA.localeCompare(setorB, 'pt-BR')

      const turnoA = (a.turno || '').trim().toLowerCase()
      const turnoB = (b.turno || '').trim().toLowerCase()
      if (turnoA !== turnoB) return turnoA.localeCompare(turnoB, 'pt-BR')

      const cargoA = (a.cargo || '').trim().toLowerCase()
      const cargoB = (b.cargo || '').trim().toLowerCase()
      if (cargoA !== cargoB) return cargoA.localeCompare(cargoB, 'pt-BR')

      const nomeA = (a.contratado || '').trim().toLowerCase()
      const nomeB = (b.contratado || '').trim().toLowerCase()
      return nomeA.localeCompare(nomeB, 'pt-BR')
    })
  }, [colaboradores, search, selectedSetores, selectedTurnos, selectedCargos, selectedSupervisores, selectedLideres, user, colabMapById])

  // Navegação de Mês
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  // Toggle do Multi-Select
  const toggleMultiSelect = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item))
    } else {
      setList([...list, item])
    }
  }

  // Exportar para CSV / Planilha
  const handleExportCSV = () => {
    const headers = ['Supervisor', 'Líder', 'Setor', 'Turno', 'ID', 'Nome', 'Cargo', 'Débito ou Crédito', 'Saldo DSR']
    monthDaysList.forEach(m => headers.push(`${m.weekdayName} (${m.dateStr})`))

    const rows: string[][] = [headers]

    filteredColaboradores.forEach(c => {
      const colabId = String(c.id || '')
      const bh = bhBalances[colabId] || bhBalances[String(c.contratado || '').toUpperCase()]
      const saldoBh = bh?.saldoStr || '00:00h'
      const saldoDsr = calculateDsr(colabId)
      const colabApont = apontamentos[colabId] || {}
      const leadInfo = getLeadershipNames(c)

      const row = [
        leadInfo.supervisorFirstName,
        leadInfo.liderFirstName,
        c.setor || c.gerencia || 'Geral CD 6994',
        c.turno || '1º Turno',
        colabId,
        c.contratado || '',
        c.cargo || '',
        saldoBh,
        String(saldoDsr)
      ]

      monthDaysList.forEach(m => {
        row.push(colabApont[m.day] || '')
      })

      rows.push(row)
    })

    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Apontamento_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      
      {/* 1. BARRA SUPERIOR COMPACTA COM TÍTULO E AÇÃO DE EXPORTAR */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Identificação da Página */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <CalendarDays size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Controle e Apontamento Diário
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                Mês {String(selectedMonth + 1).padStart(2, '0')}/{selectedYear}
              </span>
              {isSaving ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 animate-pulse">
                  Salvando...
                </span>
              ) : lastSaved ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600" title={`Salvo às ${lastSaved}`}>
                  <CheckCircle2 size={12} /> Salvo
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Gestão de presenças, folgas, falta ATM, férias, home office, banco de horas e saldo de DSRs.
            </p>
          </div>
        </div>

        {/* Botão Exportar Planilha */}
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer hover:border-slate-400 self-start sm:self-auto"
        >
          <Download size={13} className="text-slate-500" />
          <span>Exportar Planilha</span>
        </button>
      </div>

      {/* 2. BARRA DE FILTROS E SELEÇÃO DE MÊS/ANO INTEGRADA (LAYOUT COMPACTO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Navegação Rápida de Mês e Ano */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 transition cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Dropdown de Mês */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-black text-xs text-slate-800 px-1.5 py-1 outline-hidden cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Dropdown de Ano */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-black text-xs text-blue-700 px-1 py-1 outline-hidden cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 transition cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Filtro Interativo de Período e Calendário (Presets, Faixa e Dias) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedDays.length > 0 || startDateFilter || endDateFilter
                  ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Calendar size={13} className={selectedDays.length > 0 || startDateFilter || endDateFilter ? 'text-white' : 'text-slate-500'} />
              <span>
                {selectedDays.length === 0 && !startDateFilter && !endDateFilter ? (
                  `PERÍODO: Mês Todo (${daysInMonth}d)`
                ) : selectedDays.length > 0 ? (
                  `PERÍODO: ${selectedDays.length} dia(s)`
                ) : (
                  'PERÍODO: Faixa'
                )}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                selectedDays.length > 0 || startDateFilter || endDateFilter
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {activeFilteredDays.length}
              </span>
            </button>

            {/* Dropdown Popover do Calendário */}
            {isDateDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-[340px] space-y-3 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabeçalho do Dropdown */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                    <Calendar size={14} className="text-amber-500" />
                    <span>Filtrar por Dias do Mês</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('all')}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    Resetar Filtro
                  </button>
                </div>

                {/* Presets Rápidos */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyDatePreset('all')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      selectedDays.length === 0 && !startDateFilter && !endDateFilter
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60'
                    }`}
                  >
                    Mês Todo ({daysInMonth}d)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('workdays')}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 transition-all cursor-pointer"
                  >
                    Dias Úteis (Seg - Sex)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('q1')}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 transition-all cursor-pointer"
                  >
                    1ª Quinzena (01-15)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('q2')}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 transition-all cursor-pointer"
                  >
                    2ª Quinzena (16-{daysInMonth})
                  </button>
                </div>

                {/* Grade Visual do Calendário Mensal */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                  <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((dia, idx) => (
                      <span 
                        key={dia} 
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          idx === 0 || idx === 6 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {dia}
                      </span>
                    ))}
                  </div>

                  {(() => {
                    const firstDayWeekIdx = new Date(selectedYear, selectedMonth, 1).getDay()
                    const emptyPrefixSlots = Array.from({ length: firstDayWeekIdx })

                    return (
                      <div className="grid grid-cols-7 gap-1">
                        {emptyPrefixSlots.map((_, i) => (
                          <div key={`empty-${i}`} className="h-7 rounded-lg" />
                        ))}
                        {monthDaysList.map(d => {
                          const isSingleSelected = selectedDays.includes(d.day)
                          const dayIso = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
                          const isInRange = Boolean(
                            (startDateFilter && endDateFilter && dayIso >= startDateFilter && dayIso <= endDateFilter) ||
                            (startDateFilter && !endDateFilter && dayIso === startDateFilter) ||
                            (!startDateFilter && endDateFilter && dayIso === endDateFilter)
                          )
                          const isSelected = isSingleSelected || isInRange
                          const isWeekend = d.isSunday || d.isSaturday

                          return (
                            <button
                              key={`cal-btn-${d.day}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDayFilter(d.day)
                              }}
                              title={`Dia ${d.day}`}
                              className={`h-7 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 scale-105 z-10'
                                  : isWeekend
                                    ? 'bg-amber-100/50 hover:bg-amber-200/60 text-amber-900 border border-amber-200/40'
                                    : 'bg-white hover:bg-slate-200/60 text-slate-700 border border-slate-200/50 hover:border-slate-300'
                              }`}
                            >
                              <span>{d.day}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Seletor de Faixa de Datas (Início / Fim) */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight">FAIXA DE DATAS:</span>
                    {(startDateFilter || endDateFilter) && (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Range Ativo</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[9px] font-semibold text-slate-400 mb-0.5 uppercase">INÍCIO</span>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={e => {
                          setStartDateFilter(e.target.value)
                          setSelectedDays([])
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold text-slate-400 mb-0.5 uppercase">FIM</span>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={e => {
                          setEndDateFilter(e.target.value)
                          setSelectedDays([])
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rodapé do Dropdown */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                  <span>{activeFilteredDays.length} de {daysInMonth} dias exibidos</span>
                  <button
                    type="button"
                    onClick={() => setIsDateDropdownOpen(false)}
                    className="text-amber-600 hover:text-amber-800 font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Busca por Nome ou ID (Compacta) */}
          <div className="relative min-w-[200px] max-w-[280px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nome, ID, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filtro Múltipla Escolha: SETOR */}
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'setor' ? null : 'setor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedSetores.length > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 size={13} className="text-slate-400" />
              <span>Setor {selectedSetores.length > 0 ? `(${selectedSetores.length})` : ''}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {openFilterDropdown === 'setor' && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Filtrar por Setor</span>
                  {selectedSetores.length > 0 && (
                    <button
                      onClick={() => setSelectedSetores([])}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {setoresUnicos.map(st => {
                  const checked = selectedSetores.includes(st)
                  return (
                    <label
                      key={st}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiSelect(st, selectedSetores, setSelectedSetores)}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{st}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filtro Múltipla Escolha: TURNO */}
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'turno' ? null : 'turno')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedTurnos.length > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock size={13} className="text-slate-400" />
              <span>Turno {selectedTurnos.length > 0 ? `(${selectedTurnos.length})` : ''}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {openFilterDropdown === 'turno' && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Filtrar por Turno</span>
                  {selectedTurnos.length > 0 && (
                    <button
                      onClick={() => setSelectedTurnos([])}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {turnosUnicos.map(tr => {
                  const checked = selectedTurnos.includes(tr)
                  return (
                    <label
                      key={tr}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiSelect(tr, selectedTurnos, setSelectedTurnos)}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{tr}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filtro Múltipla Escolha: CARGO */}
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'cargo' ? null : 'cargo')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedCargos.length > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Briefcase size={13} className="text-slate-400" />
              <span>Cargo {selectedCargos.length > 0 ? `(${selectedCargos.length})` : ''}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {openFilterDropdown === 'cargo' && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Filtrar por Cargo</span>
                  {selectedCargos.length > 0 && (
                    <button
                      onClick={() => setSelectedCargos([])}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {cargosUnicos.map(cg => {
                  const checked = selectedCargos.includes(cg)
                  return (
                    <label
                      key={cg}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiSelect(cg, selectedCargos, setSelectedCargos)}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{cg}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filtro Múltipla Escolha: SUPERVISOR */}
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'supervisor' ? null : 'supervisor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedSupervisores.length > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users size={13} className="text-slate-400" />
              <span>Supervisor {selectedSupervisores.length > 0 ? `(${selectedSupervisores.length})` : ''}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {openFilterDropdown === 'supervisor' && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Filtrar por Supervisor</span>
                  {selectedSupervisores.length > 0 && (
                    <button
                      onClick={() => setSelectedSupervisores([])}
                      className="text-[10px] text-purple-600 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {supervisoresUnicos.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-slate-400 text-center">Nenhum supervisor encontrado</div>
                ) : (
                  supervisoresUnicos.map(sup => {
                    const checked = selectedSupervisores.includes(sup)
                    return (
                      <label
                        key={sup}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMultiSelect(sup, selectedSupervisores, setSelectedSupervisores)}
                          className="rounded-sm border-slate-300 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="truncate">{sup}</span>
                      </label>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Filtro Múltipla Escolha: LÍDER */}
          <div className="relative">
            <button
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'lider' ? null : 'lider')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedLideres.length > 0
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users size={13} className="text-slate-400" />
              <span>Líder {selectedLideres.length > 0 ? `(${selectedLideres.length})` : ''}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {openFilterDropdown === 'lider' && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase">Filtrar por Líder</span>
                  {selectedLideres.length > 0 && (
                    <button
                      onClick={() => setSelectedLideres([])}
                      className="text-[10px] text-sky-600 hover:underline font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {lideresUnicos.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-slate-400 text-center">Nenhum líder encontrado</div>
                ) : (
                  lideresUnicos.map(lid => {
                    const checked = selectedLideres.includes(lid)
                    return (
                      <label
                        key={lid}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMultiSelect(lid, selectedLideres, setSelectedLideres)}
                          className="rounded-sm border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="truncate">{lid}</span>
                      </label>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Limpar todos os filtros ativos */}
          {(selectedSetores.length > 0 || selectedTurnos.length > 0 || selectedCargos.length > 0 || selectedSupervisores.length > 0 || selectedLideres.length > 0 || search || selectedDays.length > 0 || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSelectedSetores([])
                setSelectedTurnos([])
                setSelectedCargos([])
                setSelectedSupervisores([])
                setSelectedLideres([])
                setSearch('')
                setSelectedDays([])
                setStartDateFilter('')
                setEndDateFilter('')
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition"
            >
              Limpar Filtros
            </button>
          )}

          {/* Contador de Exibição */}
          <div className="ml-auto text-xs font-bold text-slate-500 shrink-0">
            Exibindo <span className="text-blue-600 font-black">{filteredColaboradores.length}</span> de {colaboradores.length} colaboradores
          </div>
        </div>
      </div>

      {/* 4. TABELA MATRIZ DIÁRIA DE APONTAMENTO */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[720px] scrollbar-thin">
          <table className={`${activeFilteredDays.length < 15 ? 'w-auto' : 'w-full'} text-left border-collapse text-xs`}>
            {/* Cabeçalho da Tabela */}
            <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs border-b border-slate-200">
              
              {/* Linha 1: Títulos das Colunas Fixas + Dias da Semana */}
              <tr className="bg-blue-600 text-white font-extrabold uppercase text-[11px] tracking-wider">
                <th className="sticky left-0 z-40 bg-blue-700 px-2.5 py-2.5 border-r border-blue-500 min-w-[95px] max-w-[95px]">
                  Supervisor
                </th>
                <th className="sticky left-[95px] z-40 bg-blue-700 px-2.5 py-2.5 border-r border-blue-500 min-w-[95px] max-w-[95px]">
                  Líder
                </th>
                <th className="sticky left-[190px] z-40 bg-blue-700 px-3 py-2.5 border-r border-blue-500 min-w-[130px]">
                  Setor
                </th>
                <th className="sticky left-[320px] z-40 bg-blue-700 px-3 py-2.5 border-r border-blue-500 min-w-[80px]">
                  Turno
                </th>
                <th className="sticky left-[400px] z-40 bg-blue-700 px-3 py-2.5 border-r border-blue-500 min-w-[80px]">
                  ID
                </th>
                <th className="sticky left-[480px] z-40 bg-blue-700 px-3.5 py-2.5 border-r border-blue-500 min-w-[210px]">
                  Nome
                </th>
                <th className="sticky left-[690px] z-40 bg-blue-700 px-3 py-2.5 border-r border-blue-500 min-w-[150px]">
                  Cargo
                </th>
                <th className="sticky left-[840px] z-40 bg-blue-700 px-3 py-2.5 border-r border-blue-500 min-w-[105px] text-center" title="Saldo atual consolidado do Banco de Horas">
                  Débito / Crédito
                </th>
                <th className="sticky left-[945px] z-40 bg-blue-800 px-3 py-2.5 border-r-2 border-slate-400 min-w-[65px] text-center shadow-lg" title="Saldo de DSRs (Domingos trabalhados somam +1; DSR apontado subtrai -1)">
                  DSR
                </th>

                {/* Colunas Diárias: Dia da Semana */}
                {activeFilteredDays.map(m => (
                  <th
                    key={`w-${m.day}`}
                    className={`px-1 py-1.5 text-center min-w-[50px] w-[54px] border-r border-blue-500/50 text-[10px] font-bold ${
                      m.isSunday ? 'bg-amber-500 text-slate-950 font-black' : m.isSaturday ? 'bg-blue-700 text-blue-100' : ''
                    }`}
                  >
                    {m.weekdayName}
                  </th>
                ))}
              </tr>

              {/* Linha 2: Sub-cabeçalho com Datas (DD/MM/AAAA) */}
              <tr className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold border-b border-slate-300">
                <th colSpan={9} className="sticky left-0 z-40 bg-slate-200 border-r-2 border-slate-400 px-3 py-1 text-slate-500 text-right">
                  Data do Apontamento &rarr;
                </th>
                {activeFilteredDays.map(m => (
                  <th
                    key={`d-${m.day}`}
                    className={`px-1 py-1 text-center min-w-[50px] w-[54px] border-r border-slate-300 text-[10px] ${
                      m.isSunday ? 'bg-amber-100 text-amber-900 font-black' : m.isSaturday ? 'bg-blue-100/70 text-blue-900 font-bold' : ''
                    }`}
                  >
                    {m.dateStr.slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-slate-100">
              {filteredColaboradores.length === 0 ? (
                <tr>
                  <td colSpan={9 + activeFilteredDays.length} className="p-12 text-center text-slate-500 font-medium">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredColaboradores.map((colab, idx) => {
                  const colabId = String(colab.id || '')
                  const bh = bhBalances[colabId] || bhBalances[String(colab.contratado || '').toUpperCase()]
                  const saldoStr = bh?.saldoStr || '00:00h'
                  const isDebito = bh ? bh.saldoDec < 0 : false
                  const dsrBalance = calculateDsr(colabId)
                  const colabApont = apontamentos[colabId] || {}
                  const isEven = idx % 2 === 0
                  const leadInfo = getLeadershipNames(colab)

                  return (
                    <tr
                      key={colabId || idx}
                      className={`hover:bg-blue-50/40 transition-colors group ${
                        isEven ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {/* 1. Supervisor (Primeiro Nome) */}
                      <td className="sticky left-0 z-20 bg-inherit px-2.5 py-2 border-r border-slate-200 text-slate-800 font-bold truncate max-w-[95px]" title={colab.nomeLider}>
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px]">
                          {leadInfo.supervisorFirstName}
                        </span>
                      </td>

                      {/* 2. Líder (Primeiro Nome) */}
                      <td className="sticky left-[95px] z-20 bg-inherit px-2.5 py-2 border-r border-slate-200 text-slate-800 font-bold truncate max-w-[95px]" title={colab.nomeLider}>
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px]">
                          {leadInfo.liderFirstName}
                        </span>
                      </td>

                      {/* 3. Setor */}
                      <td className="sticky left-[190px] z-20 bg-inherit px-3 py-2 border-r border-slate-200 text-slate-700 font-medium truncate max-w-[130px]">
                        {colab.setor || colab.gerencia || 'Geral CD 6994'}
                      </td>

                      {/* 4. Turno */}
                      <td className="sticky left-[320px] z-20 bg-inherit px-3 py-2 border-r border-slate-200 text-slate-600 font-medium whitespace-nowrap">
                        {colab.turno || '1º Turno'}
                      </td>

                      {/* 5. ID */}
                      <td className="sticky left-[400px] z-20 bg-inherit px-3 py-2 border-r border-slate-200 font-mono font-bold text-slate-800">
                        {colabId}
                      </td>

                      {/* 6. Nome + Ação de Marcar Férias */}
                      <td className="sticky left-[480px] z-20 bg-inherit px-3.5 py-2 border-r border-slate-200 min-w-[210px]">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-extrabold text-slate-900 truncate" title={colab.contratado}>
                            {colab.contratado}
                          </span>
                          <button
                            onClick={() => setIntervalModal({
                              isOpen: true,
                              colabId,
                              colabNome: colab.contratado,
                              startDay: 1,
                              endDay: 15,
                              status: 'FER'
                            })}
                            title="Lançar período de Férias ou Intervalo"
                            className="p-1 rounded-md text-amber-600 hover:bg-amber-100 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Palmtree size={13} />
                          </button>
                        </div>
                      </td>

                      {/* 7. Cargo */}
                      <td className="sticky left-[690px] z-20 bg-inherit px-3 py-2 border-r border-slate-200 text-slate-600 font-medium truncate max-w-[150px]" title={colab.cargo}>
                        {colab.cargo}
                      </td>

                      {/* 8. Débito ou Crédito (Saldo BH) */}
                      <td className="sticky left-[840px] z-20 bg-inherit px-3 py-2 border-r border-slate-200 text-center font-mono font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          isDebito
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {saldoStr}
                        </span>
                      </td>

                      {/* 9. Qnt de DSR (Calculado) */}
                      <td className="sticky left-[945px] z-20 bg-slate-100 px-3 py-2 border-r-2 border-slate-400 text-center font-mono font-black text-xs shadow-md">
                        <span className={`px-2 py-0.5 rounded-full ${
                          dsrBalance > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : dsrBalance < 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'text-slate-600'
                        }`}>
                          {dsrBalance}
                        </span>
                      </td>

                      {/* Células Diárias de Apontamento com Dropdown Rápido */}
                      {activeFilteredDays.map(m => {
                        const currentStatus = colabApont[m.day] || ''
                        const cfg = currentStatus ? APONTAMENTO_STATUS_CONFIG[currentStatus as ApontamentoStatus] : null

                        return (
                          <td
                            key={`cell-${colabId}-${m.day}`}
                            className={`p-0.5 border-r border-slate-200 text-center ${
                              m.isSunday ? 'bg-amber-50/30' : m.isSaturday ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <select
                                value={currentStatus}
                                onChange={(e) => handleCellChange(colabId, m.day, e.target.value as any)}
                                title={`${m.weekdayName} (${m.dateStr})`}
                                className={`w-full py-1 text-center font-black rounded-md outline-hidden border transition cursor-pointer text-[11px] appearance-none ${
                                  cfg
                                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                                    : 'bg-transparent text-slate-300 hover:bg-slate-100 border-transparent hover:border-slate-300'
                                }`}
                              >
                                <option value="" className="text-slate-400 bg-white font-normal">-</option>
                                <option value="T" className="text-emerald-700 font-bold bg-white">T</option>
                                <option value="FLG" className="text-blue-700 font-bold bg-white">FLG</option>
                                <option value="FLT" className="text-red-700 font-bold bg-white">FLT</option>
                                <option value="ATM" className="text-rose-700 font-bold bg-white">ATM</option>
                                <option value="FER" className="text-amber-700 font-bold bg-white">FER</option>
                                <option value="REM" className="text-purple-700 font-bold bg-white">REM</option>
                                <option value="BH" className="text-sky-700 font-bold bg-white">BH</option>
                                <option value="DSR" className="text-indigo-700 font-bold bg-white">DSR</option>
                              </select>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DE LANÇAMENTO EM INTERVALO (Ex: FÉRIAS DE DIA X ATÉ DIA Y) */}
      {intervalModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Palmtree size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Lançar Intervalo de Dias
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[260px]">
                    {intervalModal.colabNome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIntervalModal({ ...intervalModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status a Aplicar
                </label>
                <select
                  value={intervalModal.status}
                  onChange={(e) => setIntervalModal({ ...intervalModal, status: e.target.value as ApontamentoStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="FER">FER</option>
                  <option value="T">T</option>
                  <option value="FLG">FLG</option>
                  <option value="FLT">FLT</option>
                  <option value="ATM">ATM</option>
                  <option value="REM">REM</option>
                  <option value="BH">BH</option>
                  <option value="DSR">DSR</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia Inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={daysInMonth}
                    value={intervalModal.startDay}
                    onChange={(e) => setIntervalModal({ ...intervalModal, startDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia Final
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={daysInMonth}
                    value={intervalModal.endDay}
                    onChange={(e) => setIntervalModal({ ...intervalModal, endDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Isso aplicará <strong>{APONTAMENTO_STATUS_CONFIG[intervalModal.status].label}</strong> em todos os dias do dia <strong>{intervalModal.startDay}</strong> até o dia <strong>{intervalModal.endDay}</strong> de <strong>{MONTH_NAMES[selectedMonth]}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIntervalModal({ ...intervalModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyInterval}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Aplicar Intervalo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
