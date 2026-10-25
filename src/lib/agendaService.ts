import { supabase } from './supabase'

export interface Meeting {
  id: string
  title: string
  meeting_type: string
  meeting_date: string // YYYY-MM-DD
  start_time: string   // HH:MM
  end_time: string     // HH:MM
  location?: string
  organizer: string
  organizer_id?: string
  participants: string[]
  agenda?: string
  status: 'Agendada' | 'Em andamento' | 'Realizada' | 'Cancelada'
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface MeetingMinute {
  id: string
  meeting_id?: string
  title: string
  meeting_date: string
  start_time?: string
  end_time?: string
  present_participants: string[]
  absent_participants: string[]
  objective?: string
  agenda_discussed?: string
  main_topics?: string
  decisions?: string
  pending_issues?: string
  notes?: string
  recorder_name: string
  recorder_id?: string
  status: 'Rascunho' | 'Publicada' | 'Cancelada'
  published_at?: string
  version?: number
  created_at?: string
  updated_at?: string
}

export interface ActionPlanHistoryItem {
  date: string
  user: string
  note: string
}

export interface ActionPlan {
  id: string
  meeting_id?: string
  minute_id?: string
  description: string
  assignee: string
  department: string
  start_date: string
  due_date: string
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  status: 'Não iniciada' | 'Em andamento' | 'Bloqueada' | 'Concluída' | 'Cancelada'
  progress: number
  completion_date?: string
  comments?: string
  history?: ActionPlanHistoryItem[]
  created_at?: string
  updated_at?: string
}

export interface CorporateEvent {
  id: string
  name: string
  category: 
    | 'Reuniões gerenciais' 
    | 'Ritos operacionais' 
    | 'Treinamentos' 
    | 'Auditorias' 
    | 'Workshops' 
    | 'Eventos internos' 
    | 'Datas comemorativas' 
    | 'Campanhas operacionais' 
    | 'Outros eventos'
  description?: string
  event_date: string
  start_time: string
  end_time: string
  location?: string
  organizer: string
  target_audience?: string
  responsible?: string
  status: 'Planejado' | 'Confirmado' | 'Realizado' | 'Cancelado'
  notes?: string
  created_at?: string
  updated_at?: string
}

// Fallback Local Storage Storage Keys para garantir funcionamento offline/instantâneo
const STORAGE_KEYS = {
  MEETINGS: 'magalog_corporate_meetings',
  MINUTES: 'magalog_corporate_meeting_minutes',
  ACTIONS: 'magalog_corporate_action_plans',
  EVENTS: 'magalog_corporate_events'
}

// DADOS INICIAIS DE DEMONSTRAÇÃO (CARREGADOS CASO BANCO VAZIO)
const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Alinhamento Matinal Operacional CD 994',
    meeting_type: 'Ritos operacionais',
    meeting_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '08:30',
    location: 'Sala de Reunião 1 (Presencial)',
    organizer: 'Johansson Gomes',
    participants: ['Johansson Gomes', 'Supervisores de Turno', 'Líderes de Expedição'],
    agenda: 'Alinhamento das metas volumétricas do dia, distribuição de docas e capacidade de transporte.',
    status: 'Realizada',
    notes: 'Turno 1 operando com capacidade nominal de 100%.'
  },
  {
    id: 'm2',
    title: 'Comitê Semanal de Indicadores & SLA 1P',
    meeting_type: 'Reuniões gerenciais',
    meeting_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '14:30',
    end_time: '15:30',
    location: 'Google Meet / Sala Executiva',
    organizer: 'Gerência de Logística',
    participants: ['Gerente Geral', 'Supervisores', 'Qualidade CTE'],
    agenda: 'Revisão do SLA de entrega por modal Courier/Rodo e tratativas de ofensores da malha.',
    status: 'Agendada',
    notes: 'Levar dados consolidados do Tableau.'
  },
  {
    id: 'm3',
    title: 'Auditoria de Segurança e 5S nas Docas',
    meeting_type: 'Auditorias',
    meeting_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    location: 'Pista e Docas 01 a 12',
    organizer: 'Coordenação de Qualidade',
    participants: ['Segurança do Trabalho', 'Líderes Operacionais'],
    agenda: 'Auditoria semestral de conformidade das docas e inspeção visual dos equipamentos.',
    status: 'Agendada',
    notes: 'Checklist padrão 5S LuizaLabs.'
  }
]

