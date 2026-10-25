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

  // Estado para controle de altura ideal (Automático / 960px padrão para caber a tabela inteira com todos os CDs)
  const [alturaCustom, setAlturaCustom] = useState<'fit' | 'expandida'>('expandida')

  return (
    <div className={`flex flex-col animate-in fade-in duration-200 ${
      isFullScreen 
        ? 'fixed inset-0 z-50 bg-slate-900 p-3' 
        : 'w-full space-y-2'
    }`}>
      {/* Barra de Controles Compacta */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers size={15} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900 tracking-tight">
              Carteira CDs &bull; Looker Studio
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          {/* Seletor de Altura para Visualizar Toda a Tabela Sem Barra Interna */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600">
            <button
              onClick={() => setAlturaCustom('expandida')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                alturaCustom === 'expandida'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Altura Completa: exibe todas as linhas da tabela sem barra de rolagem interna"
            >
              Tabela Completa (960px)
            </button>
            <button
              onClick={() => setAlturaCustom('fit')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                alturaCustom === 'fit'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Ajustar à Tela (calculado de acordo com a altura da janela)"
            >
              Ajustar à Janela
            </button>
          </div>

          <button
            onClick={handleRefresh}
            title="Recarregar dados do painel"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCw size={13} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline text-[11px]">Recarregar</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Sair do Modo Expandido' : 'Expandir para Tela Cheia'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isFullScreen ? (
              <>
                <Minimize2 size={13} />
                <span className="hidden sm:inline text-[11px]">Recolher</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} />
                <span className="hidden sm:inline text-[11px]">Tela Cheia</span>
              </>
            )}
          </button>

          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir no Google Looker Studio oficial"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-[11px]"
          >
            <ExternalLink size={13} />
            <span>Abrir Externa</span>
          </a>
        </div>
      </div>

      {/* Container do Iframe com Altura Ajustada Exata para Exibir Toda a Tabela Sem Barra de Rolagem */}
      <div 
        className={`relative w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs ${
          isFullScreen 
            ? 'flex-1 h-full' 
            : alturaCustom === 'expandida'
              ? 'h-[960px]'
              : 'h-[calc(100vh-175px)] min-h-[680px]'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">Carregando painel Carteira CDs...</p>
              <p className="text-[10px] text-slate-400">Conectando ao Looker Studio</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Carteira CDs - Google Looker Studio"
          className="w-full h-full border-0 block"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  )
}
