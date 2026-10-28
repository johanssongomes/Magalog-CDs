import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Table, 
  Download, 
  Filter, 
  Search, 
  Boxes, 
  Package, 
  Layers, 
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  CalendarDays,
  RotateCcw,
  X,
  Sparkles,
  InboxIcon,
  Upload,
  UploadCloud,
  Edit2,
  Check,
  TrendingUp,
  Percent,
  Activity,
  Zap,
  Save
} from 'lucide-react'
import { getPmtDailyMatrixFromSupabase } from '../lib/pmtService'
import { 
  getAderenciaData, 
  saveAderenciaData, 
  parseAderenciaExcel, 
  type AderenciaDataState, 
  type AderenciaMetricData 
} from '../lib/aderenciaService'
import initialAderenciaOct from '../data/initialAderencia202610.json'

interface DayItem {
  day: number
  dayStr: string
  weekdayLetter: string
}

interface MatrixData {
  ano: number
  mes: number
  cd: string
  groupBy?: 'modal' | 'categoria_produtividade'
  days: DayItem[]
  modals: string[]
  data: {
    pedidos: Record<string, Record<string, number> & { total: number }>
    pecas: Record<string, Record<string, number> & { total: number }>
    cubagem: Record<string, Record<string, number> & { total: number }>
  }
  totals: {
    pedidos: Record<string, number> & { total: number }
    pecas: Record<string, number> & { total: number }
    cubagem: Record<string, number> & { total: number }
  }
}

interface Props {
  ano: number
  mes: number
  cd?: string
  pageTitle?: string
}

type SectionView = 'all' | 'pedidos' | 'pecas' | 'cubagem'
type GroupByView = 'modal' | 'categoria_produtividade'

