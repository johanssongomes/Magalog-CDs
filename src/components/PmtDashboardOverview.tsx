import React from 'react'
import { TrendingUp, Package, Layers, Boxes, Truck, CheckCircle2 } from 'lucide-react'

// Dados visuais consolidados da visão PMT (Outubro 2026 - CD 994)
const DAYS_DATA = [
  { day: 1, w: 'Q', pmt: 614, lib: 638, aderLib: 103.9, fat: 448, cap: 1000, aderFat: 44.8 },
  { day: 2, w: 'S', pmt: 621, lib: 599, aderLib: 96.5, fat: 648, cap: 1000, aderFat: 64.8 },
  { day: 3, w: 'S', pmt: 628, lib: 566, aderLib: 90.1, fat: 565, cap: 1000, aderFat: 56.5 },
  { day: 4, w: 'D', pmt: 323, lib: 161, aderLib: 49.9, fat: 0, cap: 0, aderFat: null },
  { day: 5, w: 'S', pmt: 714, lib: 629, aderLib: 88.1, fat: 598, cap: 1000, aderFat: 59.8 },
  { day: 6, w: 'T', pmt: 734, lib: 755, aderLib: 102.8, fat: 726, cap: 1000, aderFat: 72.6 },
  { day: 7, w: 'Q', pmt: 767, lib: 827, aderLib: 107.8, fat: 685, cap: 1000, aderFat: 68.5 },
  { day: 8, w: 'Q', pmt: 774, lib: 953, aderLib: 123.1, fat: 853, cap: 1000, aderFat: 85.3 },
  { day: 9, w: 'S', pmt: 804, lib: 841, aderLib: 104.6, fat: 850, cap: 1000, aderFat: 85.0 },
  { day: 10, w: 'S', pmt: 860, lib: 957, aderLib: 111.3, fat: 890, cap: 1000, aderFat: 89.0 },
  { day: 11, w: 'D', pmt: 420, lib: 457, aderLib: 108.8, fat: 217, cap: 0, aderFat: null },
  { day: 12, w: 'S', pmt: 592, lib: 609, aderLib: 102.9, fat: 578, cap: 1000, aderFat: 57.8 },
  { day: 13, w: 'T', pmt: 696, lib: 726, aderLib: 104.3, fat: 840, cap: 1000, aderFat: 84.0 },
  { day: 14, w: 'Q', pmt: 718, lib: 586, aderLib: 81.6, fat: 833, cap: 1000, aderFat: 83.3 },
  { day: 15, w: 'Q', pmt: 738, lib: 717, aderLib: 97.2, fat: 727, cap: 1000, aderFat: 72.7 },
  { day: 16, w: 'S', pmt: 724, lib: 609, aderLib: 84.1, fat: 735, cap: 1000, aderFat: 73.5 },
  { day: 17, w: 'S', pmt: 690, lib: 649, aderLib: 94.1, fat: 672, cap: 1000, aderFat: 67.2 },
  { day: 18, w: 'D', pmt: 400, lib: 468, aderLib: 116.9, fat: 281, cap: 0, aderFat: null },
  { day: 19, w: 'S', pmt: 796, lib: 594, aderLib: 74.7, fat: 714, cap: 1000, aderFat: 71.4 },
  { day: 20, w: 'T', pmt: 659, lib: 630, aderLib: 95.6, fat: 763, cap: 1000, aderFat: 76.3 },
  { day: 21, w: 'Q', pmt: 654, lib: 658, aderLib: 100.6, fat: 682, cap: 1000, aderFat: 68.2 },
  { day: 22, w: 'Q', pmt: 657, lib: 667, aderLib: 101.5, fat: 676, cap: 1000, aderFat: 67.6 },
  { day: 23, w: 'S', pmt: 656, lib: 598, aderLib: 91.2, fat: 770, cap: 1000, aderFat: 77.0 },
  { day: 24, w: 'S', pmt: 613, lib: 546, aderLib: 89.1, fat: 583, cap: 1000, aderFat: 58.3 },
  { day: 25, w: 'D', pmt: 351, lib: 297, aderLib: 84.5, fat: 0, cap: 0, aderFat: null },
  { day: 26, w: 'S', pmt: 626, lib: 561, aderLib: 89.6, fat: 738, cap: 1000, aderFat: 73.8 },
  { day: 27, w: 'T', pmt: 598, lib: 786, aderLib: 133.2, fat: 665, cap: 1000, aderFat: 66.5 },
  { day: 28, w: 'Q', pmt: 627, lib: 644, aderLib: 102.7, fat: 708, cap: 1000, aderFat: 70.8 },
  { day: 29, w: 'Q', pmt: 751, lib: 537, aderLib: 71.5, fat: 459, cap: 1000, aderFat: 45.9 },
  { day: 30, w: 'S', pmt: 716, lib: 0, aderLib: 0.0, fat: 0, cap: 1000, aderFat: 0.0 },
  { day: 31, w: 'S', pmt: 651, lib: 0, aderLib: 0.0, fat: 0, cap: 1000, aderFat: 0.0 }
]

