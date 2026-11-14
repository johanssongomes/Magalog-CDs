import { supabase } from './supabase'

export interface SupplyItem {
  id?: number
  codfil: number
  codigo_produto: string
  codproddf: string
  descricao: string
  
  // CD 994
  fisico_994: number
  tecnico_994: number
  resfis_994: number
  reslog_994: number
  logico_994: number
  transito_994: number
  estoque_994: number
  
  // Loja Destino
  filial: number
  fisico: number
  tecnico: number
  resfis: number
  reslog: number
  logico: number
  transito: number
  estoque_loja: number
  
  // Financeiro e Linha
  cmup: number
  valor_estoque_994: number
  status_estoque: string
  desclinha: string
}

export interface SupplyQueryParams {
  page?: number
  pageSize?: number
  filial?: number | string
  statusEstoque?: string
  desclinha?: string
  search?: string
}

export interface SupplyQueryResponse {
  data: SupplyItem[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Buscar dados paginados e filtrados de supply_lojas
export async function getSupplyLojasReport(params: SupplyQueryParams): Promise<SupplyQueryResponse> {
  const page = params.page || 1
  const pageSize = params.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('supply_lojas')
    .select('*', { count: 'exact' })

  if (params.filial && params.filial !== 'TODOS') {
    query = query.eq('filial', Number(params.filial))
  }

  if (params.statusEstoque && params.statusEstoque !== 'TODOS') {
    query = query.eq('status_estoque', params.statusEstoque)
  }

  if (params.desclinha && params.desclinha !== 'TODOS') {
    query = query.eq('desclinha', params.desclinha)
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim()
    query = query.or(`codigo_produto.ilike.%${term}%,descricao.ilike.%${term}%,codproddf.ilike.%${term}%`)
  }

  query = query.order('id', { ascending: true }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Erro ao buscar supply_lojas:', error)
    return { data: [], count: 0, page, pageSize, totalPages: 0 }
  }

  const totalCount = count || 0
  return {
    data: (data || []) as SupplyItem[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  }
}

// Obter valores distintos para filtros rápidos (Status, Linhas e Filiais)
export async function getSupplyFiltersMeta() {
  try {
    const { data: statusData } = await supabase
      .from('supply_lojas')
      .select('status_estoque')
      .limit(1000)

    const { data: filiaisData } = await supabase
      .from('supply_lojas')
      .select('filial')
      .limit(1000)

    const statusSet = new Set<string>()
    statusData?.forEach(s => { if (s.status_estoque) statusSet.add(s.status_estoque) })

    const filialSet = new Set<number>()
    filiaisData?.forEach(f => { if (f.filial) filialSet.add(f.filial) })

    return {
      statusList: Array.from(statusSet).sort(),
      filiaisList: Array.from(filialSet).sort((a, b) => a - b)
    }
  } catch (err) {
    console.error('Erro ao buscar metadados de filtros:', err)
    return { statusList: [], filiaisList: [] }
  }
}

