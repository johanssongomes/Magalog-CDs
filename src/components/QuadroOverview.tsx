import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Layers
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const WEEKDAY_ABBR = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
]

interface SectionData {
  initial: number
  orcado: Record<number, number>
  saidaFerias: Record<number, number>
  retornoFerias: Record<number, number>
  saidas: Record<number, number>
  entradas: Record<number, number>
  comments?: Record<string, string>
}

interface QuadroMedioState {
  op: SectionData
  cd: SectionData
}

function getLastDayQuadroAtual(year: number, month: number, section: 'op' | 'cd'): number | null {
  try {
    const raw = localStorage.getItem(`quadro_medio_data_${year}_${month}`)
    if (!raw) return null
    const parsed: QuadroMedioState = JSON.parse(raw)
    const sec = parsed[section]
    if (!sec) return null

    const days = new Date(year, month + 1, 0).getDate()
    let current = sec.initial || 0

    for (let d = 1; d <= days; d++) {
      const sFerias = sec.saidaFerias[d] ?? 0
      const rFerias = sec.retornoFerias[d] ?? 0
      const saidas = sec.saidas[d] ?? 0
      const entradas = sec.entradas[d] ?? 0
      current = current - sFerias + rFerias + entradas - saidas
    }
    return current
  } catch {
    return null
  }
}

function getInitialForMonth(year: number, month: number, section: 'op' | 'cd', defaultVal: number): number {
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const lastVal = getLastDayQuadroAtual(prevYear, prevMonth, section)
  return lastVal !== null ? lastVal : defaultVal
}

