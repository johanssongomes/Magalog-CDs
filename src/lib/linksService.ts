import { supabase } from './supabase'

export interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  category: string
  iconColor?: string
  icon_color?: string
  isFavorite?: boolean
  is_favorite?: boolean
  targetRoles?: string[]
  target_roles?: string[]
  createdBy?: string
  created_by?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export const STORAGE_KEY_LINKS = 'magalog_cd994_useful_links'

export const INITIAL_LINKS: QuickLink[] = [
  {
    id: 'link-1',
    title: 'Portal Magalog / Intranet',
    url: 'https://magalog.com.br',
    description: 'Portal de serviços corporativos, comunicações e ferramentas internas.',
    category: 'Sistemas Internos',
    iconColor: 'bg-blue-600',
    isFavorite: true,
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
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
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
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
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
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
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
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
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
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
    targetRoles: ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
    createdAt: new Date().toISOString()
  }
]

// Normalizar formato do banco (snake_case) para formato do app (camelCase)
const normalizeLink = (item: any): QuickLink => ({
  id: String(item.id),
  title: item.title || '',
  url: item.url || '',
  description: item.description || '',
  category: item.category || 'Sistemas Internos',
  iconColor: item.icon_color || item.iconColor || 'bg-blue-600',
  isFavorite: item.is_favorite !== undefined ? item.is_favorite : (item.isFavorite || false),
  targetRoles: item.target_roles || item.targetRoles || ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
  createdBy: item.created_by || item.createdBy,
  createdAt: item.created_at || item.createdAt || new Date().toISOString()
})

// Buscar links (do Supabase ou Fallback para performance_metrics / LocalStorage)
export const fetchLinks = async (): Promise<QuickLink[]> => {
  try {
    // 1. Tenta buscar direto na tabela useful_links
    const { data, error } = await supabase
      .from('useful_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const normalized = data.map(normalizeLink)
      try {
        localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(normalized))
      } catch {}
      return normalized
    }

    // 2. Fallback na tabela performance_metrics (para sincronização sem quebrar caso a tabela useful_links ainda não foi rodada no SQL)
    const { data: metricData } = await supabase
      .from('performance_metrics')
      .select('value')
      .eq('cell_key', '_shared_useful_links_db')
      .maybeSingle()

    if (metricData?.value) {
      const parsed = JSON.parse(metricData.value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map(normalizeLink)
        try {
          localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(normalized))
        } catch {}
        return normalized
      }
    }

    // 3. Fallback no LocalStorage
    const local = localStorage.getItem(STORAGE_KEY_LINKS)
    if (local) {
      const parsed = JSON.parse(local)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeLink)
      }
    }

    return INITIAL_LINKS
  } catch (err) {
    console.warn('Aviso ao carregar links do banco:', err)
    const local = localStorage.getItem(STORAGE_KEY_LINKS)
    return local ? JSON.parse(local) : INITIAL_LINKS
  }
}

// Salvar / Upsert de link (com sincronização em tempo real nas duas tabelas)
export const saveLink = async (link: Partial<QuickLink>, allLinks: QuickLink[]): Promise<QuickLink> => {
  const isNew = !link.id
  const now = new Date().toISOString()
  const cleanId = link.id || `link-${Date.now()}`

  const normalized: QuickLink = {
    id: cleanId,
    title: link.title || '',
    url: link.url || '',
    description: link.description || '',
    category: link.category || 'Sistemas Internos',
    iconColor: link.iconColor || 'bg-blue-600',
    isFavorite: link.isFavorite || false,
    targetRoles: link.targetRoles && link.targetRoles.length > 0 
      ? link.targetRoles 
      : ['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
    createdBy: link.createdBy,
    createdAt: link.createdAt || now,
    updatedAt: now
  }

  // Atualizar lista local
  const updatedList = isNew
    ? [normalized, ...allLinks]
    : allLinks.map(l => l.id === cleanId ? normalized : l)

  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(updatedList))
  } catch {}

  // Sincronizar na tabela useful_links
  try {
    const payload = {
      id: normalized.id,
      title: normalized.title,
      url: normalized.url,
      description: normalized.description,
      category: normalized.category,
      icon_color: normalized.iconColor,
      is_favorite: normalized.isFavorite,
      target_roles: normalized.targetRoles,
      created_by: normalized.createdBy,
      created_at: normalized.createdAt,
      updated_at: normalized.updatedAt
    }
    await supabase.from('useful_links').upsert(payload, { onConflict: 'id' })
  } catch (err) {
    console.warn('useful_links upsert falhou:', err)
  }

  // Backup garantido em performance_metrics
  try {
    await supabase.from('performance_metrics').upsert({
      cell_key: '_shared_useful_links_db',
      value: JSON.stringify(updatedList),
      updated_at: now
    }, { onConflict: 'cell_key' })
  } catch {}

  return normalized
}

// Deletar link
export const deleteLink = async (id: string, allLinks: QuickLink[]): Promise<QuickLink[]> => {
  const updatedList = allLinks.filter(l => l.id !== id)
  const now = new Date().toISOString()

  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(updatedList))
  } catch {}

  // Deletar da tabela useful_links
  try {
    await supabase.from('useful_links').delete().eq('id', id)
  } catch {}

  // Atualizar backup em performance_metrics
  try {
    await supabase.from('performance_metrics').upsert({
      cell_key: '_shared_useful_links_db',
      value: JSON.stringify(updatedList),
      updated_at: now
    }, { onConflict: 'cell_key' })
  } catch {}

  return updatedList
}
