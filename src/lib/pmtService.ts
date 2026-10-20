import { supabase } from './supabase'

export interface PmtSummaryResponse {
  ano: number
  mes: number
  cd: string
  summary: {
    total_linhas?: number
    total_valor?: number
    total_pecas?: number
    total_pedidos?: number
    total_cub?: number
    versao?: string
    arquivo_origem?: string
  }
  modals: Array<{
    modal_agrupado: string
    linhas: number
    valor: number
    pecas: number
    pedidos: number
    cub: number
  }>
  daily: Array<{
    dia: string
    linhas: number
    valor: number
    pecas: number
    pedidos: number
  }>
  totalGeralLinhas: number
}

export interface DayCol {
  day: number
  dayStr: string
  weekdayLetter: string
}

export interface PmtDailyMatrixResponse {
  ano: number
  mes: number
  cd: string
  groupBy: string
  modals: string[]
  days: DayCol[]
  data: {
    pedidos: Record<string, Record<string, number> & { total: number }>
    pecas: Record<string, Record<string, number> & { total: number }>
    cubagem: Record<string, Record<string, number> & { total: number }>
  }
  totals: {
    pedidos: Record<string, number> & { total: number }
    pecas: Record<string, number> & { total: number }
    cubagem: Record<string, number> & { total: number }
  }
}

/**
 * Busca o resumo do PMT do CD especificado direto do Supabase.
 * Funciona 100% online na Vercel ou qualquer ambiente externo.
 */
export async function getPmtSummaryFromSupabase(
  ano: number,
  mes: number,
  cd = '994'
): Promise<PmtSummaryResponse> {
  const cdStr = String(cd).trim()
  const anoNum = Number(ano)
  const mesNum = Number(mes)

  // 1. Busca os registros do CD no mês especificado com paginação
  let allRows: any[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('pmt_records')
      .select('modal_agrupado, valor_plan_diario_cd, pecas_plan_diario_cd, pedido_plan_diario_cd, cub_plan_diario_cd, versao, arquivo_origem, dia')
      .eq('cd', cdStr)
      .eq('ano', anoNum)
      .eq('mes', mesNum)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Erro ao buscar pmt_records no Supabase:', error)
      break
    }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < pageSize) break
    page++
  }

  // 2. Conta total geral de linhas na base daquele mês
  const { count: totalGeralLinhas } = await supabase
    .from('pmt_records')
    .select('*', { count: 'exact', head: true })
    .eq('ano', anoNum)
    .eq('mes', mesNum)

  let totalValor = 0
  let totalPecas = 0
  let totalPedidos = 0
  let totalCub = 0
  let versao = 'v1'
  let arquivoOrigem = ''

  const modalsMap: Record<string, { linhas: number; valor: number; pecas: number; pedidos: number; cub: number }> = {}
  const dailyMap: Record<string, { linhas: number; valor: number; pecas: number; pedidos: number }> = {}

  for (const r of allRows) {
    const valor = Number(r.valor_plan_diario_cd || 0)
    const pecas = Number(r.pecas_plan_diario_cd || 0)
    const pedidos = Number(r.pedido_plan_diario_cd || 0)
    const cub = Number(r.cub_plan_diario_cd || 0)

    totalValor += valor
    totalPecas += pecas
    totalPedidos += pedidos
    totalCub += cub

    if (r.versao) versao = r.versao
    if (r.arquivo_origem) arquivoOrigem = r.arquivo_origem

    // Agrupamento por Modal Agrupado
    const m = r.modal_agrupado || 'OUTROS'
    if (!modalsMap[m]) {
      modalsMap[m] = { linhas: 0, valor: 0, pecas: 0, pedidos: 0, cub: 0 }
    }
    modalsMap[m].linhas += 1
    modalsMap[m].valor += valor
    modalsMap[m].pecas += pecas
    modalsMap[m].pedidos += pedidos
    modalsMap[m].cub += cub

    // Agrupamento Diário
    if (r.dia) {
      const d = String(r.dia).split('T')[0]
      if (!dailyMap[d]) {
        dailyMap[d] = { linhas: 0, valor: 0, pecas: 0, pedidos: 0 }
      }
      dailyMap[d].linhas += 1
      dailyMap[d].valor += valor
      dailyMap[d].pecas += pecas
      dailyMap[d].pedidos += pedidos
    }
  }

  const modalsList = Object.keys(modalsMap).map(k => ({
    modal_agrupado: k,
    linhas: modalsMap[k].linhas,
    valor: Math.round(modalsMap[k].valor * 100) / 100,
    pecas: Math.round(modalsMap[k].pecas * 100) / 100,
    pedidos: Math.round(modalsMap[k].pedidos * 100) / 100,
    cub: Math.round(modalsMap[k].cub * 100) / 100,
  })).sort((a, b) => b.valor - a.valor)

  const dailyList = Object.keys(dailyMap).map(d => ({
    dia: d,
    linhas: dailyMap[d].linhas,
    valor: Math.round(dailyMap[d].valor * 100) / 100,
    pecas: Math.round(dailyMap[d].pecas * 100) / 100,
    pedidos: Math.round(dailyMap[d].pedidos * 100) / 100,
  })).sort((a, b) => a.dia.localeCompare(b.dia))

  return {
    ano: anoNum,
    mes: mesNum,
    cd: cdStr,
    summary: {
      total_linhas: allRows.length,
      total_valor: Math.round(totalValor * 100) / 100,
      total_pecas: Math.round(totalPecas * 100) / 100,
      total_pedidos: Math.round(totalPedidos * 100) / 100,
      total_cub: Math.round(totalCub * 100) / 100,
      versao,
      arquivo_origem: arquivoOrigem
    },
    modals: modalsList,
    daily: dailyList,
    totalGeralLinhas: totalGeralLinhas || allRows.length
  }
}

