import React, { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Search,
  ChevronRight,
  Wallet,
  Receipt,
  FileCheck,
  BarChart4,
  Layers,
  Building2,
  Percent,
  Sparkles
} from 'lucide-react'

// Subpáginas disponíveis
export type BudgetSubPage =
  | 'visao_geral'
  | 'orcamento_disponivel'
  | 'despesas_realizadas'
  | 'compromissos_futuros'
  | 'previsto_x_realizado'
  | 'historico_mensal'

interface CostCenter {
  id: string
  name: string
  code: string
  allocated: number
  committed: number
  realized: number
  category: 'operacional' | 'manutencao' | 'pessoal' | 'facilities' | 'tecnologia'
}

interface ExpenseItem {
  id: string
  date: string
  description: string
  costCenter: string
  category: string
  amount: number
  status: 'aprovado' | 'pendente' | 'em_analise'
  invoiceNumber: string
}

interface CommitmentItem {
  id: string
  dueDate: string
  description: string
  supplier: string
  costCenter: string
  amount: number
  status: 'confirmado' | 'previsto' | 'sob_revisao'
  contractId: string
}

const INITIAL_COST_CENTERS: CostCenter[] = [
  { id: 'cc1', name: 'Operação Logística & Movimentação', code: 'CC-994-01', allocated: 850000, committed: 180000, realized: 540000, category: 'operacional' },
  { id: 'cc2', name: 'Manutenção de Equipamentos & Empilhadeiras', code: 'CC-994-02', allocated: 380000, committed: 65000, realized: 245000, category: 'manutencao' },
  { id: 'cc3', name: 'Recursos Humanos & Horas Extras / Temporários', code: 'CC-994-03', allocated: 620000, committed: 95000, realized: 460000, category: 'pessoal' },
  { id: 'cc4', name: 'Facilities, Segurança & Limpeza Predial', code: 'CC-994-04', allocated: 290000, committed: 48000, realized: 182000, category: 'facilities' },
  { id: 'cc5', name: 'TI, WMS, Hardware & Comunicação', code: 'CC-994-05', allocated: 160000, committed: 22000, realized: 98000, category: 'tecnologia' },
]

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp1', date: '21/10/2026', description: 'Revisão preventiva das empilhadeiras elétricas', costCenter: 'CC-994-02', category: 'Manutenção', amount: 18450, status: 'aprovado', invoiceNumber: 'NF-88219' },
  { id: 'exp2', date: '19/10/2026', description: 'Contratação equipe extra para pico de demanda', costCenter: 'CC-994-03', category: 'Pessoal', amount: 42300, status: 'aprovado', invoiceNumber: 'NF-87941' },
  { id: 'exp3', date: '17/10/2026', description: 'Paletes PBR padrão Magalog (lote 2.000 un)', costCenter: 'CC-994-01', category: 'Operacional', amount: 64000, status: 'aprovado', invoiceNumber: 'NF-86500' },
  { id: 'exp4', date: '15/10/2026', description: 'Manutenção do sistema de iluminação LED galpão', costCenter: 'CC-994-04', category: 'Facilities', amount: 9800, status: 'aprovado', invoiceNumber: 'NF-86120' },
  { id: 'exp5', date: '12/10/2026', description: 'Substituição baterias tracionárias docas 4 e 5', costCenter: 'CC-994-02', category: 'Manutenção', amount: 31200, status: 'aprovado', invoiceNumber: 'NF-85890' },
  { id: 'exp6', date: '10/10/2026', description: 'Licenciamento anual coletores WMS Honeywell', costCenter: 'CC-994-05', category: 'Tecnologia', amount: 15400, status: 'aprovado', invoiceNumber: 'NF-85440' },
]

