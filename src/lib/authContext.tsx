import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import initialColaboradores from '../data/initialColaboradores.json'
import initialUsers from '../data/initialUsers.json'

export type UserRole = string

export interface ColaboradorData {
  cd?: string
  id: string
  contratado: string
  login?: string
  cpf?: string
  rg?: string
  sexo?: string
  cargoAnterior?: string
  cargo: string
  dataAdmissao?: string
  dataNascimento?: string
  situacaoSistema?: string
  status?: string
  possuiMedidas?: string
  possuiFeedback?: string
  idLider?: string
  nomeLider?: string
  setor?: string
  area?: string
  turno?: string
  ferias?: string
  codCentroCusto?: string
  centroDeCusto?: string
  gerencia?: string
  periodo45Dias?: string
  periodo90Dias?: string
  diaNiver?: string
  mesNiver?: string
  aniversario?: string
  novaIdade?: string
  tempoDeEmpresa?: string
  mesAdm?: string
  diaAdm?: string
  anoAdm?: string
}

export const LISTA_AREAS_OPCOES = [
  'PLANEJAMENTO',
  'EXPEDIÇÃO',
  'RECEBIMENTO',
  'TRANSPORTE',
  'CONTROLE DE ESTOQUE',
  'REVERSA (DQS)',
  'APOIO (OUTRAS AREAS)',
  'GENRENCIA',
  'C&D'
] as const

export const LISTA_SITUACAO_SISTEMA_OPCOES = [
  'Em Atividade Normal',
  'Gozando Férias',
  'Auxílio-Doença',
  'Acidente do Trabalho',
  'Prorrogação Licença-Maternidade - Lei 11.770/08',
  'Licença Maternidade',
  'Licença Paternidade',
  'Afastamento Previdenciário',
  'Suspensão Contratual',
  'Demitido / Desligado'
] as const

export interface AppUserProfile {
  id: string
  user_id?: string
  colaborador_id?: string
  email: string
  name: string
  role: UserRole
  cargo?: string
  allowed_pages: string[]
  allowed_subpages?: string[]
  active: boolean
  password_hash?: string
  avatar_url?: string
  bio?: string
  phone?: string
  dados_colaborador?: ColaboradorData
}

// Subpáginas do sistema catalogadas por página principal
export const AVAILABLE_SUBPAGES: { id: string; pageId: string; label: string }[] = [
  // Gestão 360° (PMTs e Módulos)
  { id: 'sub-pmt-expedicao', pageId: 'pmts', label: 'PMT Expedição' },
  { id: 'sub-pmt-expedicao-pg1', pageId: 'pmts', label: 'PMT Expedição • Pg 1' },
  { id: 'sub-pmt-expedicao-pg2', pageId: 'pmts', label: 'PMT Expedição • Pg 2' },
  { id: 'sub-pmt-expedicao-pg3', pageId: 'pmts', label: 'PMT Expedição • Pg 3' },
  { id: 'sub-pmt-expedicao-pg4', pageId: 'pmts', label: 'PMT Expedição • Pg 4' },
  { id: 'sub-pmt-recebimento', pageId: 'pmts', label: 'PMT Recebimento' },
  { id: 'sub-pmt-quadro', pageId: 'pmts', label: 'Quadro de Colaboradores' },
  { id: 'sub-pmt-promocionais', pageId: 'pmts', label: 'Itens Promocionais • NE/NO/CO' },
  { id: 'sub-pmt-tableau', pageId: 'pmts', label: 'Tableau Indicadores' },
  { id: 'sub-pmt-carteira-cds', pageId: 'pmts', label: 'Carteira CDs • Looker' },
  // Sub-abas do Quadro
  { id: 'sub-quadro-dashboard', pageId: 'pmts', label: 'Quadro • Dashboard' },
  { id: 'sub-quadro-tt', pageId: 'pmts', label: 'Quadro TT (Base & Cadastro)' },
  { id: 'sub-quadro-bh', pageId: 'pmts', label: 'Quadro • Banco de Horas' },
  { id: 'sub-quadro-padu', pageId: 'pmts', label: 'Quadro • Controle PADU' },
  { id: 'sub-quadro-medio', pageId: 'pmts', label: 'Quadro Médio (Grade)' },
  { id: 'sub-apontamento', pageId: 'pmts', label: 'Quadro • Apontamento Diário' },
  // Gestão Orçamentária
  { id: 'sub-budget-visao_geral', pageId: 'budget', label: 'Orçamento • Visão Geral' },
  { id: 'sub-budget-orcamento_disponivel', pageId: 'budget', label: 'Orçamento • Disponível' },
  { id: 'sub-budget-despesas_realizadas', pageId: 'budget', label: 'Orçamento • Despesas Realizadas' },
  { id: 'sub-budget-compromissos_futuros', pageId: 'budget', label: 'Orçamento • Compromissos' },
  { id: 'sub-budget-previsto_x_realizado', pageId: 'budget', label: 'Orçamento • Previsto × Realizado' },
  { id: 'sub-budget-historico_mensal', pageId: 'budget', label: 'Orçamento • Histórico Mensal' },
  { id: 'sub-budget-cartao_corporativo', pageId: 'budget', label: 'Orçamento • Cartão Corporativo' },
  // Equipamentos
  { id: 'sub-catalog-dashboard', pageId: 'catalog', label: 'Equipamentos • Dashboard' },
  { id: 'sub-catalog-list', pageId: 'catalog', label: 'Equipamentos • Cadastrados' },
  { id: 'sub-catalog-maintenance', pageId: 'catalog', label: 'Equipamentos • Manutenções' },
  { id: 'sub-catalog-reports', pageId: 'catalog', label: 'Equipamentos • Relatórios' },
  // Central Operacional
  { id: 'sub-settings-p1', pageId: 'settings', label: 'Central • Visão Geral & Fluxo' },
  { id: 'sub-settings-p2', pageId: 'settings', label: 'Central • Docas & Expedição' },
  { id: 'sub-settings-p3', pageId: 'settings', label: 'Central • Métricas de Turno' },
  { id: 'sub-settings-p4', pageId: 'settings', label: 'Central • Auditoria' },
  { id: 'sub-settings-p5', pageId: 'settings', label: 'Central • Parâmetros & Configurações' },
  // Agenda & Reuniões
  { id: 'sub-agenda-overview', pageId: 'agenda', label: 'Agenda • Visão Geral' },
  { id: 'sub-agenda-calendar', pageId: 'agenda', label: 'Agenda • Calendário' },
  { id: 'sub-agenda-meetings', pageId: 'agenda', label: 'Agenda • Reuniões' },
  { id: 'sub-agenda-minutes', pageId: 'agenda', label: 'Agenda • Atas (ATAs)' },
  { id: 'sub-agenda-actions', pageId: 'agenda', label: 'Agenda • Planos de Ação' },
  { id: 'sub-agenda-events', pageId: 'agenda', label: 'Agenda • Eventos' }
]

