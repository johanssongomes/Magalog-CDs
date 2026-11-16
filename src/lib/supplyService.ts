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
    const terms = params.search
      .split(/[,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean)

    if (terms.length > 0) {
      const orConditions = terms.map(term =>
        `codigo_produto.ilike.%${term}%,descricao.ilike.%${term}%,codproddf.ilike.%${term}%`
      ).join(',')
      query = query.or(orConditions)
    }
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

    const statusSet = new Set<string>()
    statusData?.forEach(s => { if (s.status_estoque) statusSet.add(s.status_estoque) })

    // Lista fixa completa das 45 filiais atendidas pelo CD 994
    const ALL_FILIAIS = [
      662, 710, 727, 734, 736, 740, 742, 743, 745, 746, 751, 752, 755, 757, 761,
      765, 778, 785, 802, 809, 820, 835, 840, 842, 846, 847, 857, 871, 872, 873,
      984, 1206, 1207, 1217, 1223, 1236, 1341, 1344, 1345, 1347, 1349, 1363, 1376,
      1386, 1411
    ]

    return {
      statusList: Array.from(statusSet).sort(),
      filiaisList: ALL_FILIAIS
    }
  } catch (err) {
    console.error('Erro ao buscar metadados de filtros:', err)
    return {
      statusList: [],
      filiaisList: [
        662, 710, 727, 734, 736, 740, 742, 743, 745, 746, 751, 752, 755, 757, 761,
        765, 778, 785, 802, 809, 820, 835, 840, 842, 846, 847, 857, 871, 872, 873,
        984, 1206, 1207, 1217, 1223, 1236, 1341, 1344, 1345, 1347, 1349, 1363, 1376,
        1386, 1411
      ]
    }
  }
}

