import React, { useMemo, useState } from 'react'
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  Truck,
  Building2,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ChevronRight,
  Filter
} from 'lucide-react'
import initialPivotData from '../data/supply_pivot_summary.json'

// Mapeamento das filiais por Regional
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

interface SupplyDashboardOverviewProps {
  onNavigateToPainel?: (status: 'LOJA COM FISICO' | 'LOJA SEM FISICO', linha?: string) => void
}

export const SupplyDashboardOverview: React.FC<SupplyDashboardOverviewProps> = ({
  onNavigateToPainel
}) => {
  // Filtros internos do Dashboard
  const [selectedRegional, setSelectedRegional] = useState<'TODOS' | 'Thiago' | 'Outros Regionais'>('TODOS')
  const [selectedLinhaFilter, setSelectedLinhaFilter] = useState<string>('TODAS')
  const [filiaisSort, setFiliaisSort] = useState<'VOLUME_DESC' | 'VOLUME_ASC' | 'RUPTURA_DESC'>('VOLUME_DESC')

  // Processamento e Agregação de dados com base no cache supply_pivot_summary
  const metrics = useMemo(() => {
    const summary = (initialPivotData.summary || {}) as Record<string, Record<string, any>>
    const filiaisList = (initialPivotData.filiais || []) as number[]

    let cdFisico = 0
    let cdTransito = 0
    let cdEstoque = 0
    let lojasFisico = 0
    let lojasTransito = 0
    let totalCombinacoesLojaSku = 0
    let combinacoesComFisico = 0
    let combinacoesRuptura = 0

    const linhasAgg: Record<string, {
      linha: string
      cdFisico: number
      lojasFisico: number
      lojasTransito: number
      skusComFisico: number
      skusSemFisico: number
    }> = {}

    const filiaisAgg: Record<number, {
      filial: number
      regional: 'Thiago' | 'Outros Regionais'
      fisico: number
      transito: number
      skusComFisico: number
      skusSemFisico: number
      totalItens: number
    }> = {}

    // Inicializa filiais
    filiaisList.forEach(fil => {
      filiaisAgg[fil] = {
        filial: fil,
        regional: REGIONAL_FILIAIS_MAP[fil] || 'Outros Regionais',
        fisico: 0,
        transito: 0,
        skusComFisico: 0,
        skusSemFisico: 0,
        totalItens: 0
      }
    })

    const statuses = Object.keys(summary)

    statuses.forEach(status => {
      const isSemFisico = status === 'LOJA SEM FISICO'
      const linhasObj = summary[status] || {}

      Object.entries(linhasObj).forEach(([linha, lData]) => {
        if (!linhasAgg[linha]) {
          linhasAgg[linha] = {
            linha,
            cdFisico: 0,
            lojasFisico: 0,
            lojasTransito: 0,
            skusComFisico: 0,
            skusSemFisico: 0
          }
        }

        // Filtro de Linha
        const matchesLinha = selectedLinhaFilter === 'TODAS' || selectedLinhaFilter === linha

        if (matchesLinha) {
          linhasAgg[linha].cdFisico += lData.t994?.FISICO || 0
          cdFisico += lData.t994?.FISICO || 0
          cdTransito += lData.t994?.TRANSITO || 0
          cdEstoque += lData.t994?.ESTOQUE || 0
        }

        const skus = Object.values(lData.skus || {}) as any[]

        skus.forEach(s => {
          if (matchesLinha) {
            if (isSemFisico) {
              linhasAgg[linha].skusSemFisico++
            } else {
              linhasAgg[linha].skusComFisico++
            }
          }

          const filObj = (s.fil || {}) as Record<string, number[]>
          Object.entries(filObj).forEach(([fStr, vals]) => {
            const f = Number(fStr)
            const fRegional = REGIONAL_FILIAIS_MAP[f] || 'Outros Regionais'
            const matchesReg = selectedRegional === 'TODOS' || selectedRegional === fRegional

            if (matchesReg && matchesLinha) {
              const fisLoja = vals[0] || 0
              const transLoja = vals[2] || 0

              lojasFisico += fisLoja
              lojasTransito += transLoja
              linhasAgg[linha].lojasFisico += fisLoja
              linhasAgg[linha].lojasTransito += transLoja

              if (filiaisAgg[f]) {
                filiaisAgg[f].fisico += fisLoja
                filiaisAgg[f].transito += transLoja
                filiaisAgg[f].totalItens++

                if (fisLoja > 0) {
                  filiaisAgg[f].skusComFisico++
                  combinacoesComFisico++
                } else {
                  filiaisAgg[f].skusSemFisico++
                  combinacoesRuptura++
                }
                totalCombinacoesLojaSku++
              }
            }
          })
        })
      })
    })

    // Taxa de Disponibilidade (Presença de Físico nas Lojas)
    const taxaDisponibilidade = totalCombinacoesLojaSku > 0
      ? ((combinacoesComFisico / totalCombinacoesLojaSku) * 100).toFixed(1)
      : '0.0'

    const taxaRuptura = totalCombinacoesLojaSku > 0
      ? ((combinacoesRuptura / totalCombinacoesLojaSku) * 100).toFixed(1)
      : '0.0'

    // Razão de Cobertura CD x Lojas (Multiplicador de Capacidade)
    const razaoCapacidadeCd = lojasFisico > 0 ? (cdFisico / lojasFisico).toFixed(1) : '0.0'

    // Linhas ordenadas por volume do CD
    const topLinhas = Object.values(linhasAgg)
      .sort((a, b) => b.cdFisico - a.cdFisico)

    // Lista de Lojas filtrada e ordenada
    let lojasFiltradas = Object.values(filiaisAgg)
    if (selectedRegional !== 'TODOS') {
      lojasFiltradas = lojasFiltradas.filter(l => l.regional === selectedRegional)
    }

    if (filiaisSort === 'VOLUME_DESC') {
      lojasFiltradas.sort((a, b) => b.fisico - a.fisico)
    } else if (filiaisSort === 'VOLUME_ASC') {
      lojasFiltradas.sort((a, b) => a.fisico - b.fisico)
    } else if (filiaisSort === 'RUPTURA_DESC') {
      lojasFiltradas.sort((a, b) => b.skusSemFisico - a.skusSemFisico)
    }

    // Totais por Regional para o comparativo
    const thiagoTotalFisico = Object.values(filiaisAgg)
      .filter(l => l.regional === 'Thiago')
      .reduce((acc, l) => acc + l.fisico, 0)

    const outrosTotalFisico = Object.values(filiaisAgg)
      .filter(l => l.regional === 'Outros Regionais')
      .reduce((acc, l) => acc + l.fisico, 0)

    return {
      cdFisico,
      cdTransito,
      cdEstoque,
      lojasFisico,
      lojasTransito,
      totalGeralRede: cdFisico + lojasFisico + lojasTransito,
      taxaDisponibilidade,
      taxaRuptura,
      razaoCapacidadeCd,
      topLinhas,
      lojasFiltradas,
      thiagoTotalFisico,
      outrosTotalFisico
    }
  }, [selectedRegional, selectedLinhaFilter, filiaisSort])

  // Lista de todas as linhas de produto para o seletor
  const listaTodasLinhas = useMemo(() => {
    const summary = (initialPivotData.summary || {}) as Record<string, Record<string, any>>
    const set = new Set<string>()
    Object.values(summary).forEach(obj => {
      Object.keys(obj).forEach(l => set.add(l))
    })
    return Array.from(set).sort()
  }, [])

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. BARRA SUPERIOR DE FILTROS EXECUTIVOS DO DASHBOARD */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Regional */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Building2 size={14} className="text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Regional:</span>
            <select
              value={selectedRegional}
              onChange={(e) => setSelectedRegional(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Regionais (45 lojas)</option>
              <option value="Thiago">Thiago (32 lojas)</option>
              <option value="Outros Regionais">Outros Regionais (13 lojas)</option>
            </select>
          </div>

          {/* Seletor de Linha / Categoria */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Layers size={14} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Linha:</span>
            <select
              value={selectedLinhaFilter}
              onChange={(e) => setSelectedLinhaFilter(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="TODAS">Todas as Linhas ({listaTodasLinhas.length})</option>
              {listaTodasLinhas.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo de visualização */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Rede Ativa: {metrics.lojasFiltradas.length} Lojas</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <Sparkles size={13} />
            <span>CD Origem: 994</span>
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CARDS DE ALTO IMPACTO (TOP LEVEL KPIs ESTRATÉGICOS) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Estoque Físico no CD 994 */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Boxes size={15} />
              </span>
              Estoque Físico CD 994
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Pulmão Central
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {metrics.cdFisico.toLocaleString('pt-BR')}
            </p>
            <span className="text-xs font-bold text-slate-500">peças</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Em Trânsito CD:</span>
            <span className="font-bold text-blue-800">+{metrics.cdTransito.toLocaleString('pt-BR')} pçs</span>
          </div>
        </div>

        {/* Card 2: Estoque nas 45 Lojas */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 size={15} />
              </span>
              Estoque nas Lojas
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Ponta de Venda
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-950 leading-tight">
              {metrics.lojasFisico.toLocaleString('pt-BR')}
            </p>
            <span className="text-xs font-bold text-slate-500">peças</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Disponibilidade:</span>
            <span className="font-bold text-emerald-700">{metrics.taxaDisponibilidade}% com estoque</span>
          </div>
        </div>

        {/* Card 3: Pipeline em Trânsito para Lojas */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Truck size={15} />
              </span>
              Em Trânsito p/ Lojas
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Pipeline
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-950 leading-tight">
              {metrics.lojasTransito.toLocaleString('pt-BR')}
            </p>
            <span className="text-xs font-bold text-slate-500">peças a caminho</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Impacto no abastecimento:</span>
            <span className="font-bold text-amber-800">
              +{metrics.lojasFisico > 0 ? ((metrics.lojasTransito / metrics.lojasFisico) * 100).toFixed(1) : 0}% no estoque
            </span>
          </div>
        </div>

        {/* Card 4: Capacidade de Cobertura / Projeção */}
        <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                <TrendingUp size={15} />
              </span>
              Capacidade do CD vs Lojas
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
              Projeção
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-purple-950 leading-tight">
              {metrics.razaoCapacidadeCd}x
            </p>
            <span className="text-xs font-bold text-slate-500">o estoque da rede</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Geral da Rede:</span>
            <span className="font-bold text-purple-900">{metrics.totalGeralRede.toLocaleString('pt-BR')} pçs</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BLOCO ESTRATÉGICO: SAÚDE DO ABASTECIMENTO & REGIONAIS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lado Esquerdo (7 cols): Gráfico Comparativo das Linhas Críticas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 lg:col-span-7">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 size={16} className="text-blue-600" />
                <span>Volume por Linha: Estoque no CD 994 vs Lojas</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparativo de concentração de peças no CD versus volume pulverizado nas lojas
              </p>
            </div>
            {onNavigateToPainel && (
              <button
                type="button"
                onClick={() => onNavigateToPainel('LOJA COM FISICO')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Matriz</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Gráfico de Barras Proporcionais */}
          <div className="space-y-3 pt-1">
            {metrics.topLinhas.slice(0, 7).map(item => {
              const maxVal = Math.max(...metrics.topLinhas.slice(0, 7).map(x => x.cdFisico)) || 1
              const pctCd = Math.min(100, Math.round((item.cdFisico / maxVal) * 100))
              const pctLojas = Math.min(100, Math.round((item.lojasFisico / maxVal) * 100))

              return (
                <div key={item.linha} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[240px]" title={item.linha}>
                      {item.linha}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-blue-700 font-bold">
                        CD 994: {item.cdFisico.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Lojas: {item.lojasFisico.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className="h-full bg-blue-600 rounded-l-full transition-all duration-500"
                      style={{ width: `${pctCd}%` }}
                      title={`CD 994: ${item.cdFisico.toLocaleString('pt-BR')} peças`}
                    />
                    <div
                      className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                      style={{ width: `${pctLojas}%` }}
                      title={`Lojas: ${item.lojasFisico.toLocaleString('pt-BR')} peças`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                <span>Volume CD 994</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Volume Lojas</span>
              </span>
            </div>
            <span className="text-slate-400 font-medium">Top 7 categorias em volume</span>
          </div>
        </div>

        {/* Lado Direito (5 cols): Comparativo Regional & Ruptura */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieChartIcon size={16} className="text-indigo-600" />
                <span>Divisão por Regional</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                45 Lojas
              </span>
            </div>

            {/* Comparativo Thiago vs Outros */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-xs font-bold text-blue-900 block">Regional Thiago</span>
                <span className="text-[10.5px] text-blue-600 font-semibold block">32 Lojas Atendidas</span>
                <p className="text-xl font-black text-blue-950 mt-1">
                  {metrics.thiagoTotalFisico.toLocaleString('pt-BR')}
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {metrics.lojasFisico > 0 ? ((metrics.thiagoTotalFisico / metrics.lojasFisico) * 100).toFixed(1) : 0}% do total físico
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-xs font-bold text-purple-900 block">Outros Regionais</span>
                <span className="text-[10.5px] text-purple-600 font-semibold block">13 Lojas Atendidas</span>
                <p className="text-xl font-black text-purple-950 mt-1">
                  {metrics.outrosTotalFisico.toLocaleString('pt-BR')}
                </p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {metrics.lojasFisico > 0 ? ((metrics.outrosTotalFisico / metrics.lojasFisico) * 100).toFixed(1) : 0}% do total físico
                </span>
              </div>
            </div>

            {/* Diagnóstico de Ruptura & Ação Recomendada */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldAlert size={14} className="text-amber-600" />
                <span>Diagnóstico Operacional de Abastecimento</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                O CD 994 possui <span className="font-bold text-blue-700">{metrics.razaoCapacidadeCd}x</span> o estoque consolidado de todas as lojas, garantindo alta cobertura. 
                Porém, há <span className="font-bold text-rose-700">{metrics.taxaRuptura}%</span> de combinações de lojas com necessidade de puxada/reposição.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {onNavigateToPainel && (
              <button
                type="button"
                onClick={() => onNavigateToPainel('LOJA SEM FISICO')}
                className="w-full py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <AlertTriangle size={14} />
                <span>Ver Lojas Sem Físico (Ruptura Imediata)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TABELA EXECUTIVA: RANKING DE LOJAS & ABASTECIMENTO */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 size={16} className="text-slate-700" />
              <span>Ranking de Abastecimento das Lojas ({metrics.lojasFiltradas.length} Filiais)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Posição de estoque físico presente, trânsito a caminho e itens ativos por filial
            </p>
          </div>

          {/* Ordenação do Ranking */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <Filter size={13} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Ordenar:</span>
            <select
              value={filiaisSort}
              onChange={(e) => setFiliaisSort(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="VOLUME_DESC">Maior Volume Físico</option>
              <option value="VOLUME_ASC">Menor Volume Físico</option>
              <option value="RUPTURA_DESC">Mais Itens Sem Físico</option>
            </select>
          </div>
        </div>

        {/* Grid de Cards de Lojas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto no-scrollbar pr-1">
          {metrics.lojasFiltradas.map((l, idx) => {
            const isThiago = l.regional === 'Thiago'
            return (
              <div
                key={l.filial}
                className="p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-2xs transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-slate-900">Filial {l.filial}</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    isThiago ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {l.regional === 'Thiago' ? 'Thiago' : 'Outros'}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[10.5px] text-slate-500 font-medium">Físico:</span>
                  <span className="text-xs font-black text-slate-900">{l.fisico.toLocaleString('pt-BR')}</span>
                </div>

                <div className="flex items-baseline justify-between text-[10.5px]">
                  <span className="text-slate-400">Trânsito:</span>
                  <span className="font-bold text-amber-700">+{l.transito.toLocaleString('pt-BR')}</span>
                </div>

                <div className="flex items-baseline justify-between text-[10px]">
                  <span className="text-slate-400">Itens c/ Físico:</span>
                  <span className="font-semibold text-emerald-700">{l.skusComFisico}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
