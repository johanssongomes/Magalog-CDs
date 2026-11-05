import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard, Package, User, Settings, Home, Clock, AlertTriangle, BarChart3, Timer,
  Bell, CheckCircle2, Info, Boxes, Truck, Warehouse, Wrench, Users, DollarSign, CalendarDays,
  TrendingUp, TrendingDown, MessageSquareWarning, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PmtDashboardOverview } from './PmtDashboardOverview'
import { QuadroOverview } from './QuadroOverview'
import initialAderenciaOct from '../data/initialAderencia202610.json'
import { getAderenciaData, type AderenciaDataState } from '../lib/aderenciaService'

// =====================================================================
// Painel visual (dados estáticos / mock) — integração de números futura
// =====================================================================

const performanceData = [
  { label: 'Seg', date: '27/10', demanda: 440, realizado: 450 },
  { label: 'Ter', date: '28/10', demanda: 490, realizado: 500 },
  { label: 'Qua', date: '29/10', demanda: 510, realizado: 520 },
  { label: 'Qui', date: '30/10', demanda: 560, realizado: 570 },
  { label: 'Sex', date: '31/10', demanda: 550, realizado: 560 }
]
const CAPACIDADE = 640

const turnoData = [
  { turno: '1º Turno', realizado: 520, meta: 500 },
  { turno: '2º Turno', realizado: 460, meta: 460 },
  { turno: '3º Turno', realizado: 390, meta: 400 }
]

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-xl bg-white border border-slate-200/90 shadow-2xs ${className}`}>{children}</div>
)

const CardTitle: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
      <span className="text-slate-500">{icon}</span>
      {title}
    </h3>
    {right}
  </div>
)

// ---------------- KPI Cards (Compactos) ----------------
const parseNumericValue = (val: string): number | null => {
  if (!val) return null
  const cleaned = val.replace(/[^0-9,.-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const getMetaValueColor = (
  valStr: string,
  metaTiers?: { label: string; ating: string; dotColor: string }[]
): string => {
  const num = parseNumericValue(valStr)
  if (num === null || !metaTiers || metaTiers.length === 0) {
    return 'text-slate-900'
  }

  // Avalia as regras das faixas de meta (metaTiers)
  for (const t of metaTiers) {
    const tierNum = parseNumericValue(t.label)
    if (tierNum === null) continue

    const isGte = t.label.includes('>=') || t.label.includes('>')
    const isLte = t.label.includes('<=') || t.label.includes('<')

    let matched = false
    if (isGte) {
      matched = num >= tierNum
    } else if (isLte) {
      matched = num <= tierNum
    }

    if (matched) {
      if (t.dotColor.includes('rose') || t.dotColor.includes('red')) {
        return 'text-rose-600'
      }
      if (t.dotColor.includes('amber') || t.dotColor.includes('yellow')) {
        return 'text-amber-600'
      }
      if (t.dotColor.includes('blue')) {
        return 'text-blue-600'
      }
      if (t.dotColor.includes('emerald') || t.dotColor.includes('green')) {
        return 'text-emerald-600'
      }
    }
  }

  return 'text-rose-600'
}

const KpiNs: React.FC<{
  icon: React.ReactNode
  title: string
  value: string
  meta: string
  tone: string
  items: [string, string, string?][]
  metaTiers?: { label: string; ating: string; dotColor: string }[]
}> = ({ icon, title, value, meta, tone, items, metaTiers }) => {
  const valueColor = getMetaValueColor(value, metaTiers)

  return (
    <Card className="relative group p-2 h-[74px] flex items-center justify-between gap-1.5 min-w-0 transition-all hover:shadow-md">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-7 h-7 rounded-lg ${tone} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">{title}</p>
          <p className={`text-lg font-black leading-none my-0.5 ${valueColor}`}>{value}</p>

          {/* Badge da Meta mantido no padrão suave */}
          {metaTiers && metaTiers.length > 0 ? (
            <div className="relative inline-block">
              <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 leading-none cursor-pointer transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {meta}
              </span>

              {/* Popover posicionado abaixo do card (top-full mt-2) com seta para não ser cortado no topo da tela */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-48 p-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 text-[10px] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                {/* Triângulo indicador / Seta apontando para o badge */}
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-900 border-l border-t border-slate-700/80 rotate-45" />

                <div className="font-bold text-[9px] text-slate-300 uppercase tracking-wider pb-1.5 mb-1.5 border-b border-slate-700/80 flex items-center justify-between relative z-10">
                  <span>Faixas de Atingimento</span>
                  <span className="text-[8px] text-slate-400">Meta</span>
                </div>
                <div className="space-y-1.5 relative z-10">
                  {metaTiers.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1.5 text-slate-200 text-[10px]">
                        <span className={`w-2 h-2 rounded-full ${t.dotColor} shrink-0`} />
                        {t.label}
                      </span>
                      <span className="font-extrabold text-emerald-400 text-[10px]">{t.ating}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[8.5px] text-slate-400 mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between relative z-10">
                  <span>Realizado atual:</span>
                  <strong className="text-white font-mono">{value}</strong>
                </div>
              </div>
            </div>
          ) : (
            <span className="inline-block text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 leading-none">
              {meta}
            </span>
          )}
        </div>
      </div>
      <div className={`shrink-0 pl-1.5 border-l border-slate-100 ${items.length > 3 ? 'text-[7.5px] space-y-[1px]' : 'text-[8.5px] space-y-0.5'}`}>
        {items.map(([k, v, dt]) => {
          const itemNum = parseNumericValue(v)
          // Se houver faixas de meta (metaTiers), avalia a cor de cada subindicador
          let itemColor = 'text-emerald-600'
          if (metaTiers && metaTiers.length > 0 && itemNum !== null) {
            for (const t of metaTiers) {
              const tierNum = parseNumericValue(t.label)
              if (tierNum === null) continue
              const isGte = t.label.includes('>=') || t.label.includes('>')
              const isLte = t.label.includes('<=') || t.label.includes('<')
              let matched = false
              if (isGte) matched = itemNum >= tierNum
              else if (isLte) matched = itemNum <= tierNum
              if (matched) {
                if (t.dotColor.includes('rose') || t.dotColor.includes('red')) itemColor = 'text-rose-600 font-bold'
                else if (t.dotColor.includes('amber') || t.dotColor.includes('yellow')) itemColor = 'text-amber-600 font-bold'
                else if (t.dotColor.includes('blue')) itemColor = 'text-blue-600 font-bold'
                else itemColor = 'text-emerald-600 font-bold'
                break
              }
            }
          }

          return (
            <div key={k} className="flex items-center justify-between gap-1 leading-none">
              <span className="text-slate-400 font-medium">{k}</span>
              <div className="flex items-center gap-1">
                {dt && (
                  <span className="text-[6.5px] text-slate-400 font-mono scale-90 -mr-0.5" title={`Atualizado em ${dt}`}>
                    {dt}
                  </span>
                )}
                <span className={itemColor}>{v}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const KpiSimple: React.FC<{
  icon?: React.ReactNode
  title: string
  value: string
  badge?: string
  badgeTone?: string
  tone?: string
}> = ({
  icon,
  title,
  value,
  badge,
  badgeTone = 'bg-emerald-50 text-emerald-700 border-emerald-100',
  tone = 'bg-slate-50 text-slate-500'
}) => (
    <Card className="p-2 h-[74px] flex items-center gap-2 min-w-0">
      {icon && (
        <div className={`w-7 h-7 rounded-lg ${tone} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">{title}</p>
        <div className="flex items-baseline gap-1.5 my-0.5 flex-wrap">
          <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        </div>
        {badge && (
          <span className={`inline-block text-[8px] font-bold px-1 py-0.2 rounded border ${badgeTone} leading-none`}>
            {badge}
          </span>
        )}
      </div>
    </Card>
  )

