import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  LayoutDashboard,
  FileSpreadsheet,
  Table as TableIcon,
  Store,
  Search,
  RefreshCw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Expand,
  Shrink,
  ArrowUpDown,
  Boxes,
  Check,
  X
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { getSupplyLojasReport, getSupplyFiltersMeta, type SupplyItem } from '../lib/supplyService'
import initialPivotData from '../data/supply_pivot_summary.json'

type EstoqueTipoMetric = 'FISICO' | 'LOGICO' | 'TRANSITO' | 'ESTOQUE'
type OrderByOption = 'LINHA_ASC' | 'ESTOQUE_DESC' | 'ESTOQUE_ASC' | 'LOJAS_DESC'
type RegionalOption = 'TODOS' | 'Thiago' | 'Outros Regionais'

// Mapeamento das 45 filiais por Regional
const REGIONAL_FILIAIS_MAP: Record<number, 'Thiago' | 'Outros Regionais'> = {
  // Regional Thiago (32 Lojas)
  710: 'Thiago', 727: 'Thiago', 734: 'Thiago', 740: 'Thiago', 742: 'Thiago',
  743: 'Thiago', 745: 'Thiago', 746: 'Thiago', 751: 'Thiago', 752: 'Thiago',
  755: 'Thiago', 757: 'Thiago', 761: 'Thiago', 765: 'Thiago', 778: 'Thiago',
  802: 'Thiago', 809: 'Thiago', 835: 'Thiago', 840: 'Thiago', 842: 'Thiago',
  846: 'Thiago', 847: 'Thiago', 872: 'Thiago', 873: 'Thiago', 1206: 'Thiago',
  1207: 'Thiago', 1217: 'Thiago', 1344: 'Thiago', 1345: 'Thiago', 1347: 'Thiago',
  1386: 'Thiago', 1411: 'Thiago',

  // Outros Regionais (13 Lojas)
  662: 'Outros Regionais', 736: 'Outros Regionais', 785: 'Outros Regionais',
  820: 'Outros Regionais', 857: 'Outros Regionais', 871: 'Outros Regionais',
  984: 'Outros Regionais', 1223: 'Outros Regionais', 1236: 'Outros Regionais',
  1341: 'Outros Regionais', 1349: 'Outros Regionais', 1363: 'Outros Regionais',
  1376: 'Outros Regionais'
}

const METRIC_INDEX: Record<EstoqueTipoMetric, number> = {
  FISICO: 0,
  LOGICO: 1,
  TRANSITO: 2,
  ESTOQUE: 3
}

