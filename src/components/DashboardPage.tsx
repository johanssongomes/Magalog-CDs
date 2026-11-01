import React from 'react'
import {
  LayoutDashboard, Package, User, Settings, Home, Clock, AlertTriangle, BarChart3, Timer,
  Bell, CheckCircle2, Info, Boxes, Truck, Warehouse, Wrench, Users, DollarSign, CalendarDays,
  TrendingUp, MessageSquareWarning
} from 'lucide-react'

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
  <div className={`rounded-2xl bg-white border border-slate-200 shadow-xs ${className}`}>{children}</div>
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

// ---------------- KPI Cards ----------------
const KpiNs: React.FC<{ icon: React.ReactNode; title: string; value: string; meta: string; tone: string; items: [string, string][] }> = ({ icon, title, value, meta, tone, items }) => (
  <Card className="p-3 flex items-center gap-3 min-w-0">
    <div className={`p-2.5 rounded-xl ${tone} shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase">{title}</p>
      <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
      <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{meta}</span>
    </div>
    <div className="ml-auto text-[10px] space-y-0.5 shrink-0">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <span className="text-slate-500">{k}</span>
          <span className="font-bold text-emerald-600">{v}</span>
        </div>
      ))}
    </div>
  </Card>
)

const KpiSimple: React.FC<{ icon?: React.ReactNode; title: string; value: string; badge?: string; badgeTone?: string; tone?: string }> = ({ icon, title, value, badge, badgeTone = 'bg-emerald-50 text-emerald-700 border-emerald-100', tone = 'bg-slate-50 text-slate-500' }) => (
  <Card className="p-3 flex items-center gap-3 min-w-0">
    {icon && <div className={`p-2.5 rounded-xl ${tone} shrink-0`}>{icon}</div>}
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{title}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
        {badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeTone}`}>{badge}</span>}
      </div>
    </div>
  </Card>
)

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
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-11 gap-3">
        <div className="2xl:col-span-2">
          <KpiNs icon={<Boxes size={22} />} tone="bg-blue-50 text-blue-600" title="NS Saída" value="97,8%" meta="Meta: 97,0%"
            items={[['Micro', '97,2%'], ['Courrie', '96,4%'], ['Rodo', '99,5']]} />
        </div>
        <div className="2xl:col-span-2">
          <KpiNs icon={<User size={22} />} tone="bg-purple-50 text-purple-600" title="NS Cliente" value="97,8%" meta="Meta: 97,0%"
            items={[['Micro', '96,2%'], ['Courrie', '96,4%'], ['Rodo', '99,5']]} />
        </div>
        <KpiSimple title="NS Full" value="98,7%" />
        <KpiSimple icon={<Settings size={20} />} tone="bg-emerald-50 text-emerald-600" title="NS RLE" value="96,2%" badge="Meta > 95%" />
        <div className="2xl:col-span-2">
          <Card className="p-3 h-full flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0"><MessageSquareWarning size={22} /></div>
            <div className="flex-1 min-w-0 text-[10px] space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Atendimento</p>
              {[
                ['% Reclamações (Diário)', '-'],
                ['% Reclamações (Mês)', '-'],
                ['Backlog Zendesk (Diário)', '-'],
                ['Chamados de Loja (Diário)', '-'],
                ['NPS Lojas (Diário)', '-']
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-500 truncate">{k}</span>
                  <span className="font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <KpiSimple icon={<Home size={20} />} tone="bg-amber-50 text-amber-600" title="Aderência de Quadro" value="94%" badge="+1,2 p.p." badgeTone="bg-slate-50 text-slate-500 border-slate-200" />
        <KpiSimple icon={<Clock size={20} />} tone="bg-amber-50 text-amber-600" title="Horas Extras" value="1,8%" badge="Dentro da meta" />
        <KpiSimple icon={<AlertTriangle size={20} />} tone="bg-rose-50 text-rose-600" title="Pendências Críticas" value="12" badge="Acompanhar" badgeTone="bg-rose-50 text-rose-700 border-rose-200" />
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
    </div>
  )
}

export default DashboardPage
