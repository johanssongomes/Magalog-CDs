import React, { useState, useEffect, useMemo } from 'react'
import { 
  Table, 
  Download, 
  Filter, 
  Search, 
  Boxes, 
  Package, 
  Layers, 
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  Sparkles,
  InboxIcon
} from 'lucide-react'
import { getPmtDailyMatrixFromSupabase } from '../lib/pmtService'

interface DayItem {
  day: number
  dayStr: string
  weekdayLetter: string
}

interface MatrixData {
  ano: number
  mes: number
  cd: string
  groupBy?: 'modal' | 'categoria_produtividade'
  days: DayItem[]
  modals: string[]
  data: {
    pedidos: Record<string, Record<string, number> & { total: number }>
    pecas: Record<string, Record<string, number> & { total: number }>
    cubagem: Record<string, Record<string, number> & { total: number }>
  }
  totals: {
    pedidos: Record<string, number> & { total: number }
    pecas: Record<string, number> & { total: number }
    cubagem: Record<string, number> & { total: number }
  }
}

interface Props {
  ano: number
  mes: number
  cd?: string
  pageTitle?: string
}

type SectionView = 'all' | 'pedidos' | 'pecas' | 'cubagem'
type GroupByView = 'modal' | 'categoria_produtividade'

export const PmtDailyMatrixTable: React.FC<Props> = ({ ano, mes, cd = '994', pageTitle = 'PMT Expedição' }) => {
  const [matrix, setMatrix] = useState<MatrixData | null>(null)
  const [selectedSection, setSelectedSection] = useState<SectionView>('all')
  const [groupBy, setGroupBy] = useState<GroupByView>('modal')
  const [searchModal, setSearchModal] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Carrega dados dinâmicos do Supabase (ou local se offline) sempre que ano/mês/cd/groupBy mudam
  useEffect(() => {
    let isMounted = true
    setMatrix(null) // Limpa dados do mês anterior imediatamente ao mudar filtros
    const fetchMatrix = async () => {
      setIsLoading(true)
      try {
        // Tenta primeiro direto do Supabase (funciona na Vercel e fora da rede)
        const cloudData = await getPmtDailyMatrixFromSupabase(ano, mes, cd, groupBy)
        if (cloudData && cloudData.days && cloudData.days.length > 0 && isMounted) {
          setMatrix(cloudData)
          return
        }

        // Fallback para servidor local se disponível
        const res = await fetch(`http://localhost:3001/api/pmt/daily-matrix?ano=${ano}&mes=${mes}&cd=${cd}&groupBy=${groupBy}`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted) {
            if (json && json.days && json.days.length > 0) {
              setMatrix(json)
            } else {
              setMatrix(null)
            }
          }
        }
      } catch {
        // Mantém null se não conseguir carregar
        if (isMounted) setMatrix(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchMatrix()
    return () => { isMounted = false }
  }, [ano, mes, cd, groupBy])

  // Função para remover a numeração inicial dos nomes dos modais (ex: "1. Courier" -> "Courier")
  const cleanModalName = (name: string) => {
    return name.replace(/^\d+\.\s*/, '').trim()
  }

  // Lista de modais filtrada por busca (permitindo buscar pelo nome original ou sem numeração)
  const filteredModals = useMemo(() => {
    if (!matrix) return []
    if (!searchModal.trim()) return matrix.modals
    const term = searchModal.toLowerCase()
    return matrix.modals.filter(m => 
      m.toLowerCase().includes(term) || cleanModalName(m).toLowerCase().includes(term)
    )
  }, [matrix, searchModal])

  // Formatação de números padrão brasileiro
  const formatNum = (val: number | undefined | null) => {
    if (val === undefined || val === null || val === 0) return '0'
    return Math.round(val).toLocaleString('pt-BR')
  }

  // Exportar para CSV
  const handleExportCSV = () => {
    const colName = groupBy === 'categoria_produtividade' ? 'Categoria de Produtividade' : 'Modal'
    const headers = ['Indicador', colName, ...matrix.days.map(d => `${d.dayStr} (${d.weekdayLetter})`), 'Total Geral']
    const csvRows: string[] = [headers.join(';')]

    const addSectionRows = (sectionName: string, sectionData: Record<string, Record<string, number> & { total: number }>, sectionTotal: Record<string, number> & { total: number }) => {
      matrix.modals.forEach(m => {
        const row = [
          sectionName,
          `"${cleanModalName(m)}"`,
          ...matrix.days.map(d => sectionData[m]?.[d.dayStr] || 0),
          sectionData[m]?.total || 0
        ]
        csvRows.push(row.join(';'))
      })
      // Linha de total
      const totalRow = [
        sectionName,
        `"TOTAL ${sectionName.toUpperCase()} TT"`,
        ...matrix.days.map(d => sectionTotal[d.dayStr] || 0),
        sectionTotal.total || 0
      ]
      csvRows.push(totalRow.join(';'))
    }

    addSectionRows('Pedidos', matrix.data.pedidos, matrix.totals.pedidos)
    addSectionRows('Peças', matrix.data.pecas, matrix.totals.pecas)
    addSectionRows('Cubagem', matrix.data.cubagem, matrix.totals.cubagem)

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PMT_${cd}_${mes}_${ano}_${groupBy}_indicadores.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Carregando dados de {mes.toString().padStart(2,'0')}/{ano}…</p>
      </div>
    )
  }

  // Sem dados para o período selecionado
  if (!matrix) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
          <InboxIcon size={32} className="text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-600">Sem dados para este período</p>
          <p className="text-sm text-slate-400 mt-1">Nenhum registro encontrado para CD {cd} — {mes.toString().padStart(2,'0')}/{ano}.</p>
          <p className="text-xs text-slate-300 mt-1">Importe a planilha PMT deste mês para visualizar os indicadores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
      {/* Top Header do Indicador */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-sky-100 text-sky-800 font-mono text-[11px] font-bold tracking-wider uppercase">
              Indicador PMT Diário
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-700">
              CD {cd} • {mes.toString().padStart(2, '0')}/{ano}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              Base Consolidada
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Acompanhamento Diário por {groupBy === 'categoria_produtividade' ? 'Categoria de Produtividade' : 'Modal'} (Pedidos, Peças e Cubagem)
          </h3>
          <p className="text-xs text-slate-500">
            Visão diária do dia 01 ao dia {matrix.days.length} agrupada por {groupBy === 'categoria_produtividade' ? 'Categoria de Produtividade' : 'Modal de Transporte'} com totais consolidados
          </p>
        </div>

        {/* Controles: Agrupamento (Modal vs Categoria), Abas de Seções, Filtro de Busca e Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Agrupamento: Modal vs Categoria de Produtividade */}
          <div className="inline-flex p-1 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-900">
            <button
              onClick={() => setGroupBy('modal')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                groupBy === 'modal'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'hover:bg-amber-100 text-amber-800'
              }`}
            >
              Por Modal
            </button>
            <button
              onClick={() => setGroupBy('categoria_produtividade')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                groupBy === 'categoria_produtividade'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'hover:bg-amber-100 text-amber-800'
              }`}
            >
              Por Categoria Produtividade
            </button>
          </div>

          {/* Tabs para alternar entre Todos / Pedidos / Peças / Cubagem */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSection('pedidos')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'pedidos'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Pedidos TT
            </button>
            <button
              onClick={() => setSelectedSection('pecas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'pecas'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Peças TT
            </button>
            <button
              onClick={() => setSelectedSection('cubagem')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedSection === 'cubagem'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Cubagem TT
            </button>
          </div>

          {/* Busca de Modal ou Categoria */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchModal}
              onChange={(e) => setSearchModal(e.target.value)}
              placeholder={groupBy === 'categoria_produtividade' ? 'Buscar categoria...' : 'Buscar modal...'}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCSV}
            title="Exportar dados para planilha CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download size={13} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TABELA MATRIZ NO FORMATO EXATO DA PLANILHA (Data, Q S S D S T Q..., Total Geral)
          ========================================================================= */}
      <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-[11px] font-sans">
            {/* Cabeçalho da Tabela */}
            <thead className="sticky top-0 z-30 bg-[#e0f2fe] border-b border-sky-300">
              <tr>
                {/* Coluna 1: Data (Fixa à esquerda) */}
                <th 
                  scope="col"
                  className="sticky left-0 z-40 bg-[#e0f2fe] px-3 py-2 font-bold text-slate-800 border-r border-sky-200 min-w-[170px] shadow-[2px_0_4px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Data</span>
                  </div>
                </th>

                {/* Colunas dos Dias (1 a 31 com Letra do dia da semana e Número) */}
                {matrix.days.map((d) => {
                  const isWeekend = d.weekdayLetter === 'S' || d.weekdayLetter === 'D'
                  return (
                    <th
                      key={d.dayStr}
                      scope="col"
                      className={`px-1.5 py-1 text-center font-normal min-w-[38px] border-r border-sky-200/80 ${
                        isWeekend ? 'bg-sky-200/50' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="italic text-[10px] text-slate-600 font-semibold">{d.weekdayLetter}</span>
                        <span className="font-bold text-[11px] text-slate-900 mt-0.5">{d.day}</span>
                      </div>
                    </th>
                  )
                })}

                {/* Coluna Final: Total Geral (Fixa à direita) */}
                <th
                  scope="col"
                  className="sticky right-0 z-40 bg-[#e0f2fe] px-3 py-2 text-right font-bold text-slate-900 border-l border-sky-200 min-w-[95px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]"
                >
                  Total Geral
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* ===============================================================
                  BLOCO 1: PEDIDOS TT (Exatamente como na primeira seção da imagem)
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'pedidos') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.pedidos[modalName] || { total: 0 }
                    return (
                      <tr key={`ped-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        {/* Nome do Modal (sem numeração) */}
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>

                        {/* Valores diários */}
                        {matrix.days.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`ped-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}

                        {/* Total do Modal */}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(rowData.total)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Pedidos TT */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Pedidos TT
                    </td>
                    {matrix.days.map((d) => (
                      <td 
                        key={`ped-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.pedidos[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(matrix.totals.pedidos.total)}
                    </td>
                  </tr>

                  {/* Espaçador visual se 'all' estiver ativo */}
                  {selectedSection === 'all' && (
                    <tr className="bg-slate-100/50 h-3">
                      <td colSpan={matrix.days.length + 2} className="p-0 border-y border-slate-200"></td>
                    </tr>
                  )}
                </>
              )}

              {/* ===============================================================
                  BLOCO 2: PEÇAS TT (Segunda seção da imagem)
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'pecas') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.pecas[modalName] || { total: 0 }
                    return (
                      <tr key={`pec-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        {/* Nome do Modal (sem numeração) */}
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>

                        {/* Valores diários */}
                        {matrix.days.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`pec-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}

                        {/* Total do Modal */}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(rowData.total)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Peças TT */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Peças TT
                    </td>
                    {matrix.days.map((d) => (
                      <td 
                        key={`pec-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.pecas[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(matrix.totals.pecas.total)}
                    </td>
                  </tr>

                  {/* Espaçador visual se 'all' estiver ativo */}
                  {selectedSection === 'all' && (
                    <tr className="bg-slate-100/50 h-3">
                      <td colSpan={matrix.days.length + 2} className="p-0 border-y border-slate-200"></td>
                    </tr>
                  )}
                </>
              )}

              {/* ===============================================================
                  BLOCO 3: CUBAGEM TT (Terceira seção da imagem)
                  =============================================================== */}
              {(selectedSection === 'all' || selectedSection === 'cubagem') && (
                <>
                  {filteredModals.map((modalName) => {
                    const rowData = matrix.data.cubagem[modalName] || { total: 0 }
                    return (
                      <tr key={`cub-${modalName}`} className="hover:bg-blue-50/40 transition-colors">
                        {/* Nome do Modal (sem numeração) */}
                        <td className="sticky left-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                          {cleanModalName(modalName)}
                        </td>

                        {/* Valores diários */}
                        {matrix.days.map((d) => {
                          const val = rowData[d.dayStr] || 0
                          const isZero = val === 0
                          return (
                            <td 
                              key={`cub-${modalName}-${d.dayStr}`}
                              className={`px-1.5 py-1.5 text-center font-mono text-[11px] border-r border-slate-100 ${
                                isZero ? 'text-slate-400 italic' : 'text-slate-800'
                              }`}
                            >
                              {formatNum(val)}
                            </td>
                          )
                        })}

                        {/* Total do Modal */}
                        <td className="sticky right-0 z-20 bg-white hover:bg-inherit px-3 py-1.5 text-right font-mono font-semibold text-slate-900 border-l border-slate-200 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                          {formatNum(rowData.total)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Linha de Totalização: Cubagem TT */}
                  <tr className="bg-[#e0f2fe]/90 border-y-2 border-sky-300 font-bold">
                    <td className="sticky left-0 z-20 bg-[#e0f2fe] px-3 py-2 font-bold text-blue-900 border-r border-sky-300 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      Cubagem TT
                    </td>
                    {matrix.days.map((d) => (
                      <td 
                        key={`cub-tt-${d.dayStr}`}
                        className="px-1.5 py-2 text-center font-mono font-bold text-blue-900 border-r border-sky-200 text-[11px]"
                      >
                        {formatNum(matrix.totals.cubagem[d.dayStr])}
                      </td>
                    ))}
                    <td className="sticky right-0 z-20 bg-[#e0f2fe] px-3 py-2 text-right font-mono font-bold text-blue-900 border-l border-sky-300 text-[11px] shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      {formatNum(matrix.totals.cubagem.total)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer com Resumo e Legenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#e0f2fe] border border-sky-300"></span>
            <span>Totais Gerais (Pedidos TT: <strong>{formatNum(matrix.totals.pedidos.total)}</strong>, Peças TT: <strong>{formatNum(matrix.totals.pecas.total)}</strong>, Cubagem TT: <strong>{formatNum(matrix.totals.cubagem.total)}</strong>)</span>
          </span>
        </div>
        <div className="text-right text-[11px] font-mono text-slate-400">
          Base: CD {cd} • Outubro/2026 • 31 dias mapeados
        </div>
      </div>
    </div>
  )
}