// Permissões padrão por cargo / senioridade
export const getDefaultPagesForCargo = (cargo: string): string[] => {
  const c = (cargo || '').trim().toUpperCase()
  if (c === 'ADMIN' || c === 'ADMINISTRADOR' || c.startsWith('ADMIN ') || c.endsWith(' ADMIN') || c.includes('DIRETOR')) {
    return ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'settings', 'links', 'users']
  }
  if (c.includes('GERENTE')) {
    return ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'links']
  }
  if (c.includes('COORDENADOR')) {
    return ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'links']
  }
  if (c.includes('SUPERVISOR')) {
    return ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'inventory', 'links']
  }
  if (c.includes('LIDER') || c.includes('LÍDER')) {
    return ['dashboard', 'performance', 'catalog', 'agenda', 'inventory', 'links']
  }
  if (c.includes('ANALISTA') || c.includes('CONSULTOR')) {
    return ['dashboard', 'performance', 'pmts', 'agenda', 'inventory', 'links']
  }
  // Conferentes, Operadores, Assistentes, Médicos, etc.
  return ['dashboard', 'performance', 'agenda', 'inventory', 'links']
}

// Subpáginas padrão por cargo (apenas das páginas às quais o cargo tem acesso)
export const getDefaultSubpagesForCargo = (cargo: string): string[] => {
  const allowedPages = getDefaultPagesForCargo(cargo)
  return AVAILABLE_SUBPAGES.filter(s => allowedPages.includes(s.pageId)).map(s => s.id)
}

export const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
  admin: ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'settings', 'links', 'users'],
  gerente: ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'links'],
  coordenador: ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'budget', 'inventory', 'links'],
  supervisor: ['dashboard', 'performance', 'catalog', 'pmts', 'agenda', 'inventory', 'links'],
  lider: ['dashboard', 'performance', 'catalog', 'agenda', 'inventory', 'links'],
  bp: ['dashboard', 'performance', 'pmts', 'agenda', 'inventory', 'links'],
  colaborador: ['dashboard', 'performance', 'agenda', 'inventory', 'links']
}

