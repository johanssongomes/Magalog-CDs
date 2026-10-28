import * as XLSX from 'xlsx'
import { supabase } from './supabase'

export interface AderenciaMetricData {
  pedidos: Record<string, number> // dayStr -> valor
  pecas: Record<string, number>
  cubagem: Record<string, number>
}

export interface AderenciaDataState {
  ano: number
  mes: number
  cd: string
  liberado: {
    totals: AderenciaMetricData
    byModal: {
      pedidos: Record<string, Record<string, number>>
      pecas: Record<string, Record<string, number>>
      cubagem: Record<string, Record<string, number>>
    }
    byCategoria: {
      pedidos: Record<string, Record<string, number>>
      pecas: Record<string, Record<string, number>>
      cubagem: Record<string, Record<string, number>>
    }
  }
  faturado: {
    totals: AderenciaMetricData
    byModal: {
      pedidos: Record<string, Record<string, number>>
      pecas: Record<string, Record<string, number>>
      cubagem: Record<string, Record<string, number>>
    }
    byCategoria: {
      pedidos: Record<string, Record<string, number>>
      pecas: Record<string, Record<string, number>>
      cubagem: Record<string, Record<string, number>>
    }
  }
  capacidade: {
    pedidos: Record<string, number>
    pecas: Record<string, number>
    cubagem: Record<string, number>
  }
  updatedAt?: string
}

const STORAGE_KEY_ADERENCIA = (ano: number, mes: number, cd: string) => 
  `magalog_pmt_aderencia_${cd}_${ano}_${mes.toString().padStart(2, '0')}`

const SUPABASE_KEY_ADERENCIA = (ano: number, mes: number, cd: string) => 
  `_pmt_aderencia_${cd}_${ano}_${mes.toString().padStart(2, '0')}`

// Função auxiliar para converter valores da planilha com segurança
export function parseSafeNumber(val: any): number {
  if (val === null || val === undefined || val === 'null' || val === '' || val === '-') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const s = String(val).trim()
  const clean = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  const num = Number(clean)
  return isNaN(num) ? 0 : num
}

// Extrair dia no formato de dois dígitos '01', '02', etc.
export function extractDayStr(val: any): string | null {
  if (!val) return null
  const s = String(val).trim()
  // Trata formato '01/10/2026' ou '2026-10-01'
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length >= 2) return parts[0].padStart(2, '0')
  }
  if (s.includes('-')) {
    const parts = s.split('-')
    if (parts.length >= 3) return parts[2].substring(0, 2).padStart(2, '0')
  }
  const numeric = parseInt(s, 10)
  if (!isNaN(numeric) && numeric >= 1 && numeric <= 31) {
    return numeric.toString().padStart(2, '0')
  }
  return null
}

// Processador de arquivo Excel de Liberação ou Faturamento
export function parseAderenciaExcel(
  fileBuffer: ArrayBuffer,
  dateColumnName: 'Data Liberação' | 'Data Faturamento' | string
) {
  const wb = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])

  const totals: AderenciaMetricData = { pedidos: {}, pecas: {}, cubagem: {} }
  const byModal = {
    pedidos: {} as Record<string, Record<string, number>>,
    pecas: {} as Record<string, Record<string, number>>,
    cubagem: {} as Record<string, Record<string, number>>
  }
  const byCategoria = {
    pedidos: {} as Record<string, Record<string, number>>,
    pecas: {} as Record<string, Record<string, number>>,
    cubagem: {} as Record<string, Record<string, number>>
  }

  rows.forEach(r => {
    // Tenta encontrar a coluna de data mesmo se houver variação no título
    const dateVal = r[dateColumnName] || r['Data'] || r['Data Liberação'] || r['Data Faturamento']
    const dayStr = extractDayStr(dateVal)
    if (!dayStr) return

    const modal = String(r['Modal'] || 'Outros').trim()
    const cat = String(r['Categoria Produtividade'] || r['Categoria'] || 'Outros').trim()

    const ped = parseSafeNumber(r['Pedidos'])
    const pec = parseSafeNumber(r['Peças'])
    const cub = parseSafeNumber(r['Cubagem'])

    // Totais Gerais por Dia
    totals.pedidos[dayStr] = (totals.pedidos[dayStr] || 0) + ped
    totals.pecas[dayStr] = (totals.pecas[dayStr] || 0) + pec
    totals.cubagem[dayStr] = (totals.cubagem[dayStr] || 0) + cub

    // Por Modal
    if (!byModal.pedidos[modal]) byModal.pedidos[modal] = {}
    if (!byModal.pecas[modal]) byModal.pecas[modal] = {}
    if (!byModal.cubagem[modal]) byModal.cubagem[modal] = {}
    byModal.pedidos[modal][dayStr] = (byModal.pedidos[modal][dayStr] || 0) + ped
    byModal.pecas[modal][dayStr] = (byModal.pecas[modal][dayStr] || 0) + pec
    byModal.cubagem[modal][dayStr] = (byModal.cubagem[modal][dayStr] || 0) + cub

    // Por Categoria de Produtividade
    if (!byCategoria.pedidos[cat]) byCategoria.pedidos[cat] = {}
    if (!byCategoria.pecas[cat]) byCategoria.pecas[cat] = {}
    if (!byCategoria.cubagem[cat]) byCategoria.cubagem[cat] = {}
    byCategoria.pedidos[cat][dayStr] = (byCategoria.pedidos[cat][dayStr] || 0) + ped
    byCategoria.pecas[cat][dayStr] = (byCategoria.pecas[cat][dayStr] || 0) + pec
    byCategoria.cubagem[cat][dayStr] = (byCategoria.cubagem[cat][dayStr] || 0) + cub
  })

  return { totals, byModal, byCategoria }
}

// Buscar dados de Aderência (Liberado, Faturado e Capacidade) do Supabase ou Cache
export async function getAderenciaData(ano: number, mes: number, cd: string = '994'): Promise<AderenciaDataState | null> {
  const localKey = STORAGE_KEY_ADERENCIA(ano, mes, cd)
  const dbKey = SUPABASE_KEY_ADERENCIA(ano, mes, cd)

  try {
    // 1. Tenta carregar do Supabase (performance_metrics)
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('value')
      .eq('cell_key', dbKey)
      .maybeSingle()

    if (!error && data?.value) {
      const parsed: AderenciaDataState = JSON.parse(data.value)
      try {
        localStorage.setItem(localKey, JSON.stringify(parsed))
      } catch {}
      return parsed
    }
  } catch (err) {
    console.warn('Erro ao carregar dados de aderência do Supabase:', err)
  }

  // 2. Fallback no LocalStorage
  try {
    const local = localStorage.getItem(localKey)
    if (local) return JSON.parse(local)
  } catch {}

  return null
}

// Salvar dados de Aderência no Supabase e Localmente
export async function saveAderenciaData(state: AderenciaDataState): Promise<void> {
  const { ano, mes, cd } = state
  const localKey = STORAGE_KEY_ADERENCIA(ano, mes, cd)
  const dbKey = SUPABASE_KEY_ADERENCIA(ano, mes, cd)
  const payload = { ...state, updatedAt: new Date().toISOString() }
  const jsonStr = JSON.stringify(payload)

  try {
    localStorage.setItem(localKey, jsonStr)
  } catch {}

  try {
    await supabase.from('performance_metrics').upsert({
      cell_key: dbKey,
      value: jsonStr,
      updated_at: new Date().toISOString()
    }, { onConflict: 'cell_key' })
  } catch (err) {
    console.warn('Erro ao gravar aderência no Supabase:', err)
  }
}