const INITIAL_EVENTS: CorporateEvent[] = [
  {
    id: 'e1',
    name: 'Treinamento Operacional: Boas Práticas de Movimentação',
    category: 'Treinamentos',
    description: 'Capacitação prática sobre manuseio seguro de transpaleteiras e empilhadeiras no CD 994.',
    event_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:30',
    location: 'Auditório de Treinamento',
    organizer: 'RH & Treinamento',
    target_audience: 'Operadores de Empilhadeira e Auxiliares',
    responsible: 'Coordenação Operacional',
    status: 'Confirmado'
  },
  {
    id: 'e2',
    name: 'Campanha Black Friday 2026: Alinhamento de Pico',
    category: 'Campanhas operacionais',
    description: 'Preparação estratégica de efetivo, rotas especiais e dimensionamento de expedição.',
    event_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    start_time: '15:00',
    end_time: '17:00',
    location: 'Sala Principal & Transmissão',
    organizer: 'Diretoria de Operações',
    target_audience: 'Liderança e Supervisores',
    responsible: 'Gerente do CD',
    status: 'Planejado'
  }
]

const INITIAL_ACTIONS: ActionPlan[] = [
  {
    id: 'a1',
    meeting_id: 'm1',
    description: 'Auditar o cumprimento das janelas de expedição do modal Rodo nas docas 05 a 08',
    assignee: 'Carlos Silva',
    department: 'Expedição',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    priority: 'Alta',
    status: 'Em andamento',
    progress: 40,
    comments: 'Iniciada verificação no turno matutino.',
    history: [{ date: new Date().toISOString(), user: 'Carlos Silva', note: 'Plano iniciado' }]
  },
  {
    id: 'a2',
    meeting_id: 'm1',
    description: 'Ajustar dimensionamento de transpaleteiras elétricas para o setor de separação',
    assignee: 'Mariana Costa',
    department: 'Equipamentos',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Atrasada intencional para teste
    priority: 'Crítica',
    status: 'Não iniciada',
    progress: 0,
    comments: 'Aguardando liberação de orçamento da manutenção.',
    history: []
  }
]

// =========================================================================
// MÉTODOS DE REUNIÕES (MEETINGS)
// =========================================================================
export const fetchMeetings = async (): Promise<Meeting[]> => {
  try {
    const { data, error } = await supabase
      .from('corporate_meetings')
      .select('*')
      .order('meeting_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error || !data || data.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.MEETINGS)
      if (local) return JSON.parse(local)
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(INITIAL_MEETINGS))
      return INITIAL_MEETINGS
    }

    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(data))
    return data as Meeting[]
  } catch (err) {
    const local = localStorage.getItem(STORAGE_KEYS.MEETINGS)
    return local ? JSON.parse(local) : INITIAL_MEETINGS
  }
}

export const saveMeeting = async (meeting: Partial<Meeting>): Promise<Meeting> => {
  const isNew = !meeting.id
  const payload: any = {
    ...meeting,
    id: meeting.id || crypto.randomUUID(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('corporate_meetings')
      .upsert(payload)
      .select()
      .single()

    if (!error && data) {
      updateLocalList(STORAGE_KEYS.MEETINGS, data)
      return data as Meeting
    }
  } catch (err) {
    console.warn('Erro ao salvar no Supabase, salvando localmente:', err)
  }

  updateLocalList(STORAGE_KEYS.MEETINGS, payload)
  return payload as Meeting
}

export const deleteMeeting = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('corporate_meetings').delete().eq('id', id)
  } catch (err) {
    console.warn('Erro ao deletar no Supabase:', err)
  }
  removeFromLocalList(STORAGE_KEYS.MEETINGS, id)
  return true
}

// =========================================================================
// MÉTODOS DE ATAS (MEETING MINUTES)
// =========================================================================
export const fetchMeetingMinutes = async (): Promise<MeetingMinute[]> => {
  try {
    const { data, error } = await supabase
      .from('corporate_meeting_minutes')
      .select('*')
      .order('meeting_date', { ascending: false })

    if (error || !data || data.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.MINUTES)
      return local ? JSON.parse(local) : []
    }

    localStorage.setItem(STORAGE_KEYS.MINUTES, JSON.stringify(data))
    return data as MeetingMinute[]
  } catch (err) {
    const local = localStorage.getItem(STORAGE_KEYS.MINUTES)
    return local ? JSON.parse(local) : []
  }
}

