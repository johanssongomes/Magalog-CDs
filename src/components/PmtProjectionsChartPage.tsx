import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Package, 
  Boxes, 
  Layers, 
  Maximize2, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react'
import { getPmtDailyMatrixFromSupabase, type PmtDailyMatrixResponse } from '../lib/pmtService'
import { getAderenciaData, type AderenciaDataState } from '../lib/aderenciaService'
import initialAderenciaOct from '../data/initialAderencia202610.json'

interface Props {
  ano: number
  mes: number
  cd?: string
}

type MetricType = 'cubagem' | 'pedidos' | 'pecas'
type ViewOrientation = 'horizontal' | 'vertical'

export const PmtProjectionsChartPage: React.FC<Props> = ({ 
  ano, 
  mes, 
  cd = '994' 
}) => {
  const [metric, setMetric] = useState<MetricType>('cubagem')
  const [orientation, setOrientation] = useState<ViewOrientation>('horizontal')
  const [isLoading, setIsLoading] = useState(false)
  const [matrix, setMatrix] = useState<PmtDailyMatrixResponse | null>(null)
  const [aderencia, setAderencia] = useState<AderenciaDataState | null>(() => {
    if (ano === 2026 && mes === 10) {
      return initialAderenciaOct as unknown as AderenciaDataState
    }
    return null
  })

  // Filtros de exibição das séries (permite ligar/desligar barras específicas)
  const [showFaturado, setShowFaturado] = useState(true)
  const [showLiberado, setShowLiberado] = useState(true)
  const [showPmt, setShowPmt] = useState(true)
  const [showCapacidade, setShowCapacidade] = useState(true)

  // Hover de detalhes do dia
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // 1. Carregar Matriz PMT (Planejado)
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getPmtDailyMatrixFromSupabase(ano, mes, cd, 'modal')
      .then(data => {
        if (isMounted) {
          setMatrix(data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [ano, mes, cd])

  // 2. Carregar Aderência (Liberado, Faturado e Capacidade)
  useEffect(() => {
    let isMounted = true
    if (ano === 2026 && mes === 10) {
      setAderencia(initialAderenciaOct as unknown as AderenciaDataState)
    }

    getAderenciaData(ano, mes, cd).then(data => {
      if (isMounted && data) {
        setAderencia(data)
      }
    })

    const handleAderenciaUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AderenciaDataState>
      if (customEvent.detail && customEvent.detail.ano === ano && customEvent.detail.mes === mes) {
        setAderencia(customEvent.detail)
      }
    }
    window.addEventListener('aderenciaDataUpdated', handleAderenciaUpdated)

    return () => {
      isMounted = false
      window.removeEventListener('aderenciaDataUpdated', handleAderenciaUpdated)
    }
  }, [ano, mes, cd])

  // Total de dias do mês
  const totalDaysInMonth = useMemo(() => new Date(ano, mes, 0).getDate(), [ano, mes])

  // Montagem consolidada de cada dia: PMT, Liberado, Faturado, Capacidade
  const dailyData = useMemo(() => {
    const list = []
    const libTotals = aderencia?.liberado?.totals
    const fatTotals = aderencia?.faturado?.totals
    const capTotals = aderencia?.capacidade

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayStr = d.toString().padStart(2, '0')
      const dateObj = new Date(ano, mes - 1, d)
      const weekdayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
      const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const weekdayIdx = dateObj.getDay()
      const weekdayLetter = weekdayLetters[weekdayIdx]
      const weekdayName = weekdayNames[weekdayIdx]

      // Valores por métrica
      let pmtVal = 0
      let libVal = 0
      let fatVal = 0
      let capVal = 0

      if (metric === 'cubagem') {
        pmtVal = Number(matrix?.totals?.cubagem?.[dayStr] || 0)
        libVal = Number(libTotals?.cubagem?.[dayStr] || 0)
        fatVal = Number(fatTotals?.cubagem?.[dayStr] || 0)
        capVal = Number(capTotals?.cubagem?.[dayStr] || 0)
      } else if (metric === 'pedidos') {
        pmtVal = Number(matrix?.totals?.pedidos?.[dayStr] || 0)
        libVal = Number(libTotals?.pedidos?.[dayStr] || 0)
        fatVal = Number(fatTotals?.pedidos?.[dayStr] || 0)
        capVal = Number(capTotals?.pedidos?.[dayStr] || 0)
      } else {
        pmtVal = Number(matrix?.totals?.pecas?.[dayStr] || 0)
        libVal = Number(libTotals?.pecas?.[dayStr] || 0)
        fatVal = Number(fatTotals?.pecas?.[dayStr] || 0)
        capVal = Number(capTotals?.pecas?.[dayStr] || 0)
      }

      // Adherence
      const aderenciaLib = pmtVal > 0 ? (libVal / pmtVal) * 100 : 0
      const aderenciaFat = pmtVal > 0 ? (fatVal / pmtVal) * 100 : 0
      const aderenciaCap = capVal > 0 ? (fatVal / capVal) * 100 : 0

      list.push({
        day: d,
        dayStr,
        dateFormatted: `${dayStr}/${mes.toString().padStart(2, '0')}`,
        weekdayLetter,
        weekdayName,
        isWeekend: weekdayIdx === 0 || weekdayIdx === 6,
        pmtVal,
        libVal,
        fatVal,
        capVal,
        aderenciaLib,
        aderenciaFat,
        aderenciaCap
      })
    }
    return list
  }, [ano, mes, totalDaysInMonth, metric, matrix, aderencia])

  // Maior valor geral para calcular a escala proporcional (100%)
  const maxScaleValue = useMemo(() => {
    let max = 0
    dailyData.forEach(d => {
      if (showPmt && d.pmtVal > max) max = d.pmtVal
      if (showLiberado && d.libVal > max) max = d.libVal
      if (showFaturado && d.fatVal > max) max = d.fatVal
      if (showCapacidade && d.capVal > max) max = d.capVal
    })
    return max > 0 ? max * 1.08 : 100 // +8% de margem visual no topo
  }, [dailyData, showPmt, showLiberado, showFaturado, showCapacidade])

  // Totais Acumulados do Mês
  const totals = useMemo(() => {
    const totalPmt = dailyData.reduce((acc, d) => acc + d.pmtVal, 0)
    const totalLib = dailyData.reduce((acc, d) => acc + d.libVal, 0)
    const totalFat = dailyData.reduce((acc, d) => acc + d.fatVal, 0)
    const totalCap = dailyData.reduce((acc, d) => acc + d.capVal, 0)

    const percLib = totalPmt > 0 ? (totalLib / totalPmt) * 100 : 0
    const percFat = totalPmt > 0 ? (totalFat / totalPmt) * 100 : 0
    const percCap = totalCap > 0 ? (totalFat / totalCap) * 100 : 0

    // Dias transcorridos com faturamento
    const daysRealized = dailyData.filter(d => d.fatVal > 0).length
    const avgDiariaFat = daysRealized > 0 ? totalFat / daysRealized : 0
    const projecaoFimMes = avgDiariaFat * totalDaysInMonth
    const percProjecao = totalPmt > 0 ? (projecaoFimMes / totalPmt) * 100 : 0

    return {
      totalPmt,
      totalLib,
      totalFat,
      totalCap,
      percLib,
      percFat,
      percCap,
      daysRealized,
      avgDiariaFat,
      projecaoFimMes,
      percProjecao
    }
  }, [dailyData, totalDaysInMonth])

  // Formatação de valores conforme a métrica selecionada
  const formatVal = (val: number) => {
    if (metric === 'cubagem') {
      return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' m³'
    }
    return Math.round(val).toLocaleString('pt-BR')
  }

  const formatShortVal = (val: number) => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(1) + 'M'
    }
    if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + 'k'
    }
    return Math.round(val).toString()
  }

  const metricLabel = metric === 'cubagem' ? 'Cubagem (m³)' : metric === 'pedidos' ? 'Pedidos' : 'Peças'

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO DASHBOARD ANALÍTICO COM SELETORES E KPI TOKENS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  PMT Expedição &bull; PG2
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  CD {cd} &bull; {mes.toString().padStart(2, '0')}/{ano}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Projeções da PMT &bull; Acompanhamento Diário
              </h2>
            </div>
          </div>

          {/* CONTROLES: SELETOR DE MÉTRICA E ORIENTAÇÃO */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Métrica */}
            <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setMetric('cubagem')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  metric === 'cubagem'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={13} className={metric === 'cubagem' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Cubagem (m³)</span>
              </button>

              <button
                type="button"
                onClick={() => setMetric('pedidos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  metric === 'pedidos'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package size={13} className={metric === 'pedidos' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Pedidos</span>
              </button>

              <button
                type="button"
                onClick={() => setMetric('pecas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  metric === 'pecas'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes size={13} className={metric === 'pecas' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Peças</span>
              </button>
            </div>

            {/* Alternar Orientação (Horizontal / Vertical) */}
            <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setOrientation('horizontal')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'horizontal'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visão de Barras Horizontais (estilo PowerBI/Dashboard com leitura dia a dia)"
              >
                Barras Horizontais
              </button>
              <button
                type="button"
                onClick={() => setOrientation('vertical')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'vertical'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visão de Colunas Verticais (linha do tempo ao longo do mês)"
              >
                Colunas Verticais
              </button>
            </div>
          </div>
        </div>

        {/* CARDS RESUMO / KPIS PRINCIPAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* CARD 1: PMT PLANEJADO */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900/80 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                PMT Planejado
              </span>
              <span className="text-[10px] text-blue-600 font-mono">Meta</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {formatVal(totals.totalPmt)}
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Volume orçado total no PMT
            </p>
          </div>

          {/* CARD 2: LIBERADO */}
          <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900/80 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Liberado
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                totals.percLib >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {totals.percLib.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-emerald-900 font-mono tracking-tight">
              {formatVal(totals.totalLib)}
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Carga liberada para expedição
            </p>
          </div>

          {/* CARD 3: FATURADO */}
          <div className="p-3.5 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900/80 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                Faturado
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                totals.percFat >= 95 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {totals.percFat.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-sky-950 font-mono tracking-tight">
              {formatVal(totals.totalFat)}
            </div>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Efetivamente faturado até o momento
            </p>
          </div>

          {/* CARD 4: PROJEÇÃO & CAPACIDADE */}
          <div className="p-3.5 rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900/80 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-purple-600" />
                Projeção Fim de Mês
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                {totals.percProjecao.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-purple-950 font-mono tracking-tight">
              {formatVal(totals.projecaoFimMes)}
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-0.5">
              <span>Média: {formatShortVal(totals.avgDiariaFat)}/dia</span>
              {totals.totalCap > 0 && (
                <span className="font-bold text-indigo-700">Cap: {formatShortVal(totals.totalCap)}</span>
              )}
            </div>
          </div>
        </div>

        {/* LEGENDA INTERATIVA COM FILTROS DE SÉRIE */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
              Séries no Gráfico:
            </span>
            {/* Toggle Faturado */}
            <button
              type="button"
              onClick={() => setShowFaturado(!showFaturado)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                showFaturado
                  ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${showFaturado ? 'bg-sky-500' : 'bg-slate-300'}`} />
              <span>Faturado Realizado</span>
            </button>

            {/* Toggle Liberado */}
            <button
              type="button"
              onClick={() => setShowLiberado(!showLiberado)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                showLiberado
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${showLiberado ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>Liberado</span>
            </button>

            {/* Toggle PMT */}
            <button
              type="button"
              onClick={() => setShowPmt(!showPmt)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                showPmt
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${showPmt ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <span>PMT Planejado</span>
            </button>

            {/* Toggle Capacidade */}
            <button
              type="button"
              onClick={() => setShowCapacidade(!showCapacidade)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                showCapacidade
                  ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${showCapacidade ? 'bg-purple-500' : 'bg-slate-300'}`} />
              <span>Capacidade Operacional</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Info size={13} className="text-slate-400" />
            <span>Passe o cursor sobre os dias para ver os comparativos e aderências diárias.</span>
          </div>
        </div>
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Gráfico Comparativo Diário &bull; {metricLabel}
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Escala máxima: <strong className="text-sky-400">{formatVal(maxScaleValue)}</strong>
          </div>
        </div>

        {/* MODO 1: BARRAS HORIZONTAIS (Exatamente no estilo da imagem com barras horizontais por dia) */}
        {orientation === 'horizontal' ? (
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-2 custom-scrollbar">
            {dailyData.map((d) => {
              const isHovered = hoveredDay === d.dayStr
              const widthFat = maxScaleValue > 0 ? (d.fatVal / maxScaleValue) * 100 : 0
              const widthLib = maxScaleValue > 0 ? (d.libVal / maxScaleValue) * 100 : 0
              const widthPmt = maxScaleValue > 0 ? (d.pmtVal / maxScaleValue) * 100 : 0
              const widthCap = maxScaleValue > 0 ? (d.capVal / maxScaleValue) * 100 : 0

              return (
                <div
                  key={d.dayStr}
                  onMouseEnter={() => setHoveredDay(d.dayStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`p-2 rounded-xl transition-all duration-150 border ${
                    isHovered
                      ? 'bg-slate-800/90 border-blue-500/60 shadow-lg'
                      : d.isWeekend
                        ? 'bg-slate-950/40 border-slate-800/40'
                        : 'bg-slate-800/40 border-slate-800/70 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Indicador do Dia e Dia da Semana */}
                    <div className="w-16 shrink-0 flex items-center justify-between font-mono">
                      <span className="text-xs font-bold text-slate-300">{d.dateFormatted}</span>
                      <span className={`text-[10px] font-extrabold px-1 rounded ${
                        d.isWeekend ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {d.weekdayLetter}
                      </span>
                    </div>

                    {/* Barras do Dia */}
                    <div className="flex-1 space-y-1">
                      {/* Barra Faturado (Azul Claro Vibrante - Estilo da imagem) */}
                      {showFaturado && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950/60 rounded-full h-4 overflow-hidden relative border border-slate-800/60">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-sky-400 h-full rounded-full transition-all duration-300 relative flex items-center justify-end pr-1.5"
                              style={{ width: `${Math.max(widthFat, 0.5)}%` }}
                            >
                              {widthFat > 15 && (
                                <span className="text-[10px] font-black text-white font-mono drop-shadow-xs">
                                  {metric === 'cubagem' ? d.fatVal.toFixed(1) : Math.round(d.fatVal)}
                                </span>
                              )}
                            </div>
                          </div>
                          {widthFat <= 15 && (
                            <span className="text-[10px] font-bold text-sky-400 font-mono w-14 shrink-0">
                              {metric === 'cubagem' ? d.fatVal.toFixed(1) : Math.round(d.fatVal)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Barra Liberado (Verde Esmeralda) */}
                      {showLiberado && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950/60 rounded-full h-2.5 overflow-hidden relative">
                            <div
                              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(widthLib, 0.5)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400/90 w-14 shrink-0">
                            lib: {metric === 'cubagem' ? d.libVal.toFixed(0) : Math.round(d.libVal)}
                          </span>
                        </div>
                      )}

                      {/* Barra PMT Planejado (Azul Escuro / Linha Guia) */}
                      {showPmt && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950/60 rounded-full h-2 overflow-hidden relative">
                            <div
                              className="bg-indigo-500/70 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(widthPmt, 0.5)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-indigo-300/80 w-14 shrink-0">
                            pmt: {metric === 'cubagem' ? d.pmtVal.toFixed(0) : Math.round(d.pmtVal)}
                          </span>
                        </div>
                      )}

                      {/* Barra Capacidade Operacional */}
                      {showCapacidade && d.capVal > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950/60 rounded-full h-2 overflow-hidden relative">
                            <div
                              className="bg-purple-500/70 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(widthCap, 0.5)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-purple-300/80 w-14 shrink-0">
                            cap: {metric === 'cubagem' ? d.capVal.toFixed(0) : Math.round(d.capVal)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Aderência Percentual */}
                    <div className="w-18 shrink-0 text-right">
                      {d.pmtVal > 0 && d.fatVal > 0 ? (
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded font-mono ${
                          d.aderenciaFat >= 100
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : d.aderenciaFat >= 85
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {d.aderenciaFat.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">-</span>
                      )}
                    </div>
                  </div>

                  {/* Detalhe expandido no Hover do dia */}
                  {isHovered && (
                    <div className="mt-2 pt-2 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/90 rounded-lg p-2 animate-in fade-in duration-150">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Data:</span>
                        <strong className="text-white">{d.weekdayName}, {d.dateFormatted}</strong>
                      </div>
                      <div>
                        <span className="text-sky-400 block text-[10px]">Faturado Realizado:</span>
                        <strong className="text-sky-300 font-mono">{formatVal(d.fatVal)}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[10px]">Liberado:</span>
                        <strong className="text-emerald-300 font-mono">{formatVal(d.libVal)}</strong>
                      </div>
                      <div>
                        <span className="text-indigo-400 block text-[10px]">PMT Planejado:</span>
                        <strong className="text-indigo-200 font-mono">{formatVal(d.pmtVal)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* MODO 2: COLUNAS VERTICAIS */
          <div className="h-80 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto custom-scrollbar">
            {dailyData.map((d) => {
              const heightFat = maxScaleValue > 0 ? (d.fatVal / maxScaleValue) * 100 : 0
              const heightLib = maxScaleValue > 0 ? (d.libVal / maxScaleValue) * 100 : 0
              const heightPmt = maxScaleValue > 0 ? (d.pmtVal / maxScaleValue) * 100 : 0
              const isHovered = hoveredDay === d.dayStr

              return (
                <div
                  key={d.dayStr}
                  onMouseEnter={() => setHoveredDay(d.dayStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`flex-1 min-w-[28px] max-w-[42px] h-full flex flex-col justify-end items-center group relative cursor-pointer ${
                    isHovered ? 'scale-105 z-20' : ''
                  }`}
                >
                  {/* Tooltip Hover no modo vertical */}
                  {isHovered && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 text-white rounded-lg p-2 shadow-2xl z-30 whitespace-nowrap text-[10px] space-y-0.5">
                      <div className="font-bold text-sky-300">{d.dateFormatted} ({d.weekdayLetter})</div>
                      <div>Fat: <strong className="font-mono text-white">{formatVal(d.fatVal)}</strong></div>
                      <div>Pmt: <strong className="font-mono text-slate-300">{formatVal(d.pmtVal)}</strong></div>
                    </div>
                  )}

                  {/* Barras Lado a Lado ou Sobrepostas */}
                  <div className="w-full h-full flex items-end justify-center gap-0.5">
                    {/* Barra PMT */}
                    {showPmt && (
                      <div
                        className="w-1.5 bg-indigo-500/60 rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(heightPmt, 2)}%` }}
                        title={`PMT: ${formatVal(d.pmtVal)}`}
                      />
                    )}

                    {/* Barra Liberado */}
                    {showLiberado && (
                      <div
                        className="w-2 bg-emerald-500/80 rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(heightLib, 2)}%` }}
                        title={`Liberado: ${formatVal(d.libVal)}`}
                      />
                    )}

                    {/* Barra Faturado */}
                    {showFaturado && (
                      <div
                        className="w-3 bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-sm transition-all duration-300"
                        style={{ height: `${Math.max(heightFat, 2)}%` }}
                        title={`Faturado: ${formatVal(d.fatVal)}`}
                      />
                    )}
                  </div>

                  {/* Eixo X: Dia */}
                  <div className="pt-2 text-[10px] font-mono text-slate-400 text-center border-t border-slate-800 w-full mt-1">
                    <span className={d.isWeekend ? 'text-amber-400 font-bold' : ''}>
                      {d.dayStr}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Eixo Inferior de Escala (0 até 1 mil / Máximo) */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>0</span>
          <span>{formatShortVal(maxScaleValue * 0.25)}</span>
          <span>{formatShortVal(maxScaleValue * 0.5)}</span>
          <span>{formatShortVal(maxScaleValue * 0.75)}</span>
          <span className="text-sky-400 font-bold">{formatShortVal(maxScaleValue)}</span>
        </div>
      </div>
    </div>
  )
}
