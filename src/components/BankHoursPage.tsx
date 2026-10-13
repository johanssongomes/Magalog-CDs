import React, { useState, useEffect, useMemo } from 'react'
import { 
  Clock, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Building2, 
  Briefcase, 
  Calendar, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react'

export interface BankHourRecord {
  data: string
  id: string
  contratado: string
  cargo: string
  centroDeCusto: string
  tipo: 'Crédito de Horas' | 'Débito de Horas' | string
  qtdHoras: string
  horasDecimais: number // positivo para crédito, negativo para débito
  horasAbsolutas: number
}

// URL padrão da planilha do usuário
const DEFAULT_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1rOqQq0CvzT2LNIvHB6zWmgtmbK7rDU3idyI7rbf_j5g/gviz/tq?tqx=out:csv&gid=0'
const GOOGLE_SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1rOqQq0CvzT2LNIvHB6zWmgtmbK7rDU3idyI7rbf_j5g/edit?gid=0#gid=0'

// Função para converter "HH:MM" ou "HH:MM:SS" em horas decimais
function parseTimeToDecimal(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().replace(/^"/, '').replace(/"$/, '')
  const parts = clean.split(':').map(Number)
  if (parts.some(isNaN)) return 0
  
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  const seconds = parts[2] || 0

  return hours + (minutes / 60) + (seconds / 3600)
}

// Normaliza texto removendo acentuação para comparações seguras
function normalizeStr(str: string): string {
  if (!str) return ''
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

// Formata horas decimais de volta para "+HH:MMh" ou "-HH:MMh"
function formatDecimalToHours(decimal: number): string {
  const isNegative = decimal < 0
  const abs = Math.abs(decimal)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  const sign = isNegative ? '-' : '+'
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`
}

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
        i++ // pula aspas escapadas
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
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

export const BankHoursPage: React.FC = () => {
  const [data, setData] = useState<BankHourRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string>('')
  
  // Filtros
  const [search, setSearch] = useState('')
  const [selectedCC, setSelectedCC] = useState<string>('Todos')
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos')
  const [selectedCargo, setSelectedCargo] = useState<string>('Todos')
  const [selectedData, setSelectedData] = useState<string>('Todas')
  const [viewTab, setViewTab] = useState<'geral' | 'colaboradores' | 'centros' | 'evolucao' | 'relatorio'>('geral')
  const [evolutionSelectedEmp, setEvolutionSelectedEmp] = useState<string>('')

  // Carregar dados do Google Sheets
  const fetchSheetData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Adiciona timestamp para não cachear
      const res = await fetch(`${DEFAULT_SHEET_CSV_URL}&_ts=${Date.now()}`)
      if (!res.ok) {
        throw new Error(`Falha ao conectar com o Google Sheets (${res.status} ${res.statusText})`)
      }
      const csvText = await res.text()
      const parsedRows = parseCSV(csvText)

      if (parsedRows.length < 2) {
        throw new Error('A planilha retornou vazia ou sem cabeçalhos válidos.')
      }

      // Encontrar índices das colunas esperadas
      // "Data","ID","Contratado","Cargo","Centro de Custo","Crédito / Débito","Qtd Horas"
      const headers = parsedRows[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      
      const idxData = headers.findIndex(h => h.includes('data'))
      const idxId = headers.findIndex(h => h === 'id' || h.includes('matricula'))
      const idxNome = headers.findIndex(h => h.includes('contratado') || h.includes('nome'))
      const idxCargo = headers.findIndex(h => h.includes('cargo'))
      const idxCC = headers.findIndex(h => h.includes('centro') || h.includes('custo'))
      const idxTipo = headers.findIndex(h => h.includes('credito') || h.includes('debito') || h.includes('tipo'))
      const idxHoras = headers.findIndex(h => h.includes('hora') || h.includes('qtd'))

      const records: BankHourRecord[] = []

      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i]
        if (!row || row.length === 0 || !row[idxNome]) continue

        const dataStr = row[idxData] || ''
        const idStr = row[idxId] || ''
        const contratado = row[idxNome] || ''
        const cargo = row[idxCargo] || 'Não especificado'
        const cc = row[idxCC] || 'Geral'
        const tipo = row[idxTipo] || ''
        const qtdHoras = row[idxHoras] || '00:00'

        const horasDec = parseTimeToDecimal(qtdHoras)
        const normTipo = normalizeStr(tipo)
        const isDebito = normTipo.includes('debito')
        const isCredito = normTipo.includes('credito')

        records.push({
          data: dataStr,
          id: idStr,
          contratado,
          cargo,
          centroDeCusto: cc,
          tipo,
          qtdHoras,
          horasDecimais: isDebito ? -horasDec : horasDec,
          horasAbsolutas: horasDec
        })
      }

      setData(records)
      const now = new Date()
      setLastSync(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      
      // Salva no cache do navegador como contingência offline
      try {
        localStorage.setItem('magalog_bank_hours_cache', JSON.stringify(records))
        localStorage.setItem('magalog_bank_hours_last_sync', now.toISOString())
      } catch (e) {
        console.warn('Erro ao cachear:', e)
      }
    } catch (err: any) {
      console.error('Erro ao ler planilha:', err)
      setError(err.message || 'Erro ao carregar dados do Google Sheets.')
      
      // Tentar restaurar do cache local
      const cached = localStorage.getItem('magalog_bank_hours_cache')
      if (cached) {
        try {
          setData(JSON.parse(cached))
        } catch (e) {
          console.error(e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSheetData()
  }, [])

  // Listas para Filtros Únicos
  const centrosDeCusto = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.centroDeCusto) set.add(d.centroDeCusto) })
    return Array.from(set).sort()
  }, [data])

  const cargos = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.cargo) set.add(d.cargo) })
    return Array.from(set).sort()
  }, [data])

  const datasUnicas = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.data) set.add(d.data) })
    return Array.from(set)
  }, [data])

  // Filtragem
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase()
      const matchSearch = 
        !search ||
        item.contratado.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        item.centroDeCusto.toLowerCase().includes(q)

      const matchCC = selectedCC === 'Todos' || item.centroDeCusto === selectedCC
      const matchTipo = selectedTipo === 'Todos' || normalizeStr(item.tipo).includes(normalizeStr(selectedTipo))
      const matchCargo = selectedCargo === 'Todos' || item.cargo === selectedCargo
      const matchData = selectedData === 'Todas' || item.data === selectedData

      return matchSearch && matchCC && matchTipo && matchCargo && matchData
    })
  }, [data, search, selectedCC, selectedTipo, selectedCargo, selectedData])

  // Histórico e Evolução por Colaborador através das Datas
  const employeeEvolutionData = useMemo(() => {
    // Mapa: colaboradorId -> { info, dates: Map<dataStr, { credito, debito, saldo, qtdHoras }> }
    const map = new Map<string, {
      id: string
      nome: string
      cargo: string
      centroDeCusto: string
      historicoPorData: {
        data: string
        credito: number
        debito: number
        saldo: number
        tipo: string
        qtdHoras: string
      }[]
      saldoPrimeiraData: number
      saldoUltimaData: number
      diferencaEvolucao: number
      saldoAtualTotal: number
    }>()

    // Ordenar dados por data
    const sorted = [...data].sort((a, b) => {
      // Ordenação padrão brasileira DD/MM/AAAA
      const [diaA, mesA, anoA] = a.data.split('/').map(Number)
      const [diaB, mesB, anoB] = b.data.split('/').map(Number)
      const dateA = new Date(anoA || 2026, (mesA || 1) - 1, diaA || 1).getTime()
      const dateB = new Date(anoB || 2026, (mesB || 1) - 1, diaB || 1).getTime()
      return dateA - dateB
    })

    sorted.forEach(item => {
      const key = `${item.id}-${item.contratado}`
      const existing = map.get(key) || {
        id: item.id,
        nome: item.contratado,
        cargo: item.cargo,
        centroDeCusto: item.centroDeCusto,
        historicoPorData: [],
        saldoPrimeiraData: 0,
        saldoUltimaData: 0,
        diferencaEvolucao: 0,
        saldoAtualTotal: 0
      }

      const normTipo = normalizeStr(item.tipo)
      const isCredito = normTipo.includes('credito')
      const credito = isCredito ? item.horasAbsolutas : 0
      const debito = !isCredito ? item.horasAbsolutas : 0
      const saldo = credito - debito

      existing.historicoPorData.push({
        data: item.data,
        credito,
        debito,
        saldo,
        tipo: item.tipo,
        qtdHoras: item.qtdHoras
      })

      map.set(key, existing)
    })

    // Calcular evolução (se aumentou ou diminuiu horas)
    const list = Array.from(map.values()).map(emp => {
      if (emp.historicoPorData.length > 1) {
        emp.saldoPrimeiraData = emp.historicoPorData[0].saldo
        emp.saldoUltimaData = emp.historicoPorData[emp.historicoPorData.length - 1].saldo
        emp.diferencaEvolucao = emp.saldoUltimaData - emp.saldoPrimeiraData
        // O saldo atual consolidado do colaborador é a posição da última data registrada
        emp.saldoAtualTotal = emp.saldoUltimaData
      } else if (emp.historicoPorData.length === 1) {
        emp.saldoPrimeiraData = emp.historicoPorData[0].saldo
        emp.saldoUltimaData = emp.historicoPorData[0].saldo
        emp.diferencaEvolucao = 0
        emp.saldoAtualTotal = emp.saldoPrimeiraData
      }
      return emp
    })

    // Aplicar filtros de busca, centro de custo e cargo na matriz de evolução
    const q = search.toLowerCase()
    return list.filter(emp => {
      const matchSearch = 
        !search ||
        emp.nome.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.cargo.toLowerCase().includes(q) ||
        emp.centroDeCusto.toLowerCase().includes(q)

      const matchCC = selectedCC === 'Todos' || emp.centroDeCusto === selectedCC
      const matchCargo = selectedCargo === 'Todos' || emp.cargo === selectedCargo

      return matchSearch && matchCC && matchCargo
    })
  }, [data, search, selectedCC, selectedCargo])

  // Agrupamento por Colaborador
  const groupedByEmployee = useMemo(() => {
    const map = new Map<string, {
      id: string
      nome: string
      cargo: string
      centroDeCusto: string
      creditoHoras: number
      debitoHoras: number
      saldoHoras: number
      registrosCount: number
    }>()

    filteredData.forEach(item => {
      const key = `${item.id}-${item.contratado}`
      const existing = map.get(key) || {
        id: item.id,
        nome: item.contratado,
        cargo: item.cargo,
        centroDeCusto: item.centroDeCusto,
        creditoHoras: 0,
        debitoHoras: 0,
        saldoHoras: 0,
        registrosCount: 0
      }

      const normTipo = normalizeStr(item.tipo)
      if (normTipo.includes('credito')) {
        existing.creditoHoras += item.horasAbsolutas
      } else if (normTipo.includes('debito')) {
        existing.debitoHoras += item.horasAbsolutas
      }

      existing.saldoHoras = existing.creditoHoras - existing.debitoHoras
      existing.registrosCount += 1
      map.set(key, existing)
    })

    return Array.from(map.values()).sort((a, b) => b.saldoHoras - a.saldoHoras)
  }, [filteredData])

  // Agrupamento por Centro de Custo
  const groupedByCC = useMemo(() => {
    const map = new Map<string, {
      centro: string
      totalColaboradores: Set<string>
      creditoTotal: number
      debitoTotal: number
      saldoTotal: number
    }>()

    filteredData.forEach(item => {
      const cc = item.centroDeCusto || 'Sem CC'
      const existing = map.get(cc) || {
        centro: cc,
        totalColaboradores: new Set<string>(),
        creditoTotal: 0,
        debitoTotal: 0,
        saldoTotal: 0
      }

      existing.totalColaboradores.add(item.id || item.contratado)
      const normTipo = normalizeStr(item.tipo)
      if (normTipo.includes('credito')) {
        existing.creditoTotal += item.horasAbsolutas
      } else if (normTipo.includes('debito')) {
        existing.debitoTotal += item.horasAbsolutas
      }
      existing.saldoTotal = existing.creditoTotal - existing.debitoTotal
      map.set(cc, existing)
    })

    return Array.from(map.values()).sort((a, b) => b.saldoTotal - a.saldoTotal)
  }, [filteredData])

  // KPIs Gerais do Filtro Atual
  const totalCredito = useMemo(() => {
    return filteredData
      .filter(d => normalizeStr(d.tipo).includes('credito'))
      .reduce((acc, d) => acc + d.horasAbsolutas, 0)
  }, [filteredData])

  const totalDebito = useMemo(() => {
    return filteredData
      .filter(d => normalizeStr(d.tipo).includes('debito'))
      .reduce((acc, d) => acc + d.horasAbsolutas, 0)
  }, [filteredData])

  const saldoLiquido = totalCredito - totalDebito
  const totalColaboradoresUnicos = useMemo(() => {
    return new Set(filteredData.map(d => d.id || d.contratado)).size
  }, [filteredData])

  const colaboradoresComDebito = useMemo(() => {
    return groupedByEmployee.filter(e => e.saldoHoras < 0).length
  }, [groupedByEmployee])

  const colaboradoresComCredito = useMemo(() => {
    return groupedByEmployee.filter(e => e.saldoHoras > 0).length
  }, [groupedByEmployee])

  // Exportar dados para CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'ID', 'Colaborador', 'Cargo', 'Centro de Custo', 'Tipo', 'Qtd Horas', 'Saldo Decimal']
    const rows = filteredData.map(d => [
      `"${d.data}"`,
      `"${d.id}"`,
      `"${d.contratado}"`,
      `"${d.cargo}"`,
      `"${d.centroDeCusto}"`,
      `"${d.tipo}"`,
      `"${d.qtdHoras}"`,
      `"${d.horasDecimais.toFixed(2)}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `banco_de_horas_magalog_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner de Integração com Google Sheets */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-300">
                <Clock size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Banco de Horas Integrado</h1>
                <p className="text-blue-200/80 text-xs mt-0.5">
                  Conexão em tempo real com sua planilha Google Sheets como banco de dados ativo
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a 
              href={GOOGLE_SHEET_EDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/15 active:scale-95"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              Abrir Planilha Google
              <ExternalLink size={13} className="opacity-70" />
            </a>

            <button
              onClick={fetchSheetData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </div>

        {/* Status de Sincronização */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-blue-200/90 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span><strong>Status do Conector:</strong> Google Sheets Conectado & Sincronizado</span>
            {lastSync && <span className="text-blue-300/60 font-mono text-[11px]">• Última leitura às {lastSync}</span>}
          </div>
          <div className="font-mono text-[11px] text-blue-300/80">
            {data.length} lançamentos encontrados no Sheets
          </div>
        </div>
      </div>

      {/* Alerta de Erro se houver */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span><strong>Aviso de Conexão:</strong> {error}</span>
          </div>
          <button 
            onClick={fetchSheetData}
            className="font-bold underline hover:text-rose-950"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Líquido Geral */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Líquido</span>
            <span className={`p-2 rounded-xl text-xs ${saldoLiquido >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {saldoLiquido >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black font-mono tracking-tight ${saldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatDecimalToHours(saldoLiquido)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {saldoLiquido >= 0 ? 'Superávit geral de horas' : 'Déficit geral de horas'} da equipe
            </p>
          </div>
        </div>

        {/* Card 2: Total Crédito de Horas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Créditos</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono tracking-tight text-indigo-900">
              +{formatDecimalToHours(totalCredito).replace('+', '')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {colaboradoresComCredito} colaboradores com saldo positivo
            </p>
          </div>
        </div>

        {/* Card 3: Total Débito de Horas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Débitos</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono tracking-tight text-rose-700">
              -{formatDecimalToHours(totalDebito).replace('+', '').replace('-', '')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {colaboradoresComDebito} colaboradores devendo horas
            </p>
          </div>
        </div>

        {/* Card 4: Colaboradores no Filtro */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colaboradores</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {totalColaboradoresUnicos}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Distribuídos em {centrosDeCusto.length} centros de custo
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador, matrícula, cargo ou centro de custo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Centro de Custo */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Building2 size={13} className="text-slate-500" />
            <select
              value={selectedCC}
              onChange={e => setSelectedCC(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="Todos">Todos os Centros</option>
              {centrosDeCusto.map(cc => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo Crédito / Débito */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter size={13} className="text-slate-500" />
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="credito">Apenas Crédito</option>
              <option value="debito">Apenas Débito</option>
            </select>
          </div>

          {/* Filtro Data de Lançamento */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar size={13} className="text-slate-500" />
            <select
              value={selectedData}
              onChange={e => setSelectedData(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Todas">Todas as Datas</option>
              {datasUnicas.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Botão Exportar */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            title="Exportar dados filtrados para CSV"
          >
            <Download size={13} />
            Exportar
          </button>
        </div>
      </div>

      {/* Sub-Navegação de Abas da Página */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setViewTab('geral')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            viewTab === 'geral' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart2 size={14} />
          Visão Geral & Gráficos
        </button>

        <button
          onClick={() => setViewTab('colaboradores')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            viewTab === 'colaboradores' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={14} />
          Por Colaborador ({groupedByEmployee.length})
        </button>

        <button
          onClick={() => setViewTab('evolucao')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            viewTab === 'evolucao' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp size={14} />
          Evolução por Data
        </button>

        <button
          onClick={() => setViewTab('centros')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            viewTab === 'centros' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={14} />
          Por Centro de Custo ({groupedByCC.length})
        </button>

        <button
          onClick={() => setViewTab('relatorio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            viewTab === 'relatorio' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={14} />
          Todos os Lançamentos ({filteredData.length})
        </button>
      </div>

      {/* CONTEÚDO 1: VISÃO GERAL & GRÁFICOS */}
      {viewTab === 'geral' && (
        <div className="space-y-6">
          {/* Grid de Gráficos e Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Maiores Saldos Positivos (Crédito) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="text-sm font-bold text-slate-800">Top 5 - Maiores Créditos de Horas</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Horas Positivas
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-3">
                {groupedByEmployee
                  .filter(e => e.saldoHoras > 0)
                  .slice(0, 5)
                  .map((emp, i) => {
                    const maxPos = groupedByEmployee[0]?.saldoHoras || 1
                    const pct = Math.min(100, Math.round((emp.saldoHoras / maxPos) * 100))
                    return (
                      <div key={emp.id} className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                            <strong className="text-slate-400 font-mono text-[11px] mr-1.5">#{i + 1}</strong>
                            {emp.nome}
                          </span>
                          <span className="font-mono font-black text-emerald-700">
                            {formatDecimalToHours(emp.saldoHoras)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                            {emp.cargo}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Gráfico 2: Maiores Saldos Negativos (Débitos) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <h3 className="text-sm font-bold text-slate-800">Top 5 - Maiores Débitos de Horas</h3>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Atenção / Déficit
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-3">
                {groupedByEmployee
                  .filter(e => e.saldoHoras < 0)
                  .sort((a, b) => a.saldoHoras - b.saldoHoras)
                  .slice(0, 5)
                  .map((emp, i) => {
                    const minNeg = Math.abs(groupedByEmployee.find(e => e.saldoHoras < 0)?.saldoHoras || 1)
                    const pct = Math.min(100, Math.round((Math.abs(emp.saldoHoras) / minNeg) * 100))
                    return (
                      <div key={emp.id} className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                            <strong className="text-slate-400 font-mono text-[11px] mr-1.5">#{i + 1}</strong>
                            {emp.nome}
                          </span>
                          <span className="font-mono font-black text-rose-700">
                            {formatDecimalToHours(emp.saldoHoras)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                            {emp.cargo}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Resumo por Centro de Custo no Dashboard */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Saldo por Centro de Custo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedByCC.map(c => (
                <div key={c.centro} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]" title={c.centro}>
                      {c.centro}
                    </span>
                    <span className={`text-xs font-mono font-black ${c.saldoTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatDecimalToHours(c.saldoTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
                    <span>{c.totalColaboradores.size} pessoas</span>
                    <span>+{c.creditoTotal.toFixed(1)}h / -{c.debitoTotal.toFixed(1)}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: POR COLABORADOR */}
      {viewTab === 'colaboradores' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                  <th className="p-3">Matrícula (ID)</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Centro de Custo</th>
                  <th className="p-3 text-right">Crédito</th>
                  <th className="p-3 text-right">Débito</th>
                  <th className="p-3 text-right">Saldo Líquido</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {groupedByEmployee.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-900">{emp.id}</td>
                    <td className="p-3 font-bold text-slate-800">{emp.nome}</td>
                    <td className="p-3 text-slate-600 font-medium">{emp.cargo}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{emp.centroDeCusto}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {formatDecimalToHours(emp.creditoHoras)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      {emp.debitoHoras > 0 ? formatDecimalToHours(-emp.debitoHoras) : '00:00h'}
                    </td>
                    <td className={`p-3 text-right font-mono font-black text-sm ${emp.saldoHoras >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatDecimalToHours(emp.saldoHoras)}
                    </td>
                    <td className="p-3 text-center">
                      {emp.saldoHoras >= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Positivo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                          Negativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO NOVO: EVOLUÇÃO POR DATA */}
      {viewTab === 'evolucao' && (
        <div className="space-y-6">
          {/* Header & Resumo de Evolução */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Aumentaram Saldo (+)</span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                  {employeeEvolutionData.filter(e => e.diferencaEvolucao > 0).length} colaboradores
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Saldo subiu entre a 1ª e última data</p>
              </div>
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <ArrowUpRight size={20} />
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Diminuíram Saldo (-)</span>
                <div className="text-xl font-black text-rose-700 font-mono mt-1">
                  {employeeEvolutionData.filter(e => e.diferencaEvolucao < 0).length} colaboradores
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Saldo caiu / compensaram horas</p>
              </div>
              <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                <ArrowDownRight size={20} />
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Datas Mapeadas</span>
                <div className="text-xl font-black text-blue-900 font-mono mt-1">
                  {datasUnicas.length} dias
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {datasUnicas.slice(0, 3).join(', ')}{datasUnicas.length > 3 ? '...' : ''}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                <Calendar size={20} />
              </span>
            </div>
          </div>

          {/* Tabela de Acompanhamento de Evolução */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Matriz Comparativa de Horas por Data
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Veja dia a dia a movimentação de cada colaborador e a variação do saldo.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                {employeeEvolutionData.length} colaboradores analisados
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                    <th className="p-3">Matrícula (ID)</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Centro de Custo</th>
                    {datasUnicas.map(d => (
                      <th key={d} className="p-3 text-right whitespace-nowrap bg-slate-800/80">
                        {d}
                      </th>
                    ))}
                    <th className="p-3 text-right bg-slate-950 font-bold">Saldo Atual</th>
                    <th className="p-3 text-center">Evolução Geral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {employeeEvolutionData.map(emp => {
                    const diff = emp.diferencaEvolucao
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-900">{emp.id}</td>
                        <td className="p-3 font-bold text-slate-800">{emp.nome}</td>
                        <td className="p-3 text-slate-600 font-medium">{emp.cargo}</td>
                        <td className="p-3 text-slate-500 text-[11px]">{emp.centroDeCusto}</td>

                        {/* Colunas dinâmicas por cada data */}
                        {datasUnicas.map(d => {
                          const registro = emp.historicoPorData.find(h => h.data === d)
                          if (!registro) {
                            return (
                              <td key={d} className="p-3 text-right text-slate-300 font-mono">
                                -
                              </td>
                            )
                          }
                          const isPos = registro.saldo >= 0
                          return (
                            <td key={d} className="p-3 text-right font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                                isPos 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {isPos ? `+${registro.qtdHoras}` : `-${registro.qtdHoras}`}
                              </span>
                            </td>
                          )
                        })}

                        {/* Saldo Consolidado */}
                        <td className={`p-3 text-right font-mono font-black text-sm bg-slate-50/50 ${
                          emp.saldoAtualTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatDecimalToHours(emp.saldoAtualTotal)}
                        </td>

                        {/* Indicador de Evolução */}
                        <td className="p-3 text-center">
                          {emp.historicoPorData.length <= 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Base Inicial
                            </span>
                          ) : diff > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <ArrowUpRight size={11} /> Aumentou (+{diff.toFixed(2)}h)
                            </span>
                          ) : diff < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                              <ArrowDownRight size={11} /> Diminuiu ({diff.toFixed(2)}h)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              Estável
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO 3: POR CENTRO DE CUSTO */}
      {viewTab === 'centros' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                  <th className="p-3">Centro de Custo</th>
                  <th className="p-3 text-center">Colaboradores</th>
                  <th className="p-3 text-right">Total Crédito</th>
                  <th className="p-3 text-right">Total Débito</th>
                  <th className="p-3 text-right">Saldo Líquido</th>
                  <th className="p-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {groupedByCC.map(cc => (
                  <tr key={cc.centro} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{cc.centro}</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-900">
                      {cc.totalColaboradores.size}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {formatDecimalToHours(cc.creditoTotal)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      {cc.debitoTotal > 0 ? formatDecimalToHours(-cc.debitoTotal) : '00:00h'}
                    </td>
                    <td className={`p-3 text-right font-mono font-black text-sm ${cc.saldoTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatDecimalToHours(cc.saldoTotal)}
                    </td>
                    <td className="p-3 text-center">
                      {cc.saldoTotal >= 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Superávit
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                          Déficit
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO 4: RELATÓRIO COMPLETO DE LANÇAMENTOS */}
      {viewTab === 'relatorio' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                  <th className="p-3">Data</th>
                  <th className="p-3">Matrícula (ID)</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Centro de Custo</th>
                  <th className="p-3 text-center">Tipo</th>
                  <th className="p-3 text-right">Qtd Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredData.map((row, idx) => {
                  const isDebito = normalizeStr(row.tipo).includes('debito')
                  return (
                    <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-600">{row.data}</td>
                      <td className="p-3 font-mono font-bold text-blue-900">{row.id}</td>
                      <td className="p-3 font-bold text-slate-800">{row.contratado}</td>
                      <td className="p-3 text-slate-600 font-medium">{row.cargo}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{row.centroDeCusto}</td>
                      <td className="p-3 text-center">
                        {isDebito ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <ArrowDownRight size={11} /> Débito
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <ArrowUpRight size={11} /> Crédito
                          </span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold text-sm ${isDebito ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {isDebito ? `-${row.qtdHoras}` : `+${row.qtdHoras}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