const INITIAL_COMMITMENTS: CommitmentItem[] = [
  { id: 'com1', dueDate: '05/11/2026', description: 'Locação mensal frota de rebocadores elétricos', supplier: 'Linde Logística Brasil', costCenter: 'CC-994-01', amount: 58000, status: 'confirmado', contractId: 'CTR-2026-09' },
  { id: 'com2', dueDate: '10/11/2026', description: 'Serviço de limpeza e sanitização do CD 994', supplier: 'Clean Facilities S.A.', costCenter: 'CC-994-04', amount: 32000, status: 'confirmado', contractId: 'CTR-2026-14' },
  { id: 'com3', dueDate: '15/11/2026', description: 'Auditoria e certificação anual de segurança do trabalho', supplier: 'SafeWork Consultoria', costCenter: 'CC-994-03', amount: 18500, status: 'previsto', contractId: 'CTR-2026-22' },
  { id: 'com4', dueDate: '20/11/2026', description: 'Reforma e calibração de balanças dinâmicas', supplier: 'Toledo Metrologia', costCenter: 'CC-994-02', amount: 14200, status: 'confirmado', contractId: 'CTR-2026-31' },
  { id: 'com5', dueDate: '30/11/2026', description: 'Pacote de redundância link dedicado fibra ótica', supplier: 'Embratel Telecom', costCenter: 'CC-994-05', amount: 8900, status: 'confirmado', contractId: 'CTR-2026-02' },
]

const MONTHLY_HISTORY = [
  { month: 'Janeiro 2026', budgeted: 2200000, realized: 2050000, variance: 150000, variancePct: 6.8 },
  { month: 'Fevereiro 2026', budgeted: 2150000, realized: 2120000, variance: 30000, variancePct: 1.4 },
  { month: 'Março 2026', budgeted: 2300000, realized: 2280000, variance: 20000, variancePct: 0.9 },
  { month: 'Abril 2026', budgeted: 2250000, realized: 2310000, variance: -60000, variancePct: -2.7 },
  { month: 'Maio 2026', budgeted: 2400000, realized: 2340000, variance: 60000, variancePct: 2.5 },
  { month: 'Junho 2026', budgeted: 2350000, realized: 2290000, variance: 60000, variancePct: 2.6 },
  { month: 'Julho 2026', budgeted: 2300000, realized: 2250000, variance: 50000, variancePct: 2.2 },
  { month: 'Agosto 2026', budgeted: 2400000, realized: 2380000, variance: 20000, variancePct: 0.8 },
  { month: 'Setembro 2026', budgeted: 2350000, realized: 2310000, variance: 40000, variancePct: 1.7 },
  { month: 'Outubro 2026 (Atual)', budgeted: 2300000, realized: 1525000, variance: 775000, variancePct: 33.7 },
]

