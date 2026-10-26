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

export interface AppUserProfile {
  id: string
  user_id?: string
  colaborador_id?: string
  email: string
  name: string
  role: UserRole
  cargo?: string
  allowed_pages: string[]
  active: boolean
  password_hash?: string
  avatar_url?: string
  bio?: string
  phone?: string
  dados_colaborador?: ColaboradorData
}

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
  logged_at: string
  online_at: string
}

interface AuthContextType {
  user: AppUserProfile | null
  loading: boolean
  onlineUsers: OnlineUser[]
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasPermission: (pageId: string) => boolean
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
        const colabInfo = (initialColaboradores as any[]).find(c => 
          (c.login && data.email.toLowerCase().includes(c.login.toLowerCase())) ||
          (c.contratado && data.name && c.contratado.toLowerCase() === data.name.toLowerCase())
        )

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

        const enriched: AppUserProfile = {
          ...data,
          avatar_url: finalAvatar,
          bio: data.bio || extraProfile?.bio,
          phone: data.phone || extraProfile?.phone,
          colaborador_id: colabInfo?.id || data.colaborador_id || data.id,
          cargo: colabInfo?.cargo || data.cargo || data.role,
          role: data.role || (colabInfo?.cargo ? mapCargoToValidRole(colabInfo.cargo) : 'colaborador')
        }
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

      const colabInfo = (initialColaboradores as any[]).find(c => 
        (c.login && cleanEmail.includes(c.login.toLowerCase())) ||
        (c.contratado && knownUser?.name && c.contratado.toLowerCase() === knownUser.name.toLowerCase())
      )

      const isInitialAdmin = cleanEmail.includes('admin') || cleanEmail.includes('joh_gomes') || cleanEmail === 'johansson.gomes@magazineluiza.com.br'
      const determinedCargo = knownUser?.cargo || colabInfo?.cargo || (isInitialAdmin ? 'Administrador' : 'Colaborador')
      const determinedRole = knownUser?.role ? mapCargoToValidRole(knownUser.role) : (isInitialAdmin ? 'admin' : mapCargoToValidRole(determinedCargo))
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

