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
  Check,
  Layers,
  ArrowUpDown,
  Truck,
  Users,
  Box,
  Hash,
  Activity,
  BarChart2,
  Table as TableIcon,
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

// Estrutura de cada item de produto da aba "Itens Ag"
export interface ItemAgendamento {
  agenda: string
  sku: string
  descricao: string
  qtAgenda: number
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

// Ordem de prioridade operacional para classificação por Status Geral
const STATUS_PRIORITY: Record<string, number> = {
  'EM ANDAMENTO': 1,
  'AGUARDANDO DESCARGA': 2,
  'AGENDA ANTECIPADA': 3,
  'FINALIZADA': 4,
  'PARA O DIA SEGUINTE': 5,
  'DEVOLVIDA': 6,
  'NO SHOW': 7
}

const SHEET_SPREADSHEET_ID = '1s2cnuSCOFFnyFLc7s80eFH1oiGm1LHfGaJxO2dsioRI'
const SHEET_GID = '585841890'
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/edit?gid=${SHEET_GID}#gid=${SHEET_GID}`
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`
const ITENS_AG_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Itens Ag')}`
const ITENS_AG_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Itens Ag')}`

// Componente Dropdown com Suporte a Múltipla Seleção e Busca
interface MultiSelectDropdownProps {
  label: string
  icon: React.ReactNode
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholderAll?: string
  colorClass?: string
  widthClass?: string
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  placeholderAll = 'Todos',
  colorClass = 'text-blue-600',
  widthClass = 'min-w-[150px]'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOption = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt))
    } else {
      onChange([...selectedValues, opt])
    }
  }

  const selectAll = () => {
    onChange([])
  }

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(filterSearch.toLowerCase())
  )

  const isAll = selectedValues.length === 0

  let displayText = placeholderAll
  if (selectedValues.length === 1) {
    displayText = selectedValues[0]
  } else if (selectedValues.length > 1) {
    displayText = `${selectedValues.length} selecionados`
  }

  return (
    <div className={`relative ${widthClass}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-slate-50 border rounded-xl px-3 py-1.5 transition-all text-left cursor-pointer ${
          selectedValues.length > 0
            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
            : 'border-slate-200 hover:border-blue-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{icon}</div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono leading-none">
              {label}
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5 max-w-[130px]">
              {displayText}
            </span>
          </div>
        </div>
        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-60 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95">
          {options.length > 5 && (
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${label.toLowerCase()}...`}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-slate-100 text-[10px] font-bold">
            <button
              type="button"
              onClick={selectAll}
              className={`hover:underline cursor-pointer ${isAll ? 'text-blue-600' : 'text-slate-500'}`}
            >
              Marcar Todos
            </button>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-rose-600 hover:underline cursor-pointer"
              >
                Limpar ({selectedValues.length})
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5">
            <div
              onClick={selectAll}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                isAll ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{placeholderAll} ({options.length})</span>
              {isAll && <Check size={13} className="text-blue-600" />}
            </div>

            {filteredOptions.map((opt) => {
              const isChecked = selectedValues.includes(opt)
              return (
                <div
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
              )
            })}

            {filteredOptions.length === 0 && (
              <div className="py-3 text-center text-slate-400 text-[11px]">
                Nenhum resultado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const PmtRecebimentoPage: React.FC = () => {
  const [data, setData] = useState<RecebimentoItem[]>(SAMPLE_RECEBIMENTO_DATA)
  const [itensAgMap, setItensAgMap] = useState<Record<string, ItemAgendamento[]>>({})
  const [expandedAgendas, setExpandedAgendas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<'sample' | 'live' | 'imported' | 'error'>('sample')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Filtros operacionais baseados nos campos da planilha (múltipla seleção)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPortarias, setSelectedPortarias] = useState<string[]>([])
  const [selectedConferentes, setSelectedConferentes] = useState<string[]>([])
  const [selectedDocas, setSelectedDocas] = useState<string[]>([])
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([])
  const [selectedAgendas, setSelectedAgendas] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusSortOrder, setStatusSortOrder] = useState<'asc' | 'desc'>('asc')
  const [summaryViewMode, setSummaryViewMode] = useState<'status' | 'categoria' | 'grafico'>('status')

  // Modal de importação manual
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  // Auto-sincroniza com o Google Sheets no carregamento inicial
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [])

  // Tenta sincronizar com o Google Sheets via CSV (99• FORNECEDOR e Itens Ag)
  const fetchFromGoogleSheets = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      // 1. Busca dados da aba 99• FORNECEDOR
      const res = await fetch(CSV_URL)
      if (!res.ok) {
        throw new Error(`Planilha restrita ou indisponível (HTTP ${res.status}).`)
      }
      const csvText = await res.text()
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('accounts.google.com')) {
        throw new Error('Acesso restrito: libere no Google Sheets para "Qualquer pessoa com o link".')
      }
      parseAndSetData(csvText)

      // 2. Busca dados da aba Itens Ag (tenta primeiro via JSON gviz que é 100% estruturado)
      try {
        const resItens = await fetch(ITENS_AG_JSON_URL)
        if (resItens.ok) {
          const jsonText = await resItens.text()
          if (!jsonText.includes('<!DOCTYPE html>') && jsonText.includes('google.visualization.Query.setResponse')) {
            const rawJson = jsonText.replace(/^[^{]*\(/, '').replace(/\);?\s*$/, '')
            const parsed = JSON.parse(rawJson)
            if (parsed?.table?.rows) {
              const map: Record<string, ItemAgendamento[]> = {}
              parsed.table.rows.forEach((r: any) => {
                const ag = String(r.c?.[0]?.v ?? '').trim()
                const sku = String(r.c?.[15]?.v ?? '').trim()
                const desc = String(r.c?.[17]?.v ?? '').trim()
                const rawQt = String(r.c?.[22]?.v ?? '').trim()
                const qt = Math.round(parseFloat(rawQt.replace(',', '.'))) || 0
                if (!ag || (!sku && !desc)) return
                if (!map[ag]) map[ag] = []
                map[ag].push({
                  agenda: ag,
                  sku: sku || '—',
                  descricao: desc || 'Item sem descrição',
                  qtAgenda: qt
                })
              })
              setItensAgMap(map)
            }
          }
        }
      } catch {
        // Fallback para CSV se JSON falhar
        try {
          const resItensCsv = await fetch(ITENS_AG_CSV_URL)
          if (resItensCsv.ok) {
            const itensCsvText = await resItensCsv.text()
            if (!itensCsvText.includes('<!DOCTYPE html>')) {
              parseAndSetItensAg(itensCsvText)
            }
          }
        } catch { }
      }

      setSyncStatus('live')
    } catch (err: any) {
      setSyncStatus('error')
      setErrorMessage(err.message || 'Erro ao sincronizar com Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  // Parse da aba "Itens Ag"
  const parseAndSetItensAg = (csvOrRows: string | any[][]) => {
    try {
      let rows: string[][] = []
      if (typeof csvOrRows === 'string') {
        const lines = csvOrRows.split('\n')
        rows = lines.map(line => {
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

      let headerIdx = 0
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = rows[i].map(c => String(c || '')).join(' ').toUpperCase()
        if (rowStr.includes('AGENDA') && (rowStr.includes('SKU') || rowStr.includes('DESCRI'))) {
          headerIdx = i
          break
        }
      }

      const headers = rows[headerIdx].map(h => String(h || '').toUpperCase().trim())
      let colAgenda = headers.indexOf('AGENDA')
      let colSku = headers.findIndex(h => h === 'SKU' || h.includes('SKU'))
      let colDesc = headers.findIndex(h => h.includes('DESCRI') || h.includes('PRODUTO'))
      let colQt = headers.findIndex(h => h.includes('QT. AGENDA') || h.includes('QT AGENDA') || h.includes('QUANTIDADE'))

      if (colAgenda === -1) colAgenda = 0
      if (colSku === -1) colSku = 15
      if (colDesc === -1) colDesc = 17
      if (colQt === -1) colQt = 22

      const map: Record<string, ItemAgendamento[]> = {}
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length === 0) continue
        const ag = String(r[colAgenda] || '').trim()
        const sku = String(r[colSku] || '').trim()
        const desc = String(r[colDesc] || '').trim()

        // Trata número decimal com ponto ou vírgula (ex: "30.0" -> 30, "108.0" -> 108)
        const rawQt = String(r[colQt] || '').trim()
        let qt = 0
        if (rawQt) {
          // Se contiver vírgula como decimal (ex: 30,5 ou 1.000,00)
          if (rawQt.includes(',')) {
            qt = Math.round(parseFloat(rawQt.replace(/\./g, '').replace(',', '.'))) || 0
          } else {
            // Se contiver ponto decimal direto do Sheets (ex: "30.0", "108.0")
            qt = Math.round(parseFloat(rawQt)) || 0
          }
        }

        if (!ag || (!sku && !desc)) continue

        if (!map[ag]) map[ag] = []
        map[ag].push({
          agenda: ag,
          sku: sku || '—',
          descricao: desc || 'Item sem descrição',
          qtAgenda: qt
        })
      }

      setItensAgMap(map)
    } catch {
      // Ignora erro
    }
  }

  // Toggle de expansão de uma agenda
  const toggleAgendaExpand = (agenda: string) => {
    setExpandedAgendas(prev => {
      const next = new Set(prev)
      if (next.has(agenda)) {
        next.delete(agenda)
      } else {
        next.add(agenda)
      }
      return next
    })
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
      let headerIdx = -1
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const rowStr = rows[i].map(c => String(c || '')).join(' ').toUpperCase()
        if (rowStr.includes('PORTARIA') && (rowStr.includes('STATUS GERAL') || rowStr.includes('AGENDA') || rowStr.includes('FORNECEDOR'))) {
          headerIdx = i
          break
        }
      }

      if (headerIdx === -1) {
        headerIdx = 0
      }

      const headers = rows[headerIdx].map(h => String(h || '').toUpperCase().trim())
      console.log('Cabeçalhos encontrados na linha', headerIdx, headers)
      const colMap: Record<string, number> = {}

      headers.forEach((h, idx) => {
        // PORTARIA
        if (h === 'PORTARIA' || h.startsWith('PORTARIA')) colMap['portaria'] = idx
        // STATUS GERAL
        if (h === 'STATUS GERAL' || h.includes('STATUS GERAL') || h === 'STATUS') colMap['statusGeral'] = idx
        // CONFERENTE
        if (h === 'CONFERENTE' || h.includes('CONFERENTE')) colMap['conferente'] = idx
        // EQUIPE
        if (h === 'EQUIPE' || h.includes('EQUIPE')) colMap['equipe'] = idx
        // DOCA
        if (h === 'DOCA' || h.includes('DOCA')) colMap['doca'] = idx
        // TMP MED
        if (h.includes('TMP MED') || h.includes('TMP. MED') || h.includes('TEMPO MEDIO') || h.includes('TMP_MED') || h === 'TMP MED') colMap['tmpMed'] = idx
        // INICIO
        if (h === 'INICIO' || h === 'INÍCIO' || h.includes('INICIO') || h.includes('INÍCIO')) colMap['inicio'] = idx
        // FIM
        if (h === 'FIM' || h.includes('FIM')) colMap['fim'] = idx
        // TEMPO
        if (h === 'TEMPO' || h === 'TEMPO TOTAL' || h.includes('TEMPO')) {
          if (!colMap['tempo'] && !h.includes('MED')) colMap['tempo'] = idx
        }
        // AGENDA (evita D&F AGENDA ou prioriza AGENDA direta)
        if (h === 'AGENDA') {
          colMap['agenda'] = idx
        } else if (h.includes('AGENDA') && colMap['agenda'] === undefined) {
          colMap['agenda'] = idx
        }
        // DATA
        if (h === 'DATA' || h.includes('DATA')) colMap['data'] = idx
        // VEICULO
        if (h === 'VEICULO' || h.includes('VEICULO')) colMap['veiculo'] = idx
        // FORNECEDOR
        if (h === 'FORNECEDOR' || h.includes('FORNECEDOR')) colMap['fornecedor'] = idx
        // CATEGORIA
        if (h === 'CATEGORIA' || h.includes('CATEGORIA') || h.includes('CATEG')) colMap['categoria'] = idx
        // SKU
        if (h === 'SKU' || h.includes('SKU') || h === 'QTD SKU' || h === 'SKUS') colMap['sku'] = idx
        // VOLUME
        if (h === 'VOLUME' || h.includes('VOLUME') || h === 'VOLUMES' || h === 'PECAS' || h === 'PEÇAS' || h.includes('QTD')) {
          if (colMap['volume'] === undefined) colMap['volume'] = idx
        }
        // CUBAGEM
        if (h === 'CUBAGEM' || h.includes('CUBAGEM') || h === 'M3' || h === 'M³' || h.includes('CUB')) colMap['cubagem'] = idx
        // RESLOG
        if (h === 'RESLOG' || h.includes('RESLOG') || h.includes('DIVERG') || h.includes('DIF')) colMap['reslog'] = idx
      })

      // Fallback e mapeamento exato das posições reais da aba 99• FORNECEDOR:
      // B: PORTARIA (col 1)
      // C: STATUS GERAL (col 2)
      // D: CONFERENTE (col 3)
      // E: EQUIPE (col 4)
      // F: DOCA (col 5)
      // G: TMP MED (col 6)
      // H: INICIO (col 7)
      // I: FIM (col 8)
      // J: TEMPO (col 9)
      // K: D&F (col 10)
      // L: AGENDA (col 11)
      // M: DATA (col 12)
      // N: VEICULO (col 13)
      // O: FORNECEDOR (col 14)
      // P: TRANSP (col 15)
      // Q: STATUS_LUIZA GOL (col 16)
      // R: RESLOG (col 17)
      // S: VOLUME (col 18)
      // T: SKU (col 19)
      // W: CATEGORIA (col 22)
      // Y: CUBAGEM (col 24)
      colMap['portaria'] = colMap['portaria'] ?? 1
      colMap['statusGeral'] = colMap['statusGeral'] ?? 2
      colMap['conferente'] = colMap['conferente'] ?? 3
      colMap['equipe'] = colMap['equipe'] ?? 4
      colMap['doca'] = colMap['doca'] ?? 5
      colMap['tmpMed'] = colMap['tmpMed'] ?? 6
      colMap['inicio'] = colMap['inicio'] ?? 7
      colMap['fim'] = colMap['fim'] ?? 8
      colMap['tempo'] = colMap['tempo'] ?? 9
      colMap['agenda'] = colMap['agenda'] ?? 11
      colMap['data'] = colMap['data'] ?? 12
      colMap['fornecedor'] = colMap['fornecedor'] ?? 14
      colMap['reslog'] = colMap['reslog'] ?? 17
      colMap['volume'] = colMap['volume'] ?? 18
      colMap['sku'] = colMap['sku'] ?? 19
      colMap['categoria'] = colMap['categoria'] ?? 22
      colMap['cubagem'] = colMap['cubagem'] ?? 24

      const parsedItems: RecebimentoItem[] = []
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const getVal = (colKey: string) => {
          const idx = colMap[colKey]
          if (idx === undefined || idx < 0 || idx >= row.length) return ''
          return String(row[idx] ?? '').trim()
        }

        const statusGeral = getVal('statusGeral').toUpperCase()
        const agenda = getVal('agenda')
        const fornecedor = getVal('fornecedor')
        const portaria = getVal('portaria') || (statusGeral === 'NO SHOW' ? 'Não Chegou' : 'Chegou')

        // Se não tiver número de agenda preenchido na planilha, ignora a linha (não exibe no painel)
        if (!agenda || agenda === '-' || agenda === '#N/D' || agenda.toLowerCase() === 'null') {
          continue
        }

        if (!statusGeral && !fornecedor) continue

        const parseNum = (colKey: string, defaultVal: number = 0) => {
          const raw = getVal(colKey)
          if (!raw) return defaultVal
          const clean = raw.replace(/\./g, '').replace(',', '.')
          const n = parseFloat(clean)
          return isNaN(n) ? defaultVal : n
        }

        // Formata data caso venha como serial do Excel (ex: 46327)
        let dataFormatada = getVal('data')
        if (dataFormatada && !isNaN(Number(dataFormatada)) && Number(dataFormatada) > 30000) {
          const d = new Date((Number(dataFormatada) - 25569) * 86400 * 1000)
          const dd = String(d.getUTCDate()).padStart(2, '0')
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
          const yyyy = d.getUTCFullYear()
          dataFormatada = `${dd}/${mm}/${yyyy}`
        }

        let categoriaVal = getVal('categoria')
        if (!categoriaVal || categoriaVal === 'GERAL') {
          const fornUpper = fornecedor.toUpperCase()
          if (fornUpper.includes('ELECTROLUX') || fornUpper.includes('MIDEA') || fornUpper.includes('WHIRLPOOL') || fornUpper.includes('CLIMAZON')) {
            categoriaVal = 'ELETRO PESADO'
          } else if (fornUpper.includes('COLCH') || fornUpper.includes('UMAFLEX') || fornUpper.includes('PLUMATEX') || fornUpper.includes('GAZIN') || fornUpper.includes('COMFORT')) {
            categoriaVal = 'COLCHÃO/ ESTOFADOS'
          } else if (fornUpper.includes('MAGAZINE LUIZA')) {
            categoriaVal = 'TRANSFERÊNCIA'
          } else if (fornUpper.includes('SAMSUNG') || fornUpper.includes('TCL') || fornUpper.includes('SEMP')) {
            categoriaVal = 'ELETRÔNICOS'
          } else if (fornUpper.includes('ITATIAIA') || fornUpper.includes('MK BR')) {
            categoriaVal = 'PORTATEIS'
          } else {
            categoriaVal = 'GERAL'
          }
        }

        const skuNum = Math.max(0, Math.round(parseNum('sku', 1)))
        const volumeNum = Math.max(0, Math.round(parseNum('volume', 0)))
        const cubagemNum = Number(parseNum('cubagem', 0).toFixed(2))
        const reslogNum = Math.round(parseNum('reslog', 0))

        parsedItems.push({
          id: `item-${i}-${agenda}`,
          portaria: portaria,
          tmpMed: getVal('tmpMed'),
          inicio: getVal('inicio'),
          fim: getVal('fim'),
          tempo: getVal('tempo'),
          agenda: agenda,
          doca: getVal('doca'),
          statusGeral: statusGeral || 'EM ANDAMENTO',
          conferente: getVal('conferente'),
          equipe: getVal('equipe'),
          fornecedor: fornecedor || 'FORNECEDOR DIVERSOS',
          categoria: categoriaVal,
          sku: skuNum,
          volume: volumeNum,
          reslog: reslogNum,
          cubagem: cubagemNum,
          data: dataFormatada || (datesList[0] || 'SEM DATA')
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

        // Tenta carregar também aba Itens Ag do arquivo se presente
        const itensAgSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('itens ag') || s.toLowerCase().includes('itens'))
        if (itensAgSheetName) {
          const wsItens = wb.Sheets[itensAgSheetName]
          const jsonItens: any[][] = XLSX.utils.sheet_to_json(wsItens, { header: 1 })
          parseAndSetItensAg(jsonItens)
        }

        setSyncStatus('imported')
      } catch (err: any) {
        setImportNotice(`Erro ao ler arquivo Excel: ${err.message}`)
      }
    }
    reader.readAsBinaryString(file)
  }

  // Listas distintas para os filtros baseados nos campos da planilha
  const conferentesList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.conferente && d.conferente.trim()) set.add(d.conferente.trim()) })
    return Array.from(set).sort()
  }, [data])

  const docasList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.doca && d.doca.trim()) set.add(d.doca.trim()) })
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
  }, [data])

  const statusList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.statusGeral && d.statusGeral.trim()) set.add(d.statusGeral.trim()) })
    return Array.from(set).sort()
  }, [data])

  const categoriasList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.categoria && d.categoria.trim()) set.add(d.categoria.trim()) })
    return Array.from(set).sort()
  }, [data])

  const agendasList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.agenda && d.agenda.trim()) set.add(d.agenda.trim()) })
    return Array.from(set).sort()
  }, [data])

  const datesList = useMemo(() => {
    const set = new Set<string>()
    data.forEach(d => { if (d.data && d.data.trim()) set.add(d.data.trim()) })
    return Array.from(set).sort().reverse()
  }, [data])

  // Filtragem e ordenação dos dados por Status Geral
  const filteredData = useMemo(() => {
    const list = data.filter(item => {
      if (selectedDates.length > 0 && !selectedDates.includes(item.data)) return false
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.statusGeral)) return false
      if (selectedPortarias.length > 0 && !selectedPortarias.includes(item.portaria)) return false
      if (selectedConferentes.length > 0 && !selectedConferentes.includes(item.conferente)) return false
      if (selectedDocas.length > 0 && !selectedDocas.includes(item.doca)) return false
      if (selectedCategorias.length > 0 && !selectedCategorias.includes(item.categoria)) return false
      if (selectedAgendas.length > 0 && !selectedAgendas.includes(item.agenda)) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          item.fornecedor.toLowerCase().includes(term) ||
          item.agenda.toLowerCase().includes(term) ||
          item.conferente.toLowerCase().includes(term) ||
          item.categoria.toLowerCase().includes(term) ||
          item.doca.toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })

    // Classificação por Status Geral (Ordem operacional: Em Andamento -> Aguardando -> Antecipada -> Finalizada -> Dia Seguinte -> Devolvida -> No Show)
    return list.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.statusGeral] ?? 99
      const pB = STATUS_PRIORITY[b.statusGeral] ?? 99
      if (pA !== pB) {
        return statusSortOrder === 'asc' ? pA - pB : pB - pA
      }
      // Critério secundário: se mesmo status, ordena alfabeticamente ou por fornecedor
      return a.fornecedor.localeCompare(b.fornecedor)
    })
  }, [data, selectedDates, selectedStatuses, selectedPortarias, selectedConferentes, selectedDocas, selectedCategorias, selectedAgendas, searchTerm, statusSortOrder])

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

  // Resumo por Status Geral ou Categoria (Tabela Superior Direita)
  const statusResumo = useMemo(() => {
    const groups: Record<string, { label: string; status: string; agendaCount: number; skuSum: number; volumeSum: number; cubagemSum: number }> = {}

    filteredData.forEach(d => {
      const key = (summaryViewMode === 'categoria' || summaryViewMode === 'grafico')
        ? (d.categoria || 'SEM CATEGORIA') 
        : (d.statusGeral || 'OUTROS')

      if (!groups[key]) {
        groups[key] = {
          label: key,
          status: key,
          agendaCount: 0,
          skuSum: 0,
          volumeSum: 0,
          cubagemSum: 0
        }
      }
      groups[key].agendaCount += 1
      groups[key].skuSum += d.sku || 0
      groups[key].volumeSum += d.volume || 0
      groups[key].cubagemSum += d.cubagem || 0
    })

    let list = Object.values(groups)

    if (summaryViewMode === 'status') {
      list.sort((a, b) => {
        const pA = STATUS_PRIORITY[a.label] ?? 99
        const pB = STATUS_PRIORITY[b.label] ?? 99
        return pA - pB
      })
    } else {
      list.sort((a, b) => b.agendaCount - a.agendaCount || a.label.localeCompare(b.label))
    }

    const total = {
      agendaCount: list.reduce((acc, curr) => acc + curr.agendaCount, 0),
      skuSum: list.reduce((acc, curr) => acc + curr.skuSum, 0),
      volumeSum: list.reduce((acc, curr) => acc + curr.volumeSum, 0),
      cubagemSum: list.reduce((acc, curr) => acc + curr.cubagemSum, 0)
    }

    return { list, total }
  }, [filteredData, summaryViewMode])

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
          FILTROS OPERACIONAIS DE CABEÇALHO (CAMPOS DA PLANILHA RECEBIMENTO)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
            <Filter size={15} className="text-blue-600" />
            <span>Filtros Recebimento:</span>
          </div>

          {/* Filtro por Data (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Data"
            icon={<Calendar size={14} className="text-blue-600 shrink-0" />}
            options={datesList}
            selectedValues={selectedDates}
            onChange={setSelectedDates}
            placeholderAll={`Todas (${datesList.length})`}
            widthClass="min-w-[150px]"
          />

          {/* Filtro por Status Geral (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Status Geral"
            icon={<Activity size={14} className="text-emerald-600 shrink-0" />}
            options={statusList}
            selectedValues={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholderAll={`Todos (${statusList.length})`}
            widthClass="min-w-[160px]"
          />

          {/* Filtro por Conferente (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Conferente"
            icon={<Users size={14} className="text-indigo-600 shrink-0" />}
            options={conferentesList}
            selectedValues={selectedConferentes}
            onChange={setSelectedConferentes}
            placeholderAll={`Todos (${conferentesList.length})`}
            widthClass="min-w-[150px]"
          />

          {/* Filtro por Doca (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Doca"
            icon={<Box size={14} className="text-amber-600 shrink-0" />}
            options={docasList}
            selectedValues={selectedDocas}
            onChange={setSelectedDocas}
            placeholderAll={`Todas (${docasList.length})`}
            widthClass="min-w-[140px]"
          />

          {/* Filtro por Categoria (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Categoria"
            icon={<Layers size={14} className="text-indigo-600 shrink-0" />}
            options={categoriasList}
            selectedValues={selectedCategorias}
            onChange={setSelectedCategorias}
            placeholderAll={`Todas (${categoriasList.length})`}
            widthClass="min-w-[160px]"
          />

          {/* Filtro por Agenda (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Agenda"
            icon={<Hash size={14} className="text-blue-600 shrink-0" />}
            options={agendasList}
            selectedValues={selectedAgendas}
            onChange={setSelectedAgendas}
            placeholderAll={`Todas (${agendasList.length})`}
            widthClass="min-w-[140px]"
          />

          {/* Filtro por Portaria (Múltipla Seleção) */}
          <MultiSelectDropdown
            label="Portaria"
            icon={<Truck size={14} className="text-amber-600 shrink-0" />}
            options={['Chegou', 'Não Chegou']}
            selectedValues={selectedPortarias}
            onChange={setSelectedPortarias}
            placeholderAll="Todos"
            widthClass="min-w-[130px]"
          />
        </div>

        {/* Resumo de linhas filtradas e botão de reset */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-mono font-bold border border-blue-100">
            {filteredData.length} registros
          </span>

          {(selectedDates.length > 0 || selectedStatuses.length > 0 || selectedPortarias.length > 0 || selectedConferentes.length > 0 || selectedDocas.length > 0 || selectedCategorias.length > 0 || selectedAgendas.length > 0 || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDates([])
                setSelectedStatuses([])
                setSelectedPortarias([])
                setSelectedConferentes([])
                setSelectedDocas([])
                setSelectedCategorias([])
                setSelectedAgendas([])
                setSearchTerm('')
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <X size={12} />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${syncStatus === 'live'
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
        {/* LADO ESQUERDO: TEMPO MÉDIO POR CATEGORIA & PORTARIA (Lg: col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
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
              onClick={() => {
                if (selectedPortarias.includes('Chegou')) {
                  setSelectedPortarias(selectedPortarias.filter(p => p !== 'Chegou'))
                } else {
                  setSelectedPortarias([...selectedPortarias, 'Chegou'])
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPortarias.includes('Chegou')
                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400'
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
              onClick={() => {
                if (selectedPortarias.includes('Não Chegou')) {
                  setSelectedPortarias(selectedPortarias.filter(p => p !== 'Não Chegou'))
                } else {
                  setSelectedPortarias([...selectedPortarias, 'Não Chegou'])
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPortarias.includes('Não Chegou')
                ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-xs ring-1 ring-slate-400'
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

        {/* LADO DIREITO: RESUMO STATUS GERAL OU CATEGORIA (AGENDA, SKU, VOLUME, CUBAGEM) (Lg: col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Seletor de Período de Datas e Segmentação (Status Geral vs Categoria) */}
            <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  {selectedDates.length === 0
                    ? 'Período Completo'
                    : selectedDates.length === 1
                      ? `${selectedDates[0]} - ${selectedDates[0]}`
                      : `${selectedDates.length} datas selecionadas`}
                </span>
              </div>

              {/* Segmentação: Status Geral / Categoria / Gráfico e Seletor de Data */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('status')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      summaryViewMode === 'status'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Status Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('categoria')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      summaryViewMode === 'categoria'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Categoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('grafico')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer inline-flex items-center gap-1 ${
                      summaryViewMode === 'grafico'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 size={12} />
                    <span>Gráfico</span>
                  </button>
                </div>

                <select
                  value={selectedDates.length === 1 ? selectedDates[0] : (selectedDates.length === 0 ? 'TODAS' : 'MULTI')}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'TODAS') {
                      setSelectedDates([])
                    } else if (val !== 'MULTI') {
                      setSelectedDates([val])
                    }
                  }}
                  className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="TODAS">Todos os Dias</option>
                  {selectedDates.length > 1 && (
                    <option value="MULTI">({selectedDates.length} selecionados)</option>
                  )}
                  {datesList.map(dt => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visualização: Gráfico de Barras por Categoria ou Tabela Resumo */}
            {summaryViewMode === 'grafico' ? (
              <div className="py-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Quantidade de Agendas por Categoria
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      (Total: {statusResumo.total.agendaCount} agendas)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Clique na barra para filtrar a tabela operacional
                  </span>
                </div>

                {statusResumo.list.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Nenhuma categoria encontrada para o período selecionado.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {(() => {
                      const maxVal = Math.max(...statusResumo.list.map(s => s.agendaCount), 1)
                      return statusResumo.list.map((item, idx) => {
                        const pct = Math.max(4, Math.round((item.agendaCount / maxVal) * 100))
                        const isSelected = selectedCategorias.includes(item.label)
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (selectedCategorias.includes(item.label)) {
                                setSelectedCategorias(selectedCategorias.filter(c => c !== item.label))
                              } else {
                                setSelectedCategorias([...selectedCategorias, item.label])
                              }
                            }}
                            title={`Filtrar por ${item.label}: ${item.agendaCount} agendas`}
                            className={`group cursor-pointer p-1.5 rounded-lg transition-all ${
                              isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                                {item.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 text-[11px]">
                                  {item.volumeSum > 0 ? `${item.volumeSum.toLocaleString('pt-BR')} vol` : ''}
                                </span>
                                <span className="font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[11px]">
                                  {item.agendaCount} {item.agendaCount === 1 ? 'agenda' : 'agendas'}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSelected
                                    ? 'bg-blue-600'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* Tabela de Resumo por Status ou Categoria */
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-1.5 px-2 text-left">
                        {summaryViewMode === 'status' ? 'Status Geral' : 'Categoria'}
                      </th>
                      <th className="py-1.5 px-2 text-right">Agenda</th>
                      <th className="py-1.5 px-2 text-right">SKU</th>
                      <th className="py-1.5 px-2 text-right">Volume</th>
                      <th className="py-1.5 px-2 text-right">Cubagem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statusResumo.list.map((st, idx) => {
                      const isSelected = summaryViewMode === 'status' 
                        ? selectedStatuses.includes(st.label) 
                        : selectedCategorias.includes(st.label)

                      const handleRowClick = () => {
                        if (summaryViewMode === 'status') {
                          if (selectedStatuses.includes(st.label)) {
                            setSelectedStatuses(selectedStatuses.filter(s => s !== st.label))
                          } else {
                            setSelectedStatuses([...selectedStatuses, st.label])
                          }
                        } else {
                          if (selectedCategorias.includes(st.label)) {
                            setSelectedCategorias(selectedCategorias.filter(c => c !== st.label))
                          } else {
                            setSelectedCategorias([...selectedCategorias, st.label])
                          }
                        }
                      }

                      return (
                        <tr
                          key={idx}
                          onClick={handleRowClick}
                          title={`Clique para filtrar por ${summaryViewMode === 'status' ? 'status' : 'categoria'}: ${st.label}`}
                          className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 font-bold' : ''
                          }`}
                        >
                          <td className="py-1.5 px-2 font-medium text-slate-800 truncate max-w-[140px]">
                            {st.label}
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
                      )
                    })}
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
            )}
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

            {(selectedCategorias.length > 0 || selectedAgendas.length > 0 || selectedStatuses.length > 0 || selectedPortarias.length > 0 || selectedDates.length > 0 || selectedConferentes.length > 0 || selectedDocas.length > 0 || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorias([])
                  setSelectedAgendas([])
                  setSelectedStatuses([])
                  setSelectedPortarias([])
                  setSelectedDates([])
                  setSelectedConferentes([])
                  setSelectedDocas([])
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
                <th className="py-2.5 px-2.5 text-center">Data Agenda</th>
                <th className="py-2.5 px-2">Tmp Med</th>
                <th className="py-2.5 px-2">Início</th>
                <th className="py-2.5 px-2">Fim</th>
                <th className="py-2.5 px-2">Tempo</th>
                <th className="py-2.5 px-2.5">Agenda</th>
                <th className="py-2.5 px-2 text-center">Doca</th>
                <th
                  onClick={() => setStatusSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-800 transition-colors"
                  title="Clique para alternar ordenação por Status Geral"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Status Geral</span>
                    <ArrowUpDown size={11} className="text-slate-400" />
                  </div>
                </th>
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
                  <td colSpan={16} className="py-12 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const isChegou = item.portaria.toLowerCase().includes('chegou') && !item.portaria.toLowerCase().includes('não') && !item.portaria.toLowerCase().includes('nao')
                  const isExpanded = expandedAgendas.has(item.agenda)
                  const itensDaAgenda = itensAgMap[item.agenda] || []

                  return (
                    <React.Fragment key={item.id || index}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                        {/* Portaria (amarelo claro quando Chegou, como no print) */}
                        <td className={`py-2 px-3 font-semibold ${isChegou ? 'bg-amber-100 text-amber-950 font-bold' : 'text-slate-500'}`}>
                          {item.portaria}
                        </td>

                        {/* Data da Agenda */}
                        <td className="py-2 px-2.5 text-center font-mono font-semibold text-slate-700 bg-slate-50/80 text-[11px] whitespace-nowrap">
                          {item.data || '-'}
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

                        {/* Agenda com Ação Dropdown / Expandir */}
                        <td className="py-2 px-2.5 font-mono">
                          <button
                            type="button"
                            onClick={() => toggleAgendaExpand(item.agenda)}
                            title="Clique para ver os itens/SKUs desta agenda"
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer group"
                          >
                            <span>{item.agenda}</span>
                            <ChevronDown
                              size={13}
                              className={`text-blue-500 group-hover:text-blue-800 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-800' : ''
                                }`}
                            />
                          </button>
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

                      {/* LINHA EXPANSÍVEL: ITENS DA AGENDA (ABA ITENS AG) */}
                      {isExpanded && (
                        <tr className="bg-gradient-to-r from-blue-50/60 via-slate-50 to-blue-50/60 animate-in fade-in duration-200 border-y border-blue-200/80">
                          <td colSpan={16} className="p-3 pl-8 pr-6">
                            <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-xs space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Box size={14} className="text-blue-600" />
                                  <span className="text-xs font-bold text-slate-800">
                                    Itens do Agendamento &bull; Agenda <span className="text-blue-600 font-mono">#{item.agenda}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    ({itensDaAgenda.length > 0 ? `${itensDaAgenda.length} produto(s) vinculado(s)` : 'Nenhum detalhe adicional na aba Itens Ag'})
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500">
                                  Fornecedor: <strong className="text-slate-800">{item.fornecedor}</strong>
                                </span>
                              </div>

                              {itensDaAgenda.length === 0 ? (
                                <div className="py-3 text-center text-xs text-slate-400">
                                  Nenhum item com a Agenda <strong>{item.agenda}</strong> foi encontrado na aba <em>Itens Ag</em> da planilha.
                                </div>
                              ) : (
                                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                                        <th className="py-1.5 px-3 text-left w-36">SKU</th>
                                        <th className="py-1.5 px-3 text-left">Descrição do Produto</th>
                                        <th className="py-1.5 px-3 text-right w-36">Qt. Agenda</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {itensDaAgenda.map((it, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40">
                                          <td className="py-1.5 px-3 font-mono font-bold text-blue-700">
                                            <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                              {it.sku}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-3 font-medium text-slate-800">
                                            {it.descricao}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                                            {it.qtAgenda.toLocaleString('pt-BR')}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-slate-200 font-bold bg-slate-50 text-slate-900">
                                        <td colSpan={2} className="py-1.5 px-3 text-right uppercase text-[10px] text-slate-600">
                                          Total de Peças na Agenda:
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-emerald-800 font-bold">
                                          {itensDaAgenda.reduce((acc, curr) => acc + curr.qtAgenda, 0).toLocaleString('pt-BR')}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

