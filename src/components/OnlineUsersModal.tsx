import React, { useEffect, useRef } from 'react'
import { useAuth, type OnlineUser } from '../lib/authContext'
import { 
  Users, 
  X, 
  Clock, 
  Mail, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  CheckCircle2
} from 'lucide-react'

interface OnlineUsersModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ isOpen, onClose }) => {
  const { onlineUsers, user: currentUser } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  // Fechar ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Formatar horário de login (Ex: 23/10/2026 às 18:45 ou Há 5 minutos)
  const formatLoginTime = (dateStr: string) => {
    if (!dateStr) return 'Horário não registrado'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr

      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / (1000 * 60))

      let relative = ''
      if (diffMin < 1) relative = 'Agora mesmo'
      else if (diffMin === 1) relative = 'Há 1 minuto'
      else if (diffMin < 60) relative = `Há ${diffMin} min`
      else {
        const diffHours = Math.floor(diffMin / 60)
        if (diffHours === 1) relative = 'Há 1 hora'
        else if (diffHours < 24) relative = `Há ${diffHours} horas`
      }

      const formatted = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      const formattedDate = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      return {
        relative,
        full: `${formattedDate} às ${formatted}`,
        timeOnly: formatted
      }
    } catch {
      return { relative: '', full: dateStr, timeOnly: dateStr }
    }
  }

  // Se a lista estiver vazia mas tivermos o currentUser logado, exibir ao menos o currentUser
  const displayList: OnlineUser[] = onlineUsers.length > 0 
    ? onlineUsers 
    : (currentUser ? [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        logged_at: sessionStorage.getItem(`login_time_${currentUser.email}`) || new Date().toISOString(),
        online_at: new Date().toISOString()
      }] : [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header do Modal */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Radio size={20} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">
                  Usuários Online
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {displayList.length} {displayList.length === 1 ? 'ativo' : 'ativos'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quem está conectado em tempo real e quando efetuou login no sistema.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Fechar (Esc)"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Usuários Conectados */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {displayList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Nenhum usuário detectado online no momento.</p>
            </div>
          ) : (
            displayList.map((onlineUser) => {
              const isYou = currentUser?.email?.toLowerCase() === onlineUser.email?.toLowerCase()
              const timeInfo = formatLoginTime(onlineUser.logged_at)
              const initials = onlineUser.name 
                ? onlineUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                : 'US'

              return (
                <div
                  key={onlineUser.email || onlineUser.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isYou
                      ? 'bg-blue-950/30 border-blue-500/30 shadow-md shadow-blue-500/5'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  {/* Foto/Iniciais e Dados */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border ${
                        isYou 
                          ? 'bg-blue-600/20 border-blue-400/40 text-blue-300' 
                          : onlineUser.role === 'admin'
                          ? 'bg-purple-600/20 border-purple-400/40 text-purple-300'
                          : onlineUser.role === 'gerente'
                          ? 'bg-cyan-600/20 border-cyan-400/40 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {initials}
                      </div>
                      {/* Ponto indicador de status online */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {onlineUser.name}
                        </span>
                        {isYou && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                            Você
                          </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          onlineUser.role === 'admin'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                            : onlineUser.role === 'gerente'
                            ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {onlineUser.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                        <Mail size={11} className="shrink-0 text-slate-500" />
                        <span className="truncate font-mono">{onlineUser.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Login */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-400">
                      <Clock size={12} className="shrink-0" />
                      <span>{typeof timeInfo === 'string' ? timeInfo : timeInfo.timeOnly}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5" title={typeof timeInfo === 'object' ? timeInfo.full : ''}>
                      {typeof timeInfo === 'object' && timeInfo.relative ? timeInfo.relative : 'Conectado'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé com Atualização em Tempo Real */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sincronização em tempo real via Supabase Presence</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