export const PmtDashboardOverview: React.FC = () => {
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">84.2%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">R$ 120.3M</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">84.0%</span>
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
              <span className="font-bold font-mono text-amber-700">R$ 128.5M (90.0%)</span>
            </div>
          </div>
        </div>

        {/* CARD 2: VOLUME DE PEÇAS */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volume de Peças</span>
              <Package size={15} className="text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-blue-600 tracking-tight">200.570</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">96.9% lib.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Peças planejadas para 10/2026</p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Liberado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-800">194.319</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">96.9%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">196.884</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">98.1%</span>
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
              <span className="font-bold font-mono text-emerald-700">207.710 (103.6%)</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL DE PEDIDOS */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total de Pedidos</span>
              <Layers size={15} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">55.754</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">95.9% lib.</span>
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">95.9%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">52.053</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">93.4%</span>
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
              <span className="font-bold font-mono text-emerald-700">57.178 (102.5%)</span>
            </div>
          </div>
        </div>

        {/* CARD 4: CUBAGEM TOTAL */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cubagem Total (m³)</span>
              <CheckCircle2 size={15} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">20.160 m³</div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">90.6% lib.</span>
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">90.6%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Faturado:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-amber-800">17.883 m³</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">88.7%</span>
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
              <span className="font-bold font-mono text-emerald-700">19.523 m³ (96.8%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABELA MATRIZ DIÁRIA PMT (CUBAGEM) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Acompanhamento Diário de Cubagem — Planejado vs Realizado vs Capacidade
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            Outubro / 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            {/* CABEÇALHO */}
            <thead>
              <tr className="bg-sky-50/90 text-slate-700 border-b border-slate-200 font-bold">
                <th className="sticky left-0 z-30 bg-sky-50 px-3 py-2 text-left font-extrabold border-r border-slate-200 min-w-[210px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  Data / Indicador
                </th>
                {DAYS_DATA.map((d) => (
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
              {/* LINHA 1: CUBAGEM TT (PMT PLANEJADO) */}
              <tr className="bg-sky-50/30 hover:bg-sky-50/60 transition-colors">
                <td className="sticky left-0 z-20 bg-sky-50/80 px-3 py-1.5 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans">
                  Cubagem TT (PMT Planejado)
                </td>
                {DAYS_DATA.map((d) => (
                  <td key={`pmt-${d.day}`} className="px-1 py-1.5 text-center border-r border-slate-100 text-slate-700">
                    {formatNum(d.pmt)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-slate-800 bg-slate-50/60 border-r border-slate-200">
                  650
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-slate-900 bg-slate-50/60">
                  20.164
                </td>
              </tr>

              {/* LINHA 2: LIBERADO (CUBAGEM) */}
              <tr className="bg-emerald-50/60 hover:bg-emerald-50 transition-colors">
                <td className="sticky left-0 z-20 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-900 border-r border-emerald-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Liberado (Cubagem)
                </td>
                {DAYS_DATA.map((d) => (
                  <td key={`lib-${d.day}`} className="px-1 py-1.5 text-center border-r border-emerald-100 font-bold text-emerald-900">
                    {formatNum(d.lib)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-emerald-900 bg-emerald-100/40 border-r border-emerald-200">
                  630
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-emerald-900 bg-emerald-100/40">
                  18.263
                </td>
              </tr>

              {/* LINHA 3: % ADERÊNCIA LIBERAÇÃO */}
              <tr className="bg-white hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans pl-6">
                  % Aderência Liberação
                </td>
                {DAYS_DATA.map((d) => {
                  const p = formatPerc(d.aderLib)
                  return (
                    <td key={`aderLib-${d.day}`} className={`px-0.5 py-1.5 text-center border-r border-slate-100 text-[10.5px] ${p.color}`}>
                      {p.text}
                    </td>
                  )
                })}
                <td className="px-2 py-1.5 text-center font-bold text-emerald-700 bg-slate-50/60 border-r border-slate-200 text-[10.5px]">
                  97%
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-emerald-700 bg-slate-50/60 text-[10.5px]">
                  91%
                </td>
              </tr>

              {/* LINHA 4: FATURADO (CUBAGEM) */}
              <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                <td className="sticky left-0 z-20 bg-amber-50/80 px-3 py-1.5 font-bold text-amber-900 border-r border-amber-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Faturado (Cubagem)
                </td>
                {DAYS_DATA.map((d) => (
                  <td key={`fat-${d.day}`} className="px-1 py-1.5 text-center border-r border-amber-100 font-bold text-amber-900">
                    {formatNum(d.fat)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-amber-900 bg-amber-100/40 border-r border-amber-200">
                  662
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-amber-900 bg-amber-100/40">
                  17.885
                </td>
              </tr>

              {/* LINHA 5: CAPACIDADE (CUBAGEM) */}
              <tr className="bg-slate-50/60 hover:bg-slate-100/60 transition-colors">
                <td className="sticky left-0 z-20 bg-slate-100/90 px-3 py-1.5 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  Capacidade (Cubagem)
                </td>
                {DAYS_DATA.map((d) => (
                  <td key={`cap-${d.day}`} className="px-1 py-1.5 text-center border-r border-slate-200 text-slate-700 font-semibold">
                    {d.cap > 0 ? '1.000' : '0'}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-bold text-slate-800 bg-slate-100 border-r border-slate-200">
                  1.000
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-slate-900 bg-slate-100">
                  27.000
                </td>
              </tr>

              {/* LINHA 6: % ADERÊNCIA FAT. X CAPACIDADE */}
              <tr className="bg-white hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-20 bg-white px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)] font-sans pl-6">
                  % Aderência Fat. x Capacidade
                </td>
                {DAYS_DATA.map((d) => {
                  const p = formatPerc(d.aderFat)
                  return (
                    <td key={`aderFat-${d.day}`} className={`px-0.5 py-1.5 text-center border-r border-slate-100 text-[10.5px] ${p.color}`}>
                      {p.text}
                    </td>
                  )
                })}
                <td className="px-2 py-1.5 text-center font-bold text-amber-700 bg-slate-50/60 border-r border-slate-200 text-[10.5px]">
                  66%
                </td>
                <td className="px-2 py-1.5 text-center font-extrabold text-amber-700 bg-slate-50/60 text-[10.5px]">
                  66%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