export const BudgetManagementPage: React.FC = () => {
  const [activeSubPage, setActiveSubPage] = useState<BudgetSubPage>('visao_geral')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [selectedMonth, setSelectedMonth] = useState('10')
  const [searchTerm, setSearchTerm] = useState('')

  // Cálculos globais consolidados
  const totalAllocated = INITIAL_COST_CENTERS.reduce((acc, c) => acc + c.allocated, 0)
  const totalRealized = INITIAL_COST_CENTERS.reduce((acc, c) => acc + c.realized, 0)
  const totalCommitted = INITIAL_COST_CENTERS.reduce((acc, c) => acc + c.committed, 0)
  const totalAvailable = totalAllocated - (totalRealized + totalCommitted)
  const executionRate = totalAllocated > 0 ? (totalRealized / totalAllocated) * 100 : 0
  const commitmentRate = totalAllocated > 0 ? ((totalRealized + totalCommitted) / totalAllocated) * 100 : 0

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Lista de subpáginas com ícones e rótulos
  const subPages = [
    { id: 'visao_geral', label: 'Visão Geral', icon: <Layers size={15} /> },
    { id: 'orcamento_disponivel', label: 'Orçamento Disponível', icon: <Wallet size={15} /> },
    { id: 'despesas_realizadas', label: 'Despesas Realizadas', icon: <Receipt size={15} /> },
    { id: 'compromissos_futuros', label: 'Compromissos Futuros', icon: <FileCheck size={15} /> },
    { id: 'previsto_x_realizado', label: 'Previsto × Realizado', icon: <BarChart4 size={15} /> },
    { id: 'historico_mensal', label: 'Histórico Mensal', icon: <Calendar size={15} /> },
  ]

  return (
    <div className="space-y-5 w-full notranslate pb-12" translate="no">
      {/* Top Banner de Gestão Orçamentária */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 shadow-lg text-white">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 border border-emerald-400/30">
            <DollarSign size={26} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wide uppercase">Gestão Orçamentária</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CD 994
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Controle de centros de custos, despesas operacionais, compromissos futuros e realizado vs. orçado.
            </p>
          </div>
        </div>

        {/* Seletores Globais de Exercício */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-extrabold">Ano:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="2025" className="bg-slate-900 text-white">2025</option>
              <option value="2026" className="bg-slate-900 text-white">2026</option>
              <option value="2027" className="bg-slate-900 text-white">2027</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-extrabold">Mês:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="09" className="bg-slate-900 text-white">Setembro</option>
              <option value="10" className="bg-slate-900 text-white">Outubro</option>
              <option value="11" className="bg-slate-900 text-white">Novembro</option>
              <option value="12" className="bg-slate-900 text-white">Dezembro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Barra de Navegação das 6 Subpáginas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {subPages.map((sub) => {
          const isActive = activeSubPage === sub.id
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubPage(sub.id as BudgetSubPage)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-1 ring-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{sub.icon}</span>
              <span>{sub.label}</span>
            </button>
          )
        })}
      </div>

      {/* Cards de Métricas Principais (Visíveis no topo de todas as abas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Orçamento Aprovado (CapEx/OpEx)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{formatCurrency(totalAllocated)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-blue-600">5 Centros de Custos</span>
            <span>• CD 994</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Orçamento Disponível Livre</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600">{formatCurrency(totalAvailable)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">{(100 - commitmentRate).toFixed(1)}%</span>
            <span>saldo para alocação</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Despesas Realizadas</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-purple-700">{formatCurrency(totalRealized)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-purple-700">{executionRate.toFixed(1)}%</span>
            <span>executado no mês</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Compromissos Futuros</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-amber-700">{formatCurrency(totalCommitted)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-amber-700">{((totalCommitted / totalAllocated) * 100).toFixed(1)}%</span>
            <span>comprometido em contratos</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico da Subpágina Selecionada */}
      {activeSubPage === 'visao_geral' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Distribuição por Centro de Custos do CD
                </h3>
                <p className="text-xs text-slate-500">
                  Visão consolidada de alocação orçamentária, realizado e compromissos por área.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 font-extrabold">Centro de Custo</th>
                    <th className="py-3 px-3 font-extrabold">Código</th>
                    <th className="py-3 px-3 font-extrabold text-right">Orçado (R$)</th>
                    <th className="py-3 px-3 font-extrabold text-right">Realizado (R$)</th>
                    <th className="py-3 px-3 font-extrabold text-right">Comprometido (R$)</th>
                    <th className="py-3 px-3 font-extrabold text-right">Saldo Livre (R$)</th>
                    <th className="py-3 px-3 font-extrabold text-center">% Utilização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_COST_CENTERS.map((cc) => {
                    const free = cc.allocated - (cc.realized + cc.committed)
                    const usedPct = ((cc.realized + cc.committed) / cc.allocated) * 100
                    return (
                      <tr key={cc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          {cc.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{cc.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 text-right">{formatCurrency(cc.allocated)}</td>
                        <td className="py-3 px-3 font-semibold text-purple-700 text-right">{formatCurrency(cc.realized)}</td>
                        <td className="py-3 px-3 font-semibold text-amber-700 text-right">{formatCurrency(cc.committed)}</td>
                        <td className="py-3 px-3 font-black text-emerald-600 text-right">{formatCurrency(free)}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usedPct > 90 ? 'bg-rose-500' : usedPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(usedPct, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-700">{usedPct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubPage === 'orcamento_disponivel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Detalhamento de Saldo Disponível por Área
              </h3>
              <p className="text-xs text-slate-500">
                Verifique quanto de margem orçamentária ainda está livre para novas requisições de compras e contratações.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {INITIAL_COST_CENTERS.map(cc => {
              const free = cc.allocated - (cc.realized + cc.committed)
              const freePct = (free / cc.allocated) * 100
              return (
                <div key={cc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{cc.code}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {freePct.toFixed(1)}% Livre
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{cc.name}</h4>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500">Saldo Livre:</span>
                    <span className="text-base font-black text-emerald-600">{formatCurrency(free)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(freePct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                    <span>Orçado: {formatCurrency(cc.allocated)}</span>
                    <span>Comprometido: {formatCurrency(cc.committed)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeSubPage === 'despesas_realizadas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Lançamentos de Despesas Realizadas
              </h3>
              <p className="text-xs text-slate-500">
                Histórico de notas fiscais faturadas, pagamentos liquidados e custos operacionais consumidos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar despesa ou NF..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-extrabold">Data</th>
                  <th className="py-3 px-3 font-extrabold">Descrição do Lançamento</th>
                  <th className="py-3 px-3 font-extrabold">Nota Fiscal</th>
                  <th className="py-3 px-3 font-extrabold">Centro de Custo</th>
                  <th className="py-3 px-3 font-extrabold">Categoria</th>
                  <th className="py-3 px-3 font-extrabold text-right">Valor (R$)</th>
                  <th className="py-3 px-3 font-extrabold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_EXPENSES
                  .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600">{exp.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{exp.description}</td>
                      <td className="py-3 px-3 font-mono text-blue-600 font-bold">{exp.invoiceNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{exp.costCenter}</td>
                      <td className="py-3 px-3 text-slate-600">{exp.category}</td>
                      <td className="py-3 px-3 font-black text-slate-900 text-right">{formatCurrency(exp.amount)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} /> Aprovado
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubPage === 'compromissos_futuros' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Compromissos Futuros & Pedidos de Compra
              </h3>
              <p className="text-xs text-slate-500">
                Previsão de pagamentos já comprometidos em contratos, pedidos de compra ou locações vigentes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-extrabold">Vencimento</th>
                  <th className="py-3 px-3 font-extrabold">Descrição do Compromisso</th>
                  <th className="py-3 px-3 font-extrabold">Fornecedor</th>
                  <th className="py-3 px-3 font-extrabold">Contrato / Pedido</th>
                  <th className="py-3 px-3 font-extrabold">Centro Custo</th>
                  <th className="py-3 px-3 font-extrabold text-right">Valor Comprometido</th>
                  <th className="py-3 px-3 font-extrabold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_COMMITMENTS.map(com => (
                  <tr key={com.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-700">{com.dueDate}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{com.description}</td>
                    <td className="py-3 px-3 text-slate-600">{com.supplier}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{com.contractId}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{com.costCenter}</td>
                    <td className="py-3 px-3 font-black text-slate-900 text-right">{formatCurrency(com.amount)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Clock size={12} /> Confirmado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubPage === 'previsto_x_realizado' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Comparativo Previsto × Realizado
              </h3>
              <p className="text-xs text-slate-500">
                Análise de aderência orçamentária e variações financeiras por Centro de Custo.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-extrabold">Centro de Custo</th>
                  <th className="py-3 px-3 font-extrabold text-right">Previsto / Orçado</th>
                  <th className="py-3 px-3 font-extrabold text-right">Realizado</th>
                  <th className="py-3 px-3 font-extrabold text-right">Variação (R$)</th>
                  <th className="py-3 px-3 font-extrabold text-right">Desvio %</th>
                  <th className="py-3 px-3 font-extrabold text-center">Status da Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_COST_CENTERS.map(cc => {
                  const variance = cc.allocated - cc.realized
                  const variancePct = ((cc.realized - cc.allocated) / cc.allocated) * 100
                  const isUnderBudget = variance >= 0
                  return (
                    <tr key={cc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">{cc.name}</td>
                      <td className="py-3 px-3 font-bold text-slate-700 text-right">{formatCurrency(cc.allocated)}</td>
                      <td className="py-3 px-3 font-black text-slate-900 text-right">{formatCurrency(cc.realized)}</td>
                      <td className={`py-3 px-3 font-black text-right ${isUnderBudget ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(variance)}
                      </td>
                      <td className={`py-3 px-3 font-extrabold text-right ${variancePct <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variancePct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isUnderBudget ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isUnderBudget ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {isUnderBudget ? 'Dentro do Budget' : 'Estouro Orçamentário'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubPage === 'historico_mensal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Histórico Mensal de Execução Orçamentária ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500">
                Evolução mês a mês das metas financeiras e fechamentos do CD 994.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-extrabold">Mês de Competência</th>
                  <th className="py-3 px-3 font-extrabold text-right">Orçado (R$)</th>
                  <th className="py-3 px-3 font-extrabold text-right">Realizado (R$)</th>
                  <th className="py-3 px-3 font-extrabold text-right">Economia / Saldo</th>
                  <th className="py-3 px-3 font-extrabold text-right">% Atingimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MONTHLY_HISTORY.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">{h.month}</td>
                    <td className="py-3 px-3 font-bold text-slate-700 text-right">{formatCurrency(h.budgeted)}</td>
                    <td className="py-3 px-3 font-black text-slate-900 text-right">{formatCurrency(h.realized)}</td>
                    <td className={`py-3 px-3 font-black text-right ${h.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(h.variance)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-extrabold text-xs ${h.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {((h.realized / h.budgeted) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
