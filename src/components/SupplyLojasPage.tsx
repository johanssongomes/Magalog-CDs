import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Expand,
  Shrink
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { getSupplyLojasReport, getSupplyFiltersMeta, type SupplyItem } from '../lib/supplyService'
import initialPivotData from '../data/supply_pivot_summary.json'

export const SupplyLojasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'painel' | 'relatorio'>('painel')

  // -------------------------------------------------------------
  // ESTADOS DO PAINEL SUPPLY (TABELA DINÂMICA / PIVOT)
  // -------------------------------------------------------------
  const [pivotStatus, setPivotStatus] = useState<string>('LOJA SEM FISICO')
  const [pivotSearch, setPivotSearch] = useState<string>('')
  const [expandedLinhas, setExpandedLinhas] = useState<Record<string, boolean>>({
    'TB - TABLET': true
  })

  // Alternar expansão de uma linha específica
  const toggleLinha = (linha: string) => {
    setExpandedLinhas(prev => ({
      ...prev,
      [linha]: !prev[linha]
    }))
  }

  // Expandir ou recolher todas as linhas
  const toggleAllLinhas = (expand: boolean) => {
    const currentStatusObj = initialPivotData.summary[pivotStatus as keyof typeof initialPivotData.summary] || {}
    const newExpanded: Record<string, boolean> = {}
    Object.keys(currentStatusObj).forEach(k => {
      newExpanded[k] = expand
    })
    setExpandedLinhas(newExpanded)
  }

  // Dados filtrados do Pivot
  const filiaisList = useMemo(() => initialPivotData.filiais as number[], [])
  
  const pivotLinhasData = useMemo(() => {
    const currentStatusObj = (initialPivotData.summary[pivotStatus as keyof typeof initialPivotData.summary] || {}) as Record<
      string,
      { totalFisico994: number; filiaisTotais: Record<string, number>; skus: Record<string, { codProd: string; codDf: string; desc: string; fisico994: number; filiais: Record<string, number> }> }
    >

    const query = pivotSearch.trim().toLowerCase()
    const result: Array<{
      linha: string
      totalFisico994: number
      filiaisTotais: Record<string, number>
      skusList: Array<{ codProd: string; codDf: string; desc: string; fisico994: number; filiais: Record<string, number> }>
    }> = []

    Object.entries(currentStatusObj).forEach(([linha, lData]) => {
      const allSkus = Object.values(lData.skus)
      
      const filteredSkus = query
        ? allSkus.filter(s =>
            linha.toLowerCase().includes(query) ||
            s.codProd.toLowerCase().includes(query) ||
            s.desc.toLowerCase().includes(query) ||
            s.codDf.toLowerCase().includes(query)
          )
        : allSkus

      if (filteredSkus.length > 0 || linha.toLowerCase().includes(query)) {
        result.push({
          linha,
          totalFisico994: lData.totalFisico994,
          filiaisTotais: lData.filiaisTotais,
          skusList: filteredSkus
        })
      }
    })

    return result.sort((a, b) => a.linha.localeCompare(b.linha))
  }, [pivotStatus, pivotSearch])

  // Total Geral da Matriz
  const pivotGrandTotals = useMemo(() => {
    let grand994 = 0
    const grandFiliais: Record<number, number> = {}
    filiaisList.forEach(f => { grandFiliais[f] = 0 })

    pivotLinhasData.forEach(l => {
      grand994 += l.totalFisico994
      filiaisList.forEach(f => {
        grandFiliais[f] += (l.filiaisTotais[f] || 0)
      })
    })

    return { grand994, grandFiliais }
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

  // Carregar dados da tabela com debounce de busca
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'painel'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'relatorio'
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
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            uploadFeedback.type === 'success'
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
          {/* Barra Superior: Filtro STATUS_ESTOQUE, Busca e Ações de Expansão */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Esquerda: Filtro de Status do Estoque */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                STATUS_ESTOQUE:
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPivotStatus('LOJA SEM FISICO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    pivotStatus === 'LOJA SEM FISICO'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  LOJA SEM FISICO
                </button>
                <button
                  type="button"
                  onClick={() => setPivotStatus('LOJA COM FISICO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    pivotStatus === 'LOJA COM FISICO'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  LOJA COM FISICO
                </button>
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
              <span>Soma de FISICO</span>
              <span>CODFIL: <strong>994</strong></span>
              <span>Linhas Visíveis: <strong>{pivotLinhasData.length}</strong></span>
              <span>Filiais Mapeadas: <strong>{filiaisList.length}</strong></span>
            </div>
            <div className="text-[10px] text-slate-400">
              * Clique em [+] para expandir os SKUs de cada categoria de produto
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
                  <th className="py-2 px-2 text-right sticky left-[510px] z-40 bg-blue-100/90 text-blue-900 border-r border-slate-300 min-w-[85px]">
                    FISICO_994
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

                        {/* Cód. Produto (Vazio na linha de total da categoria) */}
                        <td className="py-1.5 px-2 text-center sticky left-[220px] z-20 bg-slate-50 border-r border-slate-200 text-slate-400">
                          -
                        </td>

                        {/* Descrição */}
                        <td className="py-1.5 px-3 sticky left-[310px] z-20 bg-slate-50 border-r border-slate-200 text-slate-500 font-sans text-[10px]">
                          {l.skusList.length} itens cadastrados
                        </td>

                        {/* FISICO_994 Consolidado da Categoria */}
                        <td className="py-1.5 px-2 text-right sticky left-[510px] z-20 bg-blue-50/80 text-blue-900 border-r border-slate-300 font-black">
                          {l.totalFisico994.toLocaleString('pt-BR')}
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
                          {Object.values(l.filiaisTotais).reduce((acc, v) => acc + v, 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>

                      {/* ITENS FILHOS: SKUS DA LINHA (Apenas se estiver expandido) */}
                      {isExpanded && l.skusList.map(s => {
                        const totalSkuLoja = Object.values(s.filiais).reduce((acc, v) => acc + v, 0)

                        return (
                          <tr key={s.codProd} className="bg-white hover:bg-blue-50/40 transition-colors text-slate-700 text-[9.5px]">
                            {/* Nome da Linha (Indentado) */}
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

                            {/* FISICO_994 DO SKU */}
                            <td className="py-1 px-2 text-right sticky left-[510px] z-10 bg-blue-50/40 text-blue-800 font-bold border-r border-slate-300">
                              {s.fisico994.toLocaleString('pt-BR')}
                            </td>

                            {/* FISICO DE CADA FILIAL PARA O SKU */}
                            {filiaisList.map(fil => {
                              const val = s.filiais[fil] || 0
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
                              {totalSkuLoja.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        )
                      })}
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
                    {pivotGrandTotals.grand994.toLocaleString('pt-BR')}
                  </td>

                  {/* Totais de Cada Filial */}
                  {filiaisList.map(fil => (
                    <td key={fil} className="py-2 px-2 text-center border-r border-slate-300">
                      {(pivotGrandTotals.grandFiliais[fil] || 0).toLocaleString('pt-BR')}
                    </td>
                  ))}

                  {/* Soma de Todas as Filiais */}
                  <td className="py-2 px-2 text-center bg-slate-300 text-slate-950 font-black">
                    {Object.values(pivotGrandTotals.grandFiliais).reduce((acc, v) => acc + v, 0).toLocaleString('pt-BR')}
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                  isUploading
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
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            item.status_estoque?.includes('SEM FISICO')
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