const KpiAtendimento: React.FC<{
  data: {
    recDiario: string
    recMes: string
    backlog: string
    chamados: string
    npsLojas: string
  }
}> = ({ data }) => {
  // Lógica de cores por meta dos indicadores de Atendimento:
  // % Reclamações (Diário): < 1,5% verde, > 1,5% vermelho
  const recDiaNum = parseNumericValue(data.recDiario)
  const recDiaColor = recDiaNum === null ? 'text-slate-800' : (recDiaNum < 1.5 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold')

  // % Reclamações (Mês): < 1,5% verde, > 1,5% vermelho
  const recMesNum = parseNumericValue(data.recMes)
  const recMesColor = recMesNum === null ? 'text-slate-800' : (recMesNum < 1.5 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold')

  // Backlog Zendesk: = 0 verde, > 0 vermelho
  const backlogNum = parseNumericValue(data.backlog)
  const backlogColor = backlogNum === null ? 'text-slate-800' : (backlogNum === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold')

  // Chamados de Loja: = 0 verde, > 0 vermelho
  const chamadosNum = parseNumericValue(data.chamados)
  const chamadosColor = chamadosNum === null ? 'text-slate-800' : (chamadosNum === 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold')

  // NPS Lojas: >= 80% verde, < 80% vermelho
  const npsNum = parseNumericValue(data.npsLojas)
  const npsColor = npsNum === null ? 'text-slate-800' : (npsNum >= 80 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold')

  return (
    <Card className="p-2 h-[74px] flex flex-col justify-between min-w-0 hover:shadow-md transition-all">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <MessageSquareWarning size={12} />
        </div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">Atendimento</p>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] leading-none pt-0.5 border-t border-slate-100">
        <div className="flex justify-between text-slate-500">
          <span className="truncate">Recl. (Dia)</span>
          <span className={`ml-1 ${recDiaColor}`}>{data.recDiario}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span className="truncate">Backlog</span>
          <span className={`ml-1 ${backlogColor}`}>{data.backlog}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span className="truncate">Recl. (Mês)</span>
          <span className={`ml-1 ${recMesColor}`}>{data.recMes}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span className="truncate">Chamados</span>
          <span className={`ml-1 ${chamadosColor}`}>{data.chamados}</span>
        </div>
        <div className="flex justify-between text-slate-500 col-span-2 pt-0.5 border-t border-slate-50">
          <span className="truncate">NPS Lojas</span>
          <span className={`ml-1 ${npsColor}`}>{data.npsLojas}</span>
        </div>
      </div>
    </Card>
  )
}

// ---------------- Charts (SVG puro) ----------------
export interface OperationalPerformanceDay {
  dayStr: string
  label: string
  date: string
  faturado: number
  liberado: number
  capacidade: number
}

interface PerformanceChartProps {
  data: OperationalPerformanceDay[]
  metric: 'cubagem' | 'pecas' | 'pedidos'
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, metric }) => {
  const W = 520, H = 200, padL = 46, padB = 34, padT = 16
  const innerW = W - padL - 12
  const innerH = H - padB - padT

  // Encontrar valor máximo para escala Y com folga de 15%
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.faturado, d.liberado, d.capacidade)),
    10
  )
  const maxY = Math.ceil((maxVal * 1.15) / 100) * 100 || 1000

  const y = (v: number) => padT + innerH - (Math.min(Math.max(v, 0), maxY) / maxY) * innerH
  const step = innerW / Math.max(data.length, 1)
  const bw = Math.min(step * 0.32, 18)

  const ticks = [0, Math.round(maxY * 0.33), Math.round(maxY * 0.66), maxY]

  // Formatação de valores para legenda Y
  const formatY = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
    return `${v}`
  }

  // Linha da capacidade (meta)
  const capPts = data.map((d, i) => `${padL + step * i + step / 2},${y(d.capacidade)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W - 12} y1={y(t)} y2={y(t)} stroke="#f1f5f9" strokeDasharray="3 3" />
          <text x={padL - 6} y={y(t) + 3} fontSize="9" textAnchor="end" fill="#94a3b8" fontWeight="500">
            {formatY(t)}
          </text>
        </g>
      ))}

      {/* Linha de capacidade (meta) */}
      {data.length > 1 && (
        <polyline points={capPts} fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" />
      )}

      {/* Barras e labels */}
      {data.map((d, i) => {
        const cx = padL + step * i + step / 2
        const yFat = y(d.faturado)
        const yLib = y(d.liberado)
        const yCap = y(d.capacidade)
        const yZero = y(0)

        const hFat = Math.max(0, yZero - yFat)
        const hLib = Math.max(0, yZero - yLib)

        return (
          <g key={d.date} className="cursor-pointer">
            {/* Ponto na linha de capacidade */}
            <circle cx={cx} cy={yCap} r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

            {/* Barra Faturado (Azul) */}
            <rect
              x={cx - bw - 1}
              y={yFat}
              width={bw}
              height={hFat}
              rx="3"
              fill="#2563eb"
            >
              <title>{`Faturado: ${d.faturado.toLocaleString('pt-BR')} ${metric === 'cubagem' ? 'm³' : metric} (${d.date})`}</title>
            </rect>

            {/* Barra Liberado (Verde) */}
            <rect
              x={cx + 1}
              y={yLib}
              width={bw}
              height={hLib}
              rx="3"
              fill="#16a34a"
            >
              <title>{`Liberado: ${d.liberado.toLocaleString('pt-BR')} ${metric === 'cubagem' ? 'm³' : metric} (${d.date})`}</title>
            </rect>

            {/* Labels de Eixo X */}
            <text x={cx} y={H - 20} fontSize="9.5" textAnchor="middle" fill="#334155" fontWeight="700">
              {d.label}
            </text>
            <text x={cx} y={H - 9} fontSize="8" textAnchor="middle" fill="#94a3b8">
              {d.date}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const TurnoChart: React.FC = () => {
  const W = 300, H = 200, padL = 28, padB = 26, padT = 18
  const maxY = 600
  const innerW = W - padL - 6
  const innerH = H - padB - padT
  const y = (v: number) => padT + innerH - (v / maxY) * innerH
  const step = innerW / turnoData.length
  const bw = step * 0.3
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 200, 400, 600].map(t => (
        <g key={t}>
          <line x1={padL} x2={W - 6} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={padL - 5} y={y(t) + 3} fontSize="9" textAnchor="end" fill="#94a3b8">{t}</text>
        </g>
      ))}
      {turnoData.map((d, i) => {
        const cx = padL + step * i + step / 2
        return (
          <g key={d.turno}>
            <rect x={cx - bw - 1} y={y(d.realizado)} width={bw} height={y(0) - y(d.realizado)} rx="2" fill="#3b82f6" />
            <rect x={cx + 1} y={y(d.meta)} width={bw} height={y(0) - y(d.meta)} rx="2" fill="#cbd5e1" />
            <text x={cx - bw / 2 - 1} y={y(d.realizado) - 4} fontSize="9" textAnchor="middle" fontWeight="700" fill="#1e293b">{d.realizado}</text>
            <text x={cx + bw / 2 + 1} y={y(d.meta) - 4} fontSize="9" textAnchor="middle" fill="#64748b">{d.meta}</text>
            <text x={cx} y={H - 8} fontSize="9" textAnchor="middle" fill="#475569">{d.turno}</text>
          </g>
        )
      })}
    </svg>
  )
}

const Legend: React.FC<{ items: { label: string; color: string; line?: boolean }[] }> = ({ items }) => (
  <div className="flex items-center gap-3 text-[10px] text-slate-500">
    {items.map(it => (
      <span key={it.label} className="flex items-center gap-1">
        <span className={it.line ? 'w-4 h-0.5' : 'w-2.5 h-2.5 rounded-sm'} style={{ background: it.color }} />
        {it.label}
      </span>
    ))}
  </div>
)

const Donut: React.FC<{ value: number }> = ({ value }) => {
  const r = 38, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#16a34a" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">{value}%</text>
    </svg>
  )
}

export const DashboardPage: React.FC = () => {
  // Estado integrado para dados do NS SAÍDA
  const [saidaData, setSaidaData] = useState<{
    value: string
    micro: string
    rodo: string
    courrie: string
    diario: string
    mensal: string
    dates: {
      micro: string
      rodo: string
      courrie: string
      diario: string
      mensal: string
    }
    lastDay: string
  }>({
    value: '99,8%',
    micro: '100%',
    rodo: '100%',
    courrie: '100%',
    diario: '100%',
    mensal: '99,8%',
    dates: {
      micro: '30/out',
      rodo: '30/out',
      courrie: '29/out',
      diario: '30/out',
      mensal: '30/out'
    },
    lastDay: '30/out'
  })

  // Estado integrado para dados do NS FULL (Fulfillment)
  const [fullData, setFullData] = useState<{
    value: string
    diario: string
    mensal: string
    dates: {
      diario: string
      mensal: string
    }
    lastDay: string
  }>({
    value: '94,75%',
    diario: '90,91%',
    mensal: '94,75%',
    dates: {
      diario: '30/out',
      mensal: '30/out'
    },
    lastDay: '30/out'
  })

  // Estado integrado para dados de ATENDIMENTO (Gestão CX)
  const [atendimentoData, setAtendimentoData] = useState<{
    recDiario: string
    recMes: string
    backlog: string
    chamados: string
    npsLojas: string
  }>({
    recDiario: '1,61%',
    recMes: '1,38%',
    backlog: '8',
    chamados: '83',
    npsLojas: '81,2%'
  })

  // Estado integrado para dados do NS CLIENTE
  const [clienteData, setClienteData] = useState<{
    value: string
    micro: string
    rodo: string
    courrie: string
    diario: string
    mensal: string
    dates: {
      micro: string
      rodo: string
      courrie: string
      diario: string
      mensal: string
    }
    lastDay: string
  }>({
    value: '95,92%',
    micro: '96,77%',
    rodo: '89,47%',
    courrie: '97,67%',
    diario: '96,50%',
    mensal: '95,92%',
    dates: {
      micro: '30/out',
      rodo: '08/out',
      courrie: '08/out',
      diario: '30/out',
      mensal: '30/out'
    },
    lastDay: '30/out'
  })

  // Estado integrado para dados do NS RLE
  const [rleData, setRleData] = useState<{
    value: string
    diario: string
    mensal: string
    dates: {
      diario: string
      mensal: string
    }
    lastDay: string
  }>({
    value: '98,29%',
    diario: '100%',
    mensal: '98,29%',
    dates: {
      diario: '30/out',
      mensal: '30/out'
    },
    lastDay: '30/out'
  })

  // Estado de segmentação e dados de Acompanhamento Diário para o Gráfico de Performance
  const [chartMetric, setChartMetric] = useState<'cubagem' | 'pecas' | 'pedidos'>('cubagem')
  const [chartAderenciaData, setChartAderenciaData] = useState<AderenciaDataState | null>(() => {
    return initialAderenciaOct as unknown as AderenciaDataState
  })

  // Carrega dados de Aderência (Acompanhamento Diário) para alimentar o gráfico
  useEffect(() => {
    const loadChartData = async () => {
      try {
        const now = new Date()
        const curYear = now.getFullYear()
        const curMonth = now.getMonth() + 1
        // Tenta carregar do mês corrente (ex: Nov/2026)
        const cloudData = await getAderenciaData(curYear, curMonth, '994').catch(() => null)
        if (cloudData) {
          setChartAderenciaData(cloudData)
        } else if (curYear === 2026 && curMonth === 10) {
          setChartAderenciaData(initialAderenciaOct as unknown as AderenciaDataState)
        } else {
          // Se não houver do mês atual, tenta Outubro/2026 como fallback
          const octData = await getAderenciaData(2026, 10, '994').catch(() => null)
          if (octData) {
            setChartAderenciaData(octData)
          } else {
            setChartAderenciaData(initialAderenciaOct as unknown as AderenciaDataState)
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados de aderência para o gráfico:', err)
      }
    }
    loadChartData()
  }, [])

  // Calcula os 7 dias para o gráfico (vinculados ao Acompanhamento Diário)
  const performance7Days = useMemo<OperationalPerformanceDay[]>(() => {
    const now = new Date()
    const curYear = chartAderenciaData?.ano || now.getFullYear()
    const curMonth = chartAderenciaData?.mes || (now.getMonth() + 1)
    const weekdayLetters = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    const liberadoTotals = (chartAderenciaData?.liberado?.totals as any)?.[chartMetric] || {}
    const faturadoTotals = (chartAderenciaData?.faturado?.totals as any)?.[chartMetric] || {}
    const capacidadeMap = (chartAderenciaData?.capacidade as any)?.[chartMetric] || {}

    // Padrão de capacidade por dia útil
    const defaultCap = chartMetric === 'cubagem' ? 1000 : chartMetric === 'pedidos' ? 2800 : 10000

    // Range de 7 dias (dias 01 a 07 do mês)
    const result: OperationalPerformanceDay[] = []
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const dayStr = dayNum.toString().padStart(2, '0')
      const dt = new Date(curYear, curMonth - 1, dayNum)
      const isSunday = dt.getDay() === 0
      const wLabel = weekdayLetters[dt.getDay()]
      const dateLabel = `${dayStr}/${curMonth.toString().padStart(2, '0')}`

      const rawFat = faturadoTotals[dayStr] ?? faturadoTotals[dayNum.toString()]
      const fatVal = rawFat !== undefined ? Math.round(rawFat) : 0

      const rawLib = liberadoTotals[dayStr] ?? liberadoTotals[dayNum.toString()]
      const libVal = rawLib !== undefined ? Math.round(rawLib) : 0

      const rawCap = capacidadeMap[dayStr] ?? capacidadeMap[dayNum.toString()]
      const capVal = rawCap !== undefined ? Math.round(rawCap) : (isSunday ? 0 : defaultCap)

      result.push({
        dayStr,
        label: wLabel,
        date: dateLabel,
        faturado: fatVal,
        liberado: libVal,
        capacidade: capVal
      })
    }
    return result
  }, [chartAderenciaData, chartMetric])

  // Estado integrado para Banco de Horas (Total Crédito e Total Débito com indicador de evolução vs. dia anterior)
  const [bankHoursStats, setBankHoursStats] = useState<{
    totalCredito: string
    totalDebito: string
    colabCredito: number
    colabDebito: number
    creditoTrend: 'up' | 'down' | 'neutral'
    debitoTrend: 'up' | 'down' | 'neutral'
    creditoDiff: string
    debitoDiff: string
    dataAnteriorComparada: string
  }>({
    totalCredito: '+1773:31h',
    totalDebito: '-925:00h',
    colabCredito: 107,
    colabDebito: 78,
    creditoTrend: 'up',
    debitoTrend: 'down',
    creditoDiff: '+12:45h',
    debitoDiff: '-08:30h',
    dataAnteriorComparada: 'vs. dia anterior'
  })

  // Sincroniza dados do Banco de Horas a partir do Cache ou Planilha
  useEffect(() => {
    const parseTimeToDecimal = (timeStr: string): number => {
      if (!timeStr) return 0
      const clean = timeStr.trim().replace(/^"/, '').replace(/"$/, '')
      const parts = clean.split(':').map(Number)
      if (parts.some(isNaN)) return 0
      return (parts[0] || 0) + ((parts[1] || 0) / 60) + ((parts[2] || 0) / 3600)
    }

    const parseDateBR = (dateStr: string): number => {
      if (!dateStr) return 0
      const parts = dateStr.split('/').map(Number)
      if (parts.length < 3) return 0
      const [dia, mes, ano] = parts
      return new Date(ano || 2026, (mes || 1) - 1, dia || 1).getTime()
    }

    const formatDecimalToHours = (decimal: number, forceMinus = false): string => {
      const abs = Math.abs(decimal)
      const h = Math.floor(abs)
      const m = Math.round((abs - h) * 60)
      const sign = forceMinus ? '-' : (decimal < 0 ? '-' : '+')
      return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`
    }

    const calculateStats = (records: any[]) => {
      if (!records || records.length === 0) return

      // Pega data mais recente por colaborador (active snapshot consolidado)
      const latestDateByEmp = new Map<string, string>()
      const sorted = [...records].sort((a, b) => parseDateBR(a.data) - parseDateBR(b.data))
      sorted.forEach(item => {
        const key = `${item.id}-${item.contratado}`
        latestDateByEmp.set(key, item.data)
      })

      const snapshot = records.filter(item => {
        const key = `${item.id}-${item.contratado}`
        return latestDateByEmp.get(key) === item.data
      })

      let sumCredito = 0
      let sumDebito = 0

      // Mapeamento por colaborador
      const empMap = new Map<string, { credito: number; debito: number }>()

      snapshot.forEach(item => {
        const tipoNorm = String(item.tipo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        const horas = typeof item.horasAbsolutas === 'number' ? item.horasAbsolutas : parseTimeToDecimal(item.qtdHoras)
        const key = `${item.id}-${item.contratado}`
        const emp = empMap.get(key) || { credito: 0, debito: 0 }

        if (tipoNorm.includes('credito')) {
          sumCredito += horas
          emp.credito += horas
        } else if (tipoNorm.includes('debito')) {
          sumDebito += horas
          emp.debito += horas
        }
        empMap.set(key, emp)
      })

      let countCredito = 0
      let countDebito = 0
      empMap.forEach(e => {
        const saldo = e.credito - e.debito
        if (saldo > 0) countCredito++
        if (saldo < 0) countDebito++
      })

      // Cálculo de evolução (comparando a data mais recente com a anterior)
      const uniqueDates = Array.from(new Set(records.map(r => r.data).filter(Boolean))).sort((a, b) => parseDateBR(b) - parseDateBR(a))
      let creditoTrend: 'up' | 'down' | 'neutral' = 'up'
      let debitoTrend: 'up' | 'down' | 'neutral' = 'down'
      let creditoDiff = ''
      let debitoDiff = ''

      let dataAnteriorComparada = 'vs. dia anterior'
      if (uniqueDates.length >= 2) {
        const latestDate = uniqueDates[0]
        const previousDate = uniqueDates[1]
        dataAnteriorComparada = `vs. ${previousDate}`

        const latestRecords = records.filter(r => r.data === latestDate)
        const prevRecords = records.filter(r => r.data === previousDate)

        const getTotals = (recs: any[]) => {
          let c = 0
          let d = 0
          recs.forEach(r => {
            const t = String(r.tipo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
            const h = typeof r.horasAbsolutas === 'number' ? r.horasAbsolutas : parseTimeToDecimal(r.qtdHoras)
            if (t.includes('credito')) c += h
            if (t.includes('debito')) d += h
          })
          return { c, d }
        }

        const curr = getTotals(latestRecords)
        const prev = getTotals(prevRecords)

        const diffC = curr.c - prev.c
        const diffD = curr.d - prev.d

        if (diffC > 0.05) {
          creditoTrend = 'up'
          creditoDiff = `+${formatDecimalToHours(diffC).replace('+', '')}`
        } else if (diffC < -0.05) {
          creditoTrend = 'down'
          creditoDiff = formatDecimalToHours(diffC)
        } else {
          creditoTrend = 'neutral'
          creditoDiff = 'Estável'
        }

        if (diffD > 0.05) {
          debitoTrend = 'up'
          debitoDiff = `+${formatDecimalToHours(diffD).replace('+', '')}`
        } else if (diffD < -0.05) {
          debitoTrend = 'down'
          debitoDiff = formatDecimalToHours(diffD)
        } else {
          debitoTrend = 'neutral'
          debitoDiff = 'Estável'
        }
      }

      setBankHoursStats({
        totalCredito: formatDecimalToHours(sumCredito),
        totalDebito: formatDecimalToHours(sumDebito, true),
        colabCredito: countCredito || 107,
        colabDebito: countDebito || 78,
        creditoTrend,
        debitoTrend,
        creditoDiff: creditoDiff || '+12:45h',
        debitoDiff: debitoDiff || '-08:30h',
        dataAnteriorComparada
      })
    }

    // 1. Tenta carregar do cache local
    try {
      const cached = localStorage.getItem('magalog_bank_hours_cache')
      if (cached) {
        calculateStats(JSON.parse(cached))
      }
    } catch { }

    // 2. Busca do Google Sheets se necessário
    const fetchSheet = async () => {
      try {
        const url = 'https://docs.google.com/spreadsheets/d/1rOqQq0CvzT2LNIvHB6zWmgtmbK7rDU3idyI7rbf_j5g/gviz/tq?tqx=out:csv&gid=0'
        const res = await fetch(url)
        if (res.ok) {
          const csvText = await res.text()
          if (!csvText.includes('<!DOCTYPE html>')) {
            const lines = csvText.split('\n')
            const records: any[] = []
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i]
              if (!line.trim()) continue
              const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g
              const matches: string[] = []
              let m: RegExpExecArray | null
              while ((m = regex.exec(line)) !== null) {
                let val = m[1] || ''
                if (val.startsWith('"') && val.endsWith('"')) {
                  val = val.substring(1, val.length - 1).replace(/""/g, '"')
                }
                matches.push(val.trim())
                if (m.index === regex.lastIndex) regex.lastIndex++
              }
              if (matches.length >= 7) {
                const tipo = matches[5] || ''
                const qtdHoras = matches[6] || '00:00'
                records.push({
                  data: matches[0] || '',
                  id: matches[1] || '',
                  contratado: matches[2] || '',
                  cargo: matches[3] || '',
                  centroDeCusto: matches[4] || '',
                  tipo,
                  qtdHoras,
                  horasAbsolutas: parseTimeToDecimal(qtdHoras)
                })
              }
            }
            if (records.length > 0) {
              calculateStats(records)
            }
          }
        }
      } catch { }
    }

    fetchSheet()
  }, [])

  // Carrega e sincroniza dados reais de NS Saída e Fulfillment do Supabase e LocalStorage
  useEffect(() => {
    const MONTH_ORDER: Record<string, number> = {
      jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
      jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
    }

    // Função universal para encontrar o último valor cronológico lançado
    const getLastValidValueChronological = (prefix: string, fallback: string, metricsMap: Record<string, string>): { val: string; dayPart: string } => {
      const items: { dayPart: string; val: string; score: number }[] = []

      Object.keys(metricsMap).forEach(k => {
        if (k.startsWith(prefix)) {
          const val = metricsMap[k]?.trim()
          if (val && val !== '-' && val !== '') {
            const dayPart = k.replace(prefix, '')
            const m = dayPart.match(/^(\d+)\/([a-z]{3})$/i)
            if (m) {
              const day = parseInt(m[1], 10)
              const mon = m[2].toLowerCase()
              const score = (MONTH_ORDER[mon] || 0) * 100 + day
              items.push({ dayPart, val, score })
            } else {
              const num = parseInt(dayPart.replace(/[^0-9]/g, ''), 10) || 0
              items.push({ dayPart, val, score: num })
            }
          }
        }
      })

      if (items.length === 0) return { val: fallback, dayPart: '' }

      items.sort((a, b) => a.score - b.score)
      const last = items[items.length - 1]
      return { val: last.val, dayPart: last.dayPart }
    }

    const processFullMetrics = (metricsMap: Record<string, string>) => {
      const diarioObj = getLastValidValueChronological('fulfillment_full_diario_', '90,91%', metricsMap)
      const mensalObj = getLastValidValueChronological('fulfillment_full_mensal_', '94,75%', metricsMap)

      const mainVal = mensalObj.val !== '-' ? mensalObj.val : (diarioObj.val !== '-' ? diarioObj.val : '94,75%')

      setFullData({
        value: mainVal,
        diario: diarioObj.val,
        mensal: mensalObj.val,
        dates: {
          diario: diarioObj.dayPart || '30/out',
          mensal: mensalObj.dayPart || '30/out'
        },
        lastDay: mensalObj.dayPart || diarioObj.dayPart || '30/out'
      })
    }

    const processSaidaMetrics = (metricsMap: Record<string, string>) => {
      const microObj = getLastValidValueChronological('ns_saida_eclusa_micro_', '100%', metricsMap)
      const rodoObj = getLastValidValueChronological('ns_saida_eclusa_rodo_', '100%', metricsMap)
      const courrieObj = getLastValidValueChronological('ns_saida_eclusa_courrie_', '100%', metricsMap)
      const diarioObj = getLastValidValueChronological('ns_saida_eclusa_eclusa_diario_', '100%', metricsMap)
      const mensalObj = getLastValidValueChronological('ns_saida_eclusa_eclusa_mensal_', '99,8%', metricsMap)

      const mainVal = mensalObj.val !== '-' ? mensalObj.val : (diarioObj.val !== '-' ? diarioObj.val : '99,8%')

      setSaidaData({
        value: mainVal,
        micro: microObj.val,
        rodo: rodoObj.val,
        courrie: courrieObj.val,
        diario: diarioObj.val,
        mensal: mensalObj.val,
        dates: {
          micro: microObj.dayPart || '30/out',
          rodo: rodoObj.dayPart || '30/out',
          courrie: courrieObj.dayPart || '29/out',
          diario: diarioObj.dayPart || '30/out',
          mensal: mensalObj.dayPart || '30/out'
        },
        lastDay: mensalObj.dayPart || '30/out'
      })
    }

    const processClienteMetrics = (metricsMap: Record<string, string>) => {
      const microObj = getLastValidValueChronological('ns_cliente_micro_', '96,77%', metricsMap)
      const rodoObj = getLastValidValueChronological('ns_cliente_rodo_', '89,47%', metricsMap)
      const courrieObj = getLastValidValueChronological('ns_cliente_courrie_', '97,67%', metricsMap)
      const diarioObj = getLastValidValueChronological('ns_cliente_ns_diario_', '96,50%', metricsMap)
      const mensalObj = getLastValidValueChronological('ns_cliente_ns_mensal_', '95,92%', metricsMap)

      const mainVal = mensalObj.val !== '-' ? mensalObj.val : (diarioObj.val !== '-' ? diarioObj.val : '95,92%')

      setClienteData({
        value: mainVal,
        micro: microObj.val,
        rodo: rodoObj.val,
        courrie: courrieObj.val,
        diario: diarioObj.val,
        mensal: mensalObj.val,
        dates: {
          micro: microObj.dayPart || '30/out',
          rodo: rodoObj.dayPart || '08/out',
          courrie: courrieObj.dayPart || '08/out',
          diario: diarioObj.dayPart || '30/out',
          mensal: mensalObj.dayPart || '30/out'
        },
        lastDay: mensalObj.dayPart || '30/out'
      })
    }

    const processAtendimentoMetrics = (metricsMap: Record<string, string>) => {
      setAtendimentoData({
        recDiario: getLastValidValueChronological('gestao_cx_rec_diario_', '1,61%', metricsMap).val,
        recMes: getLastValidValueChronological('gestao_cx_rec_mes_', '1,38%', metricsMap).val,
        backlog: getLastValidValueChronological('gestao_cx_backlog_zendesk_', '8', metricsMap).val,
        chamados: getLastValidValueChronological('gestao_cx_chamados_loja_', '83', metricsMap).val,
        npsLojas: getLastValidValueChronological('gestao_cx_nps_lojas_', '81,2%', metricsMap).val
      })
    }

    const processRleMetrics = (metricsMap: Record<string, string>) => {
      const diarioObj = getLastValidValueChronological('ns_rle_rle_diario_', '100%', metricsMap)
      const mensalObj = getLastValidValueChronological('ns_rle_rle_mensal_', '98,29%', metricsMap)
      const mainVal = mensalObj.val !== '-' ? mensalObj.val : (diarioObj.val !== '-' ? diarioObj.val : '98,29%')

      setRleData({
        value: mainVal,
        diario: diarioObj.val,
        mensal: mensalObj.val,
        dates: {
          diario: diarioObj.dayPart || '30/out',
          mensal: mensalObj.dayPart || '30/out'
        },
        lastDay: mensalObj.dayPart || '30/out'
      })
    }

    // 1. Tenta carregar do LocalStorage imediatamente
    try {
      const local = localStorage.getItem('magalog_performance_data')
      if (local) {
        const parsed = JSON.parse(local)
        processFullMetrics(parsed)
        processSaidaMetrics(parsed)
        processClienteMetrics(parsed)
        processAtendimentoMetrics(parsed)
        processRleMetrics(parsed)
      }
    } catch { }

    // 2. Busca do Supabase
    const loadFromSupabase = async () => {
      try {
        const { data: dbRows, error } = await supabase
          .from('performance_metrics')
          .select('cell_key, value')
          .or('cell_key.like.fulfillment_%,cell_key.like.ns_saida_eclusa_%,cell_key.like.ns_cliente_%,cell_key.like.gestao_cx_%,cell_key.like.ns_rle_%')

        if (!error && dbRows && dbRows.length > 0) {
          const map: Record<string, string> = {}
          dbRows.forEach(r => {
            map[r.cell_key] = r.value
          })
          processFullMetrics(map)
          processSaidaMetrics(map)
          processClienteMetrics(map)
          processAtendimentoMetrics(map)
          processRleMetrics(map)
        }
      } catch (err) {
        console.warn('Erro ao carregar métricas do Supabase:', err)
      }
    }

    loadFromSupabase()

    // 3. Inscrição em tempo real para refletir lançamentos instantaneamente
    const channel = supabase
      .channel('dashboard_metrics_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_metrics' },
        (payload: any) => {
          const key = payload.new?.cell_key
          if (key && (key.startsWith('fulfillment_') || key.startsWith('ns_saida_eclusa_') || key.startsWith('ns_cliente_') || key.startsWith('gestao_cx_') || key.startsWith('ns_rle_'))) {
            loadFromSupabase()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const alerts = [
    { icon: <CheckCircle2 size={15} />, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700', title: 'NS de Saída acima da meta', desc: '97,8% | Meta > 97%', time: 'Hoje 15:45' },
    { icon: <AlertTriangle size={15} />, tone: 'bg-amber-50 border-amber-200 text-amber-700', title: 'Ocupação do CD em atenção', desc: '97% | Monitorar capacidade', time: 'Hoje 14:50' },
    { icon: <Info size={15} />, tone: 'bg-blue-50 border-blue-200 text-blue-700', title: 'Recebimento acima do previsto', desc: '23 de 22 agendas concluídas', time: 'Hoje 13:20' },
    { icon: <Bell size={15} />, tone: 'bg-rose-50 border-rose-200 text-rose-700', title: '12 pendências críticas', desc: 'Acompanhar backlog e agendas', time: 'Hoje 12:10' }
  ]

  const fluxo = [
    { icon: <Truck size={16} />, tone: 'text-blue-600 bg-blue-50', title: 'Recebimento', value: '32', unit: 'Agendas', a: ['24', 'Recebidos'], b: ['8', 'Pendentes'] },
    { icon: <Package size={16} />, tone: 'text-amber-600 bg-amber-50', title: 'Expedição', value: '1.075 m³', unit: '', a: ['920', 'Expedidos'], b: ['135', 'Pendentes'] },
    { icon: <Warehouse size={16} />, tone: 'text-purple-600 bg-purple-50', title: 'Gestão de Estoque', value: '98,5%', unit: '', a: ['18', 'Divergências'], b: ['42', 'Itens em Inv.'] },
    { icon: <Wrench size={16} />, tone: 'text-emerald-600 bg-emerald-50', title: 'Equipamentos', value: '148', unit: '', a: ['139', 'Disponíveis'], b: ['9', 'Em Manutenção'] }
  ]

  const turnos = [
    { t: 'T1', v: 98, color: 'bg-blue-500' },
    { t: 'T2', v: 98, color: 'bg-amber-500' },
    { t: 'T3', v: 93, color: 'bg-purple-500' }
  ]

  const planos = [
    { label: 'Crítica', n: 2, color: 'bg-rose-500' },
    { label: 'Alta', n: 4, color: 'bg-amber-500' },
    { label: 'Média', n: 5, color: 'bg-blue-500' },
    { label: 'Concluído', n: 12, color: 'bg-emerald-500' }
  ]

  return (
    <div className="space-y-4 w-full">
      {/* KPIs Compactos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        <KpiNs
          icon={<Boxes size={15} />}
          tone="bg-blue-50 text-blue-600"
          title="NS Saída"
          value={saidaData.value}
          meta="Meta: 99,2%"
          metaTiers={[
            { label: '>= 99,2%', ating: '100%', dotColor: 'bg-blue-500' },
            { label: '>= 98,7%', ating: '75%', dotColor: 'bg-amber-400' },
            { label: '>= 98,2%', ating: '50%', dotColor: 'bg-rose-500' }
          ]}
          items={[
            ['Micro', saidaData.micro, saidaData.dates.micro],
            ['Rodo', saidaData.rodo, saidaData.dates.rodo],
            ['Courrie', saidaData.courrie, saidaData.dates.courrie],
            ['Diário', saidaData.diario, saidaData.dates.diario],
            ['Mensal', saidaData.mensal, saidaData.dates.mensal]
          ]}
        />
        <KpiNs
          icon={<User size={15} />}
          tone="bg-purple-50 text-purple-600"
          title="NS Cliente"
          value={clienteData.value}
          meta="Meta: 97,0%"
          metaTiers={[
            { label: '>= 97,0%', ating: '100%', dotColor: 'bg-blue-500' },
            { label: '>= 96,0%', ating: '75%', dotColor: 'bg-emerald-500' },
            { label: '<= 94,5%', ating: '50%', dotColor: 'bg-rose-500' }
          ]}
          items={[
            ['Micro', clienteData.micro, clienteData.dates.micro],
            ['Diário', clienteData.diario, clienteData.dates.diario],
            ['Mensal', clienteData.mensal, clienteData.dates.mensal]
          ]}
        />
        <KpiNs
          icon={<Package size={15} />}
          tone="bg-sky-50 text-sky-600"
          title="NS Full"
          value={fullData.value}
          meta="Meta: 97,0%"
          metaTiers={[
            { label: '>= 97,0%', ating: '100%', dotColor: 'bg-blue-500' },
            { label: '>= 96,0%', ating: '75%', dotColor: 'bg-emerald-500' },
            { label: '<= 95,9%', ating: '50%', dotColor: 'bg-rose-500' }
          ]}
          items={[
            ['Diário', fullData.diario, fullData.dates.diario],
            ['Mensal', fullData.mensal, fullData.dates.mensal]
          ]}
        />
        <KpiNs
          icon={<Settings size={15} />}
          tone="bg-emerald-50 text-emerald-600"
          title="NS RLE"
          value={rleData.value}
          meta="Meta > 95%"
          metaTiers={[
            { label: '>= 95,0%', ating: '100%', dotColor: 'bg-emerald-500' },
            { label: '< 95,0%', ating: '50%', dotColor: 'bg-rose-500' }
          ]}
          items={[
            ['Diário', rleData.diario, rleData.dates.diario],
            ['Mensal', rleData.mensal, rleData.dates.mensal]
          ]}
        />
        <KpiAtendimento data={atendimentoData} />
        <KpiSimple
          icon={<Home size={15} />}
          tone="bg-amber-50 text-amber-600"
          title="Aderência Quadro"
          value="94%"
          badge="+1,2 p.p."
          badgeTone="bg-slate-50 text-slate-500 border-slate-200"
        />
        {/* TOTAL DE CRÉDITOS (Banco de Horas) */}
        <Card className="p-2 h-[74px] flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">
              Total de Créditos
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                Entradas (+)
              </span>
              {bankHoursStats.creditoTrend === 'up' && (
                <span className="inline-flex items-center text-[7.5px] font-bold text-emerald-600 bg-emerald-50/80 px-1 py-0.2 rounded border border-emerald-200">
                  <TrendingUp size={8} className="mr-0.5" />
                  {bankHoursStats.creditoDiff}
                </span>
              )}
              {bankHoursStats.creditoTrend === 'down' && (
                <span className="inline-flex items-center text-[7.5px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  <TrendingDown size={8} className="mr-0.5" />
                  {bankHoursStats.creditoDiff}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-base font-black text-slate-900 leading-none font-mono tracking-tight">
                {bankHoursStats.totalCredito}
              </p>
              {bankHoursStats.creditoTrend === 'up' ? (
                <TrendingUp size={14} className="text-emerald-500 shrink-0" title={`Aumento de créditos: ${bankHoursStats.creditoDiff}`} />
              ) : bankHoursStats.creditoTrend === 'down' ? (
                <TrendingDown size={14} className="text-amber-500 shrink-0" title={`Diminuição de créditos: ${bankHoursStats.creditoDiff}`} />
              ) : null}
            </div>
            <p className="text-[8px] text-slate-400 truncate mt-0.5">
              {bankHoursStats.colabCredito} colaboradores com saldo positivo &bull; <span className="font-semibold text-slate-500">{bankHoursStats.dataAnteriorComparada}</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-1.5 self-start mt-0.5">
            <ArrowUpRight size={15} />
          </div>
        </Card>

        {/* TOTAL DE DÉBITOS (Banco de Horas) */}
        <Card className="p-2 h-[74px] flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">
              Total de Débitos
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-100">
                Saídas (-)
              </span>
              {bankHoursStats.debitoTrend === 'down' && (
                <span className="inline-flex items-center text-[7.5px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  <TrendingDown size={8} className="mr-0.5" />
                  {bankHoursStats.debitoDiff}
                </span>
              )}
              {bankHoursStats.debitoTrend === 'up' && (
                <span className="inline-flex items-center text-[7.5px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                  <TrendingUp size={8} className="mr-0.5" />
                  {bankHoursStats.debitoDiff}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-base font-black text-rose-600 leading-none font-mono tracking-tight">
                {bankHoursStats.totalDebito}
              </p>
              {bankHoursStats.debitoTrend === 'down' ? (
                <TrendingDown size={14} className="text-emerald-500 shrink-0" title={`Redução de débito: ${bankHoursStats.debitoDiff}`} />
              ) : bankHoursStats.debitoTrend === 'up' ? (
                <TrendingUp size={14} className="text-rose-500 shrink-0" title={`Aumento de débito: ${bankHoursStats.debitoDiff}`} />
              ) : null}
            </div>
            <p className="text-[8px] text-slate-400 truncate mt-0.5">
              {bankHoursStats.colabDebito} colaboradores devendo horas &bull; <span className="font-semibold text-slate-500">{bankHoursStats.dataAnteriorComparada}</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 ml-1.5 self-start mt-0.5">
            <Clock size={15} />
          </div>
        </Card>
      </div>

      {/* Linha de gráficos e alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="p-4 xl:col-span-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="text-slate-500"><BarChart3 size={16} /></span>
              Evolução da Performance Operacional
            </h3>
            
            {/* Segmentação de Métricas */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMetric('cubagem')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  chartMetric === 'cubagem'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cubagem
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('pecas')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  chartMetric === 'pecas'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Peças
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('pedidos')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  chartMetric === 'pedidos'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pedidos
              </button>
            </div>
          </div>

          {/* Legenda Atualizada: Faturado, Liberado, Capacidade (Meta) */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2">
            <span className="text-[10px] text-slate-400 font-medium">Visão: 7 dias (Acompanhamento Diário)</span>
            <Legend
              items={[
                { label: 'Faturado', color: '#2563eb' },
                { label: 'Liberado', color: '#16a34a' },
                { label: 'Capacidade (Meta)', color: '#60a5fa', line: true }
              ]}
            />
          </div>

          <PerformanceChart data={performance7Days} metric={chartMetric} />
        </Card>
        <Card className="p-4 xl:col-span-3">
          <CardTitle icon={<Timer size={16} />} title="Performance por Turno"
            right={<Legend items={[{ label: 'Realizado', color: '#3b82f6' }, { label: 'Meta', color: '#cbd5e1' }]} />} />
          <TurnoChart />
        </Card>
        <Card className="p-4 xl:col-span-4">
          <CardTitle icon={<Bell size={16} />} title="Destaques & Alertas" />
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.title} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${a.tone}`}>
                <span className="mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{a.title}</p>
                  <p className="text-[11px] text-slate-600">{a.desc}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Linha inferior */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="p-4 xl:col-span-5">
          <CardTitle icon={<Package size={16} />} title="Fluxo Operacional" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {fluxo.map(f => (
              <div key={f.title} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1.5 rounded-lg ${f.tone}`}>{f.icon}</span>
                  <span className="text-xs font-bold text-slate-700">{f.title}</span>
                </div>
                <p className="text-2xl font-black text-slate-900 leading-tight">{f.value}</p>
                {f.unit && <p className="text-[11px] text-slate-500 -mt-1">{f.unit}</p>}
                <div className="text-[11px] pt-1 border-t border-slate-100">
                  <p><span className="font-bold text-slate-800">{f.a[0]}</span> <span className="text-slate-500">{f.a[1]}</span></p>
                  <p><span className="font-bold text-rose-600">{f.b[0]}</span> <span className="text-slate-500">{f.b[1]}</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 xl:col-span-4">
          <CardTitle icon={<Users size={16} />} title="Pessoas e Escala" />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <Donut value={94} />
              <span className="text-[11px] text-slate-500">Aderência</span>
            </div>
            <div className="flex-1 text-xs space-y-1">
              {[['Quadro Previsto', '220', 'text-slate-800'], ['Quadro Realizado', '220', 'text-slate-800'], ['Absenteísmo', '2,7%', 'text-emerald-600'], ['HE', '1,8%', 'text-emerald-600'], ['Produtividade', '4,9 m³/pess', 'text-slate-800']].map(([k, v, c]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-500">{k}</span>
                  <span className={`font-bold ${c}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="w-32 pl-3 border-l border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-500">Por Turno</p>
              {turnos.map(t => (
                <div key={t.t} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 text-slate-500">{t.t}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${t.color}`} style={{ width: `${t.v}%` }} />
                  </div>
                  <span className="font-bold text-slate-700">{t.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-3">
          <CardTitle icon={<DollarSign size={16} />} title="Controle e Planos" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500">Orçamento de Mão</p>
              <p className="text-xl font-black text-slate-900">R$ 27.758</p>
              <p className="text-[11px] text-slate-500">Realizado: <span className="font-bold text-slate-700">R$ 22.400</span></p>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '81%' }} />
              </div>
              <p className="text-[11px] text-slate-500">Saldo: <span className="font-bold text-emerald-600">R$ 5.358</span></p>
            </div>
            <div className="space-y-1.5 border-l border-slate-100 pl-3">
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Planos de Ação</p>
              {planos.map(p => (
                <div key={p.label} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${p.color}`} /> {p.label}
                  </span>
                  <span className="font-bold text-slate-800">{p.n}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Visão Consolidada PMT (Planejado, Liberado, Faturado e Acompanhamento Diário) */}
      <PmtDashboardOverview />

      {/* Acompanhamento do Quadro Médio OP e C&D */}
      <QuadroOverview />
    </div>
  )
}

export default DashboardPage
