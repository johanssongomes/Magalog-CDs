import React, { useState, useEffect } from 'react'
import { 
  X, 
  Bell, 
  Calendar, 
  CalendarDays, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare,
  AlertTriangle,
  Users
} from 'lucide-react'
import { 
  fetchMeetings, 
  fetchCorporateEvents, 
  fetchActionPlans,
  type Meeting,
  type CorporateEvent,
  type ActionPlan
} from '../lib/agendaService'
import { useAuth } from '../lib/authContext'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToAgenda?: () => void
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigateToAgenda 
}) => {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState<'all' | 'meetings' | 'events' | 'actions'>('all')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [events, setEvents] = useState<CorporateEvent[]>([])
  const [actions, setActions] = useState<ActionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const loadNotifications = async () => {
      setLoading(true)
      try {
        const [m, e, a] = await Promise.all([
          fetchMeetings(),
          fetchCorporateEvents(),
          fetchActionPlans()
        ])
        setMeetings(m || [])
        setEvents(e || [])
        setActions(a || [])
      } catch (err) {
        console.warn('Erro ao carregar notificações:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [isOpen])

  if (!isOpen) return null

  const todayStr = new Date().toISOString().split('T')[0]

  // Próximas reuniões (hoje ou no futuro)
  const upcomingMeetings = meetings
    .filter(m => m.meeting_date >= todayStr && m.status !== 'Cancelada')
    .sort((a, b) => (a.meeting_date + a.start_time).localeCompare(b.meeting_date + b.start_time))

  // Próximos eventos corporativos
  const upcomingEvents = events
    .filter(e => e.event_date >= todayStr && e.status !== 'Cancelado')
    .sort((a, b) => (a.event_date + a.start_time).localeCompare(b.event_date + b.start_time))

  // Planos de ação pendentes ou em andamento
  const pendingActions = actions
    .filter(a => a.status === 'Não iniciada' || a.status === 'Em andamento' || a.status === 'Bloqueada')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const totalNotifications = upcomingMeetings.length + upcomingEvents.length + pendingActions.length

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <Bell size={22} className="animate-bounce" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-slate-900">
                  {totalNotifications}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Notificações & Central de Avisos</span>
              </h3>
              <p className="text-xs text-slate-300">
                Agendas, eventos do CD, convites de reuniões e planos de ação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filtros das Notificações */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50 gap-2 py-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Todos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {totalNotifications}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('meetings')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'meetings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CalendarDays size={13} />
            <span>Reuniões</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {upcomingMeetings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('events')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'events'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles size={13} />
            <span>Eventos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {upcomingEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('actions')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'actions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckSquare size={13} />
            <span>Planos de Ação</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {pendingActions.length}
            </span>
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Carregando notificações em tempo real...</span>
            </div>
          ) : totalNotifications === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                <CheckCircle2 size={24} />
              </div>
              <p className="font-bold text-slate-700">Tudo em dia!</p>
              <p className="text-slate-400 text-xs">Não há reuniões pendentes ou alertas operacionais agendados.</p>
            </div>
          ) : (
            <>
              {/* REUNIÕES */}
              {(activeFilter === 'all' || activeFilter === 'meetings') && upcomingMeetings.map(m => {
                const isToday = m.meeting_date === todayStr
                return (
                  <div 
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex items-start gap-3.5 group"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isToday ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      <CalendarDays size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isToday ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isToday ? 'HOJE' : m.meeting_date}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {m.start_time} - {m.end_time}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {m.meeting_type}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">
                        {m.title}
                      </h4>

                      {m.agenda && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {m.agenda}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>Organizador: <strong className="text-slate-600">{m.organizer}</strong></span>
                        {m.location && <span>• Local: <strong className="text-slate-600">{m.location}</strong></span>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* EVENTOS */}
              {(activeFilter === 'all' || activeFilter === 'events') && upcomingEvents.map(e => {
                const isToday = e.event_date === todayStr
                return (
                  <div 
                    key={e.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-xs transition-all flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 shrink-0">
                      <Sparkles size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          {isToday ? 'HOJE' : e.event_date} • {e.start_time}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          {e.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">
                        {e.name}
                      </h4>

                      {e.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {e.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>Responsável: <strong className="text-slate-600">{e.responsible || e.organizer}</strong></span>
                        {e.location && <span>• Local: <strong className="text-slate-600">{e.location}</strong></span>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* PLANOS DE AÇÃO */}
              {(activeFilter === 'all' || activeFilter === 'actions') && pendingActions.map(a => {
                const isLate = a.due_date < todayStr
                return (
                  <div 
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-300 hover:shadow-xs transition-all flex items-start gap-3.5"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isLate ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      <CheckSquare size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isLate ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Prazo: {a.due_date} {isLate && '(Atrasado)'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          a.priority === 'Crítica' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Prioridade {a.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">
                        {a.description}
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div className="text-[10px] text-slate-500">
                          Responsável: <strong className="text-slate-700">{a.assignee}</strong> ({a.department})
                        </div>
                        <div className="text-[10px] font-mono font-bold text-blue-600">
                          {a.progress}% concluído
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {totalNotifications} notificações encontradas
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Fechar
            </button>
            {onNavigateToAgenda && (
              <button
                onClick={() => {
                  onClose()
                  onNavigateToAgenda()
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                <span>Abrir Agenda & Reuniões</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
