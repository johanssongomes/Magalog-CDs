import React, { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  Calendar,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Truck,
  Users,
  Box,
  Hash,
  Activity,
  X
} from 'lucide-react'

// Estrutura de cada linha do Recebimento Fornecedor
export interface RecebimentoItem {
  id: string
  portaria: string        // "Chegou" | "Não Chegou"
  tmpMed: string          // "1:18:18", etc.
  inicio: string          // "08:20:00"
  fim: string             // "11:05:00"
  tempo: string           // "02:45:00"
  agenda: string          // "76308", "2029585"
  doca: string            // "41", "36"
  statusGeral: string     // "FINALIZADA" | "EM ANDAMENTO" | "AGUARDANDO DESCARGA" | "NO SHOW" | "AGENDA ANTECIPADA" | "DEVOLVIDA" | "PARA O DIA SEGUINTE"
  conferente: string      // "JEFERSON", "NELSON", etc.
  equipe: string          // "3", "4", "5"
  fornecedor: string      // "ITATIAIA ELE...", "ELECTROLUX DO BRASIL S/A"
  categoria: string       // "PORTATEIS", "ELETRO PES...", "MADEIRA", etc.
  sku: number             // quantidade de skus
  volume: number          // volume de peças
  reslog: number          // divergência / reslog
  cubagem: number         // m³
  data: string            // "31/10/2026", "01/11/2026", "02/11/2026"
}

