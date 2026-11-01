import React, { useState, useMemo } from 'react'
import { TrendingUp, Package, Layers, Boxes, Truck, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import initialOctMatrix from '../data/pmt_oct_2026_matrix.json'
import initialAderenciaOct from '../data/initialAderencia202610.json'

type MetricType = 'pedidos' | 'pecas' | 'cubagem'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export const PmtDashboardOverview: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cubagem')
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(10) // 1-indexed: 10 = Outubro

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

  // Obter dados diários para a métrica selecionada
  const dailyData = useMemo(() => {
    const isOct2026 = selectedYear === 2026 && selectedMonth === 10

    // PMT Planejado diário
    const pmtDailyMap: Record<string, number> = {}
    if (isOct2026 && initialOctMatrix && initialOctMatrix.data) {
      const metricModals = (initialOctMatrix.data as any)[selectedMetric] || {}
      Object.keys(metricModals).forEach(modalKey => {
        const modalObj = metricModals[modalKey]
        if (modalObj) {
          daysInMonth.forEach(d => {
            const val = modalObj[d.dayStr] || modalObj[d.day.toString()] || 0
            pmtDailyMap[d.dayStr] = (pmtDailyMap[d.dayStr] || 0) + val
          })
        }
      })
    }

    // Aderência (Liberado e Faturado)
    const liberadoTotals = isOct2026 ? (initialAderenciaOct?.liberado?.totals as any)?.[selectedMetric] || {} : {}
    const faturadoTotals = isOct2026 ? (initialAderenciaOct?.faturado?.totals as any)?.[selectedMetric] || {} : {}
    const capacidadeMap = isOct2026 ? (initialAderenciaOct?.capacidade as any)?.[selectedMetric] || {} : {}

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

      return {
        day: d.day,
        dayStr: d.dayStr,
        w: d.weekdayLetter,
        pmt: pmtVal,
        lib: libVal,
        aderLib,
        fat: fatVal,
        cap: capVal,
        aderFat
      }
    })
  }, [selectedYear, selectedMonth, selectedMetric, daysInMonth])

  // Métricas agregadas da tabela (Total e Média)
  const totals = useMemo(() => {
    let sumPmt = 0
    let sumLib = 0
    let sumFat = 0
    let sumCap = 0
    let countDaysWithPmt = 0
    let countDaysWithLib = 0
    let countDaysWithFat = 0
    let countDaysWithCap = 0

    dailyData.forEach(d => {
      sumPmt += d.pmt
      if (d.pmt > 0) countDaysWithPmt++

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

    const totalAderLib = sumPmt > 0 ? Math.round((sumLib / sumPmt) * 100) : 0
    const avgAderLib = avgPmt > 0 ? Math.round((avgLib / avgPmt) * 100) : 0

    const totalAderFat = sumCap > 0 ? Math.round((sumFat / sumCap) * 100) : 0
    const avgAderFat = avgCap > 0 ? Math.round((avgFat / avgCap) * 100) : 0

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
      avgAderFat
    }
  }, [dailyData])

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

  const metricLabel = selectedMetric === 'pedidos' ? 'Pedidos' : selectedMetric === 'pecas' ? 'Peças' : 'Cubagem'
  const unitSuffix = selectedMetric === 'cubagem' ? ' m³' : ''

  return (
    <div className="space-y-4">
      {/* 1. TOP 4 CARDS PMT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: VALOR PLANEJADO */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Planejado (CD 994)</span>
              <span className="p-1 rounded-md bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">R$</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">R$ 143.2M</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">84.2% lib.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Meta: R$ 143.160.331,04</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">R$ 120.6M</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">84%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">R$ 120.3M</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">84%</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '84.2%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-amber-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-amber-700">R$ 128.5M (90%)</span>
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
              <div className="text-2xl font-bold text-blue-600 tracking-tight">200.570</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">97% lib.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Peças planejadas para {selectedMonth.toString().padStart(2, '0')}/{selectedYear}</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">194.319</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">97%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">196.884</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">98%</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '96.9%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">207.710 (104%)</span>
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
              <div className="text-2xl font-bold text-slate-900 tracking-tight">55.754</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">96% lib.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Pedidos programados CD 994</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">53.482</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">96%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">52.053</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">93%</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '95.9%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">57.178 (103%)</span>
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
              <div className="text-2xl font-bold text-slate-900 tracking-tight">20.160 m³</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">91% lib.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Base geral: 50.520 linhas</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">18.263 m³</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">91%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">17.883 m³</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">89%</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '90.6%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                Projeção Lib.:
              </span>
              <span className="font-bold font-mono text-emerald-700">19.523 m³ (97%)</span>
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Acompanhamento Diário de {metricLabel} — Planejado vs Realizado vs Capacidade
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
          <table className="w-full border-collapse text-[11px]">
            {/* CABEÇALHO */}
            <thead>
              <tr className="bg-sky-50/90 text-slate-700 border-b border-slate-200 font-bold">
                <th className="sticky left-0 z-30 bg-sky-50 px-3 py-2 text-left font-extrabold border-r border-slate-200 min-w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Data / Indicador
                </th>
                {dailyData.map((d) => (
                  <th key={`h-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-200 min-w-[38px]">
                    <div className="text-[9px] text-slate-400 font-mono leading-none">{d.w}</div>
                    <div className="text-xs font-extrabold text-slate-800">{d.day}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center border-r border-slate-200 min-w-[55px] bg-slate-100/80 text-slate-800 font-extrabold">
                  Média
                </th>
                <th className="px-3 py-2 text-center min-w-[70px] bg-slate-100/80 text-slate-800 font-extrabold">
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
