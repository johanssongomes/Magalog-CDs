import React from 'react'
import { LayoutDashboard, Zap, Package, AlertTriangle, CheckCircle2, TrendingUp, Cpu, Truck, BarChart3 } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-5 w-full">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <LayoutDashboard size={220} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Painel Geral Unificado de CDs
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Administrativo Magalog CDs</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Visão consolidada da frota de equipamentos, métricas de performance, status dos centros de distribuição e SLAs operacionais.
          </p>
        </div>
      </div>

      {/* Grid de KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Cpu size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Equipamentos Ativos</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">148 <span className="text-xs font-medium text-emerald-600">+12%</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Coletoras, Empilhadeiras & Scanners</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Zap size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">NS Cliente Média</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">97.8% <span className="text-xs font-medium text-emerald-600">Meta OK</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Meta global estabelecida: &gt;97%</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Truck size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Expedição Diária</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">24.500 <span className="text-xs font-medium text-slate-500">peças/dia</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Volume consolidado dos CDs</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Planos de Ação</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">4 <span className="text-xs font-medium text-rose-600">Pendentes</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ações registradas nos últimos 7 dias</div>
          </div>
        </div>
      </div>

      {/* Seção Principal: Status dos CDs e Equipamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tabela Resumo dos CDs */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" /> Status Operacional por Centro de Distribuição (CD)
              </h3>
              <p className="text-xs text-slate-500">Resumo acumulado do mês atual por unidade operacional.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3 rounded-l-lg">Unidade / CD</th>
                  <th className="p-3">Equipamentos</th>
                  <th className="p-3">NS Cliente</th>
                  <th className="p-3">Fulfillment</th>
                  <th className="p-3 text-center rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-800">CD Louveira (SP)</td>
                  <td className="p-3 font-mono">52 ativos</td>
                  <td className="p-3 font-mono text-emerald-700 font-semibold">98.2%</td>
                  <td className="p-3 font-mono text-blue-900">99.4%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Excelente</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-800">CD Cabreúva (SP)</td>
                  <td className="p-3 font-mono">41 ativos</td>
                  <td className="p-3 font-mono text-emerald-700 font-semibold">97.5%</td>
                  <td className="p-3 font-mono text-blue-900">98.9%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Operacional</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-800">CD Extrema (MG)</td>
                  <td className="p-3 font-mono">35 ativos</td>
                  <td className="p-3 font-mono text-amber-700 font-semibold">95.8%</td>
                  <td className="p-3 font-mono text-blue-900">97.2%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200">Atenção</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-800">CD Alhandra (PB)</td>
                  <td className="p-3 font-mono">20 ativos</td>
                  <td className="p-3 font-mono text-emerald-700 font-semibold">98.0%</td>
                  <td className="p-3 font-mono text-blue-900">99.1%</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Excelente</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card de Alertas Rápidos */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" /> Destaques & Alertas
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" /> Manutenção de Equipamentos
              </div>
              <p className="text-[11px] text-amber-800">
                3 Coletoras RF no CD Extrema estão agendadas para preventiva nesta sexta-feira.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600" /> Recorde de Produção
              </div>
              <p className="text-[11px] text-blue-800">
                CD Louveira atingiu a marca de 100% de precisão de expedição no turno 1.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Supabase DB Sincronizado
              </div>
              <p className="text-[11px] text-emerald-800">
                Banco de dados em tempo real ativo. Todas as alterações em lote gravadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
