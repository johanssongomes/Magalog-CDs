import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function migrate() {
  console.log('🚀 Iniciando conexão e verificação com Supabase...')
  const dataPath = path.join(__dirname, '../data.json')
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Arquivo data.json não encontrado.')
    return
  }

  const raw = fs.readFileSync(dataPath, 'utf-8')
  const jsonData = JSON.parse(raw || '{}')
  const keys = Object.keys(jsonData)

  console.log(`📦 Encontrados ${keys.length} registros no data.json para migrar.`)

  const records = keys.map(key => ({
    cell_key: key,
    value: String(jsonData[key])
  }))

  if (records.length === 0) {
    console.log('ℹ️ Nenhum dado para migrar.')
    return
  }

  const { data, error } = await supabase
    .from('performance_metrics')
    .upsert(records, { onConflict: 'cell_key' })

  if (error) {
    console.error('⚠️ Erro Supabase:', error.message)
  } else {
    console.log('✅ Migração de registros concluída com SUCESSO no Supabase!')
  }
}

migrate()
