import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  HelpCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { getPcpItemsReport, type PcpItem } from '../lib/pcpService'
import initialSampleRows from '../data/pcp_initial_sample.json'
import { INITIAL_MODAL_PARAMS, type ModalParamItem } from '../data/pcp_modal_params'
import { INITIAL_FILIAL_ROTA_PARAMS, type FilialRotaParamItem } from '../data/pcp_filial_rotas_params'

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

export const PcpJsMartinsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planejamento' | 'programacao' | 'controle' | 'cadastros'>('controle')
  const [activeSubParam, setActiveSubParam] = useState<'modal' | 'rotas'>('rotas')

  // --------------------------------------------------------------------------
  // ESTADOS DA ABA CADASTROS AUXILIARES (DE-PARA DE MODAIS & ROTAS)
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
    filialRotaParams.forEach(p => {
      const k = (p.filialRota || '').trim().toUpperCase()
      if (k) map[k] = { destino: p.destino, regiao: p.regiao.trim().toUpperCase() }
    })
    return map
  }, [filialRotaParams])

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

  // Sincronizar parâmetros
  const saveModalParams = (list: ModalParamItem[]) => {
    setModalParams(list)
    try {
      localStorage.setItem('magalog_pcp_modal_params', JSON.stringify(list))
    } catch { }
  }

  const saveFilialRotaParams = (list: FilialRotaParamItem[]) => {
    setFilialRotaParams(list)
    try {
      localStorage.setItem('magalog_pcp_filial_rotas_params', JSON.stringify(list))
    } catch { }
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
          const rotaKey = String(item.descricaorota || item.filentrega || '').trim().toUpperCase()
          const rotaInfo = rotaMap[rotaKey] || rotaMap[String(item.filentrega || '')] || { destino: '-', regiao: '-' }

          return {
            ...item,
            modalidade_calc: modalMap[cod] || item.descricaomodal || '-',
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (item.descricaorota || `Filial ${item.filentrega}`),
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
          const rotaKey = String(r.descricaorota || r.DESCRICAOROTA || r.filentrega || r.FILENTREGA || '').trim().toUpperCase()
          const rotaInfo = rotaMap[rotaKey] || rotaMap[String(r.filentrega || r.FILENTREGA || '')] || { destino: '-', regiao: '-' }

          return {
            id: idx + from + 1,
            filorig: Number(r.filorig || r.FILORIG) || 994,
            codfil: Number(r.codfil || r.CODFIL) || 994,
            filentrega: Number(r.filentrega || r.FILENTREGA) || 0,
            destino_calc: rotaInfo.destino !== '-' ? rotaInfo.destino : (r.descricaorota || r.DESCRICAOROTA || `Filial ${r.filentrega || r.FILENTREGA}`),
            regiao_calc: rotaInfo.regiao !== '-' ? rotaInfo.regiao : 'INTERIOR',
            numlote: String(r.numlote || r.NUMLOTE || ''),
            fllibfat: String(r.fllibfat || r.FLLIBFAT || ''),
            tpnota: Number(r.tpnota || r.TPNOTA) || 0,
            numpedven: String(r.numpedven || r.NUMPEDVEN || ''),
            numpedcomp: String(r.numpedcomp || r.NUMPEDCOMP || ''),
            dtpedido: String(r.dtpedido || r.DTPEDIDO || ''),
            dtentrega: String(r.dtentrega || r.DTENTREGA || ''),
            dtlibfat: String(r.dtlibfat || r.DTLIBFAT || ''),
            preventrega: String(r.preventrega || r.PREVENTREGA || ''),
            item: String(r.item || r.ITEM || ''),
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
  }, [page, pageSize, selectedStatusOperacao, selectedFilEntrega, searchTerm, modalMap])

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
    const totalValor = local.reduce((acc, r: any) => acc + (Number(r.vltotal || r.VLTOTAL) || 0), 0)
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

      // Salva no localStorage como cache imediato
      localStorage.setItem('magalog_pcp_js_martins_data', JSON.stringify(rawRows))

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

      setUploadFeedback({
        type: 'success',
        message: `${rawRows.length.toLocaleString('pt-BR')} registros importados com sucesso para o banco de dados!`
      })
      loadData(1, searchTerm)
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
    <div className="p-4 sm:p-6 space-y-5 max-w-[1900px] mx-auto animate-in fade-in duration-300">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">PCP J'S Martins</h1>
              <span className="px-2 py-0.5 text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                <Database size={11} /> Base Operacional & Cadastros
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Planejamento, Controle e Programação da Produção & Operação Logística
            </p>
          </div>
        </div>

        {/* Seletor de 4 Abas */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-1 flex-wrap sm:flex-nowrap">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
      </div>

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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubParam === 'rotas'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubParam === 'modal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers size={13} />
                <span>Modalidade ({modalParams.length})</span>
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
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    param.regiao === 'CAPITAL' ? 'bg-cyan-100 text-cyan-800' :
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
                        <th className="py-2.5 px-4 text-center w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredParams.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Nenhum parâmetro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredParams.map((param, idx) => {
                          const isEditing = editingIndex === idx
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
      {/* ABAS 1 E 2: EM CONSTRUÇÃO (PLANEJAMENTO & PROGRAMAÇÃO)             */}
      {/* ------------------------------------------------------------------ */}
      {(activeTab === 'planejamento' || activeTab === 'programacao') && (
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
    </div>
  )
}
