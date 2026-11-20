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
const PCP_DB_VERSION = 5
const PCP_STORE_NAME = 'pcp_planning_store'
const KEY_PLANNING_DATA = 'cached_planning_items_v6'
const KEY_TIMESTAMP = 'cached_timestamp_v6'
const KEY_SYNC_VERSION = 'cached_sync_version_v6'

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

export async function getPcpPlanningCache(): Promise<{ data: PcpItem[]; timestamp: number; syncVersion?: string } | null> {
  const db = await openPcpDB()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(PCP_STORE_NAME, 'readonly')
      const store = tx.objectStore(PCP_STORE_NAME)
      const dataReq = store.get(KEY_PLANNING_DATA)
      const timeReq = store.get(KEY_TIMESTAMP)
      const syncVerReq = store.get(KEY_SYNC_VERSION)

      tx.oncomplete = () => {
        if (dataReq.result && Array.isArray(dataReq.result) && dataReq.result.length > 0) {
          resolve({
            data: dataReq.result as PcpItem[],
            timestamp: Number(timeReq.result) || 0,
            syncVersion: syncVerReq.result ? String(syncVerReq.result) : undefined
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

export async function setPcpPlanningCache(items: PcpItem[], syncVersion?: string): Promise<void> {
  cachedPlanningData = items
  cacheTimestamp = Date.now()
  if (syncVersion) {
    cachedSyncVersion = syncVersion
  }

  const db = await openPcpDB()
  if (!db) return

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(PCP_STORE_NAME, 'readwrite')
      const store = tx.objectStore(PCP_STORE_NAME)
      store.put(items, KEY_PLANNING_DATA)
      store.put(Date.now(), KEY_TIMESTAMP)
      if (syncVersion) {
        store.put(syncVersion, KEY_SYNC_VERSION)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

// Obter agregação de todos os itens do Supabase para o Planejamento (com cache em memória + IndexedDB)
let cachedPlanningData: PcpItem[] | null = null
let cachedSyncVersion: string | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minuto de validade para checagem em segundo plano

let isFetchingFromSupabase = false
let activeFetchPromise: Promise<PcpItem[]> | null = null

export async function clearPcpPlanningCache() {
  cachedPlanningData = null
  cachedSyncVersion = null
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

// Limpeza profunda de caches em todos os níveis (IndexedDB + localStorage + memória)
export async function forceClearAllPcpCaches(): Promise<void> {
  cachedPlanningData = null
  cachedSyncVersion = null
  cacheTimestamp = 0
  try {
    localStorage.removeItem('magalog_pcp_js_martins_data')
  } catch { }
  await clearPcpPlanningCache()
}

async function fetchSummaryFromSupabase(knownSyncVersion?: string): Promise<PcpItem[]> {
  const batchSize = 1000

  // Obter versão da sincronização para atrelar ao cache local
  let latestSyncVersion: string | undefined = knownSyncVersion
  if (!latestSyncVersion) {
    try {
      const { data: statusRow } = await supabase
        .from('performance_metrics')
        .select('value, updated_at')
        .eq('cell_key', 'pcp_sync_command')
        .maybeSingle()
      if (statusRow?.value) {
        const parsed = JSON.parse(statusRow.value)
        latestSyncVersion = parsed.updated_at || statusRow.updated_at
      }
    } catch { }
  }

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
        .select('*')
        .order('id', { ascending: true })
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
    if (latestSyncVersion) cachedSyncVersion = latestSyncVersion
    await setPcpPlanningCache(allData, latestSyncVersion)
  }

  return allData
}

export async function getAllPcpSummaryItems(
  forceRefresh: boolean = false,
  onBackgroundUpdate?: (data: PcpItem[]) => void,
  expectedSyncVersion?: string
): Promise<PcpItem[]> {
  const now = Date.now()

  // Se o servidor tiver uma versão de sync diferente do cache, invalida e força busca fresca
  if (expectedSyncVersion && cachedSyncVersion && expectedSyncVersion !== cachedSyncVersion) {
    forceRefresh = true
  }

  // 1. Memória imediata (< 1ms)
  if (!forceRefresh && cachedPlanningData && cachedPlanningData.length > 0) {
    // Se a versão em memória for consistente com a versão esperada da nuvem
    if (!expectedSyncVersion || cachedSyncVersion === expectedSyncVersion) {
      if (now - cacheTimestamp >= CACHE_TTL_MS && !isFetchingFromSupabase) {
        isFetchingFromSupabase = true
        fetchSummaryFromSupabase(expectedSyncVersion)
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
  }

  // 2. IndexedDB persistente no navegador
  if (!forceRefresh) {
    const cached = await getPcpPlanningCache()
    // O cache só é considerado válido se possuir syncVersion E ela for compatível com o Supabase!
    const isCacheValid = !!(
      cached &&
      cached.data &&
      cached.data.length > 0 &&
      cached.syncVersion &&
      (!expectedSyncVersion || cached.syncVersion === expectedSyncVersion)
    )

    if (isCacheValid && cached) {
      cachedPlanningData = cached.data
      cacheTimestamp = cached.timestamp || Date.now()
      cachedSyncVersion = cached.syncVersion || null

      // Revalidação em segundo plano se tiver mais de 1 minuto
      if (now - cacheTimestamp >= CACHE_TTL_MS && !isFetchingFromSupabase) {
        isFetchingFromSupabase = true
        fetchSummaryFromSupabase(expectedSyncVersion)
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

  // 3. Primeira execução, cache desatualizado ou forceRefresh: busca DIRETA do Supabase
  if (activeFetchPromise) {
    return activeFetchPromise
  }

  isFetchingFromSupabase = true
  activeFetchPromise = fetchSummaryFromSupabase(expectedSyncVersion)
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

// =========================================================================
// SINCRONIZADOR ORACLE MLPDW -> SUPABASE
// =========================================================================

export interface OracleSyncStatus {
  status: 'idle' | 'running' | 'success' | 'warning' | 'error' | 'unknown'
  step?: string
  progress?: number
  current?: number
  total?: number
  message?: string
  elapsed_seconds?: number
  error?: string
  updated_at?: string
}

// Disparar sincronização do Oracle MLPDW para o Supabase (via fila Supabase + fallback local)
export async function triggerOracleSync(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const requestPayload = {
      action: 'sync',
      status: 'requested',
      progress: 10,
      message: 'Solicitação enviada. Conectando ao sincronizador corporativo...',
      requested_at: new Date().toISOString()
    }

    // 1. Grava diretamente no Supabase (funciona na Vercel e em qualquer lugar)
    const { error: supaErr } = await supabase
      .from('performance_metrics')
      .upsert({
        cell_key: 'pcp_sync_command',
        value: JSON.stringify(requestPayload)
      }, { onConflict: 'cell_key' })

    if (supaErr) {
      console.warn('Aviso ao registrar comando no Supabase:', supaErr.message)
    }

    // 2. Tenta também acionar backend local se estiver rodando em desenvolvimento
    try {
      fetch('/api/pcp/sync-oracle', { method: 'POST' }).catch(() => { })
    } catch { }

    return {
      success: true,
      message: 'Solicitação de sincronização enviada para o sincronizador corporativo.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Falha ao registrar comando de sincronização no Supabase.',
      error: err.message
    }
  }
}

// Consultar status atual da sincronização (direto do Supabase)
export async function getOracleSyncStatus(): Promise<OracleSyncStatus> {
  try {
    // 1. Consulta prioritária no Supabase (funciona na Vercel e em qualquer máquina)
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('value, updated_at')
      .eq('cell_key', 'pcp_sync_command')
      .maybeSingle()

    if (!error && data && data.value) {
      try {
        const parsed = JSON.parse(data.value)
        return {
          ...parsed,
          updated_at: parsed.updated_at || data.updated_at
        }
      } catch { }
    }

    // 2. Fallback para API local se disponível
    try {
      const res = await fetch('/api/pcp/sync-status')
      if (res.ok) return await res.json()
    } catch { }

    return { status: 'unknown' }
  } catch {
    return { status: 'unknown' }
  }
}

// =========================================================================
// SINCRONIZAÇÃO CENTRAL DE CADASTROS AUXILIARES (DE-PARA DE ROTAS, MODAIS E CEPS)
// =========================================================================

export async function fetchPcpAuxParams(): Promise<{
  filialRotas?: any[]
  modais?: any[]
  cepRotas?: any[]
}> {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('cell_key, value')
      .in('cell_key', ['pcp_filial_rotas_params', 'pcp_modal_params', 'pcp_cep_rotas_params'])

    if (error || !data) return {}

    const result: { filialRotas?: any[]; modais?: any[]; cepRotas?: any[] } = {}
    for (const row of data) {
      if (row.cell_key === 'pcp_filial_rotas_params' && row.value) {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) result.filialRotas = parsed
        } catch { }
      } else if (row.cell_key === 'pcp_modal_params' && row.value) {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) result.modais = parsed
        } catch { }
      } else if (row.cell_key === 'pcp_cep_rotas_params' && row.value) {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) result.cepRotas = parsed
        } catch { }
      }
    }
    return result
  } catch {
    return {}
  }
}

export async function savePcpAuxParams(
  type: 'filial_rotas' | 'modais' | 'cep_rotas',
  data: any[]
): Promise<boolean> {
  try {
    const cell_key =
      type === 'filial_rotas'
        ? 'pcp_filial_rotas_params'
        : type === 'modais'
        ? 'pcp_modal_params'
        : 'pcp_cep_rotas_params'
    const payload = {
      cell_key,
      value: JSON.stringify(data),
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase
      .from('performance_metrics')
      .upsert(payload, { onConflict: 'cell_key' })
    return !error
  } catch {
    return false
  }
}
