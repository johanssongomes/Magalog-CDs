import React, { useState, useEffect } from 'react'
import { 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Globe, 
  Bookmark, 
  FolderPlus, 
  X, 
  Check, 
  Copy, 
  CheckCircle2, 
  Layers, 
  Star, 
  ShieldCheck, 
  Monitor, 
  Truck, 
  FileSpreadsheet, 
  HelpCircle,
  Clock,
  ArrowUpRight,
  LayoutGrid,
  List,
  RefreshCw,
  Lock,
  Users
} from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { 
  fetchLinks, 
  saveLink, 
  deleteLink, 
  type QuickLink, 
  INITIAL_LINKS,
  STORAGE_KEY_LINKS
} from '../lib/linksService'

const CATEGORY_COLORS: Record<string, string> = {
  'Todos': 'bg-slate-800 text-white',
  'Sistemas Internos': 'bg-blue-600 text-white',
  'Operação & WMS': 'bg-indigo-600 text-white',
  'Transporte & Docas': 'bg-emerald-600 text-white',
  'Documentos & Gestão': 'bg-amber-600 text-white',
  'Suporte & TI': 'bg-purple-600 text-white',
  'Fiscal & Documentos': 'bg-cyan-600 text-white',
  'Outros': 'bg-slate-600 text-white'
}

const COLOR_OPTIONS = [
  { label: 'Azul', value: 'bg-blue-600', preview: 'bg-blue-600' },
  { label: 'Índigo', value: 'bg-indigo-600', preview: 'bg-indigo-600' },
  { label: 'Esmeralda', value: 'bg-emerald-600', preview: 'bg-emerald-600' },
  { label: 'Âmbar', value: 'bg-amber-600', preview: 'bg-amber-600' },
  { label: 'Roxo', value: 'bg-purple-600', preview: 'bg-purple-600' },
  { label: 'Ciano', value: 'bg-cyan-600', preview: 'bg-cyan-600' },
  { label: 'Rosa', value: 'bg-rose-600', preview: 'bg-rose-600' },
  { label: 'Cinza', value: 'bg-slate-700', preview: 'bg-slate-700' }
]

const ALL_ROLES = [
  { id: 'admin', label: 'Administrador' },
  { id: 'gerente', label: 'Gerente' },
  { id: 'coordenador', label: 'Coordenador' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'lider', label: 'Líder' },
  { id: 'bp', label: 'Business Partner (BP)' },
  { id: 'colaborador', label: 'Colaborador / Operacional' }
]

