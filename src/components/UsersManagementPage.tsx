import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, DEFAULT_ROLE_PAGES, type AppUserProfile, type UserRole } from '../lib/authContext'
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  LayoutDashboard,
  Zap,
  FolderKanban,
  BarChart3,
  Clock,
  Settings
} from 'lucide-react'

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { id: 'performance', label: 'Performance', icon: <Zap size={14} /> },
  { id: 'catalog', label: 'Equipamentos', icon: <FolderKanban size={14} /> },
  { id: 'pmts', label: 'Gestão 360°', icon: <BarChart3 size={14} /> },
  { id: 'inventory', label: 'Banco de Horas', icon: <Clock size={14} /> },
  { id: 'settings', label: 'Central Operacional', icon: <Settings size={14} /> },
  { id: 'users', label: 'Gestão de Usuários', icon: <Users size={14} /> }
]

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modal para Criar / Editar Usuário
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('colaborador')
  const [formAllowedPages, setFormAllowedPages] = useState<string[]>([])
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err)
      setMessage({ text: 'Não foi possível carregar a lista de usuários.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('colaborador')
    setFormAllowedPages(DEFAULT_ROLE_PAGES.colaborador)
    setFormActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (u: AppUserProfile) => {
    setEditingUser(u)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword('')
    setFormRole(u.role)
    setFormAllowedPages(u.allowed_pages || DEFAULT_ROLE_PAGES[u.role])
    setFormActive(u.active)
    setIsModalOpen(true)
  }

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole)
    setFormAllowedPages(DEFAULT_ROLE_PAGES[newRole])
  }

  const togglePagePermission = (pageId: string) => {
    if (formAllowedPages.includes(pageId)) {
      setFormAllowedPages(formAllowedPages.filter(id => id !== pageId))
    } else {
      setFormAllowedPages([...formAllowedPages, pageId])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      if (editingUser) {
        // Atualiza perfil no Supabase
        const updatePayload: any = {
          name: formName,
          role: formRole,
          allowed_pages: formAllowedPages,
          active: formActive,
          updated_at: new Date().toISOString()
        }
        if (formPassword) {
          updatePayload.password_hash = formPassword
        }

        let { error } = await supabase
          .from('app_users')
          .update(updatePayload)
          .eq('id', editingUser.id)

        // Se o banco ainda não tiver a coluna password_hash adicionada, salva sem ela
        if (error && error.message?.includes('password_hash')) {
          delete updatePayload.password_hash
          const retry = await supabase
            .from('app_users')
            .update(updatePayload)
            .eq('id', editingUser.id)
          error = retry.error
        }

        if (error) throw error

        setMessage({ text: 'Usuário atualizado com sucesso!', type: 'success' })
      } else {
        // Criação de Usuário
        // 1. Tenta criar usuário no Supabase Auth se houver senha informada
        let authUserId = null
        if (formPassword) {
          try {
            const { data: authData } = await supabase.auth.signUp({
              email: formEmail.trim(),
              password: formPassword.trim(),
              options: {
                data: {
                  name: formName,
                  role: formRole
                }
              }
            })
            if (authData?.user) {
              authUserId = authData.user.id
            }
          } catch (e) {
            console.warn('Supabase Auth signUp aviso:', e)
          }
        }

        // 2. Salva registro na tabela app_users (incluindo password_hash)
        const { error: insertErr } = await supabase
          .from('app_users')
          .insert([{
            user_id: authUserId,
            email: formEmail.trim().toLowerCase(),
            password_hash: formPassword.trim(),
            name: formName.trim(),
            role: formRole,
            allowed_pages: formAllowedPages,
            active: formActive
          }])

        if (insertErr) throw insertErr

        setMessage({ text: 'Novo usuário cadastrado com sucesso!', type: 'success' })
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err)
      setMessage({ text: err.message || 'Erro ao processar dados do usuário.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: AppUserProfile) => {
    if (!confirm(`Deseja realmente remover o usuário "${u.name}" (${u.email})?`)) return

    try {
      const { error } = await supabase.from('app_users').delete().eq('id', u.id)
      if (error) throw error
      setMessage({ text: 'Usuário removido com sucesso.', type: 'success' })
      fetchUsers()
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao remover usuário.', type: 'error' })
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Controle de Usuários & Permissões</h1>
          </div>
          <p className="text-xs text-slate-500">
            Gerencie o acesso de Administradores, Gerentes e Colaboradores às telas do sistema CD 994.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Barra de Filtro */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou cargo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total: <strong className="text-slate-700">{filteredUsers.length}</strong> usuários
          </span>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Nível de Acesso</th>
                <th className="px-4 py-3">Páginas Autorizadas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nenhum usuário cadastrado ou localizado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-semibold">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : u.role === 'gerente'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                              Acesso Total (Todas as Telas)
                            </span>
                          ) : (
                            u.allowed_pages?.map(pId => {
                              const page = AVAILABLE_PAGES.find(p => p.id === pId)
                              return (
                                <span key={pId} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                  {page?.label || pId}
                                </span>
                              )
                            })
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            title="Editar Usuário & Permissões"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(u)}
                              title="Remover Usuário"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingUser ? 'Editar Usuário e Permissões' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@magalog.com.br"
                  required
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '•••••••• (opcional)' : 'Mínimo 6 caracteres'}
                  required={!editingUser}
                  minLength={formPassword ? 6 : undefined}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Nível / Cargo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nível de Permissão (Cargo)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'gerente', 'colaborador'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        formRole === r
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="text-xs uppercase">{r}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Telas com Permissão Individual */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Páginas com Acesso Autorizado
                  </label>
                  {formRole === 'admin' && (
                    <span className="text-[10px] text-purple-600 font-bold">Admin possui todas</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded-2xl p-3 bg-slate-50/50 max-h-44 overflow-y-auto">
                  {AVAILABLE_PAGES.map((page) => {
                    const isChecked = formRole === 'admin' || formAllowedPages.includes(page.id)
                    return (
                      <label
                        key={page.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={formRole === 'admin'}
                          onChange={() => togglePagePermission(page.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex items-center gap-1.5 truncate">
                          {page.icon}
                          <span className="truncate">{page.label}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700">Usuário Ativo no Sistema</span>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    formActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
