import React, { useState } from 'react'
import {
  CalendarDays,
  Hammer,
  Clock,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export const PcpJsMartinsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planejamento' | 'programacao' | 'controle'>('planejamento')

  const tabs = [
    {
      id: 'planejamento',
      label: 'Planejamento',
      subtitle: 'Previsão de Demanda, Capacidade e S&OP',
      icon: <Layers size={15} />
    },
    {
      id: 'programacao',
      label: 'Programação',
      subtitle: 'Agendamentos Diários, Linhas e Sequenciamento',
      icon: <CalendarDays size={15} />
    },
    {
      id: 'controle',
      label: 'Controle & Acompanhamento',
      subtitle: 'Monitoramento de Execução, Gargalos e KPIs',
      icon: <BarChart3 size={15} />
    }
  ] as const

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1700px] mx-auto animate-in fade-in duration-300">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">PCP J'S Martins</h1>
              <span className="px-2 py-0.5 text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                <Hammer size={11} /> Em Construção
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Planejamento, Controle e Programação da Produção & Operação Logística
            </p>
          </div>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Ativa (Layout em Construção Profissional) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-2xs flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-50 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <Hammer size={38} className="animate-bounce" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-blue-600 text-white shadow-xs">
            <Sparkles size={13} />
          </div>
        </div>

        <div className="max-w-md space-y-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase tracking-wider">
            Aba: {currentTabInfo.label}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Módulo em Desenvolvimento
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {currentTabInfo.subtitle}. Esta área está sendo preparada para receber os fluxos de trabalho, cálculos e integrações automáticas do PCP J'S Martins.
          </p>
        </div>

        {/* Cards de Prévia / Estrutura Futura */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-4">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Clock size={14} className="text-blue-600" />
              <span>Fase 1: Estruturação</span>
            </div>
            <p className="text-[11px] text-slate-500">Definição dos parâmetros operacionais e regras de agendamento.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Fase 2: Integração</span>
            </div>
            <p className="text-[11px] text-slate-500">Conexão com as planilhas e bases de dados do CD 994.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <BarChart3 size={14} className="text-purple-600" />
              <span>Fase 3: Dashboards</span>
            </div>
            <p className="text-[11px] text-slate-500">Métricas dinâmicas, indicadores de aderência e previsão.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
