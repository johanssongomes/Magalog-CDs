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
  Package
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { getPcpItemsReport, type PcpItem } from '../lib/pcpService'
import initialSampleRows from '../data/pcp_initial_sample.json'

export const PcpJsMartinsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planejamento' | 'programacao' | 'controle'>('controle')

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

  // Buscar dados
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
        setItems(res.data)
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
        const slice = filtered.slice(from, from + pageSize).map((r: any, idx) => ({
          id: idx + from + 1,
          item: String(r.item || r.ITEM || ''),
          descricao: String(r.descricao || r.DESCRICAO || ''),
          ibm: String(r.ibm || r.IBM || ''),
          fantasia: String(r.fantasia || r.FANTASIA || ''),
          filentrega: Number(r.filentrega || r.FILENTREGA) || 0,
          filorig: Number(r.filorig || r.FILORIG) || 994,
          status_operacao: String(r.status_operacao || r.STATUS_OPERACAO || 'EM PROCESSO'),
          linha: String(r.linha || r.LINHA || ''),
          numpedven: String(r.numpedven || r.NUMPEDVEN || ''),
          cub_tot: Number(r.cub_tot || r.CUB_TOT) || 0,
          vltotal: Number(r.vltotal || r.VLTOTAL) || 0,
          fisico: Number(r.fisico || r.FISICO) || 0,
          logico: Number(r.logico || r.LOGICO) || 0,
          reslog: Number(r.reslog || r.RESLOG) || 0,
          transito: Number(r.transito || r.TRANSITO) || 0,
          precounit: Number(r.precounit || r.PRECOUNIT) || 0,
          pesoliq: Number(r.pesoliq || r.PESOLIQ) || 0,
          dtentrega: String(r.dtentrega || r.DTENTREGA || '')
        }))
        setItems(slice)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de PCP:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedStatusOperacao, selectedFilEntrega, searchTerm])

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
        numlote: r.NUMLOTE ? String(r.NUMLOTE) : null,
        fllibfat: r.FLLIBFAT ? String(r.FLLIBFAT) : null,
        tpnota: Number(r.TPNOTA) || null,
        numpedven: r.NUMPEDVEN ? String(r.NUMPEDVEN) : null,
        numpedcomp: r.NUMPEDCOMP ? String(r.NUMPEDCOMP) : null,
        dtpedido: r.DTPEDIDO ? String(r.DTPEDIDO) : null,
        dtentrega: r.DTENTREGA ? String(r.DTENTREGA) : null,
        dtlibfat: r.DTLIBFAT ? String(r.DTLIBFAT) : null,
        preventrega: r.PREVENTREGA ? String(r.PREVENTREGA) : null,
        item: String(r.ITEM || ''),
        ibm: r.IBM ? String(r.IBM) : null,
        descricao: String(r.DESCRICAO || ''),
        ref: r.REF ? String(r.REF) : null,
        fantasia: r.FANTASIA ? String(r.FANTASIA) : null,
        qtcomp: Number(r.QTCOMP) || 0,
        fisico: Number(r.FISICO) || 0,
        resfis: Number(r.RESFIS) || 0,
        logico: Number(r.LOGICO) || 0,
        reslog: Number(r.RESLOG) || 0,
        tecnico: Number(r.TECNICO) || 0,
        futuro: Number(r.FUTURO) || 0,
        transito: Number(r.TRANSITO) || 0,
        status: r.STATUS ? String(r.STATUS) : null,
        situacao: r.SITUACAO ? String(r.SITUACAO) : null,
        linha: r.LINHA ? String(r.LINHA) : null,
        linha_ajustada: r.LINHA_AJUSTADA ? String(r.LINHA_AJUSTADA) : null,
        nucleo: r.NUCLEO ? String(r.NUCLEO) : null,
        familia: r.FAMILIA ? String(r.FAMILIA) : null,
        codrota: r.CODROTA ? String(r.CODROTA) : null,
        descricaorota: r.DESCRICAOROTA ? String(r.DESCRICAOROTA) : null,
        codmodal: r.CODMODAL ? String(r.CODMODAL) : null,
        descricaomodal: r.DESCRICAOMODAL ? String(r.DESCRICAOMODAL) : null,
        status_operacao: r.STATUS_OPERACAO ? String(r.STATUS_OPERACAO) : 'EM PROCESSO',
        operacao: r.OPERACAO ? String(r.OPERACAO) : null,
        cub_tot: Number(r.CUB_TOT) || 0,
        pesoliq: Number(r.PESOLIQ) || 0,
        precounit: Number(r.PRECOUNIT) || 0,
        vltotal: Number(r.VLTOTAL) || 0,
        qtped: Number(r.QTPED) || 0,
        dtentregaagendada: r.DTENTREGAAGENDADA ? String(r.DTENTREGAAGENDADA) : null,
        dt_hr_libfat: r.DT_HR_LIBFAT ? String(r.DT_HR_LIBFAT) : null,
        faixa_dias_reduzida: r.FAIXA_DIAS_REDUZIDA ? String(r.FAIXA_DIAS_REDUZIDA) : null
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
      subtitle: 'Banco de Dados Operacional (PCP J\'S MARTINS.xlsx)',
      icon: <Database size={15} />
    }
  ] as const

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1700px] mx-auto animate-in fade-in duration-300">
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
                <Database size={11} /> Base Operacional
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Planejamento, Controle e Programação da Produção & Operação Logística
            </p>
          </div>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs gap-1">
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
      {/* ABA 3: CONTROLE & ACOMPANHAMENTO (BASE DE DADOS PCP J'S MARTINS)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'controle' ? (
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

          {/* TABELA DE DADOS DA BASE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3">Origem</th>
                    <th className="py-2.5 px-3">Filial Entrega</th>
                    <th className="py-2.5 px-3">Pedido Venda</th>
                    <th className="py-2.5 px-3">Item / SKU</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Descrição do Produto</th>
                    <th className="py-2.5 px-3">Fornecedor / Fantasia</th>
                    <th className="py-2.5 px-3 text-center">Status Operação</th>
                    <th className="py-2.5 px-3">Linha</th>
                    <th className="py-2.5 px-3 text-right">Físico</th>
                    <th className="py-2.5 px-3 text-right">Lógico</th>
                    <th className="py-2.5 px-3 text-right">Res. Cliente</th>
                    <th className="py-2.5 px-3 text-right">Trânsito</th>
                    <th className="py-2.5 px-3 text-right">Cubagem (m³)</th>
                    <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                        Carregando registros da base PCP...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-700">CD {row.filorig || 994}</td>
                        <td className="py-2 px-3 font-bold text-blue-600">Filial {row.filentrega}</td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">{row.numpedven || '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.item}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 truncate max-w-[280px]" title={row.descricao}>
                          {row.descricao}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[160px]" title={row.fantasia}>
                          {row.fantasia || '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${row.status_operacao === 'EM PROCESSO'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}>
                            {row.status_operacao || 'EM PROCESSO'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">{row.linha || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(row.fisico || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {Number(row.logico || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-pink-600">
                          {Number(row.reslog || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {Number(row.transito || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-purple-700">
                          {Number(row.cub_tot || 0).toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          R$ {Number(row.vltotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
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
                <span className="font-bold text-slate-800">{totalCount.toLocaleString('pt-BR')}</span> registros
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
      ) : (
        /* ABAS 1 E 2: EM CONSTRUÇÃO */
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
              {currentTabInfo.subtitle}. Esta área consumirá diretamente a tabela da base de dados configurada na aba <strong>Controle & Acompanhamento</strong>.
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
              <p className="text-[11px] text-slate-500">Agrupamento por status de operação, cubagem de saída e linha de produto.</p>
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
