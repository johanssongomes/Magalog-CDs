import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

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

app.listen(PORT, () => {
  console.log(`Backend API rodando com Supabase em http://localhost:${PORT}`)
})