export const QuadroOverview: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'op' | 'cd'>('todos')

  const [data, setData] = useState<QuadroMedioState>(() => {
    try {
      const saved = localStorage.getItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`)
      if (saved) return JSON.parse(saved)
    } catch {}

    const initOp = getInitialForMonth(selectedYear, selectedMonth, 'op', 108)
    const initCd = getInitialForMonth(selectedYear, selectedMonth, 'cd', 44)

    return {
      op: {
        initial: initOp,
        orcado: { 1: 110, 2: 110, 3: 110, 4: 110, 5: 110, 6: 110, 7: 110, 8: 110, 9: 110, 10: 110, 11: 110, 12: 110, 13: 110, 14: 110, 15: 110, 16: 110, 17: 110, 18: 110, 19: 110, 20: 110, 21: 110, 22: 110, 23: 110, 24: 110, 25: 110, 26: 110, 27: 110, 28: 110, 29: 110, 30: 110, 31: 110 },
        saidaFerias: {},
        retornoFerias: {},
        saidas: {},
        entradas: {}
      },
      cd: {
        initial: initCd,
        orcado: { 1: 59, 2: 59, 3: 59, 4: 59, 5: 59, 6: 59, 7: 59, 8: 59, 9: 59, 10: 59, 11: 59, 12: 59, 13: 59, 14: 59, 15: 59, 16: 59, 17: 59, 18: 59, 19: 59, 20: 59, 21: 59, 22: 59, 23: 59, 24: 59, 25: 59, 26: 59, 27: 59, 28: 59, 29: 59, 30: 59, 31: 59 },
        saidaFerias: {},
        retornoFerias: {},
        saidas: {},
        entradas: {}
      }
    }
  })

  // Carrega do Supabase e sincroniza em tempo real
  useEffect(() => {
    let isCancelled = false
    const remoteKey = `_quadro_medio_${selectedYear}_${selectedMonth}`

    const loadData = async () => {
      // 1. LocalStorage
      try {
        const saved = localStorage.getItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`)
        if (saved) setData(JSON.parse(saved))
      } catch {}

      // 2. Supabase
      try {
        const { data: dbRows, error } = await supabase
          .from('performance_metrics')
          .select('cell_key, value')
          .eq('cell_key', remoteKey)
          .maybeSingle()

        if (!error && dbRows && dbRows.value && !isCancelled) {
          const parsed = JSON.parse(dbRows.value)
          setData(parsed)
          localStorage.setItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`, dbRows.value)
        }
      } catch {}
    }

    loadData()

    // Realtime listener
    const channel = supabase
      .channel(`quadro_overview_sync_${selectedYear}_${selectedMonth}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_metrics' },
        (payload: any) => {
          const row = payload.new
          if (row && row.cell_key === remoteKey && row.value) {
            try {
              const incoming = JSON.parse(row.value)
              setData(incoming)
              localStorage.setItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`, row.value)
            } catch {}
          }
        }
      )
      .subscribe()

    return () => {
      isCancelled = true
      supabase.removeChannel(channel)
    }
  }, [selectedMonth, selectedYear])

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }, [selectedMonth, selectedYear])

  const daysList = useMemo(() => {
    const list = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, selectedMonth, d)
      list.push({
        day: d,
        weekday: WEEKDAY_ABBR[date.getDay()]
      })
    }
    return list
  }, [daysInMonth, selectedMonth, selectedYear])

  const calculateProgression = (section: 'op' | 'cd') => {
    const sec = data[section]
    const quadroAtualByDay: Record<number, number> = {}
    const gapByDay: Record<number, number> = {}

    let current = sec.initial || 0

    for (let d = 1; d <= daysInMonth; d++) {
      const orcado = sec.orcado[d] ?? 0
      const sFerias = sec.saidaFerias[d] ?? 0
      const rFerias = sec.retornoFerias[d] ?? 0
      const saidas = sec.saidas[d] ?? 0
      const entradas = sec.entradas[d] ?? 0

      current = current - sFerias + rFerias + entradas - saidas
      quadroAtualByDay[d] = current
      gapByDay[d] = current - orcado
    }

    let sumOrcado = 0
    let countOrcado = 0
    for (let d = 1; d <= daysInMonth; d++) {
      if (sec.orcado[d] !== undefined) {
        sumOrcado += sec.orcado[d]
        countOrcado++
      }
    }
    const mediaOrcado = countOrcado > 0 ? Math.round(sumOrcado / countOrcado) : 0

    let sumAtual = 0
    for (let d = 1; d <= daysInMonth; d++) {
      sumAtual += quadroAtualByDay[d]
    }
    const mediaAtual = daysInMonth > 0 ? (sumAtual / daysInMonth).toFixed(1).replace('.', ',') : '0,0'

    let sumGap = 0
    for (let d = 1; d <= daysInMonth; d++) {
      sumGap += gapByDay[d]
    }
    const mediaGap = daysInMonth > 0 ? Math.round(sumGap / daysInMonth) : 0

    // Último dia com valor preenchido ou dia atual
    const today = new Date().getDate()
    const validDay = Math.min(today, daysInMonth)
    const currentDayVal = quadroAtualByDay[validDay] ?? current
    const currentDayGap = gapByDay[validDay] ?? (current - (sec.orcado[validDay] ?? 0))

    return {
      quadroAtualByDay,
      gapByDay,
      mediaOrcado,
      mediaAtual,
      mediaGap,
      currentDayVal,
      currentDayGap
    }
  }

  const opCalc = useMemo(() => calculateProgression('op'), [data.op, daysInMonth])
  const cdCalc = useMemo(() => calculateProgression('cd'), [data.cd, daysInMonth])

  // Consolidado Geral (OP + C&D)
  const totalOrcadoMedia = opCalc.mediaOrcado + cdCalc.mediaOrcado
  const totalAtualMedia = (
    parseFloat(opCalc.mediaAtual.replace(',', '.')) +
    parseFloat(cdCalc.mediaAtual.replace(',', '.'))
  ).toFixed(1).replace('.', ',')
  const totalGapMedia = opCalc.mediaGap + cdCalc.mediaGap

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* CARDS RESUMO EXECUTIVO OP & C&D */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* CARD OP */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                OP
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Quadro OP (Operacional)</h4>
                <p className="text-[10px] text-slate-400 font-medium">Equipe Direta de Operações</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Mês: {MONTH_NAMES[selectedMonth].substring(0, 3)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Orçado (Méd)</span>
              <span className="text-base font-black text-slate-800">{opCalc.mediaOrcado}</span>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Atual (Méd)</span>
              <span className="text-base font-black text-slate-900">{opCalc.mediaAtual}</span>
            </div>
            <div className={`p-2 rounded-xl ${opCalc.mediaGap < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <span className="text-[9.5px] font-bold uppercase tracking-tight block">Gap Médio</span>
              <span className="text-base font-black flex items-center justify-center gap-0.5">
                {opCalc.mediaGap > 0 ? `+${opCalc.mediaGap}` : opCalc.mediaGap}
              </span>
            </div>
          </div>
        </div>

        {/* CARD C&D */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                C&D
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Quadro C&D</h4>
                <p className="text-[10px] text-slate-400 font-medium">Carga e Descarga</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Mês: {MONTH_NAMES[selectedMonth].substring(0, 3)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Orçado (Méd)</span>
              <span className="text-base font-black text-slate-800">{cdCalc.mediaOrcado}</span>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Atual (Méd)</span>
              <span className="text-base font-black text-slate-900">{cdCalc.mediaAtual}</span>
            </div>
            <div className={`p-2 rounded-xl ${cdCalc.mediaGap < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <span className="text-[9.5px] font-bold uppercase tracking-tight block">Gap Médio</span>
              <span className="text-base font-black flex items-center justify-center gap-0.5">
                {cdCalc.mediaGap > 0 ? `+${cdCalc.mediaGap}` : cdCalc.mediaGap}
              </span>
            </div>
          </div>
        </div>

        {/* CARD CONSOLIDADO TOTAL */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Quadro Total (OP + C&D)</h4>
                <p className="text-[10px] text-slate-400 font-medium">Visão Geral Consolidada</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {MONTH_NAMES[selectedMonth].substring(0, 3)} / {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Orçado Total</span>
              <span className="text-base font-black text-slate-800">{totalOrcadoMedia}</span>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-xl">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight block">Atual Médio</span>
              <span className="text-base font-black text-slate-900">{totalAtualMedia}</span>
            </div>
            <div className={`p-2 rounded-xl ${totalGapMedia < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <span className="text-[9.5px] font-bold uppercase tracking-tight block">Gap Total</span>
              <span className="text-base font-black flex items-center justify-center gap-0.5">
                {totalGapMedia > 0 ? `+${totalGapMedia}` : totalGapMedia}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE ACOMPANHAMENTO DIÁRIO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra superior */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Acompanhamento Diário de Quadro — OP e C&D
            </h3>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              (Orçado vs Atual vs Gap)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Visão */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedFilter('todos')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  selectedFilter === 'todos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('op')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  selectedFilter === 'op'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                OP
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('cd')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  selectedFilter === 'cd'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                C&D
              </button>
            </div>

            {/* Navegador de Mês */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={prevMonth}
                title="Mês anterior"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold text-slate-700 px-2 min-w-[110px] text-center select-none">
                {MONTH_NAMES[selectedMonth]} / {selectedYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                title="Próximo mês"
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Grade de dias com scroll horizontal */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold">
                <th className="sticky left-0 z-30 bg-slate-50 px-3 py-2 text-left font-extrabold border-r border-slate-200 min-w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Estrutura / Indicador
                </th>
                {daysList.map((d) => (
                  <th key={`hd-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-200 min-w-[38px]">
                    <div className="text-[9px] text-slate-400 font-mono leading-none">{d.weekday}</div>
                    <div className="text-xs font-extrabold text-slate-800">{d.day}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center border-r border-slate-200 min-w-[65px] bg-slate-100/80 text-slate-800 font-extrabold">
                  Média
                </th>
              </tr>
            </thead>
            <tbody>
              {/* SEÇÃO OP */}
              {(selectedFilter === 'todos' || selectedFilter === 'op') && (
                <>
                  <tr className="bg-blue-900 text-white font-black text-xs">
                    <td colSpan={daysList.length + 2} className="px-3 py-1.5 tracking-wider uppercase">
                      NOVEMBRO — OP (Operacional)
                    </td>
                  </tr>

                  {/* Orçado OP */}
                  <tr className="border-b border-slate-200/80 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-700 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Quadro Orçado
                    </td>
                    {daysList.map((d) => {
                      const val = data.op.orcado[d.day]
                      return (
                        <td key={`op-orc-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-100 font-mono text-slate-700">
                          {val ?? '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1 text-center border-r border-slate-200 font-mono font-bold text-slate-900 bg-slate-50">
                      {opCalc.mediaOrcado}
                    </td>
                  </tr>

                  {/* Atual OP */}
                  <tr className="border-b border-slate-200/80 bg-blue-50/20 hover:bg-blue-50/40">
                    <td className="sticky left-0 z-20 bg-blue-50/30 px-3 py-1.5 font-bold text-blue-950 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Quadro Atual
                    </td>
                    {daysList.map((d) => {
                      const val = opCalc.quadroAtualByDay[d.day]
                      return (
                        <td key={`op-at-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-100 font-mono font-semibold text-slate-900">
                          {val !== undefined ? val.toFixed(1).replace('.0', '') : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1 text-center border-r border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/60">
                      {opCalc.mediaAtual}
                    </td>
                  </tr>

                  {/* Gap OP */}
                  <tr className="border-b-2 border-slate-300 bg-slate-50/50">
                    <td className="sticky left-0 z-20 bg-slate-50 px-3 py-1.5 font-bold text-slate-800 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Gap (Atual - Orçado)
                    </td>
                    {daysList.map((d) => {
                      const gap = opCalc.gapByDay[d.day]
                      const isNegative = gap !== undefined && gap < 0
                      const isPositive = gap !== undefined && gap > 0
                      return (
                        <td
                          key={`op-gap-${d.day}`}
                          className={`px-1.5 py-1 text-center border-r border-slate-100 font-mono font-bold ${
                            isNegative
                              ? 'bg-rose-100/70 text-rose-700'
                              : isPositive
                              ? 'bg-emerald-100/70 text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {gap !== undefined ? (gap > 0 ? `+${gap}` : gap) : '-'}
                        </td>
                      )
                    })}
                    <td
                      className={`px-2 py-1 text-center border-r border-slate-200 font-mono font-bold ${
                        opCalc.mediaGap < 0 ? 'bg-rose-200/60 text-rose-800' : 'bg-emerald-200/60 text-emerald-800'
                      }`}
                    >
                      {opCalc.mediaGap > 0 ? `+${opCalc.mediaGap}` : opCalc.mediaGap}
                    </td>
                  </tr>
                </>
              )}

              {/* SEÇÃO C&D */}
              {(selectedFilter === 'todos' || selectedFilter === 'cd') && (
                <>
                  <tr className="bg-[#4a1525] text-white font-black text-xs">
                    <td colSpan={daysList.length + 2} className="px-3 py-1.5 tracking-wider uppercase">
                      NOVEMBRO — C&D (Carga e Descarga)
                    </td>
                  </tr>

                  {/* Orçado C&D */}
                  <tr className="border-b border-slate-200/80 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-700 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Quadro Orçado
                    </td>
                    {daysList.map((d) => {
                      const val = data.cd.orcado[d.day]
                      return (
                        <td key={`cd-orc-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-100 font-mono text-slate-700">
                          {val ?? '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1 text-center border-r border-slate-200 font-mono font-bold text-slate-900 bg-slate-50">
                      {cdCalc.mediaOrcado}
                    </td>
                  </tr>

                  {/* Atual C&D */}
                  <tr className="border-b border-slate-200/80 bg-purple-50/20 hover:bg-purple-50/40">
                    <td className="sticky left-0 z-20 bg-purple-50/30 px-3 py-1.5 font-bold text-purple-950 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Quadro Atual
                    </td>
                    {daysList.map((d) => {
                      const val = cdCalc.quadroAtualByDay[d.day]
                      return (
                        <td key={`cd-at-${d.day}`} className="px-1.5 py-1 text-center border-r border-slate-100 font-mono font-semibold text-slate-900">
                          {val !== undefined ? val.toFixed(1).replace('.0', '') : '-'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1 text-center border-r border-slate-200 font-mono font-bold text-purple-900 bg-purple-50/60">
                      {cdCalc.mediaAtual}
                    </td>
                  </tr>

                  {/* Gap C&D */}
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <td className="sticky left-0 z-20 bg-slate-50 px-3 py-1.5 font-bold text-slate-800 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Gap (Atual - Orçado)
                    </td>
                    {daysList.map((d) => {
                      const gap = cdCalc.gapByDay[d.day]
                      const isNegative = gap !== undefined && gap < 0
                      const isPositive = gap !== undefined && gap > 0
                      return (
                        <td
                          key={`cd-gap-${d.day}`}
                          className={`px-1.5 py-1 text-center border-r border-slate-100 font-mono font-bold ${
                            isNegative
                              ? 'bg-rose-100/70 text-rose-700'
                              : isPositive
                              ? 'bg-emerald-100/70 text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {gap !== undefined ? (gap > 0 ? `+${gap}` : gap) : '-'}
                        </td>
                      )
                    })}
                    <td
                      className={`px-2 py-1 text-center border-r border-slate-200 font-mono font-bold ${
                        cdCalc.mediaGap < 0 ? 'bg-rose-200/60 text-rose-800' : 'bg-emerald-200/60 text-emerald-800'
                      }`}
                    >
                      {cdCalc.mediaGap > 0 ? `+${cdCalc.mediaGap}` : cdCalc.mediaGap}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default QuadroOverview
