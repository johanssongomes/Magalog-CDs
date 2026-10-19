import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { DatabaseSync } from 'node:sqlite'
import { exec } from 'child_process'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.join(__dirname, '../data.json')

// Supabase Client no Server Node
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://alwkfgqylejckbgienju.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dG6fHMjcet0Iek_PiS52IA_1xiveTKh'

// Desativa verificação SSL restritiva do Node local se houver proxy corporativo/VPN
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Helper local de fallback (caso Supabase fique indisponível temporariamente)
function readLocalData() {
  if (!fs.existsSync(DATA_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '{}')
  } catch {
    return {}
  }
}

function saveLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Erro ao salvar localmente:', err)
  }
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: 'Supabase (PostgreSQL)',
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Node/Express', 'Supabase DB']
  })
})

// Obter todas as métricas salvas no Supabase
app.get('/api/performance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('cell_key, value')

    if (error) {
      console.warn('⚠️ Supabase offline/erro, buscando local:', error.message)
      return res.json(readLocalData())
    }

    // Converte o array de linhas [{cell_key: 'x', value: 'y'}] de volta no formato Objeto chave-valor
    const dataMap = {}
    data.forEach(item => {
      dataMap[item.cell_key] = item.value
    })

    res.json(dataMap)
  } catch (err) {
    console.error('Erro /api/performance:', err)
    res.json(readLocalData())
  }
})

// Salvar / atualizar uma métrica individual no Supabase
app.post('/api/performance', async (req, res) => {
  const { cellKey, value } = req.body
  if (!cellKey) {
    return res.status(400).json({ error: 'cellKey é obrigatório' })
  }

  // Atualiza localmente como backup
  const local = readLocalData()
  local[cellKey] = value
  saveLocalData(local)

  try {
    const { error } = await supabase
      .from('performance_metrics')
      .upsert({ cell_key: cellKey, value: String(value) }, { onConflict: 'cell_key' })

    if (error) {
      console.error('Erro ao salvar no Supabase:', error.message)
      return res.status(500).json({ error: error.message, savedLocally: true })
    }

    res.json({ success: true, cellKey, value })
  } catch (err) {
    console.error('Erro post /api/performance:', err)
    res.json({ success: true, cellKey, value, savedLocally: true })
  }
})

// Salvar todas as métricas em lote (bulk) no Supabase
app.post('/api/performance/bulk', async (req, res) => {
  const dataMap = req.body || {}
  
  // Salva localmente como backup
  const local = readLocalData()
  Object.assign(local, dataMap)
  saveLocalData(local)

  const records = Object.keys(dataMap).map(key => ({
    cell_key: key,
    value: String(dataMap[key])
  }))

  if (records.length === 0) {
    return res.json({ success: true, count: 0 })
  }

  try {
    const { error } = await supabase
      .from('performance_metrics')
      .upsert(records, { onConflict: 'cell_key' })

    if (error) {
      console.error('Erro bulk no Supabase:', error.message)
      return res.status(500).json({ error: error.message, savedLocally: true })
    }

    res.json({ success: true, count: records.length })
  } catch (err) {
    console.error('Erro bulk:', err)
    res.json({ success: true, count: records.length, savedLocally: true })
  }
})

// =========================================================================
// ENDPOINTS DE PMTs (Plano de Metas de Transporte)
// Suporte a Ano, Mês, CD 994, Modais e Importação com substituição de versão
// =========================================================================

const DB_PATH = path.join(__dirname, '../prisma/dev.db')

function getSqliteDb() {
  if (!fs.existsSync(DB_PATH)) return null
  try {
    return new DatabaseSync(DB_PATH)
  } catch (err) {
    console.error('Erro ao abrir SQLite dev.db:', err)
    return null
  }
}

// Lista arquivos disponíveis na pasta PMTs/ para seleção no modal de importação
app.get('/api/pmt/files', (req, res) => {
  const pmtsDir = path.join(__dirname, '../PMTs')
  try {
    if (!fs.existsSync(pmtsDir)) {
      return res.json([])
    }
    const files = fs.readdirSync(pmtsDir)
      .filter(f => /\.(xlsx|xlsb|xls)$/i.test(f))
      .map(f => {
        const filePath = path.join(pmtsDir, f)
        const stat = fs.statSync(filePath)
        return {
          name: f,
          sizeMb: (stat.size / 1024 / 1024).toFixed(1),
          sizeBytes: stat.size,
          lastModified: stat.mtime.toISOString()
        }
      })
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified)) // mais recentes primeiro
    res.json(files)
  } catch (err) {
    console.error('Erro /api/pmt/files:', err)
    res.json([])
  }
})

