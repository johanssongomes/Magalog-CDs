import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Example Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    stack: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Node/Express', 'Prisma', 'Supabase']
  })
})

app.get('/api/pages', (req, res) => {
  res.json([
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'catalog', label: 'Equipamentos' },
    { id: 'inventory', label: 'Estoque' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'settings', label: 'Configurações' }
  ])
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