    // 2. Verificar sessão atual no Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '')
      } else if (!localStorage.getItem('magalog_admin_session')) {
        setUser(null)
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
        (payload: any) => {
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

              const colabInfo = (initialColaboradores as any[]).find(c => 
                (c.login && row.email?.toLowerCase().includes(c.login.toLowerCase())) ||
                (c.contratado && row.name && c.contratado.toLowerCase() === row.name.toLowerCase())
              )
              const newProf: AppUserProfile = {
                id: row.id,
                user_id: row.user_id || currentObj.user_id,
                colaborador_id: colabInfo?.id || currentObj.colaborador_id,
                email: row.email,
                name: row.name,
                role: row.role as UserRole,
                cargo: colabInfo?.cargo || row.cargo || row.role,
                allowed_pages: row.allowed_pages || [],
                active: row.active,
                avatar_url: row.avatar_url || currentObj.avatar_url,
                bio: row.bio || currentObj.bio,
                phone: row.phone || currentObj.phone
              }
              applyProfileUpdate(newProf)
            }
          } catch {}
        }
      )
      .subscribe()

    // 5. Polling rápido e confiável (a cada 1.5s) para garantir reflexo instantâneo independente de Realtime
    const interval = setInterval(async () => {
      const currentStored = localStorage.getItem('magalog_admin_session')
      if (!currentStored) return
      try {
        const u = JSON.parse(currentStored)
        if (!u?.email || u.email === 'johansson.gomes@magazineluiza.com.br') return

        const { data: latest } = await supabase
          .from('app_users')
          .select('*')
          .ilike('email', u.email)
          .maybeSingle()

        if (latest) {
          // Se foi desativado pelo administrador
          if (latest.active === false) {
            applyProfileUpdate(null)
            return
          }

          // Checa se as páginas, role ou status mudaram
          const currentPages = (u.allowed_pages || []).slice().sort().join(',')
          const latestPages = (latest.allowed_pages || []).slice().sort().join(',')

          if (currentPages !== latestPages || u.role !== latest.role || u.active !== latest.active) {
            // Encontrar cargo real da planilha
            const colabInfo = (initialColaboradores as any[]).find(c => 
              (c.login && latest.email.toLowerCase().includes(c.login.toLowerCase())) ||
              (c.contratado && latest.name && c.contratado.toLowerCase() === latest.name.toLowerCase())
            )
            const newProf: AppUserProfile = {
              id: latest.id,
              user_id: latest.user_id || u.user_id,
              colaborador_id: colabInfo?.id || u.colaborador_id,
              email: latest.email,
              name: latest.name,
              role: latest.role as UserRole,
              cargo: colabInfo?.cargo || latest.cargo || latest.role,
              allowed_pages: latest.allowed_pages || [],
              active: latest.active,
              avatar_url: latest.avatar_url || u.avatar_url,
              bio: latest.bio || u.bio,
              phone: latest.phone || u.phone
            }
            applyProfileUpdate(newProf)
          }
        }
      } catch {}
    }, 1500)

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
            logged_at: latest.logged_at || latest.online_at || new Date().toISOString(),
            online_at: latest.online_at || new Date().toISOString()
          })
        }
      })

      // Ordenar por horário de login (mais recentes primeiro)
      list.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      setOnlineUsers(list)
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
            logged_at: loginTime,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [user?.email, user?.name, user?.role, user?.cargo, user?.id])

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true)
      const cleanEmail = email.trim().toLowerCase()
      const cleanPass = password.trim()

      // 1. Verificação de Acesso Mestre / Primeiro Acesso
      if (cleanEmail === 'johansson.gomes@magazineluiza.com.br' && cleanPass === '12345') {
        // Tenta também cadastrar ou logar no Supabase silenciosamente
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: { data: { name: 'Johansson Gomes', role: 'admin' } }
          })
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          })
        } catch {
          // segue mesmo se offline
        }

        const adminMaster: AppUserProfile = {
          id: 'admin-master',
          email: cleanEmail,
          name: 'Johansson Gomes',
          role: 'admin',
          allowed_pages: DEFAULT_ROLE_PAGES.admin,
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
          const colabInfo = (initialColaboradores as any[]).find(c => 
            (c.login && cleanEmail.includes(c.login.toLowerCase())) ||
            (c.contratado && dbUser.name && c.contratado.toLowerCase() === dbUser.name.toLowerCase())
          )
          const resolvedCargo = colabInfo?.cargo || dbUser.cargo || (dbUser.role ? String(dbUser.role) : 'Colaborador')
          const resolvedRole = mapCargoToValidRole(dbUser.role || resolvedCargo)

          const profile: AppUserProfile = {
            id: dbUser.id,
            user_id: dbUser.user_id || dbUser.id,
            colaborador_id: colabInfo?.id || dbUser.colaborador_id || dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            cargo: resolvedCargo,
            role: resolvedRole as UserRole,
            allowed_pages: dbUser.allowed_pages || getDefaultPagesForCargo(resolvedCargo),
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
            allowed_pages: localMatched.allowed_pages || getDefaultPagesForCargo(resolvedCargo)
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

  const hasPermission = (pageId: string): boolean => {
    if (!user) return false
    // Página de Perfil Pessoal sempre permitida para todo usuário logado
    if (pageId === 'profile') return true

    // Acesso irrestrito apenas para o Admin Master do sistema
    if (user.id === 'admin-master' || user.email === 'johansson.gomes@magazineluiza.com.br') return true
    
    // Se o usuário tem uma lista personalizada de páginas permitidas, respeita a lista
    if (Array.isArray(user.allowed_pages)) {
      return user.allowed_pages.includes(pageId)
    }

    if (user.role === 'admin') return true
    return false
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
            phone: merged.phone
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
