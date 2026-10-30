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

/**
 * Função para processar planilha PMT (.xlsx ou .xlsb) diretamente no cliente
 * e salvar no Supabase sem necessidade do servidor backend local.
 */
export async function parseAndUploadPmtExcel(
  fileBuffer: ArrayBuffer,
  filename: string,
  ano: number,
  mes: number,
  versao: string = 'v1',
  replace: boolean = true,
  onProgress?: (progressText: string) => void
): Promise<{ success: boolean; totalRows: number; cd994Rows: number; error?: string }> {
  try {
    if (onProgress) onProgress('Lendo e descompactando arquivo da planilha...')
    
    // Importa dinamicamente ou usa a lib xlsx
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: false })
    
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    if (onProgress) onProgress('Convertendo linhas da planilha...')
    // Converte para matriz de objetos ou array
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (rawData.length <= 1) {
      throw new Error('A planilha está vazia ou não contém linhas de dados.')
    }
    
    const headerRow: string[] = rawData[0].map((h: any) => String(h || '').trim().toUpperCase())
    
    // Helper para achar índice da coluna por nome aproximado
    const findIndex = (possibleNames: string[]): number => {
      return headerRow.findIndex(h => possibleNames.some(name => h === name.toUpperCase()))
    }
    
    // Mapeamento dos índices das colunas
    const colMes = findIndex(['MÊS', 'MES', 'MÊS BASE'])
    const colModalAgrup = findIndex(['MODAL_AGRUPADO', 'MODAL AGRUPADO', 'AGRUPAMENTO MODAL'])
    const colCd = findIndex(['CD', 'CÓDIGO CD', 'COD CD'])
    const colDia = findIndex(['DIA', 'DATA', 'DATA_BASE'])
    const colSigla = findIndex(['SIGLA', 'SIGLA CD'])
    const colDivMoveis = findIndex(['DIV_MOVEIS', 'DIVISÃO MOVEIS', 'DIV MOVEIS'])
    const colCanal = findIndex(['CANAL_VENDA', 'CANAL DE VENDA', 'CANAL'])
    const colTipoSaida = findIndex(['TIPO_SAIDA', 'TIPO SAÍDA', 'TIPO DE SAÍDA'])
    const colModal = findIndex(['MODAL', 'MODAL DESC'])
    const colValor = findIndex(['VALOR_PLAN_DIARIO_CD', 'VALOR', 'VALOR PLANEJADO'])
    const colPedido = findIndex(['PEDIDO_PLAN_DIARIO_CD', 'PEDIDO', 'PEDIDOS PLANEJADOS', 'PEDIDOS'])
    const colCub = findIndex(['CUB_PLAN_DIARIO_CD', 'CUB', 'CUBAGEM', 'M3'])
    const colPecas = findIndex(['PECAS_PLAN_DIARIO_CD', 'PECAS', 'PEÇAS', 'PEÇAS PLANEJADAS'])
    const colPedUnico = findIndex(['PEDIDO_UNICO_PLAN_DIARIO_CD', 'PEDIDO UNICO', 'PEDIDO_UNICO'])
    const colModalSaida = findIndex(['MODAL_SAIDA', 'MODAL DE SAÍDA', 'MODAL SAIDA'])
    const colCategoria = findIndex(['CATEGORIA', 'CATEGORIA PRODUTO'])
    const colCatProd = findIndex(['CATEGORIA_PRODUTIVIDADE', 'CATEGORIA DE PRODUTIVIDADE', 'CAT PRODUTIVIDADE'])
    const colPlat = findIndex(['PLATAFORMA_VENDA', 'PLATAFORMA', 'PLATAFORMA DE VENDA'])

    const toNum = (val: any) => {
      if (val === null || val === undefined || val === '') return 0
      if (typeof val === 'number') return isNaN(val) ? 0 : val
      const s = String(val).trim().replace(/\./g, '').replace(',', '.')
      const n = Number(s)
      return isNaN(n) ? 0 : n
    }

    const rowsToInsert: any[] = []
    let cd994Rows = 0

    // Data serial do Excel
    const BASE_EXCEL_DATE = new Date(1899, 11, 30)

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.length === 0) continue

      const cdVal = String(colCd >= 0 ? row[colCd] ?? '' : (row[2] ?? '')).trim()
      if (!cdVal) continue

      if (cdVal === '994') {
        cd994Rows++
      }

      // Trata data do dia
      const rawDia = colDia >= 0 ? row[colDia] : row[3]
      let diaStr: string | null = null

      if (rawDia !== undefined && rawDia !== null && String(rawDia).trim() !== '') {
        const numDia = Number(rawDia)
        if (!isNaN(numDia)) {
          if (numDia >= 1 && numDia <= 31 && Number.isInteger(numDia)) {
            diaStr = `${ano}-${String(mes).padStart(2, '0')}-${String(numDia).padStart(2, '0')}`
          } else if (numDia > 1000) {
            const dateObj = new Date(BASE_EXCEL_DATE.getTime() + numDia * 86400000)
            diaStr = dateObj.toISOString().split('T')[0]
          } else {
            diaStr = `${ano}-${String(mes).padStart(2, '0')}-${String(Math.floor(numDia)).padStart(2, '0')}`
          }
        } else {
          diaStr = String(rawDia).trim()
        }
      }

      const item = {
        ano: Number(ano),
        mes: Number(mes),
        cd: cdVal,
        dia: diaStr,
        modal_agrupado: String(colModalAgrup >= 0 ? row[colModalAgrup] ?? '' : (row[1] ?? '')).trim() || null,
        sigla: String(colSigla >= 0 ? row[colSigla] ?? '' : (row[4] ?? '')).trim() || null,
        div_moveis: String(colDivMoveis >= 0 ? row[colDivMoveis] ?? '' : (row[5] ?? '')).trim() || null,
        canal_venda: String(colCanal >= 0 ? row[colCanal] ?? '' : (row[6] ?? '')).trim() || null,
        tipo_saida: String(colTipoSaida >= 0 ? row[colTipoSaida] ?? '' : (row[7] ?? '')).trim() || null,
        modal: String(colModal >= 0 ? row[colModal] ?? '' : (row[8] ?? '')).trim() || null,
        valor_plan_diario_cd: toNum(colValor >= 0 ? row[colValor] : row[9]),
        pedido_plan_diario_cd: toNum(colPedido >= 0 ? row[colPedido] : row[10]),
        cub_plan_diario_cd: toNum(colCub >= 0 ? row[colCub] : row[11]),
        pecas_plan_diario_cd: toNum(colPecas >= 0 ? row[colPecas] : row[12]),
        pedido_unico_plan_diario_cd: toNum(colPedUnico >= 0 ? row[colPedUnico] : row[13]),
        modal_saida: String(colModalSaida >= 0 ? row[colModalSaida] ?? '' : (row[14] ?? '')).trim() || null,
        categoria: String(colCategoria >= 0 ? row[colCategoria] ?? '' : (row[15] ?? '')).trim() || null,
        categoria_produtividade: String(colCatProd >= 0 ? row[colCatProd] ?? '' : (row[16] ?? '')).trim() || null,
        plataforma_venda: String(colPlat >= 0 ? row[colPlat] ?? '' : (row[17] ?? '')).trim() || null,
        versao: versao || 'v1',
        arquivo_origem: filename
      }

      rowsToInsert.push(item)
    }

    if (rowsToInsert.length === 0) {
      throw new Error('Nenhum registro válido de dados encontrado para importar.')
    }

    // Se replace for true, remove os registros antigos desse ano e mês
    if (replace) {
      if (onProgress) onProgress(`Limpando base antiga do mês ${mes}/${ano} no Supabase...`)
      const { error: delError } = await supabase
        .from('pmt_records')
        .delete()
        .eq('ano', Number(ano))
        .eq('mes', Number(mes))

      if (delError) {
        console.warn('Aviso ao limpar registros antigos:', delError.message)
      }
    }

    // Salva em lotes de 1.000 no Supabase
    const batchSize = 1000
    const totalBatches = Math.ceil(rowsToInsert.length / batchSize)
    
    for (let b = 0; b < totalBatches; b++) {
      const start = b * batchSize
      const end = Math.min(start + batchSize, rowsToInsert.length)
      const chunk = rowsToInsert.slice(start, end)

      if (onProgress) {
        onProgress(`Enviando para o Supabase: lote ${b + 1} de ${totalBatches} (${end.toLocaleString('pt-BR')} de ${rowsToInsert.length.toLocaleString('pt-BR')} linhas)...`)
      }

      const { error: insertError } = await supabase
        .from('pmt_records')
        .insert(chunk)

      if (insertError) {
        throw new Error(`Erro ao inserir lote no Supabase: ${insertError.message}`)
      }
    }

    if (onProgress) onProgress('Finalizado com sucesso!')
    return {
      success: true,
      totalRows: rowsToInsert.length,
      cd994Rows
    }
  } catch (err: any) {
    console.error('Erro em parseAndUploadPmtExcel:', err)
    return {
      success: false,
      totalRows: 0,
      cd994Rows: 0,
      error: err.message || 'Erro inesperado ao processar arquivo'
    }
  }
}