/**
 * Monta a Matriz Diária por Modal ou Categoria de Produtividade direto dos dados do Supabase.
 */
export async function getPmtDailyMatrixFromSupabase(
  ano: number,
  mes: number,
  cd = '994',
  groupBy: 'modal' | 'categoria_produtividade' = 'modal'
): Promise<PmtDailyMatrixResponse | null> {
  const cdStr = String(cd).trim()
  const anoNum = Number(ano)
  const mesNum = Number(mes)

  const daysInMonth = new Date(anoNum, mesNum, 0).getDate()
  const weekdayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const days: DayCol[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(anoNum, mesNum - 1, d)
    const dayStr = String(d).padStart(2, '0')
    days.push({
      day: d,
      dayStr,
      weekdayLetter: weekdayLetters[dateObj.getDay()]
    })
  }

  const isCategoria = groupBy === 'categoria_produtividade'
  const groupCol = isCategoria ? 'categoria_produtividade' : 'modal'

  const expectedModals = [
    '1. Courier',
    '10. Ecom Fulfillment',
    '12. Roteiro Y',
    '13. Abastecimento',
    '14. Transferência 1P',
    '16. Transferência HUB',
    '2. Rodo',
    '3. Retira Loja 1P',
    '6. Retira Loja 3P',
    '9. Ecom 1P'
  ]

  const expectedCategorias = [
    'ATACADO',
    'BENS DE CONSUMO (MERCADO)',
    'COFRE',
    'COLCHAO / ESTOFADO',
    'CROSS LEVE',
    'CROSS PESADO',
    'DIVERSOS',
    'ELETRO PESADO',
    'MADEIRA',
    'PNEUS',
    'TV'
  ]

  const targetList = isCategoria ? expectedCategorias : expectedModals

  // Busca dados paginados
  let allRows: any[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('pmt_records')
      .select(`${groupCol}, dia, pedido_plan_diario_cd, pecas_plan_diario_cd, cub_plan_diario_cd`)
      .eq('cd', cdStr)
      .eq('ano', anoNum)
      .eq('mes', mesNum)
      .not('dia', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Erro ao buscar matriz no Supabase:', error)
      break
    }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < pageSize) break
    page++
  }

  if (allRows.length === 0) {
    return null
  }

  const dataResult = {
    pedidos: {} as Record<string, Record<string, number> & { total: number }>,
    pecas: {} as Record<string, Record<string, number> & { total: number }>,
    cubagem: {} as Record<string, Record<string, number> & { total: number }>
  }

  targetList.forEach(m => {
    dataResult.pedidos[m] = { total: 0 }
    dataResult.pecas[m] = { total: 0 }
    dataResult.cubagem[m] = { total: 0 }
    days.forEach(d => {
      dataResult.pedidos[m][d.dayStr] = 0
      dataResult.pecas[m][d.dayStr] = 0
      dataResult.cubagem[m][d.dayStr] = 0
    })
  })

  // Agrega as linhas
  allRows.forEach(r => {
    const m = r[groupCol]
    if (!m || !dataResult.pedidos[m]) return

    let dayStr = ''
    if (r.dia) {
      const parts = String(r.dia).split('T')[0].split('-')
      if (parts.length >= 3) {
        dayStr = parts[2].padStart(2, '0')
      }
    }
    if (!dayStr) return

    const ped = Number(r.pedido_plan_diario_cd || 0)
    const pec = Number(r.pecas_plan_diario_cd || 0)
    const cub = Number(r.cub_plan_diario_cd || 0)

    dataResult.pedidos[m][dayStr] = (dataResult.pedidos[m][dayStr] || 0) + ped
    dataResult.pedidos[m].total += ped

    dataResult.pecas[m][dayStr] = (dataResult.pecas[m][dayStr] || 0) + pec
    dataResult.pecas[m].total += pec

    dataResult.cubagem[m][dayStr] = (dataResult.cubagem[m][dayStr] || 0) + cub
    dataResult.cubagem[m].total += cub
  })

  // Arredondamentos
  targetList.forEach(m => {
    days.forEach(d => {
      dataResult.pedidos[m][d.dayStr] = Math.round(dataResult.pedidos[m][d.dayStr])
      dataResult.pecas[m][d.dayStr] = Math.round(dataResult.pecas[m][d.dayStr])
      dataResult.cubagem[m][d.dayStr] = Math.round(dataResult.cubagem[m][d.dayStr])
    })
    dataResult.pedidos[m].total = Math.round(dataResult.pedidos[m].total)
    dataResult.pecas[m].total = Math.round(dataResult.pecas[m].total)
    dataResult.cubagem[m].total = Math.round(dataResult.cubagem[m].total)
  })

  const totals = {
    pedidos: { total: 0 } as Record<string, number> & { total: number },
    pecas: { total: 0 } as Record<string, number> & { total: number },
    cubagem: { total: 0 } as Record<string, number> & { total: number }
  }

  days.forEach(d => {
    let sumPed = 0
    let sumPec = 0
    let sumCub = 0
    targetList.forEach(m => {
      sumPed += dataResult.pedidos[m][d.dayStr] || 0
      sumPec += dataResult.pecas[m][d.dayStr] || 0
      sumCub += dataResult.cubagem[m][d.dayStr] || 0
    })
    totals.pedidos[d.dayStr] = sumPed
    totals.pedidos.total += sumPed

    totals.pecas[d.dayStr] = sumPec
    totals.pecas.total += sumPec

    totals.cubagem[d.dayStr] = sumCub
    totals.cubagem.total += sumCub
  })

  return {
    ano: anoNum,
    mes: mesNum,
    cd: cdStr,
    groupBy,
    modals: targetList,
    days,
    data: dataResult,
    totals
  }
}
