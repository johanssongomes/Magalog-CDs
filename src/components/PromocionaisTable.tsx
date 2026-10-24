import React, { useEffect, useState, useMemo } from 'react'
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Tag, 
  Layers, 
  Calendar, 
  Globe, 
  Download, 
  ChevronDown, 
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers3,
  CheckCircle2,
  BarChart3,
  Check,
  X,
  TrendingUp,
  Flame,
  Info
} from 'lucide-react'

export interface PromocionalItem {
  ibm: string
  gemco: string
  descricao: string
  familia: string
  linha: string
  campanha: string
  dataInicio: string
  dataValidade: string
  regiao: string
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Vn3qZEQIDOpF1K1EqxKo_KNY_7DWw4_I0eEf-Ap378E/edit?gid=0#gid=0'
const CSV_EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1Vn3qZEQIDOpF1K1EqxKo_KNY_7DWw4_I0eEf-Ap378E/export?format=csv&gid=0'

// Paleta harmoniosa para distinguir as Linhas no gráfico
const LINHA_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  'WEA - WEARABLES': { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-400', fill: '#6366f1' },
  'ET - IMAGEM': { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-400', fill: '#0ea5e9' },
  'UD - UTILIDADES DOMESTICAS': { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-400', fill: '#f59e0b' },
  'IN - INFORMATICA': { bg: 'bg-cyan-500', border: 'border-cyan-400', text: 'text-cyan-400', fill: '#06b6d4' },
  'PN - PNEUS': { bg: 'bg-zinc-500', border: 'border-zinc-400', text: 'text-zinc-400', fill: '#71717a' },
  'EA - AUDIO': { bg: 'bg-fuchsia-500', border: 'border-fuchsia-400', text: 'text-fuchsia-400', fill: '#d946ef' },
  'TE - TELEFONIA': { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-400', fill: '#2563eb' },
  'ED1 - ELETRO 1': { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', fill: '#10b981' },
  'EP - ELETROPORTATEIS': { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-400', fill: '#f97316' },
  'FS - FERRAMENTAS': { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-400', fill: '#eab308' },
  'BKF - BIKE & FITNESS': { bg: 'bg-teal-500', border: 'border-teal-400', text: 'text-teal-400', fill: '#14b8a6' },
  'BR - BRINQUEDOS': { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-400', fill: '#ec4899' },
  'BB - BEBE': { bg: 'bg-rose-400', border: 'border-rose-300', text: 'text-rose-400', fill: '#fb7185' },
  'MO2 - SALA E COZINHA': { bg: 'bg-violet-500', border: 'border-violet-400', text: 'text-violet-400', fill: '#8b5cf6' },
  'MO1 - QUARTO E ESCRITORIO': { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-400', fill: '#9333ea' }
}

const DEFAULT_COLOR = { bg: 'bg-slate-500', border: 'border-slate-400', text: 'text-slate-400', fill: '#64748b' }

export const PromocionaisTable: React.FC = () => {
  const [items, setItems] = useState<PromocionalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  // Filtros de múltipla seleção
  const [search, setSearch] = useState('')
  const [selectedLinhas, setSelectedLinhas] = useState<string[]>([])
  const [selectedFamilias, setSelectedFamilias] = useState<string[]>([])
  const [selectedCampanhas, setSelectedCampanhas] = useState<string[]>([])

  // Controle de abertura de dropdowns
  const [openDropdown, setOpenDropdown] = useState<'linhas' | 'campanhas' | 'familias' | null>(null)

  // Filtro de data selecionada pelo clique nas barras do gráfico (interatividade total)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null)

  // Parse CSV robusto com suporte a aspas e quebras de linha
  const parseCSV = (csvText: string) => {
    const p = csvText.indexOf('IBM,GEMCO')
    if (p === -1) {
      throw new Error('Cabeçalho da planilha não encontrado ou formato incompatível.')
    }

    const topChunk = csvText.substring(0, p)
    const updateMatch = topChunk.match(/\*?Atualizado\s*,\s*([^\r\n,]+)/i)
    if (updateMatch && updateMatch[1]) {
      setLastUpdated(updateMatch[1].trim())
    }

    const csvData = csvText.substring(p)
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentVal = ''
    let inQuotes = false

    for (let i = 0; i < csvData.length; i++) {
      const char = csvData[i]
      const nextChar = csvData[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim())
        currentVal = ''
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++
        currentRow.push(currentVal.trim())
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = [];
        currentVal = ''
      } else {
        currentVal += char
      }
    }
    if (currentVal || currentRow.length > 0) {
      currentRow.push(currentVal.trim())
      rows.push(currentRow)
    }

    if (rows.length <= 1) return []

    const parsedItems: PromocionalItem[] = []
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const ibm = row[0] || ''
      const descricao = row[2] || ''
      if (!ibm && !descricao) continue

      parsedItems.push({
        ibm: ibm,
        gemco: row[1] || '',
        descricao: descricao,
        familia: row[3] || '',
        linha: row[4] || '',
        campanha: row[5] || '',
        dataInicio: row[6] || '',
        dataValidade: row[7] || '',
        regiao: row[8] || 'BR'
      })
    }

    return parsedItems
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(CSV_EXPORT_URL)
      if (!res.ok) {
        throw new Error(`Erro ao acessar planilha Google (Status ${res.status})`)
      }
      const text = await res.text()
      const data = parseCSV(text)
      setItems(data)
      localStorage.setItem('magalog_pmt_promocionais_cache', JSON.stringify({
        data,
        cachedAt: new Date().toISOString()
      }))
    } catch (err: any) {
      console.warn('Erro ao carregar dados online da planilha:', err)
      const cached = localStorage.getItem('magalog_pmt_promocionais_cache')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setItems(parsed.data || [])
          setError('Exibindo dados em cache local (sem conexão direta com a planilha no momento).')
          return
        } catch {}
      }
      setError(err.message || 'Falha ao sincronizar dados com o Google Sheets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Listas de Opções
  const linhasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.linha) set.add(i.linha) })
    return Array.from(set).sort()
  }, [items])

  const familiasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.familia) set.add(i.familia) })
    return Array.from(set).sort()
  }, [items])

  const campanhasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.campanha) set.add(i.campanha) })
    return Array.from(set).sort()
  }, [items])

  // Itens filtrados com suporte à múltipla seleção
  const filteredItems = useMemo(() => {
    const s = search.toLowerCase().trim()
    return items.filter(item => {
      const matchSearch = !s || 
        item.ibm.toLowerCase().includes(s) ||
        item.gemco.toLowerCase().includes(s) ||
        item.descricao.toLowerCase().includes(s) ||
        item.familia.toLowerCase().includes(s) ||
        item.linha.toLowerCase().includes(s) ||
        item.campanha.toLowerCase().includes(s)

      const matchLinha = selectedLinhas.length === 0 || selectedLinhas.includes(item.linha)
      const matchFamilia = selectedFamilias.length === 0 || selectedFamilias.includes(item.familia)
      const matchCampanha = selectedCampanhas.length === 0 || selectedCampanhas.includes(item.campanha)
      const matchDate = !selectedDateFilter || item.dataValidade === selectedDateFilter

      return matchSearch && matchLinha && matchFamilia && matchCampanha && matchDate
    })
  }, [items, search, selectedLinhas, selectedFamilias, selectedCampanhas, selectedDateFilter])

  // =========================================================================
  // PROCESSAMENTO DO GRÁFICO: DATAS x LINHA (CONCENTRAÇÃO DE OFERTAS)
  // =========================================================================
  const chartData = useMemo(() => {
    // Para o gráfico, consideramos os itens respeitando os filtros de busca, linha, família e campanha
    const baseItems = items.filter(item => {
      const s = search.toLowerCase().trim()
      const matchSearch = !s || 
        item.ibm.toLowerCase().includes(s) ||
        item.gemco.toLowerCase().includes(s) ||
        item.descricao.toLowerCase().includes(s) ||
        item.familia.toLowerCase().includes(s) ||
        item.linha.toLowerCase().includes(s) ||
        item.campanha.toLowerCase().includes(s)

      const matchLinha = selectedLinhas.length === 0 || selectedLinhas.includes(item.linha)
      const matchFamilia = selectedFamilias.length === 0 || selectedFamilias.includes(item.familia)
      const matchCampanha = selectedCampanhas.length === 0 || selectedCampanhas.includes(item.campanha)

      return matchSearch && matchLinha && matchFamilia && matchCampanha
    })

    // Agrupamento por Data de Validade
    const dateMap = new Map<string, { total: number; byLinha: Record<string, number> }>()
    const presentLinhas = new Set<string>()

    baseItems.forEach(item => {
      const d = item.dataValidade || 'Sem Data'
      const l = item.linha || 'Outros'
      presentLinhas.add(l)

      if (!dateMap.has(d)) {
        dateMap.set(d, { total: 0, byLinha: {} })
      }
      const entry = dateMap.get(d)!
      entry.total += 1
      entry.byLinha[l] = (entry.byLinha[l] || 0) + 1
    })

    // Ordenar datas cronologicamente (dd/mm/aaaa)
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      if (a === 'Sem Data') return 1
      if (b === 'Sem Data') return -1
      const partsA = a.split('/').map(Number)
      const partsB = b.split('/').map(Number)
      if (partsA.length === 3 && partsB.length === 3) {
        const timeA = new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime()
        const timeB = new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime()
        return timeA - timeB
      }
      return a.localeCompare(b)
    })

    let maxTotal = 1
    sortedDates.forEach(d => {
      const t = dateMap.get(d)!.total
      if (t > maxTotal) maxTotal = t
    })

    const chartDates = sortedDates.map(d => {
      const data = dateMap.get(d)!
      return {
        date: d,
        total: data.total,
        byLinha: data.byLinha
      }
    })

    return {
      dates: chartDates,
      maxTotal,
      linhas: Array.from(presentLinhas).sort()
    }
  }, [items, search, selectedLinhas, selectedFamilias, selectedCampanhas])

  // Data de pico com mais concentração de ofertas
  const peakDate = useMemo(() => {
    if (!chartData.dates || chartData.dates.length === 0) return null
    return chartData.dates.reduce((prev, current) => (current.total > prev.total ? current : prev), chartData.dates[0])
  }, [chartData])

  // Exportar CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return
    const headers = ['IBM', 'GEMCO', 'DESCRIÇÃO', 'FAMÍLIA', 'LINHA', 'CAMPANHA', 'DATA INÍCIO', 'DATA VALIDADE', 'REGIÃO']
    const csvRows = [headers.join(';')]

    filteredItems.forEach(i => {
      csvRows.push([
        `"${i.ibm}"`,
        `"${i.gemco}"`,
        `"${i.descricao.replace(/"/g, '""')}"`,
        `"${i.familia.replace(/"/g, '""')}"`,
        `"${i.linha.replace(/"/g, '""')}"`,
        `"${i.campanha.replace(/"/g, '""')}"`,
        `"${i.dataInicio}"`,
        `"${i.dataValidade}"`,
        `"${i.regiao}"`
      ].join(';'))
    })

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `promocionais_cd994_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Banner Superior & Controles de Conexão com Google Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={24} className="text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">
                Itens Promocionais • Aba NE/NO/CO
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Planilha Conectada
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 font-mono">
                  (Atualizado: {lastUpdated})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta dinâmica direta da planilha oficial de itens promocionais, campanhas e prazos de validade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Recarregar dados da planilha Google"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs"
            title="Abrir planilha no Google Sheets"
          >
            <ExternalLink size={14} />
            <span>Abrir Planilha</span>
          </a>

          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Exportar dados filtrados em CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Itens</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {loading ? '...' : items.length.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">SKUs Promocionais cadastrados</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Tag size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campanhas Ativas</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {loading ? '...' : campanhasOptions.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Segmentadas na aba NE/NO/CO</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Linhas de Produto</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {loading ? '...' : linhasOptions.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Departamentos envolvidos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itens Filtrados</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : filteredItems.length.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Visíveis na tabela abaixo</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Filter size={20} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          GRÁFICO: DATAS x LINHA (CONCENTRAÇÃO DE OFERTAS)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Concentração de Ofertas por Data x Linha
                </h3>
                {selectedDateFilter && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 flex items-center gap-1 border border-blue-200">
                    Filtro Data: {selectedDateFilter}
                    <button onClick={() => setSelectedDateFilter(null)} className="hover:text-blue-900 cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Distribuição das campanhas pelas datas de validade com segmentação visual por linha de produto.
              </p>
            </div>
          </div>

          {peakDate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shrink-0">
              <Flame size={15} className="text-amber-600 animate-bounce" />
              <span>
                Pico de Ofertas: <strong>{peakDate.date}</strong> ({peakDate.total} ofertas)
              </span>
            </div>
          )}
        </div>

        {/* Visualizador de Barras Segmentadas */}
        {chartData.dates.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Nenhuma data para exibir com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 gap-2.5">
              {chartData.dates.map((dItem) => {
                const isSelected = selectedDateFilter === dItem.date
                const isPeak = peakDate?.date === dItem.date
                const percentOfMax = (dItem.total / chartData.maxTotal) * 100

                // Linhas presentes nesta data
                const linhasInDate = Object.entries(dItem.byLinha).sort((a, b) => b[1] - a[1])

                return (
                  <div 
                    key={dItem.date}
                    onClick={() => {
                      setSelectedDateFilter(isSelected ? null : dItem.date)
                    }}
                    title={`Clique para ${isSelected ? 'remover filtro' : 'filtrar tabela'} por ${dItem.date}`}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-400/20'
                        : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200/80'
                    }`}
                  >
                    {/* Identificador da Data */}
                    <div className="w-36 shrink-0 flex items-center justify-between md:justify-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className={isPeak ? 'text-amber-600' : 'text-slate-400'} />
                        <span className={`text-xs font-mono font-bold ${isPeak ? 'text-amber-800' : 'text-slate-800'}`}>
                          {dItem.date}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isPeak 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {dItem.total}
                      </span>
                    </div>

                    {/* Barra Segmentada Colorida por Linha */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="w-full bg-slate-200/80 rounded-full h-4 overflow-hidden flex shadow-inner">
                        {linhasInDate.map(([linhaName, count]) => {
                          const widthPct = (count / dItem.total) * 100
                          const color = LINHA_COLORS[linhaName] || DEFAULT_COLOR
                          return (
                            <div
                              key={linhaName}
                              style={{ width: `${widthPct}%` }}
                              title={`${linhaName}: ${count} itens (${widthPct.toFixed(1)}%)`}
                              className={`${color.bg} h-full transition-all duration-300 hover:brightness-110 flex items-center justify-center text-[9px] text-white font-bold overflow-hidden px-1`}
                            >
                              {widthPct > 12 && `${count}`}
                            </div>
                          )
                        })}
                      </div>

                      {/* Mini Tags das Linhas nesta data */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {linhasInDate.map(([linhaName, count]) => {
                          const color = LINHA_COLORS[linhaName] || DEFAULT_COLOR
                          return (
                            <span 
                              key={linhaName}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 shadow-2xs"
                            >
                              <span className={`w-2 h-2 rounded-full ${color.bg}`}></span>
                              <span className="font-medium truncate max-w-[130px]">{linhaName.split(' - ')[0]}</span>
                              <strong className="text-slate-800 font-mono">({count})</strong>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Percentual / Proporção Total */}
                    <div className="w-20 text-right shrink-0 hidden md:block">
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {((dItem.total / items.length) * 100).toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-slate-400">do total</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda Geral das Linhas Presentes */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                <Info size={13} className="text-indigo-600" /> Legenda:
              </span>
              {chartData.linhas.map((linhaName) => {
                const color = LINHA_COLORS[linhaName] || DEFAULT_COLOR
                const isSelected = selectedLinhas.includes(linhaName)
                return (
                  <button
                    key={linhaName}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedLinhas(selectedLinhas.filter(l => l !== linhaName))
                      } else {
                        setSelectedLinhas([...selectedLinhas, linhaName])
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10.5px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-100 border-blue-400 font-bold text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`}></span>
                    <span>{linhaName}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BARRA DE FILTROS COM MÚLTIPLA SELEÇÃO
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Campo Busca */}
          <div className="lg:col-span-2 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição, IBM, GEMCO, linha, família ou campanha..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filtro Multi-Seleção: Linhas de Produto */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'linhas' ? null : 'linhas')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
                selectedLinhas.length > 0
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Layers size={14} className={selectedLinhas.length > 0 ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="truncate">
                  {selectedLinhas.length === 0
                    ? `Todas as Linhas (${linhasOptions.length})`
                    : selectedLinhas.length === 1
                    ? selectedLinhas[0]
                    : `${selectedLinhas.length} Linhas selecionadas`}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'linhas' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'linhas' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Filtrar por Linha</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLinhas([...linhasOptions])}
                        className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        Todas
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedLinhas([])}
                        className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                    {linhasOptions.map((linha) => {
                      const isChecked = selectedLinhas.includes(linha)
                      const color = LINHA_COLORS[linha] || DEFAULT_COLOR
                      return (
                        <label
                          key={linha}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedLinhas(selectedLinhas.filter(l => l !== linha))
                              } else {
                                setSelectedLinhas([...selectedLinhas, linha])
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`w-2 h-2 rounded-full shrink-0 ${color.bg}`}></span>
                          <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                            {linha}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filtro Multi-Seleção: Campanhas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'campanhas' ? null : 'campanhas')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
                selectedCampanhas.length > 0
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles size={14} className={selectedCampanhas.length > 0 ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="truncate">
                  {selectedCampanhas.length === 0
                    ? `Todas as Campanhas (${campanhasOptions.length})`
                    : selectedCampanhas.length === 1
                    ? selectedCampanhas[0].replace(/[\r\n]+/g, ' ')
                    : `${selectedCampanhas.length} Campanhas`}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'campanhas' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'campanhas' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Filtrar Campanhas</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCampanhas([...campanhasOptions])}
                        className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        Todas
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCampanhas([])}
                        className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                    {campanhasOptions.map((campanha) => {
                      const isChecked = selectedCampanhas.includes(campanha)
                      return (
                        <label
                          key={campanha}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedCampanhas(selectedCampanhas.filter(c => c !== campanha))
                              } else {
                                setSelectedCampanhas([...selectedCampanhas, campanha])
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                            {campanha.replace(/[\r\n]+/g, ' ')}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filtro Multi-Seleção: Famílias */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'familias' ? null : 'familias')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
                selectedFamilias.length > 0
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-400 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Tag size={14} className={selectedFamilias.length > 0 ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="truncate">
                  {selectedFamilias.length === 0
                    ? `Todas as Famílias (${familiasOptions.length})`
                    : selectedFamilias.length === 1
                    ? selectedFamilias[0]
                    : `${selectedFamilias.length} Famílias`}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'familias' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'familias' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Filtrar por Família</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFamilias([...familiasOptions])}
                        className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        Todas
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFamilias([])}
                        className="text-[10px] text-slate-500 hover:underline font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                    {familiasOptions.map((familia) => {
                      const isChecked = selectedFamilias.includes(familia)
                      return (
                        <label
                          key={familia}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedFamilias(selectedFamilias.filter(f => f !== familia))
                              } else {
                                setSelectedFamilias([...selectedFamilias, familia])
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className={`truncate text-[11px] ${isChecked ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                            {familia}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumo de Filtros e Botão de Limpar */}
        {(search || selectedLinhas.length > 0 || selectedFamilias.length > 0 || selectedCampanhas.length > 0 || selectedDateFilter) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500">
                Filtros ativos: exibindo <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> registros
              </span>
              {selectedLinhas.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  {selectedLinhas.length} Linhas
                </span>
              )}
              {selectedCampanhas.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  {selectedCampanhas.length} Campanhas
                </span>
              )}
              {selectedFamilias.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  {selectedFamilias.length} Famílias
                </span>
              )}
              {selectedDateFilter && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  Data: {selectedDateFilter}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setSearch('')
                setSelectedLinhas([])
                setSelectedFamilias([])
                setSelectedCampanhas([])
                setSelectedDateFilter(null)
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Alerta de erro se houver */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Tabela de Itens Promocionais */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-3 font-mono">IBM</th>
                <th className="px-3 py-3 font-mono">GEMCO</th>
                <th className="px-4 py-3">Descrição do Produto</th>
                <th className="px-3.5 py-3">Família</th>
                <th className="px-3.5 py-3">Linha</th>
                <th className="px-3.5 py-3">Campanha</th>
                <th className="px-3 py-3 text-center">Data Início</th>
                <th className="px-3 py-3 text-center">Data Validade</th>
                <th className="px-3 py-3 text-center">Região</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Carregando itens promocionais da planilha...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet size={32} className="text-slate-300" />
                      <span className="text-xs font-semibold">Nenhum item promocional encontrado com os filtros selecionados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const color = LINHA_COLORS[item.linha] || DEFAULT_COLOR
                  return (
                    <tr 
                      key={`${item.ibm}-${idx}`}
                      className="hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                        {item.ibm}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {item.gemco}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 max-w-xs truncate" title={item.descricao}>
                        {item.descricao}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {item.familia || '-'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.bg}`}></span>
                          {item.linha || '-'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800 text-[11px] max-w-xs truncate" title={item.campanha}>
                        <span className="font-semibold text-indigo-900">
                          {item.campanha ? item.campanha.replace(/[\r\n]+/g, ' ') : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {item.dataInicio || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10.5px] font-bold">
                          {item.dataValidade || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {item.regiao || 'BR'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Aba <strong>NE/NO/CO</strong> sincronizada diretamente com a base Promocionais.</span>
          </div>
          <div>
            Mostrando <strong className="text-slate-800">{filteredItems.length}</strong> de <strong className="text-slate-800">{items.length}</strong> itens
          </div>
        </div>
      </div>
    </div>
  )
}
