import React, { useState } from 'react'
import { 
  BarChart2, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Info,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react'

// URL extraída do painel Tableau / Luizalabs
const DEFAULT_TABLEAU_URL = 'https://bi.luizalabs.com/#/site/rede/views/NiveldeservicoDEZ2023-PILOTO/PerformanceGeral?:iid=1'

export const TableauIndicadoresPage: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_TABLEAU_URL)
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Gerar URL otimizada para embed caso seja do Tableau
  const getEmbedUrl = (rawUrl: string) => {
    try {
      // Se já contém parâmetros embed
      if (rawUrl.includes(':embed=yes')) return rawUrl
      
      const separator = rawUrl.includes('?') ? '&' : '?'
      return `${rawUrl}${separator}:embed=yes&:showVizHome=no&:toolbar=yes`
    } catch {
      return rawUrl
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setIframeKey(prev => prev + 1)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4 flex flex-col' : ''}`}>
      {/* Barra Superior com Controles e Informações */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart2 size={22} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                Tableau Indicadores • Nível de Serviço 1P (Saída CD Entrega a Domicílio)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                BI Luizalabs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização integrada dos indicadores de desempenho, ofensores, atrasos e SLA operacional.
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Recarregar painel Tableau"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            <span>Recarregar</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Restaurar' : 'Tela Cheia'}</span>
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            title="Abrir diretamente no portal BI Luizalabs em uma nova aba"
          >
            <ExternalLink size={14} />
            <span>Abrir no Tableau</span>
          </a>
        </div>
      </div>

      {/* Container Iframe Seguro com Altura Otimizada */}
      <div 
        className={`w-full relative bg-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex-1 ${
          isFullscreen ? 'h-full' : 'h-[calc(100vh-210px)] min-h-[720px]'
        }`}
      >
        <iframe
          key={iframeKey}
          src={getEmbedUrl(currentUrl)}
          title="Tableau Indicadores - BI Luizalabs"
          className="w-full h-full border-0 rounded-2xl bg-white"
          allow="fullscreen; clipboard-read; clipboard-write"
          loading="lazy"
        />
      </div>

      {/* Dica / Rodapé Informativo */}
      {!isFullscreen && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              Certifique-se de estar conectado com sua conta corporativa <strong>@magazineluiza.com.br</strong> para visualização dos dashboards internos.
            </span>
          </div>

          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
            bi.luizalabs.com
          </span>
        </div>
      )}
    </div>
  )
}
