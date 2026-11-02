import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, User, Settings, Home, Clock, AlertTriangle, BarChart3, Timer,
  Bell, CheckCircle2, Info, Boxes, Truck, Warehouse, Wrench, Users, DollarSign, CalendarDays,
  TrendingUp, MessageSquareWarning
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PmtDashboardOverview } from './PmtDashboardOverview'
import { QuadroOverview } from './QuadroOverview'

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
  items: [string, string][]
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
        {items.map(([k, v]) => {
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
            <div key={k} className="flex justify-between gap-1 leading-none">
              <span className="text-slate-400 font-medium">{k}</span>
              <span className={itemColor}>{v}</span>
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
const PerformanceChart: React.FC = () => {
  const W = 520, H = 200, padL = 34, padB = 34, padT = 10
  const maxY = 750
  const innerW = W - padL - 10
  const innerH = H - padB - padT
  const y = (v: number) => padT + innerH - (v / maxY) * innerH
  const step = innerW / performanceData.length
  const bw = step * 0.28
  const linePts = performanceData.map((d, i) => `${padL + step * i + step / 2},${y(d.demanda)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0, 250, 500, 750].map(t => (
        <g key={t}>
          <line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={padL - 6} y={y(t) + 3} fontSize="9" textAnchor="end" fill="#94a3b8">{t}</text>
        </g>
      ))}
      <line x1={padL} x2={W - 10} y1={y(CAPACIDADE)} y2={y(CAPACIDADE)} stroke="#93c5fd" strokeWidth="2" />
      {performanceData.map((d, i) => {
        const cx = padL + step * i + step / 2
        return (
          <g key={d.label}>
            <rect x={cx - bw - 1} y={y(d.demanda)} width={bw} height={y(0) - y(d.demanda)} rx="2" fill="#3b82f6" />
            <rect x={cx + 1} y={y(d.realizado)} width={bw} height={y(0) - y(d.realizado)} rx="2" fill="#16a34a" />
            <text x={cx} y={H - 20} fontSize="9" textAnchor="middle" fill="#475569" fontWeight="600">{d.label}</text>
            <text x={cx} y={H - 9} fontSize="8" textAnchor="middle" fill="#94a3b8">{d.date}</text>
          </g>
        )
      })}
      <polyline points={linePts} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
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
    lastDay: string
  }>({
    value: '99,8%',
    micro: '100%',
    rodo: '100%',
    courrie: '100%',
    diario: '100%',
    mensal: '99,8%',
    lastDay: '30/out'
  })

  // Estado integrado para dados do NS FULL (Fulfillment)
  const [fullData, setFullData] = useState<{
    value: string
    diario: string
    mensal: string
    lastDay: string
  }>({
    value: '94,75%',
    diario: '90,91%',
    mensal: '94,75%',
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

  // Estado integrado para dados do NS RLE
  const [rleData, setRleData] = useState<{
    value: string
    diario: string
    mensal: string
    lastDay: string
  }>({
    value: '96,2%',
    diario: '100%',
    mensal: '96,2%',
    lastDay: '30/out'
  })

  // Carrega e sincroniza dados reais de NS Saída e Fulfillment do Supabase e LocalStorage
  useEffect(() => {
    const processFullMetrics = (metricsMap: Record<string, string>) => {
      // Procura chaves com prefixo fulfillment_full_diario_ e fulfillment_full_mensal_
      const daysFound = new Set<string>()

      Object.keys(metricsMap).forEach(k => {
        if (k.startsWith('fulfillment_full_diario_')) {
          const dayPart = k.replace('fulfillment_full_diario_', '')
          const val = metricsMap[k]?.trim()
          if (val && val !== '-' && val !== '') {
            daysFound.add(dayPart)
          }
        }
        if (k.startsWith('fulfillment_full_mensal_')) {
          const dayPart = k.replace('fulfillment_full_mensal_', '')
          const val = metricsMap[k]?.trim()
          if (val && val !== '-' && val !== '') {
            daysFound.add(dayPart)
          }
        }
      })

      if (daysFound.size === 0) return

      const sortedDays = Array.from(daysFound).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0
        return numA - numB
      })

      const lastDay = sortedDays[sortedDays.length - 1]
      const diarioVal = metricsMap[`fulfillment_full_diario_${lastDay}`]?.trim() || '-'
      const mensalVal = metricsMap[`fulfillment_full_mensal_${lastDay}`]?.trim() || '-'

      // O valor principal do card geral é sempre o valor do MENSAL
      const mainVal = mensalVal !== '-' ? mensalVal : (diarioVal !== '-' ? diarioVal : '94,75%')

      setFullData({
        value: mainVal,
        diario: diarioVal !== '-' ? diarioVal : '90,91%',
        mensal: mensalVal !== '-' ? mensalVal : '94,75%',
        lastDay
      })
    }

    const processSaidaMetrics = (metricsMap: Record<string, string>) => {
      // Função auxiliar para encontrar o último valor válido preenchido de um subindicador
      const getLastValidValue = (subId: string, fallback: string): string => {
        const prefix = `ns_saida_eclusa_${subId}_`
        const daysWithVal: string[] = []

        Object.keys(metricsMap).forEach(k => {
          if (k.startsWith(prefix)) {
            const dayPart = k.replace(prefix, '')
            const val = metricsMap[k]?.trim()
            if (val && val !== '-' && val !== '') {
              daysWithVal.push(dayPart)
            }
          }
        })

        if (daysWithVal.length === 0) return fallback

        // Ordena para pegar o último dia com lançamento daquele subitem específico
        daysWithVal.sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0
          return numA - numB
        })

        const lastSubDay = daysWithVal[daysWithVal.length - 1]
        return metricsMap[`${prefix}${lastSubDay}`]?.trim() || fallback
      }

      const microVal = getLastValidValue('micro', '100%')
      const rodoVal = getLastValidValue('rodo', '100%')
      const courrieVal = getLastValidValue('courrie', '100%')
      const diarioVal = getLastValidValue('eclusa_diario', '100%')
      const mensalVal = getLastValidValue('eclusa_mensal', '99,8%')

      // O valor geral principal é sempre o Mensal do último preenchimento
      const mainVal = mensalVal !== '-' ? mensalVal : (diarioVal !== '-' ? diarioVal : '99,8%')

      setSaidaData({
        value: mainVal,
        micro: microVal,
        rodo: rodoVal,
        courrie: courrieVal,
        diario: diarioVal,
        mensal: mensalVal,
        lastDay: '30/out'
      })
    }

    const processAtendimentoMetrics = (metricsMap: Record<string, string>) => {
      const getLastValidValue = (subId: string, fallback: string): string => {
        const prefix = `gestao_cx_${subId}_`
        const daysWithVal: string[] = []

        Object.keys(metricsMap).forEach(k => {
          if (k.startsWith(prefix)) {
            const dayPart = k.replace(prefix, '')
            const val = metricsMap[k]?.trim()
            if (val && val !== '-' && val !== '') {
              daysWithVal.push(dayPart)
            }
          }
        })

        if (daysWithVal.length === 0) return fallback

        daysWithVal.sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0
          return numA - numB
        })

        const lastSubDay = daysWithVal[daysWithVal.length - 1]
        return metricsMap[`${prefix}${lastSubDay}`]?.trim() || fallback
      }

      setAtendimentoData({
        recDiario: getLastValidValue('rec_diario', '1,61%'),
        recMes: getLastValidValue('rec_mes', '1,38%'),
        backlog: getLastValidValue('backlog_zendesk', '8'),
        chamados: getLastValidValue('chamados_loja', '83'),
        npsLojas: getLastValidValue('nps_lojas', '81,2%')
      })
    }

    const processRleMetrics = (metricsMap: Record<string, string>) => {
      const getLastValidValue = (subId: string, fallback: string): string => {
        const prefix = `ns_rle_${subId}_`
        const daysWithVal: string[] = []

        Object.keys(metricsMap).forEach(k => {
          if (k.startsWith(prefix)) {
            const dayPart = k.replace(prefix, '')
            const val = metricsMap[k]?.trim()
            if (val && val !== '-' && val !== '') {
              daysWithVal.push(dayPart)
            }
          }
        })

        if (daysWithVal.length === 0) return fallback

        daysWithVal.sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0
          return numA - numB
        })

        const lastSubDay = daysWithVal[daysWithVal.length - 1]
        return metricsMap[`${prefix}${lastSubDay}`]?.trim() || fallback
      }

      const diarioVal = getLastValidValue('rle_diario', '100%')
      const mensalVal = getLastValidValue('rle_mensal', '96,2%')
      const mainVal = mensalVal !== '-' ? mensalVal : (diarioVal !== '-' ? diarioVal : '96,2%')

      setRleData({
        value: mainVal,
        diario: diarioVal,
        mensal: mensalVal,
        lastDay: '30/out'
      })
    }

    // 1. Tenta carregar do LocalStorage imediatamente
    try {
      const local = localStorage.getItem('magalog_performance_data')
      if (local) {
        const parsed = JSON.parse(local)
        processFullMetrics(parsed)
        processSaidaMetrics(parsed)
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
          .or('cell_key.like.fulfillment_%,cell_key.like.ns_saida_eclusa_%,cell_key.like.gestao_cx_%,cell_key.like.ns_rle_%')

        if (!error && dbRows && dbRows.length > 0) {
          const map: Record<string, string> = {}
          dbRows.forEach(r => {
            map[r.cell_key] = r.value
          })
          processFullMetrics(map)
          processSaidaMetrics(map)
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
          if (key && (key.startsWith('fulfillment_') || key.startsWith('ns_saida_eclusa_') || key.startsWith('gestao_cx_') || key.startsWith('ns_rle_'))) {
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
            ['Micro', saidaData.micro],
            ['Rodo', saidaData.rodo],
            ['Courrie', saidaData.courrie],
            ['Diário', saidaData.diario],
            ['Mensal', saidaData.mensal]
          ]}
        />
        <KpiNs
          icon={<User size={15} />}
          tone="bg-purple-50 text-purple-600"
          title="NS Cliente"
          value="97,8%"
          meta="Meta: 97,0%"
          items={[['Micro', '96,2%'], ['Courrie', '96,4%'], ['Rodo', '99,5']]}
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
            ['Diário', fullData.diario],
            ['Mensal', fullData.mensal]
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
            ['Diário', rleData.diario],
            ['Mensal', rleData.mensal]
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
        <KpiSimple
          icon={<Clock size={15} />}
          tone="bg-amber-50 text-amber-600"
          title="Horas Extras"
          value="1,8%"
          badge="Dentro da meta"
        />
        <KpiSimple
          icon={<AlertTriangle size={15} />}
          tone="bg-rose-50 text-rose-600"
          title="Pendências Críticas"
          value="12"
          badge="Acompanhar"
          badgeTone="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      {/* Linha de gráficos e alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="p-4 xl:col-span-5">
          <CardTitle icon={<BarChart3 size={16} />} title="Evolução da Performance Operacional"
            right={<Legend items={[{ label: 'Demanda', color: '#94a3b8', line: true }, { label: 'Realizado', color: '#16a34a' }, { label: 'Capacidade (Meta)', color: '#93c5fd', line: true }]} />} />
          <PerformanceChart />
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
