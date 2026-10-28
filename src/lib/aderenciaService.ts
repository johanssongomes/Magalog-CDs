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

// Extrair dia, mês e ano de um registro ou data
export function extractDateParts(
  row: any, 
  dateColumnName?: string, 
  defaultAno?: number, 
  defaultMes?: number
): { dayStr: string; mes: number; ano: number } | null {
  if (!row) return null

  // 1. Tentar pegar das colunas explícitas se existirem
  const rawAno = row['Ano Liberação'] || row['Ano Faturamento'] || row['Ano'] || row['ano']
  const rawMes = row['Mês Liberação'] || row['Mês Faturamento'] || row['Mês'] || row['Mes'] || row['mes']
  const dateVal = row[dateColumnName || ''] || row['Data'] || row['Data Liberação'] || row['Data Faturamento']

  let ano = parseSafeNumber(rawAno) || defaultAno || 0
  let mes = parseSafeNumber(rawMes) || defaultMes || 0
  let dayStr: string | null = null

  if (dateVal) {
    const s = String(dateVal).trim()
    // DD/MM/AAAA ou DD/MM/AA
    if (s.includes('/')) {
      const parts = s.split('/')
      if (parts.length >= 3) {
        dayStr = parts[0].padStart(2, '0')
        if (!mes) mes = parseInt(parts[1], 10)
        if (!ano) {
          const parsedYear = parseInt(parts[2], 10)
          ano = parsedYear < 100 ? 2000 + parsedYear : parsedYear
        }
      } else if (parts.length === 2) {
        dayStr = parts[0].padStart(2, '0')
        if (!mes) mes = parseInt(parts[1], 10)
      }
    } else if (s.includes('-')) {
      // AAAA-MM-DD
      const parts = s.split('-')
      if (parts.length >= 3) {
        if (!ano) ano = parseInt(parts[0], 10)
        if (!mes) mes = parseInt(parts[1], 10)
        dayStr = parts[2].substring(0, 2).padStart(2, '0')
      }
    } else {
      const num = parseInt(s, 10)
      if (!isNaN(num) && num >= 1 && num <= 31) {
        dayStr = num.toString().padStart(2, '0')
      }
    }
  }

  if (!dayStr && row['Dia']) {
    const d = parseInt(String(row['Dia']), 10)
    if (!isNaN(d) && d >= 1 && d <= 31) dayStr = d.toString().padStart(2, '0')
  }

  if (!dayStr) return null
  return { dayStr, mes: mes || (defaultMes || 1), ano: ano || (defaultAno || 2026) }
}

export interface ParsedMonthAderencia {
  ano: number
  mes: number
  cd: string
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

// Processador de arquivo Excel de Liberação ou Faturamento particionado por Mês e Ano
export function parseAderenciaExcel(
  fileBuffer: ArrayBuffer,
  dateColumnName: 'Data Liberação' | 'Data Faturamento' | string,
  contextAno?: number,
  contextMes?: number,
  contextCd: string = '994'
): Record<string, ParsedMonthAderencia> {
  const wb = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])

  // Dicionário por chave 'YYYY-MM'
  const monthsMap: Record<string, ParsedMonthAderencia> = {}

  rows.forEach(r => {
    const dateParts = extractDateParts(r, dateColumnName, contextAno, contextMes)
    if (!dateParts) return

    const rowAno = dateParts.ano
    const rowMes = dateParts.mes
    const dayStr = dateParts.dayStr
    const rowCd = String(r['CD'] || r['cd'] || contextCd).trim()
    const monthKey = `${rowAno}-${rowMes.toString().padStart(2, '0')}`

    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = {
        ano: rowAno,
        mes: rowMes,
        cd: rowCd,
        totals: { pedidos: {}, pecas: {}, cubagem: {} },
        byModal: { pedidos: {}, pecas: {}, cubagem: {} },
        byCategoria: { pedidos: {}, pecas: {}, cubagem: {} }
      }
    }

    const currentMonth = monthsMap[monthKey]
    const modal = String(r['Modal'] || 'Outros').trim()
    const cat = String(r['Categoria Produtividade 3'] || r['Categoria Produtividade'] || r['Categoria'] || 'Outros').trim()

    const ped = parseSafeNumber(r['Pedidos'])
    const pec = parseSafeNumber(r['Peças'])
    const cub = parseSafeNumber(r['Cubagem'])

    // Totais Gerais por Dia no Mês Correto
    currentMonth.totals.pedidos[dayStr] = (currentMonth.totals.pedidos[dayStr] || 0) + ped
    currentMonth.totals.pecas[dayStr] = (currentMonth.totals.pecas[dayStr] || 0) + pec
    currentMonth.totals.cubagem[dayStr] = (currentMonth.totals.cubagem[dayStr] || 0) + cub

    // Por Modal
    if (!currentMonth.byModal.pedidos[modal]) currentMonth.byModal.pedidos[modal] = {}
    if (!currentMonth.byModal.pecas[modal]) currentMonth.byModal.pecas[modal] = {}
    if (!currentMonth.byModal.cubagem[modal]) currentMonth.byModal.cubagem[modal] = {}
    currentMonth.byModal.pedidos[modal][dayStr] = (currentMonth.byModal.pedidos[modal][dayStr] || 0) + ped
    currentMonth.byModal.pecas[modal][dayStr] = (currentMonth.byModal.pecas[modal][dayStr] || 0) + pec
    currentMonth.byModal.cubagem[modal][dayStr] = (currentMonth.byModal.cubagem[modal][dayStr] || 0) + cub

    // Por Categoria de Produtividade
    if (!currentMonth.byCategoria.pedidos[cat]) currentMonth.byCategoria.pedidos[cat] = {}
    if (!currentMonth.byCategoria.pecas[cat]) currentMonth.byCategoria.pecas[cat] = {}
    if (!currentMonth.byCategoria.cubagem[cat]) currentMonth.byCategoria.cubagem[cat] = {}
    currentMonth.byCategoria.pedidos[cat][dayStr] = (currentMonth.byCategoria.pedidos[cat][dayStr] || 0) + ped
    currentMonth.byCategoria.pecas[cat][dayStr] = (currentMonth.byCategoria.pecas[cat][dayStr] || 0) + pec
    currentMonth.byCategoria.cubagem[cat][dayStr] = (currentMonth.byCategoria.cubagem[cat][dayStr] || 0) + cub
  })

  return monthsMap
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
