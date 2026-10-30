import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Boxes, 
  Layers, 
  ArrowUpRight, 
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Info,
  Maximize2
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

export const PmtProjectionsChartPage: React.FC<Props> = ({ 
  ano, 
  mes, 
  cd = '994' 
}) => {
  const [metric, setMetric] = useState<MetricType>('cubagem')
  const [matrix, setMatrix] = useState<PmtDailyMatrixResponse | null>(null)
  const [aderencia, setAderencia] = useState<AderenciaDataState | null>(() => {
    if (ano === 2026 && mes === 10) {
      return initialAderenciaOct as unknown as AderenciaDataState
    }
    return null
  })

  // Filtros interativos para ligar/desligar séries
  const [visibleSeries, setVisibleSeries] = useState({
    faturado: true,
    liberado: true,
    pmt: true,
    capacidade: true
  })

  // Hover ativo do dia
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  // 1. Carregar PMT Matriz (Planejado)
  useEffect(() => {
    let isMounted = true
    getPmtDailyMatrixFromSupabase(ano, mes, cd, 'modal')
      .then(data => {
        if (isMounted) setMatrix(data)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [ano, mes, cd])

  // 2. Carregar Aderência (Liberado, Faturado e Capacidade)
  useEffect(() => {
    let isMounted = true
    if (ano === 2026 && mes === 10) {
      setAderencia(initialAderenciaOct as unknown as AderenciaDataState)
    }

    getAderenciaData(ano, mes, cd).then(data => {
      if (isMounted && data) setAderencia(data)
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

  const totalDaysInMonth = useMemo(() => new Date(ano, mes, 0).getDate(), [ano, mes])

  // Dados consolidados dia a dia
  const daysData = useMemo(() => {
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

      const aderenciaFat = pmtVal > 0 ? (fatVal / pmtVal) * 100 : 0
      const aderenciaLib = pmtVal > 0 ? (libVal / pmtVal) * 100 : 0

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
        aderenciaFat,
        aderenciaLib
      })
    }
    return list
  }, [ano, mes, totalDaysInMonth, metric, matrix, aderencia])

  // Cálculo da escala máxima para o eixo Y
  const maxVal = useMemo(() => {
    let max = 0
    daysData.forEach(d => {
      if (visibleSeries.pmt && d.pmtVal > max) max = d.pmtVal
      if (visibleSeries.liberado && d.libVal > max) max = d.libVal
      if (visibleSeries.faturado && d.fatVal > max) max = d.fatVal
      if (visibleSeries.capacidade && d.capVal > max) max = d.capVal
    })
    return max > 0 ? max * 1.15 : 1000 // 15% de margem no topo para rótulos legíveis
  }, [daysData, visibleSeries])

  // Totais e Projeções do Mês
  const totals = useMemo(() => {
    const totalPmt = daysData.reduce((acc, d) => acc + d.pmtVal, 0)
    const totalLib = daysData.reduce((acc, d) => acc + d.libVal, 0)
    const totalFat = daysData.reduce((acc, d) => acc + d.fatVal, 0)
    const totalCap = daysData.reduce((acc, d) => acc + d.capVal, 0)

    const percLib = totalPmt > 0 ? (totalLib / totalPmt) * 100 : 0
    const percFat = totalPmt > 0 ? (totalFat / totalPmt) * 100 : 0

    // Dias realizados com faturamento
    const daysDone = daysData.filter(d => d.fatVal > 0).length
    const avgFat = daysDone > 0 ? totalFat / daysDone : 0
    const projecao = avgFat * totalDaysInMonth
    const percProjecao = totalPmt > 0 ? (projecao / totalPmt) * 100 : 0

    return {
      totalPmt,
      totalLib,
      totalFat,
      totalCap,
      percLib,
      percFat,
      daysDone,
      avgFat,
      projecao,
      percProjecao
    }
  }, [daysData, totalDaysInMonth])

  // Formatação de valores
  const formatValue = (val: number) => {
    if (metric === 'cubagem') {
      return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' m³'
    }
    return Math.round(val).toLocaleString('pt-BR')
  }

  const formatShort = (val: number) => {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'k'
    return Math.round(val).toString()
  }

  // Divisões do Eixo Y (5 linhas de grade)
  const yAxisTicks = useMemo(() => {
    return [
      maxVal,
      maxVal * 0.75,
      maxVal * 0.5,
      maxVal * 0.25,
      0
    ]
  }, [maxVal])

  return (
    <div className="space-y-6">
      {/* 1. BARRA SUPERIOR: KPI TOKENS & CONTROLES */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                PMT Expedição &bull; PG2
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">
                CD {cd} &bull; Mês {mes.toString().padStart(2, '0')}/{ano}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              Projeções da PMT &bull; Linha do Tempo Diária
            </h2>
          </div>

          {/* Seletor de Métrica (Tabs Modernas) */}
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setMetric('cubagem')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'cubagem'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} className={metric === 'cubagem' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Cubagem (m³)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetric('pedidos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'pedidos'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={14} className={metric === 'pedidos' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Pedidos</span>
            </button>

            <button
              type="button"
              onClick={() => setMetric('pecas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'pecas'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes size={14} className={metric === 'pecas' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Peças</span>
            </button>
          </div>
        </div>

        {/* CARDS RESUMO DE PROJEÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Card PMT */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                PMT Planejado
              </span>
              <span className="text-[10px] text-blue-600 font-mono">Meta</span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatValue(totals.totalPmt)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Meta orçada para o mês</p>
          </div>

          {/* Card Liberado */}
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                Liberado
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-mono">
                {totals.percLib.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-emerald-950 font-mono">
              {formatValue(totals.totalLib)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Carga liberada acumulada</p>
          </div>

          {/* Card Faturado */}
          <div className="p-3.5 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/40 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" />
                Faturado Realizado
              </span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.2 rounded font-mono">
                {totals.percFat.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-sky-950 font-mono">
              {formatValue(totals.totalFat)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Volume faturado até o momento</p>
          </div>

          {/* Card Projeção */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-gradient-to-b from-purple-50/40 to-white">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-purple-600" />
                Projeção Fim de Mês
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-mono">
                {totals.percProjecao.toFixed(1)}% pmt
              </span>
            </div>
            <div className="text-xl font-black text-purple-950 font-mono">
              {formatValue(totals.projecao)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
              <span>Média: {formatShort(totals.avgFat)}/dia</span>
              {totals.totalCap > 0 && (
                <span className="font-bold text-purple-700">Cap: {formatShort(totals.totalCap)}</span>
              )}
            </div>
          </div>
        </div>

        {/* FILTROS INTERATIVOS DE SÉRIES (CHIPS LIGA/DESLIGA) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
              Exibir Séries:
            </span>

            {/* Faturado */}
            <button
              type="button"
              onClick={() => setVisibleSeries(s => ({ ...s, faturado: !s.faturado }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                visibleSeries.faturado
                  ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${visibleSeries.faturado ? 'bg-sky-500' : 'bg-slate-300'}`} />
              <span>Faturado Realizado</span>
            </button>

            {/* Liberado */}
            <button
              type="button"
              onClick={() => setVisibleSeries(s => ({ ...s, liberado: !s.liberado }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                visibleSeries.liberado
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${visibleSeries.liberado ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>Liberado</span>
            </button>

            {/* PMT */}
            <button
              type="button"
              onClick={() => setVisibleSeries(s => ({ ...s, pmt: !s.pmt }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                visibleSeries.pmt
                  ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-xs ${visibleSeries.pmt ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <span>PMT Planejado</span>
            </button>

            {/* Capacidade */}
            <button
              type="button"
              onClick={() => setVisibleSeries(s => ({ ...s, capacidade: !s.capacidade }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                visibleSeries.capacidade
                  ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-4 border-t-2 border-dashed ${visibleSeries.capacidade ? 'border-purple-500' : 'border-slate-300'}`} />
              <span>Meta · Capacidade Operacional</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info size={13} />
            <span>Passe o cursor sobre as colunas para inspecionar os valores e aderência diária.</span>
          </div>
        </div>
      </div>

      {/* 2. CARD DO GRÁFICO PRINCIPAL EM COLUNAS VERTICAIS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Acompanhamento Diário ao Longo do Mês
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Métrica: <strong className="text-blue-700 font-bold">{metric === 'cubagem' ? 'Cubagem (m³)' : metric === 'pedidos' ? 'Pedidos' : 'Peças'}</strong>
          </div>
        </div>

        {/* CONTAINER DO GRÁFICO (EIXO Y + COLUNAS DO MÊS) */}
        <div className="relative h-[420px] flex">
          {/* Eixo Y com Ticks e Rótulos */}
          <div className="w-14 shrink-0 h-[360px] flex flex-col justify-between items-end pr-3 border-r border-slate-200 text-[11px] font-mono text-slate-400 select-none">
            {yAxisTicks.map((tickVal, idx) => (
              <span key={idx} className="leading-none">
                {formatShort(tickVal)}
              </span>
            ))}
          </div>

          {/* Área Plotável com Linhas de Grade e Colunas */}
          <div className="flex-1 h-full relative pl-2 overflow-x-auto custom-scrollbar">
            {/* Linhas de Grade Horizontais */}
            <div className="absolute inset-0 right-0 h-[360px] flex flex-col justify-between pointer-events-none">
              {yAxisTicks.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-full border-b ${idx === yAxisTicks.length - 1 ? 'border-slate-300' : 'border-slate-100 border-dashed'}`} 
                />
              ))}
            </div>

            {/* Colunas dos Dias (Linha do Tempo) */}
            <div className="h-[360px] flex items-end justify-between gap-1 relative z-10 min-w-[700px] pr-2">
              {daysData.map((d) => {
                const heightFat = maxVal > 0 ? (d.fatVal / maxVal) * 100 : 0
                const heightCap = maxVal > 0 ? (d.capVal / maxVal) * 100 : 0

                const isHovered = hoveredDay === d.day
                const hasData = d.fatVal > 0 || d.libVal > 0 || d.pmtVal > 0

                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer transition-all ${
                      isHovered ? 'z-30' : 'z-10'
                    }`}
                  >
                    {/* Tooltip Flutuante no Hover */}
                    {isHovered && (
                      <div className={`absolute top-2 ${d.day > daysData.length / 2 ? 'right-full mr-2' : 'left-full ml-2'} bg-slate-900/95 backdrop-blur text-white rounded-xl p-3 shadow-2xl z-50 border border-slate-700 text-xs min-w-[200px] pointer-events-none animate-in fade-in zoom-in-95 duration-150`}>
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/80">
                          <strong className="text-white font-bold">{d.weekdayName}, {d.dateFormatted}</strong>
                          {d.pmtVal > 0 && d.libVal > 0 && (() => {
                            const aderLib = (d.libVal / d.pmtVal) * 100
                            return (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                aderLib >= 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {aderLib.toFixed(0)}% lib/pmt
                              </span>
                            )
                          })()}
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          {visibleSeries.faturado && (
                            <div className="flex justify-between text-sky-400">
                              <span>Faturado:</span>
                              <strong className="text-white">{formatValue(d.fatVal)}</strong>
                            </div>
                          )}
                          {visibleSeries.liberado && (
                            <div className="flex justify-between text-emerald-400">
                              <span>Liberado:</span>
                              <strong className="text-white">{formatValue(d.libVal)}</strong>
                            </div>
                          )}
                          {visibleSeries.pmt && (
                            <div className="flex justify-between text-blue-400">
                              <span>PMT:</span>
                              <strong className="text-white">{formatValue(d.pmtVal)}</strong>
                            </div>
                          )}
                          {visibleSeries.capacidade && d.capVal > 0 && (
                            <div className="flex justify-between text-purple-400">
                              <span>Capacidade:</span>
                              <strong className="text-white">{formatValue(d.capVal)}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fundo de destaque ao passar o mouse ou finais de semana */}
                    <div 
                      className={`absolute inset-x-0 bottom-0 top-0 rounded-lg pointer-events-none transition-colors ${
                        isHovered 
                          ? 'bg-blue-50/80' 
                          : d.isWeekend 
                            ? 'bg-slate-50/70' 
                            : 'hover:bg-slate-50/50'
                      }`} 
                    />

                    {/* Grupo de Colunas Verticais por Dia */}
                    <div className="w-full h-full flex items-end justify-center gap-0.5 relative z-10 px-0.5">
                      {/* 3. Coluna Faturado (Azul Claro Vibrante com Sombra Suave) */}
                      {visibleSeries.faturado && (
                        <div
                          className="relative w-2 sm:w-2.5 bg-gradient-to-t from-sky-600 to-sky-400 hover:to-sky-300 rounded-t-sm transition-all duration-300 shadow-2xs"
                          style={{ height: `${Math.max(heightFat, hasData ? 1 : 0)}%` }}
                        >
                          {d.fatVal > 0 && isHovered && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 [writing-mode:vertical-rl] rotate-180 text-[8px] font-bold font-mono text-white whitespace-nowrap">
                              {formatShort(d.fatVal)}
                            </span>
                          )}
                        </div>
                      )}

                    </div>

                    {/* 4. Linha de Meta - Capacidade Operacional (Roxo, tracejada) */}
                    {visibleSeries.capacidade && d.capVal > 0 && (
                      <div
                        className="absolute -left-0.5 -right-0.5 z-20 pointer-events-none transition-all duration-300"
                        style={{ bottom: `${heightCap}%` }}
                      >
                        <div className={`w-full border-t-2 border-dashed ${isHovered ? 'border-purple-600' : 'border-purple-500/80'}`} />
                        {isHovered && (
                          <span className="absolute left-1/2 -translate-x-1/2 -top-5 text-[9px] font-bold font-mono text-purple-700 bg-purple-50 border border-purple-200 rounded px-1 whitespace-nowrap">
                            {formatShort(d.capVal)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Linhas PMT Planejado e Liberado (mesma escala das barras) */}
              {maxVal > 0 && ([
                { key: 'pmt', on: visibleSeries.pmt, color: '#2563eb', dot: 'bg-blue-600', get: (d: typeof daysData[number]) => d.pmtVal },
                { key: 'lib', on: visibleSeries.liberado, color: '#10b981', dot: 'bg-emerald-500', get: (d: typeof daysData[number]) => d.libVal },
              ] as const).filter(s => s.on).map(s => {
                const n = daysData.length
                const P = daysData
                  .map((d, i) => ({ d, v: s.get(d), x: ((i + 0.5) / n) * 100 }))
                  .filter(p => p.v > 0)
                  .map(p => ({ ...p, y: 100 - (p.v / maxVal) * 100 }))
                if (P.length < 1) return null
                const path = P.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
                return (
                  <div key={s.key} className="absolute inset-0 pointer-events-none z-20">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d={path} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                    </svg>
                    {P.map(p => (
                      <div key={p.d.day} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                        <div className={`rounded-full ${s.dot} border-2 border-white shadow ${hoveredDay === p.d.day ? 'w-3 h-3' : 'w-2 h-2'} transition-all`} />
                        {hoveredDay === p.d.day && <span
                          className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-black font-mono whitespace-nowrap px-1 rounded shadow-sm bg-white border ${
                            s.key === 'pmt' ? '-top-5 text-blue-700 border-blue-200' : 'top-3 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {formatShort(p.v)}
                        </span>}
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Linha de Aderência (Liberado / PMT %) - curva suavizada */}
              {(() => {
                const n = daysData.length
                const pts = daysData
                  .map((d, i) => ({ d, x: ((i + 0.5) / n) * 100, v: d.pmtVal > 0 && d.libVal > 0 ? (d.libVal / d.pmtVal) * 100 : 0 }))
                  .filter(p => p.v > 0)
                if (pts.length < 2) return null
                const maxAder = Math.max(120, ...pts.map(p => p.v)) * 1.05
                const yOf = (v: number) => 100 - (v / maxAder) * 100
                const P = pts.map(p => ({ ...p, y: yOf(p.v) }))
                let path = `M ${P[0].x} ${P[0].y}`
                for (let i = 0; i < P.length - 1; i++) {
                  const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2
                  const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
                  const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
                  path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
                }
                const y100 = yOf(100)
                return (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Referência 100% */}
                    <div className="absolute left-0 right-0 border-t border-dotted border-red-300" style={{ top: `${y100}%` }}>
                      <span className="absolute right-0 -top-4 text-[9px] font-bold font-mono text-red-400">100%</span>
                    </div>
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d={path} fill="none" stroke="rgba(220,38,38,0.18)" strokeWidth={8} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                      <path d={path} fill="none" stroke="#dc2626" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                    </svg>
                    {P.map(p => {
                      const hov = hoveredDay === p.d.day
                      return (
                        <div key={p.d.day} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                          <div className={`rounded-full bg-white border-2 border-red-600 ${hov ? 'w-3 h-3' : 'w-2 h-2'} transition-all`} />
                          <span className={`absolute left-1/2 -translate-x-1/2 -top-4 text-[9px] font-black font-mono whitespace-nowrap ${
                            p.v >= 100 ? 'text-emerald-600' : 'text-red-600'
                          } ${hov ? 'scale-125' : ''}`}>
                            {p.v.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Eixo X: Dias do Mês e Dia da Semana */}
            <div className="flex items-center justify-between gap-1 min-w-[700px] pt-2 border-t border-slate-300 pr-2">
              {daysData.map((d) => {
                const isHovered = hoveredDay === d.day
                return (
                  <div 
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center justify-center font-mono cursor-pointer"
                  >
                    <span className={`text-[9px] font-bold ${
                      isHovered ? 'text-blue-700' : d.isWeekend ? 'text-amber-600 font-extrabold' : 'text-slate-400'
                    }`}>
                      {d.weekdayLetter}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      isHovered 
                        ? 'text-blue-700 scale-110 font-black' 
                        : d.isWeekend 
                          ? 'text-slate-800' 
                          : 'text-slate-700'
                    }`}>
                      {d.dayStr}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 3. TABELA ANALÍTICA RÁPIDA DE FECHAMENTO DOS DIAS */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Detalhamento dos Dias Realizados
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total de dias com faturamento: <strong className="text-blue-700">{totals.daysDone}</strong> de {totalDaysInMonth}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Dia</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">PMT Planejado</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Liberado</th>
                  <th className="py-2.5 px-3 text-right text-sky-700">Faturado</th>
                  <th className="py-2.5 px-3 text-right text-purple-700">Capacidade</th>
                  <th className="py-2.5 px-3 text-right">Aderência (Fat x PMT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                {daysData.filter(d => d.fatVal > 0 || d.libVal > 0).map((d) => (
                  <tr 
                    key={d.day} 
                    className={`hover:bg-blue-50/40 transition-colors ${d.isWeekend ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="py-2 px-3 font-bold text-slate-800">{d.dateFormatted}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        d.isWeekend ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.weekdayName}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">{formatValue(d.pmtVal)}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-semibold">{formatValue(d.libVal)}</td>
                    <td className="py-2 px-3 text-right text-sky-700 font-bold">{formatValue(d.fatVal)}</td>
                    <td className="py-2 px-3 text-right text-purple-700">{d.capVal > 0 ? formatValue(d.capVal) : '-'}</td>
                    <td className="py-2 px-3 text-right">
                      {d.pmtVal > 0 && d.fatVal > 0 ? (
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${
                          d.aderenciaFat >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.aderenciaFat >= 85
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.aderenciaFat.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