export const mapCargoToValidRole = (cargo: string): string => {
  const c = (cargo || '').trim().toUpperCase()
  if (c === 'ADMIN' || c === 'ADMINISTRADOR' || c.startsWith('ADMIN ') || c.endsWith(' ADMIN')) return 'admin'
  if (c.includes('GERENTE')) return 'gerente'
  if (c.includes('COORDENADOR')) return 'coordenador'
  if (c.includes('SUPERVISOR')) return 'supervisor'
  if (c.includes('LIDER') || c.includes('LÍDER')) return 'lider'
  if (c.includes('ANALISTA') || c.includes('CONSULTOR')) return 'bp'
  return 'colaborador'
}
export interface OnlineUser {
  id: string
  name: string
  email: string
  role: UserRole
  cargo?: string
  avatar_url?: string
  logged_at: string
  online_at: string
}

interface AuthContextType {
  user: AppUserProfile | null
  loading: boolean
  onlineUsers: OnlineUser[]
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasPermission: (pageId: string, subpageId?: string) => boolean
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<AppUserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  // Helper para persistência dedicada e imediata do avatar por e-mail no navegador
  const getStoredAvatar = (email?: string): string => {
    if (!email) return ''
    try {
      const clean = email.trim().toLowerCase()
      return localStorage.getItem(`magalog_avatar_${clean}`) || ''
    } catch {
      return ''
    }
  }

  const setStoredAvatar = (email: string | undefined, avatar: string | undefined) => {
    if (!email) return
    try {
      const clean = email.trim().toLowerCase()
      if (avatar) {
        localStorage.setItem(`magalog_avatar_${clean}`, avatar)
      }
    } catch {}
  }

  // Helper robusto para encontrar o colaborador correspondente na base por e-mail, login, nome ou id
  const findColaboradorMatch = (email?: string, name?: string, id?: string) => {
    const cleanMail = (email || '').toLowerCase().trim()
    const loginPrefix = cleanMail.split('@')[0]
    const cleanName = (name || '').toLowerCase().trim()

    // Caso especial mestre
    if (cleanMail === 'johansson.gomes@magazineluiza.com.br' || cleanMail === 'joh_gomes@magalog.com.br') {
      const matchMaster = (initialColaboradores as any[]).find(c => String(c.id) === '169959')
      if (matchMaster) return matchMaster
    }

    if (id) {
      const byId = (initialColaboradores as any[]).find(c => String(c.id) === String(id))
      if (byId) return byId
    }

    return (initialColaboradores as any[]).find(c => {
      const cLogin = (c.login || '').toLowerCase().trim()
      const cContratado = (c.contratado || '').toLowerCase().trim()
      if (cLogin && (cleanMail.includes(cLogin) || loginPrefix === cLogin)) return true
      if (cleanName && cContratado && (cleanName.includes(cContratado) || cContratado.includes(cleanName))) return true
      return false
    })
  }

