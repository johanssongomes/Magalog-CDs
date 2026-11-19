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

// ---------------------------------------------------------------------------
// CAMADA DE PERSISTÊNCIA INDEXEDDB PARA PCP (CARREGAMENTO INSTANTÂNEO 0MS)
// ---------------------------------------------------------------------------
const PCP_DB_NAME = 'MagalogPcpCacheDB'
const PCP_DB_VERSION = 1
const PCP_STORE_NAME = 'pcp_planning_store'
const KEY_PLANNING_DATA = 'cached_planning_items'
const KEY_TIMESTAMP = 'cached_timestamp'

function openPcpDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null)
    }
    try {
      const req = window.indexedDB.open(PCP_DB_NAME, PCP_DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(PCP_STORE_NAME)) {
          db.createObjectStore(PCP_STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function getPcpPlanningCache(): Promise<{ data: PcpItem[]; timestamp: number } | null> {
  const db = await openPcpDB()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(PCP_STORE_NAME, 'readonly')
      const store = tx.objectStore(PCP_STORE_NAME)
      const dataReq = store.get(KEY_PLANNING_DATA)
      const timeReq = store.get(KEY_TIMESTAMP)

      tx.oncomplete = () => {
        if (dataReq.result && Array.isArray(dataReq.result) && dataReq.result.length > 0) {
          resolve({
            data: dataReq.result as PcpItem[],
            timestamp: Number(timeReq.result) || 0
          })
        } else {
          resolve(null)
        }
      }
      tx.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function setPcpPlanningCache(items: PcpItem[]): Promise<void> {
  cachedPlanningData = items
  cacheTimestamp = Date.now()

  const db = await openPcpDB()
  if (!db) return

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(PCP_STORE_NAME, 'readwrite')
      const store = tx.objectStore(PCP_STORE_NAME)
      store.put(items, KEY_PLANNING_DATA)
      store.put(Date.now(), KEY_TIMESTAMP)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

// Obter agregação de todos os itens do Supabase para o Planejamento (com cache em memória + IndexedDB)
let cachedPlanningData: PcpItem[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos de validade antes de revalidar em segundo plano

let isFetchingFromSupabase = false
let activeFetchPromise: Promise<PcpItem[]> | null = null

export async function clearPcpPlanningCache() {
  cachedPlanningData = null
  cacheTimestamp = 0
  const db = await openPcpDB()
  if (!db) return

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(PCP_STORE_NAME, 'readwrite')
      const store = tx.objectStore(PCP_STORE_NAME)
      store.clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function fetchSummaryFromSupabase(): Promise<PcpItem[]> {
  const batchSize = 1000

  // 1. Obter total de registros para disparar requisições em paralelo
  const { count, error: countErr } = await supabase
    .from('pcp_js_martins')
    .select('*', { count: 'exact', head: true })

  if (countErr) {
    console.warn('Erro ao verificar total de registros no Supabase:', countErr.message)
    return []
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
        .select('filentrega,fllibfat,codmodal,descricaomodal,descricaorota,status_operacao,linha,numpedven,numlote,item,descricao,qtcomp,fisico,qtped,cub_tot,vltotal,pesoliq,precounit')
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
    await setPcpPlanningCache(allData)
  }

  return allData
}

export async function getAllPcpSummaryItems(
  forceRefresh: boolean = false,
  onBackgroundUpdate?: (data: PcpItem[]) => void
): Promise<PcpItem[]> {
  const now = Date.now()

  // 1. Memória imediata (< 1ms)
  if (!forceRefresh && cachedPlanningData && cachedPlanningData.length > 0) {
    if (now - cacheTimestamp >= CACHE_TTL_MS && !isFetchingFromSupabase) {
      isFetchingFromSupabase = true
      fetchSummaryFromSupabase()
        .then(fresh => {
          if (fresh.length > 0 && onBackgroundUpdate) {
            onBackgroundUpdate(fresh)
          }
        })
        .finally(() => {
          isFetchingFromSupabase = false
        })
    }
    return cachedPlanningData
  }

  // 2. IndexedDB persistente no navegador (< 25ms - sobrevive a F5 / reload de página)
  if (!forceRefresh) {
    const cached = await getPcpPlanningCache()
    if (cached && cached.data && cached.data.length > 0) {
      cachedPlanningData = cached.data
      cacheTimestamp = cached.timestamp || Date.now()

      // Revalidação em segundo plano se tiver mais de 5 minutos
      if (now - cacheTimestamp >= CACHE_TTL_MS && !isFetchingFromSupabase) {
        isFetchingFromSupabase = true
        fetchSummaryFromSupabase()
          .then(fresh => {
            if (fresh.length > 0 && onBackgroundUpdate) {
              onBackgroundUpdate(fresh)
            }
          })
          .finally(() => {
            isFetchingFromSupabase = false
          })
      }

      return cached.data
    }
  }

  // 3. Primeira execução ou forceRefresh: busca do Supabase
  if (activeFetchPromise) {
    return activeFetchPromise
  }

  isFetchingFromSupabase = true
  activeFetchPromise = fetchSummaryFromSupabase()
    .catch(err => {
      console.error('Falha em getAllPcpSummaryItems:', err)
      return cachedPlanningData || []
    })
    .finally(() => {
      isFetchingFromSupabase = false
      activeFetchPromise = null
    })

  return activeFetchPromise
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