export const saveMeetingMinute = async (minute: Partial<MeetingMinute>): Promise<MeetingMinute> => {
  const payload: any = {
    ...minute,
    id: minute.id || crypto.randomUUID(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('corporate_meeting_minutes')
      .upsert(payload)
      .select()
      .single()

    if (!error && data) {
      updateLocalList(STORAGE_KEYS.MINUTES, data)
      return data as MeetingMinute
    }
  } catch (err) {
    console.warn('Erro ao salvar ATA no Supabase:', err)
  }

  updateLocalList(STORAGE_KEYS.MINUTES, payload)
  return payload as MeetingMinute
}

export const deleteMeetingMinute = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('corporate_meeting_minutes').delete().eq('id', id)
  } catch (err) {
    console.warn('Erro ao deletar ATA no Supabase:', err)
  }
  removeFromLocalList(STORAGE_KEYS.MINUTES, id)
  return true
}

// =========================================================================
// MÉTODOS DE PLANOS DE AÇÃO (ACTION PLANS)
// =========================================================================
export const fetchActionPlans = async (): Promise<ActionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('corporate_action_plans')
      .select('*')
      .order('due_date', { ascending: true })

    if (error || !data || data.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.ACTIONS)
      if (local) return JSON.parse(local)
      localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(INITIAL_ACTIONS))
      return INITIAL_ACTIONS
    }

    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(data))
    return data as ActionPlan[]
  } catch (err) {
    const local = localStorage.getItem(STORAGE_KEYS.ACTIONS)
    return local ? JSON.parse(local) : INITIAL_ACTIONS
  }
}

export const saveActionPlan = async (action: Partial<ActionPlan>): Promise<ActionPlan> => {
  const payload: any = {
    ...action,
    id: action.id || crypto.randomUUID(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('corporate_action_plans')
      .upsert(payload)
      .select()
      .single()

    if (!error && data) {
      updateLocalList(STORAGE_KEYS.ACTIONS, data)
      return data as ActionPlan
    }
  } catch (err) {
    console.warn('Erro ao salvar plano no Supabase:', err)
  }

  updateLocalList(STORAGE_KEYS.ACTIONS, payload)
  return payload as ActionPlan
}

export const deleteActionPlan = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('corporate_action_plans').delete().eq('id', id)
  } catch (err) {
    console.warn('Erro ao deletar plano no Supabase:', err)
  }
  removeFromLocalList(STORAGE_KEYS.ACTIONS, id)
  return true
}

// =========================================================================
// MÉTODOS DE EVENTOS CORPORATIVOS (EVENTS)
// =========================================================================
export const fetchCorporateEvents = async (): Promise<CorporateEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('corporate_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error || !data || data.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.EVENTS)
      if (local) return JSON.parse(local)
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS))
      return INITIAL_EVENTS
    }

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data))
    return data as CorporateEvent[]
  } catch (err) {
    const local = localStorage.getItem(STORAGE_KEYS.EVENTS)
    return local ? JSON.parse(local) : INITIAL_EVENTS
  }
}

export const saveCorporateEvent = async (event: Partial<CorporateEvent>): Promise<CorporateEvent> => {
  const payload: any = {
    ...event,
    id: event.id || crypto.randomUUID(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('corporate_events')
      .upsert(payload)
      .select()
      .single()

    if (!error && data) {
      updateLocalList(STORAGE_KEYS.EVENTS, data)
      return data as CorporateEvent
    }
  } catch (err) {
    console.warn('Erro ao salvar evento no Supabase:', err)
  }

  updateLocalList(STORAGE_KEYS.EVENTS, payload)
  return payload as CorporateEvent
}

export const deleteCorporateEvent = async (id: string): Promise<boolean> => {
  try {
    await supabase.from('corporate_events').delete().eq('id', id)
  } catch (err) {
    console.warn('Erro ao deletar evento no Supabase:', err)
  }
  removeFromLocalList(STORAGE_KEYS.EVENTS, id)
  return true
}

// Helpers locais
function updateLocalList(key: string, item: any) {
  try {
    const raw = localStorage.getItem(key)
    const list: any[] = raw ? JSON.parse(raw) : []
    const idx = list.findIndex(i => i.id === item.id)
    if (idx >= 0) {
      list[idx] = item
    } else {
      list.push(item)
    }
    localStorage.setItem(key, JSON.stringify(list))
  } catch (e) {
    // Ignora
  }
}

function removeFromLocalList(key: string, id: string) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const list: any[] = JSON.parse(raw)
    const updated = list.filter(i => i.id !== id)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (e) {
    // Ignora
  }
}
