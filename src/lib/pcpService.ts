import { supabase } from './supabase'

export interface PcpItem {
  id?: number
  filorig?: number
  codfil?: number
  filentrega?: number
  numlote?: string
  fllibfat?: string
  tpnota?: number
  numpedven?: string
  numpedcomp?: string
  dtpedido?: string
  dtentrega?: string
  dtlibfat?: string
  preventrega?: string
  item: string
  ibm?: string
  descricao: string
  ref?: string
  fantasia?: string
  qtcomp?: number
  fisico?: number
  resfis?: number
  logico?: number
  reslog?: number
  tecnico?: number
  futuro?: number
  transito?: number
  status?: string
  situacao?: string
  linha?: string
  linha_ajustada?: string
  nucleo?: string
  familia?: string
  codrota?: string
  descricaorota?: string
  codmodal?: string
  descricaomodal?: string
  status_operacao?: string
  operacao?: string
  dtalter?: string
  cub_tot?: number
  pesoliq?: number
  precounit?: number
  vltotal?: number
  qtped?: number
  flag_estorno_caixa?: string
  n?: string
  turnoagendado?: string
  dtentregaagendada?: string
  cod_vendedor?: string
  prazo_entrega?: string
  data_entrega_prevista?: string
  cep_entrega?: string
  dt_hr_libfat?: string
  faixa_dias_reduzida?: string
  modalidade_calc?: string // Coluna auxiliar dinâmica baseada no CODMODAL
  tipo_modal_calc?: string // Coluna auxiliar dinâmica baseada na MODALIDADE (Venda, Abastecimento, Tranfs)
  destino_calc?: string    // Coluna auxiliar dinâmica baseada em Filial/Rotas
  regiao_calc?: string     // Coluna auxiliar dinâmica baseada em Filial/Rotas
  created_at?: string
}

export interface PcpQueryParams {
  page?: number
  pageSize?: number
  statusOperacao?: string
  filentrega?: string
  linha?: string
  search?: string
}

export interface PcpQueryResponse {
  data: PcpItem[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Buscar dados paginados de PCP do Supabase
export async function getPcpItemsReport(params: PcpQueryParams): Promise<PcpQueryResponse> {
  const page = params.page || 1
  const pageSize = params.pageSize || 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('pcp_js_martins')
    .select('*', { count: 'exact' })

  if (params.filentrega && params.filentrega !== 'TODOS') {
    query = query.eq('filentrega', Number(params.filentrega))
  }

  if (params.statusOperacao && params.statusOperacao !== 'TODOS') {
    query = query.eq('status_operacao', params.statusOperacao)
  }

  if (params.linha && params.linha !== 'TODOS') {
    query = query.eq('linha', params.linha)
  }

  if (params.search && params.search.trim()) {
    const terms = params.search
      .split(/[,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean)

    if (terms.length > 0) {
      const orConditions = terms.map(term =>
        `item.ilike.%${term}%,descricao.ilike.%${term}%,ibm.ilike.%${term}%,numpedven.ilike.%${term}%,fantasia.ilike.%${term}%`
      ).join(',')
      query = query.or(orConditions)
    }
  }

  query = query.order('id', { ascending: true }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.warn('Tabela pcp_js_martins ainda não criada no Supabase ou inacessível. Usando fallback:', error.message)
    return { data: [], count: 0, page, pageSize, totalPages: 0 }
  }

  const totalCount = count || 0
  return {
    data: (data || []) as PcpItem[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  }
}

// Obter agregação de todos os itens do Supabase para o Planejamento (com cache em memória e carregamento paralelo)
let cachedPlanningData: PcpItem[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos de cache em memória

export function clearPcpPlanningCache() {
  cachedPlanningData = null
  cacheTimestamp = 0
}

export async function getAllPcpSummaryItems(forceRefresh: boolean = false): Promise<PcpItem[]> {
  const now = Date.now()
  if (!forceRefresh && cachedPlanningData && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedPlanningData
  }

  try {
    const batchSize = 1000

    // 1. Obter total de registros para disparar requisições em paralelo
    const { count, error: countErr } = await supabase
      .from('pcp_js_martins')
      .select('*', { count: 'exact', head: true })

    if (countErr) {
      console.warn('Erro ao verificar total de registros no Supabase:', countErr.message)
      return cachedPlanningData || []
    }

    const total = count || 0
    if (total === 0) return []

    const numBatches = Math.ceil(total / batchSize)
    const promises = []

    for (let b = 0; b < numBatches; b++) {
      const from = b * batchSize
      promises.push(
        supabase
          .from('pcp_js_martins')
          .select('filentrega,codmodal,descricaomodal,descricaorota,status_operacao,linha,numpedven,numlote,item,descricao,qtcomp,fisico,qtped,cub_tot,vltotal,pesoliq')
          .range(from, from + batchSize - 1)
          .then(res => {
            if (res.error) {
              console.warn(`Erro no lote ${b}:`, res.error.message)
              return []
            }
            return (res.data || []) as PcpItem[]
          })
      )
    }

    const results = await Promise.all(promises)
    const allData = results.flat()

    if (allData.length > 0) {
      cachedPlanningData = allData
      cacheTimestamp = Date.now()
    }

    return allData
  } catch (err) {
    console.error('Falha em getAllPcpSummaryItems:', err)
    return cachedPlanningData || []
  }
}

// Obter filtros únicos de PCP
export async function getPcpFiltersMeta() {
  try {
    const { data: statusData } = await supabase
      .from('pcp_js_martins')
      .select('status_operacao')
      .limit(2000)

    const statusSet = new Set<string>()
    statusData?.forEach(s => { if (s.status_operacao) statusSet.add(s.status_operacao) })

    return {
      statusList: Array.from(statusSet).sort()
    }
  } catch {
    return { statusList: ['EM PROCESSO', 'EM CARTEIRA'] }
  }
}