// Lista de Anos disponíveis
app.get('/api/pmt/years', (req, res) => {
  try {
    const db = getSqliteDb()
    if (!db) return res.json([2024, 2025, 2026, 2027])
    const rows = db.prepare('SELECT DISTINCT ano FROM pmt_records ORDER BY ano DESC').all()
    const years = rows.map(r => r.ano)
    if (!years.includes(2026)) years.unshift(2026)
    res.json(years)
  } catch (e) {
    res.json([2024, 2025, 2026, 2027])
  }
})

// Lista de Meses com dados cadastrados para o ano
app.get('/api/pmt/months', (req, res) => {
  const ano = parseInt(req.query.ano || '2026', 10)
  try {
    const db = getSqliteDb()
    if (!db) return res.json([])
    const rows = db.prepare(`
      SELECT 
        mes, 
        COUNT(*) as total_linhas,
        MAX(versao) as versao,
        MAX(created_at) as updated_at
      FROM pmt_records 
      WHERE ano = ? 
      GROUP BY mes 
      ORDER BY mes ASC
    `).all(ano)
    res.json(rows)
  } catch (e) {
    res.json([])
  }
})

// Resumo consolidado do PMT (CD 994, Ano, Mês)
app.get('/api/pmt/summary', (req, res) => {
  const ano = parseInt(req.query.ano || '2026', 10)
  const mes = parseInt(req.query.mes || '10', 10)
  const cd = String(req.query.cd || '994').trim()

  try {
    const db = getSqliteDb()
    if (!db) return res.status(404).json({ error: 'Banco SQLite dev.db ainda não inicializado.' })

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_linhas,
        ROUND(SUM(valor_plan_diario_cd), 2) as total_valor,
        ROUND(SUM(pecas_plan_diario_cd), 2) as total_pecas,
        ROUND(SUM(pedido_plan_diario_cd), 2) as total_pedidos,
        ROUND(SUM(cub_plan_diario_cd), 2) as total_cub,
        MAX(versao) as versao,
        MAX(arquivo_origem) as arquivo_origem
      FROM pmt_records 
      WHERE cd = ? AND ano = ? AND mes = ?
    `).get(cd, ano, mes)

    const modals = db.prepare(`
      SELECT 
        modal_agrupado,
        COUNT(*) as linhas,
        ROUND(SUM(valor_plan_diario_cd), 2) as valor,
        ROUND(SUM(pecas_plan_diario_cd), 2) as pecas,
        ROUND(SUM(pedido_plan_diario_cd), 2) as pedidos,
        ROUND(SUM(cub_plan_diario_cd), 2) as cub
      FROM pmt_records 
      WHERE cd = ? AND ano = ? AND mes = ?
      GROUP BY modal_agrupado
      ORDER BY valor DESC
    `).all(cd, ano, mes)

    const daily = db.prepare(`
      SELECT 
        dia,
        COUNT(*) as linhas,
        ROUND(SUM(valor_plan_diario_cd), 2) as valor,
        ROUND(SUM(pecas_plan_diario_cd), 2) as pecas,
        ROUND(SUM(pedido_plan_diario_cd), 2) as pedidos
      FROM pmt_records 
      WHERE cd = ? AND ano = ? AND mes = ? AND dia IS NOT NULL
      GROUP BY dia
      ORDER BY dia ASC
    `).all(cd, ano, mes)

    const totalBase = db.prepare(`
      SELECT COUNT(*) as total_geral FROM pmt_records WHERE ano = ? AND mes = ?
    `).get(ano, mes)

    res.json({
      ano,
      mes,
      cd,
      summary: summary || {},
      modals: modals || [],
      daily: daily || [],
      totalGeralLinhas: totalBase ? totalBase.total_geral : 0
    })
  } catch (err) {
    console.error('Erro /api/pmt/summary:', err)
    res.status(500).json({ error: err.message })
  }
})

// Importação / Atualização da base do PMT (substituindo o mês com a nova versão)
app.post('/api/pmt/import', (req, res) => {
  const { ano = 2026, mes = 10, versao = 'v14', replace = true, filename = 'PMT_out_2026.xlsx' } = req.body || {}
  const filePath = path.join(__dirname, '../PMTs', filename)

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: `Arquivo ${filename} não encontrado na pasta PMTs/` })
  }

  const scriptPath = path.join(__dirname, '../scripts/import_pmt.py')
  const cmd = `python "${scriptPath}" --file "${filePath}" --ano ${ano} --mes ${mes} --versao "${versao}" ${replace ? '--replace' : ''}`

  exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error('Erro executando import_pmt.py:', stderr || error)
      return res.status(500).json({ error: stderr || error.message })
    }
    try {
      const result = JSON.parse(stdout)
      res.json(result)
    } catch {
      res.json({ success: true, message: stdout })
    }
  })
})

// Histórico de importações
app.get('/api/pmt/history', (req, res) => {
  try {
    const db = getSqliteDb()
    if (!db) return res.json([])
    const imports = db.prepare(`
      SELECT * FROM pmt_imports ORDER BY id DESC LIMIT 20
    `).all()
    res.json(imports)
  } catch (e) {
    res.json([])
  }
})

// Matriz diária por Modal para o indicador (Pedidos TT, Peças TT, Cubagem TT)
app.get('/api/pmt/daily-matrix', (req, res) => {
  const ano = parseInt(req.query.ano || '2026', 10)
  const mes = parseInt(req.query.mes || '10', 10)
  const cd = String(req.query.cd || '994').trim()

  try {
    const db = getSqliteDb()
    if (!db) return res.status(404).json({ error: 'Banco SQLite dev.db não disponível.' })

    const daysInMonth = new Date(ano, mes, 0).getDate()
    const weekdayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
    
    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(ano, mes - 1, d)
      const dayStr = String(d).padStart(2, '0')
      days.push({
        day: d,
        dayStr: dayStr,
        weekdayLetter: weekdayLetters[dateObj.getDay()]
      })
    }

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

    const rows = db.prepare(`
      SELECT 
        modal,
        SUBSTR(dia, 9, 2) as dia_mes,
        SUM(pedido_plan_diario_cd) as pedidos,
        SUM(pecas_plan_diario_cd) as pecas,
        SUM(cub_plan_diario_cd) as cub
      FROM pmt_records
      WHERE cd = ? AND ano = ? AND mes = ? AND dia IS NOT NULL
      GROUP BY modal, dia_mes
    `).all(cd, ano, mes)

    const data = {
      pedidos: {},
      pecas: {},
      cubagem: {}
    }

    expectedModals.forEach(m => {
      data.pedidos[m] = { total: 0 }
      data.pecas[m] = { total: 0 }
      data.cubagem[m] = { total: 0 }
      days.forEach(d => {
        data.pedidos[m][d.dayStr] = 0
        data.pecas[m][d.dayStr] = 0
        data.cubagem[m][d.dayStr] = 0
      })
    })

    rows.forEach(r => {
      const m = r.modal
      const d = r.dia_mes
      if (data.pedidos[m]) {
        const ped = Number(r.pedidos || 0)
        const pec = Number(r.pecas || 0)
        const cub = Number(r.cub || 0)

        data.pedidos[m][d] = Math.round(ped)
        data.pedidos[m].total += ped

        data.pecas[m][d] = Math.round(pec)
        data.pecas[m].total += pec

        data.cubagem[m][d] = Math.round(cub)
        data.cubagem[m].total += cub
      }
    })

    // Arredonda os totais gerais por modal
    expectedModals.forEach(m => {
      data.pedidos[m].total = Math.round(data.pedidos[m].total)
      data.pecas[m].total = Math.round(data.pecas[m].total)
      data.cubagem[m].total = Math.round(data.cubagem[m].total)
    })

    // Totais diários e gerais por seção (Pedidos TT, Peças TT, Cubagem TT)
    const totals = {
      pedidos: { total: 0 },
      pecas: { total: 0 },
      cubagem: { total: 0 }
    }

    days.forEach(d => {
      let sumPed = 0
      let sumPec = 0
      let sumCub = 0
      expectedModals.forEach(m => {
        sumPed += data.pedidos[m][d.dayStr] || 0
        sumPec += data.pecas[m][d.dayStr] || 0
        sumCub += data.cubagem[m][d.dayStr] || 0
      })
      totals.pedidos[d.dayStr] = sumPed
      totals.pedidos.total += sumPed

      totals.pecas[d.dayStr] = sumPec
      totals.pecas.total += sumPec

      totals.cubagem[d.dayStr] = sumCub
      totals.cubagem.total += sumCub
    })

    // Totais finais arredondados correspondentes aos somatórios brutos
    let rawTotalPed = 0, rawTotalPec = 0, rawTotalCub = 0
    rows.forEach(r => {
      rawTotalPed += Number(r.pedidos || 0)
      rawTotalPec += Number(r.pecas || 0)
      rawTotalCub += Number(r.cub || 0)
    })
    totals.pedidos.total = Math.round(rawTotalPed)
    totals.pecas.total = Math.round(rawTotalPec)
    totals.cubagem.total = Math.round(rawTotalCub)

    res.json({
      ano,
      mes,
      cd,
      days,
      modals: expectedModals,
      data,
      totals
    })
  } catch (err) {
    console.error('Erro /api/pmt/daily-matrix:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend API rodando com Supabase em http://localhost:${PORT}`)
})
