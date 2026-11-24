import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  CalendarDays,
  Hammer,
  Clock,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Boxes,
  Package,
  Settings2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sliders,
  HelpCircle,
  Pin,
  PinOff,
  Menu,
  MapPin,
  Activity,
  Gauge,
  Compass,
  Target,
  Thermometer,
  Maximize2,
  Minimize2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import {
  getPcpItemsReport,
  getAllPcpSummaryItems,
  clearPcpPlanningCache,
  setPcpPlanningCache,
  forceClearAllPcpCaches,
  fetchPcpAuxParams,
  savePcpAuxParams,
  triggerOracleSync,
  getOracleSyncStatus,
  type OracleSyncStatus,
  type PcpItem
} from '../lib/pcpService'
import initialSampleRows from '../data/pcp_initial_sample.json'
import initialPlanningSummary from '../data/pcp_planning_summary.json'
import { INITIAL_MODAL_PARAMS, getTipoModal, type ModalParamItem } from '../data/pcp_modal_params'
import { INITIAL_FILIAL_ROTA_PARAMS, type FilialRotaParamItem } from '../data/pcp_filial_rotas_params'
import { INITIAL_CEP_ROTA_PARAMS, cleanCep, isGenericRoute, type CepRotaParamItem } from '../data/pcp_cep_rotas_params'
import {
  CEP_RANGES_LOGPLACE,
  CEP_RANGES_SEDEX,
  CEP_RANGES_CONTA_FRETE,
  findCepInRange
} from '../data/pcp_cep_ranges_params'

// Definição das 53 Colunas Oficiais da Planilha PCP J'S MARTINS.xlsx + Coluna Auxiliar Dinâmica
export const PCP_COLUMNS: Array<{ key: keyof PcpItem; label: string; width?: string; align?: 'left' | 'center' | 'right'; type?: 'num' | 'cur' | 'date' | 'str' }> = [
  { key: 'filorig', label: 'FILORIG', width: 'w-20', align: 'center' },
  { key: 'codfil', label: 'CODFIL', width: 'w-20', align: 'center' },
  { key: 'filentrega', label: 'FILENTREGA', width: 'w-24', align: 'center' },
  { key: 'destino_calc', label: 'DESTINO (AUX)', width: 'w-48' },
  { key: 'regiao_calc', label: 'REGIÃO (AUX)', width: 'w-32', align: 'center' },
  { key: 'numlote', label: 'NUMLOTE', width: 'w-24' },
  { key: 'fllibfat', label: 'FLLIBFAT', width: 'w-20', align: 'center' },
  { key: 'tpnota', label: 'TPNOTA', width: 'w-20', align: 'center' },
  { key: 'numpedven', label: 'NUMPEDVEN', width: 'w-28' },
  { key: 'numpedcomp', label: 'NUMPEDCOMP', width: 'w-28' },
  { key: 'dtpedido', label: 'DTPEDIDO', width: 'w-24' },
  { key: 'dtentrega', label: 'DTENTREGA', width: 'w-24' },
  { key: 'dtlibfat', label: 'DTLIBFAT', width: 'w-24' },
  { key: 'preventrega', label: 'PREVENTREGA', width: 'w-24' },
  { key: 'item', label: 'ITEM', width: 'w-24' },
  { key: 'ibm', label: 'IBM', width: 'w-28' },
  { key: 'descricao', label: 'DESCRICAO', width: 'min-w-[260px]' },
  { key: 'ref', label: 'REF', width: 'w-28' },
  { key: 'fantasia', label: 'FANTASIA', width: 'w-36' },
  { key: 'qtcomp', label: 'QTCOMP', width: 'w-20', align: 'right', type: 'num' },
  { key: 'fisico', label: 'FISICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'resfis', label: 'RESFIS', width: 'w-20', align: 'right', type: 'num' },
  { key: 'logico', label: 'LOGICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'reslog', label: 'RESLOG', width: 'w-20', align: 'right', type: 'num' },
  { key: 'tecnico', label: 'TECNICO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'futuro', label: 'FUTURO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'transito', label: 'TRANSITO', width: 'w-20', align: 'right', type: 'num' },
  { key: 'status', label: 'STATUS', width: 'w-24' },
  { key: 'situacao', label: 'SITUACAO', width: 'w-28' },
  { key: 'linha', label: 'LINHA', width: 'w-44' },
  { key: 'linha_ajustada', label: 'LINHA_AJUSTADA', width: 'w-44' },
  { key: 'nucleo', label: 'NUCLEO', width: 'w-32' },
  { key: 'familia', label: 'FAMILIA', width: 'w-32' },
  { key: 'codrota', label: 'CODROTA', width: 'w-24' },
  { key: 'descricaorota', label: 'DESCRICAOROTA', width: 'w-48' },
  { key: 'codmodal', label: 'CODMODAL', width: 'w-24' },
  // COLUNA AUXILIAR DINÂMICA ALIMENTADA PELA ABA DE CADASTROS
  { key: 'modalidade_calc', label: 'MODALIDADE (AUX)', width: 'w-36', align: 'center' },
  { key: 'tipo_modal_calc', label: 'TIPO MODAL (AUX)', width: 'w-32', align: 'center' },
  { key: 'descricaomodal', label: 'DESCRICAOMODAL', width: 'w-36' },
  { key: 'status_operacao', label: 'STATUS_OPERACAO', width: 'w-32', align: 'center' },
  { key: 'operacao', label: 'OPERACAO', width: 'w-28' },
  { key: 'dtalter', label: 'DTALTER', width: 'w-24' },
  { key: 'cub_tot', label: 'CUB_TOT', width: 'w-24', align: 'right', type: 'num' },
  { key: 'pesoliq', label: 'PESOLIQ', width: 'w-24', align: 'right', type: 'num' },
  { key: 'precounit', label: 'PRECOUNIT', width: 'w-24', align: 'right', type: 'cur' },
  { key: 'vltotal', label: 'VLTOTAL', width: 'w-28', align: 'right', type: 'cur' },
  { key: 'qtped', label: 'QTPED', width: 'w-20', align: 'right', type: 'num' },
  { key: 'flag_estorno_caixa', label: 'FLAG_ESTORNO_CAIXA', width: 'w-28' },
  { key: 'n', label: 'N', width: 'w-16', align: 'center' },
  { key: 'turnoagendado', label: 'TURNOAGENDADO', width: 'w-24', align: 'center' },
  { key: 'dtentregaagendada', label: 'DTENTREGAAGENDADA', width: 'w-28' },
  { key: 'cod_vendedor', label: 'COD_VENDEDOR', width: 'w-24' },
  { key: 'prazo_entrega', label: 'PRAZO_ENTREGA', width: 'w-24' },
  { key: 'data_entrega_prevista', label: 'DATA_ENTREGA_PREVISTA', width: 'w-28' },
  { key: 'cep_entrega', label: 'CEP_ENTREGA', width: 'w-24' },
  { key: 'dt_hr_libfat', label: 'DT_HR_LIBFAT', width: 'w-28' },
  { key: 'faixa_dias_reduzida', label: 'FAIXA_DIAS_REDUZIDA', width: 'w-28' }
]

// Formata data para o padrão brasileiro (DD/MM/YYYY) ou prazo em dias
export const formatDateBR = (val: any): string => {
  if (!val && val !== 0) return '-'
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '-'

  // Se já estiver no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str.substring(0, 10)
  }

  // Formato ISO ou YYYY-MM-DD (ex: 2026-11-23 00:00:00 ou 2026-11-23T...)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`
  }

  // Tentar parse via Date se for válida e não for puramente número
  if (!/^\d+(\.0+)?$/.test(str)) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      return `${dia}/${mes}/${ano}`
    }
  }

  // Se for apenas número de dias (ex: 10 ou 10.0)
  if (/^\d+(\.0+)?$/.test(str)) {
    return `${str.replace(/\.0+$/, '')} dias`
  }

  return str
}

// Converte qualquer valor de data/string para Date normalizado (00:00:00)
export function parseDateOnly(val: any): Date | null {
  if (!val && val !== 0) return null
  if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate())
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return null
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (brMatch) return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]))
  if (!/^\d+(\.0+)?$/.test(str)) {
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  return null
}

// Obtém a data de referência operacional ("Hoje") de forma resiliente
export function getOperationalReferenceDate(rows: any[]): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!rows || rows.length === 0) return today

  // Se o relógio do sistema estiver coerente com as datas da base (dentro de +/- 45 dias)
  for (let i = 0; i < Math.min(rows.length, 60); i++) {
    const d = parseDateOnly(rows[i].preventrega || rows[i].PREVENTREGA || rows[i].dtpedido || rows[i].DTPEDIDO)
    if (d && Math.abs(d.getTime() - today.getTime()) < 45 * 24 * 60 * 60 * 1000) {
      return today
    }
  }

  // Fallback para datasets históricos ou testes fora de época: seleciona a data mais recente da base
  let latest: Date | null = null
  for (const r of rows) {
    const d = parseDateOnly(r.preventrega || r.PREVENTREGA || r.dtpedido || r.DTPEDIDO)
    if (d && (!latest || d > latest)) {
      latest = d
    }
  }
  return latest || today
}

