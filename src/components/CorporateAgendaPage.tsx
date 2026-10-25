import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock3,
  Edit2,
  Trash2,
  Copy,
  Printer,
  Download,
  Share2,
  ExternalLink,
  Sparkles,
  Building2,
  Tag,
  AlertTriangle,
  RotateCw,
  Eye,
  Check,
  X,
  ArrowUpRight
} from 'lucide-react'
import { 
  fetchMeetings, 
  saveMeeting, 
  deleteMeeting, 
  fetchMeetingMinutes, 
  saveMeetingMinute, 
  deleteMeetingMinute, 
  fetchActionPlans, 
  saveActionPlan, 
  deleteActionPlan, 
  fetchCorporateEvents, 
  saveCorporateEvent, 
  deleteCorporateEvent,
  type Meeting,
  type MeetingMinute,
  type ActionPlan,
  type CorporateEvent
} from '../lib/agendaService'
import { useAuth } from '../lib/authContext'

type AgendaTab = 'overview' | 'calendar' | 'meetings' | 'minutes' | 'actions' | 'events'

export const CorporateAgendaPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AgendaTab>('overview')

  // Estados principais
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [minutes, setMinutes] = useState<MeetingMinute[]>([])
  const [actions, setActions] = useState<ActionPlan[]>([])
  const [events, setEvents] = useState<CorporateEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Modais de Criação / Edição
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Partial<Meeting> | null>(null)

  const [minuteModalOpen, setMinuteModalOpen] = useState(false)
  const [editingMinute, setEditingMinute] = useState<Partial<MeetingMinute> | null>(null)
  const [viewingMinute, setViewingMinute] = useState<MeetingMinute | null>(null)

  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<Partial<ActionPlan> | null>(null)

  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Partial<CorporateEvent> | null>(null)

  // Feedback Messages
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Filtros Globais / Por Aba
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Controle do Calendário
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carregar todos os dados
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [m, min, a, e] = await Promise.all([
        fetchMeetings(),
        fetchMeetingMinutes(),
        fetchActionPlans(),
        fetchCorporateEvents()
      ])
      setMeetings(m)
      setMinutes(min)
      setActions(a)
      setEvents(e)
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err)
      showToast('Erro ao carregar alguns dados da agenda corporativa', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // =========================================================================
  // INDICADORES REAIS DO DASHBOARD
  // =========================================================================
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const currentMonthYear = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // 1. Próximas reuniões (hoje ou futuras, não canceladas)
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => m.meeting_date >= todayStr && m.status !== 'Cancelada')
      .sort((a, b) => (a.meeting_date + a.start_time).localeCompare(b.meeting_date + b.start_time))
  }, [meetings, todayStr])

  // 2. Reuniões realizadas no mês
  const completedMeetingsMonth = useMemo(() => {
    return meetings.filter(m => m.status === 'Realizada' && m.meeting_date.startsWith(currentMonthYear)).length
  }, [meetings, currentMonthYear])

  // 3. Atas pendentes de elaboração (reuniões realizadas que ainda não possuem ATA vinculada)
  const pendingMinutesCount = useMemo(() => {
    const meetingIdsWithMinutes = new Set(minutes.filter(min => min.meeting_id).map(min => min.meeting_id))
    return meetings.filter(m => m.status === 'Realizada' && !meetingIdsWithMinutes.has(m.id)).length
  }, [meetings, minutes])

  // 4. Planos de ação em aberto (Não iniciada, Em andamento ou Bloqueada)
  const openActionPlans = useMemo(() => {
    return actions.filter(a => a.status === 'Não iniciada' || a.status === 'Em andamento' || a.status === 'Bloqueada')
  }, [actions])

  // 5. Ações atrasadas (due_date < hoje e status não concluída/cancelada)
  const delayedActionPlans = useMemo(() => {
    return actions.filter(a => a.due_date < todayStr && a.status !== 'Concluída' && a.status !== 'Cancelada')
  }, [actions, todayStr])

  // 6. Próximos eventos (event_date >= hoje e não cancelado)
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.event_date >= todayStr && e.status !== 'Cancelado')
      .sort((a, b) => (a.event_date + a.start_time).localeCompare(b.event_date + b.start_time))
  }, [events, todayStr])

  // =========================================================================
  // SALVAR / DELETAR HANDLERS
  // =========================================================================
  const handleSaveMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMeeting?.title || !editingMeeting.meeting_date || !editingMeeting.start_time || !editingMeeting.end_time) {
      showToast('Preencha título, data e horários válidos!', 'error')
      return
    }

    if (editingMeeting.end_time < editingMeeting.start_time) {
      showToast('O horário de término não pode ser anterior ao horário de início!', 'error')
      return
    }

    try {
      const saved = await saveMeeting({
        ...editingMeeting,
        organizer: editingMeeting.organizer || user?.name || 'Administrador',
        status: editingMeeting.status || 'Agendada'
      })
      setMeetings(prev => {
        const idx = prev.findIndex(m => m.id === saved.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = saved
          return updated
        }
        return [saved, ...prev]
      })
      setMeetingModalOpen(false)
      setEditingMeeting(null)
      showToast('Reunião salva com sucesso!')
    } catch (err: any) {
      showToast(`Erro ao salvar reunião: ${err.message}`, 'error')
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Deseja realmente remover ou cancelar esta reunião?')) return
    await deleteMeeting(id)
    setMeetings(prev => prev.filter(m => m.id !== id))
    showToast('Reunião removida.')
  }

  const handleSaveMinute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMinute?.title || !editingMinute.meeting_date) {
      showToast('Preencha título e data da ata!', 'error')
      return
    }

    try {
      const isPublished = editingMinute.status === 'Publicada'
      const saved = await saveMeetingMinute({
        ...editingMinute,
        recorder_name: editingMinute.recorder_name || user?.name || 'Secretaria Executiva',
        published_at: isPublished ? (editingMinute.published_at || new Date().toISOString()) : undefined
      })
      setMinutes(prev => {
        const idx = prev.findIndex(m => m.id === saved.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = saved
          return updated
        }
        return [saved, ...prev]
      })
      setMinuteModalOpen(false)
      setEditingMinute(null)
      showToast(isPublished ? 'ATA publicada com sucesso!' : 'Rascunho de ATA salvo!')
    } catch (err: any) {
      showToast(`Erro ao salvar ATA: ${err.message}`, 'error')
    }
  }

  const handleDeleteMinute = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta ATA? Esta ação não pode ser desfeita.')) return
    await deleteMeetingMinute(id)
    setMinutes(prev => prev.filter(m => m.id !== id))
    showToast('ATA removida.')
  }

  const handleSaveAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingAction?.description || !editingAction.assignee || !editingAction.due_date) {
      showToast('Preencha descrição, responsável e prazo!', 'error')
      return
    }

    try {
      const isCompleted = editingAction.status === 'Concluída'
      const saved = await saveActionPlan({
        ...editingAction,
        progress: isCompleted ? 100 : (editingAction.progress ?? 0),
        completion_date: isCompleted ? (editingAction.completion_date || todayStr) : undefined
      })
      setActions(prev => {
        const idx = prev.findIndex(a => a.id === saved.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = saved
          return updated
        }
        return [saved, ...prev]
      })
      setActionModalOpen(false)
      setEditingAction(null)
      showToast('Plano de ação salvo com sucesso!')
    } catch (err: any) {
      showToast(`Erro ao salvar plano de ação: ${err.message}`, 'error')
    }
  }

  const handleDeleteAction = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta ação?')) return
    await deleteActionPlan(id)
    setActions(prev => prev.filter(a => a.id !== id))
    showToast('Plano de ação removido.')
  }

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingEvent?.name || !editingEvent.event_date || !editingEvent.start_time || !editingEvent.end_time) {
      showToast('Preencha nome, data e horários do evento!', 'error')
      return
    }

    try {
      const saved = await saveCorporateEvent({
        ...editingEvent,
        organizer: editingEvent.organizer || user?.name || 'Coordenação de Operações',
        status: editingEvent.status || 'Confirmado'
      })
      setEvents(prev => {
        const idx = prev.findIndex(e => e.id === saved.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = saved
          return updated
        }
        return [saved, ...prev]
      })
      setEventModalOpen(false)
      setEditingEvent(null)
      showToast('Evento corporativo registrado com sucesso!')
    } catch (err: any) {
      showToast(`Erro ao salvar evento: ${err.message}`, 'error')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente cancelar ou remover este evento?')) return
    await deleteCorporateEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
    showToast('Evento removido.')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast de Notificação */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all transform animate-in slide-in-from-bottom-3 ${
          toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER PRINCIPAL DA PÁGINA
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Agenda Corporativa
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  CD 994 &bull; Fuso Fortaleza
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestão de reuniões, atas, eventos e planos de ação.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida no Topo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingMeeting({
                meeting_date: todayStr,
                start_time: '09:00',
                end_time: '10:00',
                status: 'Agendada',
                meeting_type: 'Ritos operacionais',
                participants: []
              })
              setMeetingModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Nova Reunião</span>
          </button>

          <button
            onClick={() => {
              setEditingMinute({
                meeting_date: todayStr,
                status: 'Rascunho',
                present_participants: [],
                absent_participants: [],
                recorder_name: user?.name || 'Administrador'
              })
              setMinuteModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <FileText size={15} className="text-blue-600" />
            <span>Registrar ATA</span>
          </button>

          <button
            onClick={() => {
              setEditingAction({
                start_date: todayStr,
                due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                priority: 'Média',
                status: 'Não iniciada',
                progress: 0,
                department: 'Operação'
              })
              setActionModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <CheckSquare size={15} className="text-emerald-600" />
            <span>Criar Ação</span>
          </button>

          <button
            onClick={() => {
              setEditingEvent({
                event_date: todayStr,
                start_time: '09:00',
                end_time: '12:00',
                category: 'Treinamentos',
                status: 'Confirmado'
              })
              setEventModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <CalendarIcon size={15} className="text-purple-600" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE RESUMO COM 6 CARDS INDICADORES REAIS DO SISTEMA
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Próximas Reuniões */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Próximas Reuniões</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{upcomingMeetings.length}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Programadas no sistema</p>
          </div>
        </div>

        {/* 2. Reuniões Realizadas no Mês */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Realizadas no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{completedMeetingsMonth}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Neste mês atual</p>
          </div>
        </div>

        {/* 3. Atas Pendentes de Elaboração */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atas Pendentes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock3 size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 tracking-tight">{pendingMinutesCount}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Sem ATA vinculada</p>
          </div>
        </div>

        {/* 4. Planos de Ação em Aberto */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ações em Aberto</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckSquare size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">{openActionPlans.length}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Em andamento / pendentes</p>
          </div>
        </div>

        {/* 5. Ações Atrasadas */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ações Atrasadas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 tracking-tight">{delayedActionPlans.length}</span>
            <p className="text-[10px] text-rose-500 font-bold mt-0.5">Exigem prioridade imediata</p>
          </div>
        </div>

        {/* 6. Próximos Eventos */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Próximos Eventos</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarIcon size={14} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-600 tracking-tight">{upcomingEvents.length}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Ritos, treinos e auditorias</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BARRA DE NAVEGAÇÃO INTERNA COM AS 6 ABAS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'overview', label: 'Visão Geral', icon: <Sparkles size={16} /> },
            { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={16} /> },
            { id: 'meetings', label: 'Reuniões', icon: <Users size={16} />, badge: meetings.length },
            { id: 'minutes', label: 'Atas (ATAs)', icon: <FileText size={16} />, badge: minutes.length },
            { id: 'actions', label: 'Planos de Ação', icon: <CheckSquare size={16} />, badge: actions.length },
            { id: 'events', label: 'Eventos', icon: <CalendarDays size={16} />, badge: events.length }
          ].map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AgendaTab)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================================================
          4. CONTEÚDO DAS ABAS
          ========================================================================= */}

      {/* ---------------- ABA 1: VISÃO GERAL ---------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Próximas Reuniões */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-600" />
                  Próximas Reuniões
                </h3>
                <button
                  onClick={() => setActiveTab('meetings')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Ver Todas &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {upcomingMeetings.slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhuma reunião futura agendada.</p>
                ) : (
                  upcomingMeetings.slice(0, 4).map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        setEditingMeeting(m)
                        setMeetingModalOpen(true)
                      }}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {m.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-700 shrink-0">
                          {m.meeting_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {m.meeting_date.split('-').reverse().join('/')} &bull; {m.start_time} - {m.end_time}
                        </span>
                      </div>
                      {m.location && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin size={11} /> {m.location}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Planos de Ação Pendentes & Atrasados */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare size={18} className="text-emerald-600" />
                  Planos de Ação & Pendências
                </h3>
                <button
                  onClick={() => setActiveTab('actions')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Ver Todos &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {actions.slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum plano de ação registrado.</p>
                ) : (
                  actions.slice(0, 4).map(a => {
                    const isLate = a.due_date < todayStr && a.status !== 'Concluída' && a.status !== 'Cancelada'
                    return (
                      <div 
                        key={a.id}
                        onClick={() => {
                          setEditingAction(a)
                          setActionModalOpen(true)
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isLate ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{a.description}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                            isLate ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isLate ? 'ATRASADA' : a.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                          <span>Resp: <strong className="text-slate-700">{a.assignee}</strong></span>
                          <span>Prazo: {a.due_date.split('-').reverse().join('/')}</span>
                        </div>
                        {/* Barra de Progresso */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isLate ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${a.progress}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Próximos Eventos & Últimas Atas */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-purple-600" />
                  Próximos Eventos do CD
                </h3>
                <button
                  onClick={() => setActiveTab('events')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Ver Todos &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {upcomingEvents.slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum evento futuro cadastrado.</p>
                ) : (
                  upcomingEvents.slice(0, 4).map(e => (
                    <div 
                      key={e.id}
                      onClick={() => {
                        setEditingEvent(e)
                        setEventModalOpen(true)
                      }}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-purple-300 hover:bg-purple-50/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800">{e.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-700 shrink-0">
                          {e.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {e.event_date.split('-').reverse().join('/')} &bull; {e.start_time} - {e.end_time}
                        </span>
                      </div>
                      {e.location && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin size={11} /> {e.location}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ABA 2: CALENDÁRIO ---------------- */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          {/* Controles de Navegação do Calendário */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(currentDate)
                  d.setMonth(d.getMonth() - 1)
                  setCurrentDate(d)
                }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <h3 className="text-base font-bold text-slate-900 min-w-[180px] text-center">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </h3>
              <button
                onClick={() => {
                  const d = new Date(currentDate)
                  d.setMonth(d.getMonth() + 1)
                  setCurrentDate(d)
                }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 ml-2 cursor-pointer"
              >
                Hoje
              </button>
            </div>

            {/* Legenda do Calendário */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Reuniões
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Eventos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Prazos de Ações
              </span>
            </div>
          </div>

          {/* Grade Mensal do Calendário */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-7 bg-slate-100 text-center py-2.5 text-xs font-bold text-slate-600 border-b border-slate-200">
              <span>DOM</span>
              <span>SEG</span>
              <span>TER</span>
              <span>QUA</span>
              <span>QUI</span>
              <span>SEX</span>
              <span>SÁB</span>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
              {Array.from({ length: 35 }).map((_, i) => {
                const year = currentDate.getFullYear()
                const month = currentDate.getMonth()
                const firstDayIndex = new Date(year, month, 1).getDay()
                const dayNumber = i - firstDayIndex + 1
                const isCurrentMonth = dayNumber > 0 && dayNumber <= new Date(year, month + 1, 0).getDate()
                const dateStr = isCurrentMonth 
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                  : ''
                const isToday = dateStr === todayStr

                const dayMeetings = isCurrentMonth ? meetings.filter(m => m.meeting_date === dateStr) : []
                const dayEvents = isCurrentMonth ? events.filter(e => e.event_date === dateStr) : []
                const dayActions = isCurrentMonth ? actions.filter(a => a.due_date === dateStr) : []

                return (
                  <div
                    key={i}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                      isCurrentMonth ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${
                        isToday 
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs' 
                          : isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                      }`}>
                        {isCurrentMonth ? dayNumber : ''}
                      </span>
                      {isCurrentMonth && (
                        <button
                          onClick={() => {
                            setEditingMeeting({
                              meeting_date: dateStr,
                              start_time: '09:00',
                              end_time: '10:00',
                              status: 'Agendada'
                            })
                            setMeetingModalOpen(true)
                          }}
                          title="Agendar neste dia"
                          className="opacity-0 hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>

                    {/* Itens do dia */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayMeetings.map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setEditingMeeting(m)
                            setMeetingModalOpen(true)
                          }}
                          className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold truncate cursor-pointer hover:bg-blue-100"
                          title={`Reunião: ${m.title} (${m.start_time} - ${m.end_time})`}
                        >
                          {m.start_time} {m.title}
                        </div>
                      ))}

                      {dayEvents.map(e => (
                        <div
                          key={e.id}
                          onClick={() => {
                            setEditingEvent(e)
                            setEventModalOpen(true)
                          }}
                          className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold truncate cursor-pointer hover:bg-purple-100"
                          title={`Evento: ${e.name} (${e.start_time})`}
                        >
                          {e.start_time} {e.name}
                        </div>
                      ))}

                      {dayActions.map(a => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setEditingAction(a)
                            setActionModalOpen(true)
                          }}
                          className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold truncate cursor-pointer hover:bg-rose-100"
                          title={`Prazo Ação: ${a.description} (${a.assignee})`}
                        >
                          Prazo: {a.assignee}
                        </div>
                      ))}
                    </div>

                    <div />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ABA 3: REUNIÕES ---------------- */}
      {activeTab === 'meetings' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar reuniões por título, tipo, organizador..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="Agendada">Agendada</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>

              <button
                onClick={() => {
                  setEditingMeeting({
                    meeting_date: todayStr,
                    start_time: '10:00',
                    end_time: '11:00',
                    status: 'Agendada'
                  })
                  setMeetingModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus size={15} />
                <span>Nova Reunião</span>
              </button>
            </div>
          </div>

          {/* Tabela de Reuniões */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5">Título / Tipo</th>
                  <th className="p-3.5">Data & Horário</th>
                  <th className="p-3.5">Local / Link</th>
                  <th className="p-3.5">Organizador</th>
                  <th className="p-3.5">Participantes</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meetings
                  .filter(m => filterStatus === 'all' || m.status === filterStatus)
                  .filter(m => 
                    !searchQuery || 
                    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.meeting_type.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800">
                        <div>{m.title}</div>
                        <span className="text-[10px] font-mono font-medium text-blue-600">{m.meeting_type}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        <div>{m.meeting_date.split('-').reverse().join('/')}</div>
                        <span className="text-[11px] text-slate-400">{m.start_time} - {m.end_time}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[160px] truncate">
                        {m.location || '—'}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {m.organizer}
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-[180px] truncate">
                        {m.participants?.join(', ') || 'Nenhum'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          m.status === 'Realizada' ? 'bg-emerald-100 text-emerald-800' :
                          m.status === 'Em andamento' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          m.status === 'Cancelada' ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingMeeting(m)
                              setMeetingModalOpen(true)
                            }}
                            title="Editar Reunião"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => {
                              // Duplicar reunião
                              setEditingMeeting({
                                ...m,
                                id: undefined,
                                title: `${m.title} (Cópia)`,
                                meeting_date: todayStr
                              })
                              setMeetingModalOpen(true)
                            }}
                            title="Duplicar Reunião"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>

                          {m.status === 'Realizada' && (
                            <button
                              onClick={() => {
                                setEditingMinute({
                                  meeting_id: m.id,
                                  title: `ATA: ${m.title}`,
                                  meeting_date: m.meeting_date,
                                  start_time: m.start_time,
                                  end_time: m.end_time,
                                  present_participants: m.participants || [],
                                  status: 'Rascunho'
                                })
                                setMinuteModalOpen(true)
                              }}
                              title="Gerar ATA da Reunião"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <FileText size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteMeeting(m.id)}
                            title="Remover Reunião"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- ABA 4: ATAS (ATAS) ---------------- */}
      {activeTab === 'minutes' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Atas Registradas & Elaboração</h3>
              <p className="text-xs text-slate-500">Documentos formais de deliberações, acordos e histórico de reuniões.</p>
            </div>

            <button
              onClick={() => {
                setEditingMinute({
                  meeting_date: todayStr,
                  status: 'Rascunho',
                  present_participants: [],
                  absent_participants: [],
                  recorder_name: user?.name || 'Administrador'
                })
                setMinuteModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Registrar Nova ATA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {minutes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <FileText size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-600">Nenhuma ATA cadastrada até o momento.</p>
                <p className="text-[11px] text-slate-400">Clique em "Registrar Nova ATA" para iniciar uma ata de reunião.</p>
              </div>
            ) : (
              minutes.map(min => (
                <div key={min.id} className="border border-slate-200 rounded-2xl p-5 bg-white hover:border-blue-400 transition-all flex flex-col justify-between group shadow-2xs">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        min.status === 'Publicada' ? 'bg-emerald-100 text-emerald-800' :
                        min.status === 'Cancelada' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {min.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {min.meeting_date.split('-').reverse().join('/')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {min.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {min.objective || min.decisions || 'Sem resumo cadastrado.'}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono space-y-0.5 pt-2 border-t border-slate-100">
                      <div>Secretário: <strong className="text-slate-700">{min.recorder_name}</strong></div>
                      <div>Presentes: <strong className="text-slate-700">{min.present_participants?.length || 0} membros</strong></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingMinute(min)}
                        title="Visualizar ATA em Documento Profissional"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMinute(min)
                          setMinuteModalOpen(true)
                        }}
                        title="Editar ATA"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMinute(min.id)}
                        title="Excluir ATA"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Criar plano de ação a partir da ata */}
                    <button
                      onClick={() => {
                        setEditingAction({
                          minute_id: min.id,
                          description: `Ação originada da ${min.title}`,
                          due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
                          priority: 'Média',
                          status: 'Não iniciada'
                        })
                        setActionModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Ação
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- ABA 5: PLANOS DE AÇÃO ---------------- */}
      {activeTab === 'actions' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Acompanhamento dos Planos de Ação</h3>
              <p className="text-xs text-slate-500">Controle de prazos, responsáveis e entregas derivadas de reuniões.</p>
            </div>

            <button
              onClick={() => {
                setEditingAction({
                  start_date: todayStr,
                  due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                  priority: 'Média',
                  status: 'Não iniciada',
                  progress: 0,
                  department: 'Operação'
                })
                setActionModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Novo Plano de Ação</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5">Descrição da Ação</th>
                  <th className="p-3.5">Responsável / Área</th>
                  <th className="p-3.5">Prazo & Status</th>
                  <th className="p-3.5">Prioridade</th>
                  <th className="p-3.5">Progresso</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actions.map(a => {
                  const isLate = a.due_date < todayStr && a.status !== 'Concluída' && a.status !== 'Cancelada'
                  return (
                    <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${isLate ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3.5 font-bold text-slate-800 max-w-xs">
                        <div className="line-clamp-2">{a.description}</div>
                        {a.comments && <p className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">{a.comments}</p>}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-700">{a.assignee}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{a.department}</span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className={isLate ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {a.due_date.split('-').reverse().join('/')}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          isLate ? 'bg-rose-100 text-rose-800' :
                          a.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' :
                          a.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                          a.status === 'Bloqueada' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {isLate ? 'ATRASADA' : a.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          a.priority === 'Crítica' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          a.priority === 'Alta' ? 'bg-amber-100 text-amber-800' :
                          a.priority === 'Média' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {a.priority}
                        </span>
                      </td>
                      <td className="p-3.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isLate ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${a.progress}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600">{a.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingAction(a)
                              setActionModalOpen(true)
                            }}
                            title="Editar Ação"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(a.id)}
                            title="Remover Ação"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- ABA 6: EVENTOS ---------------- */}
      {activeTab === 'events' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Eventos Corporativos e Operacionais</h3>
              <p className="text-xs text-slate-500">Workshops, auditorias, ritos, campanhas e treinamentos do CD 994.</p>
            </div>

            <button
              onClick={() => {
                setEditingEvent({
                  event_date: todayStr,
                  start_time: '09:00',
                  end_time: '12:00',
                  category: 'Treinamentos',
                  status: 'Confirmado'
                })
                setEventModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Novo Evento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="border border-slate-200 rounded-2xl p-5 bg-white hover:border-purple-300 transition-all flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                      {ev.category}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {ev.event_date.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{ev.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description || 'Sem descrição.'}</p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>{ev.start_time} às {ev.end_time}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    ev.status === 'Realizado' ? 'bg-emerald-100 text-emerald-800' :
                    ev.status === 'Cancelado' ? 'bg-rose-100 text-rose-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {ev.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingEvent(ev)
                        setEventModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAIS (REUNIÃO, ATA, PLANO DE AÇÃO, EVENTO E VISUALIZADOR)
          ========================================================================= */}

      {/* MODAL REUNIÃO */}
      {meetingModalOpen && editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                {editingMeeting.id ? 'Editar Reunião' : 'Agendar Nova Reunião'}
              </h3>
              <button onClick={() => setMeetingModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Título da Reunião *</label>
                <input
                  type="text"
                  required
                  value={editingMeeting.title || ''}
                  onChange={e => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                  placeholder="Ex: Alinhamento Operacional CD 994"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Tipo de Reunião</label>
                  <select
                    value={editingMeeting.meeting_type || 'Ritos operacionais'}
                    onChange={e => setEditingMeeting({ ...editingMeeting, meeting_type: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  >
                    <option value="Ritos operacionais">Ritos operacionais</option>
                    <option value="Reuniões gerenciais">Reuniões gerenciais</option>
                    <option value="Comitê de Resultados">Comitê de Resultados</option>
                    <option value="Auditorias">Auditorias</option>
                    <option value="1:1 e Feedback">1:1 e Feedback</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Data *</label>
                  <input
                    type="date"
                    required
                    value={editingMeeting.meeting_date || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, meeting_date: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Horário Início *</label>
                  <input
                    type="time"
                    required
                    value={editingMeeting.start_time || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, start_time: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Horário Término *</label>
                  <input
                    type="time"
                    required
                    value={editingMeeting.end_time || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, end_time: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Local ou Link</label>
                <input
                  type="text"
                  value={editingMeeting.location || ''}
                  onChange={e => setEditingMeeting({ ...editingMeeting, location: e.target.value })}
                  placeholder="Ex: Sala de Reunião 1 ou Link Meet"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Participantes (separados por vírgula)</label>
                <input
                  type="text"
                  value={editingMeeting.participants?.join(', ') || ''}
                  onChange={e => setEditingMeeting({ ...editingMeeting, participants: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Ex: Johansson, Supervisores, Qualidade"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Pauta da Reunião</label>
                <textarea
                  rows={3}
                  value={editingMeeting.agenda || ''}
                  onChange={e => setEditingMeeting({ ...editingMeeting, agenda: e.target.value })}
                  placeholder="Itens a serem abordados..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={editingMeeting.status || 'Agendada'}
                    onChange={e => setEditingMeeting({ ...editingMeeting, status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  >
                    <option value="Agendada">Agendada</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Organizador</label>
                  <input
                    type="text"
                    value={editingMeeting.organizer || user?.name || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, organizer: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Salvar Reunião
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELABORAÇÃO DE ATA */}
      {minuteModalOpen && editingMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                {editingMinute.id ? 'Editar ATA de Reunião' : 'Elaborar Nova ATA'}
              </h3>
              <button onClick={() => setMinuteModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMinute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Título da Reunião / ATA *</label>
                <input
                  type="text"
                  required
                  value={editingMinute.title || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, title: e.target.value })}
                  placeholder="Ex: ATA da Reunião de Fechamento Operacional"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Data da Reunião *</label>
                  <input
                    type="date"
                    required
                    value={editingMinute.meeting_date || ''}
                    onChange={e => setEditingMinute({ ...editingMinute, meeting_date: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Status da ATA</label>
                  <select
                    value={editingMinute.status || 'Rascunho'}
                    onChange={e => setEditingMinute({ ...editingMinute, status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-bold"
                  >
                    <option value="Rascunho">Rascunho (Em elaboração)</option>
                    <option value="Publicada">Publicada (Oficial)</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Participantes Presentes (separados por vírgula)</label>
                <input
                  type="text"
                  value={editingMinute.present_participants?.join(', ') || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, present_participants: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Ex: Johansson, Carlos, Mariana"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Objetivo da Reunião</label>
                <input
                  type="text"
                  value={editingMinute.objective || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, objective: e.target.value })}
                  placeholder="Objetivo principal..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Principais Assuntos Tratados & Pauta</label>
                <textarea
                  rows={3}
                  value={editingMinute.main_topics || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, main_topics: e.target.value })}
                  placeholder="Descreva os temas abordados..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800">Decisões Tomadas</label>
                <textarea
                  rows={2}
                  value={editingMinute.decisions || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, decisions: e.target.value })}
                  placeholder="O que ficou decidido pelo time..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/20 outline-none focus:border-emerald-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-amber-800">Pendências & Próximos Passos</label>
                <textarea
                  rows={2}
                  value={editingMinute.pending_issues || ''}
                  onChange={e => setEditingMinute({ ...editingMinute, pending_issues: e.target.value })}
                  placeholder="Pendências que necessitam de acompanhamento..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 outline-none focus:border-amber-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMinuteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Salvar ATA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISUALIZADOR PROFISSIONAL DE ATA (DOCUMENTO FORMATADO PARA IMPRESSÃO) */}
      {viewingMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  CD 994
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">ATA DE REUNIÃO CORPORATIVA</h2>
                  <p className="text-xs text-slate-500">Magalog CDs &bull; Gestão Logística</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button onClick={() => setViewingMinute(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                <div><strong>Título:</strong> {viewingMinute.title}</div>
                <div><strong>Data:</strong> {viewingMinute.meeting_date.split('-').reverse().join('/')}</div>
                <div><strong>Status:</strong> {viewingMinute.status}</div>
                <div><strong>Secretário:</strong> {viewingMinute.recorder_name}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Participantes</h4>
                <p><strong>Presentes:</strong> {viewingMinute.present_participants?.join(', ') || 'Nenhum'}</p>
                {viewingMinute.absent_participants?.length ? (
                  <p className="text-slate-400 mt-0.5"><strong>Ausentes:</strong> {viewingMinute.absent_participants.join(', ')}</p>
                ) : null}
              </div>

              {viewingMinute.objective && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">2. Objetivo</h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100">{viewingMinute.objective}</p>
                </div>
              )}

              {viewingMinute.main_topics && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">3. Assuntos Tratados & Pauta</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-wrap">{viewingMinute.main_topics}</div>
                </div>
              )}

              {viewingMinute.decisions && (
                <div>
                  <h4 className="font-bold text-emerald-800 text-sm mb-1">4. Decisões Acordadas</h4>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 whitespace-pre-wrap text-emerald-950 font-medium">{viewingMinute.decisions}</div>
                </div>
              )}

              {viewingMinute.pending_issues && (
                <div>
                  <h4 className="font-bold text-amber-800 text-sm mb-1">5. Pendências & Próximas Ações</h4>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 whitespace-pre-wrap text-amber-950">{viewingMinute.pending_issues}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANO DE AÇÃO */}
      {actionModalOpen && editingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={18} className="text-emerald-600" />
                {editingAction.id ? 'Editar Plano de Ação' : 'Cadastrar Plano de Ação'}
              </h3>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Descrição da Ação / Pendência *</label>
                <textarea
                  rows={2}
                  required
                  value={editingAction.description || ''}
                  onChange={e => setEditingAction({ ...editingAction, description: e.target.value })}
                  placeholder="Descreva claramente a ação a ser realizada..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Responsável *</label>
                  <input
                    type="text"
                    required
                    value={editingAction.assignee || ''}
                    onChange={e => setEditingAction({ ...editingAction, assignee: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Área Responsável</label>
                  <input
                    type="text"
                    value={editingAction.department || 'Operação'}
                    onChange={e => setEditingAction({ ...editingAction, department: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Prioridade</label>
                  <select
                    value={editingAction.priority || 'Média'}
                    onChange={e => setEditingAction({ ...editingAction, priority: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-bold"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Prazo de Conclusão *</label>
                  <input
                    type="date"
                    required
                    value={editingAction.due_date || ''}
                    onChange={e => setEditingAction({ ...editingAction, due_date: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={editingAction.status || 'Não iniciada'}
                    onChange={e => setEditingAction({ ...editingAction, status: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-bold"
                  >
                    <option value="Não iniciada">Não iniciada</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Bloqueada">Bloqueada</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Progresso ({editingAction.progress ?? 0}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingAction.progress ?? 0}
                    onChange={e => setEditingAction({ ...editingAction, progress: Number(e.target.value) })}
                    className="w-full mt-3 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Comentários & Histórico</label>
                <input
                  type="text"
                  value={editingAction.comments || ''}
                  onChange={e => setEditingAction({ ...editingAction, comments: e.target.value })}
                  placeholder="Observação da última atualização..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Salvar Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EVENTO */}
      {eventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon size={18} className="text-purple-600" />
                {editingEvent.id ? 'Editar Evento Corporativo' : 'Cadastrar Novo Evento'}
              </h3>
              <button onClick={() => setEventModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nome do Evento *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.name || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  placeholder="Ex: Treinamento 5S ou Campanha Black Friday"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Categoria</label>
                  <select
                    value={editingEvent.category || 'Treinamentos'}
                    onChange={e => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  >
                    <option value="Reuniões gerenciais">Reuniões gerenciais</option>
                    <option value="Ritos operacionais">Ritos operacionais</option>
                    <option value="Treinamentos">Treinamentos</option>
                    <option value="Auditorias">Auditorias</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Eventos internos">Eventos internos</option>
                    <option value="Datas comemorativas">Datas comemorativas</option>
                    <option value="Campanhas operacionais">Campanhas operacionais</option>
                    <option value="Outros eventos">Outros eventos</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Data *</label>
                  <input
                    type="date"
                    required
                    value={editingEvent.event_date || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Início *</label>
                  <input
                    type="time"
                    required
                    value={editingEvent.start_time || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Término *</label>
                  <input
                    type="time"
                    required
                    value={editingEvent.end_time || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Local</label>
                <input
                  type="text"
                  value={editingEvent.location || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="Ex: Auditório Central ou Pista Operacional"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Público-Alvo ou Participantes</label>
                <input
                  type="text"
                  value={editingEvent.target_audience || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, target_audience: e.target.value })}
                  placeholder="Ex: Toda a equipe de expedição"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