// Dados iniciais e de fallback (extraídos do print do sistema real)
const SAMPLE_RECEBIMENTO_DATA: RecebimentoItem[] = [
  {
    id: '1',
    portaria: 'Não Chegou',
    tmpMed: '4:29:25',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '2029585',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'MAGAZINE LUIZA S/A',
    categoria: 'TRANSFERÊNCIA',
    sku: 1,
    volume: 100,
    reslog: 0,
    cubagem: 42.3,
    data: '02/11/2026'
  },
  {
    id: '2',
    portaria: 'Não Chegou',
    tmpMed: '4:29:25',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '2029614',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'MAGAZINE LUIZA S/A',
    categoria: 'TRANSFERÊNCIA',
    sku: 1,
    volume: 100,
    reslog: 0,
    cubagem: 42.3,
    data: '02/11/2026'
  },
  {
    id: '3',
    portaria: 'Chegou',
    tmpMed: '3:47:33',
    inicio: '08:20:00',
    fim: '11:05:00',
    tempo: '02:45:00',
    agenda: '76308',
    doca: '41',
    statusGeral: 'FINALIZADA',
    conferente: 'JEFERSON',
    equipe: '3',
    fornecedor: 'ITATIAIA ELETRONICOS LTDA',
    categoria: 'PORTATEIS',
    sku: 2,
    volume: 6324,
    reslog: 0,
    cubagem: 180.5,
    data: '02/11/2026'
  },
  {
    id: '4',
    portaria: 'Chegou',
    tmpMed: '1:14:05',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '75771',
    doca: '36',
    statusGeral: 'EM ANDAMENTO',
    conferente: 'NELSON',
    equipe: '5',
    fornecedor: 'MIDEA INDUSTRIA E COMERCIO DO BRASIL LTDA',
    categoria: 'FOB ELETRO...',
    sku: 1,
    volume: 94,
    reslog: 10,
    cubagem: 32.1,
    data: '02/11/2026'
  },
  {
    id: '5',
    portaria: 'Não Chegou',
    tmpMed: '1:54:55',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '76314',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'SAMSUNG ELETRONICA DA AMAZONIA LTDA',
    categoria: 'ELETRÔNICOS',
    sku: 2,
    volume: 974,
    reslog: 0,
    cubagem: 85.0,
    data: '02/11/2026'
  },
  {
    id: '6',
    portaria: 'Não Chegou',
    tmpMed: '1:54:55',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '76313',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'SAMSUNG ELETRONICA DA AMAZONIA LTDA',
    categoria: 'ELETRÔNICOS',
    sku: 2,
    volume: 478,
    reslog: 0,
    cubagem: 42.0,
    data: '02/11/2026'
  },
  {
    id: '7',
    portaria: 'Não Chegou',
    tmpMed: '1:54:55',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '76258',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'SAMSUNG ELETRONICA DA AMAZONIA LTDA',
    categoria: 'ELETRÔNICOS',
    sku: 1,
    volume: 184,
    reslog: 0,
    cubagem: 16.5,
    data: '02/11/2026'
  },
  {
    id: '8',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '11:30:00',
    fim: '',
    tempo: '00:50:54',
    agenda: '75065',
    doca: '40',
    statusGeral: 'EM ANDAMENTO',
    conferente: 'JEFERSON',
    equipe: '4',
    fornecedor: 'WHIRLPOOL S/A',
    categoria: 'ELETRO PES...',
    sku: 1,
    volume: 144,
    reslog: 0,
    cubagem: 114.17,
    data: '02/11/2026'
  },
  {
    id: '9',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '75974',
    doca: '35',
    statusGeral: 'AGUARDANDO DESCARGA',
    conferente: '',
    equipe: '',
    fornecedor: 'ELECTROLUX DO BRASIL S/A',
    categoria: 'ELETRO PES...',
    sku: 4,
    volume: 215,
    reslog: 0,
    cubagem: 74.2,
    data: '02/11/2026'
  },
  {
    id: '10',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '06:30:00',
    fim: '08:10:00',
    tempo: '01:40:00',
    agenda: '76088',
    doca: '40',
    statusGeral: 'FINALIZADA',
    conferente: 'FIRMO',
    equipe: '4',
    fornecedor: 'ELECTROLUX DO BRASIL S/A',
    categoria: 'ELETRO PES...',
    sku: 2,
    volume: 211,
    reslog: 0,
    cubagem: 72.8,
    data: '02/11/2026'
  },
  {
    id: '11',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '75941',
    doca: '41',
    statusGeral: 'AGUARDANDO DESCARGA',
    conferente: '',
    equipe: '',
    fornecedor: 'ELECTROLUX DO BRASIL S/A',
    categoria: 'ELETRO PES...',
    sku: 1,
    volume: 138,
    reslog: 0,
    cubagem: 47.6,
    data: '02/11/2026'
  },
  {
    id: '12',
    portaria: 'Não Chegou',
    tmpMed: '1:18:18',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '76427',
    doca: '',
    statusGeral: 'NO SHOW',
    conferente: '',
    equipe: '',
    fornecedor: 'WHIRLPOOL S/A',
    categoria: 'ELETRO PES...',
    sku: 1,
    volume: 192,
    reslog: 0,
    cubagem: 66.2,
    data: '02/11/2026'
  },
  {
    id: '13',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '08:55:00',
    fim: '10:00:00',
    tempo: '01:05:00',
    agenda: '76030',
    doca: '35',
    statusGeral: 'FINALIZADA',
    conferente: 'NELSON',
    equipe: '2',
    fornecedor: 'ELECTROLUX DO BRASIL S/A',
    categoria: 'ELETRO PES...',
    sku: 1,
    volume: 96,
    reslog: 0,
    cubagem: 33.1,
    data: '02/11/2026'
  },
  {
    id: '14',
    portaria: 'Chegou',
    tmpMed: '1:18:18',
    inicio: '',
    fim: '',
    tempo: '',
    agenda: '75647',
    doca: '32',
    statusGeral: 'AGUARDANDO DESCARGA',
    conferente: '',
    equipe: '',
    fornecedor: 'CLIMAZON INDUSTRIAL LTDA',
    categoria: 'ELETRO PES...',
    sku: 1,
    volume: 578,
    reslog: 0,
    cubagem: 200.6,
    data: '02/11/2026'
  },
  {
    id: '15',
    portaria: 'Chegou',
    tmpMed: '1:06:04',
    inicio: '07:35:00',
    fim: '08:40:00',
    tempo: '01:05:00',
    agenda: '70802',
    doca: '31',
    statusGeral: 'FINALIZADA',
    conferente: 'NELSON',
    equipe: '4',
    fornecedor: 'UMAFLEX INDUSTRIA DE MOVEIS COLCHOES E ESPUMAS',
    categoria: 'COLCHÃO/ E...',
    sku: 1,
    volume: 82,
    reslog: 5,
    cubagem: 49.2,
    data: '02/11/2026'
  },
  {
    id: '16',
    portaria: 'Chegou',
    tmpMed: '1:06:04',
    inicio: '06:30:00',
    fim: '07:10:00',
    tempo: '00:40:00',
    agenda: '70801',
    doca: '36',
    statusGeral: 'FINALIZADA',
    conferente: 'NELSON',
    equipe: '4',
    fornecedor: 'UMAFLEX INDUSTRIA DE MOVEIS COLCHOES E ESPUMAS',
    categoria: 'COLCHÃO/ E...',
    sku: 1,
    volume: 82,
    reslog: 5,
    cubagem: 49.2,
    data: '02/11/2026'
  },
  {
    id: '17',
    portaria: 'Chegou',
    tmpMed: '1:06:04',
    inicio: '10:10:00',
    fim: '11:35:00',
    tempo: '01:25:00',
    agenda: '76711',
    doca: '32',
    statusGeral: 'FINALIZADA',
    conferente: 'FIRMO',
    equipe: '4',
    fornecedor: 'PLUMATEX COLCHOES INDUSTRIAL LTDA',
    categoria: 'COLCHÃO/ E...',
    sku: 10,
    volume: 158,
    reslog: 26,
    cubagem: 94.8,
    data: '02/11/2026'
  },
  {
    id: '18',
    portaria: 'Chegou',
    tmpMed: '1:06:42',
    inicio: '12:50:00',
    fim: '13:10:00',
    tempo: '00:20:00',
    agenda: '76263',
    doca: '31',
    statusGeral: 'AGENDA ANTECIPADA',
    conferente: 'EMANUEL',
    equipe: '1',
    fornecedor: 'MK BR S.A',
    categoria: 'AUDIO E AUT...',
    sku: 1,
    volume: 18,
    reslog: 0,
    cubagem: 4.45,
    data: '02/11/2026'
  }
]