export const PmtDailyMatrixTable: React.FC<Props> = ({ ano, mes, cd = '994', pageTitle = 'PMT Expedição' }) => {
  const [matrix, setMatrix] = useState<MatrixData | null>(null)
  const [selectedSection, setSelectedSection] = useState<SectionView>('all')
  const [groupBy, setGroupBy] = useState<GroupByView>('modal')
  const [searchModal, setSearchModal] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getEmptyAderenciaState = (a: number, m: number, c: string): AderenciaDataState => ({
    ano: a,
    mes: m,
    cd: c,
    liberado: { totals: { pedidos: {}, pecas: {}, cubagem: {} }, byModal: { pedidos: {}, pecas: {}, cubagem: {} }, byCategoria: { pedidos: {}, pecas: {}, cubagem: {} } },
    faturado: { totals: { pedidos: {}, pecas: {}, cubagem: {} }, byModal: { pedidos: {}, pecas: {}, cubagem: {} }, byCategoria: { pedidos: {}, pecas: {}, cubagem: {} } },
    capacidade: { pedidos: {}, pecas: {}, cubagem: {} }
  })

  // Estado dos Dados de Aderência (Liberado, Faturado e Capacidade)
  const [aderencia, setAderencia] = useState<AderenciaDataState>(() => {
    if (ano === 2026 && mes === 10) {
      return initialAderenciaOct as unknown as AderenciaDataState
    }
    return getEmptyAderenciaState(ano, mes, cd)
  })

  // Modal para importação de planilhas de Aderência
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  // Edição rápida de Capacidade em célula
  const [editingCapacityCell, setEditingCapacityCell] = useState<{ metric: 'pedidos' | 'pecas' | 'cubagem'; dayStr: string } | null>(null)
  const [capacityInputVal, setCapacityInputVal] = useState('')

  // Filtros de Calendário (Mês Todo, Dias Úteis, Quinzenas, Dias Específicos e Faixa de Datas)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startDateFilter, setStartDateFilter] = useState<string>('')
  const [endDateFilter, setEndDateFilter] = useState<string>('')

  // Reseta filtros de calendário ao trocar de mês ou ano
  useEffect(() => {
    setSelectedDays([])
    setStartDateFilter('')
    setEndDateFilter('')
    setIsDateDropdownOpen(false)
  }, [ano, mes])

  const toggleDayFilter = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(selectedDays.filter(d => d !== dayNum))
    } else {
      setSelectedDays([...selectedDays, dayNum])
    }
  }

  // Carrega dados dinâmicos do Supabase (PMT Matriz)
  useEffect(() => {
    let isMounted = true
    setMatrix(null)
    const fetchMatrix = async () => {
      setIsLoading(true)
      try {
        const cloudData = await getPmtDailyMatrixFromSupabase(ano, mes, cd, groupBy)
        if (cloudData && cloudData.days && cloudData.days.length > 0 && isMounted) {
          setMatrix(cloudData)
          return
        }

        const res = await fetch(`http://localhost:3001/api/pmt/daily-matrix?ano=${ano}&mes=${mes}&cd=${cd}&groupBy=${groupBy}`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted) {
            if (json && json.days && json.days.length > 0) {
              setMatrix(json)
            } else {
              setMatrix(null)
            }
          }
        }
      } catch {
        if (isMounted) setMatrix(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchMatrix()
    return () => { isMounted = false }
  }, [ano, mes, cd, groupBy])

  // Carregar dados de Aderência do Supabase ou Cache para o mês específico
  useEffect(() => {
    let isMounted = true
    
    // Limpa imediatamente o estado para o novo mês para evitar exibir dados do mês anterior
    if (ano === 2026 && mes === 10) {
      setAderencia(initialAderenciaOct as unknown as AderenciaDataState)
    } else {
      setAderencia(getEmptyAderenciaState(ano, mes, cd))
    }

    const loadAderencia = async () => {
      const dbData = await getAderenciaData(ano, mes, cd)
      if (isMounted) {
        if (dbData) {
          setAderencia(dbData)
        } else if (ano === 2026 && mes === 10) {
          setAderencia(initialAderenciaOct as unknown as AderenciaDataState)
        } else {
          setAderencia(getEmptyAderenciaState(ano, mes, cd))
        }
      }
    }
    loadAderencia()
    return () => { isMounted = false }
  }, [ano, mes, cd])

  // Função para remover a numeração inicial dos nomes dos modais
  const cleanModalName = (name: string) => {
    return name.replace(/^\d+\.\s*/, '').trim()
  }

  // Lista de modais filtrada por busca
  const filteredModals = useMemo(() => {
    if (!matrix) return []
    if (!searchModal.trim()) return matrix.modals
    const term = searchModal.toLowerCase()
    return matrix.modals.filter(m => 
      m.toLowerCase().includes(term) || cleanModalName(m).toLowerCase().includes(term)
    )
  }, [matrix, searchModal])

  // Dias ativos filtrados pelo Calendário
  const activeFilteredDays = useMemo(() => {
    if (!matrix || !matrix.days) return []
    if (selectedDays.length === 0 && !startDateFilter && !endDateFilter) {
      return matrix.days
    }

    let startDay = 1
    let endDay = matrix.days.length

    if (startDateFilter) {
      const p = startDateFilter.split('-')
      if (p.length === 3 && parseInt(p[0]) === ano && parseInt(p[1]) === mes) {
        startDay = parseInt(p[2])
      }
    }

    if (endDateFilter) {
      const p = endDateFilter.split('-')
      if (p.length === 3 && parseInt(p[0]) === ano && parseInt(p[1]) === mes) {
        endDay = parseInt(p[2])
      }
    }

    return matrix.days.filter(d => {
      if (selectedDays.length > 0 && !selectedDays.includes(d.day)) {
        return false
      }
      if (d.day < startDay || d.day > endDay) {
        return false
      }
      return true
    })
  }, [matrix, selectedDays, startDateFilter, endDateFilter, ano, mes])

  // Total acumulado dinâmico
  const getRowTotal = (rowData: Record<string, number> | undefined) => {
    if (!rowData) return 0
    return activeFilteredDays.reduce((acc, d) => acc + (rowData[d.dayStr] || 0), 0)
  }

  // Formatação de números padrão brasileiro
  const formatNum = (val: number | undefined | null) => {
    if (val === undefined || val === null || val === 0) return '0'
    return Math.round(val).toLocaleString('pt-BR')
  }

  // Formatação de percentual
  const formatPercent = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val) || val === 0) return '0.0%'
    return `${val.toFixed(1)}%`
  }

  // Salvar alteração de capacidade
  const handleSaveCapacity = async (metric: 'pedidos' | 'pecas' | 'cubagem', dayStr: string, value: number) => {
    const updated: AderenciaDataState = {
      ...aderencia,
      capacidade: {
        ...aderencia.capacidade,
        [metric]: {
          ...aderencia.capacidade[metric],
          [dayStr]: value
        }
      }
    }
    setAderencia(updated)
    await saveAderenciaData(updated)
    setEditingCapacityCell(null)
  }

  // Upload e processamento de planilhas de Aderência
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'liberado' | 'faturado') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingFile(true)
    setUploadFeedback(null)

    try {
      const buffer = await file.arrayBuffer()
      const dateCol = type === 'liberado' ? 'Data Liberação' : 'Data Faturamento'
      // Identifica automaticamente mês e ano por linha da planilha
      const monthsMap = parseAderenciaExcel(buffer, dateCol, ano, mes, cd)
      const foundMonths = Object.keys(monthsMap)

      if (foundMonths.length === 0) {
        throw new Error('Nenhuma data ou linha válida encontrada na planilha importada.')
      }

      let activeMonthUpdated = false

      // Salva cada mês isoladamente na sua respectiva competência
      for (const mKey of foundMonths) {
        const parsedItem = monthsMap[mKey]
        const mYear = parsedItem.ano
        const mMonth = parsedItem.mes

        // Recupera dados já existentes do mês de destino (se houver) para manter capacidade e a outra métrica
        const existingData = await getAderenciaData(mYear, mMonth, cd)
        const baseForMonth: AderenciaDataState = existingData || getEmptyAderenciaState(mYear, mMonth, cd)

        const updatedMonthState: AderenciaDataState = {
          ...baseForMonth,
          ano: mYear,
          mes: mMonth,
          cd,
          [type]: {
            totals: parsedItem.totals,
            byModal: parsedItem.byModal,
            byCategoria: parsedItem.byCategoria
          },
          updatedAt: new Date().toISOString()
        }

        await saveAderenciaData(updatedMonthState)

        // Se o mês importado for o mês atualmente selecionado na tela, atualiza o state imediatamente
        if (mYear === ano && mMonth === mes) {
          setAderencia(updatedMonthState)
          activeMonthUpdated = true
        }
      }

      const monthsLabel = foundMonths.map(k => {
        const [y, m] = k.split('-')
        return `${m}/${y}`
      }).join(', ')

      setUploadFeedback({
        text: `Planilha de ${type === 'liberado' ? 'Liberação' : 'Faturamento'} importada com sucesso para o(s) mês(es): ${monthsLabel}!`,
        type: 'success'
      })
    } catch (err: any) {
      console.error(err)
      setUploadFeedback({
        text: `Erro ao processar arquivo: ${err.message || 'Formato inválido'}`,
        type: 'error'
      })
    } finally {
      setIsProcessingFile(false)
      e.target.value = ''
    }
  }

  // Exportar para CSV
  const handleExportCSV = () => {
    const colName = groupBy === 'categoria_produtividade' ? 'Categoria de Produtividade' : 'Modal'
    const headers = ['Indicador', colName, ...matrix.days.map(d => `${d.dayStr} (${d.weekdayLetter})`), 'Total Geral']
    const csvRows: string[] = [headers.join(';')]

    const addSectionRows = (sectionName: string, sectionData: Record<string, Record<string, number> & { total: number }>, sectionTotal: Record<string, number> & { total: number }) => {
      matrix.modals.forEach(m => {
        const row = [
          sectionName,
          `"${cleanModalName(m)}"`,
          ...matrix.days.map(d => sectionData[m]?.[d.dayStr] || 0),
          sectionData[m]?.total || 0
        ]
        csvRows.push(row.join(';'))
      })
      const totalRow = [
        sectionName,
        `"TOTAL ${sectionName.toUpperCase()} TT"`,
        ...matrix.days.map(d => sectionTotal[d.dayStr] || 0),
        sectionTotal.total || 0
      ]
      csvRows.push(totalRow.join(';'))
    }

    addSectionRows('Pedidos', matrix.data.pedidos, matrix.totals.pedidos)
    addSectionRows('Peças', matrix.data.pecas, matrix.totals.pecas)
    addSectionRows('Cubagem', matrix.data.cubagem, matrix.totals.cubagem)

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PMT_${cd}_${mes}_${ano}_${groupBy}_indicadores.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Renderizar o Bloco de Linhas de Aderência para uma Métrica (Pedidos, Peças ou Cubagem)
  const renderAderenciaRows = (metricKey: 'pedidos' | 'pecas' | 'cubagem', titleLabel: string) => {
    // 1. Dados Planejados (PMT Totais)
    const pmtTotals = matrix.totals[metricKey] || {}
    const pmtTotalSum = getRowTotal(pmtTotals)

    // 2. Dados Liberados (Total Geral)
    const libTotals = aderencia.liberado?.totals?.[metricKey] || {}
    const libTotalSum = getRowTotal(libTotals)

    // 3. Dados Faturados (Total Geral)
    const fatTotals = aderencia.faturado?.totals?.[metricKey] || {}
    const fatTotalSum = getRowTotal(fatTotals)

    // 4. Capacidade Definida
    const capTotals = aderencia.capacidade?.[metricKey] || {}
    const capTotalSum = getRowTotal(capTotals)

    return (
      <>
        {/* LINHA 1: LIBERADO */}
        <tr className="bg-emerald-50/70 border-b border-emerald-200/80 hover:bg-emerald-50 transition-colors">
          <td className="sticky left-0 z-20 bg-emerald-50 px-3 py-2 font-bold text-emerald-900 border-r border-emerald-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Liberado ({titleLabel})
            </span>
          </td>
          {activeFilteredDays.map((d) => {
            const val = libTotals[d.dayStr] || 0
            return (
              <td 
                key={`lib-${metricKey}-${d.dayStr}`}
                className="px-1.5 py-2 text-center font-mono font-bold text-emerald-900 border-r border-emerald-200/80 text-[11px]"
              >
                {formatNum(val)}
              </td>
            )
          })}
          <td className="sticky right-0 z-20 bg-emerald-50 px-3 py-2 text-right font-mono font-bold text-emerald-900 border-l border-emerald-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
            {formatNum(libTotalSum)}
          </td>
        </tr>

        {/* LINHA 2: ADERÊNCIA LIBERAÇÃO (% Liberado / Planejado PMT) */}
        <tr className="bg-emerald-100/40 border-b-2 border-emerald-300 hover:bg-emerald-100/60 transition-colors">
          <td className="sticky left-0 z-20 bg-emerald-100/80 px-3 py-1.5 font-bold text-emerald-800 border-r border-emerald-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] pl-6 text-[10.5px]">
            % Aderência Liberação
          </td>
          {activeFilteredDays.map((d) => {
            const pmtVal = pmtTotals[d.dayStr] || 0
            const libVal = libTotals[d.dayStr] || 0
            const perc = pmtVal > 0 ? (libVal / pmtVal) * 100 : 0
            const isGood = perc >= 90
            return (
              <td 
                key={`ader-lib-${metricKey}-${d.dayStr}`}
                className={`px-1.5 py-1.5 text-center font-mono font-bold text-[10.5px] border-r border-emerald-200 ${
                  pmtVal === 0 ? 'text-slate-400' : isGood ? 'text-emerald-700 font-extrabold' : 'text-amber-700'
                }`}
              >
                {pmtVal > 0 ? formatPercent(perc) : '-'}
              </td>
            )
          })}
          <td className="sticky right-0 z-20 bg-emerald-100/80 px-3 py-1.5 text-right font-mono font-extrabold text-emerald-900 border-l border-emerald-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
            {pmtTotalSum > 0 ? formatPercent((libTotalSum / pmtTotalSum) * 100) : '0.0%'}
          </td>
        </tr>

        {/* LINHA 3: FATURADO */}
        <tr className="bg-amber-50/70 border-b border-amber-200/80 hover:bg-amber-50 transition-colors">
          <td className="sticky left-0 z-20 bg-amber-50 px-3 py-2 font-bold text-amber-900 border-r border-amber-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Faturado ({titleLabel})
            </span>
          </td>
          {activeFilteredDays.map((d) => {
            const val = fatTotals[d.dayStr] || 0
            return (
              <td 
                key={`fat-${metricKey}-${d.dayStr}`}
                className="px-1.5 py-2 text-center font-mono font-bold text-amber-900 border-r border-amber-200/80 text-[11px]"
              >
                {formatNum(val)}
              </td>
            )
          })}
          <td className="sticky right-0 z-20 bg-amber-50 px-3 py-2 text-right font-mono font-bold text-amber-900 border-l border-amber-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
            {formatNum(fatTotalSum)}
          </td>
        </tr>

        {/* LINHA 4: CAPACIDADE (Editável dia a dia) */}
        <tr className="bg-indigo-50/70 border-b border-indigo-200/80 hover:bg-indigo-50 transition-colors">
          <td className="sticky left-0 z-20 bg-indigo-50 px-3 py-2 font-bold text-indigo-900 border-r border-indigo-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Capacidade ({titleLabel})
            </span>
            <span className="text-[9px] text-indigo-500 font-normal ml-1">(clique p/ editar)</span>
          </td>
          {activeFilteredDays.map((d) => {
            const isEditing = editingCapacityCell?.metric === metricKey && editingCapacityCell?.dayStr === d.dayStr
            const val = capTotals[d.dayStr] || 0
            return (
              <td 
                key={`cap-${metricKey}-${d.dayStr}`}
                onClick={() => {
                  setEditingCapacityCell({ metric: metricKey, dayStr: d.dayStr })
                  setCapacityInputVal(val ? String(val) : '')
                }}
                className="px-1 py-1.5 text-center font-mono font-bold text-indigo-900 border-r border-indigo-200/80 text-[11px] cursor-pointer hover:bg-indigo-100/60 transition-colors"
                title="Clique para editar a capacidade deste dia"
              >
                {isEditing ? (
                  <input
                    type="number"
                    autoFocus
                    value={capacityInputVal}
                    onChange={(e) => setCapacityInputVal(e.target.value)}
                    onBlur={() => {
                      const num = parseFloat(capacityInputVal) || 0
                      handleSaveCapacity(metricKey, d.dayStr, num)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseFloat(capacityInputVal) || 0
                        handleSaveCapacity(metricKey, d.dayStr, num)
                      }
                      if (e.key === 'Escape') setEditingCapacityCell(null)
                    }}
                    className="w-full text-center bg-white border border-indigo-400 rounded px-1 py-0.5 text-[11px] font-mono focus:outline-none"
                  />
                ) : (
                  <span>{formatNum(val)}</span>
                )}
              </td>
            )
          })}
          <td className="sticky right-0 z-20 bg-indigo-50 px-3 py-2 text-right font-mono font-bold text-indigo-900 border-l border-indigo-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
            {formatNum(capTotalSum)}
          </td>
        </tr>

        {/* LINHA 5: ADERÊNCIA FATURADO X CAPACIDADE (% Faturado / Capacidade) */}
        <tr className="bg-indigo-100/40 border-b-2 border-indigo-300 hover:bg-indigo-100/60 transition-colors">
          <td className="sticky left-0 z-20 bg-indigo-100/80 px-3 py-1.5 font-bold text-indigo-900 border-r border-indigo-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] pl-6 text-[10.5px]">
            % Aderência Fat. x Capacidade
          </td>
          {activeFilteredDays.map((d) => {
            const capVal = capTotals[d.dayStr] || 0
            const fatVal = fatTotals[d.dayStr] || 0
            const perc = capVal > 0 ? (fatVal / capVal) * 100 : 0
            const isGood = perc >= 90
            return (
              <td 
                key={`ader-fat-${metricKey}-${d.dayStr}`}
                className={`px-1.5 py-1.5 text-center font-mono font-bold text-[10.5px] border-r border-indigo-200 ${
                  capVal === 0 ? 'text-slate-400' : isGood ? 'text-indigo-800 font-extrabold' : 'text-rose-700'
                }`}
              >
                {capVal > 0 ? formatPercent(perc) : '-'}
              </td>
            )
          })}
          <td className="sticky right-0 z-20 bg-indigo-100/80 px-3 py-1.5 text-right font-mono font-extrabold text-indigo-900 border-l border-indigo-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
            {capTotalSum > 0 ? formatPercent((fatTotalSum / capTotalSum) * 100) : '0.0%'}
          </td>
        </tr>
      </>
    )
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Carregando dados de {mes.toString().padStart(2,'0')}/{ano}…</p>
      </div>
    )
  }

  // Sem dados para o período selecionado
  if (!matrix) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
          <InboxIcon size={32} className="text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-600">Sem dados para este período</p>
          <p className="text-sm text-slate-400 mt-1">Nenhum registro encontrado para CD {cd} — {mes.toString().padStart(2,'0')}/{ano}.</p>
          <p className="text-xs text-slate-300 mt-1">Importe a planilha PMT deste mês para visualizar os indicadores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* =========================================================================
          BARRA DE CONTROLES E FILTROS SUPERIORES
          ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
        {/* Título e Subtítulo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Table size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Indicador PMT Diário
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">CD {cd} • {mes.toString().padStart(2, '0')}/{ano}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Base Consolidada & Aderência
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Acompanhamento Diário por {groupBy === 'categoria_produtividade' ? 'Categoria de Produtividade' : 'Modal'} (Pedidos, Peças e Cubagem)
            </h2>
          </div>
        </div>

        {/* Ações e Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Importar Planilhas de Aderência (Liberado / Faturado) */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Importar planilhas de Liberação e Faturamento"
          >
            <UploadCloud size={14} />
            <span>Atualizar Liberação / Faturamento</span>
          </button>

          {/* Alternância: Por Modal vs Por Categoria de Produtividade */}
          <div className="inline-flex p-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
            <button
              onClick={() => setGroupBy('modal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                groupBy === 'modal'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'hover:bg-amber-100 text-amber-800'
              }`}
            >
              Por Modal
            </button>
            <button
              onClick={() => setGroupBy('categoria_produtividade')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                groupBy === 'categoria_produtividade'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'hover:bg-amber-100 text-amber-800'
              }`}
            >
              Por Categoria Produtividade
            </button>
          </div>

          {/* Tabs para alternar entre Todos / Pedidos / Peças / Cubagem */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSection('pedidos')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'pedidos'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Pedidos TT
            </button>
            <button
              onClick={() => setSelectedSection('pecas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'pecas'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Peças TT
            </button>
            <button
              onClick={() => setSelectedSection('cubagem')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'cubagem'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Cubagem TT
            </button>
          </div>

          {/* Busca de Modal ou Categoria */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchModal}
              onChange={(e) => setSearchModal(e.target.value)}
              placeholder={groupBy === 'categoria_produtividade' ? 'Buscar categoria...' : 'Buscar modal...'}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCSV}
            title="Exportar dados para planilha CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TABELA MATRIZ COM LINHAS DE ADERÊNCIA INTEGRADA
          ========================================================================= */}
      <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className={`${activeFilteredDays.length < 15 ? 'w-auto' : 'w-full'} text-left border-collapse text-[11px] font-sans`}>
            {/* Cabeçalho da Tabela */}
            <thead className="sticky top-0 z-30 bg-[#e0f2fe] border-b border-sky-300">
              <tr>
                <th 
                  scope="col"
                  className="sticky left-0 z-40 bg-[#e0f2fe] px-3 py-2 font-bold text-slate-800 border-r border-sky-200 min-w-[210px] w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Data / Indicador</span>
                  </div>
                </th>

                {activeFilteredDays.map((d) => {
                  const dt = new Date(ano, mes - 1, d.day)
                  const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
                  return (
                    <th
                      key={d.dayStr}
                      scope="col"
                      className={`px-2 py-1 text-center font-normal min-w-[48px] w-[54px] border-r border-sky-200/80 ${
                        isWeekend ? 'bg-sky-200/50' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="italic text-[10px] text-slate-600 font-semibold">{d.weekdayLetter}</span>
                        <span className="font-bold text-[11px] text-slate-900 mt-0.5">{d.day}</span>
                      </div>
                    </th>
                  )
                })}

                <th 
                  scope="col"
                  className="sticky right-0 z-40 bg-[#e0f2fe] px-3 py-2 text-right font-bold text-slate-900 min-w-[90px] border-l border-sky-300 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]"
                >
                  Total Geral
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* ===============================================================
                  BLOCO 1: PEDIDOS TT
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'pedidos') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.pedidos[modalName] || { total: 0 }
                    const dynamicTotal = getRowTotal(rowData)
                    return (
                      <tr key={`ped-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>
                        {activeFilteredDays.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`ped-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(dynamicTotal)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Pedidos TT (Planejado PMT) */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Pedidos TT (PMT Planejado)
                    </td>
                    {activeFilteredDays.map((d) => (
                      <td 
                        key={`ped-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.pedidos[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(getRowTotal(matrix.totals.pedidos))}
                    </td>
                  </tr>

                  {/* LINHAS DE ADERÊNCIA: LIBERADO, % ADERÊNCIA, FATURADO, CAPACIDADE, % FAT X CAP */}
                  {renderAderenciaRows('pedidos', 'Pedidos')}

                  {/* Espaçador visual se 'all' estiver ativo */}
                  {selectedSection === 'all' && (
                    <tr className="bg-slate-100/50 h-3">
                      <td colSpan={activeFilteredDays.length + 2} className="p-0 border-y border-slate-200"></td>
                    </tr>
                  )}
                </>
              )}

              {/* ===============================================================
                  BLOCO 2: PEÇAS TT
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'pecas') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.pecas[modalName] || { total: 0 }
                    const dynamicTotal = getRowTotal(rowData)
                    return (
                      <tr key={`pec-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>
                        {activeFilteredDays.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`pec-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(dynamicTotal)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Peças TT (Planejado PMT) */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Peças TT (PMT Planejado)
                    </td>
                    {activeFilteredDays.map((d) => (
                      <td 
                        key={`pec-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.pecas[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(getRowTotal(matrix.totals.pecas))}
                    </td>
                  </tr>

                  {/* LINHAS DE ADERÊNCIA: LIBERADO, % ADERÊNCIA, FATURADO, CAPACIDADE, % FAT X CAP */}
                  {renderAderenciaRows('pecas', 'Peças')}

                  {/* Espaçador visual se 'all' estiver ativo */}
                  {selectedSection === 'all' && (
                    <tr className="bg-slate-100/50 h-3">
                      <td colSpan={activeFilteredDays.length + 2} className="p-0 border-y border-slate-200"></td>
                    </tr>
                  )}
                </>
              )}

              {/* ===============================================================
                  BLOCO 3: CUBAGEM TT
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'cubagem') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.cubagem[modalName] || { total: 0 }
                    const dynamicTotal = getRowTotal(rowData)
                    return (
                      <tr key={`cub-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>
                        {activeFilteredDays.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`cub-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(dynamicTotal)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Cubagem TT (Planejado PMT) */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Cubagem TT (PMT Planejado)
                    </td>
                    {activeFilteredDays.map((d) => (
                      <td 
                        key={`cub-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.cubagem[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(getRowTotal(matrix.totals.cubagem))}
                    </td>
                  </tr>

                  {/* LINHAS DE ADERÊNCIA: LIBERADO, % ADERÊNCIA, FATURADO, CAPACIDADE, % FAT X CAP */}
                  {renderAderenciaRows('cubagem', 'Cubagem')}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer com Resumo e Legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#e0f2fe] border border-sky-300"></span>
            <span>Planejado PMT</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300"></span>
            <span>Liberado & % Aderência</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300"></span>
            <span>Faturado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-300"></span>
            <span>Capacidade & % Fat x Cap</span>
          </span>
        </div>
        <div className="text-right text-[11px] font-mono text-slate-400">
          Base: CD {cd} • {mes.toString().padStart(2, '0')}/{ano} • Sincronizado no Banco
        </div>
      </div>

      {/* =========================================================================
          MODAL DE IMPORTAÇÃO DE PLANILHAS (LIBERAÇÃO / FATURAMENTO)
          ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Importar Planilhas de Aderência
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atualize os dados de Liberação e Faturamento para o mês {mes.toString().padStart(2, '0')}/{ano}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsUploadModalOpen(false); setUploadFeedback(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {uploadFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                uploadFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <CheckCircle2 size={16} />
                <span>{uploadFeedback.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Card Upload Liberação */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-800">Planilha de Liberação</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Arquivo: <strong>Carteira CDs_Extração Dados_Tabela_Liberado.xlsx</strong>
                  </p>
                </div>
                <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors shrink-0">
                  <span>Selecionar</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileUpload(e, 'liberado')}
                    className="hidden"
                    disabled={isProcessingFile}
                  />
                </label>
              </div>

              {/* Card Upload Faturamento */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold text-slate-800">Planilha de Faturamento</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Arquivo: <strong>Carteira CDs_Extração Dados_Tabela_Faturado.xlsx</strong>
                  </p>
                </div>
                <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs transition-colors shrink-0">
                  <span>Selecionar</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileUpload(e, 'faturado')}
                    className="hidden"
                    disabled={isProcessingFile}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>* O sistema calcula os totais diários automaticamente para todas as visões.</span>
              <button
                onClick={() => { setIsUploadModalOpen(false); setUploadFeedback(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