export const LinksPage: React.FC = () => {
  const { user } = useAuth()
  const isMasterOrAdmin = user?.id === 'admin-master' || 
    user?.email === 'johansson.gomes@magazineluiza.com.br' || 
    user?.email === 'joh_gomes@magalog.com.br' || 
    user?.role === 'admin'
  const canManage = isMasterOrAdmin || user?.role === 'gerente' || user?.role === 'coordenador'

  const [links, setLinks] = useState<QuickLink[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LINKS)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_LINKS
  })

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const savedMode = localStorage.getItem('magalog_links_view_mode')
      if (savedMode === 'list' || savedMode === 'grid') return savedMode
    } catch {}
    return 'grid'
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Carregar dados do Supabase
  const loadLinksFromDb = async () => {
    setLoading(true)
    try {
      const data = await fetchLinks()
      setLinks(data)
    } catch (err) {
      console.warn('Erro ao carregar links:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinksFromDb()
  }, [])

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    try {
      localStorage.setItem('magalog_links_view_mode', mode)
    } catch {}
  }

  // Estados do Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('Sistemas Internos')
  const [formCustomCategory, setFormCustomCategory] = useState('')
  const [formColor, setFormColor] = useState('bg-blue-600')
  const [formFavorite, setFormFavorite] = useState(false)
  const [formRoles, setFormRoles] = useState<string[]>(['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'])
  const [saving, setSaving] = useState(false)

  // Categorias únicas
  const categories = ['Todos', ...Array.from(new Set(links.map(l => l.category).filter(Boolean)))]

  // Abrir Modal para Novo Link
  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormTitle('')
    setFormUrl('')
    setFormDescription('')
    setFormCategory('Sistemas Internos')
    setFormCustomCategory('')
    setFormColor('bg-blue-600')
    setFormFavorite(false)
    setFormRoles(['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'])
    setIsModalOpen(true)
  }

  // Abrir Modal para Editar Link
  const handleOpenEditModal = (item: QuickLink) => {
    setEditingId(item.id)
    setFormTitle(item.title)
    setFormUrl(item.url)
    setFormDescription(item.description || '')
    setFormCategory(item.category)
    setFormCustomCategory('')
    setFormColor(item.iconColor || item.icon_color || 'bg-blue-600')
    setFormFavorite(!!(item.isFavorite ?? item.is_favorite))
    setFormRoles(
      item.targetRoles || item.target_roles || ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']
    )
    setIsModalOpen(true)
  }

  // Salvar Link no Supabase e Localmente
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formUrl.trim()) return

    let cleanUrl = formUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    }

    const finalCategory = formCategory === 'Outra' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : formCategory

    setSaving(true)
    try {
      const payload: Partial<QuickLink> = {
        id: editingId || undefined,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        category: finalCategory,
        iconColor: formColor,
        isFavorite: formFavorite,
        targetRoles: formRoles.length > 0 ? formRoles : ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
        createdBy: user?.name || user?.email
      }

      await saveLink(payload, links)
      await loadLinksFromDb()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Erro ao salvar link:', err)
    } finally {
      setSaving(false)
    }
  }

  // Deletar Link no Supabase
  const handleDeleteLink = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja remover este link para todos os usuários?')) {
      try {
        const updated = await deleteLink(id, links)
        setLinks(updated)
      } catch (err) {
        console.error('Erro ao deletar link:', err)
      }
    }
  }

  // Alternar Favorito
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = links.find(l => l.id === id)
    if (!target) return
    const updatedFavorite = !(target.isFavorite ?? target.is_favorite)
    try {
      await saveLink({ ...target, isFavorite: updatedFavorite }, links)
      setLinks(prev => prev.map(l => l.id === id ? { ...l, isFavorite: updatedFavorite, is_favorite: updatedFavorite } : l))
    } catch {}
  }

  // Copiar URL
  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Alternar seleção de cargo para permissão
  const handleToggleRole = (roleId: string) => {
    setFormRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    )
  }

  // Selecionar todos os cargos
  const handleSelectAllRoles = () => {
    if (formRoles.length === ALL_ROLES.length) {
      setFormRoles(['admin'])
    } else {
      setFormRoles(ALL_ROLES.map(r => r.id))
    }
  }

  // Filtragem considerando Permissões de Acesso por Cargo
  const userRole = user?.role || 'colaborador'

  const filteredLinks = links.filter(link => {
    // 1. Verificação de Permissão por Cargo
    if (!isMasterOrAdmin) {
      const allowedRoles = link.targetRoles || link.target_roles
      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(userRole)) {
          return false
        }
      }
    }

    // 2. Busca textual
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.category.toLowerCase().includes(searchTerm.toLowerCase())

    // 3. Categoria e Favoritos
    const matchesCategory = selectedCategory === 'Todos' || link.category === selectedCategory
    const isFav = link.isFavorite ?? link.is_favorite
    const matchesFavorite = !onlyFavorites || isFav

    return matchesSearch && matchesCategory && matchesFavorite
  })

  // Contadores
  const totalFavorites = links.filter(l => (l.isFavorite ?? l.is_favorite)).length

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header Banner com gradiente moderno */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Globe size={240} />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-cyan-300 border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Central de Acessos Rápidos & Portais • Sincronizado no Banco de Dados
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Links Úteis & Ferramentas Operacionais
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Acesso facilitado para sistemas internos (WMS, TMS), relatórios corporativos, planilhas compartilhadas e portais de suporte do CD 994 com controle de permissão por cargo.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Globe size={14} className="text-blue-400" />
              <span>Disponíveis para você: <strong>{filteredLinks.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span>Favoritos: <strong>{totalFavorites}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Layers size={14} className="text-emerald-400" />
              <span>Categorias: <strong>{categories.length - 1}</strong></span>
            </div>
            {canManage && (
              <div className="flex items-center gap-1.5 bg-purple-950/60 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <ShieldCheck size={14} className="text-purple-400" />
                <span>Modo de Gestão Ativo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Controles: Busca, Categorias e Botão de Novo Link */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, categoria, descrição ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Atualizar / Sincronizar Banco */}
            <button
              onClick={loadLinksFromDb}
              disabled={loading}
              title="Sincronizar com banco de dados"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>

            {/* Alternar Visualização Grid/Lista */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleToggleViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Cards"
              >
                <LayoutGrid size={16} />
                <span className="hidden md:inline">Cards</span>
              </button>
              <button
                onClick={() => handleToggleViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Lista"
              >
                <List size={16} />
                <span className="hidden md:inline">Lista</span>
              </button>
            </div>

            {/* Filtro de Favoritos */}
            <button
              onClick={() => setOnlyFavorites(prev => !prev)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                onlyFavorites
                  ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star size={15} className={onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
              <span>Apenas Favoritos</span>
            </button>

            {/* Botão Adicionar Link (Apenas Gestão / Admin) */}
            {canManage && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Adicionar Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Pílulas de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-xs scale-102' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid ou Lista de Links */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum link encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {searchTerm || selectedCategory !== 'Todos' || onlyFavorites
              ? 'Tente ajustar os filtros de busca ou a categoria selecionada.'
              : 'Nenhum link disponível para o seu nível de acesso no momento.'}
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Cadastrar Primeiro Link</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            const isFav = item.isFavorite ?? item.is_favorite
            const colorClass = item.iconColor || item.icon_color || 'bg-blue-600'
            const rolesCount = (item.targetRoles || item.target_roles || []).length

            return (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Topo do Card: Ícone, Categorias e Ações */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${colorClass} text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0`}>
                        <Globe size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Favoritar */}
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        title={isFav ? 'Remover dos favoritos' : 'Marcar como favorito'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFav ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'
                        }`}
                      >
                        <Star size={16} className={isFav ? 'fill-amber-400' : ''} />
                      </button>

                      {/* Copiar Link */}
                      <button
                        onClick={(e) => handleCopyUrl(item.url, item.id, e)}
                        title="Copiar URL"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>

                      {/* Gestão (Editar e Deletar) */}
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar Link"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(item.id)}
                            title="Excluir Link"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Rodapé do Card com Tags e Botão de Acesso */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                      {item.url.replace(/^https?:\/\//, '')}
                    </span>
                    {canManage && rolesCount < ALL_ROLES.length && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5" title={`Liberado para ${rolesCount} cargos`}>
                        <Lock size={9} />
                        Restrito
                      </span>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <span>Acessar</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Modo Lista Detalhada */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredLinks.map((item) => {
              const isFav = item.isFavorite ?? item.is_favorite
              const colorClass = item.iconColor || item.icon_color || 'bg-blue-600'

              return (
                <div 
                  key={item.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                      <Globe size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {item.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {item.url}
                        </span>
                        {item.description && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-sm hidden md:inline text-slate-500">
                              {item.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(item.id, e)}
                      title={isFav ? 'Remover dos favoritos' : 'Marcar como favorito'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isFav ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'
                      }`}
                    >
                      <Star size={16} className={isFav ? 'fill-amber-400' : ''} />
                    </button>

                    <button
                      onClick={(e) => handleCopyUrl(item.url, item.id, e)}
                      title="Copiar URL"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar Link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(item.id)}
                          title="Excluir Link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer ml-2"
                    >
                      <span>Acessar</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    {editingId ? 'Editar Link Operacional' : 'Novo Link de Acesso Rápido'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Disponibilize sistemas e ferramentas com controle de permissões.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário com Scroll se necessário */}
            <form onSubmit={handleSaveLink} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título do Sistema / Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Portal WMS CD 994"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Endereço URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: https://wms.magalog.com.br"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição / Objetivo (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sistema para conferência de picking, reposição de caixas e mapa de calor..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Sistemas Internos">Sistemas Internos</option>
                    <option value="Operação & WMS">Operação & WMS</option>
                    <option value="Transporte & Docas">Transporte & Docas</option>
                    <option value="Documentos & Gestão">Documentos & Gestão</option>
                    <option value="Suporte & TI">Suporte & TI</option>
                    <option value="Fiscal & Documentos">Fiscal & Documentos</option>
                    <option value="Outros">Outros</option>
                    <option value="Outra">+ Nova categoria personalizada</option>
                  </select>
                </div>

                {formCategory === 'Outra' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome da Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Treinamento"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Cor do Ícone
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormColor(c.value)}
                          className={`w-6 h-6 rounded-full ${c.preview} transition-transform cursor-pointer ${
                            formColor === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Controle de Permissões por Cargo */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Permissões de Acesso por Cargo
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllRoles}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {formRoles.length === ALL_ROLES.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  {ALL_ROLES.map((r) => {
                    const isChecked = formRoles.includes(r.id)
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(r.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span className="truncate">{r.label}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Apenas usuários com os cargos marcados verão este link em seus painéis.
                </p>
              </div>

              {/* Checkbox Favorito */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFavorite}
                    onChange={(e) => setFormFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Destacar como Favorito no topo</span>
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando no Banco...' : editingId ? 'Salvar Alterações' : 'Cadastrar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