  // Carregar sessão e perfil do Supabase
  const loadProfile = async (authUserId: string, authEmail: string) => {
    const cleanEmail = authEmail.trim().toLowerCase()
    const cachedAvatar = getStoredAvatar(cleanEmail)
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .or(`user_id.eq.${authUserId},email.eq.${cleanEmail}`)
        .maybeSingle()

      if (data && !error) {
        const colabInfo = findColaboradorMatch(data.email, data.name, data.colaborador_id)

        // Tenta buscar campos extras de perfil (foto, bio, phone)
        let extraProfile: any = null
        try {
          const profileStorageKey = `_user_extra_profile_${cleanEmail}`
          const { data: extraRow } = await supabase
            .from('performance_metrics')
            .select('value')
            .eq('cell_key', profileStorageKey)
            .maybeSingle()
          if (extraRow?.value) {
            extraProfile = JSON.parse(extraRow.value)
          }
        } catch {}

        const finalAvatar = data.avatar_url || extraProfile?.avatar_url || cachedAvatar || undefined
        if (finalAvatar) setStoredAvatar(cleanEmail, finalAvatar)

        const resolvedColabId = colabInfo?.id || (cleanEmail.includes('johansson') || cleanEmail.includes('joh_gomes') ? '169959' : data.colaborador_id || data.id)
        const resolvedCargo = colabInfo?.cargo || (cleanEmail.includes('johansson') || cleanEmail.includes('joh_gomes') ? 'COORDENADOR LOGISTICA' : data.cargo || data.role)
        const resolvedRole = data.role || (cleanEmail.includes('johansson') || cleanEmail.includes('joh_gomes') ? 'admin' : (colabInfo?.cargo ? mapCargoToValidRole(colabInfo.cargo) : 'colaborador'))

        const resolvedAllowedSubpages = (Array.isArray(data.allowed_subpages) && data.allowed_subpages.length > 0)
          ? data.allowed_subpages
          : (Array.isArray(extraProfile?.allowed_subpages))
            ? extraProfile.allowed_subpages
            : (Array.isArray(knownUser?.allowed_subpages))
              ? knownUser.allowed_subpages
              : undefined

        const enriched: AppUserProfile = {
          ...data,
          avatar_url: finalAvatar,
          bio: data.bio || extraProfile?.bio,
          phone: data.phone || extraProfile?.phone,
          colaborador_id: resolvedColabId,
          cargo: resolvedCargo,
          role: resolvedRole,
          allowed_subpages: resolvedAllowedSubpages
        }
        localStorage.setItem('magalog_admin_session', JSON.stringify(enriched))
        setUser(enriched)
        return
      }

      // Se não existir registro no app_users, busca do cache local ou initialUsers
      let knownUser: any = null
      try {
        const localUsers = localStorage.getItem('magalog_users_list')
        if (localUsers) {
          const parsed = JSON.parse(localUsers)
          knownUser = parsed.find((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail)
        }
      } catch {}

      if (!knownUser) {
        knownUser = (initialUsers as any[]).find(u => (u.email || '').trim().toLowerCase() === cleanEmail)
      }

      const colabInfo = findColaboradorMatch(cleanEmail, knownUser?.name, knownUser?.colaborador_id)

      const isInitialAdmin = cleanEmail.includes('admin') || cleanEmail.includes('joh_gomes') || cleanEmail === 'johansson.gomes@magazineluiza.com.br'
      const determinedCargo = colabInfo?.cargo || knownUser?.cargo || (isInitialAdmin ? 'COORDENADOR LOGISTICA' : 'Colaborador')
      const determinedRole = isInitialAdmin ? 'admin' : (knownUser?.role ? mapCargoToValidRole(knownUser.role) : mapCargoToValidRole(determinedCargo))
      const determinedPages = knownUser?.allowed_pages || getDefaultPagesForCargo(determinedCargo)

      const fallbackAvatar = knownUser?.avatar_url || cachedAvatar || undefined
      if (fallbackAvatar) setStoredAvatar(cleanEmail, fallbackAvatar)

      const fallbackUser: AppUserProfile = {
        id: knownUser?.id || authUserId,
        user_id: authUserId,
        colaborador_id: colabInfo?.id || knownUser?.colaborador_id || knownUser?.id || authUserId,
        email: cleanEmail,
        name: knownUser?.name || cleanEmail.split('@')[0],
        cargo: determinedCargo,
        role: determinedRole,
        allowed_pages: determinedPages,
        allowed_subpages: knownUser?.allowed_subpages,
        avatar_url: fallbackAvatar,
        active: knownUser?.active !== undefined ? knownUser.active : true
      }

      // Salva no Supabase app_users se possível
      await supabase.from('app_users').insert([fallbackUser]).catch(() => {})
      setUser(fallbackUser)
    } catch (err) {
      console.warn('Erro ao carregar perfil:', err)
      const isInitialAdmin = cleanEmail.includes('admin') || cleanEmail.includes('joh_gomes') || cleanEmail === 'johansson.gomes@magazineluiza.com.br'
      const fallbackRole = isInitialAdmin ? 'admin' : 'colaborador'
      setUser({
        id: authUserId,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: fallbackRole,
        cargo: isInitialAdmin ? 'Administrador' : 'Colaborador',
        allowed_pages: DEFAULT_ROLE_PAGES[fallbackRole],
        avatar_url: cachedAvatar || undefined,
        active: true
      })
    }
  }

  // Atualizador central de estado do usuário
  const applyProfileUpdate = (updatedProfile: AppUserProfile | null) => {
    if (!updatedProfile || updatedProfile.active === false) {
      localStorage.removeItem('magalog_admin_session')
      setUser(null)
    } else {
      if (updatedProfile.avatar_url && updatedProfile.email) {
        setStoredAvatar(updatedProfile.email, updatedProfile.avatar_url)
      } else if (!updatedProfile.avatar_url && updatedProfile.email) {
        const cached = getStoredAvatar(updatedProfile.email)
        if (cached) updatedProfile.avatar_url = cached
      }
      try {
        localStorage.setItem('magalog_admin_session', JSON.stringify(updatedProfile))
      } catch (err) {
        console.warn('Quota exceeded on magalog_admin_session, storing without large avatar in session object:', err)
        // Se a sessão exceder localStorage, guarda na sessão sem estourar
        const trimmed = { ...updatedProfile, avatar_url: undefined }
        try {
          localStorage.setItem('magalog_admin_session', JSON.stringify(trimmed))
        } catch {}
      }
      setUser(updatedProfile)
    }
  }

