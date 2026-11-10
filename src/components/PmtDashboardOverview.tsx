import React, { useState, useMemo, useEffect } from 'react'
import { TrendingUp, Package, Layers, Boxes, Truck, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import initialOctMatrix from '../data/pmt_oct_2026_matrix.json'
import initialAderenciaOct from '../data/initialAderencia202610.json'
import { getPmtDailyMatrixFromSupabase, getPmtSummaryFromSupabase, type PmtDailyMatrixResponse } from '../lib/pmtService'
import { getAderenciaData, type AderenciaDataState } from '../lib/aderenciaService'

type MetricType = 'pedidos' | 'pecas' | 'cubagem'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export const PmtDashboardOverview: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cubagem')
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1) // 1-indexed: Mês Vigente
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Dados dinâmicos carregados da PMT (Supabase / local)
  const [matrixData, setMatrixData] = useState<PmtDailyMatrixResponse | null>(() => {
    // Inicial padrão para Out/2026 com fallback local instantâneo
    return initialOctMatrix as unknown as PmtDailyMatrixResponse
  })

  // Dados dinâmicos de Liberação, Faturamento e Capacidade
  const [aderenciaData, setAderenciaData] = useState<AderenciaDataState | null>(() => {
    return initialAderenciaOct as unknown as AderenciaDataState
  })

  // Resumo geral da PMT (para os cards de topo: Valor, Peças, Pedidos, Cubagem)
  const [pmtSummary, setPmtSummary] = useState<{
    total_valor?: number
    total_pecas?: number
    total_pedidos?: number
    total_cub?: number
    total_linhas?: number
  } | null>(null)

  // Carregar dados de PMT e Aderência sempre que mês ou ano mudarem
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const fetchData = async () => {
      try {
        const [cloudMatrix, cloudAderencia, summaryRes] = await Promise.all([
          getPmtDailyMatrixFromSupabase(selectedYear, selectedMonth, '994', 'modal').catch(() => null),
          getAderenciaData(selectedYear, selectedMonth, '994').catch(() => null),
          getPmtSummaryFromSupabase(selectedYear, selectedMonth, '994').catch(() => null)
        ])

        if (!isMounted) return

        // 1. Matriz de PMT
        if (cloudMatrix && cloudMatrix.days && cloudMatrix.days.length > 0) {
          setMatrixData(cloudMatrix)
        } else if (selectedYear === 2026 && selectedMonth === 10) {
          setMatrixData(initialOctMatrix as unknown as PmtDailyMatrixResponse)
        } else {
          setMatrixData(null)
        }

        // 2. Aderência (Liberado, Faturado e Capacidade)
        if (cloudAderencia) {
          setAderenciaData(cloudAderencia)
        } else if (selectedYear === 2026 && selectedMonth === 10) {
          setAderenciaData(initialAderenciaOct as unknown as AderenciaDataState)
        } else {
          setAderenciaData(null)
        }

        // 3. Resumo da PMT
        if (summaryRes && summaryRes.summary && (summaryRes.totalGeralLinhas > 0 || (summaryRes.summary.total_valor || 0) > 0)) {
          setPmtSummary({
            ...summaryRes.summary,
            total_linhas: summaryRes.totalGeralLinhas
          })
        } else if (selectedYear === 2026 && selectedMonth === 10) {
          setPmtSummary({
            total_valor: 143160331.04,
            total_pecas: 200570,
            total_pedidos: 55754,
            total_cub: 20160,
            total_linhas: 50520
          })
        } else {
          setPmtSummary(null)
        }
      } catch (err) {
        console.warn('Erro ao carregar PMT no Dashboard:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [selectedYear, selectedMonth])

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  // Obter dias do mês selecionado
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate()
    const days = []
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(selectedYear, selectedMonth - 1, d)
      const dayStr = d.toString().padStart(2, '0')
      const weekdayLetter = WEEKDAY_INITIALS[date.getDay()]
      days.push({ day: d, dayStr, weekdayLetter })
    }
    return days
  }, [selectedYear, selectedMonth])

  // Obter dados diários consolidados para a métrica selecionada
  const dailyData = useMemo(() => {
    // 1. PMT Planejado Diário
    const pmtDailyMap: Record<string, number> = {}

    if (matrixData?.totals?.[selectedMetric]) {
      // Se matrixData já tem totais pré-calculados
      const totalsObj = matrixData.totals[selectedMetric]
      daysInMonth.forEach(d => {
        pmtDailyMap[d.dayStr] = totalsObj[d.dayStr] || 0
      })
    } else if (matrixData?.data?.[selectedMetric]) {
      // Agrega todos os modais da métrica
      const metricModals = matrixData.data[selectedMetric]
      Object.keys(metricModals).forEach(modalKey => {
        const modalObj = metricModals[modalKey]
        if (modalObj) {
          daysInMonth.forEach(d => {
            const val = modalObj[d.dayStr] ?? (modalObj as any)[d.day.toString()] ?? 0
            pmtDailyMap[d.dayStr] = (pmtDailyMap[d.dayStr] || 0) + val
          })
        }
      })
    }

    // 2. Aderência (Liberado e Faturado) e Capacidade
    const liberadoTotals = (aderenciaData?.liberado?.totals as any)?.[selectedMetric] || {}
    const faturadoTotals = (aderenciaData?.faturado?.totals as any)?.[selectedMetric] || {}
    const capacidadeMap = (aderenciaData?.capacidade as any)?.[selectedMetric] || {}

    return daysInMonth.map(d => {
      const pmtVal = Math.round(pmtDailyMap[d.dayStr] || 0)
      const rawLib = liberadoTotals[d.dayStr] ?? liberadoTotals[d.day.toString()]
      const libVal = rawLib !== undefined ? Math.round(rawLib) : 0

      const rawFat = faturadoTotals[d.dayStr] ?? faturadoTotals[d.day.toString()]
      const fatVal = rawFat !== undefined ? Math.round(rawFat) : 0

      // Capacidade padrão: domingo = 0, dias úteis = 1000 se cubagem, ~2800 se pedidos, ~10000 se peças
      const isSunday = d.weekdayLetter === 'D'
      let defaultCap = 0
      if (!isSunday) {
        if (selectedMetric === 'cubagem') defaultCap = 1000
        else if (selectedMetric === 'pedidos') defaultCap = 2800
        else defaultCap = 10000
      }
      const rawCap = capacidadeMap[d.dayStr] ?? capacidadeMap[d.day.toString()]
      const capVal = rawCap !== undefined ? Math.round(rawCap) : defaultCap

      // % Aderência Liberação = Liberado / PMT
      const aderLib = pmtVal > 0 ? (libVal / pmtVal) * 100 : null

      // % Aderência Fat x Cap = Faturado / Capacidade
      const aderFat = capVal > 0 ? (fatVal / capVal) * 100 : null

      // Dias Em Carteira = Capacidade / PMT Planejado (com 1 casa decimal)
      const diasEmCarteira = (pmtVal > 0 && capVal > 0) ? (capVal / pmtVal) : null

      return {
        day: d.day,
        dayStr: d.dayStr,
        w: d.weekdayLetter,
        pmt: pmtVal,
        lib: libVal,
        aderLib,
        fat: fatVal,
        cap: capVal,
        aderFat,
        diasEmCarteira
      }
    })
  }, [daysInMonth, matrixData, aderenciaData, selectedMetric])

  // Métricas agregadas da tabela diária (Total e Média)
  const totals = useMemo(() => {
    let sumPmt = 0
    let sumLib = 0
    let sumFat = 0
    let sumCap = 0
    let countDaysWithLib = 0
    let countDaysWithFat = 0
    let countDaysWithCap = 0

    dailyData.forEach(d => {
      sumPmt += d.pmt
      sumLib += d.lib
      if (d.lib > 0) countDaysWithLib++

      sumFat += d.fat
      if (d.fat > 0) countDaysWithFat++

      sumCap += d.cap
      if (d.cap > 0) countDaysWithCap++
    })

    const avgPmt = dailyData.length > 0 ? Math.round(sumPmt / dailyData.length) : 0
    const avgLib = countDaysWithLib > 0 ? Math.round(sumLib / countDaysWithLib) : 0
    const avgFat = countDaysWithFat > 0 ? Math.round(sumFat / countDaysWithFat) : 0
    const avgCap = countDaysWithCap > 0 ? Math.round(sumCap / countDaysWithCap) : 0

    const totalAderLib = sumPmt > 0 ? Math.round((sumLib / sumPmt) * 100) : (sumLib > 0 ? 100 : 0)
    const avgAderLib = avgPmt > 0 ? Math.round((avgLib / avgPmt) * 100) : 0

    const totalAderFat = sumCap > 0 ? Math.round((sumFat / sumCap) * 100) : 0
    const avgAderFat = avgCap > 0 ? Math.round((avgFat / avgCap) * 100) : 0

    // Dias Em Carteira: Total Geral = sumCap / sumPmt | Média = média dos dias com cálculo válido
    const validDiasEmCarteira = dailyData
      .map(d => d.diasEmCarteira)
      .filter((v): v is number => v !== null && v > 0)

    const avgDiasEmCarteira = validDiasEmCarteira.length > 0
      ? validDiasEmCarteira.reduce((acc, curr) => acc + curr, 0) / validDiasEmCarteira.length
      : null

    const totalDiasEmCarteira = (sumPmt > 0 && sumCap > 0) ? (sumCap / sumPmt) : null

    return {
      sumPmt,
      avgPmt,
      sumLib,
      avgLib,
      totalAderLib,
      avgAderLib,
      sumFat,
      avgFat,
      sumCap,
      avgCap,
      totalAderFat,
      avgAderFat,
      avgDiasEmCarteira,
      totalDiasEmCarteira
    }
  }, [dailyData])

  // Valores calculados para os 4 Cards de Topo
  const cardValues = useMemo(() => {
    // 1. Planejado
    const pmtPecas = pmtSummary?.total_pecas ?? (matrixData?.totals?.pecas?.total || 0)
    const pmtPedidos = pmtSummary?.total_pedidos ?? (matrixData?.totals?.pedidos?.total || 0)
    const pmtCub = pmtSummary?.total_cub ?? (matrixData?.totals?.cubagem?.total || 0)
    const pmtValor = pmtSummary?.total_valor ?? 0
    const totalLinhas = pmtSummary?.total_linhas ?? 0

    // 2. Liberados acumulados no mês
    let sumLibValor = 0
    let sumLibPecas = 0
    let sumLibPedidos = 0
    let sumLibCub = 0

    const libTotals = aderenciaData?.liberado?.totals
    if (libTotals) {
      Object.values(libTotals.pedidos || {}).forEach(v => { sumLibPedidos += Number(v || 0) })
      Object.values(libTotals.pecas || {}).forEach(v => { sumLibPecas += Number(v || 0) })
      Object.values(libTotals.cubagem || {}).forEach(v => { sumLibCub += Number(v || 0) })
      if (libTotals.valor) {
        Object.values(libTotals.valor).forEach(v => { sumLibValor += Number(v || 0) })
      }
    }

    // 3. Faturados acumulados no mês
    let sumFatValor = 0
    let sumFatPecas = 0
    let sumFatPedidos = 0
    let sumFatCub = 0

    const fatTotals = aderenciaData?.faturado?.totals
    if (fatTotals) {
      Object.values(fatTotals.pedidos || {}).forEach(v => { sumFatPedidos += Number(v || 0) })
      Object.values(fatTotals.pecas || {}).forEach(v => { sumFatPecas += Number(v || 0) })
      Object.values(fatTotals.cubagem || {}).forEach(v => { sumFatCub += Number(v || 0) })
      if (fatTotals.valor) {
        Object.values(fatTotals.valor).forEach(v => { sumFatValor += Number(v || 0) })
      }
    }

    // Percentuais Liberado / Planejado
    const percLibValor = pmtValor > 0 ? (sumLibValor / pmtValor) * 100 : (sumLibValor > 0 ? 100 : 0)
    const percFatValor = pmtValor > 0 ? (sumFatValor / pmtValor) * 100 : (sumFatValor > 0 ? 100 : 0)

    const percLibPecas = pmtPecas > 0 ? (sumLibPecas / pmtPecas) * 100 : (sumLibPecas > 0 ? 100 : 0)
    const percFatPecas = pmtPecas > 0 ? (sumFatPecas / pmtPecas) * 100 : (sumFatPecas > 0 ? 100 : 0)

    const percLibPedidos = pmtPedidos > 0 ? (sumLibPedidos / pmtPedidos) * 100 : (sumLibPedidos > 0 ? 100 : 0)
    const percFatPedidos = pmtPedidos > 0 ? (sumFatPedidos / pmtPedidos) * 100 : (sumFatPedidos > 0 ? 100 : 0)

    const percLibCub = pmtCub > 0 ? (sumLibCub / pmtCub) * 100 : (sumLibCub > 0 ? 100 : 0)
    const percFatCub = pmtCub > 0 ? (sumFatCub / pmtCub) * 100 : (sumFatCub > 0 ? 100 : 0)

    return {
      valor: {
        plan: pmtValor,
        lib: sumLibValor,
        fat: sumFatValor,
        percLib: Math.round(percLibValor),
        percFat: Math.round(percFatValor)
      },
      pecas: {
        plan: Math.round(pmtPecas),
        lib: Math.round(sumLibPecas),
        fat: Math.round(sumFatPecas),
        percLib: Math.round(percLibPecas),
        percFat: Math.round(percFatPecas)
      },
      pedidos: {
        plan: Math.round(pmtPedidos),
        lib: Math.round(sumLibPedidos),
        fat: Math.round(sumFatPedidos),
        percLib: Math.round(percLibPedidos),
        percFat: Math.round(percFatPedidos)
      },
      cubagem: {
        plan: Math.round(pmtCub),
        lib: Math.round(sumLibCub),
        fat: Math.round(sumFatCub),
        percLib: Math.round(percLibCub),
        percFat: Math.round(percFatCub),
        totalLinhas
      }
    }
  }, [pmtSummary, matrixData, aderenciaData])

  const formatNum = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '-'
    if (val === 0) return '0'
    return val.toLocaleString('pt-BR')
  }

  const formatPerc = (val: number | null | undefined): { text: string; color: string } => {
    if (val === null || val === undefined) return { text: '-', color: 'text-slate-400' }
    if (val === 0) return { text: '0%', color: 'text-amber-700' }
    const rounded = Math.round(val)
    const text = `${rounded}%`
    if (rounded >= 100) return { text, color: 'text-emerald-700 font-extrabold' }
    if (rounded >= 90) return { text, color: 'text-emerald-600 font-bold' }
    if (rounded >= 80) return { text, color: 'text-amber-700 font-bold' }
    return { text, color: 'text-rose-600 font-bold' }
  }

  const formatCurrencyM = (val: number): string => {
    if (val <= 0) return 'R$ 0'
    const millions = val / 1_000_000
    if (millions >= 1) {
      return `R$ ${millions.toFixed(1)}M`
    }
    const thousands = val / 1_000
    return `R$ ${thousands.toFixed(0)}k`
  }

  const metricLabel = selectedMetric === 'pedidos' ? 'Pedidos' : selectedMetric === 'pecas' ? 'Peças' : 'Cubagem'

  return (
    <div className="space-y-4">
      {/* 1. TOP 4 CARDS PMT (ALIMENTADOS AUTOMATICAMENTE PELA PMT IMPORTADA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: VALOR PLANEJADO */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Planejado (CD 994)</span>
              <span className="p-1 rounded-md bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">R$</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {cardValues.valor.plan > 0 ? formatCurrencyM(cardValues.valor.plan) : (selectedMonth === 10 ? 'R$ 143.2M' : 'R$ 0')}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {cardValues.valor.percLib}% lib.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
              Meta: {cardValues.valor.plan > 0 ? `R$ ${cardValues.valor.plan.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Aguardando importação'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">
                  {cardValues.valor.lib > 0 ? formatCurrencyM(cardValues.valor.lib) : 'R$ 0'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {cardValues.valor.percLib}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">
                  {cardValues.valor.fat > 0 ? formatCurrencyM(cardValues.valor.fat) : 'R$ 0'}
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {cardValues.valor.percFat}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cardValues.valor.percLib, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-amber-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-amber-700">
                {cardValues.valor.lib > 0 ? formatCurrencyM(cardValues.valor.lib * 1.06) : 'R$ 0'} ({cardValues.valor.percLib > 0 ? Math.round(cardValues.valor.percLib * 1.06) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: VOLUME DE PEÇAS */}
        <div
          onClick={() => setSelectedMetric('pecas')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedMetric === 'pecas'
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm'
            : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs hover:shadow-md'
            } flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volume de Peças</span>
              <Package size={15} className="text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-blue-600 tracking-tight">
                {formatNum(cardValues.pecas.plan)}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cardValues.pecas.percLib}% lib.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Peças planejadas para {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">{formatNum(cardValues.pecas.lib)}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {cardValues.pecas.percLib}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">{formatNum(cardValues.pecas.fat)}</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {cardValues.pecas.percFat}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cardValues.pecas.percLib, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">
                {formatNum(Math.round(cardValues.pecas.lib * 1.05))} ({cardValues.pecas.percLib > 0 ? Math.round(cardValues.pecas.percLib * 1.05) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL DE PEDIDOS */}
        <div
          onClick={() => setSelectedMetric('pedidos')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedMetric === 'pedidos'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-sm'
            : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs hover:shadow-md'
            } flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</span>
              <Layers size={15} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatNum(cardValues.pedidos.plan)}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cardValues.pedidos.percLib}% lib.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pedidos programados CD 994
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">{formatNum(cardValues.pedidos.lib)}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {cardValues.pedidos.percLib}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">{formatNum(cardValues.pedidos.fat)}</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {cardValues.pedidos.percFat}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cardValues.pedidos.percLib, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">
                {formatNum(Math.round(cardValues.pedidos.lib * 1.05))} ({cardValues.pedidos.percLib > 0 ? Math.round(cardValues.pedidos.percLib * 1.05) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: CUBAGEM TOTAL */}
        <div
          onClick={() => setSelectedMetric('cubagem')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedMetric === 'cubagem'
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-sm'
            : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs hover:shadow-md'
            } flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cubagem Total (m³)</span>
              <CheckCircle2 size={15} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatNum(cardValues.cubagem.plan)} m³
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cardValues.cubagem.percLib}% lib.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {cardValues.cubagem.totalLinhas > 0 ? `Base geral: ${cardValues.cubagem.totalLinhas.toLocaleString('pt-BR')} linhas` : 'Base geral PMT'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">{formatNum(cardValues.cubagem.lib)} m³</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  {cardValues.cubagem.percLib}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">{formatNum(cardValues.cubagem.fat)} m³</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {cardValues.cubagem.percFat}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cardValues.cubagem.percLib, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">
                {formatNum(Math.round(cardValues.cubagem.lib * 1.05))} m³ ({cardValues.cubagem.percLib > 0 ? Math.round(cardValues.cubagem.percLib * 1.05) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABELA MATRIZ DIÁRIA PMT COM SEGMENTAÇÃO E NAVEGAÇÃO DE MÊS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* TÍTULO */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              Acompanhamento Diário de {metricLabel} — Planejado vs Realizado vs Capacidade
              {isLoading && <Loader2 size={13} className="animate-spin text-blue-600 inline" />}
            </h3>
          </div>

          {/* CONTROLES: SEGMENTAÇÃO E SELETOR DE MÊS */}
          <div className="flex items-center gap-3">
            {/* SEGMENTAÇÃO (PEDIDOS, PEÇAS, CUBAGEM) */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/80">
              <button
                type="button"
                onClick={() => setSelectedMetric('pedidos')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedMetric === 'pedidos'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Pedidos
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('pecas')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedMetric === 'pecas'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Peças
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('cubagem')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedMetric === 'cubagem'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Cubagem
              </button>
            </div>

            {/* SELETOR DE MÊS COM SETAS */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-2 min-w-[110px] text-center select-none">
                {MONTH_NAMES[selectedMonth - 1]} / {selectedYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] table-fixed">
            {/* CABEÇALHO */}
            <thead>
              <tr className="bg-sky-50/90 text-slate-700 border-b border-slate-200 font-bold">
                <th className="sticky left-0 z-30 bg-sky-50 px-3 py-2 text-left font-extrabold border-r border-slate-200 w-[210px] min-w-[210px] max-w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Data / Indicador
                </th>
                {dailyData.map((d) => (
                  <th key={`h-${d.day}`} className="px-1 py-1 text-center border-r border-slate-200 w-[38px] min-w-[38px]">
                    <div className="text-[9px] text-slate-400 font-mono leading-none">{d.w}</div>
                    <div className="text-xs font-extrabold text-slate-800">{d.day}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center border-r border-slate-200 w-[55px] min-w-[55px] bg-slate-100/80 text-slate-800 font-extrabold">
                  Média
                </th>
                <th className="px-2 py-2 text-center w-[70px] min-w-[70px] bg-slate-100/80 text-slate-800 font-extrabold">
                  Total Geral
                </th>
              </tr>
            </thead>

            {/* CORPO */}
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {/* LINHA 1: PMT PLANEJADO */}
              <tr className="bg-sky-50/30 hover:bg-sky-50/60 transition-colors">
                <td className="sticky left-0 z-20 bg-sky-50/80 px-3 py-1.5 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans">
                  {metricLabel} TT (PMT Planejado)
                </td>
                {dailyData.map((d) => (
                  <td key={`pmt-${d.day}`} className="px-1 py-1.5 text-center border-r border-slate-100 text-slate-700">
                    {formatNum(d.pmt)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-slate-800 bg-slate-50/60 border-r border-slate-200">
                  {formatNum(totals.avgPmt)}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-slate-900 bg-slate-50/60">
                  {formatNum(totals.sumPmt)}
                </td>
              </tr>

              {/* LINHA 2: LIBERADO */}
              <tr className="bg-emerald-50/60 hover:bg-emerald-50 transition-colors">
                <td className="sticky left-0 z-20 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-900 border-r border-emerald-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Liberado ({metricLabel})
                </td>
                {dailyData.map((d) => (
                  <td key={`lib-${d.day}`} className="px-1 py-1.5 text-center border-r border-emerald-100 font-bold text-emerald-900">
                    {formatNum(d.lib)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-emerald-900 bg-emerald-100/40 border-r border-emerald-200">
                  {formatNum(totals.avgLib)}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-emerald-900 bg-emerald-100/40">
                  {formatNum(totals.sumLib)}
                </td>
              </tr>

              {/* LINHA 3: % ADERÊNCIA LIBERAÇÃO */}
              <tr className="bg-white hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans pl-6">
                  % Aderência Liberação
                </td>
                {dailyData.map((d) => {
                  const p = formatPerc(d.aderLib)
                  return (
                    <td key={`aderLib-${d.day}`} className={`px-0.5 py-1.5 text-center border-r border-slate-100 text-[10.5px] ${p.color}`}>
                      {p.text}
                    </td>
                  )
                })}
                <td className="px-2 py-1.5 text-center font-bold text-emerald-700 bg-slate-50/60 border-r border-slate-200 text-[10.5px]">
                  {formatPerc(totals.avgAderLib).text}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-emerald-700 bg-slate-50/60 text-[10.5px]">
                  {formatPerc(totals.totalAderLib).text}
                </td>
              </tr>

              {/* LINHA 4: FATURADO */}
              <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                <td className="sticky left-0 z-20 bg-amber-50/80 px-3 py-1.5 font-bold text-amber-900 border-r border-amber-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Faturado ({metricLabel})
                </td>
                {dailyData.map((d) => (
                  <td key={`fat-${d.day}`} className="px-1 py-1.5 text-center border-r border-amber-100 font-bold text-amber-900">
                    {formatNum(d.fat)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-amber-900 bg-amber-100/40 border-r border-amber-200">
                  {formatNum(totals.avgFat)}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-amber-900 bg-amber-100/40">
                  {formatNum(totals.sumFat)}
                </td>
              </tr>

              {/* LINHA 5: CAPACIDADE */}
              <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                <td className="sticky left-0 z-20 bg-slate-100/90 px-3 py-1.5 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  Capacidade ({metricLabel})
                </td>
                {dailyData.map((d) => (
                  <td key={`cap-${d.day}`} className="px-1 py-1.5 text-center border-r border-slate-200 text-slate-700 font-semibold">
                    {formatNum(d.cap)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-slate-800 bg-slate-100 border-r border-slate-200">
                  {formatNum(totals.avgCap)}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-slate-900 bg-slate-100">
                  {formatNum(totals.sumCap)}
                </td>
              </tr>

              {/* LINHA 6: % ADERÊNCIA FAT. X CAPACIDADE */}
              <tr className="bg-white hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans pl-6">
                  % Aderência Fat. x Capacidade
                </td>
                {dailyData.map((d) => {
                  const p = formatPerc(d.aderFat)
                  return (
                    <td key={`aderFat-${d.day}`} className={`px-0.5 py-1.5 text-center border-r border-slate-100 text-[10.5px] ${p.color}`}>
                      {p.text}
                    </td>
                  )
                })}
                <td className="px-2 py-1.5 text-center font-bold text-amber-700 bg-slate-50/60 border-r border-slate-200 text-[10.5px]">
                  {formatPerc(totals.avgAderFat).text}
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-amber-700 bg-slate-50/60 text-[10.5px]">
                  {formatPerc(totals.totalAderFat).text}
                </td>
              </tr>

              {/* LINHA 7: DIAS EM CARTEIRA (Capacidade / PMT Planejado) */}
              <tr className="bg-sky-50/30 hover:bg-sky-50/60 transition-colors border-t border-slate-200">
                <td className="sticky left-0 z-20 bg-sky-50/90 px-3 py-1.5 font-bold text-sky-900 border-r border-sky-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                  Dias Em Carteira
                </td>
                {dailyData.map((d) => {
                  const val = d.diasEmCarteira !== null ? d.diasEmCarteira.toFixed(1).replace('.', ',') : '-'
                  const isHigh = d.diasEmCarteira !== null && d.diasEmCarteira > 1.5

                  return (
                    <td
                      key={`diasCarteira-${d.day}`}
                      className={`px-0.5 py-1.5 text-center border-r font-bold font-mono text-[11px] transition-colors ${
                        isHigh
                          ? 'bg-rose-100/70 text-rose-700 border-rose-200'
                          : 'border-sky-100 text-sky-950'
                      }`}
                      title={`Capacidade: ${d.cap} / PMT: ${d.pmt} = ${val} (${isHigh ? 'Acima de 1,5 dias' : 'Dentro do limite'})`}
                    >
                      {val}
                    </td>
                  )
                })}
                <td className={`px-2 py-1.5 text-center font-bold border-r font-mono text-[11px] ${
                  totals.avgDiasEmCarteira !== null && totals.avgDiasEmCarteira > 1.5
                    ? 'bg-rose-100/70 text-rose-700 border-rose-200'
                    : 'text-sky-900 bg-sky-100/50 border-sky-200'
                }`}>
                  {totals.avgDiasEmCarteira !== null ? totals.avgDiasEmCarteira.toFixed(1).replace('.', ',') : '-'}
                </td>
                <td className={`px-2 py-1.5 text-center font-black font-mono text-[11px] ${
                  totals.totalDiasEmCarteira !== null && totals.totalDiasEmCarteira > 1.5
                    ? 'bg-rose-100/70 text-rose-700'
                    : 'text-sky-950 bg-sky-100/50'
                }`}>
                  {totals.totalDiasEmCarteira !== null ? totals.totalDiasEmCarteira.toFixed(1).replace('.', ',') : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
