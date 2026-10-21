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
  List
} from 'lucide-react'
import { useAuth } from '../lib/authContext'

export interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  category: string
  iconColor?: string
  isFavorite?: boolean
  createdAt: string
}

const STORAGE_KEY = 'magalog_cd994_useful_links'

// Links pré-configurados úteis do dia a dia da logística
const INITIAL_LINKS: QuickLink[] = [
  {
    id: 'link-1',
    title: 'Portal Magalog / Intranet',
    url: 'https://magalog.com.br',
    description: 'Portal de serviços corporativos, comunicações e ferramentas internas.',
    category: 'Sistemas Internos',
    iconColor: 'bg-blue-600',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-2',
    title: 'WMS Operacional',
    url: 'https://wms.magalog.com.br',
    description: 'Acesso ao sistema de gestão de armazém, separação, pulmão e endereçamento.',
    category: 'Operação & WMS',
    iconColor: 'bg-indigo-600',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-3',
    title: 'TMS & Rastreamento de Frotas',
    url: 'https://tms.magalog.com.br',
    description: 'Gestão de transportes, despacho de cargas e rastreamento de veículos.',
    category: 'Transporte & Docas',
    iconColor: 'bg-emerald-600',
    isFavorite: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-4',
    title: 'Planilhas Google / Drive Compartilhado',
    url: 'https://drive.google.com',
    description: 'Pastas compartilhadas com relatórios, escalas e planos de ação do CD 994.',
    category: 'Documentos & Gestão',
    iconColor: 'bg-amber-600',
    isFavorite: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-5',
    title: 'Portal de Chamados TI / Suporte',
    url: 'https://suporte.magalog.com.br',
    description: 'Abertura de chamados para coletores, impressoras térmicas e rede Wi-Fi.',
    category: 'Suporte & TI',
    iconColor: 'bg-purple-600',
    isFavorite: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'link-6',
    title: 'Receita Federal / Consulta NF-e',
    url: 'https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx',
    description: 'Consulta da autenticidade e status de Notas Fiscais Eletrônicas em trânsito.',
    category: 'Fiscal & Documentos',
    iconColor: 'bg-cyan-600',
    isFavorite: false,
    createdAt: new Date().toISOString()
  }
]

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

export const LinksPage: React.FC = () => {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'gerente'

  // Carrega links do localStorage ou valores iniciais
  const [links, setLinks] = useState<QuickLink[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (err) {
      console.warn('Erro ao carregar links do localStorage:', err)
    }
    return INITIAL_LINKS
  })

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

  // Salva no LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    } catch (err) {
      console.error('Erro ao salvar links:', err)
    }
  }, [links])

  // Lista dinâmica de categorias
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
    setFormColor(item.iconColor || 'bg-blue-600')
    setFormFavorite(!!item.isFavorite)
    setIsModalOpen(true)
  }

  // Salvar Link
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formUrl.trim()) return

    // Normalizar URL adicionando https:// se necessário
    let cleanUrl = formUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`
    }

    const finalCategory = formCategory === 'Outra' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : formCategory

    if (editingId) {
      // Edição
      setLinks(prev => prev.map(item => item.id === editingId ? {
        ...item,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        category: finalCategory,
        iconColor: formColor,
        isFavorite: formFavorite
      } : item))
    } else {
      // Novo
      const newLink: QuickLink = {
        id: `link-${Date.now()}`,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        category: finalCategory,
        iconColor: formColor,
        isFavorite: formFavorite,
        createdAt: new Date().toISOString()
      }
      setLinks(prev => [newLink, ...prev])
    }

    setIsModalOpen(false)
  }

  // Deletar Link
  const handleDeleteLink = (id: string) => {
    if (window.confirm('Tem certeza de que deseja remover este link?')) {
      setLinks(prev => prev.filter(l => l.id !== id))
    }
  }

  // Alternar Favorito
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLinks(prev => prev.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l))
  }

  // Copiar URL
  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtragem
  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'Todos' || link.category === selectedCategory
    const matchesFavorite = !onlyFavorites || link.isFavorite

    return matchesSearch && matchesCategory && matchesFavorite
  })

  // Contadores
  const totalFavorites = links.filter(l => l.isFavorite).length

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
            Central de Acessos Rápidos & Portais
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Links Úteis & Ferramentas Operacionais
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Acesso facilitado para sistemas internos (WMS, TMS), relatórios corporativos, planilhas compartilhadas e portais de suporte do CD 994.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Globe size={14} className="text-blue-400" />
              <span>Total de Links: <strong>{links.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span>Favoritos: <strong>{totalFavorites}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Layers size={14} className="text-emerald-400" />
              <span>Categorias: <strong>{categories.length - 1}</strong></span>
            </div>
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Alternância de Visualização: Cards (Grid) vs Lista */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                title="Visualização em Cards / Grid"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode('list')}
                title="Visualização em Lista Compacta"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List size={15} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star size={15} className={onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
              <span>Apenas Favoritos</span>
            </button>

            {canManage && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de Links */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
            <Globe size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Nenhum link encontrado</h3>
          <p className="text-xs text-slate-500 mb-4">
            {searchTerm || onlyFavorites || selectedCategory !== 'Todos'
              ? 'Tente ajustar os filtros de busca ou categoria.'
              : 'Comece adicionando novos links úteis para a equipe.'}
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus size={14} />
              Adicionar Primeiro Link
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* Visualização em Lista */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredLinks.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Lado Esquerdo: Ícone + Título + Categoria + URL + Descrição */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl ${item.iconColor || 'bg-blue-600'} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                    <Globe size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                        {item.url}
                      </span>
                      {item.description && (
                        <>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md">
                            {item.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações (Favoritar, Copiar, Editar, Excluir, Acessar) */}
                <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                  <button
                    onClick={(e) => handleToggleFavorite(item.id, e)}
                    title={item.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Star size={16} className={item.isFavorite ? 'fill-amber-400 text-amber-500' : ''} />
                  </button>

                  <button
                    onClick={(e) => handleCopyUrl(item.url, item.id, e)}
                    title="Copiar URL"
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                        title="Editar"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(item.id)}
                        title="Excluir"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all duration-150 shrink-0 shadow-xs cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>Acessar</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Visualização em Cards (Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            return (
              <div
                key={item.id}
                className="group relative bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                {/* Linha superior: Ícone, Título, Favorito e Ações */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${item.iconColor || 'bg-blue-600'} text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20`}>
                        <Globe size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {item.title}
                        </h3>
                        <span className="inline-block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Favoritar */}
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        title={item.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Star size={16} className={item.isFavorite ? 'fill-amber-400 text-amber-500' : ''} />
                      </button>

                      {/* Copiar URL */}
                      <button
                        onClick={(e) => handleCopyUrl(item.url, item.id, e)}
                        title="Copiar URL"
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>

                      {/* Editar / Excluir se tiver permissão */}
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(item.id)}
                            title="Excluir"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Rodapé do Card: URL truncada e Botão de Acesso */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[190px]">
                    {item.url.replace(/^https?:\/\//, '')}
                  </span>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all duration-150 shrink-0 shadow-xs cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>Acessar</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Bookmark size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-800">
                  {editingId ? 'Editar Link Útil' : 'Adicionar Novo Link Útil'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveLink} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título / Nome do Link *
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
