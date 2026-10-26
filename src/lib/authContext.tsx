import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import initialColaboradores from '../data/initialColaboradores.json'

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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  // Carregar sessão e perfil do Supabase
  const loadProfile = async (authUserId: string, authEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .or(`user_id.eq.${authUserId},email.eq.${authEmail}`)
        .maybeSingle()

      if (data && !error) {
        const colabInfo = (initialColaboradores as any[]).find(c => 
          (c.login && data.email.toLowerCase().includes(c.login.toLowerCase())) ||
          (c.contratado && data.name && c.contratado.toLowerCase() === data.name.toLowerCase())
        )
        const enriched: AppUserProfile = {
          ...data,
          colaborador_id: colabInfo?.id || data.colaborador_id || data.id,
          cargo: colabInfo?.cargo || data.cargo || data.role
        }
        setUser(enriched)
        return
      }

      // Se não existir registro no app_users, cria perfil inicial
      const isInitialAdmin = authEmail.includes('admin') || authEmail.includes('joh_gomes')
      const initialRole: UserRole = isInitialAdmin ? 'admin' : 'colaborador'
      const fallbackUser: AppUserProfile = {
        id: authUserId,
        user_id: authUserId,
        email: authEmail,
        name: authEmail.split('@')[0],
        role: initialRole,
        allowed_pages: DEFAULT_ROLE_PAGES[initialRole],
        active: true
      }

      // Salva no Supabase app_users se possível
      await supabase.from('app_users').insert([fallbackUser]).catch(() => {})
      setUser(fallbackUser)
    } catch (err) {
      console.warn('Erro ao carregar perfil:', err)
      // Fallback local seguro
      setUser({
        id: authUserId,
        email: authEmail,
        name: authEmail.split('@')[0],
        role: 'admin',
        allowed_pages: DEFAULT_ROLE_PAGES.admin,
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
      localStorage.setItem('magalog_admin_session', JSON.stringify(updatedProfile))
      setUser(updatedProfile)
    }
  }

  useEffect(() => {
    // 1. Restaurar sessão inicial do localStorage
    const localSession = localStorage.getItem('magalog_admin_session')
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession)
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
                active: row.active
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
              active: latest.active
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
          const profile: AppUserProfile = {
            id: dbUser.id,
            user_id: dbUser.user_id || dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as UserRole,
            allowed_pages: dbUser.allowed_pages || DEFAULT_ROLE_PAGES[dbUser.role as UserRole],
            active: dbUser.active
          }

          localStorage.setItem('magalog_admin_session', JSON.stringify(profile))
          setUser(profile)
          return {}
        }
      }

      // 4. Fallback local: verificar no localStorage magalog_users_list
      const localUsersJson = localStorage.getItem('magalog_users_list')
      if (localUsersJson) {
        try {
          const localList: AppUserProfile[] = JSON.parse(localUsersJson)
          const matched = localList.find(u => u.email.toLowerCase() === cleanEmail)
          if (matched) {
            if (!matched.active) {
              setLoading(false)
              return { error: 'Este usuário está inativo no sistema. Procure o Administrador.' }
            }
            const passOk = matched.password_hash ? matched.password_hash === cleanPass : cleanPass === '123456'
            if (passOk) {
              localStorage.setItem('magalog_admin_session', JSON.stringify(matched))
              setUser(matched)
              return {}
            } else {
              setLoading(false)
              return { error: 'Senha incorreta para este usuário.' }
            }
          }
        } catch {}
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

  return (
    <AuthContext.Provider value={{ user, loading, onlineUsers, login, logout, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
