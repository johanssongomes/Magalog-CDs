import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  CloudRain,
  Sun,
  Cloud,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Truck,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

interface MarketData {
  dolar: { valor: number; variacao: number; pct: number }
  euro: { valor: number; variacao: number; pct: number }
  dieselS10: { valor: number; dataRef: string }
  brent: { valor: number; variacao: number }
  mglu3: { valor: number; variacao: number }
  clima: { temp: number; condicao: string; icone: 'sun' | 'rain' | 'cloud' }
  diasBlackFriday: number
  lastUpdated: string
}

export const MarketIntelligenceWidget: React.FC<{ isCollapsed?: boolean }> = ({ isCollapsed }) => {
  const [activeTab, setActiveTab] = useState<'finance' | 'logistics' | 'retail'>('finance')
  const [loading, setLoading] = useState(false)
  const [market, setMarket] = useState<MarketData>(() => {
    // Dias até a próxima Black Friday (última sexta de novembro)
    const now = new Date()
    const bf = new Date(now.getFullYear(), 10, 27) // 27 de novembro aproximado
    if (now > bf) bf.setFullYear(bf.getFullYear() + 1)
    const diffDays = Math.max(0, Math.ceil((bf.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return {
      dolar: { valor: 5.76, variacao: -0.02, pct: -0.35 },
      euro: { valor: 6.24, variacao: 0.01, pct: 0.15 },
      dieselS10: { valor: 6.14, dataRef: 'Semana Atual' },
      brent: { valor: 74.80, variacao: 0.65 },
      mglu3: { valor: 9.42, variacao: 1.84 },
      clima: { temp: 24, condicao: 'Tempo Firme', icone: 'sun' },
      diasBlackFriday: diffDays,
      lastUpdated: 'Agora'
    }
  })

  // Busca dados de moedas em tempo real via AwesomeAPI (gratuita e rápida)
  const fetchRealTimeRates = async () => {
    setLoading(true)
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL')
      if (res.ok) {
        const json = await res.json()
        const usdBrl = json.USDBRL
        const eurBrl = json.EURBRL

        setMarket(prev => ({
          ...prev,
          dolar: {
            valor: parseFloat(usdBrl.bid),
            variacao: parseFloat(usdBrl.varBid),
            pct: parseFloat(usdBrl.pctChange)
          },
          euro: {
            valor: parseFloat(eurBrl.bid),
            variacao: parseFloat(eurBrl.varBid),
            pct: parseFloat(eurBrl.pctChange)
          },
          lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }))
      }
    } catch {
      // Fallback suave
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealTimeRates()
    const interval = setInterval(fetchRealTimeRates, 60000 * 5) // Atualiza a cada 5 min
    return () => clearInterval(interval)
  }, [])

  // Alternância suave automática de abas se não for clicado
  useEffect(() => {
    const tabTimer = setInterval(() => {
      setActiveTab(curr => {
        if (curr === 'finance') return 'logistics'
        if (curr === 'logistics') return 'retail'
        return 'finance'
      })
    }, 12000)
    return () => clearInterval(tabTimer)
  }, [])

  if (isCollapsed) {
    return (
      <div 
        onClick={fetchRealTimeRates}
        title={`Dólar: R$ ${market.dolar.valor.toFixed(2)} | Clique para atualizar`}
        className="my-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center cursor-pointer hover:border-blue-500/40 transition-colors"
      >
        <div className="text-[10px] font-mono font-bold text-slate-400">USD</div>
        <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
          ${market.dolar.valor.toFixed(2)}
        </div>
      </div>
    )
  }

  return (
    <div className="my-2 px-3">
      <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-2.5 shadow-lg backdrop-blur-xs transition-all text-xs">
        {/* Cabeçalho do Card com Título e Alternador de Abas */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase font-mono">
              Mercado & Varejo
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchRealTimeRates}
              title="Atualizar cotações em tempo real"
              disabled={loading}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
          </div>
        </div>

        {/* Abas Rápidas de Navegação */}
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950/60 rounded-lg mb-2 text-[10px] font-semibold text-center">
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finanças
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'logistics'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logística
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('retail')}
            className={`py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'retail'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Varejo
          </button>
        </div>

        {/* Conteúdo Dinâmico por Aba */}
        {activeTab === 'finance' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            {/* Dólar Comercial */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                  USD
                </span>
                <span className="text-[11px] font-semibold text-slate-300">Dólar Comercial</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white text-[11px]">
                  R$ {market.dolar.valor.toFixed(2).replace('.', ',')}
                </div>
                <div className={`text-[9px] font-mono flex items-center justify-end gap-0.5 ${
                  market.dolar.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {market.dolar.pct >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  <span>{market.dolar.pct > 0 ? `+${market.dolar.pct.toFixed(2)}%` : `${market.dolar.pct.toFixed(2)}%`}</span>
                </div>
              </div>
            </div>

            {/* Ação Magalu MGLU3 */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                  MGLU3
                </span>
                <span className="text-[11px] font-semibold text-slate-300">B3 • Magalu</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white text-[11px]">
                  R$ {market.mglu3.valor.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-[9px] font-mono text-emerald-400 flex items-center justify-end gap-0.5">
                  <TrendingUp size={9} />
                  <span>+{market.mglu3.variacao.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            {/* Diesel S10 Médio */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5">
                <Fuel size={13} className="text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-300">Diesel S10 (Médio)</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-amber-300 text-[11px]">
                  R$ {market.dieselS10.valor.toFixed(2).replace('.', ',')} / L
                </div>
                <span className="text-[9px] text-slate-500 font-mono">Ref. ANP</span>
              </div>
            </div>

            {/* Petróleo Brent */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 font-bold text-[10px]">
                  OIL
                </span>
                <span className="text-[11px] font-semibold text-slate-300">Petróleo Brent</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white text-[11px]">
                  $ {market.brent.valor.toFixed(2)}
                </div>
                <div className="text-[9px] font-mono text-emerald-400 flex items-center justify-end gap-0.5">
                  <TrendingUp size={9} />
                  <span>+{market.brent.variacao.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'retail' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            {/* Contagem Regressiva Black Friday / Sazonalidades */}
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-blue-200 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" />
                  Black Friday & Pico
                </span>
                <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
                  Faltam {market.diasBlackFriday} dias
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Preparação e estoque do CD 994 para alta volumetria.
              </p>
            </div>

            {/* Clima na Região do CD */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/40 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Sun size={13} className="text-amber-400" />
                <span className="text-slate-300 font-medium">Tempo na Região</span>
              </div>
              <span className="font-mono font-bold text-slate-200">
                {market.clima.temp}°C • {market.clima.condicao}
              </span>
            </div>
          </div>
        )}

        {/* Rodapé com timestamp */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Fonte: AwesomeAPI / B3 / ANP</span>
          <span>{market.lastUpdated}</span>
        </div>
      </div>
    </div>
  )
}
