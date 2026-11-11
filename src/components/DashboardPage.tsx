import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard, Package, User, Settings, Home, Clock, AlertTriangle, BarChart3, Timer,
  Bell, CheckCircle2, Info, Boxes, Truck, Warehouse, Wrench, Users, DollarSign, CalendarDays,
  TrendingUp, TrendingDown, MessageSquareWarning, ArrowUpRight, ArrowDownRight, Layers,
  PieChart, RefreshCw, UploadCloud, Tv, BedDouble, Trees, ShoppingCart, ShieldCheck, Disc3,
  X, Search, Copy, Check
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { PmtDashboardOverview } from './PmtDashboardOverview'
import { QuadroOverview } from './QuadroOverview'
import initialAderenciaOct from '../data/initialAderencia202610.json'
import initialEstoqueCategoria from '../data/estoque_categoria_summary.json'
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
  isToday?: boolean
  faturado: number
  liberado: number
  capacidade: number
}

interface PerformanceChartProps {
  data: OperationalPerformanceDay[]
  metric: 'cubagem' | 'pecas' | 'pedidos'
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, metric }) => {
  const W = 520, H = 208, padL = 46, padB = 42, padT = 20
  const innerW = W - padL - 12
  const innerH = H - padB - padT

  // Encontrar valor máximo para escala Y com folga de 20% para caber os valores acima das barras
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.faturado, d.liberado, d.capacidade)),
    10
  )
  const maxY = Math.ceil((maxVal * 1.25) / 100) * 100 || 1000

  const y = (v: number) => padT + innerH - (Math.min(Math.max(v, 0), maxY) / maxY) * innerH
  const step = innerW / Math.max(data.length, 1)
  const bw = Math.min(step * 0.32, 18)

  const ticks = [0, Math.round(maxY * 0.33), Math.round(maxY * 0.66), maxY]

  // Formatação de valores para legenda Y
  const formatY = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
    return `${v}`
  }

  // Formatação compacta para os valores acima das barras
  const formatBarVal = (v: number) => {
    if (v === 0) return ''
    if (v >= 1000) {
      const k = v / 1000
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
    }
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

        const textFat = formatBarVal(d.faturado)
        const textLib = formatBarVal(d.liberado)

        return (
          <g key={d.date} className="cursor-pointer">
            {/* Ponto na linha de capacidade */}
            <circle cx={cx} cy={yCap} r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            {d.capacidade > 0 && (
              <title>{`Capacidade: ${d.capacidade.toLocaleString('pt-BR')} (${d.date})`}</title>
            )}

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

            {/* Valor acima da barra Faturado */}
            {d.faturado > 0 && (
              <text
                x={cx - bw / 2 - 1}
                y={yFat - 3}
                fontSize="7.5"
                textAnchor="middle"
                fill="#1d4ed8"
                fontWeight="700"
              >
                {textFat}
              </text>
            )}

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

            {/* Valor acima da barra Liberado */}
            {d.liberado > 0 && (
              <text
                x={cx + bw / 2 + 1}
                y={yLib - 3}
                fontSize="7.5"
                textAnchor="middle"
                fill="#15803d"
                fontWeight="700"
              >
                {textLib}
              </text>
            )}

            {/* Labels de Eixo X */}
            {d.isToday ? (
              <g>
                {/* Badge HOJE posicionada logo abaixo da barra */}
                <rect
                  x={cx - 15}
                  y={H - 38}
                  width={30}
                  height={10}
                  rx="5"
                  fill="#2563eb"
                />
                <text
                  x={cx}
                  y={H - 30}
                  fontSize="6.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontWeight="800"
                  letterSpacing="0.5"
                >
                  HOJE
                </text>

                {/* Dia da semana */}
                <text
                  x={cx}
                  y={H - 18}
                  fontSize="9.5"
                  textAnchor="middle"
                  fill="#1d4ed8"
                  fontWeight="800"
                >
                  {d.label}
                </text>

                {/* Data */}
                <text
                  x={cx}
                  y={H - 7}
                  fontSize="8"
                  textAnchor="middle"
                  fill="#2563eb"
                  fontWeight="700"
                >
                  {d.date}
                </text>
              </g>
            ) : (
              <g>
                {/* Dia da semana */}
                <text
                  x={cx}
                  y={H - 18}
                  fontSize="9.5"
                  textAnchor="middle"
                  fill="#334155"
                  fontWeight="700"
                >
                  {d.label}
                </text>

                {/* Data */}
                <text
                  x={cx}
                  y={H - 7}
                  fontSize="8"
                  textAnchor="middle"
                  fill="#94a3b8"
                >
                  {d.date}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------- Relatório de Categorias de Estoque (EstoqueCD.xlsx) ----------------
const CLASSE_ITEM_MAPPING: Record<string, string> = {
  '99ACE': 'Madeira',
  '99AER': 'Mercado',
  '99ALM': 'Mercado',
  '99BDC': 'Mercado',
  '99BEB': 'Mercado',
  '99COF': 'Cofre',
  '99COL': 'Colchão/Estofado',
  '99DIV': 'Diversos',
  '99ECC': 'Colchão/Estofado',
  '99EIS': 'Diversos',
  '99HIG': 'Mercado',
  '99LIM': 'Mercado',
  '99LIV': 'Mercado',
  '99LNB': 'Eletro Pesado',
  '99MOV': 'Madeira',
  '99PDE': 'Diversos',
  '99PET': 'Mercado',
  '99PNE': 'Pneu',
  '99TV': 'Imagem'
}

// Capacidade máxima cadastrada por categoria (em m³)
export const CAPACIDADE_CATEGORIAS: Record<string, number> = {
  'Cofre': 127,
  'Colchão/Estofado': 5226,
  'Diversos': 2975,
  'Eletro Pesado': 13128,
  'Imagem': 2535,
  'Madeira': 2798,
  'Mercado': 358,
  'Pneu': 372
}

const CATEGORY_CONFIG: Record<string, {
  bar: string
  text: string
  bg: string
  border: string
  icon: React.ReactNode
}> = {
  'Eletro Pesado': {
    bar: 'bg-blue-600',
    text: 'text-blue-700',
    bg: 'bg-blue-50/80',
    border: 'border-blue-100',
    icon: <Truck size={12} className="text-blue-600" />
  },
  'Colchão/Estofado': {
    bar: 'bg-indigo-600',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-100',
    icon: <BedDouble size={12} className="text-indigo-600" />
  },
  'Diversos': {
    bar: 'bg-emerald-600',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-100',
    icon: <Boxes size={12} className="text-emerald-600" />
  },
  'Imagem': {
    bar: 'bg-purple-600',
    text: 'text-purple-700',
    bg: 'bg-purple-50/80',
    border: 'border-purple-100',
    icon: <Tv size={12} className="text-purple-600" />
  },
  'Madeira': {
    bar: 'bg-amber-600',
    text: 'text-amber-700',
    bg: 'bg-amber-50/80',
    border: 'border-amber-100',
    icon: <Trees size={12} className="text-amber-600" />
  },
  'Pneu': {
    bar: 'bg-slate-700',
    text: 'text-slate-800',
    bg: 'bg-slate-100/80',
    border: 'border-slate-200',
    icon: <Disc3 size={12} className="text-slate-700" />
  },
  'Mercado': {
    bar: 'bg-teal-600',
    text: 'text-teal-700',
    bg: 'bg-teal-50/80',
    border: 'border-teal-100',
    icon: <ShoppingCart size={12} className="text-teal-600" />
  },
  'Cofre': {
    bar: 'bg-cyan-600',
    text: 'text-cyan-700',
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-100',
    icon: <ShieldCheck size={12} className="text-cyan-600" />
  }
}

export interface EstoqueCategoriaItem {
  nome: string
  cubagem: number
  capacidade: number
  ocupacao: number
  pecas: number
  valor?: number
  itens: number
  percentual: number
}

export interface EstoqueBloqueioItemDetalhe {
  empresa: string
  sku: string
  descricao: string
  linha: string
  classe: string
  endereco: string
  diasBloq: number
  pecas: number
  cubagem: number
  valorTotal: number
}

export interface EstoqueBloqueioMotivo {
  motivo: string
  skus: number
  pecas: number
  cubagem: number
  valorTotal: number
  faixas: {
    '0 DIAS': number
    '7 DIAS': number
    '30 DIAS': number
    '90 DIAS': number
    '120 DIAS': number
    'ACIMA DE 120 DIAS': number
  }
  items?: EstoqueBloqueioItemDetalhe[]
}

export interface EstoqueBloqueiosData {
  totalLinhas: number
  totalSkus: number
  totalPecas: number
  totalCubagem: number
  totalValor: number
  totalFaixas: {
    '0 DIAS': number
    '7 DIAS': number
    '30 DIAS': number
    '90 DIAS': number
    '120 DIAS': number
    'ACIMA DE 120 DIAS': number
  }
  motivos: EstoqueBloqueioMotivo[]
}

export interface EstoqueSummaryData {
  updatedAt: string
  totalCubagem: number
  totalCapacidade: number
  totalOcupacao: number
  totalPecas: number
  totalValor?: number
  totalLinhas: number
  categorias: EstoqueCategoriaItem[]
  bloqueios?: EstoqueBloqueiosData
}

const formatCurrencyCompact = (val: number | undefined): string => {
  if (!val || val === 0) return 'R$ 0'
  if (val >= 1_000_000) {
    return `R$ ${(val / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
  }
  if (val >= 1_000) {
    return `R$ ${(val / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`
  }
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const formatCurrencyMil = (val: number | undefined): string => {
  if (!val || val === 0) return 'R$ 0,00'
  if (val >= 1_000_000) {
    return `R$ ${(val / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  }
  if (val >= 1_000) {
    return `R$ ${(val / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`
  }
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const BloqueioDetalhesModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  motivoNome: string
  items?: EstoqueBloqueioItemDetalhe[]
}> = ({ isOpen, onClose, motivoNome, items = [] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const [sortField, setSortField] = useState<keyof EstoqueBloqueioItemDetalhe>('valorTotal')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const safeItems = items || []

  const filteredItems = useMemo(() => {
    let result = safeItems
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(it =>
        (it.sku || '').toLowerCase().includes(q) ||
        (it.descricao || '').toLowerCase().includes(q) ||
        (it.linha || '').toLowerCase().includes(q) ||
        (it.classe || '').toLowerCase().includes(q) ||
        (it.endereco || '').toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
      return sortOrder === 'asc'
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''))
    })
  }, [safeItems, searchTerm, sortField, sortOrder])

  const totalPecas = filteredItems.reduce((acc, it) => acc + (it.pecas || 0), 0)
  const totalCub = filteredItems.reduce((acc, it) => acc + (it.cubagem || 0), 0)
  const totalVal = filteredItems.reduce((acc, it) => acc + (it.valorTotal || 0), 0)

  if (!isOpen) return null

  const handleSort = (field: keyof EstoqueBloqueioItemDetalhe) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleCopyTable = () => {
    const headers = ['Empresa', 'SKU (Gemco)', 'Descrição', 'Linha', 'Classe', 'Endereço', 'Dias Bloq.', 'Peças', 'm³', 'Valor Total (R$)']
    const rows = filteredItems.map(it => [
      it.empresa,
      it.sku,
      it.descricao,
      it.linha,
      it.classe,
      it.endereco,
      `${it.diasBloq} dias`,
      it.pecas,
      it.cubagem.toFixed(3),
      it.valorTotal.toFixed(2)
    ])
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
    navigator.clipboard.writeText(tsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[95vw] 2xl:max-w-7xl flex flex-col h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Detalhes do Bloqueio:</span>
              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-xs font-black">
                {motivoNome}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Filtro / Busca */}
        <div className="px-5 py-2.5 border-b border-slate-100 bg-white shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filtrar por SKU, Descrição, Linha ou Classe..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="overflow-auto flex-1 min-h-0 text-[11px]">
          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead className="bg-[#111827] text-white text-[9.5px] uppercase tracking-wider sticky top-0 z-10 select-none">
              <tr>
                <th onClick={() => handleSort('empresa')} className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Empresa {sortField === 'empresa' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('sku')} className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  SKU (Gemco) {sortField === 'sku' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('descricao')} className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Descrição {sortField === 'descricao' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('linha')} className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Linha {sortField === 'linha' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('classe')} className="py-2.5 px-2 text-center font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Classe {sortField === 'classe' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('endereco')} className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Endereço {sortField === 'endereco' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('diasBloq')} className="py-2.5 px-3 text-right font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Dias Bloq. {sortField === 'diasBloq' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('pecas')} className="py-2.5 px-3 text-center font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Peças {sortField === 'pecas' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('cubagem')} className="py-2.5 px-3 text-right font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  m³ {sortField === 'cubagem' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('valorTotal')} className="py-2.5 px-4 text-right font-bold cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                  Valor Total {sortField === 'valorTotal' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {filteredItems.map(it => (
                <tr key={it.sku} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-sans text-slate-500 whitespace-nowrap text-[10.5px]">{it.empresa}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{it.sku}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800 whitespace-nowrap" title={it.descricao}>
                    {it.descricao}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-600 whitespace-nowrap text-[10.5px]">{it.linha}</td>
                  <td className="py-2 px-2 text-center text-slate-600 whitespace-nowrap text-[10.5px]">{it.classe}</td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap text-[10.5px]">{it.endereco}</td>
                  <td className="py-2 px-3 text-right text-slate-700 whitespace-nowrap">{it.diasBloq} dias</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-800 whitespace-nowrap">{it.pecas}</td>
                  <td className="py-2 px-3 text-right text-slate-800 whitespace-nowrap">{it.cubagem.toFixed(3)}</td>
                  <td className="py-2 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrencyMil(it.valorTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold sticky bottom-0 text-[11px] shadow-sm">
              <tr>
                <td colSpan={7} className="py-2.5 px-4 text-right font-sans uppercase text-slate-800">
                  Total do Motivo:
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-900 font-black">
                  {totalPecas.toLocaleString('pt-BR')}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-black">
                  {totalCub.toFixed(3)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-900 font-black">
                  {formatCurrencyMil(totalVal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            {filteredItems.length} registros exibidos
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copiado!' : 'Copiar Tabela'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const EstoqueCategoriasCard: React.FC<{
  data: EstoqueSummaryData
  filterStatus: 'BOM' | 'BLOQUEADOS'
  onFilterChange: (status: 'BOM' | 'BLOQUEADOS') => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  isProcessing?: boolean
  bloqueioFaixa: string
  onBloqueioFaixaChange: (faixa: string) => void
  totalEstoqueGeralValor?: number
}> = ({ data, filterStatus, onFilterChange, onFileUpload, isProcessing, bloqueioFaixa, onBloqueioFaixaChange, totalEstoqueGeralValor }) => {
  const isBloqueios = filterStatus === 'BLOQUEADOS'
  const bloqueiosData = data.bloqueios

  // Valor total de referência do estoque para cálculo da porcentagem
  const baseTotalValor = totalEstoqueGeralValor || 147129255.02

  // Estado para o Modal de Detalhes do Bloqueio
  const [selectedMotivo, setSelectedMotivo] = useState<EstoqueBloqueioMotivo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenMotivo = (motivo: EstoqueBloqueioMotivo) => {
    setSelectedMotivo(motivo)
    setIsModalOpen(true)
  }

  // Filtra ou calcula os motivos de qualidade conforme a faixa de dias selecionada
  const faixasDisponiveis = ['TODOS', '0 DIAS', '7 DIAS', '30 DIAS', '90 DIAS', '120 DIAS', 'ACIMA DE 120 DIAS']

  const motivosFiltrados = useMemo(() => {
    if (!bloqueiosData?.motivos) return []
    return bloqueiosData.motivos.map(m => {
      let valorExibido = m.valorTotal
      if (bloqueioFaixa !== 'TODOS') {
        valorExibido = (m.faixas as any)[bloqueioFaixa] || 0
      }
      return {
        ...m,
        valorExibido
      }
    }).filter(m => m.valorExibido > 0 || bloqueioFaixa === 'TODOS')
      .sort((a, b) => b.valorExibido - a.valorExibido)
  }, [bloqueiosData, bloqueioFaixa])

  // Totalizadores de Bloqueios
  const totalGeralBloqueios = useMemo(() => {
    if (!bloqueiosData) return { skus: 0, pecas: 0, cubagem: 0, valor: 0 }
    if (bloqueioFaixa === 'TODOS') {
      return {
        skus: bloqueiosData.totalSkus,
        pecas: bloqueiosData.totalPecas,
        cubagem: bloqueiosData.totalCubagem,
        valor: bloqueiosData.totalValor
      }
    }
    const valFaixa = (bloqueiosData.totalFaixas as any)[bloqueioFaixa] || 0
    const sumPecas = motivosFiltrados.reduce((acc, m) => acc + m.pecas, 0)
    const sumCub = motivosFiltrados.reduce((acc, m) => acc + m.cubagem, 0)
    const sumSkus = motivosFiltrados.reduce((acc, m) => acc + m.skus, 0)
    return {
      skus: sumSkus,
      pecas: sumPecas,
      cubagem: Math.round(sumCub * 100) / 100,
      valor: Math.round(valFaixa * 100) / 100
    }
  }, [bloqueiosData, bloqueioFaixa, motivosFiltrados])

  return (
    <Card className="p-4 xl:col-span-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded-lg ${isBloqueios ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              <Boxes size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">
                {isBloqueios ? 'Estoque Bloqueado por Motivo' : 'Estoque por Categoria (m³)'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Base: EstoqueCD.xlsx &bull; {data.totalLinhas.toLocaleString('pt-BR')} itens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Filtro DS_AREA_ERP: BOM vs BLOQUEADOS */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onFilterChange('BOM')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  filterStatus === 'BOM'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Apenas itens com status BOM em DS_AREA_ERP"
              >
                BOM
              </button>
              <button
                type="button"
                onClick={() => onFilterChange('BLOQUEADOS')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  filterStatus === 'BLOQUEADOS'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Itens com status BLOQUEADO em DS_AREA_ERP"
              >
                Bloqueios
              </button>
            </div>

            {/* Botão de Upload */}
            <label
              htmlFor="estoque-file-input"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 cursor-pointer transition-all shrink-0"
              title="Importar nova planilha EstoqueCD.xlsx"
            >
              {isProcessing ? (
                <RefreshCw size={11} className="animate-spin text-blue-600" />
              ) : (
                <UploadCloud size={11} />
              )}
              <span>{isProcessing ? 'Lendo...' : 'Atualizar'}</span>
              <input
                id="estoque-file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileUpload}
                disabled={isProcessing}
              />
            </label>
          </div>
        </div>

        {/* Resumo Totalizador Superior (5 cards) */}
        {!isBloqueios ? (
          (() => {
            const capGeral = data.totalCapacidade || 27519
            const armGeral = Math.round(data.totalCubagem)
            const gapGeral = capGeral - armGeral
            const gapFormatted = gapGeral > 0
              ? `+${gapGeral.toLocaleString('pt-BR')}`
              : `${gapGeral.toLocaleString('pt-BR')}`

            return (
              <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-2.5">
                {/* Cubagem Total (Armazenado) */}
                <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    <span className="p-0.5 rounded bg-blue-50 text-blue-600">
                      <Boxes size={10} />
                    </span>
                    <span>Cubagem Total</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 leading-tight">
                    {armGeral.toLocaleString('pt-BR')}
                    <span className="text-[9px] font-bold text-slate-500 ml-0.5">m³</span>
                  </span>
                </div>

                {/* Capacidade Meta */}
                <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    <span className="p-0.5 rounded bg-sky-50 text-sky-600">
                      <Warehouse size={10} />
                    </span>
                    <span>Capacidade Meta</span>
                  </div>
                  <span className="text-sm font-black text-blue-700 leading-tight">
                    {capGeral.toLocaleString('pt-BR')}
                    <span className="text-[9px] font-bold text-slate-500 ml-0.5">m³</span>
                  </span>
                </div>

                {/* Gap da Diferença (Capacidade - Armazenado) */}
                <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    <span className={`p-0.5 rounded ${gapGeral < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <TrendingUp size={10} />
                    </span>
                    <span>Gap / Dif.</span>
                  </div>
                  <span className={`text-sm font-black leading-tight ${gapGeral < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {gapFormatted}
                    <span className="text-[9px] font-bold ml-0.5">m³</span>
                  </span>
                </div>

                {/* Ocupação Geral */}
                <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    <span className={`p-0.5 rounded ${(data.totalOcupacao || 0) > 100 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <PieChart size={10} />
                    </span>
                    <span>Ocupação Geral</span>
                  </div>
                  <span className={`text-sm font-black leading-tight ${(data.totalOcupacao || 0) > 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(data.totalOcupacao || Math.round((data.totalCubagem / 27519) * 100)).toFixed(1)}%
                  </span>
                </div>

                {/* Valor Total do Estoque */}
                <div
                  className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs cursor-default"
                  title={`Valor Total do Estoque: R$ ${(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                >
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                    <span className="p-0.5 rounded bg-emerald-50 text-emerald-600">
                      <DollarSign size={10} />
                    </span>
                    <span className="text-emerald-800">Valor TT</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700 font-mono leading-tight">
                    {formatCurrencyCompact(data.totalValor)}
                  </span>
                </div>
              </div>
            )
          })()
        ) : (
          /* Cards Totalizadores de Bloqueios */
          <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-amber-50/50 border border-amber-100 mb-2.5">
            {/* Cubagem Bloqueada */}
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                <span className="p-0.5 rounded bg-amber-50 text-amber-600">
                  <Boxes size={10} />
                </span>
                <span>Cubagem Bloq.</span>
              </div>
              <span className="text-sm font-black text-slate-800 leading-tight">
                {totalGeralBloqueios.cubagem.toLocaleString('pt-BR')}
                <span className="text-[9px] font-bold text-slate-500 ml-0.5">m³</span>
              </span>
            </div>

            {/* Peças Bloqueadas */}
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                <span className="p-0.5 rounded bg-blue-50 text-blue-600">
                  <Package size={10} />
                </span>
                <span>Peças Bloq.</span>
              </div>
              <span className="text-sm font-black text-blue-700 leading-tight">
                {totalGeralBloqueios.pecas.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* SKUs Distintos */}
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                <span className="p-0.5 rounded bg-indigo-50 text-indigo-600">
                  <Layers size={10} />
                </span>
                <span>SKUs Únicos</span>
              </div>
              <span className="text-sm font-black text-indigo-700 leading-tight">
                {totalGeralBloqueios.skus.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* Linhas / Registros */}
            <div className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                <span className="p-0.5 rounded bg-rose-50 text-rose-600">
                  <AlertTriangle size={10} />
                </span>
                <span>Ocorrências</span>
              </div>
              <span className="text-sm font-black text-rose-600 leading-tight">
                {data.totalLinhas.toLocaleString('pt-BR')}
              </span>
            </div>

            {/* Valor TT Bloqueado com % do Estoque Total */}
            <div
              className="flex flex-col items-center text-center p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs cursor-default"
              title={`Valor Bloqueado: R$ ${totalGeralBloqueios.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${baseTotalValor > 0 ? ((totalGeralBloqueios.valor / baseTotalValor) * 100).toFixed(2) : 0}% do Estoque Total)`}
            >
              <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                <span className="p-0.5 rounded bg-emerald-50 text-emerald-600">
                  <DollarSign size={10} />
                </span>
                <span className="text-emerald-800">Valor TT Bloq.</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-emerald-700 font-mono leading-tight">
                  {formatCurrencyCompact(totalGeralBloqueios.valor)}
                </span>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {baseTotalValor > 0 ? `${((totalGeralBloqueios.valor / baseTotalValor) * 100).toFixed(2)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL: TABELA BOM vs TABELA DE BLOQUEIOS */}
        {!isBloqueios ? (
          <div>
            {/* Cabeçalho das Colunas BOM: Categoria | Armazenado | Capacidade | Diferença | Valor TT | Ocupação */}
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 mb-1">
              <span>Categoria</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-14 sm:w-16 text-right">Armazenado</span>
                <span className="w-14 sm:w-16 text-right">Capacidade</span>
                <span className="w-14 sm:w-16 text-right">Diferença</span>
                <span className="w-14 sm:w-16 text-right text-emerald-700">Valor TT</span>
                <span className="w-10 text-right">Ocup.</span>
              </div>
            </div>

            {/* Lista de Categorias BOM */}
            <div className="space-y-1">
              {data.categorias.map(cat => {
                const config = CATEGORY_CONFIG[cat.nome] || {
                  bar: 'bg-blue-600',
                  text: 'text-blue-700',
                  bg: 'bg-blue-50/80',
                  border: 'border-blue-100',
                  icon: <Boxes size={12} className="text-blue-600" />
                }
                const isOverCapacity = cat.ocupacao > 100
                const progressColor = isOverCapacity ? 'bg-rose-500' : 'bg-emerald-500'

                const diff = Math.round(cat.capacidade - cat.cubagem)
                const diffFormatted = diff > 0
                  ? `+${diff.toLocaleString('pt-BR')} m³`
                  : `${diff.toLocaleString('pt-BR')} m³`

                return (
                  <div
                    key={cat.nome}
                    className="group p-1 rounded-lg hover:bg-slate-50/90 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${config.bg} ${config.border}`}>
                          {config.icon}
                        </span>
                        <span className="font-bold text-slate-700 truncate text-[11px]" title={cat.nome}>
                          {cat.nome}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0 text-right font-mono text-[10.5px]">
                        {/* Armazenado */}
                        <span className="w-14 sm:w-16 font-black text-slate-900" title={`Armazenado: ${Math.round(cat.cubagem).toLocaleString('pt-BR')} m³`}>
                          {Math.round(cat.cubagem).toLocaleString('pt-BR')} <span className="text-[8.5px] font-normal text-slate-400">m³</span>
                        </span>

                        {/* Capacidade */}
                        <span className="w-14 sm:w-16 text-slate-500 font-medium" title={`Capacidade: ${cat.capacidade.toLocaleString('pt-BR')} m³`}>
                          {cat.capacidade.toLocaleString('pt-BR')} <span className="text-[8.5px] font-normal text-slate-400">m³</span>
                        </span>

                        {/* Diferença */}
                        <span
                          className={`w-14 sm:w-16 text-[9.5px] font-bold ${
                            diff < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                          title={diff < 0 ? `Excesso de ${Math.abs(diff).toLocaleString('pt-BR')} m³` : `Saldo disponível de ${diffFormatted}`}
                        >
                          {diffFormatted}
                        </span>

                        {/* Valor TT */}
                        <span
                          className="w-14 sm:w-16 text-[10px] font-bold text-emerald-700"
                          title={cat.valor ? `Valor em Estoque: R$ ${cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem valor calculado'}
                        >
                          {formatCurrencyCompact(cat.valor)}
                        </span>

                        {/* Ocupação */}
                        <span
                          className={`w-10 text-[9px] font-bold px-1 py-0.2 rounded text-center ${
                            isOverCapacity
                              ? 'text-rose-600 bg-rose-50 border border-rose-100'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                          }`}
                        >
                          {cat.ocupacao.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Barra de ocupação */}
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(cat.ocupacao, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* TABELA DE BLOQUEIOS COM SEGMENTAÇÃO DE DIAS */
          <div>
            {/* Segmentação Interativa por Faixa de Dias */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 no-scrollbar">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mr-1 shrink-0">
                Faixa:
              </span>
              {faixasDisponiveis.map(f => {
                const isSelected = bloqueioFaixa === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onBloqueioFaixaChange(f)}
                    className={`px-2 py-0.5 text-[9.5px] font-bold rounded-md whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                )
              })}
            </div>

            {/* Cabeçalho da Tabela de Bloqueios */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[8.5px] font-bold uppercase text-slate-600 bg-slate-50">
                    <th className="py-1 px-1.5 font-bold">Motivo de Qualidade</th>
                    <th className="py-1 px-1 text-center w-10">SKUs</th>
                    <th className="py-1 px-1 text-center w-10">Pçs</th>
                    <th className="py-1 px-1 text-center w-12">m³</th>
                    {bloqueioFaixa === 'TODOS' ? (
                      <>
                        <th className="py-1 px-1 text-right w-14 text-emerald-700">0 Dias</th>
                        <th className="py-1 px-1 text-right w-14 text-emerald-700">7 Dias</th>
                        <th className="py-1 px-1 text-right w-14 text-amber-700">30 Dias</th>
                        <th className="py-1 px-1 text-right w-14 text-amber-700">90 Dias</th>
                        <th className="py-1 px-1 text-right w-14 text-rose-700">120 Dias</th>
                        <th className="py-1 px-1 text-right w-16 text-rose-800">+120 Dias</th>
                      </>
                    ) : null}
                    <th className="py-1 px-1.5 text-right font-bold w-16 text-emerald-800">
                      {bloqueioFaixa === 'TODOS' ? 'Valor Total' : `Valor (${bloqueioFaixa})`}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {motivosFiltrados.slice(0, 15).map(m => (
                    <tr key={m.motivo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1 px-1.5 font-sans font-medium text-slate-800 truncate max-w-[140px]">
                        <button
                          type="button"
                          onClick={() => handleOpenMotivo(m)}
                          className="text-left font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer truncate max-w-full"
                          title={`Clique para ver detalhes de ${m.motivo}`}
                        >
                          {m.motivo}
                        </button>
                      </td>
                      <td className="py-1 px-1 text-center text-slate-600">{m.skus}</td>
                      <td className="py-1 px-1 text-center text-slate-600">{m.pecas.toLocaleString('pt-BR')}</td>
                      <td className="py-1 px-1 text-center text-slate-600">{m.cubagem.toFixed(1)}</td>
                      {bloqueioFaixa === 'TODOS' ? (
                        <>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['0 DIAS'])}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['7 DIAS'])}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['30 DIAS'])}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['90 DIAS'])}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['120 DIAS'])}</td>
                          <td className="py-1 px-1 text-right text-slate-500">{formatCurrencyCompact(m.faixas['ACIMA DE 120 DIAS'])}</td>
                        </>
                      ) : null}
                      <td className="py-1 px-1.5 text-right font-bold text-emerald-700">
                        {formatCurrencyCompact(m.valorExibido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-[9.5px]">
                    <td className="py-1 px-1.5 font-sans uppercase text-slate-800">Total Geral</td>
                    <td className="py-1 px-1 text-center font-mono text-slate-800">{totalGeralBloqueios.skus}</td>
                    <td className="py-1 px-1 text-center font-mono text-slate-800">{totalGeralBloqueios.pecas.toLocaleString('pt-BR')}</td>
                    <td className="py-1 px-1 text-center font-mono text-slate-800">{totalGeralBloqueios.cubagem.toFixed(1)}</td>
                    {bloqueioFaixa === 'TODOS' && bloqueiosData ? (
                      <>
                        <td className="py-1 px-1 text-right font-mono text-emerald-700">{formatCurrencyCompact(bloqueiosData.totalFaixas['0 DIAS'])}</td>
                        <td className="py-1 px-1 text-right font-mono text-emerald-700">{formatCurrencyCompact(bloqueiosData.totalFaixas['7 DIAS'])}</td>
                        <td className="py-1 px-1 text-right font-mono text-amber-700">{formatCurrencyCompact(bloqueiosData.totalFaixas['30 DIAS'])}</td>
                        <td className="py-1 px-1 text-right font-mono text-amber-700">{formatCurrencyCompact(bloqueiosData.totalFaixas['90 DIAS'])}</td>
                        <td className="py-1 px-1 text-right font-mono text-rose-700">{formatCurrencyCompact(bloqueiosData.totalFaixas['120 DIAS'])}</td>
                        <td className="py-1 px-1 text-right font-mono text-rose-800">{formatCurrencyCompact(bloqueiosData.totalFaixas['ACIMA DE 120 DIAS'])}</td>
                      </>
                    ) : null}
                    <td className="py-1 px-1.5 text-right font-mono text-emerald-800 font-black">
                      {formatCurrencyCompact(totalGeralBloqueios.valor)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 text-[9.5px] text-slate-400 flex items-center justify-between mt-2">
        <span>
          Filtro ERP:{' '}
          <strong className="text-slate-600 font-semibold">
            {isBloqueios ? `Somente Bloqueados (${bloqueioFaixa})` : 'Somente Status BOM'}
          </strong>
        </span>
        <span>
          {isBloqueios ? `${motivosFiltrados.length} motivos` : `${data.categorias.length} categorias`}
        </span>
      </div>

      {/* Modal de Detalhes do Bloqueio */}
      <BloqueioDetalhesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        motivoNome={selectedMotivo?.motivo || ''}
        items={selectedMotivo?.items || []}
      />
    </Card>
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

  // Calcula a janela de 7 dias para o gráfico incluindo o dia de hoje (vinculados ao Acompanhamento Diário)
  const performance7Days = useMemo<OperationalPerformanceDay[]>(() => {
    const now = new Date()
    const curYear = chartAderenciaData?.ano || now.getFullYear()
    const curMonth = chartAderenciaData?.mes || (now.getMonth() + 1)
    const todayNum = now.getDate()
    const weekdayLetters = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    const liberadoTotals = (chartAderenciaData?.liberado?.totals as any)?.[chartMetric] || {}
    const faturadoTotals = (chartAderenciaData?.faturado?.totals as any)?.[chartMetric] || {}
    const capacidadeMap = (chartAderenciaData?.capacidade as any)?.[chartMetric] || {}

    // Padrão de capacidade por dia útil
    const defaultCap = chartMetric === 'cubagem' ? 1000 : chartMetric === 'pedidos' ? 2800 : 10000

    // Se o dia atual for maior que 7 no mês vigente, exibe a janela que alcança até a data de hoje
    const totalDaysInMonth = new Date(curYear, curMonth, 0).getDate()
    const effectiveDay = Math.min(Math.max(todayNum, 1), totalDaysInMonth)
    const startDay = effectiveDay <= 7 ? 1 : Math.max(1, effectiveDay - 6)
    const endDay = Math.min(startDay + 6, totalDaysInMonth)

    const result: OperationalPerformanceDay[] = []
    for (let dayNum = startDay; dayNum <= endDay; dayNum++) {
      const dayStr = dayNum.toString().padStart(2, '0')
      const dt = new Date(curYear, curMonth - 1, dayNum)
      const isSunday = dt.getDay() === 0
      const isToday = dayNum === todayNum && (now.getMonth() + 1) === curMonth && now.getFullYear() === curYear
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
        isToday,
        faturado: fatVal,
        liberado: libVal,
        capacidade: capVal
      })
    }
    return result
  }, [chartAderenciaData, chartMetric])

  // Estado do Relatório de Estoque por Categoria (EstoqueCD.xlsx) com filtro de DS_AREA_ERP (BOM vs BLOQUEADOS)
  const [estoqueFilterStatus, setEstoqueFilterStatus] = useState<'BOM' | 'BLOQUEADOS'>('BOM')
  const [bloqueioFaixa, setBloqueioFaixa] = useState<string>('TODOS')
  const [estoqueBaseSummary, setEstoqueBaseSummary] = useState<{
    bomOnly: EstoqueSummaryData
    todos: EstoqueSummaryData
    bloqueios?: EstoqueBloqueiosData
  }>(() => {
    try {
      const cached = localStorage.getItem('magalog_estoque_categoria_summary_v2')
      if (cached) return JSON.parse(cached)
    } catch {}

    const raw = initialEstoqueCategoria as any
    if (raw?.bomOnly && raw?.todos) {
      return { bomOnly: raw.bomOnly, todos: raw.todos, bloqueios: raw.bloqueios }
    }
    // Fallback caso seja estrutura antiga
    const defaultData: EstoqueSummaryData = {
      updatedAt: new Date().toISOString(),
      totalCubagem: raw?.totalCubagem || 31526.16,
      totalCapacidade: 27519,
      totalOcupacao: 114.6,
      totalPecas: raw?.totalPecas || 358609,
      totalValor: raw?.totalValor || 147355461.73,
      totalLinhas: raw?.totalLinhas || 12729,
      categorias: raw?.categorias || []
    }
    return { bomOnly: defaultData, todos: defaultData, bloqueios: raw?.bloqueios }
  })
  const [isProcessingEstoque, setIsProcessingEstoque] = useState(false)

  // Dados ativos conforme o filtro selecionado (BOM vs BLOQUEADOS)
  const activeEstoqueData: EstoqueSummaryData = useMemo(() => {
    const isBloq = estoqueFilterStatus === 'BLOQUEADOS'
    if (isBloq && estoqueBaseSummary.bloqueios) {
      const b = estoqueBaseSummary.bloqueios
      return {
        updatedAt: estoqueBaseSummary.bomOnly?.updatedAt || new Date().toISOString(),
        totalCubagem: b.totalCubagem,
        totalCapacidade: 0,
        totalOcupacao: 0,
        totalPecas: b.totalPecas,
        totalValor: b.totalValor,
        totalLinhas: b.totalLinhas,
        categorias: [],
        bloqueios: b
      }
    }
    const active = estoqueBaseSummary.bomOnly
    const totalCapacidade = 27519
    const totalOcupacao = totalCapacidade > 0 ? (active.totalCubagem / totalCapacidade) * 100 : 0
    return {
      ...active,
      totalCapacidade,
      totalOcupacao,
      bloqueios: estoqueBaseSummary.bloqueios
    }
  }, [estoqueBaseSummary, estoqueFilterStatus])

  // Função para processar arquivo EstoqueCD.xlsx no frontend calculando BOM e TODOS e cruzando valores com base_valores
  const handleEstoqueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingEstoque(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const wb = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet)

      // 1. Identificar todos os códigos master e volumes
      const masterCodesSet = new Set<string>()
      const volMap = new Map<string, number>()

      rows.forEach(r => {
        const cod = String(r.CODIGO || '').trim()
        const master = String(r.COD_GEMCO || cod.split('/')[0]).trim()
        if (master) {
          masterCodesSet.add(master)
        }

        const ds = String(r.DS_ITEM || '')
        const mVol = ds.match(/VOL:?\s*(\d+)\s*\/\s*(\d+)/i)
        let totalVols = 1
        if (mVol) totalVols = parseInt(mVol[2], 10) || 1
        if (cod.includes('/')) {
          const suff = parseInt(cod.split('/')[1], 10)
          if (suff && suff > totalVols) totalVols = suff
        }
        const cur = volMap.get(master) || 1
        if (totalVols > cur) volMap.set(master, totalVols)
      })

      // 2. Buscar valores na tabela base_valores do Supabase em lotes
      const costMap = new Map<string, number>()
      const masterList = Array.from(masterCodesSet)
      const batchSize = 500
      const fetchBatches: string[][] = []
      for (let i = 0; i < masterList.length; i += batchSize) {
        fetchBatches.push(masterList.slice(i, i + batchSize))
      }

      try {
        const batchResults = await Promise.all(
          fetchBatches.map(batch =>
            supabase
              .from('base_valores')
              .select('codigo, custo_inv')
              .in('codigo', batch)
          )
        )
        batchResults.forEach(res => {
          if (res.data) {
            res.data.forEach(item => {
              costMap.set(String(item.codigo).trim(), Number(item.custo_inv) || 0)
            })
          }
        })
      } catch (errFetch) {
        console.warn('Não foi possível consultar base_valores no Supabase:', errFetch)
      }

      const buildSummary = (onlyBom: boolean): EstoqueSummaryData => {
        const catTotals: Record<string, { cubagem: number; pecas: number; itens: number; valor: number }> = {}
        let totalCub = 0
        let totalQtd = 0
        let totalVal = 0
        let countLines = 0

        rows.forEach(r => {
          const area = String(r.DS_AREA_ERP || '').trim().toUpperCase()
          if (onlyBom && area !== 'BOM') return

          countLines++
          const classeItem = String(r.CLASSE_ITEM || '').trim()
          const categoria = CLASSE_ITEM_MAPPING[classeItem] || 'Diversos'
          const cub = Number(r.CUB_TOTAL) || 0
          const qnts = Number(r.QNTS) || 0

          const cod = String(r.CODIGO || '').trim()
          const master = String(r.COD_GEMCO || cod.split('/')[0]).trim()
          const custoMaster = costMap.get(master) || 0
          const numVols = volMap.get(master) || 1
          const itemValor = (custoMaster / numVols) * qnts

          if (!catTotals[categoria]) {
            catTotals[categoria] = { cubagem: 0, pecas: 0, itens: 0, valor: 0 }
          }
          catTotals[categoria].cubagem += cub
          catTotals[categoria].pecas += qnts
          catTotals[categoria].itens += 1
          catTotals[categoria].valor += itemValor

          totalCub += cub
          totalQtd += qnts
          totalVal += itemValor
        })

        const totalCapacidade = 27519
        const categorias: EstoqueCategoriaItem[] = Object.entries(catTotals).map(([nome, val]) => {
          const cap = CAPACIDADE_CATEGORIAS[nome] || 0
          const cub = Math.round(val.cubagem * 100) / 100
          const ocupacao = cap > 0 ? (cub / cap) * 100 : 0
          return {
            nome,
            cubagem: cub,
            capacidade: cap,
            ocupacao: Math.round(ocupacao * 10) / 10,
            pecas: val.pecas,
            itens: val.itens,
            valor: Math.round(val.valor * 100) / 100,
            percentual: totalCub > 0 ? Math.round((cub / totalCub) * 1000) / 10 : 0
          }
        }).sort((a, b) => b.cubagem - a.cubagem)

        return {
          updatedAt: new Date().toISOString(),
          totalCubagem: Math.round(totalCub * 100) / 100,
          totalCapacidade,
          totalOcupacao: totalCapacidade > 0 ? Math.round((totalCub / totalCapacidade) * 1000) / 10 : 0,
          totalPecas: totalQtd,
          totalValor: Math.round(totalVal * 100) / 100,
          totalLinhas: countLines,
          categorias
        }
      }

      const buildBloqueios = (): EstoqueBloqueiosData => {
        const bloqRows = rows.filter(r => String(r.DS_AREA_ERP || '').trim().toUpperCase() === 'BLOQUEADO')
        const motivosMap: Record<string, {
          motivo: string
          skusSet: Set<string>
          pecas: number
          cubagem: number
          valorTotal: number
          faixas: {
            '0 DIAS': number
            '7 DIAS': number
            '30 DIAS': number
            '90 DIAS': number
            '120 DIAS': number
            'ACIMA DE 120 DIAS': number
          }
          itemsMap: Record<string, EstoqueBloqueioItemDetalhe>
        }> = {}

        let totalPecas = 0
        let totalCubagem = 0
        let totalValor = 0
        const allSkusSet = new Set<string>()
        const totalFaixas = {
          '0 DIAS': 0,
          '7 DIAS': 0,
          '30 DIAS': 0,
          '90 DIAS': 0,
          '120 DIAS': 0,
          'ACIMA DE 120 DIAS': 0
        }

        const getFaixa = (dias: number) => {
          if (dias === 0) return '0 DIAS'
          if (dias <= 7) return '7 DIAS'
          if (dias <= 30) return '30 DIAS'
          if (dias <= 90) return '90 DIAS'
          if (dias <= 120) return '120 DIAS'
          return 'ACIMA DE 120 DIAS'
        }

        bloqRows.forEach(r => {
          const rawMotivo = String(r.AREA_ARMEZENAGEM || 'OUTROS').trim()
          const motivo = rawMotivo.replace(/^\d+\s*-\s*/, '').trim()
          const cod = String(r.CODIGO || '').trim()
          const master = String(r.COD_GEMCO || cod.split('/')[0]).trim()
          const qnts = Number(r.QNTS) || 0
          const cub = Number(r.CUB_TOTAL) || 0
          const dias = Number(r.DIAS_ARMAZENAGEM) || 0
          const faixa = getFaixa(dias)

          const custoMaster = costMap.get(master) || 0
          const numVols = volMap.get(master) || 1
          const itemValor = (custoMaster / numVols) * qnts

          allSkusSet.add(master)
          totalPecas += qnts
          totalCubagem += cub
          totalValor += itemValor
          ;(totalFaixas as any)[faixa] += itemValor

          if (!motivosMap[motivo]) {
            motivosMap[motivo] = {
              motivo,
              skusSet: new Set(),
              pecas: 0,
              cubagem: 0,
              valorTotal: 0,
              faixas: {
                '0 DIAS': 0,
                '7 DIAS': 0,
                '30 DIAS': 0,
                '90 DIAS': 0,
                '120 DIAS': 0,
                'ACIMA DE 120 DIAS': 0
              },
              itemsMap: {}
            }
          }
          const m = motivosMap[motivo]
          m.skusSet.add(master)
          m.pecas += qnts
          m.cubagem += cub
          m.valorTotal += itemValor
          ;(m.faixas as any)[faixa] += itemValor

          if (master) {
            if (!m.itemsMap[master]) {
              m.itemsMap[master] = {
                empresa: String(r.EMPRESA || '1994 - CD994-MARACANAU'),
                sku: master,
                descricao: String(r.DS_ITEM || ''),
                linha: String(r.DS_LINHA || ''),
                classe: String(r.CLASSE_ITEM || ''),
                endereco: String(r.END3 || ''),
                diasBloq: dias,
                pecas: 0,
                cubagem: 0,
                valorTotal: 0
              }
            }
            const it = m.itemsMap[master]
            it.pecas += qnts
            it.cubagem += cub
            it.valorTotal += itemValor
            if (dias > it.diasBloq) it.diasBloq = dias
          }
        })

        const motivos: EstoqueBloqueioMotivo[] = Object.values(motivosMap).map(m => ({
          motivo: m.motivo,
          skus: m.skusSet.size,
          pecas: m.pecas,
          cubagem: Math.round(m.cubagem * 100) / 100,
          valorTotal: Math.round(m.valorTotal * 100) / 100,
          faixas: {
            '0 DIAS': Math.round(m.faixas['0 DIAS'] * 100) / 100,
            '7 DIAS': Math.round(m.faixas['7 DIAS'] * 100) / 100,
            '30 DIAS': Math.round(m.faixas['30 DIAS'] * 100) / 100,
            '90 DIAS': Math.round(m.faixas['90 DIAS'] * 100) / 100,
            '120 DIAS': Math.round(m.faixas['120 DIAS'] * 100) / 100,
            'ACIMA DE 120 DIAS': Math.round(m.faixas['ACIMA DE 120 DIAS'] * 100) / 100
          },
          items: Object.values(m.itemsMap).map(it => ({
            ...it,
            cubagem: Math.round(it.cubagem * 1000) / 1000,
            valorTotal: Math.round(it.valorTotal * 100) / 100
          })).sort((a, b) => b.valorTotal - a.valorTotal)
        })).sort((a, b) => b.valorTotal - a.valorTotal)

        return {
          totalLinhas: bloqRows.length,
          totalSkus: allSkusSet.size,
          totalPecas,
          totalCubagem: Math.round(totalCubagem * 100) / 100,
          totalValor: Math.round(totalValor * 100) / 100,
          totalFaixas: {
            '0 DIAS': Math.round(totalFaixas['0 DIAS'] * 100) / 100,
            '7 DIAS': Math.round(totalFaixas['7 DIAS'] * 100) / 100,
            '30 DIAS': Math.round(totalFaixas['30 DIAS'] * 100) / 100,
            '90 DIAS': Math.round(totalFaixas['90 DIAS'] * 100) / 100,
            '120 DIAS': Math.round(totalFaixas['120 DIAS'] * 100) / 100,
            'ACIMA DE 120 DIAS': Math.round(totalFaixas['ACIMA DE 120 DIAS'] * 100) / 100
          },
          motivos
        }
      }

      const newBaseSummary = {
        bomOnly: buildSummary(true),
        todos: buildSummary(false),
        bloqueios: buildBloqueios()
      }

      setEstoqueBaseSummary(newBaseSummary)
      try {
        localStorage.setItem('magalog_estoque_categoria_summary_v2', JSON.stringify(newBaseSummary))
      } catch {}

      // Grava no Supabase para sincronizar entre todos os usuários
      try {
        await supabase.from('performance_metrics').upsert({
          cell_key: 'estoque_categoria_summary_994_v2',
          value: JSON.stringify(newBaseSummary),
          updated_at: new Date().toISOString()
        }, { onConflict: 'cell_key' })
      } catch {}
    } catch (err) {
      console.error('Erro ao processar planilha de estoque:', err)
      alert('Erro ao processar EstoqueCD.xlsx. Verifique as colunas da planilha.')
    } finally {
      setIsProcessingEstoque(false)
      e.target.value = ''
    }
  }

  // Tenta carregar dados sincronizados do Supabase ao montar
  useEffect(() => {
    const loadCloudEstoque = async () => {
      try {
        const { data, error } = await supabase
          .from('performance_metrics')
          .select('value')
          .eq('cell_key', 'estoque_categoria_summary_994_v2')
          .maybeSingle()

        if (!error && data?.value) {
          const parsed = JSON.parse(data.value)
          if (parsed && parsed.bomOnly && parsed.todos) {
            setEstoqueBaseSummary(parsed)
            try {
              localStorage.setItem('magalog_estoque_categoria_summary_v2', JSON.stringify(parsed))
            } catch {}
          }
        }
      } catch {}
    }
    loadCloudEstoque()
  }, [])

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
        {/* Relatório de Categorias de Estoque / Bloqueios de Qualidade (EstoqueCD.xlsx) */}
        <EstoqueCategoriasCard
          data={activeEstoqueData}
          filterStatus={estoqueFilterStatus}
          onFilterChange={setEstoqueFilterStatus}
          onFileUpload={handleEstoqueUpload}
          isProcessing={isProcessingEstoque}
          bloqueioFaixa={bloqueioFaixa}
          onBloqueioFaixaChange={setBloqueioFaixa}
          totalEstoqueGeralValor={estoqueBaseSummary.bomOnly?.totalValor}
        />
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
