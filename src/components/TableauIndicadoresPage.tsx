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
  Lock,
  Compass,
  AlertTriangle,
  FolderOpen
} from 'lucide-react'

// URL principal solicitada (Explorar Exibições / Views do site Rede)
const EXPLORAR_VIEWS_URL = 'https://bi.luizalabs.com/#/site/rede/views'

// Dashboard específico de Nível de Serviço 1P
const NIVEL_SERVICO_URL = 'https://bi.luizalabs.com/#/site/rede/views/NiveldeservicoDEZ2023-PILOTO/PerformanceGeral?:iid=1'

// URLs diretas para tentativa de embed nativo do Tableau Server
const EMBED_VIEWS_URL = 'https://bi.luizalabs.com/t/rede/views'
const EMBED_NIVEL_SERVICO_URL = 'https://bi.luizalabs.com/t/rede/views/NiveldeservicoDEZ2023-PILOTO/PerformanceGeral?:embed=y&:showVizHome=n&:toolbar=y'

export const TableauIndicadoresPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'explorar' | 'nivel_servico'>('explorar')
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [iframeFailed, setIframeFailed] = useState(false)

  const activeWebUrl = selectedView === 'explorar' ? EXPLORAR_VIEWS_URL : NIVEL_SERVICO_URL
  const activeEmbedUrl = selectedView === 'explorar' ? EXPLORAR_VIEWS_URL : EMBED_NIVEL_SERVICO_URL

  const handleRefresh = () => {
    setIsRefreshing(true)
    setIframeFailed(false)
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
                Tableau Indicadores • BI Luizalabs (Rede)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Tableau Server
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acesso aos painéis operacionais de Performance Geral, Nível de Serviço, Prazos e Expedição.
            </p>
          </div>
        </div>

        {/* Seleção de Exibição / Abas do BI */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
            <button
              onClick={() => { setSelectedView('explorar'); setIframeFailed(false); setIframeKey(k => k + 1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedView === 'explorar'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass size={13} />
              <span>Explorar Exibições</span>
            </button>

            <button
              onClick={() => { setSelectedView('nivel_servico'); setIframeFailed(false); setIframeKey(k => k + 1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedView === 'nivel_servico'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 size={13} />
              <span>Nível de Serviço 1P</span>
            </button>
          </div>

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
            href={activeWebUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            title="Abrir no portal BI Luizalabs em uma nova aba"
          >
            <ExternalLink size={14} />
            <span>Abrir no Tableau</span>
          </a>
        </div>
      </div>

      {/* Container Iframe com Detecção de Bloqueio e Fallback Inteligente */}
      <div 
        className={`w-full relative bg-slate-950 border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col ${
          isFullscreen ? 'h-full' : 'h-[calc(100vh-210px)] min-h-[720px]'
        }`}
      >
        <iframe
          key={iframeKey}
          src={activeEmbedUrl}
          title="Tableau Indicadores - BI Luizalabs"
          className="w-full flex-1 border-0 rounded-2xl bg-white"
          allow="fullscreen; clipboard-read; clipboard-write"
          loading="eager"
        />

        {/* Card Flutuante de Ajuda & Conexão Corporativa */}
        <div className="absolute bottom-4 right-4 max-w-md bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-xl flex items-start gap-3 z-10">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Lock size={16} />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Autenticação Tableau Server</span>
              <a 
                href={activeWebUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                <span>Acessar Direto</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Caso o painel exiba tela cinza, o servidor corporativo requer login prévio via SSO Magalu. Clique no botão azul <strong>"Abrir no Tableau"</strong> para logar e recarregue.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Informativo */}
      {!isFullscreen && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>
              URL conectada: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">{activeWebUrl}</code>
            </span>
          </div>

          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
            bi.luizalabs.com • Site: Rede
          </span>
        </div>
      )}
    </div>
  )
}
