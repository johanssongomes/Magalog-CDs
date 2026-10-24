import React, { useState } from 'react'
import {
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  ShieldCheck,
  Info
} from 'lucide-react'

export const LookerCarteiraPage: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // URL direta de exibição/incorporação do Looker Studio
  const embedUrl = 'https://lookerstudio.google.com/embed/reporting/767e51a9-f613-4f6d-9eb5-20ee385d5c5d/page/p_so686endrd'
  const directUrl = 'https://lookerstudio.google.com/reporting/767e51a9-f613-4f6d-9eb5-20ee385d5c5d/page/p_so686endrd'

  const handleRefresh = () => {
    setIsLoading(true)
    setIframeKey(prev => prev + 1)
  }

  return (
    <div className={`space-y-4 animate-in fade-in duration-200 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900/95 p-4 flex flex-col' : ''}`}>
      {/* Barra Superior Informativa e Controles */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Carteira CDs &bull; Looker Studio
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Interativo
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Navegue pelos modais, filtros e métricas de expedição e transferência sem sair da página.
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Recarregar dados do painel"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Recarregar</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Sair do Modo Expandido' : 'Expandir para Tela Cheia'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            {isFullScreen ? (
              <>
                <Minimize2 size={14} />
                <span className="hidden sm:inline">Recolher</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>

          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir no Google Looker Studio oficial"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Abrir Externa</span>
          </a>
        </div>
      </div>

      {/* Container do Iframe */}
      <div 
        className={`relative w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs ${
          isFullScreen ? 'flex-1 min-h-0' : 'h-[calc(100vh-230px)] min-h-[700px]'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">Carregando painel Carteira CDs...</p>
              <p className="text-[11px] text-slate-400">Conectando ao Looker Studio</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Carteira CDs - Google Looker Studio"
          className="w-full h-full border-0"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Nota de rodapé explicativa */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          Renderizado diretamente via Google Looker Studio Embed
        </span>
        <span className="hidden sm:inline">
          ID: 767e51a9-f613-4f6d-9eb5-20ee385d5c5d &bull; p_so686endrd
        </span>
      </div>
    </div>
  )
}
