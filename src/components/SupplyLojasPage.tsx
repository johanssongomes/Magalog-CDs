import React, { useState } from 'react'
import { Store, ShoppingCart, Layers, Construction, Sparkles, Building2 } from 'lucide-react'

export const SupplyLojasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aba1' | 'aba2'>('aba1')

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Store size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Supply Lojas</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                Em Construção
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestão logística e acompanhamento de abastecimento e suprimentos das lojas
            </p>
          </div>
        </div>

        {/* Abas Superiores */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('aba1')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'aba1'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart size={14} className={activeTab === 'aba1' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Aba 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aba2')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'aba2'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className={activeTab === 'aba2' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Aba 2</span>
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas (Em Construção) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-14 text-center">
        <div className="max-w-md mx-auto flex flex-col items-center">
          {/* Ícone Ilustrativo */}
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm mb-4 relative">
            <Construction size={32} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
            {activeTab === 'aba1' ? 'Aba 1 • Supply Lojas' : 'Aba 2 • Supply Lojas'}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mb-6">
            Módulo em desenvolvimento. Este espaço está reservado para os relatórios, acompanhamentos e indicadores de suprimento de lojas.
          </p>

          <div className="w-full grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
                <Building2 size={13} className="text-blue-500" />
                <span>Integração de Lojas</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Estrutura pronta para conectar dados de expedição, transferências e atendimento às filiais.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
                <Sparkles size={13} className="text-amber-500" />
                <span>Novos Indicadores</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Componentes e painéis analíticos poderão ser plugados diretamente nesta aba.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

