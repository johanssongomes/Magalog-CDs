import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.join(__dirname, '../data.json')

// Helper para ler dados do arquivo JSON
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8')
    return {}
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch (err) {
    console.error('Erro ao ler data.json:', err)
    return {}
  }
}

// Helper para salvar dados no arquivo JSON
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Erro ao gravar data.json:', err)
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
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Node/Express', 'JSON File DB']
  })
})

// Obter todas as métricas salvas no banco JSON
app.get('/api/performance', (req, res) => {
  const data = readData()
  res.json(data)
})

// Salvar / atualizar uma métrica individual
app.post('/api/performance', (req, res) => {
  const { cellKey, value } = req.body
  if (!cellKey) {
    return res.status(400).json({ error: 'cellKey é obrigatório' })
  }
  const data = readData()
  data[cellKey] = value
  saveData(data)
  res.json({ success: true, cellKey, value })
})

// Salvar todas as métricas em lote (bulk)
app.post('/api/performance/bulk', (req, res) => {
  const dataMap = req.body || {}
  const data = readData()
  Object.assign(data, dataMap)
  saveData(data)
  res.json({ success: true, count: Object.keys(dataMap).length })
})

app.listen(PORT, () => {
  console.log(`Backend API rodando em http://localhost:${PORT}`)
})