  useEffect(() => {
    // 1. Restaurar sessão inicial do localStorage
    const localSession = localStorage.getItem('magalog_admin_session')
    if (localSession) {
      try {
        const parsed: AppUserProfile = JSON.parse(localSession)
        if (parsed.email && !parsed.avatar_url) {
          const cached = getStoredAvatar(parsed.email)
          if (cached) parsed.avatar_url = cached
        }
        setUser(parsed)
        setLoading(false)
      } catch {}
    }

    // 2. Verificar sessão atual no Supabase Auth ou restaurar com loadProfile
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '')
      } else {
        const stored = localStorage.getItem('magalog_admin_session')
        if (stored) {
          try {
            const p = JSON.parse(stored)
            if (p?.email) {
              loadProfile(p.user_id || p.id, p.email)
            }
          } catch {}
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })

    // 3. Ouvinte de mudanças no Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '')
      } else if (!localStorage.getItem('magalog_admin_session')) {
        setUser(null)
      }
      setLoading(false)
    })

    // 4. Ouvinte Supabase Realtime para app_users
    const channel = supabase
      .channel('app_users_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_users' },
        async (payload: any) => {
          const currentStored = localStorage.getItem('magalog_admin_session')
          if (!currentStored) return
          try {
            const currentObj = JSON.parse(currentStored)
            const row = payload.new

            if (row && (
              row.email?.toLowerCase() === currentObj.email?.toLowerCase() ||
              row.id === currentObj.id
            )) {
              if (row.active === false) {
                applyProfileUpdate(null)
                return
              }

              // Buscar extraProfile para subpáginas se necessário
              let extraProfile: any = null
              try {
                const profileStorageKey = `_user_extra_profile_${row.email?.trim().toLowerCase()}`
                const { data: extraRow } = await supabase
                  .from('performance_metrics')
                  .select('value')
                  .eq('cell_key', profileStorageKey)
                  .maybeSingle()
                if (extraRow?.value) extraProfile = JSON.parse(extraRow.value)
              } catch {}

              const colabInfo = findColaboradorMatch(row.email, row.name, row.colaborador_id)
              const resolvedSubpages = (Array.isArray(row.allowed_subpages) && row.allowed_subpages.length > 0)
                ? row.allowed_subpages
                : (Array.isArray(extraProfile?.allowed_subpages))
                  ? extraProfile.allowed_subpages
                  : currentObj.allowed_subpages

              const newProf: AppUserProfile = {
                id: row.id,
                user_id: row.user_id || currentObj.user_id,
                colaborador_id: colabInfo?.id || row.colaborador_id || currentObj.colaborador_id,
                email: row.email,
                name: row.name,
                role: row.role as UserRole,
                cargo: colabInfo?.cargo || row.cargo || row.role,
                allowed_pages: row.allowed_pages || [],
                allowed_subpages: resolvedSubpages,
                active: row.active,
                avatar_url: row.avatar_url || extraProfile?.avatar_url || currentObj.avatar_url,
                bio: row.bio || extraProfile?.bio || currentObj.bio,
                phone: row.phone || extraProfile?.phone || currentObj.phone
              }
              applyProfileUpdate(newProf)
            }
          } catch {}
        }
      )
      .subscribe()

    // 5. Polling rápido e confiável (a cada 2s) para garantir reflexo instantâneo independente de Realtime
    const interval = setInterval(async () => {
      const currentStored = localStorage.getItem('magalog_admin_session')
      if (!currentStored) return
      try {
        const u = JSON.parse(currentStored)
        const cleanEmail = (u?.email || '').trim().toLowerCase()
        const isMaster = cleanEmail === 'johansson.gomes@magazineluiza.com.br' || cleanEmail === 'joh_gomes@magalog.com.br'
        if (!cleanEmail || isMaster) return

        const [appUserRes, extraRes] = await Promise.all([
          supabase.from('app_users').select('*').ilike('email', cleanEmail).maybeSingle(),
          supabase.from('performance_metrics').select('value').eq('cell_key', `_user_extra_profile_${cleanEmail}`).maybeSingle()
        ])

        const latest = appUserRes.data
        let extraProfile: any = null
        if (extraRes.data?.value) {
          try { extraProfile = JSON.parse(extraRes.data.value) } catch {}
        }

        if (latest) {
          // Se foi desativado pelo administrador
          if (latest.active === false) {
            applyProfileUpdate(null)
            return
          }

          const resolvedSubpages = (Array.isArray(latest.allowed_subpages) && latest.allowed_subpages.length > 0)
            ? latest.allowed_subpages
            : (Array.isArray(extraProfile?.allowed_subpages))
              ? extraProfile.allowed_subpages
              : u.allowed_subpages

          // Checa se as páginas, subpáginas, role ou status mudaram
          const currentPages = (u.allowed_pages || []).slice().sort().join(',')
          const latestPages = (latest.allowed_pages || []).slice().sort().join(',')
          const currentSubpages = (u.allowed_subpages || []).slice().sort().join(',')
          const latestSubpages = (resolvedSubpages || []).slice().sort().join(',')

          if (currentPages !== latestPages || currentSubpages !== latestSubpages || u.role !== latest.role || u.active !== latest.active) {
            // Encontrar cargo real da planilha
            const colabInfo = findColaboradorMatch(latest.email, latest.name, latest.colaborador_id)
            const newProf: AppUserProfile = {
              id: latest.id,
              user_id: latest.user_id || u.user_id,
              colaborador_id: colabInfo?.id || latest.colaborador_id || u.colaborador_id,
              email: latest.email,
              name: latest.name,
              role: latest.role as UserRole,
              cargo: colabInfo?.cargo || latest.cargo || latest.role,
              allowed_pages: latest.allowed_pages || [],
              allowed_subpages: resolvedSubpages,
              active: latest.active,
              avatar_url: latest.avatar_url || extraProfile?.avatar_url || u.avatar_url,
              bio: latest.bio || extraProfile?.bio || u.bio,
              phone: latest.phone || extraProfile?.phone || u.phone
            }
            applyProfileUpdate(newProf)
          }
        }
      } catch {}
    }, 2000)

    // 6. Ouvinte de evento entre abas do mesmo navegador (storage event)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'magalog_admin_session') {
        if (!e.newValue) {
          setUser(null)
        } else {
          try {
            setUser(JSON.parse(e.newValue))
          } catch {}
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // 7. Supabase Realtime Presence - Rastreamento de Usuários Online e Horário de Login
  useEffect(() => {
    if (!user) {
      setOnlineUsers([])
      return
    }

    // Identificar ou registrar momento do login atual
    let loginTime = sessionStorage.getItem(`login_time_${user.email}`)
    if (!loginTime) {
      loginTime = new Date().toISOString()
      sessionStorage.setItem(`login_time_${user.email}`, loginTime)
    }

    const presenceChannel = supabase.channel('online_users_presence', {
      config: {
        presence: {
          key: user.email.toLowerCase()
        }
      }
    })

    const syncPresence = () => {
      const state = presenceChannel.presenceState()
      const list: OnlineUser[] = []

      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[]
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1]
          const colabInfo = (initialColaboradores as any[]).find(c => 
            (c.login && (latest.email || key).toLowerCase().includes(c.login.toLowerCase())) ||
            (c.contratado && latest.name && c.contratado.toLowerCase() === latest.name.toLowerCase())
          )
          list.push({
            id: latest.id || key,
            name: latest.name || key.split('@')[0],
            email: latest.email || key,
            role: latest.role || 'colaborador',
            cargo: latest.cargo || colabInfo?.cargo || latest.role || 'colaborador',
            avatar_url: latest.avatar_url || getStoredAvatar(latest.email || key) || undefined,
            logged_at: latest.logged_at || latest.online_at || new Date().toISOString(),
            online_at: latest.online_at || new Date().toISOString()
          })
        }
      })

      // Filtrar e-mails legados/descontinuados ou duplicados (ex: e-mail antigo magazineluiza de Osvaldo)
      const sanitized = list.filter(u => (u.email || '').toLowerCase() !== 'osvaldo.sobrinho@magazineluiza.com.br')

      // Ordenar por horário de login (mais recentes primeiro)
      sanitized.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      setOnlineUsers(sanitized)
    }

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        syncPresence()
      })
      .on('presence', { event: 'join' }, () => {
        syncPresence()
      })
      .on('presence', { event: 'leave' }, () => {
        syncPresence()
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: user.id,
            name: user.name,
            email: user.email.toLowerCase(),
            role: user.role,
            cargo: user.cargo || user.role,
            avatar_url: user.avatar_url || getStoredAvatar(user.email) || undefined,
            logged_at: loginTime,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [user?.email, user?.name, user?.role, user?.cargo, user?.id, user?.avatar_url])

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true)
      const cleanEmail = email.trim().toLowerCase()
      const cleanPass = password.trim()

      // 1. Verificação de Acesso Mestre / Primeiro Acesso
      const isMasterEmail = cleanEmail === 'johansson.gomes@magazineluiza.com.br' || cleanEmail === 'joh_gomes@magalog.com.br'
      if (isMasterEmail && (cleanPass === '12345' || cleanPass === '123456')) {
        // Tenta também cadastrar ou logar no Supabase silenciosamente
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: { data: { name: 'JOHANSSON MARTINS DE MENESES GOMES', role: 'admin' } }
          })
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          })
        } catch {
          // segue mesmo se offline
        }

        // Busca foto de perfil do banco se já existir cadastrada
        let remoteAvatar: string | undefined = getStoredAvatar(cleanEmail) || undefined
        try {
          const { data: avatarRow } = await supabase
            .from('performance_metrics')
            .select('value')
            .in('cell_key', [
              `_user_extra_profile_${cleanEmail}`,
              '_user_extra_profile_johansson.gomes@magazineluiza.com.br',
              '_user_extra_profile_joh_gomes@magalog.com.br'
            ])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (avatarRow?.value) {
            const p = JSON.parse(avatarRow.value)
            if (p?.avatar_url) {
              remoteAvatar = p.avatar_url
              setStoredAvatar(cleanEmail, remoteAvatar)
            }
          }
        } catch {}

        const adminMaster: AppUserProfile = {
          id: cleanEmail === 'joh_gomes@magalog.com.br' ? '169959' : 'admin-master',
          colaborador_id: '169959',
          email: cleanEmail,
          name: 'JOHANSSON MARTINS DE MENESES GOMES',
          cargo: 'COORDENADOR LOGISTICA',
          role: 'admin',
          allowed_pages: DEFAULT_ROLE_PAGES.admin,
          avatar_url: remoteAvatar,
          active: true
        }

        // Persiste registro mestre
        try {
          await supabase.from('app_users').upsert([adminMaster], { onConflict: 'email' })
        } catch {}

        localStorage.setItem('magalog_admin_session', JSON.stringify(adminMaster))
        setUser(adminMaster)
        return {}
      }

      // 2. Tentar autenticação no Supabase Auth
      let authUser = null
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      })

      if (data?.user) {
        authUser = data.user
      }

      // 3. Fallback inteligente: buscar na tabela app_users
      // (funciona mesmo se a confirmação de e-mail do Supabase Auth estiver ativada)
      const { data: dbUser, error: dbError } = await supabase
        .from('app_users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle()

      if (dbUser) {
        if (!dbUser.active) {
          setLoading(false)
          return { error: 'Este usuário está inativo no sistema. Procure o Administrador.' }
        }

        // Se autenticou no Auth OU a senha confere com a salva no cadastro
        const passwordMatches = dbUser.password_hash ? dbUser.password_hash === cleanPass : true
        if (authUser || passwordMatches) {
          // Buscar extraProfile para foto e subpáginas
          let extraProfile: any = null
          try {
            const profileStorageKey = `_user_extra_profile_${cleanEmail}`
            const { data: extraRow } = await supabase
              .from('performance_metrics')
              .select('value')
              .eq('cell_key', profileStorageKey)
              .maybeSingle()
            if (extraRow?.value) extraProfile = JSON.parse(extraRow.value)
          } catch {}

          const colabInfo = (initialColaboradores as any[]).find(c => 
            (c.login && cleanEmail.includes(c.login.toLowerCase())) ||
            (c.contratado && dbUser.name && c.contratado.toLowerCase() === dbUser.name.toLowerCase())
          )
          const resolvedCargo = colabInfo?.cargo || dbUser.cargo || (dbUser.role ? String(dbUser.role) : 'Colaborador')
          const resolvedRole = mapCargoToValidRole(dbUser.role || resolvedCargo)

          const resolvedAllowedSubpages = (Array.isArray(dbUser.allowed_subpages) && dbUser.allowed_subpages.length > 0)
            ? dbUser.allowed_subpages
            : (Array.isArray(extraProfile?.allowed_subpages))
              ? extraProfile.allowed_subpages
              : undefined

          const finalAvatar = dbUser.avatar_url || extraProfile?.avatar_url || getStoredAvatar(cleanEmail) || undefined

          const profile: AppUserProfile = {
            id: dbUser.id,
            user_id: dbUser.user_id || dbUser.id,
            colaborador_id: colabInfo?.id || dbUser.colaborador_id || dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            cargo: resolvedCargo,
            role: resolvedRole as UserRole,
            allowed_pages: dbUser.allowed_pages || getDefaultPagesForCargo(resolvedCargo),
            allowed_subpages: resolvedAllowedSubpages,
            avatar_url: finalAvatar,
            active: dbUser.active
          }

          localStorage.setItem('magalog_admin_session', JSON.stringify(profile))
          setUser(profile)
          return {}
        }
      }

      // 4. Fallback local: verificar no localStorage magalog_users_list ou initialUsers
      let localMatched: any = null
      const localUsersJson = localStorage.getItem('magalog_users_list')
      if (localUsersJson) {
        try {
          const localList: AppUserProfile[] = JSON.parse(localUsersJson)
          localMatched = localList.find(u => (u.email || '').toLowerCase() === cleanEmail)
        } catch {}
      }

      if (!localMatched) {
        localMatched = (initialUsers as any[]).find(u => (u.email || '').toLowerCase() === cleanEmail)
      }

      if (localMatched) {
        if (!localMatched.active) {
          setLoading(false)
          return { error: 'Este usuário está inativo no sistema. Procure o Administrador.' }
        }
        const passOk = localMatched.password_hash ? localMatched.password_hash === cleanPass : cleanPass === '123456'
        if (passOk) {
          const colabInfo = (initialColaboradores as any[]).find(c => 
            (c.login && cleanEmail.includes(c.login.toLowerCase())) ||
            (c.contratado && localMatched.name && c.contratado.toLowerCase() === localMatched.name.toLowerCase())
          )
          const resolvedCargo = localMatched.cargo || colabInfo?.cargo || 'Colaborador'
          const resolvedRole = mapCargoToValidRole(localMatched.role || resolvedCargo)

          const enrichedProfile: AppUserProfile = {
            ...localMatched,
            cargo: resolvedCargo,
            role: resolvedRole,
            colaborador_id: colabInfo?.id || localMatched.colaborador_id || localMatched.id,
            allowed_pages: localMatched.allowed_pages || getDefaultPagesForCargo(resolvedCargo),
            allowed_subpages: localMatched.allowed_subpages
          }

          localStorage.setItem('magalog_admin_session', JSON.stringify(enrichedProfile))
          setUser(enrichedProfile)
          return {}
        } else {
          setLoading(false)
          return { error: 'Senha incorreta para este usuário.' }
        }
      }

      if (authError && !dbUser) {
        setLoading(false)
        return { error: 'Credenciais inválidas. Verifique o e-mail e a senha informados.' }
      }

      if (dbUser && !authUser) {
        setLoading(false)
        return { error: 'Senha incorreta para este usuário.' }
      }

      if (authUser) {
        await loadProfile(authUser.id, authUser.email || email)
      }
      return {}
    } catch (err: any) {
      setLoading(false)
      return { error: err.message || 'Erro inesperado ao realizar login.' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    localStorage.removeItem('magalog_admin_session')
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
  }

  const hasPermission = (pageId: string, subpageId?: string): boolean => {
    if (!user) return false
    // Página de Perfil Pessoal sempre permitida para todo usuário logado
    if (pageId === 'profile') return true

    // Acesso irrestrito apenas para o Admin Master do sistema
    if (
      user.id === 'admin-master' ||
      user.email === 'johansson.gomes@magazineluiza.com.br' ||
      user.email === 'joh_gomes@magalog.com.br'
    ) return true

    // Verifica permissão da página principal
    let pageAllowed = false
    if (Array.isArray(user.allowed_pages)) {
      pageAllowed = user.allowed_pages.includes(pageId)
    } else if (user.role === 'admin') {
      pageAllowed = true
    }

    if (!pageAllowed) return false

    // Se uma subpágina específica for consultada, verifica permissão nela
    if (subpageId) {
      if (user.role === 'admin') return true
      if (Array.isArray(user.allowed_subpages)) {
        return user.allowed_subpages.includes(subpageId)
      }
      // Se ainda não tiver restrição explícita de subpáginas definida, herda o acesso da página principal
      return true
    }

    return true
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.user_id || user.id, user.email)
    }
  }

  const updateProfile = async (updates: Partial<AppUserProfile>) => {
    if (!user) return
    const merged: AppUserProfile = {
      ...user,
      ...updates
    }
    applyProfileUpdate(merged)

    // Sincroniza no Supabase app_users se possível
    try {
      const dbPayload: any = {
        updated_at: new Date().toISOString()
      }
      if (updates.name !== undefined) dbPayload.name = updates.name
      if (updates.bio !== undefined) dbPayload.bio = updates.bio
      if (updates.phone !== undefined) dbPayload.phone = updates.phone
      if (updates.avatar_url !== undefined) dbPayload.avatar_url = updates.avatar_url
      if (updates.password_hash !== undefined) dbPayload.password_hash = updates.password_hash

      await supabase
        .from('app_users')
        .update(dbPayload)
        .eq('email', user.email)
    } catch (err) {
      console.warn('Aviso ao sincronizar perfil no Supabase:', err)
    }

    // Sincroniza também no armazenamento em nuvem de perfis estendidos (performance_metrics)
    try {
      const profileStorageKey = `_user_extra_profile_${user.email.toLowerCase().trim()}`
      await supabase
        .from('performance_metrics')
        .upsert({
          cell_key: profileStorageKey,
          value: JSON.stringify({
            avatar_url: merged.avatar_url,
            bio: merged.bio,
            phone: merged.phone,
            allowed_subpages: merged.allowed_subpages
          }),
          updated_at: new Date().toISOString()
        }, { onConflict: 'cell_key' })
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, onlineUsers, login, logout, hasPermission, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
