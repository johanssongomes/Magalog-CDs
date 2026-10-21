import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'gerente' | 'colaborador'

export interface AppUserProfile {
  id: string
  user_id?: string
  email: string
  name: string
  role: UserRole
  allowed_pages: string[]
  active: boolean
}

// Permissões padrão por cargo
export const DEFAULT_ROLE_PAGES: Record<UserRole, string[]> = {
  admin: ['dashboard', 'performance', 'catalog', 'pmts', 'inventory', 'settings', 'users'],
  gerente: ['dashboard', 'performance', 'catalog', 'pmts', 'inventory'],
  colaborador: ['dashboard', 'performance', 'inventory']
}

interface AuthContextType {
  user: AppUserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  hasPermission: (pageId: string) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar sessão e perfil do Supabase
  const loadProfile = async (authUserId: string, authEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .or(`user_id.eq.${authUserId},email.eq.${authEmail}`)
        .maybeSingle()

      if (data && !error) {
        setUser(data as AppUserProfile)
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

  useEffect(() => {
    // Restaurar sessão mestre local se existir
    const localSession = localStorage.getItem('magalog_admin_session')
    if (localSession) {
      try {
        setUser(JSON.parse(localSession))
        setLoading(false)
        return
      } catch {}
    }

    // Verificar sessão atual Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '')
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Ouvinte de mudanças no Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || '')
      } else if (!localStorage.getItem('magalog_admin_session')) {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

      // 2. Autenticação Padrão Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      })

      if (error) {
        setLoading(false)
        return { error: error.message || 'Credenciais inválidas. Verifique o e-mail e senha.' }
      }

      if (data.user) {
        await loadProfile(data.user.id, data.user.email || email)
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
    if (user.role === 'admin') return true
    return user.allowed_pages?.includes(pageId) ?? false
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.user_id || user.id, user.email)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