const TEMPO_MEDIO_CATEGORIAS: { categoria: string; tempoMedio: string }[] = [
  { categoria: 'MADEIRA - MO2', tempoMedio: '07:38:17' },
  { categoria: 'MADEIRA', tempoMedio: '07:15:29' },
  { categoria: 'PORTATEIS', tempoMedio: '03:47:33' },
  { categoria: 'PNEUS', tempoMedio: '04:29:04' },
  { categoria: 'AR E VENTILACAO', tempoMedio: '04:38:03' },
  { categoria: 'TRANSFERÊNCIA', tempoMedio: '04:29:25' },
  { categoria: 'BB/BR/BKF', tempoMedio: '03:26:13' }
]

const SHEET_SPREADSHEET_ID = '1s2cnuSCOFFnyFLc7s80eFH1oiGm1LHfGaJxO2dsioRI'
const SHEET_GID = '585841890'
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/edit?gid=${SHEET_GID}#gid=${SHEET_GID}`
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`

export const PmtRecebimentoPage: React.FC = () => {
  const [data, setData] = useState<RecebimentoItem[]>(SAMPLE_RECEBIMENTO_DATA)
  const [loading, setLoading] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<'sample' | 'live' | 'imported' | 'error'>('sample')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Filtros
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')
  const [selectedAgenda, setSelectedAgenda] = useState<string>('TODAS')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')
  const [selectedPortaria, setSelectedPortaria] = useState<string>('TODOS')
  const [selectedData, setSelectedData] = useState<string>('02/11/2026')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Modal de importação manual
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  // Carrega dados salvos no localStorage se houver
  useEffect(() => {
    try {
      const saved = localStorage.getItem('magalog_pmt_recebimento_data')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setData(parsed)
          setSyncStatus('imported')
        }
      }
    } catch {
      // Ignora
    }
  }, [])

  // Tenta sincronizar com o Google Sheets via CSV
  const fetchFromGoogleSheets = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch(CSV_URL)
      if (!res.ok) {
        throw new Error(`Planilha restrita ou indisponível (HTTP ${res.status}).`)
      }
      const csvText = await res.text()
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('accounts.google.com')) {
        throw new Error('Acesso restrito: libere no Google Sheets para "Qualquer pessoa com o link".')
      }
      parseAndSetData(csvText)
      setSyncStatus('live')
    } catch (err: any) {
      setSyncStatus('error')
      setErrorMessage(err.message || 'Erro ao sincronizar com Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  // Parse CSV ou Planilha Excel
  const parseAndSetData = (csvOrRows: string | any[][]) => {
    try {
      let rows: string[][] = []
      if (typeof csvOrRows === 'string') {
        const lines = csvOrRows.split('\n')
        rows = lines.map(line => {
          // split simples preservando aspas
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g
          const matches: string[] = []
          let m: RegExpExecArray | null
          while ((m = regex.exec(line)) !== null) {
            let val = m[1] || ''
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1).replace(/""/g, '"')
            }
            matches.push(val.trim())
            if (m.index === regex.lastIndex) regex.lastIndex++
          }
          return matches
        })
      } else {
        rows = csvOrRows as string[][]
      }

      if (rows.length < 2) return

      // Localiza linha de cabeçalho
      let headerIdx = 0
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = rows[i].join(' ').toUpperCase()
        if (rowStr.includes('PORTARIA') && rowStr.includes('STATUS GERAL')) {
          headerIdx = i
          break
        }
      }

      const headers = rows[headerIdx].map(h => (h || '').toUpperCase().trim())
      const colMap: Record<string, number> = {}
      headers.forEach((h, idx) => {
        if (h.includes('PORTARIA')) colMap['portaria'] = idx
        if (h.includes('STATUS GERAL')) colMap['statusGeral'] = idx
        if (h.includes('CONFERENTE')) colMap['conferente'] = idx
        if (h.includes('EQUIPE')) colMap['equipe'] = idx
        if (h.includes('DOCA')) colMap['doca'] = idx
        if (h.includes('TMP MED') || h.includes('TMP. MED') || h.includes('TEMPO MEDIO')) colMap['tmpMed'] = idx
        if (h.includes('INICIO') || h.includes('INÍCIO')) colMap['inicio'] = idx
        if (h.includes('FIM')) colMap['fim'] = idx
        if (h === 'TEMPO' || h.includes('TEMPO TOTAL')) colMap['tempo'] = idx
        if (h.includes('AGENDA')) colMap['agenda'] = idx
        if (h.includes('DATA')) colMap['data'] = idx
        if (h.includes('FORNECEDOR')) colMap['fornecedor'] = idx
        if (h.includes('CATEGORIA')) colMap['categoria'] = idx
        if (h.includes('SKU')) colMap['sku'] = idx
        if (h.includes('VOLUME')) colMap['volume'] = idx
        if (h.includes('CUBAGEM')) colMap['cubagem'] = idx
        if (h.includes('RESLOG') || h.includes('DIVERG')) colMap['reslog'] = idx
      })

      const parsedItems: RecebimentoItem[] = []
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue
        const statusGeral = (row[colMap['statusGeral']] || '').trim().toUpperCase()
        const agenda = (row[colMap['agenda']] || '').trim()
        const fornecedor = (row[colMap['fornecedor']] || '').trim()

        if (!statusGeral && !agenda && !fornecedor) continue

        const parseNum = (v: any) => {
          if (!v) return 0
          const clean = String(v).replace(/\./g, '').replace(',', '.')
          const n = parseFloat(clean)
          return isNaN(n) ? 0 : n
        }

        parsedItems.push({
          id: `item-${i}-${agenda}`,
          portaria: (row[colMap['portaria']] || 'Chegou').trim(),
          tmpMed: (row[colMap['tmpMed']] || '').trim(),
          inicio: (row[colMap['inicio']] || '').trim(),
          fim: (row[colMap['fim']] || '').trim(),
          tempo: (row[colMap['tempo']] || '').trim(),
          agenda: agenda,
          doca: (row[colMap['doca']] || '').trim(),
          statusGeral: statusGeral || 'EM ANDAMENTO',
          conferente: (row[colMap['conferente']] || '').trim(),
          equipe: (row[colMap['equipe']] || '').trim(),
          fornecedor: fornecedor,
          categoria: (row[colMap['categoria']] || 'GERAL').trim(),
          sku: Math.round(parseNum(row[colMap['sku']] || 1)),
          volume: Math.round(parseNum(row[colMap['volume']] || 0)),
          reslog: Math.round(parseNum(row[colMap['reslog']] || 0)),
          cubagem: Number(parseNum(row[colMap['cubagem']] || 0).toFixed(2)),
          data: (row[colMap['data']] || '02/11/2026').trim()
        })
      }

      if (parsedItems.length > 0) {
        setData(parsedItems)
        localStorage.setItem('magalog_pmt_recebimento_data', JSON.stringify(parsedItems))
        setImportNotice(`Sucesso! ${parsedItems.length} registros de recebimento importados.`)
      }
    } catch (e: any) {
      setImportNotice(`Falha no processamento: ${e.message}`)
    }
  }

  // Importar arquivo do computador (XLSX ou CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        // Tenta achar a aba 99• FORNECEDOR ou pega a primeira
        const sheetName = wb.SheetNames.find(s => s.includes('FORNECEDOR')) || wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
        parseAndSetData(jsonData)
        setSyncStatus('imported')
      } catch (err: any) {
        setImportNotice(`Erro ao ler arquivo Excel: ${err.message}`)
      }
    }
    reader.readAsBinaryString(file)
  }

  // Listas distintas para os filtros
  const categoriasList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.categoria) set.add(d.categoria) })
    return Array.from(set).sort()
  }, [data])

  const agendasList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.agenda) set.add(d.agenda) })
    return Array.from(set).sort()
  }, [data])

  const datesList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.data) set.add(d.data) })
    return Array.from(set)
  }, [data])

  // Filtragem dos dados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedData !== 'TODAS' && item.data !== selectedData) return false
      if (selectedCategoria !== 'TODAS' && item.categoria !== selectedCategoria) return false
      if (selectedAgenda !== 'TODAS' && item.agenda !== selectedAgenda) return false
      if (selectedStatus !== 'TODOS' && item.statusGeral !== selectedStatus) return false
      if (selectedPortaria !== 'TODOS' && item.portaria !== selectedPortaria) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          item.fornecedor.toLowerCase().includes(term) ||
          item.agenda.toLowerCase().includes(term) ||
          item.conferente.toLowerCase().includes(term) ||
          item.categoria.toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })
  }, [data, selectedData, selectedCategoria, selectedAgenda, selectedStatus, selectedPortaria, searchTerm])

  // Resumo de Portaria
  const portariaResumo = useMemo(() => {
    let chegou = 0
    let naoChegou = 0
    filteredData.forEach(d => {
      if (d.portaria.toLowerCase().includes('não') || d.portaria.toLowerCase().includes('nao')) {
        naoChegou++
      } else {
        chegou++
      }
    })
    return { chegou, naoChegou }
  }, [filteredData])

  // Resumo por Status Geral (Tabela Superior Direita)
  const statusResumo = useMemo(() => {
    const groups: Record<string, { status: string; agendaCount: number; skuSum: number; volumeSum: number; cubagemSum: number }> = {}

    filteredData.forEach(d => {
      const st = d.statusGeral || 'OUTROS'
      if (!groups[st]) {
        groups[st] = {
          status: st,
          agendaCount: 0,
          skuSum: 0,
          volumeSum: 0,
          cubagemSum: 0
        }
      }
      groups[st].agendaCount += 1
      groups[st].skuSum += d.sku || 0
      groups[st].volumeSum += d.volume || 0
      groups[st].cubagemSum += d.cubagem || 0
    })

    const list = Object.values(groups)

    const total = {
      agendaCount: list.reduce((acc, curr) => acc + curr.agendaCount, 0),
      skuSum: list.reduce((acc, curr) => acc + curr.skuSum, 0),
      volumeSum: list.reduce((acc, curr) => acc + curr.volumeSum, 0),
      cubagemSum: list.reduce((acc, curr) => acc + curr.cubagemSum, 0)
    }

    return { list, total }
  }, [filteredData])

  // Cores de Status no visual do print
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s.includes('FINALIZADA')) {
      return 'bg-emerald-600 text-white font-bold'
    }
    if (s.includes('EM ANDAMENTO')) {
      return 'bg-blue-600 text-white font-bold'
    }
    if (s.includes('AGUARDANDO')) {
      return 'bg-sky-100 text-sky-800 border border-sky-300 font-semibold'
    }
    if (s.includes('NO SHOW')) {
      return 'bg-slate-100 text-slate-700 font-bold border border-slate-200'
    }
    if (s.includes('ANTECIPADA')) {
      return 'bg-teal-100 text-teal-800 font-bold border border-teal-300'
    }
    return 'bg-amber-100 text-amber-800 font-semibold'
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          BARRA DE FERRAMENTAS E STATUS DE CONEXÃO COM O GOOGLE SHEETS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Truck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recebimento CD 6994 &bull; Acompanhamento de Fornecedor
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                syncStatus === 'live'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : syncStatus === 'imported'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {syncStatus === 'live' ? 'Online (Google Sheets)' : syncStatus === 'imported' ? 'Base Carregada' : 'Modo Demonstração'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aba 99• FORNECEDOR &bull; Visão integrada com status geral, portaria, tempo de descarga e volumes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Abrir Planilha Oficial</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>

          <button
            type="button"
            onClick={fetchFromGoogleSheets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Sincronizar Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <UploadCloud size={14} className="text-blue-600" />
            <span>Importar XLSX / CSV</span>
          </button>
        </div>
      </div>

      {/* Alerta de erro de conexão com Sheets (com instrução amigável) */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Atenção:</strong> {errorMessage} Para sincronização direta, altere no Google Sheets o Compartilhamento para <strong>Qualquer pessoa com o link (Leitor)</strong> ou faça o upload manual abaixo.
            </span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* =========================================================================
          BLOCO SUPERIOR — CARDS & RESUMOS IDÊNTICOS AO MODELO
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LADO ESQUERDO: TEMPO MÉDIO POR CATEGORIA (Lg: col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Categoria
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tempo Médio
              </span>
            </div>
            <div className="space-y-1.5">
              {TEMPO_MEDIO_CATEGORIAS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 text-xs transition-colors"
                >
                  <span className="font-semibold text-slate-700 truncate pr-2">
                    {item.categoria}
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {item.tempoMedio}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD DE PORTARIA (CHEGOU X NÃO CHEGOU) */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedPortaria(selectedPortaria === 'Chegou' ? 'TODOS' : 'Chegou')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPortaria === 'Chegou'
                  ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200/80 text-amber-900'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">
                Portaria &bull; Chegou
              </span>
              <div className="text-2xl font-bold tracking-tight mt-0.5 font-mono">
                {portariaResumo.chegou}
              </div>
            </div>

            <div
              onClick={() => setSelectedPortaria(selectedPortaria === 'Não Chegou' ? 'TODOS' : 'Não Chegou')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedPortaria === 'Não Chegou'
                  ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">
                Portaria &bull; Não Chegou
              </span>
              <div className="text-2xl font-bold tracking-tight mt-0.5 font-mono">
                {portariaResumo.naoChegou}
              </div>
            </div>
          </div>
        </div>

        {/* CENTRO: FILTROS DINÂMICOS DE CATEGORIA & AGENDA (Lg: col-span-3) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block mb-1">
                Filtro por Categoria
              </span>
              <div className="relative">
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer transition-all"
                >
                  <option value="TODAS" className="text-slate-900">Todas as Categorias ({categoriasList.length})</option>
                  {categoriasList.map(cat => (
                    <option key={cat} value={cat} className="text-slate-900">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block mb-1">
                Filtro por Agenda
              </span>
              <div className="relative">
                <select
                  value={selectedAgenda}
                  onChange={(e) => setSelectedAgenda(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer transition-all"
                >
                  <option value="TODAS" className="text-slate-900">Todas as Agendas ({agendasList.length})</option>
                  {agendasList.map(ag => (
                    <option key={ag} value={ag} className="text-slate-900">Agenda {ag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
            <span>Registros exibidos:</span>
            <span className="font-mono font-bold text-white text-sm">
              {filteredData.length} de {data.length}
            </span>
          </div>
        </div>

        {/* LADO DIREITO: RESUMO STATUS GERAL (AGENDA, SKU, VOLUME, CUBAGEM) (Lg: col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Seletor de Período de Datas idêntico ao modelo */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  {selectedData === 'TODAS' ? 'Período Completo' : `${selectedData} - ${selectedData}`}
                </span>
              </div>
              <select
                value={selectedData}
                onChange={(e) => setSelectedData(e.target.value)}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="02/11/2026">02/11/2026</option>
                <option value="01/11/2026">01/11/2026</option>
                <option value="31/10/2026">31/10/2026</option>
                <option value="TODAS">Todos os Dias</option>
              </select>
            </div>

            {/* Tabela de Resumo por Status */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-1.5 px-2 text-left">Status Geral</th>
                    <th className="py-1.5 px-2 text-right">Agenda</th>
                    <th className="py-1.5 px-2 text-right">SKU</th>
                    <th className="py-1.5 px-2 text-right">Volume</th>
                    <th className="py-1.5 px-2 text-right">Cubagem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statusResumo.list.map((st, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedStatus(selectedStatus === st.status ? 'TODOS' : st.status)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                        selectedStatus === st.status ? 'bg-blue-50 font-bold' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 font-medium text-slate-800 truncate max-w-[120px]">
                        {st.status}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-700 bg-blue-50/50">
                        {st.agendaCount}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-700 bg-emerald-50/40">
                        {st.skuSum}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-700 bg-rose-50/40 font-bold">
                        {st.volumeSum.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-amber-700 bg-amber-50/40">
                        {st.cubagemSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold bg-slate-100 text-slate-900">
                    <td className="py-2 px-2 uppercase text-[11px]">Total Geral</td>
                    <td className="py-2 px-2 text-right font-mono text-blue-800">{statusResumo.total.agendaCount}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-800">{statusResumo.total.skuSum}</td>
                    <td className="py-2 px-2 text-right font-mono text-rose-800">{statusResumo.total.volumeSum.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 text-right font-mono text-amber-800">
                      {statusResumo.total.cubagemSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABELA PRINCIPAL DE ACOMPANHAMENTO DIÁRIO (DETALHAMENTO OPERACIONAL)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Barra de Pesquisa e Filtros Rápidos */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Acompanhamento Operacional por Agenda
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-bold">
              {filteredData.length} registros
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar fornecedor, agenda, conferente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 w-64 transition-all"
              />
            </div>

            {(selectedCategoria !== 'TODAS' || selectedAgenda !== 'TODAS' || selectedStatus !== 'TODOS' || selectedPortaria !== 'TODOS' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoria('TODAS')
                  setSelectedAgenda('TODAS')
                  setSelectedStatus('TODOS')
                  setSelectedPortaria('TODOS')
                  setSearchTerm('')
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela com as cores e colunas exatas do modelo */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wide uppercase">
                <th className="py-2.5 px-3">Portaria</th>
                <th className="py-2.5 px-2">Tmp Med</th>
                <th className="py-2.5 px-2">Início</th>
                <th className="py-2.5 px-2">Fim</th>
                <th className="py-2.5 px-2">Tempo</th>
                <th className="py-2.5 px-2.5">Agenda</th>
                <th className="py-2.5 px-2 text-center">Doca</th>
                <th className="py-2.5 px-3 text-center">Status Geral</th>
                <th className="py-2.5 px-3">Conferente</th>
                <th className="py-2.5 px-2 text-center">Equipe</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-2 text-center">SKU</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-2 text-center">Reslog</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const isChegou = item.portaria.toLowerCase().includes('chegou') && !item.portaria.toLowerCase().includes('não') && !item.portaria.toLowerCase().includes('nao')
                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                      {/* Portaria (amarelo claro quando Chegou, como no print) */}
                      <td className={`py-2 px-3 font-semibold ${isChegou ? 'bg-amber-100 text-amber-950 font-bold' : 'text-slate-500'}`}>
                        {item.portaria}
                      </td>

                      {/* Tmp Med */}
                      <td className="py-2 px-2 font-mono text-slate-700 bg-amber-50/30 text-[11px]">
                        {item.tmpMed || '-'}
                      </td>

                      {/* Início */}
                      <td className="py-2 px-2 font-mono text-slate-600 text-[11px]">
                        {item.inicio || '-'}
                      </td>

                      {/* Fim */}
                      <td className="py-2 px-2 font-mono text-slate-600 text-[11px]">
                        {item.fim || '-'}
                      </td>

                      {/* Tempo */}
                      <td className="py-2 px-2 font-mono font-bold text-slate-800 text-[11px]">
                        {item.tempo || '-'}
                      </td>

                      {/* Agenda */}
                      <td className="py-2 px-2.5 font-mono font-bold text-blue-600">
                        {item.agenda}
                      </td>

                      {/* Doca */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 bg-slate-50">
                        {item.doca || '-'}
                      </td>

                      {/* Status Geral */}
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] tracking-wide ${getStatusBadge(item.statusGeral)}`}>
                          {item.statusGeral}
                        </span>
                      </td>

                      {/* Conferente */}
                      <td className="py-2 px-3 font-semibold text-slate-800 uppercase text-[11px]">
                        {item.conferente || '-'}
                      </td>

                      {/* Equipe */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                        {item.equipe || '-'}
                      </td>

                      {/* Fornecedor */}
                      <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[220px]" title={item.fornecedor}>
                        {item.fornecedor}
                      </td>

                      {/* Categoria */}
                      <td className="py-2 px-3 font-semibold text-slate-600 text-[11px] truncate max-w-[130px]">
                        {item.categoria}
                      </td>

                      {/* SKU */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/50">
                        {item.sku}
                      </td>

                      {/* Volume (destacado em azul como no print para grandes volumes) */}
                      <td className={`py-2 px-3 text-right font-mono font-bold ${item.volume > 1000 ? 'bg-cyan-500 text-white rounded' : 'text-slate-900 bg-slate-50/70'}`}>
                        {item.volume.toLocaleString('pt-BR')}
                      </td>

                      {/* Reslog (destaque rosa/magenta quando > 0) */}
                      <td className={`py-2 px-2 text-center font-mono font-bold ${item.reslog > 0 ? 'bg-pink-500 text-white rounded' : 'text-slate-400'}`}>
                        {item.reslog}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: IMPORTAÇÃO MANUAL DE PLANILHA (XLSX / CSV)
          ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importar Dados de Recebimento</h3>
                  <p className="text-xs text-slate-500">Planilha Excel (.xlsx) ou CSV com a aba 99• FORNECEDOR</p>
                </div>
              </div>
              <button
                onClick={() => { setIsImportModalOpen(false); setImportNotice(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {importNotice && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                {importNotice}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Selecione a planilha do seu computador:
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Você pode baixar a planilha do Google Drive em <em>Arquivo &gt; Fazer download &gt; Microsoft Excel (.xlsx)</em> e carregá-la diretamente aqui.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setImportNotice(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