export const SupplyLojasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'painel' | 'relatorio'>('painel')

  // -------------------------------------------------------------
  // ESTADOS DO PAINEL SUPPLY (TABELA DINÂMICA / PIVOT)
  // -------------------------------------------------------------
  const [pivotStatus, setPivotStatus] = useState<string>('LOJA SEM FISICO')
  const [selectedMetric, setSelectedMetric] = useState<EstoqueTipoMetric>('FISICO')
  const [selectedRegional, setSelectedRegional] = useState<RegionalOption>('TODOS')
  const [selectedFiliais, setSelectedFiliais] = useState<number[]>([]) // Filtro múltiplo de Lojas
  const [selectedLinhas, setSelectedLinhas] = useState<string[]>([])     // Filtro múltiplo de Linhas
  const [isLojasDropdownOpen, setIsLojasDropdownOpen] = useState(false)
  const [isLinhasDropdownOpen, setIsLinhasDropdownOpen] = useState(false)
  const lojasDropdownRef = useRef<HTMLDivElement>(null)
  const linhasDropdownRef = useRef<HTMLDivElement>(null)
  const [orderBy, setOrderBy] = useState<OrderByOption>('LINHA_ASC')
  const [pivotSearch, setPivotSearch] = useState<string>('')
  const [expandedLinhas, setExpandedLinhas] = useState<Record<string, boolean>>({
    'TB - TABLET': true
  })

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lojasDropdownRef.current && !lojasDropdownRef.current.contains(event.target as Node)) {
        setIsLojasDropdownOpen(false)
      }
      if (linhasDropdownRef.current && !linhasDropdownRef.current.contains(event.target as Node)) {
        setIsLinhasDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lista de todas as Linhas disponíveis na base para o filtro múltiplo
  const allLinhasAvailable = useMemo(() => {
    const currentStatusObj = (initialPivotData.summary as any)[pivotStatus] || {}
    return Object.keys(currentStatusObj).sort((a, b) => a.localeCompare(b))
  }, [pivotStatus])

  // Alternar seleção de filial no filtro múltiplo
  const toggleFilialSelection = (fil: number) => {
    setSelectedFiliais(prev =>
      prev.includes(fil) ? prev.filter(f => f !== fil) : [...prev, fil]
    )
  }

  // Alternar seleção de linha no filtro múltiplo
  const toggleLinhaSelection = (linha: string) => {
    setSelectedLinhas(prev =>
      prev.includes(linha) ? prev.filter(l => l !== linha) : [...prev, linha]
    )
  }

  // Alternar expansão de uma linha específica
  const toggleLinha = (linha: string) => {
    setExpandedLinhas(prev => ({
      ...prev,
      [linha]: !prev[linha]
    }))
  }

  // Expandir ou recolher todas as linhas
  const toggleAllLinhas = (expand: boolean) => {
    const currentStatusObj = (initialPivotData.summary as any)[pivotStatus] || {}
    const newExpanded: Record<string, boolean> = {}
    Object.keys(currentStatusObj).forEach(k => {
      newExpanded[k] = expand
    })
    setExpandedLinhas(newExpanded)
  }

  // Lista de filiais filtradas por Regional e Filtro Múltiplo de Lojas
  const filiaisList = useMemo(() => {
    let list = initialPivotData.filiais as number[]
    if (selectedRegional !== 'TODOS') {
      list = list.filter(f => REGIONAL_FILIAIS_MAP[f] === selectedRegional)
    }
    if (selectedFiliais.length > 0) {
      list = list.filter(f => selectedFiliais.includes(f))
    }
    return list
  }, [selectedRegional, selectedFiliais])

  const metricIdx = METRIC_INDEX[selectedMetric]

  // Rótulo da coluna do CD
  const cdColumnLabel = useMemo(() => {
    switch (selectedMetric) {
      case 'FISICO': return 'FISICO_994'
      case 'LOGICO': return 'LOGICO_994'
      case 'TRANSITO': return 'TRANSITO_994'
      case 'ESTOQUE': return 'ESTOQUE_994'
    }
  }, [selectedMetric])

  // Processamento e ordenação da matriz dinâmica
  const pivotLinhasData = useMemo(() => {
    const currentStatusObj = ((initialPivotData.summary as any)[pivotStatus] || {}) as Record<
      string,
      {
        t994: Record<string, number>
        fTot: Record<string, Record<string, number>>
        skus: Record<string, { c: string; d: string; n: string; m9: Record<string, number>; fil: Record<string, number[]> }>
      }
    >

    const query = pivotSearch.trim().toLowerCase()
    const result: Array<{
      linha: string
      totalCd994: number
      totalLojas: number
      filiaisTotais: Record<number, number>
      skusList: Array<{
        codProd: string
        codDf: string
        desc: string
        valCd994: number
        totalLojas: number
        filiaisVals: Record<number, number>
      }>
    }> = []

    Object.entries(currentStatusObj).forEach(([linha, lData]) => {
      // Se houver filtro múltiplo de Linha ativo, ignorar as outras linhas
      if (selectedLinhas.length > 0 && !selectedLinhas.includes(linha)) {
        return
      }

      const allSkusRaw = Object.values(lData.skus)

      const filteredRaw = query
        ? allSkusRaw.filter(s =>
          linha.toLowerCase().includes(query) ||
          s.c.toLowerCase().includes(query) ||
          s.n.toLowerCase().includes(query) ||
          s.d.toLowerCase().includes(query)
        )
        : allSkusRaw

      if (filteredRaw.length > 0) {
        let calculatedCd994 = 0
        let calculatedTotalLojas = 0
        const calculatedFiliaisTotais: Record<number, number> = {}
        filiaisList.forEach(f => { calculatedFiliaisTotais[f] = 0 })

        const formattedSkus = filteredRaw.map(s => {
          const valCd = s.m9[selectedMetric] || 0
          const filVals: Record<number, number> = {}
          let skuTotalLojas = 0

          filiaisList.forEach(f => {
            const arr = s.fil[f]
            const v = arr ? arr[metricIdx] || 0 : 0
            filVals[f] = v
            skuTotalLojas += v
            calculatedFiliaisTotais[f] += v
          })

          calculatedCd994 += valCd
          calculatedTotalLojas += skuTotalLojas

          return {
            codProd: s.c,
            codDf: s.d,
            desc: s.n,
            valCd994: valCd,
            totalLojas: skuTotalLojas,
            filiaisVals: filVals
          }
        })

        // Ordenar os SKUs dentro da linha se ordenado por estoque
        if (orderBy === 'ESTOQUE_DESC') {
          formattedSkus.sort((a, b) => b.valCd994 - a.valCd994)
        } else if (orderBy === 'ESTOQUE_ASC') {
          formattedSkus.sort((a, b) => a.valCd994 - b.valCd994)
        } else if (orderBy === 'LOJAS_DESC') {
          formattedSkus.sort((a, b) => b.totalLojas - a.totalLojas)
        }

        result.push({
          linha,
          totalCd994: calculatedCd994,
          totalLojas: calculatedTotalLojas,
          filiaisTotais: calculatedFiliaisTotais,
          skusList: formattedSkus
        })
      }
    })

    // Classificação das Linhas
    if (orderBy === 'ESTOQUE_DESC') {
      result.sort((a, b) => b.totalCd994 - a.totalCd994)
    } else if (orderBy === 'ESTOQUE_ASC') {
      result.sort((a, b) => a.totalCd994 - b.totalCd994)
    } else if (orderBy === 'LOJAS_DESC') {
      result.sort((a, b) => b.totalLojas - a.totalLojas)
    } else {
      result.sort((a, b) => a.linha.localeCompare(b.linha))
    }

    return result
  }, [pivotStatus, selectedMetric, orderBy, pivotSearch, filiaisList, metricIdx, selectedLinhas])

  // Total Geral da Matriz
  const pivotGrandTotals = useMemo(() => {
    let grandCd994 = 0
    let grandLojas = 0
    const grandFiliais: Record<number, number> = {}
    filiaisList.forEach(f => { grandFiliais[f] = 0 })

    pivotLinhasData.forEach(l => {
      grandCd994 += l.totalCd994
      grandLojas += l.totalLojas
      filiaisList.forEach(f => {
        grandFiliais[f] += (l.filiaisTotais[f] || 0)
      })
    })

    return { grandCd994, grandLojas, grandFiliais }
  }, [pivotLinhasData, filiaisList])

  // -------------------------------------------------------------
  // ESTADOS DA ABA RELATÓRIO SUPPLY
  // -------------------------------------------------------------
  const [items, setItems] = useState<SupplyItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Filtros Relatório
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')
  const [selectedFilial, setSelectedFilial] = useState<string>('TODOS')
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [filialOptions, setFilialOptions] = useState<number[]>([])

  // Estado de Upload de Nova Planilha Supply.xlsx
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Carregar filtros dinâmicos
  useEffect(() => {
    async function loadMeta() {
      const meta = await getSupplyFiltersMeta()
      if (meta.statusList.length > 0) setStatusOptions(meta.statusList)
      if (meta.filiaisList.length > 0) setFilialOptions(meta.filiaisList)
    }
    loadMeta()
  }, [])

  const loadData = useCallback(async (p: number = page, search: string = searchTerm) => {
    setIsLoading(true)
    try {
      const res = await getSupplyLojasReport({
        page: p,
        pageSize,
        filial: selectedFilial,
        statusEstoque: selectedStatus,
        search
      })
      setItems(res.data)
      setTotalCount(res.count)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedFilial, selectedStatus, searchTerm])

  useEffect(() => {
    if (activeTab === 'relatorio') {
      loadData(page, searchTerm)
    }
  }, [loadData, page, activeTab, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  // Upload e Sincronização direta de Supply.xlsx pelo navegador
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadFeedback(null)
      setUploadProgress('Lendo planilha...')

      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const sheetName = wb.SheetNames.includes('Base Supply') ? 'Base Supply' : wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const rows: any[] = XLSX.utils.sheet_to_json(ws)

      if (rows.length === 0) {
        throw new Error('A planilha selecionada está vazia.')
      }

      setUploadProgress(`Processando ${rows.length.toLocaleString('pt-BR')} linhas...`)

      const records: SupplyItem[] = rows.map((r: any) => ({
        codfil: Number(r.CODFIL) || 994,
        codigo_produto: String(r.CODIGO_PRODUTO ?? '').trim(),
        codproddf: String(r.CODPRODDF ?? '').trim(),
        descricao: String(r.DESCRICAO ?? '').trim(),

        fisico_994: Number(r.FISICO_994) || 0,
        tecnico_994: Number(r.TECNICO_994) || 0,
        resfis_994: Number(r.RESFIS_994) || 0,
        reslog_994: Number(r.RESLOG_994) || 0,
        logico_994: Number(r.LOGICO_994) || 0,
        transito_994: Number(r.TRANSITO_994) || 0,
        estoque_994: Number(r.ESTOQUE_994) || 0,

        filial: Number(r.FILIAL) || 0,
        fisico: Number(r.FISICO) || 0,
        tecnico: Number(r.TECNICO) || 0,
        resfis: Number(r.RESFIS) || 0,
        reslog: Number(r.RESLOG) || 0,
        logico: Number(r.LOGICO) || 0,
        transito: Number(r.TRANSITO) || 0,
        estoque_loja: Number(r.ESTOQUE_LOJA) || 0,

        cmup: Number(r.CMUP) || 0,
        valor_estoque_994: Number(r.VALOR_ESTOQUE_994) || 0,
        status_estoque: String(r.STATUS_ESTOQUE ?? '').trim(),
        desclinha: String(r.DESCLINHA ?? '').trim()
      }))

      setUploadProgress('Limpando base anterior no Supabase...')
      await supabase.from('supply_lojas').delete().neq('id', 0)

      const BATCH_SIZE = 1000
      let inserted = 0

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('supply_lojas').insert(batch)
        if (error) throw error
        inserted += batch.length
        setUploadProgress(`Inseridos ${inserted.toLocaleString('pt-BR')} de ${records.length.toLocaleString('pt-BR')}...`)
      }

      setUploadFeedback({
        type: 'success',
        message: `Planilha importada com sucesso! ${inserted.toLocaleString('pt-BR')} registros sincronizados no banco.`
      })
      setPage(1)
      loadData(1, searchTerm)
    } catch (err: any) {
      console.error('Erro no upload de Supply.xlsx:', err)
      setUploadFeedback({
        type: 'error',
        message: err.message || 'Erro ao processar e enviar a planilha para o banco.'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      if (e.target) e.target.value = ''
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Página com Troca de 3 Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Store size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Supply Lojas</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                Módulo Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestão logística e acompanhamento de abastecimento e suprimentos das lojas
            </p>
          </div>
        </div>

        {/* Seletor de Abas: Supply Dashboard | Painel Supply | Relatório Supply */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <LayoutDashboard size={14} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Supply Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('painel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'painel'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <TableIcon size={14} className={activeTab === 'painel' ? 'text-amber-600' : 'text-slate-400'} />
            <span>Painel Supply</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('relatorio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'relatorio'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileSpreadsheet size={14} className={activeTab === 'relatorio' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Relatório Supply</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE UPLOAD */}
      {uploadFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${uploadFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {uploadFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{uploadFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 1: SUPPLY DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-14 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm mb-4">
              <LayoutDashboard size={32} />
            </div>

            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
              Supply Dashboard
            </h2>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              Esta aba está reservada para os painéis executivos, gráficos de ruptura, KPIs por filial e distribuição de estoque que montaremos com base nos dados do Relatório Supply.
            </p>

            <div className="w-full grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
                  <Building2 size={13} className="text-blue-500" />
                  <span>Visão por Filial</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Indicadores de lojas sem físico, nível de atendimento e abastecimento.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Curvas &amp; Status</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Gráficos de dispersão por linha de produto (BR, EL, UD, etc.) e valores de estoque.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: PAINEL SUPPLY (MATRIZ DINÂMICA / PIVOT TABELA) */}
      {/* ======================================================== */}
      {activeTab === 'painel' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
          {/* Barra Superior: Filtro STATUS_ESTOQUE, Métricas, Ordenação, Busca e Expansão */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Esquerda: Filtro de Status + Tipo de Estoque (Métrica) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status do Estoque */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPivotStatus('LOJA SEM FISICO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${pivotStatus === 'LOJA SEM FISICO'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  LOJA SEM FISICO
                </button>
                <button
                  type="button"
                  onClick={() => setPivotStatus('LOJA COM FISICO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${pivotStatus === 'LOJA COM FISICO'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  LOJA COM FISICO
                </button>
              </div>

              {/* Classificação / Métrica de Estoque (Físico, Lógico, Trânsito, Total) */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <Boxes size={13} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Métrica:</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as EstoqueTipoMetric)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                >
                  <option value="FISICO">Estoque Físico</option>
                  <option value="LOGICO">Estoque Lógico</option>
                  <option value="TRANSITO">Em Trânsito</option>
                  <option value="ESTOQUE">Estoque Geral (Total)</option>
                </select>
              </div>

              {/* Opção de Classificação / Ordenação */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <ArrowUpDown size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Classificar:</span>
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value as OrderByOption)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                >
                  <option value="LINHA_ASC">Categoria (A-Z)</option>
                  <option value="ESTOQUE_DESC">Maior Estoque CD 994</option>
                  <option value="ESTOQUE_ASC">Menor Estoque CD 994</option>
                  <option value="LOJAS_DESC">Maior Volume Lojas</option>
                </select>
              </div>

              {/* Filtro por Regional (Thiago vs Outros Regionais) */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <Building2 size={13} className="text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Regional:</span>
                <select
                  value={selectedRegional}
                  onChange={(e) => {
                    setSelectedRegional(e.target.value as RegionalOption)
                    setSelectedFiliais([]) // Reseta seleção customizada de filiais ao mudar regional
                  }}
                  className="bg-transparent text-xs font-black text-slate-900 outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os Regionais (45 lojas)</option>
                  <option value="Thiago">Thiago (32 lojas)</option>
                  <option value="Outros Regionais">Outros Regionais (13 lojas)</option>
                </select>
              </div>

              {/* FILTRO 1: MÚLTIPLA SELEÇÃO DE LOJAS */}
              <div className="relative" ref={lojasDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLojasDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    selectedFiliais.length > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Filtro de Lojas com múltipla seleção"
                >
                  <Store size={13} className={selectedFiliais.length > 0 ? 'text-blue-600' : 'text-slate-500'} />
                  <span>
                    {selectedFiliais.length === 0
                      ? 'Lojas: Todas'
                      : `Lojas (${selectedFiliais.length})`}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${isLojasDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLojasDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px]">
                      <span className="font-black text-slate-800">Filtrar Lojas</span>
                      {selectedFiliais.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedFiliais([])}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Limpar ({selectedFiliais.length})
                        </button>
                      )}
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                      {((selectedRegional === 'TODOS'
                        ? initialPivotData.filiais as number[]
                        : (initialPivotData.filiais as number[]).filter(f => REGIONAL_FILIAIS_MAP[f] === selectedRegional)
                      )).map(fil => {
                        const isChecked = selectedFiliais.includes(fil)
                        const reg = REGIONAL_FILIAIS_MAP[fil]
                        return (
                          <label
                            key={fil}
                            onClick={() => toggleFilialSelection(fil)}
                            className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                                isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check size={10} strokeWidth={3} />}
                              </div>
                              <span>Filial {fil}</span>
                            </div>
                            <span className="text-[9px] font-normal text-slate-400">
                              {reg === 'Thiago' ? 'Thiago' : 'Outros'}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* FILTRO 2: MÚLTIPLA SELEÇÃO DE LINHAS (CATEGORIAS) */}
              <div className="relative" ref={linhasDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLinhasDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    selectedLinhas.length > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Filtro de Linhas com múltipla seleção"
                >
                  <Filter size={13} className={selectedLinhas.length > 0 ? 'text-amber-600' : 'text-slate-500'} />
                  <span>
                    {selectedLinhas.length === 0
                      ? 'Linhas: Todas'
                      : `Linhas (${selectedLinhas.length})`}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${isLinhasDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLinhasDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-68 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px]">
                      <span className="font-black text-slate-800">Filtrar Categorias / Linhas</span>
                      {selectedLinhas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedLinhas([])}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Limpar ({selectedLinhas.length})
                        </button>
                      )}
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                      {allLinhasAvailable.map(linha => {
                        const isChecked = selectedLinhas.includes(linha)
                        return (
                          <label
                            key={linha}
                            onClick={() => toggleLinhaSelection(linha)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 ${
                              isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className="truncate">{linha}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Busca Rápida e Botões Expandir/Recolher */}
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar Linha, SKU ou Descrição..."
                  value={pivotSearch}
                  onChange={(e) => setPivotSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => toggleAllLinhas(true)}
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Expandir todas as linhas"
              >
                <Expand size={12} />
                <span>Expandir</span>
              </button>

              <button
                type="button"
                onClick={() => toggleAllLinhas(false)}
                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Recolher todas as linhas"
              >
                <Shrink size={12} />
                <span>Recolher</span>
              </button>
            </div>
          </div>

          {/* Subtítulo Informativo de Cabeçalho da Matriz */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4 font-semibold">
              <span>Métrica Ativa: <strong className="text-blue-700">{selectedMetric}</strong></span>
              <span>Regional: <strong className={selectedRegional === 'Thiago' ? 'text-indigo-700' : selectedRegional === 'Outros Regionais' ? 'text-amber-700' : 'text-slate-800'}>{selectedRegional}</strong></span>
              <span>CD Origem: <strong>994</strong></span>
              <span>Linhas: <strong>{pivotLinhasData.length}</strong></span>
              <span>Lojas Exibidas: <strong className="text-slate-900">{filiaisList.length} de 45</strong></span>
            </div>
            <div className="text-[10px] text-slate-400">
              * Clique em [+] para expandir os SKUs ou utilize os seletores de regional, métrica e classificação acima
            </div>
          </div>

          {/* TABELA DINÂMICA (MATRIZ PIVOT COM SCROLL HORIZONTAL) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs max-h-[70vh]">
            <table className="w-full text-left border-collapse text-[10px] whitespace-nowrap">
              <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs border-b border-slate-300 select-none">
                <tr className="text-[9.5px] font-black uppercase text-slate-700">
                  <th className="py-2 px-2 sticky left-0 z-40 bg-slate-100 border-r border-slate-200 min-w-[220px]">
                    DESCLINHA / PRODUTO
                  </th>
                  <th className="py-2 px-2 text-center sticky left-[220px] z-40 bg-slate-100 border-r border-slate-200 min-w-[90px]">
                    CÓD. PRODUTO
                  </th>
                  <th className="py-2 px-3 sticky left-[310px] z-40 bg-slate-100 border-r border-slate-200 min-w-[200px]">
                    DESCRIÇÃO
                  </th>
                  <th className="py-2 px-2 text-right sticky left-[510px] z-40 bg-blue-100/90 text-blue-900 border-r border-slate-300 min-w-[90px]">
                    {cdColumnLabel}
                  </th>

                  {/* Colunas Dinâmicas de Cada Filial */}
                  {filiaisList.map(fil => (
                    <th key={fil} className="py-2 px-2 text-center border-r border-slate-200 min-w-[38px] text-[9px] font-bold">
                      {fil}
                    </th>
                  ))}

                  {/* Coluna Total Geral da Linha */}
                  <th className="py-2 px-2 text-center bg-slate-200/90 text-slate-900 font-black min-w-[70px]">
                    Total Geral
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-mono">
                {pivotLinhasData.map(l => {
                  const isExpanded = !!expandedLinhas[l.linha]

                  return (
                    <React.Fragment key={l.linha}>
                      {/* LINHA PAI: DESCLINHA (Categoria do Produto) */}
                      <tr className="bg-slate-50/90 hover:bg-slate-100/80 transition-colors font-bold text-slate-900 border-t border-slate-200">
                        {/* Nome da Linha com Botão Expandir/Recolher */}
                        <td className="py-1.5 px-2 sticky left-0 z-20 bg-slate-50 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => toggleLinha(l.linha)}
                            className="flex items-center gap-1.5 text-left text-slate-900 hover:text-blue-600 transition-colors cursor-pointer w-full"
                          >
                            <span className="w-4 h-4 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                              {isExpanded ? '-' : '+'}
                            </span>
                            <span className="truncate">{l.linha}</span>
                          </button>
                        </td>

                        {/* Cód. Produto */}
                        <td className="py-1.5 px-2 text-center sticky left-[220px] z-20 bg-slate-50 border-r border-slate-200 text-slate-400">
                          -
                        </td>

                        {/* Descrição */}
                        <td className="py-1.5 px-3 sticky left-[310px] z-20 bg-slate-50 border-r border-slate-200 text-slate-500 font-sans text-[10px]">
                          {l.skusList.length} itens cadastrados
                        </td>

                        {/* Estoque Consolidado do CD 994 na Métrica Selecionada */}
                        <td className="py-1.5 px-2 text-right sticky left-[510px] z-20 bg-blue-50/80 text-blue-900 border-r border-slate-300 font-black">
                          {l.totalCd994.toLocaleString('pt-BR')}
                        </td>

                        {/* Valores por Filial na Categoria */}
                        {filiaisList.map(fil => {
                          const val = l.filiaisTotais[fil] || 0
                          return (
                            <td key={fil} className="py-1.5 px-2 text-center border-r border-slate-100 text-[10px]">
                              {val > 0 ? (
                                <span className="font-bold text-slate-800">{val}</span>
                              ) : (
                                <span className="text-slate-300 font-light">0</span>
                              )}
                            </td>
                          )
                        })}

                        {/* Total Geral da Linha */}
                        <td className="py-1.5 px-2 text-center bg-slate-100 text-slate-900 font-bold">
                          {l.totalLojas.toLocaleString('pt-BR')}
                        </td>
                      </tr>

                      {/* ITENS FILHOS: SKUS DA LINHA */}
                      {isExpanded && l.skusList.map(s => (
                        <tr key={s.codProd} className="bg-white hover:bg-blue-50/40 transition-colors text-slate-700 text-[9.5px]">
                          {/* Nome da Linha */}
                          <td className="py-1 px-2 pl-7 sticky left-0 z-10 bg-white border-r border-slate-200 text-slate-400 text-[9px] truncate">
                            &bull; {l.linha}
                          </td>

                          {/* CÓDIGO DO PRODUTO */}
                          <td className="py-1 px-2 text-center font-bold text-blue-700 sticky left-[220px] z-10 bg-white border-r border-slate-200">
                            {s.codProd}
                          </td>

                          {/* DESCRIÇÃO DO PRODUTO */}
                          <td className="py-1 px-3 font-sans text-slate-800 truncate max-w-[200px] sticky left-[310px] z-10 bg-white border-r border-slate-200" title={s.desc}>
                            {s.desc}
                          </td>

                          {/* ESTOQUE DO SKU NO CD 994 */}
                          <td className="py-1 px-2 text-right sticky left-[510px] z-10 bg-blue-50/40 text-blue-800 font-bold border-r border-slate-300">
                            {s.valCd994.toLocaleString('pt-BR')}
                          </td>

                          {/* VALOR DE CADA FILIAL PARA O SKU */}
                          {filiaisList.map(fil => {
                            const val = s.filiaisVals[fil] || 0
                            return (
                              <td key={fil} className="py-1 px-2 text-center border-r border-slate-100 text-[9px]">
                                {val > 0 ? (
                                  <span className="font-bold text-slate-900 bg-amber-100 px-1 py-0.2 rounded">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-light">0</span>
                                )}
                              </td>
                            )
                          })}

                          {/* Total do SKU em todas as lojas */}
                          <td className="py-1 px-2 text-center bg-slate-50 font-bold text-slate-700">
                            {s.totalLojas.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tbody>

              {/* RODAPÉ: TOTAL GERAL (994 TOTAL / TOTAL GERAL) */}
              <tfoot className="sticky bottom-0 z-30 bg-slate-200/95 font-black text-[10px] text-slate-900 border-t-2 border-slate-300 select-none">
                <tr>
                  <td className="py-2 px-2 sticky left-0 z-40 bg-slate-200 border-r border-slate-300">
                    994 Total / Total Geral
                  </td>
                  <td className="py-2 px-2 text-center sticky left-[220px] z-40 bg-slate-200 border-r border-slate-300">
                    -
                  </td>
                  <td className="py-2 px-3 sticky left-[310px] z-40 bg-slate-200 border-r border-slate-300">
                    Total Consolidado
                  </td>
                  <td className="py-2 px-2 text-right sticky left-[510px] z-40 bg-blue-200 text-blue-950 font-black border-r border-slate-400">
                    {pivotGrandTotals.grandCd994.toLocaleString('pt-BR')}
                  </td>

                  {/* Totais de Cada Filial */}
                  {filiaisList.map(fil => (
                    <td key={fil} className="py-2 px-2 text-center border-r border-slate-300">
                      {(pivotGrandTotals.grandFiliais[fil] || 0).toLocaleString('pt-BR')}
                    </td>
                  ))}

                  {/* Soma de Todas as Filiais */}
                  <td className="py-2 px-2 text-center bg-slate-300 text-slate-950 font-black">
                    {pivotGrandTotals.grandLojas.toLocaleString('pt-BR')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: RELATÓRIO SUPPLY (LISTAGEM BRUTA DO BANCO) */}
      {/* ======================================================== */}
      {activeTab === 'relatorio' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          {/* Barra Superior: Busca, Filtros e Ações de Upload */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, Descrição ou Código de Barras..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filtros e Upload */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Status */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <Filter size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  {statusOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                  {statusOptions.length === 0 && <option value="LOJA SEM FISICO">LOJA SEM FISICO</option>}
                </select>
              </div>

              {/* Filtro Filial */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <Store size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Filial:</span>
                <select
                  value={selectedFilial}
                  onChange={(e) => {
                    setSelectedFilial(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todas as Filiais</option>
                  {filialOptions.map(fil => (
                    <option key={fil} value={fil}>Filial {fil}</option>
                  ))}
                </select>
              </div>

              {/* Botão de Atualizar / Recarregar */}
              <button
                type="button"
                onClick={() => loadData(page, searchTerm)}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Recarregar tabela"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              </button>

              {/* Botão de Upload da Planilha Supply.xlsx */}
              <label
                htmlFor="supply-file-upload"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${isUploading
                    ? 'bg-slate-400 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  }`}
                title="Sincronizar banco com nova planilha Supply.xlsx"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{uploadProgress || 'Processando...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Atualizar Banco (Supply.xlsx)</span>
                  </>
                )}
                <input
                  id="supply-file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[9.5px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap select-none">
                  <th className="py-2 px-2.5">Filial</th>
                  <th className="py-2 px-2">SKU</th>
                  <th className="py-2 px-2">Cód. DF</th>
                  <th className="py-2 px-3">Descrição do Produto</th>
                  <th className="py-2 px-2 text-center bg-blue-50/50">Estoque CD 994</th>
                  <th className="py-2 px-2 text-center bg-indigo-50/50">Físico Loja</th>
                  <th className="py-2 px-2 text-center">Trânsito Loja</th>
                  <th className="py-2 px-2 text-right">CMUP (R$)</th>
                  <th className="py-2 px-2.5 text-right">Vlr Estoque 994</th>
                  <th className="py-2 px-2.5 text-center">Status Estoque</th>
                  <th className="py-2 px-2.5">Linha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-blue-600" />
                        <span>Carregando dados do relatório...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FileSpreadsheet size={28} className="text-slate-300" />
                        <span className="font-bold text-slate-600">Nenhum registro encontrado</span>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {totalCount === 0
                            ? 'A tabela ainda não possui dados carregados. Utilize o botão "Atualizar Banco (Supply.xlsx)" para realizar a carga inicial.'
                            : 'Nenhum resultado corresponde aos filtros ou busca selecionados.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2.5 font-sans font-bold text-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.filial}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold text-blue-700">{item.codigo_produto}</td>
                      <td className="py-2 px-2 text-slate-500">{item.codproddf}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800 truncate max-w-[240px]" title={item.descricao}>
                        {item.descricao}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/20">
                        {item.estoque_994.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-indigo-700 bg-indigo-50/20">
                        {item.fisico.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">
                        {item.transito.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700">
                        R$ {item.cmup.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                        R$ {item.valor_estoque_994.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-center font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${item.status_estoque?.includes('SEM FISICO')
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                        >
                          {item.status_estoque || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-sans text-slate-600 truncate max-w-[140px]" title={item.desclinha}>
                        {item.desclinha}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação e Resumo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Exibindo <strong>{items.length}</strong> de <strong>{totalCount.toLocaleString('pt-BR')}</strong> registros
              {searchTerm && ` para a busca "${searchTerm}"`}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] text-slate-400">Página {page} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Página Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Próxima Página"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