// Lista das 10 faixas oficiais de prazo/SLA
export const PRAZO_FAIXAS = ['Vencido', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D+'] as const

// Helper para calcular a faixa de prazo (SLA) para Venda (PREVENTREGA) e Abastecimento (DTPEDIDO)
export function getPrazoFaixa(row: any, isAba: boolean, refDate: Date): string {
  const msPerDay = 1000 * 60 * 60 * 24
  if (isAba) {
    // Para Abastecimento: usa DTPEDIDO (Aging do pedido)
    const dt = parseDateOnly(row.dtpedido || row.DTPEDIDO)
    if (!dt) return 'D+'
    const diffDays = Math.round((refDate.getTime() - dt.getTime()) / msPerDay)
    if (diffDays <= 0) return 'D0'
    if (diffDays === 1) return 'D1'
    if (diffDays === 2) return 'D2'
    if (diffDays === 3) return 'D3'
    if (diffDays === 4) return 'D4'
    if (diffDays === 5) return 'D5'
    if (diffDays === 6) return 'D6'
    if (diffDays === 7) return 'D7'
    return 'D+'
  } else {
    // Para Venda: usa PREVENTREGA
    const dt = parseDateOnly(row.preventrega || row.PREVENTREGA || row.data_entrega_prevista || row.DATA_ENTREGA_PREVISTA || row.prazo_entrega || row.PRAZO_ENTREGA)
    if (!dt) return 'D+'
    const diffDays = Math.round((dt.getTime() - refDate.getTime()) / msPerDay)
    if (diffDays < 0) return 'Vencido'
    if (diffDays === 0) return 'D0'
    if (diffDays === 1) return 'D1'
    if (diffDays === 2) return 'D2'
    if (diffDays === 3) return 'D3'
    if (diffDays === 4) return 'D4'
    if (diffDays === 5) return 'D5'
    if (diffDays === 6) return 'D6'
    if (diffDays === 7) return 'D7'
    return 'D+'
  }
}

// Formata data e hora para o padrão brasileiro (DD/MM/YYYY às HH:mm)
export const formatDateTimeBR = (val: any): string => {
  if (!val) return ''
  const str = String(val).trim()
  if (!str || str === '-' || str === 'null' || str === 'undefined') return ''

  // Prioriza extração direta de ano, mês, dia, hora e minuto para evitar distorção de fuso horário
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (match) {
    const [, y, m, d, hh, mm] = match
    return `${d}/${m}/${y} às ${hh}:${mm}`
  }

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      const hora = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${dia}/${mes}/${ano} às ${hora}:${min}`
    }
  } catch { }

  return str
}

// Remove casas decimais espúrias de código de item (ex: 8131690.0 -> 8131690)
export const formatItemCode = (val: any): string => {
  if (!val && val !== 0) return '-'
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return '-'
  return str.replace(/\.0+$/, '')
}

// Converte data ou prazo em valor numérico para ordenação crescente (do menor para o maior vencimento)
export const parseDateOrPrazoToTimestamp = (val: any): number => {
  if (!val && val !== 0) return 9999999999999
  const str = String(val).trim()
  if (!str || str === 'null' || str === 'undefined' || str === '-') return 9999999999999

  // Se estiver no formato DD/MM/YYYY
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
  }

  // Se estiver no formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
  }

  // Se for apenas número de dias (ex: "10" ou "10 dias")
  const daysMatch = str.match(/^(\d+)/)
  if (daysMatch) {
    return Number(daysMatch[1]) * 86400000
  }

  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.getTime()
  }

  return 9999999999999
}

// Componente moderno de Dropdown com Múltipla Seleção (Multi-Select) para filtros de planejamento
interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchable?: boolean
  align?: 'left' | 'right'
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  searchable = true,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    const term = searchTerm.toLowerCase()
    return options.filter(opt => opt.toLowerCase().includes(term))
  }, [options, searchTerm])

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  const handleSelectAll = () => {
    onChange([...options])
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className="relative space-y-1" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        {selected.length > 0 && (
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
            {selected.length}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs ${isOpen
            ? 'ring-2 ring-blue-500 border-blue-500 bg-white'
            : selected.length > 0
              ? 'border-blue-400 bg-blue-50/50 text-blue-900 font-semibold'
              : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 font-medium'
          }`}
      >
        <span className="truncate">
          {selected.length === 0
            ? placeholder
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selecionados`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              title="Limpar seleção"
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 min-w-[220px] max-w-[320px] w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-2 text-xs`}>
          {/* Ações Rápidas */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10.5px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline"
            >
              Marcar Todos ({options.length})
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer hover:underline"
            >
              Limpar
            </button>
          </div>

          {/* Campo de Busca Interna */}
          {searchable && options.length > 4 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar opções..."
                className="w-full pl-6 pr-2 py-1 text-[11px] rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Lista com Checkboxes */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="text-[10.5px] text-slate-400 text-center py-2">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selected.includes(opt)
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors text-[11px] select-none ${isChecked ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="truncate flex-1">{opt}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const PcpJsMartinsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planejamento' | 'programacao' | 'controle' | 'cadastros'>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_active_tab')
      if (saved && ['planejamento', 'programacao', 'controle', 'cadastros'].includes(saved)) {
        return saved as any
      }
    } catch { }
    return 'planejamento'
  })

  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_active_tab', activeTab)
    } catch { }
  }, [activeTab])

  // Estado para auto-ocultação do menu para ganhar espaço de tela
  const [isMenuAutoHide, setIsMenuAutoHide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('magalog_pcp_menu_autohide') === 'true'
    } catch {
      return false
    }
  })
  const [isMenuHovered, setIsMenuHovered] = useState<boolean>(false)

  const toggleMenuAutoHide = () => {
    setIsMenuAutoHide(prev => {
      const next = !prev
      try {
        localStorage.setItem('magalog_pcp_menu_autohide', String(next))
      } catch { }
      return next
    })
  }

  const [activeSubParam, setActiveSubParam] = useState<'modal' | 'rotas' | 'ceps'>('rotas')

  // --------------------------------------------------------------------------
  // ESTADOS DA ABA CADASTROS AUXILIARES (DE-PARA DE MODAIS, ROTAS & CEPS)
  // --------------------------------------------------------------------------
  const [modalParams, setModalParams] = useState<ModalParamItem[]>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_modal_params')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao carregar parâmetros locais de modal:', e)
    }
    return INITIAL_MODAL_PARAMS
  })

  const [filialRotaParams, setFilialRotaParams] = useState<FilialRotaParamItem[]>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_filial_rotas_params')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao carregar parâmetros locais de rotas:', e)
    }
    return INITIAL_FILIAL_ROTA_PARAMS
  })

  const [cepRotaParams, setCepRotaParams] = useState<CepRotaParamItem[]>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_cep_rotas_params')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao carregar parâmetros locais de CEPs:', e)
    }
    return INITIAL_CEP_ROTA_PARAMS
  })

  // Mapas rápidos de consulta
  const modalMap = useMemo(() => {
    const map: Record<string, string> = {}
    modalParams.forEach(p => {
      const k = (p.codmodal || '').trim().toUpperCase()
      if (k) map[k] = (p.modalidade || '').trim().toUpperCase()
    })
    return map
  }, [modalParams])

  const rotaMap = useMemo(() => {
    const map: Record<string, { destino: string; regiao: string }> = {}
    INITIAL_FILIAL_ROTA_PARAMS.forEach(p => {
      const k = (p.filialRota || '').trim().toUpperCase()
      if (k) map[k] = { destino: p.destino, regiao: p.regiao.trim().toUpperCase() }
    })
    filialRotaParams.forEach(p => {
      const k = (p.filialRota || '').trim().toUpperCase()
      if (k) map[k] = { destino: p.destino, regiao: p.regiao.trim().toUpperCase() }
    })
    return map
  }, [filialRotaParams])

  // Função inteligente para resolver Destino e Região de qualquer Rota ou Filial com suporte a variações de SAT e palavras-chave
  const findRotaInfo = useCallback((key: string | undefined | null): { destino: string; regiao: string } | null => {
    if (!key) return null
    const cleanKey = String(key).trim().toUpperCase()
    if (!cleanKey || cleanKey === '-') return null

    // 1. Match exato
    if (rotaMap[cleanKey]) return rotaMap[cleanKey]

    // 2. Se tiver variação de SAT com 2 dígitos (ex: SAT 11 -> SAT 1, SAT 21 -> SAT 2, SAT 31 -> SAT 3, SAT 41 -> SAT 4)
    const satSingleDigit = cleanKey.replace(/\bSAT\s+(\d)\d+\b/i, 'SAT $1')
    if (satSingleDigit !== cleanKey && rotaMap[satSingleDigit]) {
      return rotaMap[satSingleDigit]
    }

    // 3. Match pela rota base sem o sufixo SAT (ex: "994-EC1 CE MARACANAU SAT 21" -> "994-EC1 CE MARACANAU")
    const withoutSat = cleanKey.replace(/\s+SAT\s*\d*$/i, '').trim()
    if (withoutSat && withoutSat !== cleanKey && rotaMap[withoutSat]) {
      return rotaMap[withoutSat]
    }

    // 4. Reconhecimento inteligente por cidades e rotas conhecidas (Agrupamento junto ao destino principal)
    if (cleanKey.includes('MARACANAU') || cleanKey.includes('MARACANAÚ')) {
      return { destino: 'MARACANAU', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('MARANGUAPE')) {
      return { destino: 'MARANGUAPE', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('CAUCAIA')) {
      return { destino: 'ROTA CAUCAIA A', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('EUSEBIO') || cleanKey.includes('EUSÉBIO')) {
      return { destino: 'EUSEBIO', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('CASCAVEL')) {
      return { destino: 'CASCAVEL', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('PACAJUS')) {
      return { destino: 'PACAJUS', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('AQUIRAZ')) {
      return { destino: 'AQUIRAZ', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('HORIZONTE')) {
      return { destino: 'HORIZONTE', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('ITAITINGA')) {
      return { destino: 'ITAITINGA', regiao: 'METROPOLITANA' }
    }
    if (cleanKey.includes('SOBRAL')) {
      return { destino: 'SOBRAL', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('JUAZ DO NORTE') || cleanKey.includes('JUAZEIRO')) {
      return { destino: 'JUAZEIRO DO NORTE', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('CRATO')) {
      return { destino: 'CRATO', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('BARBALHA')) {
      return { destino: 'BARBALHA', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('IGUATU')) {
      return { destino: 'IGUATU', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('QUIXADA') || cleanKey.includes('QUIXADÁ')) {
      return { destino: 'QUIXADA', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('QUIXERAMOBIM')) {
      return { destino: 'QUIXERAMOBIM', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('LIMOEIRO')) {
      return { destino: 'LIMOEIRO DO NORTE', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('ITAPIPOCA')) {
      return { destino: 'ITAPIPOCA', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('TIANGUA') || cleanKey.includes('TIANGUÁ')) {
      return { destino: 'TIANGUA', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('CAMOCIM')) {
      return { destino: 'CAMOCIM', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('CANINDE') || cleanKey.includes('CANINDÉ')) {
      return { destino: 'CANINDE', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('CRATEUS') || cleanKey.includes('CRATEÚS')) {
      return { destino: 'CRATEUS', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('ARACATI')) {
      return { destino: 'ARACATI', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('ACARAU') || cleanKey.includes('ACARAÚ')) {
      return { destino: 'ACARAU', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('BREJO SANTO')) {
      return { destino: 'BREJO SANTO', regiao: 'INTERIOR' }
    }
    if (cleanKey.includes('SANTA QUITERIA') || cleanKey.includes('SANTA QUITÉRIA')) {
      return { destino: 'SANTA QUITERIA', regiao: 'INTERIOR' }
    }

    return null
  }, [rotaMap])

  // Mapas de consulta de CEP (8 dígitos exatos e prefixos de 5 dígitos)
  const { cepRotaMap, prefix5RotaMap } = useMemo(() => {
    const exact: Record<string, string> = {}
    const p5: Record<string, string> = {}
    cepRotaParams.forEach(p => {
      const c = cleanCep(p.cep)
      const r = (p.descricaorota || '').trim()
      if (!c || !r) return
      if (c.length === 8) {
        exact[c] = r
      } else if (c.length === 5) {
        p5[c] = r
      }
    })
    return { cepRotaMap: exact, prefix5RotaMap: p5 }
  }, [cepRotaParams])

  // Helper para resolver rota oficial a partir do CEP para pedidos com rotas genéricas de trânsito/cross-docking ou modal SEDEX
  const resolveRouteByCep = useCallback((
    route: string | undefined | null,
    rawCep: any,
    codmodal?: string,
    descricaomodal?: string
  ): string => {
    const originalRoute = String(route || '').trim()
    const c = cleanCep(rawCep)
    const numCep = c ? Number(c) : 0
    const cod = String(codmodal || '').toUpperCase().trim()
    const descMod = String(descricaomodal || '').toUpperCase().trim()

    // 1. Modal SEDEX prioritário (ex: CSE - CORP ESPEC SEDEX ou descrição contendo SEDEX)
    if (cod === 'CSE' || descMod.includes('SEDEX')) {
      if (numCep) {
        const sedexRule = findCepInRange(numCep, CEP_RANGES_SEDEX)
        if (sedexRule) return sedexRule.rota
      }
      return 'SEDEX'
    }

    // Se já é uma rota oficial conhecida e não genérica, mantém
    if (!isGenericRoute(originalRoute) && originalRoute !== '') {
      return originalRoute
    }

    if (!c || !numCep) return originalRoute

    // 2. De-Para exato de CEP (8 dígitos) manual/base
    if (cepRotaMap[c]) return cepRotaMap[c]

    // 3. De-Para por prefixo (5 dígitos)
    const p5 = c.slice(0, 5)
    if (prefix5RotaMap[p5]) return prefix5RotaMap[p5]

    // 4. Faixas da LOGPLACE (Conta frete 1)
    const logplaceRule = findCepInRange(numCep, CEP_RANGES_LOGPLACE)
    if (logplaceRule) {
      return 'LOGPLACE'
    }

    // 5. Faixas da Conta Frete Geral (Fortaleza Rotas A-N, Pacajus, Sobral, Limoeiro, etc.)
    const ctaRule = findCepInRange(numCep, CEP_RANGES_CONTA_FRETE)
    if (ctaRule && ctaRule.rota) {
      return ctaRule.rota
    }

    // 6. Faixas da Tabela Sedex (Conta frete 2)
    const sedexRule = findCepInRange(numCep, CEP_RANGES_SEDEX)
    if (sedexRule) {
      return sedexRule.rota
    }

    return originalRoute
  }, [cepRotaMap, prefix5RotaMap])

  // Estados de formulário da aba Cadastros Auxiliares (Modal)
  const [newCodModal, setNewCodModal] = useState('')
  const [newModalidade, setNewModalidade] = useState('')
  const [searchParam, setSearchParam] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingModalidade, setEditingModalidade] = useState('')

  // Estados de formulário da aba Cadastros Auxiliares (Filiais/Rotas)
  const [newFilialRota, setNewFilialRota] = useState('')
  const [newDestino, setNewDestino] = useState('')
  const [newRegiao, setNewRegiao] = useState('INTERIOR')
  const [searchRotaParam, setSearchRotaParam] = useState('')
  const [editingRotaIndex, setEditingRotaIndex] = useState<number | null>(null)
  const [editingRotaDestino, setEditingRotaDestino] = useState('')
  const [editingRotaRegiao, setEditingRotaRegiao] = useState('')

  // Estados de formulário da aba Cadastros Auxiliares (CEPs & Rotas)
  const [newCep, setNewCep] = useState('')
  const [newCepRota, setNewCepRota] = useState('')
  const [newCepCidade, setNewCepCidade] = useState('')
  const [searchCepParam, setSearchCepParam] = useState('')
  const [editingCepIndex, setEditingCepIndex] = useState<number | null>(null)
  const [editingCepRota, setEditingCepRota] = useState('')
  const [editingCepCidade, setEditingCepCidade] = useState('')
  const [cepPage, setCepPage] = useState(1)
  const [cepPageSize] = useState(50)

  // Estados dos filtros da aba Planejamento (persistentes no navegador com suporte a multi-seleção)
  const [planFilterRegioes, setPlanFilterRegioes] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_regioes')
      if (s) return JSON.parse(s)
      const old = localStorage.getItem('magalog_pcp_plan_regiao')
      return (old && old !== 'TODOS') ? [old] : []
    } catch { return [] }
  })
  const [planFilterDestinos, setPlanFilterDestinos] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_destinos')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterModalidades, setPlanFilterModalidades] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_modalidades')
      if (s) return JSON.parse(s)
      const old = localStorage.getItem('magalog_pcp_plan_modalidade')
      return (old && old !== 'TODOS') ? [old] : []
    } catch { return [] }
  })
  const [planFilterTipoModal, setPlanFilterTipoModal] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_tipo_modal')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterFllibfat, setPlanFilterFllibfat] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_fllibfat')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterStatusOp, setPlanFilterStatusOp] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_status_op')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planFilterLinhas, setPlanFilterLinhas] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_linhas')
      if (s) return JSON.parse(s)
      const old = localStorage.getItem('magalog_pcp_plan_linha')
      return (old && old !== 'TODOS') ? [old] : []
    } catch { return [] }
  })
  const [planFilterPrazos, setPlanFilterPrazos] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('magalog_pcp_plan_prazos')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [planSearchTerm, setPlanSearchTerm] = useState<string>(() => {
    try { return localStorage.getItem('magalog_pcp_plan_search') || '' } catch { return '' }
  })

  // Sincronizar filtros com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_plan_regioes', JSON.stringify(planFilterRegioes))
      localStorage.setItem('magalog_pcp_plan_destinos', JSON.stringify(planFilterDestinos))
      localStorage.setItem('magalog_pcp_plan_modalidades', JSON.stringify(planFilterModalidades))
      localStorage.setItem('magalog_pcp_plan_tipo_modal', JSON.stringify(planFilterTipoModal))
      localStorage.setItem('magalog_pcp_plan_fllibfat', JSON.stringify(planFilterFllibfat))
      localStorage.setItem('magalog_pcp_plan_status_op', JSON.stringify(planFilterStatusOp))
      localStorage.setItem('magalog_pcp_plan_linhas', JSON.stringify(planFilterLinhas))
      localStorage.setItem('magalog_pcp_plan_prazos', JSON.stringify(planFilterPrazos))
      localStorage.setItem('magalog_pcp_plan_search', planSearchTerm)
    } catch { }
  }, [planFilterRegioes, planFilterDestinos, planFilterModalidades, planFilterTipoModal, planFilterFllibfat, planFilterStatusOp, planFilterLinhas, planFilterPrazos, planSearchTerm])

  // Alternância de visualização dos painéis: 'regiao' (Quadro por Região) | 'comparativo' (Visão Comparativa por Destino)
  const [planViewMode, setPlanViewMode] = useState<'regiao' | 'comparativo'>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_plan_view_mode')
      return saved === 'comparativo' ? 'comparativo' : 'regiao'
    } catch {
      return 'regiao'
    }
  })

  // Sincronizar modo de visualização com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_plan_view_mode', planViewMode)
    } catch { }
  }, [planViewMode])

  // Alternância de visualização do painel lateral direito: 'linha' (Por Linha & Itens) | 'datas' (Dt. Pedido x Prev. Entrega) | 'visao3' (A definir)
  const [planRightTab, setPlanRightTab] = useState<'linha' | 'datas' | 'visao3'>(() => {
    try {
      const saved = localStorage.getItem('magalog_pcp_plan_right_tab')
      return (saved === 'datas' || saved === 'visao3') ? saved : 'linha'
    } catch {
      return 'linha'
    }
  })

  // Sincronizar aba do painel lateral direito com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('magalog_pcp_plan_right_tab', planRightTab)
    } catch { }
  }, [planRightTab])

  // Estado para recolher/expandir linhas na Visão 1 do painel lateral
  const [collapsedLinhas, setCollapsedLinhas] = useState<Set<string>>(new Set())
  const toggleCollapseLinha = (linha: string) => {
    setCollapsedLinhas(prev => {
      const next = new Set(prev)
      if (next.has(linha)) next.delete(linha)
      else next.add(linha)
      return next
    })
  }

  // Estado para recolher/expandir datas na Visão 2 do painel lateral (agrupado por DT. PEDIDO)
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())
  const toggleCollapseDate = (dtPedido: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev)
      if (next.has(dtPedido)) next.delete(dtPedido)
      else next.add(dtPedido)
      return next
    })
  }

  // Ordenação da Visão 2 (Cruzamento Dt. Pedido x Prev. Entrega)
  type DateSortKey = 'dtPedido' | 'prevEntrega' | 'carteiraPedidos' | 'carteiraQtd' | 'carteiraCub' | 'processoPedidos' | 'processoQtd' | 'processoCub' | 'totalPedidos' | 'totalQtd' | 'totalCub'
  const [dateSortKey, setDateSortKey] = useState<DateSortKey>('dtPedido')
  const [dateSortAsc, setDateSortAsc] = useState<boolean>(true)

  const handleDateSort = (key: DateSortKey) => {
    if (dateSortKey === key) {
      setDateSortAsc(prev => !prev)
    } else {
      setDateSortKey(key)
      // Datas padrão asc (cronológico), valores numéricos padrão desc
      setDateSortAsc(key === 'dtPedido' || key === 'prevEntrega')
    }
  }

  // Ordenação da Visão 1 (Por Linha & Itens)
  type LinhaSortKey = 'linha' | 'ibm' | 'item' | 'totalQtd' | 'totalCub' | 'totalValor' | 'totalPeso'
  const [linhaSortKey, setLinhaSortKey] = useState<LinhaSortKey>('linha')
  const [linhaSortAsc, setLinhaSortAsc] = useState<boolean>(true)

  const handleLinhaSort = (key: LinhaSortKey) => {
    if (linhaSortKey === key) {
      setLinhaSortAsc(prev => !prev)
    } else {
      setLinhaSortKey(key)
      setLinhaSortAsc(key === 'linha' || key === 'ibm' || key === 'item')
    }
  }

  // Filtro de busca interna para o painel lateral
  const [planRightSearch, setPlanRightSearch] = useState<string>('')

  // Parâmetros da Visão 3 (Painel Operacional por Modalidade)
  const [metaFaturamento, setMetaFaturamento] = useState<number>(() => {
    const saved = localStorage.getItem('pcp_meta_faturamento')
    return saved ? Number(saved) : 1268000
  })
  const [capacidadeAbaM3, setCapacidadeAbaM3] = useState<number>(() => {
    const saved = localStorage.getItem('pcp_cap_aba_m3')
    return saved ? Number(saved) : 440
  })
  const [capacidadeVendaM3, setCapacidadeVendaM3] = useState<number>(() => {
    const saved = localStorage.getItem('pcp_cap_venda_m3')
    return saved ? Number(saved) : 400
  })
  const [capacidadeCourrierPed, setCapacidadeCourrierPed] = useState<number>(() => {
    const saved = localStorage.getItem('pcp_cap_courrier_ped')
    return saved ? Number(saved) : 600
  })
  const [showConfigOperacional, setShowConfigOperacional] = useState<boolean>(false)
  const [opFullWidth, setOpFullWidth] = useState<boolean>(true)
  const [tempMetaFaturamento, setTempMetaFaturamento] = useState<number>(metaFaturamento)
  const [tempCapAba, setTempCapAba] = useState<number>(capacidadeAbaM3)
  const [tempCapVenda, setTempCapVenda] = useState<number>(capacidadeVendaM3)
  const [tempCapCourrier, setTempCapCourrier] = useState<number>(capacidadeCourrierPed)

  const handleOpenConfigOperacional = () => {
    setTempMetaFaturamento(metaFaturamento)
    setTempCapAba(capacidadeAbaM3)
    setTempCapVenda(capacidadeVendaM3)
    setTempCapCourrier(capacidadeCourrierPed)
    setShowConfigOperacional(true)
  }

  const handleSaveConfigOperacional = () => {
    setMetaFaturamento(tempMetaFaturamento)
    setCapacidadeAbaM3(tempCapAba)
    setCapacidadeVendaM3(tempCapVenda)
    setCapacidadeCourrierPed(tempCapCourrier)
    localStorage.setItem('pcp_meta_faturamento', String(tempMetaFaturamento))
    localStorage.setItem('pcp_cap_aba_m3', String(tempCapAba))
    localStorage.setItem('pcp_cap_venda_m3', String(tempCapVenda))
    localStorage.setItem('pcp_cap_courrier_ped', String(tempCapCourrier))
    setShowConfigOperacional(false)
  }

  // Ordenação da Visão Comparativa (padrão: Cubagem da Carteira decrescente)
  const [compSortField, setCompSortField] = useState<'regiao' | 'destino' | 'carteiraQtd' | 'carteiraCub' | 'processoQtd' | 'processoCub' | 'totalQtd' | 'totalCub'>('carteiraCub')
  const [compSortAsc, setCompSortAsc] = useState<boolean>(false)

  const handleCompSort = (field: 'regiao' | 'destino' | 'carteiraQtd' | 'carteiraCub' | 'processoQtd' | 'processoCub' | 'totalQtd' | 'totalCub') => {
    if (compSortField === field) {
      setCompSortAsc(prev => !prev)
    } else {
      setCompSortField(field)
      setCompSortAsc(field === 'destino' || field === 'regiao' ? true : false)
    }
  }

  // Controle de destinos expandidos no Planejamento
  const [expandedDestinos, setExpandedDestinos] = useState<Record<string, boolean>>({})
  // Controle de regiões recolhidas no Planejamento
  const [collapsedRegioes, setCollapsedRegioes] = useState<Record<string, boolean>>({})
  // Controle de modalidades expandidas dentro de destinos
  const [expandedModalidades, setExpandedModalidades] = useState<Record<string, boolean>>({})
  // Controle de status de lote expandidos dentro de modalidades
  const [expandedStatusLotes, setExpandedStatusLotes] = useState<Record<string, boolean>>({})

  const toggleDestino = (destino: string) => {
    setExpandedDestinos(prev => ({ ...prev, [destino]: !prev[destino] }))
  }

  const toggleRegiao = (regiao: string) => {
    setCollapsedRegioes(prev => ({ ...prev, [regiao]: !prev[regiao] }))
  }

  const toggleModalidade = (key: string) => {
    setExpandedModalidades(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleStatusLote = (key: string) => {
    setExpandedStatusLotes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Carregar parâmetros centrais de Cadastros Auxiliares do Supabase na inicialização
  useEffect(() => {
    fetchPcpAuxParams().then(({ filialRotas, modais, cepRotas }) => {
      if (filialRotas && filialRotas.length > 0) {
        setFilialRotaParams(filialRotas)
        try { localStorage.setItem('magalog_pcp_filial_rotas_params', JSON.stringify(filialRotas)) } catch { }
      }
      if (modais && modais.length > 0) {
        setModalParams(modais)
        try { localStorage.setItem('magalog_pcp_modal_params', JSON.stringify(modais)) } catch { }
      }
      if (cepRotas && cepRotas.length > 0) {
        setCepRotaParams(cepRotas)
        try { localStorage.setItem('magalog_pcp_cep_rotas_params', JSON.stringify(cepRotas)) } catch { }
      }
    }).catch(() => { })
  }, [])

  // Sincronizar parâmetros (local + Supabase para todos os usuários)
  const saveModalParams = (list: ModalParamItem[]) => {
    setModalParams(list)
    try {
      localStorage.setItem('magalog_pcp_modal_params', JSON.stringify(list))
    } catch { }
    savePcpAuxParams('modais', list).catch(() => { })
  }

  const saveFilialRotaParams = (list: FilialRotaParamItem[]) => {
    setFilialRotaParams(list)
    try {
      localStorage.setItem('magalog_pcp_filial_rotas_params', JSON.stringify(list))
    } catch { }
    savePcpAuxParams('filial_rotas', list).catch(() => { })
  }

  const saveCepRotaParams = (list: CepRotaParamItem[]) => {
    setCepRotaParams(list)
    try {
      localStorage.setItem('magalog_pcp_cep_rotas_params', JSON.stringify(list))
    } catch { }
    savePcpAuxParams('cep_rotas', list).catch(() => { })
  }

  const handleAddParam = () => {
    const cod = newCodModal.trim().toUpperCase()
    const mod = newModalidade.trim().toUpperCase()
    if (!cod || !mod) return

    const existingIdx = modalParams.findIndex(p => p.codmodal.toUpperCase() === cod)
    let updated: ModalParamItem[]
    if (existingIdx >= 0) {
      updated = [...modalParams]
      updated[existingIdx] = { codmodal: cod, modalidade: mod }
    } else {
      updated = [{ codmodal: cod, modalidade: mod }, ...modalParams]
    }

    saveModalParams(updated)
    setNewCodModal('')
    setNewModalidade('')
  }

  const handleDeleteParam = (cod: string) => {
    const updated = modalParams.filter(p => p.codmodal.toUpperCase() !== cod.toUpperCase())
    saveModalParams(updated)
  }

  const handleSaveEdit = (idx: number) => {
    if (!editingModalidade.trim()) return
    const updated = [...modalParams]
    updated[idx] = { ...updated[idx], modalidade: editingModalidade.trim().toUpperCase() }
    saveModalParams(updated)
    setEditingIndex(null)
    setEditingModalidade('')
  }

  const handleAddRotaParam = () => {
    const rot = newFilialRota.trim()
    const des = newDestino.trim()
    const reg = newRegiao.trim().toUpperCase()
    if (!rot || !des) return

    const existingIdx = filialRotaParams.findIndex(p => p.filialRota.toUpperCase() === rot.toUpperCase())
    let updated: FilialRotaParamItem[]
    if (existingIdx >= 0) {
      updated = [...filialRotaParams]
      updated[existingIdx] = { filialRota: rot, destino: des, regiao: reg }
    } else {
      updated = [{ filialRota: rot, destino: des, regiao: reg }, ...filialRotaParams]
    }

    saveFilialRotaParams(updated)
    setNewFilialRota('')
    setNewDestino('')
  }

  const handleDeleteRotaParam = (rot: string) => {
    const updated = filialRotaParams.filter(p => p.filialRota.toUpperCase() !== rot.toUpperCase())
    saveFilialRotaParams(updated)
  }

  const handleSaveRotaEdit = (idx: number) => {
    if (!editingRotaDestino.trim()) return
    const updated = [...filialRotaParams]
    updated[idx] = {
      ...updated[idx],
      destino: editingRotaDestino.trim(),
      regiao: editingRotaRegiao.trim().toUpperCase()
    }
    saveFilialRotaParams(updated)
    setEditingRotaIndex(null)
    setEditingRotaDestino('')
    setEditingRotaRegiao('')
  }

  // Handlers do De-Para de CEPs & Rotas
  const handleAddCepParam = () => {
    const c = cleanCep(newCep)
    const r = newCepRota.trim()
    if (!c || !r) {
      alert('Informe o CEP (8 dígitos ou 5 dígitos para prefixo) e a Rota Oficial correspondente.')
      return
    }
    const existingIdx = cepRotaParams.findIndex(p => cleanCep(p.cep) === c)
    let updated: CepRotaParamItem[]
    if (existingIdx >= 0) {
      updated = [...cepRotaParams]
      updated[existingIdx] = {
        ...updated[existingIdx],
        descricaorota: r,
        cidade: newCepCidade.trim() || updated[existingIdx].cidade
      }
    } else {
      updated = [
        { cep: c, descricaorota: r, cidade: newCepCidade.trim() || undefined },
        ...cepRotaParams
      ]
    }
    saveCepRotaParams(updated)
    setNewCep('')
    setNewCepRota('')
    setNewCepCidade('')
  }

  const handleDeleteCepParam = (cepToDelete: string) => {
    const target = cleanCep(cepToDelete)
    const updated = cepRotaParams.filter(p => cleanCep(p.cep) !== target)
    saveCepRotaParams(updated)
  }

  const handleSaveCepEdit = (idx: number) => {
    if (!editingCepRota.trim()) return
    const updated = [...cepRotaParams]
    updated[idx] = {
      ...updated[idx],
      descricaorota: editingCepRota.trim(),
      cidade: editingCepCidade.trim() || updated[idx].cidade
    }
    saveCepRotaParams(updated)
    setEditingCepIndex(null)
    setEditingCepRota('')
    setEditingCepCidade('')
  }

  const handleAutoPopulateCepsFromBase = () => {
    const rows = (fullPlanningData && fullPlanningData.length > 0) ? fullPlanningData : (items && items.length > 0 ? items : initialPlanningSummary)
    const existingCeps = new Set(cepRotaParams.map(p => cleanCep(p.cep)))
    const newlyDiscovered = new Map<string, string>()

    for (const row of rows) {
      const rota = String(row.descricaorota || (row as any).DESCRICAOROTA || '').trim()
      if (rota && !isGenericRoute(rota)) {
        const c = cleanCep(row.cep_entrega || (row as any).CEP_ENTREGA)
        if (c && c.length === 8 && !existingCeps.has(c) && !newlyDiscovered.has(c)) {
          newlyDiscovered.set(c, rota)
        }
      }
    }

    if (newlyDiscovered.size === 0) {
      alert('Todos os CEPs com rotas oficiais não-genéricas da base atual já constam cadastrados no De-Para!')
      return
    }

    const newItems: CepRotaParamItem[] = []
    for (const [cep, descricaorota] of newlyDiscovered.entries()) {
      newItems.push({ cep, descricaorota })
    }

    const updated = [...newItems, ...cepRotaParams]
    saveCepRotaParams(updated)
    alert(`Sucesso! ${newItems.length} novos CEPs com rotas oficiais foram extraídos da base e adicionados ao De-Para!`)
  }

  const filteredCepParams = useMemo(() => {
    const term = searchCepParam.trim().toUpperCase()
    if (!term) return cepRotaParams
    return cepRotaParams.filter(p => {
      const c = cleanCep(p.cep)
      const r = (p.descricaorota || '').toUpperCase()
      const info = findRotaInfo(r)
      const d = (info?.destino || '').toUpperCase()
      const reg = (info?.regiao || '').toUpperCase()
      const cid = (p.cidade || '').toUpperCase()
      return c.includes(term) || r.includes(term) || d.includes(term) || reg.includes(term) || cid.includes(term)
    })
  }, [cepRotaParams, searchCepParam, findRotaInfo])

  const paginatedCepParams = useMemo(() => {
    const from = (cepPage - 1) * cepPageSize
    return filteredCepParams.slice(from, from + cepPageSize)
  }, [filteredCepParams, cepPage, cepPageSize])

  const totalCepPages = Math.ceil(filteredCepParams.length / cepPageSize) || 1

  // --------------------------------------------------------------------------
  // ESTADOS DA ABA CONTROLE & ACOMPANHAMENTO (TABELA BASE DO BANCO DE DADOS)
  // --------------------------------------------------------------------------
  const [items, setItems] = useState<PcpItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedStatusOperacao, setSelectedStatusOperacao] = useState<string>('TODOS')
  const [selectedFilEntrega, setSelectedFilEntrega] = useState<string>('TODOS')

  // Upload e Sincronização
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fallback Local Storage
  const getLocalData = (): PcpItem[] => {
    try {
      const local = localStorage.getItem('magalog_pcp_js_martins_data')
      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Erro ao ler dados locais de PCP:', e)
    }
    return (initialSampleRows as any[]) || []
  }

  // Base completa de registros para o Planejamento (inicia instantaneamente com a base completa pré-processada)
  const [fullPlanningData, setFullPlanningData] = useState<PcpItem[]>(() => {
    return (initialPlanningSummary as any[]) || []
  })
  const [isLoadingPlanning, setIsLoadingPlanning] = useState<boolean>(false)

  // Referência da versão de sincronização atualmente carregada em tela
  const lastLoadedSyncVersionRef = useRef<string | null>(null)

  // Carregar todos os dados completos para o planejamento (com cache inteligente e atualização em segundo plano)
  const loadPlanningData = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoadingPlanning(true)
    try {
      // 1. Obter versão remota atual no Supabase (para validar se o cache local é válido)
      const syncStatus = await getOracleSyncStatus().catch(() => null)
      const remoteVersion = syncStatus?.updated_at || undefined
      if (remoteVersion) {
        setLastSyncDateStr(remoteVersion)
      }

      const dbRows = await getAllPcpSummaryItems(forceRefresh, (fresh) => {
        if (fresh && fresh.length > 0) {
          setFullPlanningData(fresh)
        }
      }, remoteVersion)

      if (dbRows && dbRows.length > 0) {
        setFullPlanningData(dbRows)
        if (remoteVersion) {
          lastLoadedSyncVersionRef.current = remoteVersion
        }
      } else {
        const local = getLocalData()
        if (local && local.length > 0) {
          setFullPlanningData(local)
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados consolidados do planejamento:', e)
      const local = getLocalData()
      if (local && local.length > 0) {
        setFullPlanningData(local)
      }
    } finally {
      setIsLoadingPlanning(false)
    }
  }, [])

  useEffect(() => {
    // Força checagem/carregamento dos dados frescos na montagem inicial
    loadPlanningData(true)
  }, [loadPlanningData])

  // --------------------------------------------------------------------------
  // ESTADOS E CONTROLE DA SINCRONIZAÇÃO DIRETA COM ORACLE MLPDW
  // --------------------------------------------------------------------------
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false)
  const [isSyncingOracle, setIsSyncingOracle] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<OracleSyncStatus>({ status: 'idle' })

  // Timestamp oficial da última sincronização central da Carteira (Supabase / Nuvem)
  const [lastSyncDateStr, setLastSyncDateStr] = useState<string>('2026-11-20T12:22:19')

  const refreshLastSyncTimestamp = useCallback(async () => {
    try {
      const status = await getOracleSyncStatus()
      if (status && status.updated_at) {
        setLastSyncDateStr(status.updated_at)

        // Se detectar que houve uma nova sincronização na nuvem diferente da versão carregada na tela,
        // atualiza os dados automaticamente para todos os usuários sem precisar de F5!
        if (lastLoadedSyncVersionRef.current && status.updated_at !== lastLoadedSyncVersionRef.current) {
          console.log('⚡ Detectada nova sincronização na nuvem por outro usuário/servidor. Atualizando tela automaticamente...', status.updated_at)
          lastLoadedSyncVersionRef.current = status.updated_at
          await loadPlanningData(true)
        }
        return
      }
    } catch { }

    // Fallback: se não encontrar no status, busca a data de alteração mais recente da base
    if (fullPlanningData && fullPlanningData.length > 0) {
      const dates = fullPlanningData
        .map(r => r.dtalter || (r as any).DTALTER)
        .filter(Boolean)
      if (dates.length > 0) {
        dates.sort().reverse()
        setLastSyncDateStr(dates[0])
      }
    }
  }, [fullPlanningData, loadPlanningData])

  useEffect(() => {
    refreshLastSyncTimestamp()
    // Polling a cada 20 segundos para captar atualizações feitas por qualquer outro usuário
    const interval = window.setInterval(refreshLastSyncTimestamp, 20000)
    return () => window.clearInterval(interval)
  }, [refreshLastSyncTimestamp])

  // Ouvinte em tempo real via Supabase Realtime (WebSocket):
  // Quando qualquer usuário ou o servidor corporativo rodar a sincronização,
  // TODOS os navegadores abertos no Magalog recebem o evento e atualizam automaticamente na hora!
  useEffect(() => {
    const channel = supabase
      .channel('pcp_sync_realtime_broadcast')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_metrics',
          filter: 'cell_key=eq.pcp_sync_command'
        },
        () => {
          console.log('⚡ Evento Realtime recebido: Carteira atualizada no servidor! Recarregando dados para todos...')
          refreshLastSyncTimestamp()
          loadPlanningData(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPlanningData, refreshLastSyncTimestamp])

  const handleSyncOracleCarteira = async () => {
    setIsSyncModalOpen(true)
    setIsSyncingOracle(true)
    setSyncStatus({
      status: 'running',
      step: 'starting',
      progress: 10,
      message: '🔌 Conectando ao banco de dados Oracle MLPDW (verificando VPN)...'
    })

    const res = await triggerOracleSync()
    if (!res.success) {
      setIsSyncingOracle(false)
      setSyncStatus({
        status: 'error',
        step: 'failed',
        progress: 0,
        message: res.message || 'Falha ao iniciar sincronização.'
      })
      return
    }

    let ticks = 0
    const pollInterval = window.setInterval(async () => {
      ticks++
      try {
        const current = await getOracleSyncStatus()

        // Se estiver como requested há mais de 8 segundos, orienta o usuário
        if (current.status === 'requested' && ticks >= 5) {
          setSyncStatus({
            ...current,
            message: 'Aguardando o sincronizador no computador. Dê 2 cliques em "iniciar_sincronizador.bat" na pasta do projeto.'
          })
        } else {
          setSyncStatus(current)
        }

        if (current.status === 'success') {
          window.clearInterval(pollInterval)
          setIsSyncingOracle(false)
          await loadPlanningData(true)
          await refreshLastSyncTimestamp()
        } else if (current.status === 'error' || current.status === 'warning') {
          window.clearInterval(pollInterval)
          setIsSyncingOracle(false)
        }
      } catch {
        // Polling contínuo
      }
    }, 1500)
  }

  // Buscar dados com aplicação da coluna auxiliar Modalidade
  const loadData = useCallback(async (p: number = page, search: string = searchTerm) => {
    setIsLoading(true)
    try {
      const res = await getPcpItemsReport({
        page: p,
        pageSize,
        statusOperacao: selectedStatusOperacao,
        filentrega: selectedFilEntrega,
        search
      })

      if (res.count > 0) {
        // Vincula dinamicamente a modalidade, destino e região calculadas
        const enriched = res.data.map(item => {
          const cod = (item.codmodal || '').trim().toUpperCase()
          const modalidadeCalc = modalMap[cod] || item.descricaomodal || '-'
          const isAba = modalidadeCalc.trim().toUpperCase() === 'ABA'

          // Resolve rota oficial pelo CEP caso a rota cadastrada seja genérica (Candeias, 1SX 2SX, etc.) ou modal SEDEX
          const resolvedRota = resolveRouteByCep(item.descricaorota, item.cep_entrega, item.codmodal, item.descricaomodal)

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(item.filentrega || '').trim().toUpperCase()
          const rotaKey = resolvedRota.trim().toUpperCase()

          if (isAba) {
            // Se for ABA (Abastecimento), prioridade máxima para a FILENTREGA da loja/filial (ex: 1349 -> 1349-Limoeiro QUI)
            rotaInfo = findRotaInfo(filEntregaKey) || findRotaInfo(rotaKey) || { destino: '-', regiao: '-' }
          } else {
            // Se for VENDA (PRO, Rodoviário, Courier) ou outros, prioridade máxima para a ROTA cadastrada (ex: 994-EC1 CE LIMOEIRO DO NORTE -> LIMOEIRO DO NORTE)
            rotaInfo = findRotaInfo(rotaKey) || findRotaInfo(filEntregaKey) || { destino: '-', regiao: '-' }
          }

          const tipoModalCalc = getTipoModal(modalidadeCalc)

          return {
            ...item,
            descricaorota: resolvedRota,
            modalidade_calc: modalidadeCalc,
            tipo_modal_calc: tipoModalCalc,
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (resolvedRota || (item.filentrega ? `Filial ${item.filentrega}` : '-')),
            regiao_calc: rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR'
          }
        })
        setItems(enriched)
        setTotalCount(res.count)
      } else {
        // Fallback para cache local / amostra
        const local = getLocalData()
        let filtered = local

        if (selectedStatusOperacao !== 'TODOS') {
          filtered = filtered.filter(item => (item.status_operacao || (item as any).STATUS_OPERACAO) === selectedStatusOperacao)
        }

        if (selectedFilEntrega !== 'TODOS') {
          filtered = filtered.filter(item => String(item.filentrega || (item as any).FILENTREGA) === selectedFilEntrega)
        }

        if (search && search.trim()) {
          const terms = search.split(/[,;\n]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
          filtered = filtered.filter(item => {
            const cod = String(item.item || (item as any).ITEM || '').toLowerCase()
            const desc = String(item.descricao || (item as any).DESCRICAO || '').toLowerCase()
            const ibm = String(item.ibm || (item as any).IBM || '').toLowerCase()
            const ped = String(item.numpedven || (item as any).NUMPEDVEN || '').toLowerCase()
            return terms.some(t => cod.includes(t) || desc.includes(t) || ibm.includes(t) || ped.includes(t))
          })
        }

        setTotalCount(filtered.length)
        const from = (p - 1) * pageSize
        const slice = filtered.slice(from, from + pageSize).map((r: any, idx) => {
          const cod = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          const modalidadeCalc = modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-')
          const isAba = modalidadeCalc.trim().toUpperCase() === 'ABA'

          const rawRota = String(r.descricaorota || r.DESCRICAOROTA || '').trim()
          const rawCep = r.cep_entrega || r.CEP_ENTREGA
          const resolvedRota = resolveRouteByCep(rawRota, rawCep, r.codmodal || r.CODMODAL, r.descricaomodal || r.DESCRICAOMODAL)

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(r.filentrega || r.FILENTREGA || '').trim().toUpperCase()
          const rotaKey = resolvedRota.trim().toUpperCase()

          if (isAba) {
            rotaInfo = findRotaInfo(filEntregaKey) || findRotaInfo(rotaKey) || { destino: '-', regiao: '-' }
          } else {
            rotaInfo = findRotaInfo(rotaKey) || findRotaInfo(filEntregaKey) || { destino: '-', regiao: '-' }
          }

          return {
            id: idx + from + 1,
            filorig: Number(r.filorig || r.FILORIG) || 994,
            codfil: Number(r.codfil || r.CODFIL) || 994,
            filentrega: Number(r.filentrega || r.FILENTREGA) || 0,
            descricaorota: resolvedRota,
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (resolvedRota || (r.filentrega || r.FILENTREGA ? `Filial ${r.filentrega || r.FILENTREGA}` : '-')),
            regiao_calc: rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR',
            numlote: String(r.numlote || r.NUMLOTE || ''),
            fllibfat: String(r.fllibfat || r.FLLIBFAT || ''),
            tpnota: Number(r.tpnota || r.TPNOTA) || 0,
            numpedven: String(r.numpedven || r.NUMPEDVEN || ''),
            numpedcomp: String(r.numpedcomp || r.NUMPEDCOMP || ''),
            dtpedido: String(r.dtpedido || r.DTPEDIDO || ''),
            dtentrega: String(r.dtentrega || r.DTENTREGA || ''),
            dtlibfat: String(r.dtlibfat || r.DTLIBFAT || ''),
            preventrega: String(r.preventrega || r.PREVENTREGA || r.data_entrega_prevista || r.DATA_ENTREGA_PREVISTA || r.prazo_entrega || r.PRAZO_ENTREGA || ''),
            item: formatItemCode(r.item || r.ITEM || ''),
            ibm: String(r.ibm || r.IBM || ''),
            descricao: String(r.descricao || r.DESCRICAO || ''),
            ref: String(r.ref || r.REF || ''),
            fantasia: String(r.fantasia || r.FANTASIA || ''),
            qtcomp: Number(r.qtcomp || r.QTCOMP) || 0,
            fisico: Number(r.fisico || r.FISICO) || 0,
            resfis: Number(r.resfis || r.RESFIS) || 0,
            logico: Number(r.logico || r.LOGICO) || 0,
            reslog: Number(r.reslog || r.RESLOG) || 0,
            tecnico: Number(r.tecnico || r.TECNICO) || 0,
            futuro: Number(r.futuro || r.FUTURO) || 0,
            transito: Number(r.transito || r.TRANSITO) || 0,
            status: String(r.status || r.STATUS || ''),
            situacao: String(r.situacao || r.SITUACAO || ''),
            linha: String(r.linha || r.LINHA || ''),
            linha_ajustada: String(r.linha_ajustada || r.LINHA_AJUSTADA || ''),
            nucleo: String(r.nucleo || r.NUCLEO || ''),
            familia: String(r.familia || r.FAMILIA || ''),
            codrota: String(r.codrota || r.CODROTA || ''),
            descricaorota: String(r.descricaorota || r.DESCRICAOROTA || ''),
            codmodal: cod,
            modalidade_calc: modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-'),
            descricaomodal: String(r.descricaomodal || r.DESCRICAOMODAL || ''),
            status_operacao: String(r.status_operacao || r.STATUS_OPERACAO || 'EM PROCESSO'),
            operacao: String(r.operacao || r.OPERACAO || ''),
            dtalter: String(r.dtalter || r.DTALTER || ''),
            cub_tot: Number(r.cub_tot || r.CUB_TOT) || 0,
            pesoliq: Number(r.pesoliq || r.PESOLIQ) || 0,
            precounit: Number(r.precounit || r.PRECOUNIT) || 0,
            vltotal: Number(r.vltotal || r.VLTOTAL) || 0,
            qtped: Number(r.qtped || r.QTPED) || 0,
            flag_estorno_caixa: String(r.flag_estorno_caixa || r.FLAG_ESTORNO_CAIXA || ''),
            n: String(r.n || r.N || ''),
            turnoagendado: String(r.turnoagendado || r.TURNOAGENDADO || ''),
            dtentregaagendada: String(r.dtentregaagendada || r.DTENTREGAAGENDADA || ''),
            cod_vendedor: String(r.cod_vendedor || r.COD_VENDEDOR || ''),
            prazo_entrega: String(r.prazo_entrega || r.PRAZO_ENTREGA || ''),
            data_entrega_prevista: String(r.data_entrega_prevista || r.DATA_ENTREGA_PREVISTA || ''),
            cep_entrega: String(r.cep_entrega || r.CEP_ENTREGA || ''),
            dt_hr_libfat: String(r.dt_hr_libfat || r.DT_HR_LIBFAT || ''),
            faixa_dias_reduzida: String(r.faixa_dias_reduzida || r.FAIXA_DIAS_REDUZIDA || '')
          }
        })
        setItems(slice)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de PCP:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedStatusOperacao, selectedFilEntrega, searchTerm, modalMap, rotaMap, resolveRouteByCep, findRotaInfo])

  useEffect(() => {
    if (activeTab === 'controle') {
      loadData(page, searchTerm)
    }
  }, [loadData, page, activeTab, searchTerm])

  // Métricas rápidas dos dados carregados
  const stats = useMemo(() => {
    const local = getLocalData()
    const totalVolume = local.reduce((acc, r: any) => acc + (Number(r.fisico || r.FISICO) || 0), 0)
    const totalCubagem = local.reduce((acc, r: any) => acc + (Number(r.cub_tot || r.CUB_TOT) || 0), 0)
    const totalValor = local.reduce((acc, r: any) => {
      const qt = Number(r.qtcomp || r.QTCOMP || 0)
      const pr = Number(r.precounit || r.PRECOUNIT || 0)
      const vl = (pr > 0 && qt > 0) ? (pr * qt) : (Number(r.vltotal || r.VLTOTAL) || 0)
      return acc + vl
    }, 0)
    const emProcesso = local.filter((r: any) => (r.status_operacao || r.STATUS_OPERACAO) === 'EM PROCESSO').length
    const emCarteira = local.filter((r: any) => (r.status_operacao || r.STATUS_OPERACAO) === 'EM CARTEIRA').length

    return {
      totalItens: local.length,
      totalVolume,
      totalCubagem,
      totalValor,
      emProcesso,
      emCarteira
    }
  }, [totalCount])

  // Upload manual da planilha
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress('Lendo arquivo Excel...')
    setUploadFeedback(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets['Plan1'] || wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<any>(ws)

      if (rawRows.length === 0) {
        throw new Error('A planilha selecionada está vazia.')
      }

      setUploadProgress(`Preparando ${rawRows.length.toLocaleString('pt-BR')} registros...`)

      // Tenta salvar no localStorage de forma segura com fallback (evita erro de cota de 5MB do navegador)
      try {
        localStorage.setItem('magalog_pcp_js_martins_data', JSON.stringify(rawRows))
      } catch (storageErr) {
        console.warn('A base completa ultrapassa o limite do localStorage do navegador (5MB). Os dados serão enviados diretamente ao banco de dados Supabase.', storageErr)
        // Salva apenas uma amostra segura no localStorage caso o navegador tenha cota estrita
        try {
          localStorage.setItem('magalog_pcp_js_martins_data', JSON.stringify(rawRows.slice(0, 500)))
        } catch { }
      }

      // Envio em lotes para o Supabase (se a tabela existir)
      const mappedRows = rawRows.map(r => ({
        filorig: Number(r.FILORIG) || 994,
        codfil: Number(r.CODFIL) || 994,
        filentrega: Number(r.FILENTREGA) || null,
        numlote: r.NUMLOTE !== undefined ? String(r.NUMLOTE) : null,
        fllibfat: r.FLLIBFAT !== undefined ? String(r.FLLIBFAT) : null,
        tpnota: Number(r.TPNOTA) || null,
        numpedven: r.NUMPEDVEN !== undefined ? String(r.NUMPEDVEN) : null,
        numpedcomp: r.NUMPEDCOMP !== undefined ? String(r.NUMPEDCOMP) : null,
        dtpedido: r.DTPEDIDO !== undefined ? String(r.DTPEDIDO) : null,
        dtentrega: r.DTENTREGA !== undefined ? String(r.DTENTREGA) : null,
        dtlibfat: r.DTLIBFAT !== undefined ? String(r.DTLIBFAT) : null,
        preventrega: r.PREVENTREGA !== undefined ? String(r.PREVENTREGA) : null,
        item: String(r.ITEM || ''),
        ibm: r.IBM !== undefined ? String(r.IBM) : null,
        descricao: String(r.DESCRICAO || ''),
        ref: r.REF !== undefined ? String(r.REF) : null,
        fantasia: r.FANTASIA !== undefined ? String(r.FANTASIA) : null,
        qtcomp: Number(r.QTCOMP) || 0,
        fisico: Number(r.FISICO) || 0,
        resfis: Number(r.RESFIS) || 0,
        logico: Number(r.LOGICO) || 0,
        reslog: Number(r.RESLOG) || 0,
        tecnico: Number(r.TECNICO) || 0,
        futuro: Number(r.FUTURO) || 0,
        transito: Number(r.TRANSITO) || 0,
        status: r.STATUS !== undefined ? String(r.STATUS) : null,
        situacao: r.SITUACAO !== undefined ? String(r.SITUACAO) : null,
        linha: r.LINHA !== undefined ? String(r.LINHA) : null,
        linha_ajustada: r.LINHA_AJUSTADA !== undefined ? String(r.LINHA_AJUSTADA) : null,
        nucleo: r.NUCLEO !== undefined ? String(r.NUCLEO) : null,
        familia: r.FAMILIA !== undefined ? String(r.FAMILIA) : null,
        codrota: r.CODROTA !== undefined ? String(r.CODROTA) : null,
        descricaorota: r.DESCRICAOROTA !== undefined ? String(r.DESCRICAOROTA) : null,
        codmodal: r.CODMODAL !== undefined ? String(r.CODMODAL) : null,
        descricaomodal: r.DESCRICAOMODAL !== undefined ? String(r.DESCRICAOMODAL) : null,
        status_operacao: r.STATUS_OPERACAO ? String(r.STATUS_OPERACAO) : 'EM PROCESSO',
        operacao: r.OPERACAO !== undefined ? String(r.OPERACAO) : null,
        dtalter: r.DTALTER !== undefined ? String(r.DTALTER) : null,
        cub_tot: Number(r.CUB_TOT) || 0,
        pesoliq: Number(r.PESOLIQ) || 0,
        precounit: Number(r.PRECOUNIT) || 0,
        vltotal: Number(r.VLTOTAL) || 0,
        qtped: Number(r.QTPED) || 0,
        flag_estorno_caixa: r.FLAG_ESTORNO_CAIXA !== undefined ? String(r.FLAG_ESTORNO_CAIXA) : null,
        n: r.N !== undefined ? String(r.N) : null,
        turnoagendado: r.TURNOAGENDADO !== undefined ? String(r.TURNOAGENDADO) : null,
        dtentregaagendada: r.DTENTREGAAGENDADA !== undefined ? String(r.DTENTREGAAGENDADA) : null,
        cod_vendedor: r.COD_VENDEDOR !== undefined ? String(r.COD_VENDEDOR) : null,
        prazo_entrega: r.PRAZO_ENTREGA !== undefined ? String(r.PRAZO_ENTREGA) : null,
        data_entrega_prevista: r.DATA_ENTREGA_PREVISTA !== undefined ? String(r.DATA_ENTREGA_PREVISTA) : null,
        cep_entrega: r.CEP_ENTREGA !== undefined ? String(r.CEP_ENTREGA) : null,
        dt_hr_libfat: r.DT_HR_LIBFAT !== undefined ? String(r.DT_HR_LIBFAT) : null,
        faixa_dias_reduzida: r.FAIXA_DIAS_REDUZIDA !== undefined ? String(r.FAIXA_DIAS_REDUZIDA) : null
      }))

      try {
        setUploadProgress('Sincronizando com o banco de dados Supabase...')
        await supabase.from('pcp_js_martins').delete().neq('id', 0)

        const batchSize = 1000
        for (let i = 0; i < mappedRows.length; i += batchSize) {
          const batch = mappedRows.slice(i, i + batchSize)
          const { error: insErr } = await supabase.from('pcp_js_martins').insert(batch)
          if (insErr) {
            console.warn('Erro ao inserir lote no Supabase:', insErr.message)
            break
          }
          setUploadProgress(`Enviado ${Math.min(i + batchSize, mappedRows.length)} de ${mappedRows.length}...`)
        }
      } catch (errDb) {
        console.warn('Banco Supabase em fallback local:', errDb)
      }

      // Atualiza instantaneamente a visualização e o cache persistente (IndexedDB)
      const summaryForPlanning: PcpItem[] = mappedRows.map(r => ({
        filentrega: r.filentrega,
        fllibfat: r.fllibfat || 'S',
        codmodal: r.codmodal || '',
        descricaomodal: r.descricaomodal || '',
        descricaorota: r.descricaorota || '',
        status_operacao: r.status_operacao || 'EM PROCESSO',
        linha: r.linha || '',
        numpedven: r.numpedven || '',
        numlote: r.numlote,
        item: r.item,
        descricao: r.descricao,
        qtcomp: r.qtcomp,
        fisico: r.fisico,
        qtped: r.qtped,
        cub_tot: r.cub_tot,
        precounit: r.precounit,
        vltotal: r.vltotal,
        pesoliq: r.pesoliq
      }))
      await setPcpPlanningCache(summaryForPlanning)
      setFullPlanningData(summaryForPlanning)

      setUploadFeedback({
        type: 'success',
        message: `${rawRows.length.toLocaleString('pt-BR')} registros importados com sucesso para o banco de dados!`
      })
      loadData(1, searchTerm)
      loadPlanningData(true)
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: `Falha na importação: ${err.message || 'Erro desconhecido'}`
      })
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      if (e.target) e.target.value = ''
    }
  }

  // 4 ABAS DA PÁGINA PCP J'S MARTINS
  const tabs = [
    {
      id: 'planejamento',
      label: 'Planejamento',
      subtitle: 'Previsão de Demanda, Capacidade e S&OP (Consumo da Base)',
      icon: <Layers size={15} />
    },
    {
      id: 'programacao',
      label: 'Programação',
      subtitle: 'Agendamentos Diários, Linhas e Sequenciamento',
      icon: <CalendarDays size={15} />
    },
    {
      id: 'controle',
      label: 'Controle & Acompanhamento',
      subtitle: 'Banco de Dados Operacional (53 Colunas + Coluna Auxiliar)',
      icon: <Database size={15} />
    },
    {
      id: 'cadastros',
      label: 'Cadastros Auxiliares',
      subtitle: 'Parâmetros de De-Para (Modalidade, Linhas e Regras de Negócio)',
      icon: <Settings2 size={15} />
    }
  ] as const

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Renderizador formatado de célula
  const renderCell = (row: PcpItem, col: typeof PCP_COLUMNS[number]) => {
    const val = (row as any)[col.key]
    if (val === null || val === undefined || val === '') return '-'

    if (col.key === 'item' || col.key === 'ibm' || col.key === 'codrota') {
      return formatItemCode(val)
    }

    if (col.key === 'preventrega' || col.key === 'dtpedido' || col.key === 'dtentrega' || col.key === 'dtlibfat' || col.key === 'dtalter') {
      return formatDateBR(val)
    }

    if (col.type === 'num') {
      const num = Number(val)
      return isNaN(num) ? String(val) : num.toLocaleString('pt-BR')
    }

    if (col.type === 'cur') {
      const num = Number(val)
      return isNaN(num) ? String(val) : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (col.key === 'modalidade_calc') {
      const mod = String(val).toUpperCase()
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (mod === 'RODOVIARIO') color = 'bg-blue-100 text-blue-800 border-blue-200'
      if (mod === 'ABA') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (mod === 'COURRIER') color = 'bg-amber-100 text-amber-800 border-amber-200'
      if (mod === 'TRANSFERENCIA') color = 'bg-purple-100 text-purple-800 border-purple-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {mod}
        </span>
      )
    }

    if (col.key === 'tipo_modal_calc') {
      const tipo = String(val)
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (tipo === 'Venda') color = 'bg-blue-100 text-blue-800 border-blue-200'
      if (tipo === 'Abastecimento') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (tipo === 'Tranfs') color = 'bg-purple-100 text-purple-800 border-purple-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {tipo}
        </span>
      )
    }

    if (col.key === 'regiao_calc') {
      const reg = String(val).toUpperCase()
      let color = 'bg-slate-100 text-slate-700 border-slate-200'
      if (reg === 'CAPITAL') color = 'bg-cyan-100 text-cyan-800 border-cyan-200'
      if (reg === 'METROPOLITANA') color = 'bg-indigo-100 text-indigo-800 border-indigo-200'
      if (reg === 'INTERIOR') color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
      if (reg.includes('ABASTECIMENTO')) color = 'bg-amber-100 text-amber-800 border-amber-200'

      return (
        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase whitespace-nowrap border ${color}`}>
          {reg}
        </span>
      )
    }

    if (col.key === 'destino_calc') {
      return (
        <span className="font-semibold text-slate-800">
          {String(val)}
        </span>
      )
    }

    if (col.key === 'status_operacao') {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase whitespace-nowrap ${val === 'EM PROCESSO'
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
          }`}>
          {val}
        </span>
      )
    }

    return String(val)
  }

  // Filtragem dos parâmetros da tabela de De-Para (Modal)
  const filteredParams = useMemo(() => {
    if (!searchParam.trim()) return modalParams
    const q = searchParam.trim().toLowerCase()
    return modalParams.filter(p =>
      p.codmodal.toLowerCase().includes(q) ||
      p.modalidade.toLowerCase().includes(q)
    )
  }, [modalParams, searchParam])

  // Filtragem dos parâmetros da tabela de De-Para (Filiais/Rotas)
  const filteredRotaParams = useMemo(() => {
    if (!searchRotaParam.trim()) return filialRotaParams
    const q = searchRotaParam.trim().toLowerCase()
    return filialRotaParams.filter(p =>
      p.filialRota.toLowerCase().includes(q) ||
      p.destino.toLowerCase().includes(q) ||
      p.regiao.toLowerCase().includes(q)
    )
  }, [filialRotaParams, searchRotaParam])

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* BARRA DE MENUS NO CANTO ESQUERDO COM OPÇÃO DE AUTO-OCULTAR         */}
      {/* ------------------------------------------------------------------ */}
      {!isMenuAutoHide ? (
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
          {/* Menus alinhados no canto esquerdo */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-0.5 flex-wrap sm:flex-nowrap">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Botão para ativar modo auto-ocultar */}
          <button
            type="button"
            onClick={toggleMenuAutoHide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Ocultar menus automaticamente para ganhar mais espaço de tela (só exibe ao passar o mouse)"
          >
            <Pin size={12} className="text-slate-400 rotate-45" />
            <span className="hidden sm:inline">Auto-ocultar menus</span>
          </button>
        </div>
      ) : (
        <div
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
          className="relative z-40 -mb-2"
        >
          {/* Faixa / Gatilho fino de ativação no canto esquerdo */}
          <div className="flex items-center justify-between py-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100/80 hover:bg-blue-50 border border-slate-200/80 text-[11px] font-bold text-slate-600 hover:text-blue-700 cursor-pointer shadow-2xs transition-all">
              <Menu size={12} className="text-blue-600" />
              <span>Menu: <strong className="text-blue-700 capitalize">{currentTabInfo.label}</strong></span>
              <span className="text-[9.5px] text-slate-400 font-normal ml-1">(passe o mouse aqui para navegar)</span>
            </div>

            <button
              type="button"
              onClick={toggleMenuAutoHide}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Fixar menus permanentemente visíveis na tela"
            >
              <PinOff size={11} className="text-amber-500" />
              <span className="hidden sm:inline">Fixar menu</span>
            </button>
          </div>

          {/* Menu Flutuante que surge sobreposto ao passar o mouse */}
          {isMenuHovered && (
            <div className="absolute top-0 left-0 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 shadow-xl p-2 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150 min-w-[520px]">
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-0.5 flex-wrap sm:flex-nowrap">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id)
                        setIsMenuHovered(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={toggleMenuAutoHide}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                title="Fixar menus permanentemente visíveis na tela"
              >
                <Pin size={12} className="text-blue-600" />
                <span className="hidden sm:inline">Fixar menu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK DE UPLOAD */}
      {uploadFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${uploadFeedback.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          <div className="flex items-center gap-2">
            {uploadFeedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            <span>{uploadFeedback.message}</span>
          </div>
          <button type="button" onClick={() => setUploadFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold px-1.5">✕</button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 4: CADASTROS AUXILIARES (DE-PARA DE PARÂMETROS E REGRAS)       */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'cadastros' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Settings2 size={18} className="text-blue-600" /> Parâmetros de Colunas Auxiliares
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre e edite as regras de De-Para. Os parâmetros alimentam automaticamente as colunas auxiliares calculadas (<strong>MODALIDADE</strong>, <strong>DESTINO</strong> e <strong>REGIÃO</strong>) em todo o sistema.
              </p>
            </div>
            {/* SUB-ABAS DE CADASTRO */}
            <div className="flex items-center p-1 bg-white rounded-xl border border-blue-200 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setActiveSubParam('rotas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubParam === 'rotas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Truck size={13} />
                <span>Filiais / Rotas & Regiões ({filialRotaParams.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubParam('modal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubParam === 'modal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <Layers size={13} />
                <span>Modalidade ({modalParams.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubParam('ceps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeSubParam === 'ceps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <MapPin size={13} />
                <span>De-Para CEPs & Rotas ({cepRotaParams.length})</span>
              </button>
            </div>
          </div>

          {/* SUBPÁGINA 1: FILIAIS / ROTAS & REGIÕES */}
          {activeSubParam === 'rotas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* FORMULÁRIO DE CADASTRO RÁPIDO ROTAS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Plus size={16} className="text-emerald-600" /> Nova Regra (Filial/Rota $\rightarrow$ Região)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Filial / Rota
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 710, 994-EC1 CE SOBRAL..."
                      value={newFilialRota}
                      onChange={(e) => setNewFilialRota(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Destino / Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 710-Fortaleza QUA - SAB, SOBRAL..."
                      value={newDestino}
                      onChange={(e) => setNewDestino(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Região
                    </label>
                    <select
                      value={newRegiao}
                      onChange={(e) => setNewRegiao(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold bg-white cursor-pointer uppercase"
                    >
                      <option value="INTERIOR">INTERIOR</option>
                      <option value="CAPITAL">CAPITAL</option>
                      <option value="METROPOLITANA">METROPOLITANA</option>
                      <option value="ABASTECIMENTO CDs">ABASTECIMENTO CDs</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRotaParam}
                    disabled={!newFilialRota.trim() || !newDestino.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salvar Parâmetro de Rota</span>
                  </button>
                </div>
              </div>

              {/* TABELA DE GERENCIAMENTO DE FILIAIS/ROTAS */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Mapeamento (Filial/Rotas $\rightarrow$ Destino & Região)</h3>
                    <p className="text-xs text-slate-500">Total de {filialRotaParams.length} regras cadastradas.</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar filial, destino ou região..."
                      value={searchRotaParam}
                      onChange={(e) => setSearchRotaParam(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-[10.5px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Filial / Rota</th>
                        <th className="py-2.5 px-4">Destino</th>
                        <th className="py-2.5 px-4 text-center">Região</th>
                        <th className="py-2.5 px-4 text-center w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRotaParams.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Nenhum parâmetro de rota encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredRotaParams.map((param, idx) => {
                          const isEditing = editingRotaIndex === idx
                          return (
                            <tr key={`${param.filialRota}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900 truncate max-w-[200px]" title={param.filialRota}>
                                {param.filialRota}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingRotaDestino}
                                    onChange={(e) => setEditingRotaDestino(e.target.value)}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-medium w-full"
                                    autoFocus
                                  />
                                ) : (
                                  param.destino
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <select
                                    value={editingRotaRegiao}
                                    onChange={(e) => setEditingRotaRegiao(e.target.value)}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-bold"
                                  >
                                    <option value="INTERIOR">INTERIOR</option>
                                    <option value="CAPITAL">CAPITAL</option>
                                    <option value="METROPOLITANA">METROPOLITANA</option>
                                    <option value="ABASTECIMENTO CDs">ABASTECIMENTO CDs</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${param.regiao === 'CAPITAL' ? 'bg-cyan-100 text-cyan-800' :
                                    param.regiao === 'METROPOLITANA' ? 'bg-indigo-100 text-indigo-800' :
                                      param.regiao === 'INTERIOR' ? 'bg-emerald-100 text-emerald-800' :
                                        'bg-amber-100 text-amber-800'
                                    }`}>
                                    {param.regiao}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRotaEdit(idx)}
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                      title="Salvar alteração"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRotaIndex(null)}
                                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRotaIndex(idx)
                                        setEditingRotaDestino(param.destino)
                                        setEditingRotaRegiao(param.regiao)
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                      title="Editar parâmetro"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRotaParam(param.filialRota)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir regra"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBPÁGINA 2: MODALIDADES */}
          {activeSubParam === 'modal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* CARD 1: FORMULÁRIO DE CADASTRO RÁPIDO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Plus size={16} className="text-emerald-600" /> Novo Parâmetro (Modalidade)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Código do Modal (CODMODAL)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RD1, EAL, CD0..."
                      value={newCodModal}
                      onChange={(e) => setNewCodModal(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Modalidade Atribuída
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: RODOVIARIO, ABA, COURRIER..."
                      value={newModalidade}
                      onChange={(e) => setNewModalidade(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold uppercase"
                    />
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {['RODOVIARIO', 'ABA', 'COURRIER', 'TRANSFERENCIA'].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewModalidade(sug)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParam}
                    disabled={!newCodModal.trim() || !newModalidade.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Salvar Regra de Modalidade</span>
                  </button>
                </div>
              </div>

              {/* CARD 2 E 3: TABELA DE GERENCIAMENTO E EDIÇÃO DOS PARÂMETROS */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Tabela de Mapeamento (CODMODAL $\rightarrow$ MODALIDADE)</h3>
                    <p className="text-xs text-slate-500">Edite os valores em linha ou adicione novos códigos.</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar código ou modalidade..."
                      value={searchParam}
                      onChange={(e) => setSearchParam(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-[10.5px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">CODMODAL</th>
                        <th className="py-2.5 px-4">MODALIDADE</th>
                        <th className="py-2.5 px-4 text-center">TIPO MODAL</th>
                        <th className="py-2.5 px-4 text-center w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredParams.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Nenhum parâmetro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredParams.map((param, idx) => {
                          const isEditing = editingIndex === idx
                          const tipoModal = getTipoModal(param.modalidade)
                          return (
                            <tr key={param.codmodal} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                                {param.codmodal}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingModalidade}
                                    onChange={(e) => setEditingModalidade(e.target.value.toUpperCase())}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-bold"
                                    autoFocus
                                  />
                                ) : (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${param.modalidade === 'RODOVIARIO' ? 'bg-blue-100 text-blue-800' :
                                    param.modalidade === 'ABA' ? 'bg-emerald-100 text-emerald-800' :
                                      param.modalidade === 'COURRIER' ? 'bg-amber-100 text-amber-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {param.modalidade}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tipoModal === 'Venda' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  tipoModal === 'Abastecimento' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                  {tipoModal}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(idx)}
                                      className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                      title="Salvar alteração"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndex(null)}
                                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingIndex(idx)
                                        setEditingModalidade(param.modalidade)
                                      }}
                                      className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                      title="Editar modalidade"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteParam(param.codmodal)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir regra"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBPÁGINA 3: DE-PARA DE CEPS & ROTAS */}
          {activeSubParam === 'ceps' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* CARD 1: FORMULÁRIO DE CADASTRO E AUTO-POPULAÇÃO */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Plus size={16} className="text-emerald-600" /> Novo De-Para (CEP &rarr; Rota Oficial)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        CEP de Entrega
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 62870000 ou 62870"
                        value={newCep}
                        onChange={(e) => setNewCep(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Informe 8 dígitos (exato) ou 5 dígitos (prefixo regional).
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Rota Oficial Correspondente
                      </label>
                      <input
                        type="text"
                        list="available-official-rotas"
                        placeholder="Ex: 994-EC1 CE PACAJUS ou 994-EC2 CE FORTALEZA A..."
                        value={newCepRota}
                        onChange={(e) => setNewCepRota(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                      <datalist id="available-official-rotas">
                        {Array.from(new Set(filialRotaParams.map(p => p.filialRota))).sort().map(r => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Cidade / Bairro / Obs (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pacajus, Fortaleza Aldeota..."
                        value={newCepCidade}
                        onChange={(e) => setNewCepCidade(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCepParam}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <Save size={14} />
                      <span>Salvar Parâmetro de CEP</span>
                    </button>
                  </div>
                </div>

                {/* CARD 2: AUTO-ALIMENTAÇÃO PELA BASE & ESTATÍSTICAS */}
                <div className="bg-linear-to-br from-indigo-50/70 to-blue-50/50 p-4 rounded-2xl border border-indigo-100 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Alimentação Inteligente
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {cepRotaParams.length.toLocaleString('pt-BR')} regras ativas
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Extraia automaticamente do banco de dados todos os CEPs que já possuem rotas oficiais não-genéricas cadastradas para alimentar esta lista.
                  </p>

                  <button
                    type="button"
                    onClick={handleAutoPopulateCepsFromBase}
                    className="w-full py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>Auto-Alimentar pela Base</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100/80 text-[10.5px]">
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Fortaleza (Rotas A-N)</span>
                      <strong className="text-indigo-950 font-mono text-xs">
                        {cepRotaParams.filter(p => (p.descricaorota || '').toUpperCase().includes('FORTALEZA')).length} CEPs
                      </strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Interior / Reg. Metro</span>
                      <strong className="text-indigo-950 font-mono text-xs">
                        {cepRotaParams.filter(p => !(p.descricaorota || '').toUpperCase().includes('FORTALEZA')).length} CEPs
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: TABELA DE REGRAS DE CEP CADASTRADAS */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600" /> De-Para de CEPs e Rotas
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {filteredCepParams.length.toLocaleString('pt-BR')} registros
                    </span>
                  </div>

                  {/* Campo de Busca Rápida */}
                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar CEP, rota, destino..."
                      value={searchCepParam}
                      onChange={(e) => {
                        setSearchCepParam(e.target.value)
                        setCepPage(1)
                      }}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                    {searchCepParam && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchCepParam('')
                          setCepPage(1)
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabela Responsiva */}
                <div className="overflow-x-auto flex-1 min-h-[400px] max-h-[560px] scrollbar-thin">
                  <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider z-10 shadow-2xs">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12 text-slate-400 font-mono text-[9px]">#</th>
                        <th className="py-2.5 px-3">CEP / Prefixo</th>
                        <th className="py-2.5 px-3">Rota Oficial</th>
                        <th className="py-2.5 px-3 text-center">Destino</th>
                        <th className="py-2.5 px-3 text-center">Região</th>
                        <th className="py-2.5 px-3">Cidade / Obs</th>
                        <th className="py-2.5 px-3 text-center w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedCepParams.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Nenhuma regra de CEP encontrada com o filtro informado.
                          </td>
                        </tr>
                      ) : (
                        paginatedCepParams.map((param, idx) => {
                          const globalIdx = (cepPage - 1) * cepPageSize + idx
                          const isEditing = editingCepIndex === globalIdx
                          const cleanC = cleanCep(param.cep)
                          const formattedCep = cleanC.length === 8 ? `${cleanC.slice(0, 5)}-${cleanC.slice(5)}` : `${cleanC} (prefixo)`
                          const rotaUpper = (param.descricaorota || '').toUpperCase()
                          const targetInfo = findRotaInfo(rotaUpper) || { destino: '-', regiao: '-' }

                          return (
                            <tr key={`${param.cep}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                {globalIdx + 1}
                              </td>

                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                <span className={`px-1.5 py-0.5 rounded text-[10.5px] ${cleanC.length === 5 ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold' : 'bg-slate-100 text-slate-800'}`}>
                                  {formattedCep}
                                </span>
                              </td>

                              <td className="py-2 px-3 font-semibold text-blue-700">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    list="available-official-rotas"
                                    value={editingCepRota}
                                    onChange={(e) => setEditingCepRota(e.target.value)}
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden font-bold w-full"
                                    autoFocus
                                  />
                                ) : (
                                  param.descricaorota
                                )}
                              </td>

                              <td className="py-2 px-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                                  {targetInfo.destino !== '-' ? targetInfo.destino : (param.destino || '-')}
                                </span>
                              </td>

                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${targetInfo.regiao === 'CAPITAL' ? 'bg-blue-100 text-blue-800' :
                                  targetInfo.regiao === 'METROPOLITANA' ? 'bg-indigo-100 text-indigo-800' :
                                    targetInfo.regiao === 'INTERIOR' ? 'bg-emerald-100 text-emerald-800' :
                                      'bg-slate-100 text-slate-700'
                                  }`}>
                                  {targetInfo.regiao !== '-' ? targetInfo.regiao : (param.regiao || 'INTERIOR')}
                                </span>
                              </td>

                              <td className="py-2 px-3 text-slate-500 text-[11px]">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCepCidade}
                                    onChange={(e) => setEditingCepCidade(e.target.value)}
                                    placeholder="Cidade / Obs"
                                    className="px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-hidden w-full"
                                  />
                                ) : (
                                  param.cidade || '-'
                                )}
                              </td>

                              <td className="py-2 px-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCepEdit(globalIdx)}
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                      title="Salvar alterações"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCepIndex(null)
                                        setEditingCepRota('')
                                        setEditingCepCidade('')
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                                      title="Cancelar edição"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCepIndex(globalIdx)
                                        setEditingCepRota(param.descricaorota)
                                        setEditingCepCidade(param.cidade || '')
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                      title="Editar regra"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCepParam(param.cep)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir regra"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalCepPages > 1 && (
                  <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Mostrando {Math.min((cepPage - 1) * cepPageSize + 1, filteredCepParams.length)} - {Math.min(cepPage * cepPageSize, filteredCepParams.length)} de {filteredCepParams.length} regras
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCepPage(p => Math.max(1, p - 1))}
                        disabled={cepPage === 1}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                      >
                        <ChevronLeft size={13} /> Anterior
                      </button>

                      <span className="px-2 font-mono font-bold text-slate-700 text-xs">
                        {cepPage} / {totalCepPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setCepPage(p => Math.min(totalCepPages, p + 1))}
                        disabled={cepPage >= totalCepPages}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                      >
                        Próxima <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 3: CONTROLE & ACOMPANHAMENTO (BASE DE DADOS COM 53 COLS + AUX) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'controle' && (
        <div className="space-y-4">
          {/* CARDS DE RESUMO DA BASE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Database size={13} className="text-blue-500" /> Total Registros
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {(totalCount || stats.totalItens).toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Linhas na base</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Boxes size={13} className="text-amber-500" /> Em Processo
              </span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {stats.emProcesso.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Separação / Docas</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Package size={13} className="text-indigo-500" /> Em Carteira
              </span>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {stats.emCarteira.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Backlog de Pedidos</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Truck size={13} className="text-emerald-500" /> Volume Peças
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {stats.totalVolume.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-400">Estoque Físico CD</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Layers size={13} className="text-purple-500" /> Cubagem Total
              </span>
              <p className="text-xl font-black text-purple-700 mt-1">
                {stats.totalCubagem.toFixed(1)} <span className="text-xs font-normal">m³</span>
              </p>
              <span className="text-[10px] text-slate-400">Metragem Cúbica</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <BarChart3 size={13} className="text-slate-500" /> Valor Total
              </span>
              <p className="text-lg font-black text-slate-800 mt-1">
                R$ {(stats.totalValor / 1_000_000).toFixed(1)}M
              </p>
              <span className="text-[10px] text-slate-400">Faturamento Previsto</span>
            </div>
          </div>

          {/* BARRA DE CONTROLE, FILTROS E UPLOAD */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Campo de Busca Rápida com Separador de Vírgula */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar Item, Pedido, Descrição (separados por vírgula)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Filtros Dropdown e Botões de Ação */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Status Operação */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Filter size={12} className="text-slate-400" />
                <span className="text-[10.5px] font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={selectedStatusOperacao}
                  onChange={(e) => {
                    setSelectedStatusOperacao(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="EM PROCESSO">EM PROCESSO</option>
                  <option value="EM CARTEIRA">EM CARTEIRA</option>
                </select>
              </div>

              {/* Indicador de 53 colunas + Auxiliar */}
              <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                53 Colunas + Coluna Auxiliar Ativa
              </div>

              {/* Botão Recarregar */}
              <button
                type="button"
                onClick={() => loadData(page, searchTerm)}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Recarregar dados"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              </button>

              {/* Botão Atualizar Carteira Direto no Oracle */}
              <button
                type="button"
                onClick={handleSyncOracleCarteira}
                disabled={isSyncingOracle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-2xs disabled:opacity-60 active:scale-95"
                title="Consultar Carteira diretamente do Oracle MLPDW e sincronizar com Supabase"
              >
                <Database size={14} className={isSyncingOracle ? 'animate-spin' : ''} />
                <span>{isSyncingOracle ? 'Atualizando...' : 'Atualizar Carteira (Oracle)'}</span>
              </button>

              {/* Botão de Upload / Importar PCP J'S MARTINS.xlsx */}
              <label
                htmlFor="pcp-file-upload"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-2xs ${isUploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                title="Atualizar base a partir de PCP J'S MARTINS.xlsx"
              >
                <UploadCloud size={14} />
                <span>{isUploading ? uploadProgress || 'Importando...' : "Importar PCP J'S MARTINS.xlsx"}</span>
              </label>
              <input
                id="pcp-file-upload"
                type="file"
                accept=".xlsx, .xls"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* TABELA DE DADOS DA BASE COM AS 53 COLUNAS + COLUNA AUXILIAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[620px] scrollbar-thin">
              <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 bg-slate-100 text-slate-700 text-center w-12 sticky left-0 z-20 border-r border-slate-200">
                      #
                    </th>
                    {PCP_COLUMNS.map((col, cIdx) => (
                      <th
                        key={col.key}
                        className={`py-2.5 px-3 ${col.width || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          } border-r border-slate-200/60 hover:bg-slate-100 transition-colors ${col.key === 'modalidade_calc' ? 'bg-amber-50/70 text-amber-900 border-amber-200' : ''
                          }`}
                        title={`Coluna ${cIdx + 1}: ${col.label}`}
                      >
                        <span className="text-slate-400 font-normal mr-1 text-[9px]">#{cIdx + 1}</span>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={PCP_COLUMNS.length + 1} className="py-14 text-center text-slate-400">
                        <RefreshCw size={26} className="animate-spin mx-auto mb-2 text-blue-600" />
                        Carregando registros da base PCP...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={PCP_COLUMNS.length + 1} className="py-14 text-center text-slate-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2 px-2.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        {PCP_COLUMNS.map(col => (
                          <td
                            key={col.key}
                            className={`py-2 px-3 border-r border-slate-100 ${col.align === 'right'
                              ? 'text-right font-mono'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                              } ${col.key === 'item' || col.key === 'numpedven' ? 'font-mono font-bold text-slate-900' : ''
                              } ${col.key === 'descricao' ? 'font-medium text-slate-800' : 'text-slate-600'
                              } ${col.key === 'vltotal' ? 'font-bold text-emerald-700' : ''
                              } ${col.key === 'cub_tot' ? 'font-semibold text-purple-700' : ''
                              } ${col.key === 'modalidade_calc' ? 'bg-amber-50/30' : ''
                              }`}
                          >
                            {renderCell(row, col)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-500 gap-3">
              <div>
                Exibindo <span className="font-bold text-slate-800">{items.length}</span> de{' '}
                <span className="font-bold text-slate-800">{totalCount.toLocaleString('pt-BR')}</span> registros (com coluna auxiliar ativa)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Página <strong className="text-slate-800">{page}</strong> de <strong className="text-slate-800">{totalPages}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 1: PLANEJAMENTO (VISÃO RESUMO DESTINOS & REGIÕES COM FILTROS)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'planejamento' && (() => {
        // Obter toda a base consolidada de registros (do Supabase ou cache local)
        const allRows = fullPlanningData.length > 0 ? fullPlanningData : getLocalData()

        // Data de referência operacional para cálculo de prazos/SLA
        const opRefDate = getOperationalReferenceDate(allRows)

        // Enriquecer e filtrar a base conforme filtros da aba Planejamento
        const enrichedBase = allRows.map((r: any) => {
          const cod = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          const modalidade = modalMap[cod] || String(r.descricaomodal || r.DESCRICAOMODAL || '-')
          const isAba = modalidade.trim().toUpperCase() === 'ABA'

          const rawRota = String(r.descricaorota || r.DESCRICAOROTA || '').trim()
          const rawCep = r.cep_entrega || r.CEP_ENTREGA
          const resolvedRota = resolveRouteByCep(rawRota, rawCep, r.codmodal || r.CODMODAL, r.descricaomodal || r.DESCRICAOMODAL)

          let rotaInfo = { destino: '-', regiao: '-' }
          const filEntregaKey = String(r.filentrega || r.FILENTREGA || '').trim().toUpperCase()
          const rotaKey = resolvedRota.trim().toUpperCase()

          if (isAba) {
            // Se modalidade for ABA (Abastecimento), prioridade máxima para FILENTREGA no cadastro (ex: 1349 -> 1349-Limoeiro QUI)
            rotaInfo = findRotaInfo(filEntregaKey) || findRotaInfo(rotaKey) || { destino: '-', regiao: '-' }
          } else {
            // Se for VENDA (PRO, Rodoviário, Courier) ou outras, prioridade máxima para a ROTA cadastrada (ex: 994-EC1 CE LIMOEIRO DO NORTE -> LIMOEIRO DO NORTE)
            rotaInfo = findRotaInfo(rotaKey) || findRotaInfo(filEntregaKey) || { destino: '-', regiao: '-' }
          }

          const regiao = rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR'
          const destino = rotaInfo.destino !== '-' ? rotaInfo.destino : (resolvedRota || (r.filentrega || r.FILENTREGA ? `Filial ${r.filentrega || r.FILENTREGA}` : 'OUTROS'))
          const statusOperacao = String(r.status_operacao || r.STATUS_OPERACAO || '')
          const linha = String(r.linha || r.LINHA || '')
          const fllibfat = String(r.fllibfat || r.FLLIBFAT || 'S').trim().toUpperCase()
          const tipoModal = getTipoModal(modalidade)
          const prazoFaixa = getPrazoFaixa(r, isAba, opRefDate)

          return {
            ...r,
            descricaorota: resolvedRota,
            calc_regiao: regiao,
            calc_destino: destino,
            calc_modalidade: modalidade,
            calc_tipo_modal: tipoModal,
            calc_fllibfat: fllibfat,
            calc_status_op: statusOperacao,
            calc_linha: linha,
            calc_prazo: prazoFaixa,
            calc_ped: String(r.numpedven || r.NUMPEDVEN || ''),
            calc_qtd: (() => {
              const q = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              return q || Number(r.fisico || r.FISICO || r.qtped || r.QTPED) || 1
            })(),
            calc_cub: Number(r.cub_tot || r.CUB_TOT) || 0,
            calc_vltotal: (() => {
              const qt = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              const pr = Number(r.precounit !== undefined ? r.precounit : (r.PRECOUNIT !== undefined ? r.PRECOUNIT : 0))
              return (pr > 0 && qt > 0) ? (pr * qt) : (Number(r.vltotal || r.VLTOTAL) || 0)
            })(),
            calc_peso: (() => {
              const qt = Number(r.qtcomp !== undefined ? r.qtcomp : (r.QTCOMP !== undefined ? r.QTCOMP : 0))
              const ps = Number(r.pesoliq !== undefined ? r.pesoliq : (r.PESOLIQ !== undefined ? r.PESOLIQ : 0))
              return (ps > 0 && qt > 0) ? (ps * qt) : (Number(r.pesoliq || r.PESOLIQ) || 0)
            })()
          }
        })

        // Listas únicas de opções para os filtros de multi-seleção
        const canonicalRegioes = ['CAPITAL', 'METROPOLITANA', 'INTERIOR', 'ABASTECIMENTO CDs']
        const extraRegioes = Array.from(new Set(enrichedBase.map(r => r.calc_regiao))).filter(r => r && !canonicalRegioes.includes(r)).sort()
        const uniqueRegioesList = [...canonicalRegioes, ...extraRegioes]
        const uniqueDestinosList = Array.from(new Set(enrichedBase.map(r => r.calc_destino))).filter(Boolean).sort()
        const uniqueModalidadesList = Array.from(new Set(enrichedBase.map(r => r.calc_modalidade))).filter(Boolean).sort()
        const uniqueLinhasList = Array.from(new Set(enrichedBase.map(r => r.calc_linha))).filter(Boolean).sort()

        // Suporte a múltiplos termos / itens na Busca Rápida (separados por vírgula, ponto e vírgula, tab, quebra de linha ou espaço numérico)
        const rawSearch = planSearchTerm.trim()
        let searchTokens: string[] = []
        if (rawSearch) {
          if (/[,;\t\n\r]/.test(rawSearch)) {
            searchTokens = rawSearch.split(/[,;\t\n\r]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
          } else if (/^\d+(\s+\d+)+$/.test(rawSearch)) {
            searchTokens = rawSearch.split(/\s+/).map(t => t.trim().toLowerCase()).filter(Boolean)
          } else {
            searchTokens = [rawSearch.toLowerCase()]
          }
        }

        const matchSearch = (r: any) => {
          if (searchTokens.length === 0) return true
          return searchTokens.some(term => {
            const matchDest = r.calc_destino && r.calc_destino.toLowerCase().includes(term)
            const matchReg = r.calc_regiao && r.calc_regiao.toLowerCase().includes(term)
            const matchPed = r.calc_ped && r.calc_ped.toLowerCase().includes(term)
            const matchRota = String(r.descricaorota || r.DESCRICAOROTA || '').toLowerCase().includes(term)
            const matchFil = String(r.filentrega || r.FILENTREGA || '').toLowerCase().includes(term)
            const matchItem = String(r.item || r.ITEM || '').toLowerCase().includes(term)
            const matchDesc = String(r.descricao || r.DESCRICAO || '').toLowerCase().includes(term)
            const matchCep = String(r.cep_entrega || r.CEP_ENTREGA || '').replace(/\.0+$/, '').includes(term)
            return matchDest || matchReg || matchPed || matchRota || matchFil || matchItem || matchDesc || matchCep
          })
        }

        // Contagem de pedidos por Faixa de Prazo (SLA) considerando os filtros ativos (exceto o próprio filtro de prazo)
        const prazoCounts: Record<string, number> = {}
        PRAZO_FAIXAS.forEach(f => {
          const pedsSet = new Set<string>()
          let countItems = 0
          enrichedBase.forEach(r => {
            if (r.calc_prazo !== f) return
            if (planFilterRegioes.length > 0 && !planFilterRegioes.includes(r.calc_regiao)) return
            if (planFilterDestinos.length > 0 && !planFilterDestinos.includes(r.calc_destino)) return
            if (planFilterModalidades.length > 0 && !planFilterModalidades.includes(r.calc_modalidade)) return
            if (planFilterLinhas.length > 0 && !planFilterLinhas.includes(r.calc_linha)) return
            if (planFilterTipoModal.length > 0 && !planFilterTipoModal.includes(r.calc_tipo_modal)) return
            if (planFilterFllibfat.length > 0 && !planFilterFllibfat.includes(r.calc_fllibfat)) return
            if (planFilterStatusOp.length > 0) {
              const raw = String(r.calc_status_op || '').toUpperCase()
              const matchStatus = planFilterStatusOp.some(st => {
                if (st === 'EM CARTEIRA') return raw.includes('CARTEIRA')
                if (st === 'EM PROCESSO') return raw.includes('PROCESSO')
                return raw === st
              })
              if (!matchStatus) return
            }
            if (!matchSearch(r)) return
            if (r.calc_ped) pedsSet.add(r.calc_ped)
            countItems++
          })
          prazoCounts[f] = pedsSet.size || countItems
        })

        const enrichedFiltered = enrichedBase.filter(r => {
          if (planFilterRegioes.length > 0 && !planFilterRegioes.includes(r.calc_regiao)) return false
          if (planFilterDestinos.length > 0 && !planFilterDestinos.includes(r.calc_destino)) return false
          if (planFilterModalidades.length > 0 && !planFilterModalidades.includes(r.calc_modalidade)) return false
          if (planFilterLinhas.length > 0 && !planFilterLinhas.includes(r.calc_linha)) return false
          if (planFilterTipoModal.length > 0 && !planFilterTipoModal.includes(r.calc_tipo_modal)) return false
          if (planFilterFllibfat.length > 0 && !planFilterFllibfat.includes(r.calc_fllibfat)) return false
          if (planFilterPrazos.length > 0 && !planFilterPrazos.includes(r.calc_prazo)) return false
          if (planFilterStatusOp.length > 0) {
            const raw = String(r.calc_status_op || '').toUpperCase()
            const matchStatus = planFilterStatusOp.some(st => {
              if (st === 'EM CARTEIRA') return raw.includes('CARTEIRA')
              if (st === 'EM PROCESSO') return raw.includes('PROCESSO')
              return raw === st
            })
            if (!matchStatus) return false
          }
          if (!matchSearch(r)) return false
          return true
        })

        // Controle de visibilidade dinâmica das colunas conforme o filtro STATUS OPERAÇÃO
        const showCarteira = planFilterStatusOp.length === 0 || planFilterStatusOp.includes('EM CARTEIRA')
        const showProcesso = planFilterStatusOp.length === 0 || planFilterStatusOp.includes('EM PROCESSO')

        // Base para a Visão Comparativa (aplica filtros ativos incluindo Status Operação quando filtrado)
        const enrichedForComparative = enrichedBase.filter(r => {
          if (planFilterRegioes.length > 0 && !planFilterRegioes.includes(r.calc_regiao)) return false
          if (planFilterDestinos.length > 0 && !planFilterDestinos.includes(r.calc_destino)) return false
          if (planFilterModalidades.length > 0 && !planFilterModalidades.includes(r.calc_modalidade)) return false
          if (planFilterLinhas.length > 0 && !planFilterLinhas.includes(r.calc_linha)) return false
          if (planFilterTipoModal.length > 0 && !planFilterTipoModal.includes(r.calc_tipo_modal)) return false
          if (planFilterFllibfat.length > 0 && !planFilterFllibfat.includes(r.calc_fllibfat)) return false
          if (planFilterPrazos.length > 0 && !planFilterPrazos.includes(r.calc_prazo)) return false
          if (planFilterStatusOp.length > 0) {
            const raw = String(r.calc_status_op || '').toUpperCase()
            const matchStatus = planFilterStatusOp.some(st => {
              if (st === 'EM CARTEIRA') return raw.includes('CARTEIRA')
              if (st === 'EM PROCESSO') return raw.includes('PROCESSO')
              return raw === st
            })
            if (!matchStatus) return false
          }
          if (!matchSearch(r)) return false
          return true
        })

        // Estrutura Hierárquica do Planejamento: Região -> Destino -> Status do Lote -> Modalidade -> Itens
        interface DestinoItemDetail {
          modalidade: string
          linha: string
          codmodal: string
          preventrega: string
          prazo?: string
          statusOperacao: string
          numlote: string
          numpedven: string
          item: string
          descricao: string
          quantidade: number
          cubagem: number
          valorTotal: number
          peso: number
        }

        interface ModalidadeGroup {
          modalidade: string // 'RODOVIARIO' | 'COURRIER' | 'ABA' | 'TRANSFERENCIA'
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
        }

        interface StatusLoteGroup {
          status: string // 'EM CARTEIRA' | 'EM PROCESSO'
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
          modalidades: ModalidadeGroup[]
        }

        interface DestinoSummary {
          destino: string
          pedidosSet: Set<string>
          pedidosCount: number
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          statusGroups: StatusLoteGroup[]
        }

        interface RegiaoGroup {
          regiao: string
          destinos: DestinoSummary[]
          totalPedidosSet: Set<string>
          totalPedidos: number
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
        }

        // Mapa de agrupamento: Regiao -> Destino -> Status -> Modalidade
        const groupsMap = new Map<string, Map<string, Map<string, Map<string, {
          pedidosSet: Set<string>
          quantidade: number
          cubagem: number
          valorTotal: number
          pesoTotal: number
          itens: DestinoItemDetail[]
        }>>>>()

        enrichedFiltered.forEach(row => {
          const reg = row.calc_regiao || 'INTERIOR'
          const dest = row.calc_destino || 'OUTROS'
          const mod = row.calc_modalidade || '-'
          // Normaliza status: 'EM CARTEIRA' ou 'EM PROCESSO'
          const rawSt = String(row.calc_status_op || row.status_operacao || row.STATUS_OPERACAO || '').toUpperCase().trim()
          const st = rawSt.includes('CARTEIRA') ? 'EM CARTEIRA' : (rawSt.includes('PROCESSO') ? 'EM PROCESSO' : (rawSt || 'EM CARTEIRA'))

          if (!groupsMap.has(reg)) groupsMap.set(reg, new Map())
          const regMap = groupsMap.get(reg)!

          if (!regMap.has(dest)) regMap.set(dest, new Map())
          const destMap = regMap.get(dest)!

          if (!destMap.has(st)) destMap.set(st, new Map())
          const stMap = destMap.get(st)!

          if (!stMap.has(mod)) {
            stMap.set(mod, {
              pedidosSet: new Set<string>(),
              quantidade: 0,
              cubagem: 0,
              valorTotal: 0,
              pesoTotal: 0,
              itens: []
            })
          }

          const modData = stMap.get(mod)!
          if (row.calc_ped) modData.pedidosSet.add(row.calc_ped)
          modData.quantidade += row.calc_qtd
          modData.cubagem += row.calc_cub
          modData.valorTotal += row.calc_vltotal
          modData.pesoTotal += row.calc_peso

          modData.itens.push({
            modalidade: mod,
            linha: String(row.calc_linha || row.linha || row.LINHA || '-'),
            codmodal: formatItemCode(row.codmodal || row.CODMODAL || '-'),
            preventrega: String(row.preventrega || row.PREVENTREGA || (row.calc_tipo_modal === 'Abastecimento' ? (row.dtpedido || row.DTPEDIDO) : '') || ''),
            prazo: row.calc_prazo,
            numlote: formatItemCode(row.numlote || row.NUMLOTE || '-'),
            statusOperacao: st,
            numpedven: String(row.numpedven || row.NUMPEDVEN || ''),
            item: formatItemCode(row.item || row.ITEM || ''),
            descricao: String(row.descricao || row.DESCRICAO || ''),
            quantidade: row.calc_qtd,
            cubagem: row.calc_cub,
            valorTotal: row.calc_vltotal,
            peso: row.calc_peso
          })
        })

        // Ordem preferencial das modalidades
        const modalPriority = ['RODOVIARIO', 'COURRIER', 'ABA', 'TRANSFERENCIA']
        const sortModalidades = (a: string, b: string) => {
          const idxA = modalPriority.indexOf(a)
          const idxB = modalPriority.indexOf(b)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
          return a.localeCompare(b)
        }

        // Ordem de status: EM CARTEIRA primeiro, depois EM PROCESSO
        const sortStatus = (a: string, b: string) => {
          if (a === 'EM CARTEIRA') return -1
          if (b === 'EM CARTEIRA') return 1
          return a.localeCompare(b)
        }

        // Ordem preferencial das regiões como no relatório do usuário
        const regiaoPriority = ['CAPITAL', 'METROPOLITANA', 'INTERIOR', 'ABASTECIMENTO CDs', '#N/D']
        const allPresentRegioes = Array.from(groupsMap.keys()).sort((a, b) => {
          const idxA = regiaoPriority.indexOf(a)
          const idxB = regiaoPriority.indexOf(b)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
          return a.localeCompare(b)
        })

        const regiaoGroups: RegiaoGroup[] = allPresentRegioes.map(reg => {
          const destMap = groupsMap.get(reg)!
          const destinos: DestinoSummary[] = Array.from(destMap.entries()).map(([destName, stMap]) => {
            const destPedidosSet = new Set<string>()
            let destQtd = 0
            let destCub = 0
            let destValor = 0
            let destPeso = 0

            const statusGroups: StatusLoteGroup[] = Array.from(stMap.entries())
              .sort(([a], [b]) => sortStatus(a, b))
              .map(([stName, modMap]) => {
                const stPedidosSet = new Set<string>()
                let stQtd = 0
                let stCub = 0
                let stValor = 0
                let stPeso = 0
                const stItens: DestinoItemDetail[] = []

                const modalidades: ModalidadeGroup[] = Array.from(modMap.entries())
                  .sort(([a], [b]) => sortModalidades(a, b))
                  .map(([modName, modData]) => {
                    modData.pedidosSet.forEach(p => {
                      stPedidosSet.add(p)
                      destPedidosSet.add(p)
                    })
                    stQtd += modData.quantidade
                    stCub += modData.cubagem
                    stValor += modData.valorTotal
                    stPeso += modData.pesoTotal

                    // Ordena os itens do menor vencimento para o maior dentro de cada modalidade
                    const sortedItens = [...modData.itens].sort((a, b) => {
                      const tA = parseDateOrPrazoToTimestamp(a.preventrega)
                      const tB = parseDateOrPrazoToTimestamp(b.preventrega)
                      if (tA !== tB) return tA - tB
                      return (a.numpedven || '').localeCompare(b.numpedven || '')
                    })

                    stItens.push(...sortedItens)

                    return {
                      modalidade: modName,
                      pedidosSet: modData.pedidosSet,
                      pedidosCount: modData.pedidosSet.size || 1,
                      quantidade: modData.quantidade,
                      cubagem: modData.cubagem,
                      valorTotal: modData.valorTotal,
                      pesoTotal: modData.pesoTotal,
                      itens: sortedItens
                    }
                  })

                destQtd += stQtd
                destCub += stCub
                destValor += stValor
                destPeso += stPeso

                return {
                  status: stName,
                  pedidosSet: stPedidosSet,
                  pedidosCount: stPedidosSet.size || 1,
                  quantidade: stQtd,
                  cubagem: stCub,
                  valorTotal: stValor,
                  pesoTotal: stPeso,
                  modalidades,
                  itens: stItens
                }
              })

            return {
              destino: destName,
              pedidosSet: destPedidosSet,
              pedidosCount: destPedidosSet.size || 1,
              quantidade: destQtd,
              cubagem: destCub,
              valorTotal: destValor,
              pesoTotal: destPeso,
              statusGroups
            }
          }).sort((a, b) => a.destino.localeCompare(b.destino))

          const totalPedidosSet = new Set<string>()
          let totalQtd = 0
          let totalCub = 0
          let totalValor = 0
          let totalPeso = 0

          destinos.forEach(d => {
            d.pedidosSet.forEach(p => totalPedidosSet.add(p))
            totalQtd += d.quantidade
            totalCub += d.cubagem
            totalValor += d.valorTotal
            totalPeso += d.pesoTotal
          })

          return {
            regiao: reg,
            destinos,
            totalPedidosSet,
            totalPedidos: totalPedidosSet.size || destinos.reduce((acc, d) => acc + d.pedidosCount, 0),
            totalQtd,
            totalCub,
            totalValor,
            totalPeso
          }
        })

        // Totais Gerais
        const geralPedidosSet = new Set<string>()
        let geralQtd = 0
        let geralCub = 0
        let geralValor = 0
        let geralPeso = 0

        regiaoGroups.forEach(g => {
          g.totalPedidosSet.forEach(p => geralPedidosSet.add(p))
          geralQtd += g.totalQtd
          geralCub += g.totalCub
          geralValor += g.totalValor
          geralPeso += g.totalPeso
        })
        const geralPedidos = geralPedidosSet.size || regiaoGroups.reduce((acc, g) => acc + g.totalPedidos, 0)

        // Helper para semáforo de cubagem conforme regra condicional:
        // 0 a 9: Vermelho | 10 a 16: Laranja | 17 a 1000+: Verde
        const renderCubSemaforo = (cub: number) => {
          let dotBg = '#22c55e' // verde (17 a 1000)
          if (cub < 10) {
            dotBg = '#ef4444' // vermelho (0 a 9)
          } else if (cub < 17) {
            dotBg = '#f59e0b' // laranja (10 a 16)
          } else {
            dotBg = '#22c55e' // verde (17 a 1000)
          }

          return (
            <span
              className="inline-block w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
              style={{
                backgroundColor: dotBg,
                border: '1px solid rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.4)'
              }}
            />
          )
        }

        // ------------------------------------------------------------
        // Cálculo da Visão Comparativa por Destino (Carteira vs Processo)
        // ------------------------------------------------------------
        interface ComparativeDestinoItem {
          destino: string
          regiao: string
          pedidosSet: Set<string>
          carteiraQtd: number
          carteiraCub: number
          processoQtd: number
          processoCub: number
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
        }

        const compDestMap = new Map<string, ComparativeDestinoItem>()
        const compGeralPedidosSet = new Set<string>()

        enrichedForComparative.forEach(row => {
          const dest = row.calc_destino || 'OUTROS'
          const reg = row.calc_regiao || 'INTERIOR'
          const rawSt = String(row.calc_status_op || row.status_operacao || row.STATUS_OPERACAO || '').toUpperCase().trim()
          const isProcesso = rawSt.includes('PROCESSO')

          if (!compDestMap.has(dest)) {
            compDestMap.set(dest, {
              destino: dest,
              regiao: reg,
              pedidosSet: new Set<string>(),
              carteiraQtd: 0,
              carteiraCub: 0,
              processoQtd: 0,
              processoCub: 0,
              totalQtd: 0,
              totalCub: 0,
              totalValor: 0,
              totalPeso: 0
            })
          }

          const item = compDestMap.get(dest)!
          const qtd = row.calc_qtd || 0
          const cub = row.calc_cub || 0
          const vltotal = row.calc_vltotal || 0
          const peso = row.calc_peso || 0

          if (row.calc_ped) {
            item.pedidosSet.add(row.calc_ped)
            compGeralPedidosSet.add(row.calc_ped)
          }

          if (isProcesso) {
            item.processoQtd += qtd
            item.processoCub += cub
          } else {
            item.carteiraQtd += qtd
            item.carteiraCub += cub
          }
          item.totalQtd += qtd
          item.totalCub += cub
          item.totalValor += vltotal
          item.totalPeso += peso
        })

        const effectiveCompSortField = (!showCarteira && (compSortField === 'carteiraQtd' || compSortField === 'carteiraCub'))
          ? 'totalCub'
          : (!showProcesso && (compSortField === 'processoQtd' || compSortField === 'processoCub'))
            ? 'totalCub'
            : compSortField

        const comparativeDestinos = Array.from(compDestMap.values()).sort((a, b) => {
          let diff = 0
          if (effectiveCompSortField === 'regiao') {
            diff = a.regiao.localeCompare(b.regiao)
          } else if (effectiveCompSortField === 'destino') {
            diff = a.destino.localeCompare(b.destino)
          } else {
            diff = (a[effectiveCompSortField] as number) - (b[effectiveCompSortField] as number)
          }
          return compSortAsc ? diff : -diff
        })

        const compTotals = {
          carteiraQtd: comparativeDestinos.reduce((acc, d) => acc + d.carteiraQtd, 0),
          carteiraCub: comparativeDestinos.reduce((acc, d) => acc + d.carteiraCub, 0),
          processoQtd: comparativeDestinos.reduce((acc, d) => acc + d.processoQtd, 0),
          processoCub: comparativeDestinos.reduce((acc, d) => acc + d.processoCub, 0),
          totalQtd: comparativeDestinos.reduce((acc, d) => acc + d.totalQtd, 0),
          totalCub: comparativeDestinos.reduce((acc, d) => acc + d.totalCub, 0),
          totalValor: comparativeDestinos.reduce((acc, d) => acc + d.totalValor, 0),
          totalPeso: comparativeDestinos.reduce((acc, d) => acc + d.totalPeso, 0),
          totalPedidos: compGeralPedidosSet.size || comparativeDestinos.reduce((acc, d) => acc + d.pedidosSet.size, 0)
        }

        // Agrupamento por Região para a Visão Comparativa
        const compRegiaoMap = new Map<string, typeof comparativeDestinos>()
        comparativeDestinos.forEach(d => {
          const reg = d.regiao || 'INTERIOR'
          if (!compRegiaoMap.has(reg)) {
            compRegiaoMap.set(reg, [])
          }
          compRegiaoMap.get(reg)!.push(d)
        })

        const compRegiaoGroups = Array.from(compRegiaoMap.entries())
          .sort(([regA], [regB]) => {
            if (effectiveCompSortField === 'regiao') {
              const diff = regA.localeCompare(regB)
              return compSortAsc ? diff : -diff
            }
            const idxA = regiaoPriority.indexOf(regA)
            const idxB = regiaoPriority.indexOf(regB)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB
            if (idxA !== -1) return -1
            if (idxB !== -1) return 1
            return regA.localeCompare(regB)
          })
          .map(([regiao, destinos]) => {
            return {
              regiao,
              destinos,
              carteiraQtd: destinos.reduce((acc, d) => acc + d.carteiraQtd, 0),
              carteiraCub: destinos.reduce((acc, d) => acc + d.carteiraCub, 0),
              processoQtd: destinos.reduce((acc, d) => acc + d.processoQtd, 0),
              processoCub: destinos.reduce((acc, d) => acc + d.processoCub, 0),
              totalQtd: destinos.reduce((acc, d) => acc + d.totalQtd, 0),
              totalCub: destinos.reduce((acc, d) => acc + d.totalCub, 0)
            }
          })

        // --------------------------------------------------------------------------
        // VISÃO 1 (PAINEL LATERAL): AGRUPAMENTO POR LINHA & PRODUTOS
        // (LINHA, IBM, ITEM, DESCRIÇÃO, QTD, CUBAGEM, VALOR$, PESO)
        // --------------------------------------------------------------------------
        interface LinhaItemSummary {
          ibm: string
          item: string
          descricao: string
          quantidade: number
          cubagem: number
          valorTotal: number
          peso: number
          pedidosSet: Set<string>
        }

        interface LinhaSummary {
          linha: string
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
          totalItens: number
          pedidosSet: Set<string>
          itens: LinhaItemSummary[]
        }

        const linhaMap = new Map<string, {
          totalQtd: number
          totalCub: number
          totalValor: number
          totalPeso: number
          pedidosSet: Set<string>
          itemsMap: Map<string, LinhaItemSummary>
        }>()

        enrichedFiltered.forEach(r => {
          const linha = String(r.calc_linha || r.linha || r.LINHA || 'OUTROS').trim() || 'OUTROS'
          if (!linhaMap.has(linha)) {
            linhaMap.set(linha, {
              totalQtd: 0,
              totalCub: 0,
              totalValor: 0,
              totalPeso: 0,
              pedidosSet: new Set<string>(),
              itemsMap: new Map<string, LinhaItemSummary>()
            })
          }

          const lData = linhaMap.get(linha)!
          lData.totalQtd += r.calc_qtd
          lData.totalCub += r.calc_cub
          lData.totalValor += r.calc_vltotal
          lData.totalPeso += r.calc_peso
          if (r.calc_ped) lData.pedidosSet.add(r.calc_ped)

          const itemCode = formatItemCode(r.item || r.ITEM || '-')
          const ibmCode = formatItemCode(r.ibm || r.IBM || '-')
          const itemDesc = String(r.descricao || r.DESCRICAO || '-')

          if (!lData.itemsMap.has(itemCode)) {
            lData.itemsMap.set(itemCode, {
              ibm: ibmCode,
              item: itemCode,
              descricao: itemDesc,
              quantidade: 0,
              cubagem: 0,
              valorTotal: 0,
              peso: 0,
              pedidosSet: new Set<string>()
            })
          }

          const itData = lData.itemsMap.get(itemCode)!
          if (itData.ibm === '-' && ibmCode !== '-') itData.ibm = ibmCode
          itData.quantidade += r.calc_qtd
          itData.cubagem += r.calc_cub
          itData.valorTotal += r.calc_vltotal
          itData.peso += r.calc_peso
          if (r.calc_ped) itData.pedidosSet.add(r.calc_ped)
        })

        const linhaSummaries: LinhaSummary[] = Array.from(linhaMap.entries()).map(([linha, data]) => {
          const itens = Array.from(data.itemsMap.values())
          itens.sort((a, b) => {
            let diff = 0
            switch (linhaSortKey) {
              case 'ibm':
                diff = a.ibm.localeCompare(b.ibm)
                break
              case 'item':
                diff = a.item.localeCompare(b.item)
                break
              case 'linha':
                diff = a.descricao.localeCompare(b.descricao)
                break
              case 'totalQtd':
                diff = a.quantidade - b.quantidade
                break
              case 'totalCub':
                diff = a.cubagem - b.cubagem
                break
              case 'totalValor':
                diff = a.valorTotal - b.valorTotal
                break
              case 'totalPeso':
                diff = a.peso - b.peso
                break
              default:
                diff = a.descricao.localeCompare(b.descricao)
                break
            }
            return linhaSortAsc ? diff : -diff
          })
          return {
            linha,
            totalQtd: data.totalQtd,
            totalCub: data.totalCub,
            totalValor: data.totalValor,
            totalPeso: data.totalPeso,
            totalItens: itens.length,
            pedidosSet: data.pedidosSet,
            itens
          }
        })

        linhaSummaries.sort((a, b) => {
          let diff = 0
          switch (linhaSortKey) {
            case 'linha':
              diff = a.linha.localeCompare(b.linha)
              break
            case 'ibm':
              const ibmA = a.itens.length > 0 ? a.itens[0].ibm : ''
              const ibmB = b.itens.length > 0 ? b.itens[0].ibm : ''
              diff = ibmA.localeCompare(ibmB)
              break
            case 'item':
              const itmA = a.itens.length > 0 ? a.itens[0].item : ''
              const itmB = b.itens.length > 0 ? b.itens[0].item : ''
              diff = itmA.localeCompare(itmB)
              break
            case 'totalQtd':
              diff = a.totalQtd - b.totalQtd
              break
            case 'totalCub':
              diff = a.totalCub - b.totalCub
              break
            case 'totalValor':
              diff = a.totalValor - b.totalValor
              break
            case 'totalPeso':
              diff = a.totalPeso - b.totalPeso
              break
          }
          return linhaSortAsc ? diff : -diff
        })

        const linhaTotals = {
          totalLinhas: linhaSummaries.length,
          totalItens: linhaSummaries.reduce((acc, l) => acc + l.totalItens, 0),
          totalQtd: linhaSummaries.reduce((acc, l) => acc + l.totalQtd, 0),
          totalCub: linhaSummaries.reduce((acc, l) => acc + l.totalCub, 0),
          totalValor: linhaSummaries.reduce((acc, l) => acc + l.totalValor, 0),
          totalPeso: linhaSummaries.reduce((acc, l) => acc + l.totalPeso, 0)
        }

        // Filtro de busca interna para Linhas/Produtos
        const prSearch = planRightSearch.toLowerCase().trim()
        const filteredLinhaSummaries = prSearch
          ? linhaSummaries
            .map(group => {
              const matchLinha = group.linha.toLowerCase().includes(prSearch)
              const matchingItens = group.itens.filter(
                it => it.item.toLowerCase().includes(prSearch) ||
                  it.ibm.toLowerCase().includes(prSearch) ||
                  it.descricao.toLowerCase().includes(prSearch)
              )
              if (matchLinha) return group
              if (matchingItens.length > 0) {
                return {
                  ...group,
                  itens: matchingItens,
                  totalItens: matchingItens.length
                }
              }
              return null
            })
            .filter(Boolean) as LinhaSummary[]
          : linhaSummaries

        // --------------------------------------------------------------------------
        // VISÃO 2 (PAINEL LATERAL): AGRUPAMENTO POR DATA DO PEDIDO x PREV. ENTREGA
        // --------------------------------------------------------------------------
        interface DateItemDetail {
          prevEntrega: string
          prevEntregaRaw: any
          prevEntregaTimestamp: number
          carteiraPedidosSet: Set<string>
          carteiraQtd: number
          carteiraCub: number
          processoPedidosSet: Set<string>
          processoQtd: number
          processoCub: number
          totalPedidosSet: Set<string>
          totalQtd: number
          totalCub: number
        }

        interface DatePedidoGroup {
          dtPedido: string
          dtPedidoRaw: any
          dtPedidoTimestamp: number
          itensMap: Map<string, DateItemDetail>
          carteiraPedidosSet: Set<string>
          carteiraQtd: number
          carteiraCub: number
          processoPedidosSet: Set<string>
          processoQtd: number
          processoCub: number
          totalPedidosSet: Set<string>
          totalQtd: number
          totalCub: number
        }

        const datePedidoGroupsMap = new Map<string, DatePedidoGroup>()

        enrichedForComparative.forEach(r => {
          // Regra: Na visão Cruzamento Dt. Pedido x Previsão Entrega, não incluir os modais RET, LEN e RLE
          const codModal = String(r.codmodal || r.CODMODAL || '').trim().toUpperCase()
          const descModal = String(r.descricaomodal || r.DESCRICAOMODAL || '').trim().toUpperCase()
          if (
            codModal === 'RET' || codModal === 'LEN' || codModal === 'RLE' ||
            descModal === 'RET' || descModal === 'LEN' || descModal === 'RLE' ||
            descModal.startsWith('RET ') || descModal.startsWith('LEN ') || descModal.startsWith('RLE ')
          ) {
            return
          }

          const rawDtPed = r.dtpedido || r.DTPEDIDO
          const rawPrevEnt = r.preventrega || r.PREVENTREGA || (r.calc_tipo_modal === 'Abastecimento' ? (r.dtpedido || r.DTPEDIDO) : '')

          const dtPedStr = rawDtPed ? formatDateBR(rawDtPed) : '-'
          const prevEntStr = rawPrevEnt ? formatDateBR(rawPrevEnt) : '-'

          if (!datePedidoGroupsMap.has(dtPedStr)) {
            datePedidoGroupsMap.set(dtPedStr, {
              dtPedido: dtPedStr,
              dtPedidoRaw: rawDtPed,
              dtPedidoTimestamp: parseDateOrPrazoToTimestamp(rawDtPed),
              itensMap: new Map(),
              carteiraPedidosSet: new Set(),
              carteiraQtd: 0,
              carteiraCub: 0,
              processoPedidosSet: new Set(),
              processoQtd: 0,
              processoCub: 0,
              totalPedidosSet: new Set(),
              totalQtd: 0,
              totalCub: 0
            })
          }

          const grp = datePedidoGroupsMap.get(dtPedStr)!

          if (!grp.itensMap.has(prevEntStr)) {
            grp.itensMap.set(prevEntStr, {
              prevEntrega: prevEntStr,
              prevEntregaRaw: rawPrevEnt,
              prevEntregaTimestamp: parseDateOrPrazoToTimestamp(rawPrevEnt),
              carteiraPedidosSet: new Set(),
              carteiraQtd: 0,
              carteiraCub: 0,
              processoPedidosSet: new Set(),
              processoQtd: 0,
              processoCub: 0,
              totalPedidosSet: new Set(),
              totalQtd: 0,
              totalCub: 0
            })
          }

          const itm = grp.itensMap.get(prevEntStr)!
          const rawSt = String(r.calc_status_op || '').toUpperCase()
          const isProcesso = rawSt.includes('PROCESSO')

          if (isProcesso) {
            if (r.calc_ped) {
              grp.processoPedidosSet.add(r.calc_ped)
              itm.processoPedidosSet.add(r.calc_ped)
            }
            grp.processoQtd += r.calc_qtd
            grp.processoCub += r.calc_cub
            itm.processoQtd += r.calc_qtd
            itm.processoCub += r.calc_cub
          } else {
            if (r.calc_ped) {
              grp.carteiraPedidosSet.add(r.calc_ped)
              itm.carteiraPedidosSet.add(r.calc_ped)
            }
            grp.carteiraQtd += r.calc_qtd
            grp.carteiraCub += r.calc_cub
            itm.carteiraQtd += r.calc_qtd
            itm.carteiraCub += r.calc_cub
          }

          if (r.calc_ped) {
            grp.totalPedidosSet.add(r.calc_ped)
            itm.totalPedidosSet.add(r.calc_ped)
          }
          grp.totalQtd += r.calc_qtd
          grp.totalCub += r.calc_cub
          itm.totalQtd += r.calc_qtd
          itm.totalCub += r.calc_cub
        })

        interface FormattedDateDetail {
          prevEntrega: string
          prevEntregaRaw: any
          prevEntregaTimestamp: number
          carteiraPedidosCount: number
          carteiraQtd: number
          carteiraCub: number
          processoPedidosCount: number
          processoQtd: number
          processoCub: number
          totalPedidosCount: number
          totalQtd: number
          totalCub: number
        }

        interface FormattedDateGroup {
          dtPedido: string
          dtPedidoRaw: any
          dtPedidoTimestamp: number
          carteiraPedidosCount: number
          carteiraQtd: number
          carteiraCub: number
          processoPedidosCount: number
          processoQtd: number
          processoCub: number
          totalPedidosCount: number
          totalQtd: number
          totalCub: number
          itens: FormattedDateDetail[]
        }

        const dateTotals = {
          carteiraPedidosSet: new Set<string>(),
          carteiraQtd: 0,
          carteiraCub: 0,
          processoPedidosSet: new Set<string>(),
          processoQtd: 0,
          processoCub: 0,
          totalPedidosSet: new Set<string>(),
          totalQtd: 0,
          totalCub: 0,
          totalPrevisoes: 0
        }

        datePedidoGroupsMap.forEach(grp => {
          grp.carteiraPedidosSet.forEach(p => dateTotals.carteiraPedidosSet.add(p))
          dateTotals.carteiraQtd += grp.carteiraQtd
          dateTotals.carteiraCub += grp.carteiraCub

          grp.processoPedidosSet.forEach(p => dateTotals.processoPedidosSet.add(p))
          dateTotals.processoQtd += grp.processoQtd
          dateTotals.processoCub += grp.processoCub

          grp.totalPedidosSet.forEach(p => dateTotals.totalPedidosSet.add(p))
          dateTotals.totalQtd += grp.totalQtd
          dateTotals.totalCub += grp.totalCub
          dateTotals.totalPrevisoes += grp.itensMap.size
        })

        const effectiveDateSortKey = (!showCarteira && (dateSortKey === 'carteiraPedidos' || dateSortKey === 'carteiraQtd' || dateSortKey === 'carteiraCub'))
          ? 'totalQtd'
          : (!showProcesso && (dateSortKey === 'processoPedidos' || dateSortKey === 'processoQtd' || dateSortKey === 'processoCub'))
            ? 'totalQtd'
            : dateSortKey

        const sortedDateGroups: FormattedDateGroup[] = Array.from(datePedidoGroupsMap.values()).map(grp => {
          const itens: FormattedDateDetail[] = Array.from(grp.itensMap.values()).map(it => ({
            prevEntrega: it.prevEntrega,
            prevEntregaRaw: it.prevEntregaRaw,
            prevEntregaTimestamp: it.prevEntregaTimestamp,
            carteiraPedidosCount: it.carteiraPedidosSet.size,
            carteiraQtd: it.carteiraQtd,
            carteiraCub: it.carteiraCub,
            processoPedidosCount: it.processoPedidosSet.size,
            processoQtd: it.processoQtd,
            processoCub: it.processoCub,
            totalPedidosCount: it.totalPedidosSet.size,
            totalQtd: it.totalQtd,
            totalCub: it.totalCub
          }))

          itens.sort((a, b) => {
            let diff = 0
            switch (effectiveDateSortKey) {
              case 'prevEntrega':
                diff = a.prevEntregaTimestamp - b.prevEntregaTimestamp
                break
              case 'carteiraPedidos':
                diff = a.carteiraPedidosCount - b.carteiraPedidosCount
                break
              case 'carteiraQtd':
                diff = a.carteiraQtd - b.carteiraQtd
                break
              case 'carteiraCub':
                diff = a.carteiraCub - b.carteiraCub
                break
              case 'processoPedidos':
                diff = a.processoPedidosCount - b.processoPedidosCount
                break
              case 'processoQtd':
                diff = a.processoQtd - b.processoQtd
                break
              case 'processoCub':
                diff = a.processoCub - b.processoCub
                break
              case 'totalPedidos':
                diff = a.totalPedidosCount - b.totalPedidosCount
                break
              case 'totalQtd':
                diff = a.totalQtd - b.totalQtd
                break
              case 'totalCub':
                diff = a.totalCub - b.totalCub
                break
              default:
                diff = a.prevEntregaTimestamp - b.prevEntregaTimestamp
                break
            }
            return dateSortAsc ? diff : -diff
          })

          return {
            dtPedido: grp.dtPedido,
            dtPedidoRaw: grp.dtPedidoRaw,
            dtPedidoTimestamp: grp.dtPedidoTimestamp,
            carteiraPedidosCount: grp.carteiraPedidosSet.size,
            carteiraQtd: grp.carteiraQtd,
            carteiraCub: grp.carteiraCub,
            processoPedidosCount: grp.processoPedidosSet.size,
            processoQtd: grp.processoQtd,
            processoCub: grp.processoCub,
            totalPedidosCount: grp.totalPedidosSet.size,
            totalQtd: grp.totalQtd,
            totalCub: grp.totalCub,
            itens
          }
        })

        sortedDateGroups.sort((a, b) => {
          let diff = 0
          switch (effectiveDateSortKey) {
            case 'dtPedido':
              diff = a.dtPedidoTimestamp - b.dtPedidoTimestamp
              break
            case 'prevEntrega':
              const minA = a.itens.length > 0 ? a.itens[0].prevEntregaTimestamp : 0
              const minB = b.itens.length > 0 ? b.itens[0].prevEntregaTimestamp : 0
              diff = minA - minB
              break
            case 'carteiraPedidos':
              diff = a.carteiraPedidosCount - b.carteiraPedidosCount
              break
            case 'carteiraQtd':
              diff = a.carteiraQtd - b.carteiraQtd
              break
            case 'carteiraCub':
              diff = a.carteiraCub - b.carteiraCub
              break
            case 'processoPedidos':
              diff = a.processoPedidosCount - b.processoPedidosCount
              break
            case 'processoQtd':
              diff = a.processoQtd - b.processoQtd
              break
            case 'processoCub':
              diff = a.processoCub - b.processoCub
              break
            case 'totalPedidos':
              diff = a.totalPedidosCount - b.totalPedidosCount
              break
            case 'totalQtd':
              diff = a.totalQtd - b.totalQtd
              break
            case 'totalCub':
              diff = a.totalCub - b.totalCub
              break
          }
          return dateSortAsc ? diff : -diff
        })

        // Filtro de busca interna para Datas
        const filteredDateGroups = prSearch
          ? sortedDateGroups
              .map(group => {
                const matchDtPed = group.dtPedido.toLowerCase().includes(prSearch)
                const matchingItens = group.itens.filter(it => it.prevEntrega.toLowerCase().includes(prSearch))
                if (matchDtPed) return group
                if (matchingItens.length > 0) {
                  return {
                    ...group,
                    itens: matchingItens
                  }
                }
                return null
              })
              .filter((g): g is FormattedDateGroup => g !== null)
          : sortedDateGroups

        // ------------------------------------------------------------
        // CÁLCULOS DA VISÃO 3: PAINEL OPERACIONAL POR MODALIDADE
        // ------------------------------------------------------------
        type OpModalKey = 'ABA' | 'VENDAS' | 'COURRIER' | 'TRANSFERENCIA'
        const opModalOrder: OpModalKey[] = ['ABA', 'VENDAS', 'COURRIER', 'TRANSFERENCIA']

        interface OpModalAccumulator {
          pedidosSet: Set<string>
          pecas: number
          vol: number
          valor: number
        }

        const opModalDataMap: Record<OpModalKey, { carteira: OpModalAccumulator; processo: OpModalAccumulator }> = {
          ABA: {
            carteira: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 },
            processo: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 }
          },
          VENDAS: {
            carteira: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 },
            processo: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 }
          },
          COURRIER: {
            carteira: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 },
            processo: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 }
          },
          TRANSFERENCIA: {
            carteira: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 },
            processo: { pedidosSet: new Set(), pecas: 0, vol: 0, valor: 0 }
          }
        }

        const opAtrasoVendaPedidosSet = new Set<string>()
        let opAtrasoAbaPecas = 0

        enrichedForComparative.forEach(r => {
          const mod = String(r.calc_modalidade || r.modalidade || '').toUpperCase()
          const cod = String(r.codmodal || r.CODMODAL || '').toUpperCase()
          const desc = String(r.descricaomodal || r.DESCRICAOMODAL || '').toUpperCase()
          const raw = `${mod} ${desc} ${cod}`

          let cat: OpModalKey = 'VENDAS'
          if (raw.includes('ABA')) {
            cat = 'ABA'
          } else if (raw.includes('COUR') || raw.includes('SEDEX') || raw.includes('RDP') || raw.includes('ESE') || raw.includes('CD0') || raw.includes('CBK')) {
            cat = 'COURRIER'
          } else if (raw.includes('TRANSF') || raw.includes('DIF') || raw.includes('MUL') || raw.includes('RTY') || raw.includes('RYR') || raw.includes('BAL')) {
            cat = 'TRANSFERENCIA'
          } else {
            cat = 'VENDAS'
          }

          const statusOp = String(r.calc_status_op || '').toUpperCase()
          const isProc = statusOp.includes('PROCESSO')
          const isCart = statusOp.includes('CARTEIRA') || (!isProc)

          const ped = String(r.calc_ped || r.numpedven || r.NUMPEDVEN || '').trim()
          const qtd = Number(r.calc_qtd) || 0
          const vol = Number(r.calc_cub) || 0
          const vlr = Number(r.calc_vltotal) || 0

          if (isProc) {
            if (ped) opModalDataMap[cat].processo.pedidosSet.add(ped)
            opModalDataMap[cat].processo.pecas += qtd
            opModalDataMap[cat].processo.vol += vol
            opModalDataMap[cat].processo.valor += vlr
          } else if (isCart) {
            if (ped) opModalDataMap[cat].carteira.pedidosSet.add(ped)
            opModalDataMap[cat].carteira.pecas += qtd
            opModalDataMap[cat].carteira.vol += vol
            opModalDataMap[cat].carteira.valor += vlr
          }

          // Atraso Fat Venda: Pedidos vencidos
          if (cat === 'VENDAS' && r.calc_prazo === 'Vencido' && ped) {
            opAtrasoVendaPedidosSet.add(ped)
          }

          // Atraso Fat ABA: Peças com pedidos acima de 7 dias (calc_prazo === 'D+')
          if (cat === 'ABA' && (r.calc_prazo === 'D+' || r.faixa_dias_reduzida === 'D+')) {
            opAtrasoAbaPecas += qtd
          }
        })

        const opRows = opModalOrder.map(cat => {
          const cart = opModalDataMap[cat].carteira
          const proc = opModalDataMap[cat].processo
          const allPeds = new Set([...cart.pedidosSet, ...proc.pedidosSet])
          const totalPecas = cart.pecas + proc.pecas
          const totalVol = cart.vol + proc.vol
          const totalValor = cart.valor + proc.valor

          let cap = 1
          let isPedCap = false
          if (cat === 'ABA') {
            cap = capacidadeAbaM3 > 0 ? capacidadeAbaM3 : 440
          } else if (cat === 'VENDAS') {
            cap = capacidadeVendaM3 > 0 ? capacidadeVendaM3 : 400
          } else if (cat === 'COURRIER') {
            cap = capacidadeCourrierPed > 0 ? capacidadeCourrierPed : 600
            isPedCap = true
          } else {
            cap = 100
          }

          // Cálculo dos Dias: Volume Atual / Capacidade Diária (ou Pedidos / Capacidade no Courrier)
          const diasCarteira = isPedCap ? (cart.pedidosSet.size / cap) : (cart.vol / cap)
          const diasProcesso = isPedCap ? (proc.pedidosSet.size / cap) : (proc.vol / cap)
          const diasGeral = isPedCap ? (allPeds.size / cap) : (totalVol / cap)

          return {
            categoria: cat,
            carteira: {
              pedidos: cart.pedidosSet.size,
              pecas: cart.pecas,
              vol: cart.vol,
              valor: cart.valor
            },
            processo: {
              pedidos: proc.pedidosSet.size,
              pecas: proc.pecas,
              vol: proc.vol,
              valor: proc.valor
            },
            consolidado: {
              pedidos: allPeds.size,
              pecas: totalPecas,
              vol: totalVol,
              valor: totalValor
            },
            dias: {
              carteira: diasCarteira,
              processo: diasProcesso,
              geral: diasGeral
            }
          }
        })

        const opCartPedsTotal = new Set<string>()
        const opProcPedsTotal = new Set<string>()
        const opConsPedsTotal = new Set<string>()
        let opTotalCartPecas = 0, opTotalCartVol = 0, opTotalCartValor = 0
        let opTotalProcPecas = 0, opTotalProcVol = 0, opTotalProcValor = 0
        let opTotalConsPecas = 0, opTotalConsVol = 0, opTotalConsValor = 0

        opRows.forEach(row => {
          const rawCart = opModalDataMap[row.categoria].carteira
          const rawProc = opModalDataMap[row.categoria].processo
          rawCart.pedidosSet.forEach(p => { opCartPedsTotal.add(p); opConsPedsTotal.add(p); })
          rawProc.pedidosSet.forEach(p => { opProcPedsTotal.add(p); opConsPedsTotal.add(p); })

          opTotalCartPecas += row.carteira.pecas
          opTotalCartVol += row.carteira.vol
          opTotalCartValor += row.carteira.valor

          opTotalProcPecas += row.processo.pecas
          opTotalProcVol += row.processo.vol
          opTotalProcValor += row.processo.valor

          opTotalConsPecas += row.consolidado.pecas
          opTotalConsVol += row.consolidado.vol
          opTotalConsValor += row.consolidado.valor
        })

        const opPctCarteira = opTotalConsValor > 0 ? (opTotalCartValor / opTotalConsValor) * 100 : 0
        const opPctProcesso = opTotalConsValor > 0 ? (opTotalProcValor / opTotalConsValor) * 100 : 0
        const opPctMeta = metaFaturamento > 0 ? (opTotalConsValor / metaFaturamento) * 100 : 0
        const opSaldoMeta = opTotalConsValor - metaFaturamento

        const opTotalDiasGeral = opRows.reduce((acc, r) => acc + r.dias.geral, 0)
        const opTotalDiasCarteira = opRows.reduce((acc, r) => acc + r.dias.carteira, 0)
        const opTotalDiasProcesso = opRows.reduce((acc, r) => acc + r.dias.processo, 0)

        const opCapacidadeSoma = (capacidadeAbaM3 || 440) + (capacidadeVendaM3 || 400)
        const opVolumeExtra = Math.max(0, opTotalConsVol - opCapacidadeSoma)

        return (
          <div className="space-y-4">
            {/* ------------------------------------------------------------ */}
            {/* FAIXA HORIZONTAL AMPLA DEDICADA ÀS SEGMENTAÇÕES DE DADOS     */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
              {/* Barra de Título e Ações Rápidas da Faixa de Segmentações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80">
                    <Sliders size={15} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Segmentações de Dados & Filtros do Planejamento
                    </h3>
                    {(planFilterTipoModal.length > 0 ||
                      planFilterStatusOp.length > 0 ||
                      planFilterFllibfat.length > 0 ||
                      planFilterRegioes.length > 0 ||
                      planFilterDestinos.length > 0 ||
                      planFilterModalidades.length > 0 ||
                      planFilterLinhas.length > 0 ||
                      planFilterPrazos.length > 0 ||
                      planSearchTerm.trim() !== '') && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Filtros ativos
                        </span>
                      )}

                    {/* Badge da Última Atualização Central da Carteira */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] border shadow-2xs transition-all ${isSyncingOracle
                        ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                        : 'bg-slate-50 text-slate-600 border-slate-200/90'
                        }`}
                      title={lastSyncDateStr ? `Sincronizado no Supabase: ${lastSyncDateStr} (Clique no botão para recarregar da nuvem)` : 'Sincronização da Carteira'}
                    >
                      <Clock size={11} className={isSyncingOracle ? 'animate-spin text-blue-600' : 'text-blue-500'} />
                      <span className="text-slate-400 font-medium hidden sm:inline">Última atualização:</span>
                      <strong className="font-mono font-bold text-slate-800">
                        {isSyncingOracle
                          ? 'Sincronizando agora...'
                          : (lastSyncDateStr ? formatDateTimeBR(lastSyncDateStr) : '20/11/2026 às 12:22')}
                      </strong>
                      <button
                        type="button"
                        onClick={async () => {
                          await forceClearAllPcpCaches()
                          await loadPlanningData(true)
                          await refreshLastSyncTimestamp()
                        }}
                        disabled={isLoadingPlanning}
                        title="Limpar cache local e forçar recarregamento completo da nuvem"
                        className="ml-0.5 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={11} className={isLoadingPlanning ? 'animate-spin text-blue-600' : ''} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isLoadingPlanning && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                      <RefreshCw size={11} className="animate-spin text-blue-600" />
                      Sincronizando base...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPlanFilterRegioes([])
                      setPlanFilterDestinos([])
                      setPlanFilterModalidades([])
                      setPlanFilterLinhas([])
                      setPlanFilterTipoModal([])
                      setPlanFilterFllibfat([])
                      setPlanFilterStatusOp([])
                      setPlanFilterPrazos([])
                      setPlanSearchTerm('')
                      try {
                        localStorage.removeItem('magalog_pcp_plan_regioes')
                        localStorage.removeItem('magalog_pcp_plan_destinos')
                        localStorage.removeItem('magalog_pcp_plan_modalidades')
                        localStorage.removeItem('magalog_pcp_plan_linhas')
                        localStorage.removeItem('magalog_pcp_plan_tipo_modal')
                        localStorage.removeItem('magalog_pcp_plan_fllibfat')
                        localStorage.removeItem('magalog_pcp_plan_status_op')
                        localStorage.removeItem('magalog_pcp_plan_prazos')
                        localStorage.removeItem('magalog_pcp_plan_search')
                      } catch { }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Redefinir todas as segmentações"
                  >
                    <RefreshCw size={11} />
                    Limpar Segmentações
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncOracleCarteira}
                    disabled={isSyncingOracle}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xs hover:shadow-xs rounded-lg transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                    title="Consultar Carteira diretamente do Oracle MLPDW e sincronizar com Supabase"
                  >
                    <Database size={12} className={isSyncingOracle ? 'animate-spin' : ''} />
                    <span>{isSyncingOracle ? 'Atualizando...' : 'Atualizar Carteira'}</span>
                  </button>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-800 border border-blue-200/80">
                    {enrichedFiltered.length.toLocaleString('pt-BR')} itens ativos
                  </span>
                </div>
              </div>

              {/* Segmentações Rápidas por Botões Interativos (Slicers) - Empilhadas */}
              <div className="flex flex-col gap-2 pt-1 pb-1">
                {/* 1ª Linha: Liberação de Faturamento (FLLIBFAT) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Lib. Faturamento:
                    </span>
                    {planFilterFllibfat.length > 0 && (
                      <span className="text-[9.5px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterFllibfat.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterFllibfat([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterFllibfat.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'S', label: 'S', desc: 'Liberado', activeColor: 'bg-emerald-600 text-white' },
                      { id: 'N', label: 'N', desc: 'Bloqueado', activeColor: 'bg-amber-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterFllibfat.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterFllibfat(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span className="font-extrabold">{item.label}</span>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-sans ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {item.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterFllibfat.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterFllibfat([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* 2ª Linha: Status Operação */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Status Operação:
                    </span>
                    {planFilterStatusOp.length > 0 && (
                      <span className="text-[9.5px] text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterStatusOp.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterStatusOp([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterStatusOp.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'EM CARTEIRA', label: 'Em Carteira', activeColor: 'bg-blue-600 text-white' },
                      { id: 'EM PROCESSO', label: 'Em Processo', activeColor: 'bg-amber-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterStatusOp.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterStatusOp(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterStatusOp.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterStatusOp([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* 3ª Linha: Tipo Modal */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 w-[145px] shrink-0">
                    <span className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Tipo Modal:
                    </span>
                    {planFilterTipoModal.length > 0 && (
                      <span className="text-[9.5px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-extrabold">
                        {planFilterTipoModal.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPlanFilterTipoModal([])}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${planFilterTipoModal.length === 0
                        ? 'bg-[#0e3b66] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      Todos
                    </button>

                    {[
                      { id: 'Venda', label: 'Venda', badge: 'RD/COU', activeColor: 'bg-blue-600 text-white' },
                      { id: 'Abastecimento', label: 'Abastecimento', badge: 'ABA', activeColor: 'bg-emerald-600 text-white' },
                      { id: 'Tranfs', label: 'Tranfs', badge: 'TRF', activeColor: 'bg-purple-600 text-white' }
                    ].map(item => {
                      const isSelected = planFilterTipoModal.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPlanFilterTipoModal(prev =>
                              prev.includes(item.id)
                                ? prev.filter(t => t !== item.id)
                                : [...prev, item.id]
                            )
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer select-none ${isSelected
                            ? `${item.activeColor} shadow-2xs`
                            : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <span>{item.label}</span>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {item.badge}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {planFilterTipoModal.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterTipoModal([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Linha 2: Segmentações por Seleção & Busca Rápida (5 Colunas com Múltipla Seleção) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
                {/* 1. Busca Destino / Rota / Pedido (Multi-termo com separador por vírgula, espaço ou linha) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Busca Rápida</label>
                    {planSearchTerm.trim() && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                        {searchTokens.length > 1 ? `${searchTokens.length} itens` : 'ativo'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      value={planSearchTerm}
                      onChange={e => setPlanSearchTerm(e.target.value)}
                      placeholder="Destino, pedidos (ex: 1195028929, 1195029365)..."
                      className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white transition-colors"
                    />
                    {planSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setPlanSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Limpar busca"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Filtro de Destino (Multi-Seleção com Busca Interna) */}
                <MultiSelectDropdown
                  label="Destino"
                  options={uniqueDestinosList}
                  selected={planFilterDestinos}
                  onChange={setPlanFilterDestinos}
                  placeholder="Todos os Destinos"
                  searchable={true}
                />

                {/* 3. Filtro de Região (Multi-Seleção) */}
                <MultiSelectDropdown
                  label="Região"
                  options={uniqueRegioesList}
                  selected={planFilterRegioes}
                  onChange={setPlanFilterRegioes}
                  placeholder="Todas as Regiões"
                  searchable={false}
                />

                {/* 4. Filtro de Modalidade (Multi-Seleção) */}
                <MultiSelectDropdown
                  label="Modalidade (Aux)"
                  options={uniqueModalidadesList}
                  selected={planFilterModalidades}
                  onChange={setPlanFilterModalidades}
                  placeholder="Todas as Modalidades"
                  searchable={false}
                />

                {/* 5. Filtro de Linha (Multi-Seleção com Busca Interna) */}
                <MultiSelectDropdown
                  label="Linha"
                  options={uniqueLinhasList}
                  selected={planFilterLinhas}
                  onChange={setPlanFilterLinhas}
                  placeholder="Todas as Linhas"
                  searchable={true}
                  align="right"
                />
              </div>

              {/* Linha 3: Segmentação por Prazos & Cards de KPIs Rápidos */}
              <div className="pt-2 border-t border-slate-100 flex flex-col xl:flex-row gap-5 items-center w-full">
                {/* Lado Esquerdo: Segmentação por Prazos / SLA (Alinhado com a largura da tabela da esquerda) */}
                <div className="w-full xl:w-auto xl:min-w-[780px] 2xl:min-w-[840px] shrink-0 flex flex-wrap items-center gap-1">
                  <div className="flex items-center gap-1 mr-0.5 text-slate-500 shrink-0">
                    <Clock size={11} className="text-blue-600" />
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">Prazos:</span>
                    {planFilterPrazos.length > 0 && (
                      <span className="text-[9px] text-blue-700 bg-blue-100 px-1 py-0.2 rounded font-extrabold">
                        {planFilterPrazos.length}
                      </span>
                    )}
                  </div>

                  {/* Botão Todos */}
                  <button
                    type="button"
                    onClick={() => setPlanFilterPrazos([])}
                    className={`px-1.5 py-0.5 text-[10.5px] font-bold rounded-md border transition-all cursor-pointer shrink-0 ${planFilterPrazos.length === 0
                      ? 'bg-[#0e3b66] text-white border-[#0e3b66] shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    Todos
                  </button>

                  {PRAZO_FAIXAS.map(faixa => {
                    const isSelected = planFilterPrazos.includes(faixa)
                    const count = prazoCounts[faixa] || 0
                    const isVencido = faixa === 'Vencido'

                    return (
                      <button
                        key={faixa}
                        type="button"
                        onClick={() => {
                          setPlanFilterPrazos(prev =>
                            prev.includes(faixa)
                              ? prev.filter(p => p !== faixa)
                              : [...prev, faixa]
                          )
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-bold rounded-md border transition-all cursor-pointer select-none shrink-0 ${isSelected
                          ? isVencido
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-200'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-200'
                          : isVencido
                            ? 'bg-rose-50/70 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <span>{faixa}</span>
                        <span
                          className={`text-[9.5px] px-1 py-0.2 rounded font-extrabold transition-colors ${isSelected
                            ? 'bg-white/25 text-white'
                            : isVencido
                              ? 'bg-rose-200/80 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  {planFilterPrazos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlanFilterPrazos([])}
                      className="text-[9.5px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer underline ml-0.5 shrink-0"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Lado Direito: Cards Rápidos de Visão Geral (Alinhado exatamente com o painel lateral direito) */}
                <div className={`w-full min-w-0 ${planRightTab === 'visao3' ? 'flex-1' : 'flex-1 xl:max-w-[800px] 2xl:max-w-[840px]'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pedidos</span>
                      <span className="text-base font-black text-slate-800 leading-tight block">
                        {(planViewMode === 'comparativo' ? compTotals.totalPedidos : geralPedidos).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">
                        {planViewMode === 'comparativo' ? 'Carteira + Processo' : 'Backlog filtrado'}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Volume Peças</span>
                      <span className="text-base font-black text-blue-600 leading-tight block">
                        {Math.round(planViewMode === 'comparativo' ? compTotals.totalQtd : geralQtd).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">Total de unidades</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cubagem (m³)</span>
                      <span className="text-base font-black text-purple-600 leading-tight block">
                        {(planViewMode === 'comparativo' ? compTotals.totalCub : geralCub).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">Espaço cúbico</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Faturamento</span>
                      <span className="text-base font-black text-emerald-600 leading-tight block">
                        {(planViewMode === 'comparativo' ? compTotals.totalValor : geralValor).toLocaleString('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">
                        {planViewMode === 'comparativo' ? 'Valor consolidado' : 'Valor em carteira'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* CORPO: CANTO ESQUERDO (TABELA FORMATO OFICIAL) + LADO DIREITO */}
            {/* ------------------------------------------------------------ */}
            <div className="flex flex-col xl:flex-row gap-5 items-start w-full">
              {/* CANTO ESQUERDO (TABELA COM O TEMA MODERNO BLUE/SLATE CLEAN - ESPAÇO AMPLIADO) */}
              <div className="w-full xl:w-auto xl:min-w-[860px] xl:max-w-[1120px] 2xl:min-w-[940px] 2xl:max-w-[1260px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col shrink-0">
                <div className="px-3.5 py-2.5 bg-[#0e3b66] text-white flex items-center justify-between border-b border-[#0a2c4d] gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-sky-300 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide uppercase">
                      {planViewMode === 'regiao' ? 'Quadro Consolidado por Destino & Região' : 'Visão Comparativa por Destino'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão de Alternância de Visão */}
                    <div className="flex items-center bg-[#072440] p-0.5 rounded-lg border border-sky-400/25 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setPlanViewMode('regiao')}
                        title="Visualização Consolidada por Região (Hierárquica)"
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${planViewMode === 'regiao'
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <Layers size={12} />
                        <span>Por Região</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanViewMode('comparativo')}
                        title="Visualização Comparativa por Destino (Carteira vs Processo)"
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${planViewMode === 'comparativo'
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-sky-200/80 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <BarChart3 size={12} />
                        <span>Comparativo</span>
                      </button>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#164e85] text-sky-100 border border-sky-500/30 font-bold whitespace-nowrap">
                      {planViewMode === 'regiao'
                        ? `${regiaoGroups.reduce((acc, g) => acc + g.destinos.length, 0)} destinos`
                        : `${comparativeDestinos.length} destinos`}
                    </span>
                  </div>
                </div>

                {/* Alternância entre as visualizações dos painéis */}
                {planViewMode === 'regiao' ? (
                  /* Tabela estilizada com tema clean (linhas brancas com hover suave e bordas sutis) */
                  <div className="w-full">
                    <table className="w-full border-collapse font-sans text-slate-800 text-[10.5px] table-auto select-text">
                      <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[9.5px] font-black tracking-wider border-b border-slate-200">
                        <tr className="divide-x divide-white/10">
                          <th className="py-2 px-2.5 text-left font-bold w-24">
                            <div className="flex items-center justify-between gap-1">
                              <span>REGIÃO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2.5 text-left font-bold min-w-[260px]">
                            <div className="flex items-center justify-between gap-1">
                              <span>DESTINO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-14">
                            <div className="flex items-center justify-center gap-0.5">
                              <span>PEDIDO</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[80px] min-w-[80px] max-w-[80px]">
                            <span>QUANTIDADE</span>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[90px] min-w-[90px] max-w-[90px]">
                            <span>CUBAGEM</span>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[110px] min-w-[110px] max-w-[110px]">
                            <div className="flex items-center justify-center gap-0.5">
                              <span>VALOR$</span>
                              <span className="text-[8px] opacity-70">▾</span>
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center font-bold w-[65px] min-w-[65px] max-w-[65px]">
                            <span>PESO</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {regiaoGroups.map((group) => {
                          const isRegiaoCollapsed = !!collapsedRegioes[group.regiao]
                          return (
                            <React.Fragment key={group.regiao}>
                              {/* Cabeçalho de Grupo da Região:
                                - Se RECOLHIDA: fica em UMA ÚNICA LINHA já com os totais de Pedidos, Quantidade, Cubagem, Valor$ e Peso.
                                - Se EXPANDIDA: vira uma barra de cabeçalho simples [-] REGIAO, os destinos vêm abaixo e o subtotal vem no rodapé.
                            */}
                              {isRegiaoCollapsed ? (
                                <tr className="bg-slate-100/95 hover:bg-slate-200/80 transition-colors text-slate-900 font-extrabold border-y border-slate-200 divide-x divide-slate-200">
                                  <td colSpan={2} className="py-1 px-2.5 uppercase tracking-wide text-[11px] whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => toggleRegiao(group.regiao)}
                                      className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                    >
                                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs bg-blue-600 border-blue-600 text-white">
                                        +
                                      </span>
                                      <span className="text-slate-900 font-black">{group.regiao}</span>
                                      <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                        ({group.destinos.length} destinos - clique para expandir)
                                      </span>
                                    </button>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                    {group.totalPedidos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                    {Math.round(group.totalQtd).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                    <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                      <div className="flex justify-center items-center">
                                        {renderCubSemaforo(group.totalCub)}
                                      </div>
                                      <span className="text-right text-slate-900 font-black">
                                        {group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                    <div className="inline-flex items-center justify-center gap-1 w-full text-slate-900">
                                      <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                                      <span className="text-slate-900">
                                        {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                    {Math.round(group.totalPeso).toLocaleString('pt-BR')}
                                  </td>
                                </tr>
                              ) : (
                                <tr className="bg-slate-100/90 hover:bg-slate-200/70 transition-colors text-slate-900 font-extrabold border-y border-slate-200">
                                  <td colSpan={7} className="py-1 px-2.5 uppercase tracking-wide text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => toggleRegiao(group.regiao)}
                                      className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                    >
                                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs border-slate-400/80 bg-white text-slate-700">
                                        -
                                      </span>
                                      <span className="text-slate-900 font-black">{group.regiao}</span>
                                      <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                        ({group.destinos.length} destinos)
                                      </span>
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Linhas de Destino com suporte a expansão detalhada (visíveis se a região não estiver recolhida) */}
                              {!isRegiaoCollapsed && group.destinos.map((dest, idx) => {
                                const isExpanded = !!expandedDestinos[dest.destino]
                                return (
                                  <React.Fragment key={dest.destino}>
                                    <tr
                                      className={`transition-colors divide-x divide-slate-100 hover:bg-sky-50/50 ${isExpanded ? 'bg-blue-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                        }`}
                                      style={isExpanded ? { borderTop: '2px solid #0e3b66', borderLeft: '2px solid #0e3b66', borderRight: '2px solid #0e3b66' } : undefined}
                                    >
                                      <td className="py-1 px-2.5 text-slate-600 text-[10.5px] font-bold whitespace-nowrap">
                                        {idx === 0 ? group.regiao : ''}
                                      </td>
                                      <td className="py-1 px-2.5 font-bold text-slate-800 text-[11px] whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => toggleDestino(dest.destino)}
                                          className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                          <span className={`inline-flex items-center justify-center w-3 h-3 text-[9px] border rounded-xs leading-none shrink-0 font-mono font-bold select-none ${isExpanded ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-100 text-slate-600'
                                            }`}>
                                            {isExpanded ? '-' : '+'}
                                          </span>
                                          <span className={isExpanded ? 'text-blue-700 font-extrabold select-text' : 'select-text'}>{dest.destino}</span>
                                        </button>
                                      </td>
                                      <td className="py-1 px-2 text-center font-bold text-slate-700 text-[11px] whitespace-nowrap font-mono">
                                        {dest.pedidosCount.toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-1 px-2 text-center font-bold text-slate-700 text-[11px] whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                        {Math.round(dest.quantidade).toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] whitespace-nowrap font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                        <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                          <div className="flex justify-center items-center">
                                            {renderCubSemaforo(dest.cubagem)}
                                          </div>
                                          <span className="text-right font-bold text-slate-800">
                                            {dest.cubagem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] whitespace-nowrap font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                        <div className="inline-flex items-center justify-center gap-1 w-full font-bold text-slate-800">
                                          <span className="text-slate-400 font-normal text-[9.5px]">R$</span>
                                          <span>{dest.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                      </td>
                                      <td className="py-1 px-2 text-center text-[11px] text-slate-700 font-bold whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                        {Math.round(dest.pesoTotal).toLocaleString('pt-BR')}
                                      </td>
                                    </tr>

                                    {/* DETALHAMENTO EXPANDIDO (Hierarquia: Status do Lote -> Itens Diretos com Colunas Perfeitamente Alinhadas) */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={7} className="p-0 bg-slate-50/40">
                                          <div className="w-full border-b-2 border-x-2 border-[#0e3b66] divide-y divide-slate-200">
                                            {dest.statusGroups.map((stGroup) => {
                                              const stKey = `${dest.destino}__${stGroup.status}`
                                              const isStExpanded = !!expandedStatusLotes[stKey]

                                              return (
                                                <div key={stKey} className="w-full bg-white overflow-hidden">
                                                  {/* Cabeçalho do Status do Lote (Alinhado exatamente com o cabeçalho pai) */}
                                                  <div
                                                    onClick={() => toggleStatusLote(stKey)}
                                                    className={`transition-colors cursor-pointer flex items-center justify-between border-b border-slate-200 ${stGroup.status === 'EM CARTEIRA'
                                                      ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-950'
                                                      : 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950'
                                                      }`}
                                                  >
                                                    <div className="flex items-center gap-2 pl-4 sm:pl-6 py-2 flex-1 min-w-0">
                                                      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none font-mono font-black shrink-0 ${isStExpanded
                                                        ? (stGroup.status === 'EM CARTEIRA' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-600 border-amber-600 text-white')
                                                        : 'border-slate-400 bg-white text-slate-700'
                                                        }`}>
                                                        {isStExpanded ? '-' : '+'}
                                                      </span>
                                                      <span className="text-[11px] font-black uppercase tracking-wide truncate">
                                                        Status: {stGroup.status}
                                                      </span>
                                                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                                                        ({stGroup.itens.length} {stGroup.itens.length === 1 ? 'item' : 'itens'})
                                                      </span>
                                                      <span className="text-slate-300 font-normal mx-1 hidden sm:inline">|</span>
                                                      <span className="text-[10px] font-mono text-slate-600 shrink-0 hidden sm:inline">
                                                        Ped: <strong className="text-slate-900">{stGroup.pedidosCount.toLocaleString('pt-BR')}</strong>
                                                      </span>
                                                    </div>

                                                    {/* Métricas do Status travadas com a mesma largura das colunas superiores */}
                                                    <div className="flex items-center divide-x divide-slate-200/80 shrink-0 text-[10px] font-mono font-bold text-slate-800">
                                                      <div className="w-[80px] min-w-[80px] max-w-[80px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        {Math.round(stGroup.quantidade).toLocaleString('pt-BR')}
                                                      </div>
                                                      <div className="w-[90px] min-w-[90px] max-w-[90px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                                          <div className="flex justify-center items-center">
                                                            {renderCubSemaforo(stGroup.cubagem)}
                                                          </div>
                                                          <span className="text-right font-bold text-slate-800">
                                                            {stGroup.cubagem.toFixed(2)}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div className="w-[110px] min-w-[110px] max-w-[110px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                                        <span>{stGroup.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                      </div>
                                                      <div className="w-[65px] min-w-[65px] max-w-[65px] py-1.5 px-2 text-center whitespace-nowrap">
                                                        {Math.round(stGroup.pesoTotal).toLocaleString('pt-BR')}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Tabela Direta dos Itens (Alinhada perfeitamente coluna por coluna) */}
                                                  {isStExpanded && (
                                                    <div className="w-full select-text border-t border-slate-200">
                                                      <table className="w-full text-[9px] border-collapse bg-white select-text table-fixed">
                                                        <thead className="sticky top-0 z-10">
                                                          <tr className="bg-[#0e3b66] text-white font-bold text-[8.5px] uppercase tracking-wider divide-x divide-white/10">
                                                            <th className="py-1.5 px-1 text-center w-[84px] min-w-[84px] whitespace-nowrap">STATUS</th>
                                                            <th className="py-1.5 px-1 text-center w-[78px] min-w-[78px]">MODAL</th>
                                                            <th className="py-1.5 px-1 text-center w-[150px] min-w-[150px]">LINHA</th>
                                                            <th className="py-1.5 px-0.5 text-center w-[34px] min-w-[34px]">COD</th>
                                                            <th className="py-1.5 px-1 text-center w-[72px] min-w-[72px]">PREV. ENT.</th>
                                                            <th className="py-1.5 px-0.5 text-center w-[46px] min-w-[46px]">LOTE</th>
                                                            <th className="py-1.5 px-1 text-center w-[66px] min-w-[66px]">PEDIDO</th>
                                                            <th className="py-1.5 px-1 text-center w-[48px] min-w-[48px]">ITEM</th>
                                                            <th className="py-1.5 px-2 text-left min-w-[120px]">DESCRIÇÃO</th>
                                                            <th className="py-1.5 px-1 text-center w-[80px] min-w-[80px] max-w-[80px]">QTD</th>
                                                            <th className="py-1.5 px-1 text-center w-[90px] min-w-[90px] max-w-[90px]">CUB</th>
                                                            <th className="py-1.5 px-1 text-center w-[110px] min-w-[110px] max-w-[110px]">VALOR$</th>
                                                            <th className="py-1.5 px-1 text-center w-[65px] min-w-[65px] max-w-[65px]">PESO</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-sans">
                                                          {stGroup.itens.map((det, dIdx) => (
                                                            <tr key={`${det.item}-${det.numpedven}-${dIdx}`} className="hover:bg-blue-50/40 transition-colors divide-x divide-slate-100">
                                                              <td className="py-1 px-1 text-center whitespace-nowrap w-[84px] min-w-[84px]">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap leading-none ${det.statusOperacao === 'EM PROCESSO' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                                  }`}>
                                                                  {det.statusOperacao}
                                                                </span>
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-bold text-slate-700 w-[78px] min-w-[78px]">
                                                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[8px] whitespace-nowrap">
                                                                  {det.modalidade}
                                                                </span>
                                                              </td>
                                                              <td className="py-1 px-1.5 text-center text-slate-700 font-medium truncate w-[150px] min-w-[150px] max-w-[150px]" title={det.linha}>
                                                                {det.linha || '-'}
                                                              </td>
                                                              <td className="py-1 px-0.5 text-center font-mono font-bold text-slate-800 w-[34px] min-w-[34px]">
                                                                {det.codmodal || '-'}
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-medium text-slate-700 whitespace-nowrap w-[72px] min-w-[72px]">
                                                                <div className="flex items-center justify-center gap-0.5">
                                                                  <span>{formatDateBR(det.preventrega)}</span>
                                                                  {det.prazo && (
                                                                    <span className={`text-[8px] font-extrabold px-0.5 rounded ${det.prazo === 'Vencido'
                                                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                      : det.prazo === 'D0'
                                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                      }`}>
                                                                      {det.prazo}
                                                                    </span>
                                                                  )}
                                                                </div>
                                                              </td>
                                                              <td className="py-1 px-0.5 text-center font-mono font-bold text-slate-800 w-[46px] min-w-[46px]">
                                                                {det.numlote && det.numlote !== '-' ? det.numlote : '-'}
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-bold text-slate-800 w-[66px] min-w-[66px]">
                                                                {det.numpedven || '-'}
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-bold text-blue-700 w-[48px] min-w-[48px]">
                                                                {formatItemCode(det.item)}
                                                              </td>
                                                              <td className="py-1 px-2 text-slate-800 truncate" title={det.descricao}>
                                                                {det.descricao || '-'}
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-bold text-slate-800 w-[80px] min-w-[80px] max-w-[80px] text-[10.5px]">
                                                                {det.quantidade}
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono w-[90px] min-w-[90px] max-w-[90px] text-[10.5px]">
                                                                <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto text-[10px]">
                                                                  <div className="flex justify-center items-center">
                                                                    {renderCubSemaforo(det.cubagem)}
                                                                  </div>
                                                                  <span className="text-right font-bold text-slate-800">{det.cubagem.toFixed(2)}</span>
                                                                </div>
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-bold text-slate-800 w-[110px] min-w-[110px] max-w-[110px] whitespace-nowrap text-[10px]">
                                                                <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                                                <span>{det.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                              </td>
                                                              <td className="py-1 px-1 text-center font-mono font-medium text-slate-700 w-[65px] min-w-[65px] max-w-[65px] text-[10.5px]">
                                                                {Math.round(det.peso)}
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                              })}

                              {/* Subtotal da Região (Ex: CAPITAL TOTAL) - SÓ EXIBE SE A REGIÃO ESTIVER EXPANDIDA */}
                              {!isRegiaoCollapsed && (
                                <tr className="bg-slate-100/90 text-slate-900 font-black border-y border-slate-200 divide-x divide-slate-200">
                                  <td colSpan={2} className="py-1 px-2.5 tracking-wide uppercase text-[10.5px] font-black whitespace-nowrap text-slate-900">
                                    {group.regiao} TOTAL
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                    {group.totalPedidos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[80px] min-w-[80px] max-w-[80px]">
                                    {Math.round(group.totalQtd).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[90px] min-w-[90px] max-w-[90px]">
                                    <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                                      <div className="flex justify-center items-center">
                                        {renderCubSemaforo(group.totalCub)}
                                      </div>
                                      <span className="text-right text-slate-900 font-black">
                                        {group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] whitespace-nowrap font-black font-mono w-[110px] min-w-[110px] max-w-[110px]">
                                    <div className="inline-flex items-center justify-center gap-1 w-full text-slate-900">
                                      <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                                      <span className="text-slate-900">
                                        {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono w-[65px] min-w-[65px] max-w-[65px]">
                                    {Math.round(group.totalPeso).toLocaleString('pt-BR')}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}

                        {/* Total Geral Consolidado */}
                        <tr className="bg-slate-200/90 text-slate-950 font-black text-[11px] border-t-2 border-slate-300 divide-x divide-slate-300">
                          <td colSpan={2} className="py-1.5 px-2.5 uppercase tracking-wider whitespace-nowrap font-black">
                            Total Geral
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black">
                            {geralPedidos.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black w-[80px] min-w-[80px] max-w-[80px]">
                            {Math.round(geralQtd).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-mono font-black w-[90px] min-w-[90px] max-w-[90px]">
                            <div className="grid grid-cols-[18px_1fr] items-center gap-1 w-[72px] mx-auto">
                              <div className="flex justify-center items-center">
                                {renderCubSemaforo(geralCub)}
                              </div>
                              <span className="text-right text-slate-950 font-black">
                                {geralCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center whitespace-nowrap font-mono font-black w-[110px] min-w-[110px] max-w-[110px]">
                            <div className="inline-flex items-center justify-center gap-1 w-full">
                              <span className="text-slate-500 font-normal text-[9.5px]">R$</span>
                              <span>{geralValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-950 whitespace-nowrap font-mono font-black w-[65px] min-w-[65px] max-w-[65px]">
                            {Math.round(geralPeso).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* TABELA COMPARATIVA POR DESTINO (CARTEIRA X PROCESSO) */
                  <div className="w-full overflow-x-auto select-text">
                    <table className="w-full border-collapse font-sans text-slate-800 text-[10.5px] table-auto select-text">
                      <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[9.5px] font-black tracking-wider border-b border-[#0a2c4d]">
                        {/* Linha 1 de Cabeçalho: Super-headers */}
                        <tr className="divide-x divide-white/10 text-center">
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('regiao')}
                            className="py-2 px-2.5 text-left font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none w-24 min-w-[90px]"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span>REGIÃO</span>
                              <span className="text-[9px] opacity-80">
                                {compSortField === 'regiao' ? (compSortAsc ? '▲' : '▼') : '▾'}
                              </span>
                            </div>
                          </th>

                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('destino')}
                            className="py-2.5 px-3 text-left font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none min-w-[170px]"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span>DESTINO</span>
                              <span className="text-[9px] opacity-80">
                                {compSortField === 'destino' ? (compSortAsc ? '▲' : '▼') : '▾'}
                              </span>
                            </div>
                          </th>

                          {/* Bloco EM CARTEIRA */}
                          {showCarteira && (
                            <th
                              colSpan={2}
                              className="py-1.5 px-2 bg-[#123e6b] text-sky-200 border-b border-white/10 font-black tracking-widest text-[10px]"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                                <span>EM CARTEIRA</span>
                              </div>
                            </th>
                          )}

                          {/* Bloco EM PROCESSO */}
                          {showProcesso && (
                            <th
                              colSpan={2}
                              className="py-1.5 px-2 bg-[#184880] text-blue-100 border-b border-white/10 font-black tracking-widest text-[10px]"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                                <span>EM PROCESSO</span>
                              </div>
                            </th>
                          )}

                          {/* TOTAL PÇS */}
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('totalQtd')}
                            className="py-2 px-2 text-center font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none w-[80px] min-w-[80px] bg-[#0a2c4d]"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>Total PÇS</span>
                              <span className="text-[8px] opacity-70">
                                {compSortField === 'totalQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>

                          {/* TOTAL CUB */}
                          <th
                            rowSpan={2}
                            onClick={() => handleCompSort('totalCub')}
                            className="py-2 px-2 text-center font-extrabold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#0a2c4d]"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              <span>Total Cub</span>
                              <span className="text-[8px] opacity-70">
                                {compSortField === 'totalCub' ? (compSortAsc ? '▲' : '▼') : ''}
                              </span>
                            </div>
                          </th>
                        </tr>

                        {/* Linha 2 de Cabeçalho: Subcolunas */}
                        <tr className="divide-x divide-white/10 text-center text-[9px]">
                          {/* Subcolunas Carteira */}
                          {showCarteira && (
                            <>
                              <th
                                onClick={() => handleCompSort('carteiraQtd')}
                                className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[85px] min-w-[85px] bg-[#123e6b] text-sky-100"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>QUANTIDADE</span>
                                  <span className="text-[7.5px] opacity-70">
                                    {compSortField === 'carteiraQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                                  </span>
                                </div>
                              </th>
                              <th
                                onClick={() => handleCompSort('carteiraCub')}
                                className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#123e6b] text-sky-100"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>CUBAGEM</span>
                                  <span className="text-[7.5px] opacity-70">
                                    {compSortField === 'carteiraCub' ? (compSortAsc ? '▲' : '▼') : ''}
                                  </span>
                                </div>
                              </th>
                            </>
                          )}

                          {/* Subcolunas Processo */}
                          {showProcesso && (
                            <>
                              <th
                                onClick={() => handleCompSort('processoQtd')}
                                className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[85px] min-w-[85px] bg-[#184880] text-blue-100"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>QUANTIDADE</span>
                                  <span className="text-[7.5px] opacity-70">
                                    {compSortField === 'processoQtd' ? (compSortAsc ? '▲' : '▼') : ''}
                                  </span>
                                </div>
                              </th>
                              <th
                                onClick={() => handleCompSort('processoCub')}
                                className="py-1.5 px-2 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none w-[75px] min-w-[75px] bg-[#184880] text-blue-100"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>CUBAGEM</span>
                                  <span className="text-[7.5px] opacity-70">
                                    {compSortField === 'processoCub' ? (compSortAsc ? '▲' : '▼') : ''}
                                  </span>
                                </div>
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-sans">
                        {compRegiaoGroups.length === 0 ? (
                          <tr>
                            <td colSpan={2 + (showCarteira ? 2 : 0) + (showProcesso ? 2 : 0) + 2} className="py-12 text-center text-slate-400 italic">
                              Nenhum destino encontrado com os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          compRegiaoGroups.map((group) => {
                            const isRegiaoCollapsed = !!collapsedRegioes[group.regiao]
                            return (
                              <React.Fragment key={group.regiao}>
                                {/* Cabeçalho do Grupo da Região:
                                    - Se RECOLHIDA: exibe subtotais em uma única linha
                                    - Se EXPANDIDA: exibe barra de título e depois os destinos
                                */}
                                {isRegiaoCollapsed ? (
                                  <tr className="bg-slate-100/95 hover:bg-slate-200/80 transition-colors text-slate-900 font-extrabold border-y border-slate-200 divide-x divide-slate-200">
                                    <td colSpan={2} className="py-1 px-2.5 uppercase tracking-wide text-[11px] whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => toggleRegiao(group.regiao)}
                                        className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                      >
                                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs bg-blue-600 border-blue-600 text-white">
                                          +
                                        </span>
                                        <span className="text-slate-900 font-black">{group.regiao}</span>
                                        <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                          ({group.destinos.length} destinos - clique para expandir)
                                        </span>
                                      </button>
                                    </td>
                                    {showCarteira && (
                                      <>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-800 whitespace-nowrap font-mono">
                                          {group.carteiraQtd > 0 ? Math.round(group.carteiraQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                          {group.carteiraCub > 0 ? group.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    {showProcesso && (
                                      <>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-blue-700 bg-blue-50/30 whitespace-nowrap font-mono">
                                          {group.processoQtd > 0 ? Math.round(group.processoQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-blue-900 bg-blue-50/30 whitespace-nowrap font-mono">
                                          {group.processoCub > 0 ? group.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 bg-slate-100/40 whitespace-nowrap font-mono">
                                      {group.totalQtd > 0 ? Math.round(group.totalQtd).toLocaleString('pt-BR') : '-'}
                                    </td>
                                    <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-950 bg-slate-100/40 whitespace-nowrap font-mono">
                                      {group.totalCub > 0 ? group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                    </td>
                                  </tr>
                                ) : (
                                  <tr className="bg-slate-100/90 hover:bg-slate-200/70 transition-colors text-slate-900 font-extrabold border-y border-slate-200">
                                    <td colSpan={2 + (showCarteira ? 2 : 0) + (showProcesso ? 2 : 0) + 2} className="py-1 px-2.5 uppercase tracking-wide text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() => toggleRegiao(group.regiao)}
                                        className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-700 transition-colors cursor-pointer w-full select-none"
                                      >
                                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] border rounded-xs leading-none mr-1 font-mono font-black shadow-2xs border-slate-400/80 bg-white text-slate-700">
                                          -
                                        </span>
                                        <span className="text-slate-900 font-black">{group.regiao}</span>
                                        <span className="text-[10px] text-slate-500 font-normal lowercase ml-1">
                                          ({group.destinos.length} destinos)
                                        </span>
                                      </button>
                                    </td>
                                  </tr>
                                )}

                                {/* Linhas de Destino da Região */}
                                {!isRegiaoCollapsed && group.destinos.map((row, idx) => (
                                  <tr
                                    key={row.destino}
                                    className={`divide-x divide-slate-100 transition-colors hover:bg-blue-50/50 ${
                                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                    }`}
                                  >
                                    {/* REGIÃO */}
                                    <td className="py-1 px-2.5 text-slate-600 text-[10.5px] font-bold whitespace-nowrap">
                                      {idx === 0 ? group.regiao : ''}
                                    </td>

                                    {/* DESTINO */}
                                    <td className="py-1.5 px-3 font-semibold text-slate-800 whitespace-nowrap text-left">
                                      {row.destino}
                                    </td>

                                    {/* EM CARTEIRA */}
                                    {showCarteira && (
                                      <>
                                        <td className="py-1.5 px-2 text-center text-slate-700 font-mono font-medium whitespace-nowrap">
                                          {row.carteiraQtd > 0 ? Math.round(row.carteiraQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-2 text-center text-slate-800 font-mono font-bold whitespace-nowrap">
                                          {row.carteiraCub > 0
                                            ? row.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                            : '-'}
                                        </td>
                                      </>
                                    )}

                                    {/* EM PROCESSO */}
                                    {showProcesso && (
                                      <>
                                        <td className="py-1.5 px-2 text-center text-blue-700 bg-blue-50/30 font-mono font-medium whitespace-nowrap">
                                          {row.processoQtd > 0 ? Math.round(row.processoQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-2 text-center text-blue-900 bg-blue-50/30 font-mono font-bold whitespace-nowrap">
                                          {row.processoCub > 0
                                            ? row.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                            : '-'}
                                        </td>
                                      </>
                                    )}

                                    {/* TOTAL PÇS */}
                                    <td className="py-1.5 px-2 text-center text-slate-900 bg-slate-100/40 font-mono font-bold whitespace-nowrap">
                                      {row.totalQtd > 0 ? Math.round(row.totalQtd).toLocaleString('pt-BR') : '-'}
                                    </td>

                                    {/* TOTAL CUB */}
                                    <td className="py-1.5 px-2 text-center text-slate-950 bg-slate-100/40 font-mono font-black whitespace-nowrap">
                                      {row.totalCub > 0
                                        ? row.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}

                                {/* Subtotal da Região (Ex: CAPITAL TOTAL) */}
                                {!isRegiaoCollapsed && (
                                  <tr className="bg-slate-100/90 text-slate-900 font-black border-y border-slate-200 divide-x divide-slate-200">
                                    <td colSpan={2} className="py-1 px-2.5 tracking-wide uppercase text-[10.5px] font-black whitespace-nowrap text-slate-900">
                                      {group.regiao} TOTAL
                                    </td>
                                    {showCarteira && (
                                      <>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-800 whitespace-nowrap font-mono">
                                          {group.carteiraQtd > 0 ? Math.round(group.carteiraQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 whitespace-nowrap font-mono">
                                          {group.carteiraCub > 0 ? group.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    {showProcesso && (
                                      <>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-blue-700 bg-blue-50/30 whitespace-nowrap font-mono">
                                          {group.processoQtd > 0 ? Math.round(group.processoQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1 px-2 text-center text-[10.5px] font-black text-blue-900 bg-blue-50/30 whitespace-nowrap font-mono">
                                          {group.processoCub > 0 ? group.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-900 bg-slate-100/40 whitespace-nowrap font-mono">
                                      {group.totalQtd > 0 ? Math.round(group.totalQtd).toLocaleString('pt-BR') : '-'}
                                    </td>
                                    <td className="py-1 px-2 text-center text-[10.5px] font-black text-slate-950 bg-slate-100/40 whitespace-nowrap font-mono">
                                      {group.totalCub > 0 ? group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })
                        )}

                        {/* TOTAL GERAL */}
                        {comparativeDestinos.length > 0 && (
                          <tr className="bg-[#0e3b66] text-white font-extrabold uppercase text-[10px] tracking-wide border-t-2 border-[#0a2c4d] divide-x divide-white/10 sticky bottom-0 z-10 shadow-md">
                            <td colSpan={2} className="py-2.5 px-3 text-left font-black">
                              TOTAL GERAL
                            </td>
                            {showCarteira && (
                              <>
                                <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-200">
                                  {Math.round(compTotals.carteiraQtd).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-black text-sky-100">
                                  {compTotals.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>
                              </>
                            )}
                            {showProcesso && (
                              <>
                                <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-200 bg-[#164e85]">
                                  {Math.round(compTotals.processoQtd).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-black text-sky-100 bg-[#164e85]">
                                  {compTotals.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>
                              </>
                            )}
                            <td className="py-2.5 px-2 text-center font-mono font-black text-white bg-[#0a2c4d]">
                              {Math.round(compTotals.totalQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-white bg-[#0a2c4d]">
                              {compTotals.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* LADO DIREITO: ÁREA RESERVADA PARA TABELAS/VISÕES DO PAINEL LATERAL */}
              <div className={`space-y-4 w-full min-w-0 ${planRightTab === 'visao3' ? 'flex-1' : 'flex-1 xl:max-w-[700px] 2xl:max-w-[740px]'}`}>
                {/* 3 BOTÕES DE VISÃO DO PAINEL LATERAL (CONFORME SOLICITADO) */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPlanRightTab('linha')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      planRightTab === 'linha'
                        ? 'bg-[#0e3b66] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <Boxes size={14} className={planRightTab === 'linha' ? 'text-sky-300' : 'text-slate-400'} />
                    <span>Por Linha & Itens</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanRightTab('datas')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      planRightTab === 'datas'
                        ? 'bg-[#0e3b66] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <CalendarDays size={14} className={planRightTab === 'datas' ? 'text-sky-300' : 'text-slate-400'} />
                    <span>Dt. Pedido x Prev. Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanRightTab('visao3')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      planRightTab === 'visao3'
                        ? 'bg-[#0e3b66] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <Activity size={14} className={planRightTab === 'visao3' ? 'text-sky-300' : 'text-slate-400'} />
                    <span>Painel Operacional</span>
                  </button>
                </div>

                {/* ------------------------------------------------------------ */}
                {/* VISÃO 1: POR LINHA & DETALHE DE PRODUTOS                    */}
                {/* ------------------------------------------------------------ */}
                {planRightTab === 'linha' && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
                    {/* Cabeçalho da Tabela de Linhas */}
                    <div className="px-3.5 py-2.5 bg-[#0e3b66] text-white flex items-center justify-between border-b border-[#0a2c4d] gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Boxes size={15} className="text-sky-300 shrink-0" />
                        <span className="text-[11px] font-black tracking-wide uppercase">
                          Consolidação por Linha & Detalhe de Produtos
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#164e85] text-sky-100 border border-sky-500/30 font-bold whitespace-nowrap">
                          {linhaSummaries.length} linhas ({linhaTotals.totalItens} itens)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Busca rápida interna de produtos/linhas */}
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                          <input
                            type="text"
                            value={planRightSearch}
                            onChange={e => setPlanRightSearch(e.target.value)}
                            placeholder="Buscar produto ou linha..."
                            className="pl-6 pr-2 py-0.5 text-[10.5px] rounded-md bg-[#0a2c4d] text-white placeholder-slate-400 border border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-400 w-36 sm:w-44 transition-all"
                          />
                          {planRightSearch && (
                            <button
                              type="button"
                              onClick={() => setPlanRightSearch('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                              title="Limpar busca interna"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>

                        {/* Botões Expandir / Recolher Tudo */}
                        <div className="flex items-center bg-[#072440] p-0.5 rounded-lg border border-sky-400/25">
                          <button
                            type="button"
                            onClick={() => setCollapsedLinhas(new Set())}
                            title="Expandir todas as linhas"
                            className="px-2 py-0.5 text-[9.5px] font-bold text-sky-200/90 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                          >
                            Expandir
                          </button>
                          <button
                            type="button"
                            onClick={() => setCollapsedLinhas(new Set(linhaSummaries.map(l => l.linha)))}
                            title="Recolher todas as linhas"
                            className="px-2 py-0.5 text-[9.5px] font-bold text-sky-200/90 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                          >
                            Recolher
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Linhas e Itens */}
                    <div className="w-full overflow-x-auto select-text">
                      <table className="w-full border-collapse font-sans text-slate-800 text-[10.5px] table-auto">
                        <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[9.5px] font-black tracking-wider border-b border-[#0a2c4d]">
                          <tr className="divide-x divide-white/10 text-center select-none">
                            <th
                              onClick={() => handleLinhaSort('ibm')}
                              title="Clique para classificar por IBM"
                              className="py-2 px-2 text-center font-extrabold w-[75px] min-w-[75px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>IBM</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'ibm' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('item')}
                              title="Clique para classificar por Código do Item"
                              className="py-2 px-2 text-center font-extrabold w-[80px] min-w-[80px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>ITEM</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'item' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('linha')}
                              title="Clique para classificar por Linha / Descrição"
                              className="py-2 px-2.5 text-left font-extrabold min-w-[200px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span>LINHA / DESCRIÇÃO</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'linha' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('totalQtd')}
                              title="Clique para classificar por Quantidade"
                              className="py-2 px-2 text-center font-extrabold w-[65px] min-w-[65px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>QTD</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'totalQtd' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('totalCub')}
                              title="Clique para classificar por Cubagem"
                              className="py-2 px-2 text-center font-extrabold w-[75px] min-w-[75px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>CUBAGEM</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'totalCub' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('totalValor')}
                              title="Clique para classificar por Valor Total"
                              className="py-2 px-2 text-center font-extrabold w-[95px] min-w-[95px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>VALOR$</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'totalValor' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleLinhaSort('totalPeso')}
                              title="Clique para classificar por Peso Total"
                              className="py-2 px-2 text-center font-extrabold w-[65px] min-w-[65px] cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>PESO</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {linhaSortKey === 'totalPeso' ? (linhaSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredLinhaSummaries.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                                Nenhum registro encontrado para os filtros ativos.
                              </td>
                            </tr>
                          ) : (
                            filteredLinhaSummaries.map(group => {
                              const isCollapsed = collapsedLinhas.has(group.linha)
                              return (
                                <React.Fragment key={group.linha}>
                                  {/* Linha Cabeçalho da Linha (Nível 1) */}
                                  <tr
                                    onClick={() => toggleCollapseLinha(group.linha)}
                                    className="bg-slate-100/90 hover:bg-slate-200/80 transition-colors cursor-pointer font-bold border-y border-slate-200 divide-x divide-slate-200/80 select-none"
                                  >
                                    <td colSpan={3} className="py-1.5 px-2.5 text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded flex items-center justify-center bg-white border border-slate-300 text-[10px] font-black text-slate-700 shadow-2xs shrink-0">
                                          {isCollapsed ? '+' : '−'}
                                        </span>
                                        <span className="font-extrabold text-[11px] text-slate-900">{group.linha}</span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-extrabold ml-1 shrink-0">
                                          {group.totalItens} {group.totalItens === 1 ? 'item' : 'itens'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-mono font-black text-slate-900">
                                      {Math.round(group.totalQtd).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-mono font-black text-slate-900">
                                      {group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-mono font-black text-slate-900">
                                      <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                      {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-mono font-black text-slate-900">
                                      {Math.round(group.totalPeso).toLocaleString('pt-BR')}
                                    </td>
                                  </tr>

                                  {/* Detalhe dos Itens dessa Linha (Nível 2) */}
                                  {!isCollapsed && group.itens.map(item => (
                                    <tr
                                      key={item.item}
                                      className="hover:bg-blue-50/40 transition-colors divide-x divide-slate-100 text-[10px]"
                                    >
                                      <td className="py-1 px-2 text-center font-mono font-medium text-slate-600 bg-slate-50/40 w-[75px] min-w-[75px]">
                                        {item.ibm || '-'}
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/20 w-[80px] min-w-[80px]">
                                        {item.item}
                                      </td>
                                      <td className="py-1 px-3 text-slate-700">
                                        <span className="line-clamp-1" title={item.descricao}>
                                          {item.descricao}
                                        </span>
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono font-bold text-slate-800">
                                        {Math.round(item.quantidade).toLocaleString('pt-BR')}
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono font-semibold text-slate-800">
                                        {item.cubagem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono text-slate-800">
                                        <span className="text-slate-400 font-normal text-[8.5px] mr-0.5">R$</span>
                                        {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono text-slate-700">
                                        {Math.round(item.peso).toLocaleString('pt-BR')}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              )
                            })
                          )}
                        </tbody>

                        {/* Rodapé Total Geral */}
                        <tfoot className="sticky bottom-0 z-20 bg-[#0e3b66] text-white font-black text-[10px] uppercase border-t-2 border-[#0a2c4d]">
                          <tr className="divide-x divide-white/10">
                            <td colSpan={3} className="py-2 px-3 tracking-wider">
                              TOTAL GERAL ({linhaTotals.totalLinhas} LINHAS / {linhaTotals.totalItens} ITENS)
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-black text-white">
                              {Math.round(linhaTotals.totalQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-black text-white">
                              {linhaTotals.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-black text-white">
                              <span className="text-sky-300 font-normal text-[8.5px] mr-0.5">R$</span>
                              {linhaTotals.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-black text-white">
                              {Math.round(linhaTotals.totalPeso).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* VISÃO 2: CRUZAMENTO DTPEDIDO x PREVENTREGA (CARTEIRA X PROCESSO) */}
                {/* ------------------------------------------------------------ */}
                {planRightTab === 'datas' && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col w-full">
                    {/* Cabeçalho da Tabela de Datas */}
                    <div className="px-3.5 py-2.5 bg-[#0e3b66] text-white flex items-center justify-between border-b border-[#0a2c4d] gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-sky-300 shrink-0" />
                        <span className="text-[11px] font-black tracking-wide uppercase">
                          Cruzamento Dt. Pedido x Previsão Entrega (Carteira vs Processo)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#164e85] text-sky-100 border border-sky-500/30 font-bold whitespace-nowrap">
                          {sortedDateGroups.length} datas
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Busca rápida de datas */}
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                          <input
                            type="text"
                            value={planRightSearch}
                            onChange={e => setPlanRightSearch(e.target.value)}
                            placeholder="Buscar data (ex: 25/11)..."
                            className="pl-6 pr-2 py-0.5 text-[10.5px] rounded-md bg-[#0a2c4d] text-white placeholder-slate-400 border border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-400 w-36 sm:w-44 transition-all"
                          />
                          {planRightSearch && (
                            <button
                              type="button"
                              onClick={() => setPlanRightSearch('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                              title="Limpar busca interna"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>

                        {/* Botões Expandir / Recolher Tudo */}
                        <div className="flex items-center bg-[#072440] p-0.5 rounded-lg border border-sky-400/25">
                          <button
                            type="button"
                            onClick={() => setCollapsedDates(new Set())}
                            title="Expandir todas as datas"
                            className="px-2 py-0.5 text-[9.5px] font-bold text-sky-200/90 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                          >
                            Expandir
                          </button>
                          <button
                            type="button"
                            onClick={() => setCollapsedDates(new Set(sortedDateGroups.map(d => d.dtPedido)))}
                            title="Recolher todas as datas"
                            className="px-2 py-0.5 text-[9.5px] font-bold text-sky-200/90 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                          >
                            Recolher
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabela DTPEDIDO x PREVENTREGA */}
                    <div className="w-full overflow-x-auto select-text">
                      <table className="w-full border-collapse font-sans text-slate-800 text-[10px] table-auto">
                        <thead className="sticky top-0 z-20 bg-[#0e3b66] text-white uppercase text-[8.5px] font-black tracking-wider border-b border-[#0a2c4d]">
                          {/* Super-headers */}
                          <tr className="divide-x divide-white/10 text-center">
                            <th colSpan={2} className="py-1 px-2 bg-[#0e3b66] text-white tracking-widest font-extrabold">
                              DATAS
                            </th>
                            {showCarteira && (
                              <th colSpan={3} className="py-1 px-2 bg-[#123e6b] text-sky-200 tracking-widest font-black">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                                  <span>EM CARTEIRA</span>
                                </div>
                              </th>
                            )}
                            {showProcesso && (
                              <th colSpan={3} className="py-1 px-2 bg-[#184880] text-blue-100 tracking-widest font-black">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                                  <span>EM PROCESSO</span>
                                </div>
                              </th>
                            )}
                            <th colSpan={3} className="py-1 px-2 bg-[#0a2c4d] text-white tracking-widest font-black">
                              TOTAL CONSOLIDADO
                            </th>
                          </tr>

                          {/* Subcolunas com Classificação (Sort) */}
                          <tr className="divide-x divide-white/10 text-center text-[8px] select-none">
                            <th
                              onClick={() => handleDateSort('dtPedido')}
                              title="Clique para classificar por Data do Pedido"
                              className="py-1.5 px-2 font-bold w-[75px] min-w-[75px] bg-[#0c3359] cursor-pointer hover:bg-[#14487a] transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>DT. PEDIDO</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {dateSortKey === 'dtPedido' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleDateSort('prevEntrega')}
                              title="Clique para classificar por Previsão de Entrega"
                              className="py-1.5 px-2 font-bold w-[75px] min-w-[75px] bg-[#0c3359] cursor-pointer hover:bg-[#14487a] transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>PREV. ENTREGA</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {dateSortKey === 'prevEntrega' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            {/* Carteira */}
                            {showCarteira && (
                              <>
                                <th
                                  onClick={() => handleDateSort('carteiraPedidos')}
                                  title="Clique para classificar por Pedidos em Carteira"
                                  className="py-1.5 px-1.5 font-bold w-[55px] min-w-[55px] bg-[#123e6b] text-sky-100 cursor-pointer hover:bg-[#1c548e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>PEDIDOS</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'carteiraPedidos' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleDateSort('carteiraQtd')}
                                  title="Clique para classificar por Peças em Carteira"
                                  className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#123e6b] text-sky-100 cursor-pointer hover:bg-[#1c548e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>PEÇAS</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'carteiraQtd' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleDateSort('carteiraCub')}
                                  title="Clique para classificar por Cubagem em Carteira"
                                  className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#123e6b] text-sky-100 cursor-pointer hover:bg-[#1c548e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>CUBAGEM</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'carteiraCub' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                              </>
                            )}
                            {/* Processo */}
                            {showProcesso && (
                              <>
                                <th
                                  onClick={() => handleDateSort('processoPedidos')}
                                  title="Clique para classificar por Pedidos em Processo"
                                  className="py-1.5 px-1.5 font-bold w-[55px] min-w-[55px] bg-[#184880] text-blue-100 cursor-pointer hover:bg-[#205b9e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>PEDIDOS</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'processoPedidos' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleDateSort('processoQtd')}
                                  title="Clique para classificar por Peças em Processo"
                                  className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#184880] text-blue-100 cursor-pointer hover:bg-[#205b9e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>PEÇAS</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'processoQtd' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                                <th
                                  onClick={() => handleDateSort('processoCub')}
                                  title="Clique para classificar por Cubagem em Processo"
                                  className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#184880] text-blue-100 cursor-pointer hover:bg-[#205b9e] transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span>CUBAGEM</span>
                                    <span className="text-[7.5px] text-sky-300 font-mono">
                                      {dateSortKey === 'processoCub' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                    </span>
                                  </div>
                                </th>
                              </>
                            )}
                            {/* Total */}
                            <th
                              onClick={() => handleDateSort('totalPedidos')}
                              title="Clique para classificar por Total de Pedidos"
                              className="py-1.5 px-1.5 font-bold w-[55px] min-w-[55px] bg-[#0a2c4d] text-white cursor-pointer hover:bg-[#124270] transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>TOTAL PED</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {dateSortKey === 'totalPedidos' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleDateSort('totalQtd')}
                              title="Clique para classificar por Total de Peças"
                              className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#0a2c4d] text-white cursor-pointer hover:bg-[#124270] transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>TOTAL PÇS</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {dateSortKey === 'totalQtd' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                            <th
                              onClick={() => handleDateSort('totalCub')}
                              title="Clique para classificar por Total de Cubagem"
                              className="py-1.5 px-1.5 font-bold w-[60px] min-w-[60px] bg-[#0a2c4d] text-white cursor-pointer hover:bg-[#124270] transition-colors"
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span>TOTAL CUB</span>
                                <span className="text-[7.5px] text-sky-300 font-mono">
                                  {dateSortKey === 'totalCub' ? (dateSortAsc ? '▲' : '▼') : '↕'}
                                </span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredDateGroups.length === 0 ? (
                            <tr>
                              <td colSpan={2 + (showCarteira ? 3 : 0) + (showProcesso ? 3 : 0) + 3} className="py-8 text-center text-slate-400 text-xs font-medium">
                                Nenhum registro encontrado para os filtros ativos.
                              </td>
                            </tr>
                          ) : (
                            filteredDateGroups.map(group => {
                              const isCollapsed = collapsedDates.has(group.dtPedido)
                              return (
                                <React.Fragment key={group.dtPedido}>
                                  {/* Linha Grupo de Data do Pedido (Nível 1) */}
                                  <tr
                                    onClick={() => {
                                      if (group.itens.length > 1) toggleCollapseDate(group.dtPedido)
                                    }}
                                    className={`bg-slate-100/90 hover:bg-slate-200/80 transition-colors font-bold border-y border-slate-200 divide-x divide-slate-200/80 select-none text-[10px] ${
                                      group.itens.length > 1 ? 'cursor-pointer' : ''
                                    }`}
                                  >
                                    {/* DT. PEDIDO */}
                                    <td className="py-1.5 px-2 text-slate-900 text-center font-mono font-bold bg-slate-50/40 w-[75px] min-w-[75px]">
                                      <div className="flex items-center justify-center gap-1">
                                        {group.itens.length > 1 && (
                                          <span className="w-3.5 h-3.5 rounded flex items-center justify-center bg-white border border-slate-300 text-[9px] font-black text-slate-700 shadow-2xs shrink-0">
                                            {isCollapsed ? '+' : '−'}
                                          </span>
                                        )}
                                        <span className="font-black text-[10.5px]">{group.dtPedido}</span>
                                      </div>
                                    </td>

                                    {/* PREV. ENTREGA */}
                                    <td className="py-1.5 px-2 text-center font-mono font-bold text-blue-800 bg-blue-50/20 w-[75px] min-w-[75px]">
                                      {group.itens.length === 1 ? group.itens[0].prevEntrega : '-'}
                                    </td>
                                    {/* Carteira */}
                                    {showCarteira && (
                                      <>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-bold text-slate-800">
                                          {group.carteiraPedidosCount > 0 ? group.carteiraPedidosCount.toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-black text-slate-900">
                                          {group.carteiraQtd > 0 ? Math.round(group.carteiraQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-black text-slate-900">
                                          {group.carteiraCub > 0 ? group.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    {/* Processo */}
                                    {showProcesso && (
                                      <>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-bold text-blue-800 bg-blue-50/40">
                                          {group.processoPedidosCount > 0 ? group.processoPedidosCount.toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-black text-blue-900 bg-blue-50/40">
                                          {group.processoQtd > 0 ? Math.round(group.processoQtd).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td className="py-1.5 px-1.5 text-center font-mono font-black text-blue-950 bg-blue-50/40">
                                          {group.processoCub > 0 ? group.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                        </td>
                                      </>
                                    )}
                                    {/* Total */}
                                    <td className="py-1.5 px-1.5 text-center font-mono font-black text-slate-950 bg-slate-200/50">
                                      {group.totalPedidosCount > 0 ? group.totalPedidosCount.toLocaleString('pt-BR') : '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center font-mono font-black text-slate-950 bg-slate-200/50">
                                      {group.totalQtd > 0 ? Math.round(group.totalQtd).toLocaleString('pt-BR') : '-'}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center font-mono font-black text-slate-950 bg-slate-200/50">
                                      {group.totalCub > 0 ? group.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                    </td>
                                  </tr>

                                  {/* Detalhe das Previsões de Entrega desta Data do Pedido (Nível 2 - apenas quando houver mais de uma previsão) */}
                                  {group.itens.length > 1 && !isCollapsed && group.itens.map(item => (
                                    <tr
                                      key={item.prevEntrega}
                                      className="hover:bg-blue-50/30 transition-colors divide-x divide-slate-100 text-center font-mono text-[9.5px]"
                                    >
                                      <td className="py-1 px-2 text-slate-400 font-mono text-[9px] bg-slate-50/20 text-center">
                                        ↳
                                      </td>
                                      <td className="py-1 px-2 text-blue-800 font-bold bg-blue-50/20">
                                        {item.prevEntrega}
                                      </td>
                                      {/* Carteira */}
                                      {showCarteira && (
                                        <>
                                          <td className="py-1 px-1.5 text-slate-700">
                                            {item.carteiraPedidosCount > 0 ? item.carteiraPedidosCount.toLocaleString('pt-BR') : '-'}
                                          </td>
                                          <td className="py-1 px-1.5 font-bold text-slate-800">
                                            {item.carteiraQtd > 0 ? Math.round(item.carteiraQtd).toLocaleString('pt-BR') : '-'}
                                          </td>
                                          <td className="py-1 px-1.5 font-bold text-slate-800">
                                            {item.carteiraCub > 0 ? item.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                          </td>
                                        </>
                                      )}
                                      {/* Processo */}
                                      {showProcesso && (
                                        <>
                                          <td className="py-1 px-1.5 text-blue-700 bg-blue-50/30">
                                            {item.processoPedidosCount > 0 ? item.processoPedidosCount.toLocaleString('pt-BR') : '-'}
                                          </td>
                                          <td className="py-1 px-1.5 font-bold text-blue-800 bg-blue-50/30">
                                            {item.processoQtd > 0 ? Math.round(item.processoQtd).toLocaleString('pt-BR') : '-'}
                                          </td>
                                          <td className="py-1 px-1.5 font-bold text-blue-900 bg-blue-50/30">
                                            {item.processoCub > 0 ? item.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                          </td>
                                        </>
                                      )}
                                      {/* Total */}
                                      <td className="py-1 px-1.5 font-black text-slate-900 bg-slate-100/50">
                                        {item.totalPedidosCount > 0 ? item.totalPedidosCount.toLocaleString('pt-BR') : '-'}
                                      </td>
                                      <td className="py-1 px-1.5 font-black text-slate-900 bg-slate-100/50">
                                        {item.totalQtd > 0 ? Math.round(item.totalQtd).toLocaleString('pt-BR') : '-'}
                                      </td>
                                      <td className="py-1 px-1.5 font-black text-slate-900 bg-slate-100/50">
                                        {item.totalCub > 0 ? item.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              )
                            })
                          )}
                        </tbody>

                        {/* Rodapé Total Geral */}
                        <tfoot className="sticky bottom-0 z-20 bg-[#0e3b66] text-white font-black text-[9px] uppercase border-t-2 border-[#0a2c4d]">
                          <tr className="divide-x divide-white/10 text-center font-mono">
                            <td colSpan={2} className="py-2 px-2 text-left font-sans tracking-wider text-white">
                              TOTAL GERAL ({sortedDateGroups.length} DATAS DE PEDIDO)
                            </td>
                            {/* Carteira */}
                            {showCarteira && (
                              <>
                                <td className="py-2 px-1.5 font-bold text-sky-200">
                                  {dateTotals.carteiraPedidosSet.size.toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-1.5 font-bold text-sky-200">
                                  {Math.round(dateTotals.carteiraQtd).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-1.5 font-bold text-sky-200">
                                  {dateTotals.carteiraCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>
                              </>
                            )}
                            {/* Processo */}
                            {showProcesso && (
                              <>
                                <td className="py-2 px-1.5 font-bold text-sky-200 bg-[#123e6b]">
                                  {dateTotals.processoPedidosSet.size.toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-1.5 font-bold text-sky-200 bg-[#123e6b]">
                                  {Math.round(dateTotals.processoQtd).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-bold text-sky-200 bg-[#123e6b]">
                                  {dateTotals.processoCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>
                              </>
                            )}
                            {/* Total */}
                            <td className="py-2 px-1.5 font-black text-white bg-[#072440]">
                              {dateTotals.totalPedidosSet.size.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-1.5 font-black text-white bg-[#072440]">
                              {Math.round(dateTotals.totalQtd).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-1.5 font-black text-white bg-[#072440]">
                              {dateTotals.totalCub.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* VISÃO 3: PAINEL OPERACIONAL POR MODALIDADE (MAGALU)          */}
                {/* ------------------------------------------------------------ */}
                {planRightTab === 'visao3' && (
                  <div className="bg-[#0b2834] rounded-2xl border border-teal-500/30 p-4 text-white shadow-xl flex flex-col space-y-4 w-full select-text overflow-hidden">
                    {/* Barra Superior de Controles e Configuração da Visão 3 */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-500/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-teal-300" />
                        <span className="text-[12px] font-black tracking-wider uppercase text-teal-100">
                          Painel Operacional por Modalidade
                        </span>
                        <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-500/30 font-bold">
                          Capacidade & Giro Diário
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenConfigOperacional}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 hover:text-white text-[10.5px] font-bold border border-teal-400/30 transition-all cursor-pointer shadow-xs"
                        title="Configurar Metas e Capacidades"
                      >
                        <Settings2 size={12} className="text-teal-300" />
                        <span>Metas & Capacidades</span>
                      </button>
                    </div>

                    {/* Linha Superior: 3 Termômetros de Capacidade + 2 Velocímetros de Atraso */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 py-1 items-center justify-items-center">
                      {/* Termômetro 1: CAPACIDADE ABA */}
                      {(() => {
                        const cap = capacidadeAbaM3 > 0 ? capacidadeAbaM3 : 440
                        const atual = opRows[0]?.consolidado.vol || 0
                        const pct = Math.min(100, Math.max(0, (atual / (cap * 1.3)) * 100))
                        return (
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#071f28]/60 border border-teal-500/20 w-full min-h-[145px]">
                            <span className="text-[8.5px] font-black text-amber-300 tracking-wider text-center uppercase mb-1">
                              CAPACIDADE ABA M³
                            </span>
                            <div className="flex items-center justify-center gap-2">
                              {/* Tubo do Termômetro */}
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col justify-between h-[68px] text-[6.5px] font-mono text-teal-300/70 py-0.5">
                                  <span>600</span>
                                  <span>400</span>
                                  <span>200</span>
                                  <span>0</span>
                                </div>
                                <div className="relative w-4 h-[70px] bg-slate-900/80 rounded-full border border-teal-400/50 p-0.5 flex flex-col justify-end overflow-hidden shadow-inner">
                                  <div
                                    className="w-full bg-linear-to-t from-emerald-500 to-green-300 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[17px] font-black text-white font-mono drop-shadow-sm">
                                {cap}m³
                              </span>
                            </div>
                            {/* Bulbo com valor atual */}
                            <div className="mt-1.5 px-2 py-0.5 rounded-full bg-teal-950 border border-teal-400/40 text-[9px] font-mono font-bold text-teal-200">
                              {atual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Termômetro 2: CAPACIDADE VENDA */}
                      {(() => {
                        const cap = capacidadeVendaM3 > 0 ? capacidadeVendaM3 : 400
                        const atual = opRows[1]?.consolidado.vol || 0
                        const pct = Math.min(100, Math.max(0, (atual / (cap * 1.5)) * 100))
                        return (
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#071f28]/60 border border-teal-500/20 w-full min-h-[145px]">
                            <span className="text-[8.5px] font-black text-amber-300 tracking-wider text-center uppercase mb-1">
                              CAPACIDADE VENDA M³
                            </span>
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col justify-between h-[68px] text-[6.5px] font-mono text-teal-300/70 py-0.5">
                                  <span>800</span>
                                  <span>500</span>
                                  <span>200</span>
                                  <span>0</span>
                                </div>
                                <div className="relative w-4 h-[70px] bg-slate-900/80 rounded-full border border-teal-400/50 p-0.5 flex flex-col justify-end overflow-hidden shadow-inner">
                                  <div
                                    className="w-full bg-linear-to-t from-emerald-500 to-green-300 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[17px] font-black text-white font-mono drop-shadow-sm">
                                {cap}m³
                              </span>
                            </div>
                            <div className="mt-1.5 px-2 py-0.5 rounded-full bg-teal-950 border border-teal-400/40 text-[9px] font-mono font-bold text-teal-200">
                              {atual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Termômetro 3: CAPACIDADE COURRIER PEDIDOS */}
                      {(() => {
                        const cap = capacidadeCourrierPed > 0 ? capacidadeCourrierPed : 600
                        const atual = opRows[2]?.consolidado.pedidos || 0
                        const pct = Math.min(100, Math.max(0, (atual / (cap * 1.5)) * 100))
                        return (
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#071f28]/60 border border-teal-500/20 w-full min-h-[145px]">
                            <span className="text-[8px] font-black text-amber-300 tracking-wider text-center uppercase mb-1">
                              CAPACIDADE COURRIER PEDIDOS
                            </span>
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col justify-between h-[68px] text-[6.5px] font-mono text-teal-300/70 py-0.5">
                                  <span>1000</span>
                                  <span>600</span>
                                  <span>300</span>
                                  <span>0</span>
                                </div>
                                <div className="relative w-4 h-[70px] bg-slate-900/80 rounded-full border border-teal-400/50 p-0.5 flex flex-col justify-end overflow-hidden shadow-inner">
                                  <div
                                    className="w-full bg-linear-to-t from-emerald-500 to-green-300 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[17px] font-black text-white font-mono drop-shadow-sm">
                                {cap}P
                              </span>
                            </div>
                            <div className="mt-1.5 px-2 py-0.5 rounded-full bg-teal-950 border border-teal-400/40 text-[9px] font-mono font-bold text-teal-200">
                              {atual}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Velocímetro 1: Atraso fat venda */}
                      {(() => {
                        const atrasos = opAtrasoVendaPedidosSet.size
                        // Ângulo do ponteiro: 0 -> 180° (verde/esquerda), 1-5 -> 270° (amarelo/centro), >5 -> 350° (vermelho/direita)
                        const angle = atrasos === 0 ? 195 : atrasos <= 5 ? 270 : 345
                        const rad = (angle * Math.PI) / 180
                        const x2 = 50 + 28 * Math.cos(rad)
                        const y2 = 50 + 28 * Math.sin(rad)
                        return (
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#071f28]/60 border border-teal-500/20 w-full min-h-[145px]">
                            <svg viewBox="0 0 100 65" className="w-24 h-16 overflow-visible">
                              {/* Fundo do velocímetro */}
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                              {/* Faixa Verde: Bom */}
                              <path d="M 12 50 A 38 38 0 0 1 32 23" fill="none" stroke="#22c55e" strokeWidth="16" />
                              {/* Faixa Amarela: Regular */}
                              <path d="M 32 23 A 38 38 0 0 1 68 23" fill="none" stroke="#f59e0b" strokeWidth="16" />
                              {/* Faixa Vermelha: Ruim */}
                              <path d="M 68 23 A 38 38 0 0 1 88 50" fill="none" stroke="#ef4444" strokeWidth="16" />
                              {/* Textos no arco */}
                              <text x="21" y="38" fontSize="4.5" fill="#ffffff" fontWeight="bold">Bom</text>
                              <text x="44" y="24" fontSize="4.5" fill="#ffffff" fontWeight="bold">Regular</text>
                              <text x="71" y="38" fontSize="4.5" fill="#ffffff" fontWeight="bold">Ruim</text>
                              {/* Ponteiro */}
                              <line x1="50" y1="50" x2={x2} y2={y2} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                              <circle cx="50" cy="50" r="4.5" fill="#0f172a" />
                              {/* Valor */}
                              <text x="50" y="47" fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="monospace">
                                {atrasos}
                              </text>
                            </svg>
                            <span className="text-[8.5px] italic text-slate-200 mt-1 text-center">
                              Atraso fat venda
                            </span>
                          </div>
                        )
                      })()}

                      {/* Velocímetro 2: Atraso fat ABA (peças) */}
                      {(() => {
                        const atrasos = opAtrasoAbaPecas
                        // Ângulo do ponteiro: 0 -> 195° (verde), 1-100 -> 270° (amarelo), >100 -> 345° (vermelho)
                        const angle = atrasos === 0 ? 195 : atrasos <= 100 ? 270 : 345
                        const rad = (angle * Math.PI) / 180
                        const x2 = 50 + 28 * Math.cos(rad)
                        const y2 = 50 + 28 * Math.sin(rad)
                        return (
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#071f28]/60 border border-teal-500/20 w-full min-h-[145px]">
                            <svg viewBox="0 0 100 65" className="w-24 h-16 overflow-visible">
                              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                              <path d="M 12 50 A 38 38 0 0 1 32 23" fill="none" stroke="#22c55e" strokeWidth="16" />
                              <path d="M 32 23 A 38 38 0 0 1 68 23" fill="none" stroke="#f59e0b" strokeWidth="16" />
                              <path d="M 68 23 A 38 38 0 0 1 88 50" fill="none" stroke="#ef4444" strokeWidth="16" />
                              <text x="21" y="38" fontSize="4.5" fill="#ffffff" fontWeight="bold">Bom</text>
                              <text x="44" y="24" fontSize="4.5" fill="#ffffff" fontWeight="bold">Regular</text>
                              <text x="71" y="38" fontSize="4.5" fill="#ffffff" fontWeight="bold">Ruim</text>
                              <line x1="50" y1="50" x2={x2} y2={y2} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                              <circle cx="50" cy="50" r="4.5" fill="#0f172a" />
                              <text x="50" y="47" fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="monospace">
                                {atrasos}
                              </text>
                            </svg>
                            <span className="text-[8.5px] italic text-slate-200 mt-1 text-center">
                              Atraso fat ABA (peças)
                            </span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Linha Central: Tabela Operacional Completa Conforme Layout Original */}
                    <div className="w-full select-text pt-2">
                      <div className="bg-[#071f28] p-3 rounded-2xl border border-teal-500/30 shadow-2xl flex items-stretch gap-2 w-full">
                        {/* 1. Colunas de Dias / Giro (Extremo Esquerdo) */}
                        <div className="flex gap-1 items-stretch shrink-0">
                          {/* Coluna Dias Geral */}
                          <div className="flex flex-col items-center justify-between space-y-1">
                            <span className="text-[8px] font-black tracking-tighter text-teal-200/90 whitespace-nowrap h-4 flex items-center">
                              Dias Geral
                            </span>
                            {opRows.map(r => (
                              <div
                                key={r.categoria}
                                className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-200 to-slate-300 text-slate-800 text-[9px] sm:text-[9.5px] font-mono font-black rounded flex items-center justify-center border border-slate-400 shadow-2xs"
                              >
                                {r.dias.geral.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </div>
                            ))}
                            {/* Total Dias Geral */}
                            <div className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-400 to-slate-500 text-slate-950 text-[10px] sm:text-[10.5px] font-mono font-black rounded flex items-center justify-center border border-slate-600 shadow-sm mt-0.5">
                              {opTotalDiasGeral.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>

                          {/* Coluna Carteira */}
                          <div className="flex flex-col items-center justify-between space-y-1">
                            <span className="text-[8px] font-black tracking-tighter text-teal-200/90 whitespace-nowrap h-4 flex items-center">
                              Carteira
                            </span>
                            {opRows.map(r => (
                              <div
                                key={r.categoria}
                                className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-200 to-slate-300 text-slate-800 text-[9px] sm:text-[9.5px] font-mono font-black rounded flex items-center justify-center border border-slate-400 shadow-2xs"
                              >
                                {r.dias.carteira.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </div>
                            ))}
                            {/* Total Dias Carteira */}
                            <div className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-400 to-slate-500 text-slate-950 text-[10px] sm:text-[10.5px] font-mono font-black rounded flex items-center justify-center border border-slate-600 shadow-sm mt-0.5">
                              {opTotalDiasCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>

                          {/* Coluna Processo */}
                          <div className="flex flex-col items-center justify-between space-y-1">
                            <span className="text-[8px] font-black tracking-tighter text-teal-200/90 whitespace-nowrap h-4 flex items-center">
                              Processo
                            </span>
                            {opRows.map(r => (
                              <div
                                key={r.categoria}
                                className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-200 to-slate-300 text-slate-800 text-[9px] sm:text-[9.5px] font-mono font-black rounded flex items-center justify-center border border-slate-400 shadow-2xs"
                              >
                                {r.dias.processo.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </div>
                            ))}
                            {/* Total Dias Processo */}
                            <div className="w-8 sm:w-9 h-7 bg-linear-to-b from-slate-400 to-slate-500 text-slate-950 text-[10px] sm:text-[10.5px] font-mono font-black rounded flex items-center justify-center border border-slate-600 shadow-sm mt-0.5">
                              {opTotalDiasProcesso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>
                        </div>

                        {/* 2. Bloco EM CARTEIRA */}
                        <div className="flex-1 min-w-0 flex flex-col space-y-1">
                          <span className="text-[8.5px] font-black tracking-wider text-sky-200 uppercase text-center h-4 flex items-center justify-center">
                            EM CARTEIRA
                          </span>
                          {/* Cabeçalho da Tabela Carteira */}
                          <div className="grid grid-cols-4 gap-1 text-[8px] font-black uppercase text-center w-full">
                            <div className="py-1 rounded bg-[#124e78] text-sky-100 flex items-center justify-center truncate px-0.5">
                              EM CARTEIRA
                            </div>
                            <div className="py-1 rounded bg-[#124e78] text-sky-100 flex items-center justify-center truncate px-0.5">
                              PEDIDO
                            </div>
                            <div className="py-1 rounded bg-[#124e78] text-sky-100 flex items-center justify-center truncate px-0.5">
                              PEÇAS
                            </div>
                            <div className="py-1 rounded bg-[#124e78] text-sky-100 flex items-center justify-center truncate px-0.5">
                              Vol M³
                            </div>
                          </div>
                          {/* Linhas */}
                          {opRows.map(r => (
                            <div key={r.categoria} className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center w-full">
                              <div className="h-7 rounded bg-slate-300 text-slate-900 font-sans font-extrabold flex items-center justify-center uppercase text-[8px] sm:text-[8.5px] truncate px-0.5">
                                {r.categoria}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.carteira.pedidos}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.carteira.pecas}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.carteira.vol.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </div>
                            </div>
                          ))}
                          {/* Linha Total Geral Carteira */}
                          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-black text-center mt-0.5 w-full">
                            <div className="h-7 rounded bg-[#0284c7] text-white font-sans uppercase text-[8px] sm:text-[8.5px] flex items-center justify-center shadow-xs truncate px-0.5">
                              Total geral
                            </div>
                            <div className="h-7 rounded bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
                              {opCartPedsTotal.size}
                            </div>
                            <div className="h-7 rounded bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
                              {opTotalCartPecas}
                            </div>
                            <div className="h-7 rounded bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
                              {opTotalCartVol.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>
                          {/* Rodapé Faturamento & % Carteira */}
                          <div className="flex gap-1 pt-1 w-full">
                            <div className="flex-1 py-1 px-1 rounded-lg bg-[#0369a1] text-white text-[8.5px] sm:text-[9.5px] font-mono font-black text-center shadow-xs truncate">
                              R$ {opTotalCartValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="w-10 sm:w-12 py-1 rounded-lg bg-[#0284c7] text-white text-[8.5px] sm:text-[9.5px] font-mono font-black text-center shadow-xs shrink-0">
                              {Math.round(opPctCarteira)}%
                            </div>
                          </div>
                        </div>

                        {/* 3. Bloco EM PROCESSO */}
                        <div className="flex-1 min-w-0 flex flex-col space-y-1">
                          <span className="text-[8.5px] font-black tracking-wider text-emerald-300 uppercase text-center h-4 flex items-center justify-center">
                            EM PROCESSO
                          </span>
                          {/* Cabeçalho Processo */}
                          <div className="grid grid-cols-4 gap-1 text-[8px] font-black uppercase text-center w-full">
                            <div className="py-1 rounded bg-[#0f766e] text-emerald-100 flex items-center justify-center truncate px-0.5">
                              EM PROCESSO
                            </div>
                            <div className="py-1 rounded bg-[#0f766e] text-emerald-100 flex items-center justify-center truncate px-0.5">
                              PEDIDO
                            </div>
                            <div className="py-1 rounded bg-[#0f766e] text-emerald-100 flex items-center justify-center truncate px-0.5">
                              PEÇAS
                            </div>
                            <div className="py-1 rounded bg-[#0f766e] text-emerald-100 flex items-center justify-center truncate px-0.5">
                              Vol M³
                            </div>
                          </div>
                          {/* Linhas */}
                          {opRows.map(r => (
                            <div key={r.categoria} className="grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center w-full">
                              <div className="h-7 rounded bg-slate-300 text-slate-900 font-sans font-extrabold flex items-center justify-center uppercase text-[8px] sm:text-[8.5px] truncate px-0.5">
                                {r.categoria}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.processo.pedidos}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.processo.pecas}
                              </div>
                              <div className="h-7 rounded bg-[#e85d04] text-white flex items-center justify-center shadow-2xs">
                                {r.processo.vol.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </div>
                            </div>
                          ))}
                          {/* Linha Total Geral Processo */}
                          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-black text-center mt-0.5 w-full">
                            <div className="h-7 rounded bg-[#059669] text-white font-sans uppercase text-[8.5px] flex items-center justify-center shadow-xs truncate px-0.5">
                              Total geral
                            </div>
                            <div className="h-7 rounded bg-[#059669] text-white flex items-center justify-center shadow-xs">
                              {opProcPedsTotal.size}
                            </div>
                            <div className="h-7 rounded bg-[#059669] text-white flex items-center justify-center shadow-xs">
                              {opTotalProcPecas}
                            </div>
                            <div className="h-7 rounded bg-[#059669] text-white flex items-center justify-center shadow-xs">
                              {opTotalProcVol.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </div>
                          </div>
                          {/* Rodapé Faturamento & % Processo */}
                          <div className="flex gap-1 pt-1 w-full">
                            <div className="flex-1 py-1 px-1 rounded-lg bg-[#047857] text-white text-[8.5px] sm:text-[9.5px] font-mono font-black text-center shadow-xs truncate">
                              R$ {opTotalProcValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="w-10 sm:w-12 py-1 rounded-lg bg-[#059669] text-white text-[8.5px] sm:text-[9.5px] font-mono font-black text-center shadow-xs shrink-0">
                              {Math.round(opPctProcesso)}%
                            </div>
                          </div>
                        </div>

                        {/* 4. Bloco EM CARTEIRA + EM PROCESSO (CONSOLIDADO) */}
                        <div className="flex-1 min-w-0 flex flex-col space-y-1">
                          <span className="text-[8.5px] font-black tracking-wider text-teal-200 uppercase text-center h-4 flex items-center justify-center">
                            EM CARTEIRA + EM PROCESSO
                          </span>
                          {/* Cabeçalho Consolidado */}
                          <div className="grid grid-cols-3 gap-1 text-[8px] font-black uppercase text-center w-full">
                            <div className="py-1 rounded bg-[#093c4c] text-teal-100 flex items-center justify-center truncate px-0.5">
                              Pedidos
                            </div>
                            <div className="py-1 rounded bg-[#093c4c] text-teal-100 flex items-center justify-center truncate px-0.5">
                              Peças
                            </div>
                            <div className="py-1 rounded bg-[#093c4c] text-teal-100 flex items-center justify-center truncate px-0.5">
                              Cubagem
                            </div>
                          </div>
                          {/* Linhas */}
                          {opRows.map(r => (
                            <div key={r.categoria} className="grid grid-cols-3 gap-1 text-[9px] font-mono font-bold text-center w-full">
                              <div className="h-7 rounded bg-[#0c4a5c] text-white flex items-center justify-center shadow-2xs">
                                {r.consolidado.pedidos}
                              </div>
                              <div className="h-7 rounded bg-[#0c4a5c] text-white flex items-center justify-center shadow-2xs">
                                {r.consolidado.pecas}
                              </div>
                              <div className="h-7 rounded bg-[#0c4a5c] text-white flex items-center justify-center shadow-2xs font-black">
                                {Math.round(r.consolidado.vol)} m³
                              </div>
                            </div>
                          ))}
                          {/* Linha Total Geral Consolidado */}
                          <div className="grid grid-cols-3 gap-1 text-[9px] font-mono font-black text-center mt-0.5 w-full">
                            <div className="h-7 rounded bg-[#063340] text-teal-200 flex items-center justify-center shadow-xs">
                              {opConsPedsTotal.size}
                            </div>
                            <div className="h-7 rounded bg-[#063340] text-teal-200 flex items-center justify-center shadow-xs">
                              {opTotalConsPecas}
                            </div>
                            <div className="h-7 rounded bg-[#063340] text-white flex items-center justify-center shadow-xs">
                              {Math.round(opTotalConsVol)} m³
                            </div>
                          </div>
                          {/* Rodapé Faturamento Geral, Meta & Atingimento */}
                          <div className="flex items-center gap-1 pt-1 flex-wrap w-full">
                            <div className="flex-1 py-1 px-1 rounded-lg bg-[#063340] text-white text-[8.5px] sm:text-[9.5px] font-mono font-black shadow-xs whitespace-nowrap text-center truncate">
                              R$ {opTotalConsValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="py-1 px-1 rounded-lg bg-[#b45309] text-amber-100 text-[8px] sm:text-[9px] font-mono font-black shadow-xs whitespace-nowrap">
                              R$ {opSaldoMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Math.round(opPctMeta)}%)
                            </div>
                            <div
                              onClick={handleOpenConfigOperacional}
                              className="py-1 px-1 rounded-lg bg-[#831843] hover:bg-[#9d174d] text-rose-100 text-[8px] sm:text-[8.5px] font-mono font-black cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                              title="Clique para editar a Meta"
                            >
                              META R$ {metaFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {/* 5. Bloco de CAPACIDADE & VOLUME EXTRA */}
                        <div className="w-20 sm:w-22 shrink-0 flex flex-col space-y-1">
                          <span className="text-[8.5px] font-black tracking-wider text-rose-300 uppercase text-center h-4 flex items-center justify-center">
                            CAPACIDADE
                          </span>
                          <div className="w-full py-1 rounded bg-[#701a28] text-rose-100 text-[7.5px] sm:text-[8px] font-black uppercase text-center truncate px-0.5">
                            CAP {opCapacidadeSoma}M³
                          </div>
                          {/* Capacidades Individuais */}
                          <div className="w-full h-7 rounded bg-[#831843] text-rose-100 text-[8.5px] sm:text-[9px] font-mono font-black flex items-center justify-center shadow-2xs">
                            {capacidadeAbaM3} M³
                          </div>
                          <div className="w-full h-7 rounded bg-[#831843] text-rose-100 text-[8.5px] sm:text-[9px] font-mono font-black flex items-center justify-center shadow-2xs">
                            {capacidadeVendaM3} M³
                          </div>
                          <div className="w-full h-7 rounded bg-[#831843] text-rose-100 text-[8.5px] sm:text-[9px] font-mono font-black flex items-center justify-center shadow-2xs">
                            {capacidadeCourrierPed} P
                          </div>
                          <div className="w-full h-7 rounded bg-[#831843] text-rose-100 text-[9px] font-mono font-bold flex items-center justify-center shadow-2xs">
                            -
                          </div>
                          {/* Volume Extra */}
                          <div className="w-full py-1 px-1 rounded bg-[#854d0e] text-amber-200 text-center flex flex-col justify-center shadow-xs mt-0.5">
                            <span className="text-[7px] font-black tracking-tight text-amber-300 uppercase">Vol. Extra</span>
                            <span className="text-[9.5px] sm:text-[10px] font-mono font-black text-white">
                              {Math.round(opVolumeExtra)}M³
                            </span>
                          </div>
                        </div>

                        {/* 6. Extremo Direito: RODO DIAS, COURRIER DIAS & ASSINATURA MAGALU */}
                        <div className="flex flex-col justify-between items-center pl-1 border-l border-teal-500/20 shrink-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {/* Card RODO */}
                            <div className="flex flex-col items-center">
                              <div className="px-2 py-0.5 rounded bg-[#0284c7] text-white text-[7.5px] font-black uppercase tracking-tight text-center">
                                RODO<br />DIAS EM CARTEIRA
                              </div>
                              <div className="mt-1 w-10 h-7 rounded bg-[#0284c7] text-white text-[11px] font-mono font-black flex items-center justify-center shadow-xs">
                                {opRows[1]?.dias.geral.toFixed(1)}
                              </div>
                              <div className="mt-1 w-10 h-5 rounded bg-slate-300 text-slate-900 text-[9.5px] font-mono font-black flex items-center justify-center">
                                {opRows[1]?.dias.carteira.toFixed(1)}
                              </div>
                            </div>

                            <span className="text-white text-base font-black">+</span>

                            {/* Card COURRIER */}
                            <div className="flex flex-col items-center">
                              <div className="px-2 py-0.5 rounded bg-[#0f766e] text-white text-[7.5px] font-black uppercase tracking-tight text-center">
                                COURRIER (RDP)<br />DIAS EM CARTEIRA
                              </div>
                              <div className="mt-1 w-10 h-7 rounded bg-[#0f766e] text-white text-[11px] font-mono font-black flex items-center justify-center shadow-xs">
                                {opRows[2]?.dias.geral.toFixed(1)}
                              </div>
                              <div className="mt-1 w-10 h-5 rounded bg-slate-300 text-slate-900 text-[9.5px] font-mono font-black flex items-center justify-center">
                                {opRows[2]?.dias.carteira.toFixed(1)}
                              </div>
                            </div>
                          </div>

                          {/* Estrela de 4 pontas e Marca Magalu */}
                          <div className="flex flex-col items-center justify-center pt-1 space-y-0.5">
                            <svg viewBox="0 0 40 40" className="w-8 h-8 fill-slate-300 drop-shadow-sm">
                              <polygon points="20,2 24,16 38,20 24,24 20,38 16,24 2,20 16,16" />
                            </svg>
                            <span className="text-[7px] text-slate-300 italic tracking-tight font-sans whitespace-nowrap">
                              Johansson Martins de Meneses Gomes
                            </span>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black tracking-tighter lowercase text-sky-400 font-sans leading-none">
                                magalu
                              </span>
                              <div className="w-14 h-0.5 bg-linear-to-r from-blue-500 via-green-400 via-yellow-400 to-red-500 rounded-full mt-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal de Configuração de Metas e Capacidades */}
                    {showConfigOperacional && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="bg-[#0b2834] border border-teal-500/40 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4 text-white">
                          <div className="flex items-center justify-between border-b border-teal-500/30 pb-2">
                            <div className="flex items-center gap-2">
                              <Settings2 size={16} className="text-teal-300" />
                              <h3 className="text-sm font-black uppercase text-teal-100">
                                Parâmetros Operacionais
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowConfigOperacional(false)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-bold text-teal-200 mb-1">
                                Meta de Faturamento (R$)
                              </label>
                              <input
                                type="number"
                                value={tempMetaFaturamento}
                                onChange={e => setTempMetaFaturamento(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#071f28] border border-teal-500/40 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-teal-200 mb-1">
                                Capacidade ABA (M³)
                              </label>
                              <input
                                type="number"
                                value={tempCapAba}
                                onChange={e => setTempCapAba(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#071f28] border border-teal-500/40 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-teal-200 mb-1">
                                Capacidade Venda (M³)
                              </label>
                              <input
                                type="number"
                                value={tempCapVenda}
                                onChange={e => setTempCapVenda(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#071f28] border border-teal-500/40 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-teal-200 mb-1">
                                Capacidade Courrier (Pedidos)
                              </label>
                              <input
                                type="number"
                                value={tempCapCourrier}
                                onChange={e => setTempCapCourrier(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#071f28] border border-teal-500/40 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-400"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-500/30">
                            <button
                              type="button"
                              onClick={() => setShowConfigOperacional(false)}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveConfigOperacional}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                            >
                              Salvar Parâmetros
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* ABA 2: PROGRAMAÇÃO (EM CONSTRUÇÃO)                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'programacao' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-2xs flex flex-col items-center justify-center text-center space-y-6 min-h-[460px]">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-50 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <Hammer size={38} className="animate-bounce" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-blue-600 text-white shadow-xs">
              <Sparkles size={13} />
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase tracking-wider">
              Aba: {currentTabInfo.label}
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Módulo em Desenvolvimento
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {currentTabInfo.subtitle}. Esta área consumirá diretamente a tabela da base de dados e os parâmetros configurados na aba <strong>Cadastros Auxiliares</strong>.
            </p>
          </div>

          {/* Cards de Prévia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Database size={14} className="text-blue-600" />
                <span>Base Vinculada</span>
              </div>
              <p className="text-[11px] text-slate-500">Planilha PCP J'S MARTINS.xlsx estruturada e pronta para alimentar o cálculo.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Layers size={14} className="text-purple-600" />
                <span>Planejamento Dinâmico</span>
              </div>
              <p className="text-[11px] text-slate-500">Agrupamento por Modalidade, status de operação, cubagem de saída e linha.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <CalendarDays size={14} className="text-emerald-600" />
                <span>Programação Diária</span>
              </div>
              <p className="text-[11px] text-slate-500">Sequenciamento de pedidos e distribuição por docas e rotas.</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL DE SINCRONIZAÇÃO DIRETA COM ORACLE MLPDW                     */}
      {/* ------------------------------------------------------------------ */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#002f5c] to-[#0a4a82] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Database size={18} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Sincronização da Carteira</h3>
                  <p className="text-[11px] text-blue-200">Oracle MLPDW ➔ Supabase (pcp_js_martins)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSyncingOracle) setIsSyncModalOpen(false)
                }}
                disabled={isSyncingOracle}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-4">
              {/* Barra de Progresso */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Progresso</span>
                  <span className="text-blue-600 font-bold">{syncStatus.progress || (isSyncingOracle ? 15 : 0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${syncStatus.status === 'error'
                      ? 'bg-rose-500'
                      : syncStatus.status === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse'
                      }`}
                    style={{ width: `${Math.max(5, syncStatus.progress || (isSyncingOracle ? 15 : 0))}%` }}
                  />
                </div>
              </div>

              {/* Mensagem de Status */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${syncStatus.status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : syncStatus.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  {syncStatus.status === 'error' ? (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  ) : syncStatus.status === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw size={18} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">
                      {syncStatus.status === 'error'
                        ? 'Status da Conexão'
                        : syncStatus.status === 'success'
                          ? 'Sincronização Concluída'
                          : 'Executando Sincronização'}
                    </p>
                    <p className="text-[11.5px] opacity-90 break-words whitespace-pre-line">
                      {syncStatus.message || (isSyncingOracle ? 'Aguardando resposta do Oracle...' : 'Pronto para atualizar.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerta de Orientação quando der erro de VPN ou aguardando servidor */}
              {(syncStatus.status === 'error' || syncStatus.status === 'requested') && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle size={13} /> Dica de Conexão no Servidor da Empresa:
                  </p>
                  <p>
                    1. Certifique-se de que o arquivo <strong><code>atualizar_carteira_servidor.bat</code></strong> (ou <code>sincronizador_servidor.py</code>) está aberto no servidor corporativo (ele fica ouvindo os cliques do site em segundo plano).
                  </p>
                  <p>
                    2. Você também pode dar 2 cliques diretamente no <code>atualizar_carteira_servidor.bat</code> na Área de Trabalho do servidor a qualquer momento.
                  </p>
                </div>
              )}

              {/* Etapas do Processo */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Etapas da Consulta:</div>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 10 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">1</span>
                    <span>Conexão VPN & Oracle MLPDW (DSN MLPDW)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 30 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">2</span>
                    <span>Execução da Query da Carteira (53 colunas)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 60 ? 'text-blue-800 font-bold bg-white' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">3</span>
                    <span>Gravação em Lote no Supabase (pcp_js_martins)</span>
                  </div>
                  <div className={`flex items-center gap-2 p-1.5 rounded-lg ${syncStatus.progress && syncStatus.progress >= 100 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'
                    }`}>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold bg-slate-100">4</span>
                    <span>Atualização Instantânea da Página</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              {isSyncingOracle ? (
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 cursor-pointer"
                >
                  Minimizar (continua em segundo plano)
                </button>
              ) : syncStatus.status === 'error' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncOracleCarteira}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
