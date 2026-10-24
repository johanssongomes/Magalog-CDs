import React, { useEffect, useState, useMemo } from 'react'
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Tag, 
  Layers, 
  Calendar, 
  Globe, 
  Download, 
  ChevronDown, 
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers3,
  CheckCircle2
} from 'lucide-react'

export interface PromocionalItem {
  ibm: string
  gemco: string
  descricao: string
  familia: string
  linha: string
  campanha: string
  dataInicio: string
  dataValidade: string
  regiao: string
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Vn3qZEQIDOpF1K1EqxKo_KNY_7DWw4_I0eEf-Ap378E/edit?gid=0#gid=0'
const CSV_EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1Vn3qZEQIDOpF1K1EqxKo_KNY_7DWw4_I0eEf-Ap378E/export?format=csv&gid=0'

export const PromocionaisTable: React.FC = () => {
  const [items, setItems] = useState<PromocionalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  // Filtros
  const [search, setSearch] = useState('')
  const [selectedLinha, setSelectedLinha] = useState<string>('all')
  const [selectedFamilia, setSelectedFamilia] = useState<string>('all')
  const [selectedCampanha, setSelectedCampanha] = useState<string>('all')
  const [selectedRegiao, setSelectedRegiao] = useState<string>('all')

  // Parse CSV robusto com suporte a aspas e quebras de linha
  const parseCSV = (csvText: string) => {
    // Localizar linha inicial do cabeçalho
    const p = csvText.indexOf('IBM,GEMCO')
    if (p === -1) {
      throw new Error('Cabeçalho da planilha não encontrado ou formato incompatível.')
    }

    // Tentar capturar a data de atualização no topo
    const topChunk = csvText.substring(0, p)
    const updateMatch = topChunk.match(/\*?Atualizado\s*,\s*([^\r\n,]+)/i)
    if (updateMatch && updateMatch[1]) {
      setLastUpdated(updateMatch[1].trim())
    }

    const csvData = csvText.substring(p)
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentVal = ''
    let inQuotes = false

    for (let i = 0; i < csvData.length; i++) {
      const char = csvData[i]
      const nextChar = csvData[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim())
        currentVal = ''
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++
        currentRow.push(currentVal.trim())
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        currentVal = ''
      } else {
        currentVal += char
      }
    }
    if (currentVal || currentRow.length > 0) {
      currentRow.push(currentVal.trim())
      rows.push(currentRow)
    }

    if (rows.length <= 1) return []

    // Mapear linhas para itens promocionais
    // Colunas: [0: IBM, 1: GEMCO, 2: DESCRIÇÃO, 3: FAMÍLIA, 4: LINHA, 5: CAMPANHA, 6: DATA_INICIO, 7: DATA_VALIDADE, 8: REGIÃO]
    const parsedItems: PromocionalItem[] = []
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const ibm = row[0] || ''
      const descricao = row[2] || ''
      if (!ibm && !descricao) continue

      parsedItems.push({
        ibm: ibm,
        gemco: row[1] || '',
        descricao: descricao,
        familia: row[3] || '',
        linha: row[4] || '',
        campanha: row[5] || '',
        dataInicio: row[6] || '',
        dataValidade: row[7] || '',
        regiao: row[8] || 'BR'
      })
    }

    return parsedItems
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(CSV_EXPORT_URL)
      if (!res.ok) {
        throw new Error(`Erro ao acessar planilha Google (Status ${res.status})`)
      }
      const text = await res.text()
      const data = parseCSV(text)
      setItems(data)
      localStorage.setItem('magalog_pmt_promocionais_cache', JSON.stringify({
        data,
        cachedAt: new Date().toISOString()
      }))
    } catch (err: any) {
      console.warn('Erro ao carregar dados online da planilha:', err)
      // Tentar recuperar cache se houver
      const cached = localStorage.getItem('magalog_pmt_promocionais_cache')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setItems(parsed.data || [])
          setError('Exibindo dados em cache local (sem conexão direta com a planilha no momento).')
          return
        } catch {}
      }
      setError(err.message || 'Falha ao sincronizar dados com o Google Sheets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Opções para selects de filtro
  const linhasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.linha) set.add(i.linha) })
    return Array.from(set).sort()
  }, [items])

  const familiasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.familia) set.add(i.familia) })
    return Array.from(set).sort()
  }, [items])

  const campanhasOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.campanha) set.add(i.campanha) })
    return Array.from(set).sort()
  }, [items])

  const regioesOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => { if (i.regiao) set.add(i.regiao) })
    return Array.from(set).sort()
  }, [items])

  // Itens filtrados
  const filteredItems = useMemo(() => {
    const s = search.toLowerCase().trim()
    return items.filter(item => {
      const matchSearch = !s || 
        item.ibm.toLowerCase().includes(s) ||
        item.gemco.toLowerCase().includes(s) ||
        item.descricao.toLowerCase().includes(s) ||
        item.familia.toLowerCase().includes(s) ||
        item.linha.toLowerCase().includes(s) ||
        item.campanha.toLowerCase().includes(s)

      const matchLinha = selectedLinha === 'all' || item.linha === selectedLinha
      const matchFamilia = selectedFamilia === 'all' || item.familia === selectedFamilia
      const matchCampanha = selectedCampanha === 'all' || item.campanha === selectedCampanha
      const matchRegiao = selectedRegiao === 'all' || item.regiao === selectedRegiao

      return matchSearch && matchLinha && matchFamilia && matchCampanha && matchRegiao
    })
  }, [items, search, selectedLinha, selectedFamilia, selectedCampanha, selectedRegiao])

  // Exportar CSV dos itens filtrados
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return
    const headers = ['IBM', 'GEMCO', 'DESCRIÇÃO', 'FAMÍLIA', 'LINHA', 'CAMPANHA', 'DATA INÍCIO', 'DATA VALIDADE', 'REGIÃO']
    const csvRows = [headers.join(';')]

    filteredItems.forEach(i => {
      csvRows.push([
        `"${i.ibm}"`,
        `"${i.gemco}"`,
        `"${i.descricao.replace(/"/g, '""')}"`,
        `"${i.familia.replace(/"/g, '""')}"`,
        `"${i.linha.replace(/"/g, '""')}"`,
        `"${i.campanha.replace(/"/g, '""')}"`,
        `"${i.dataInicio}"`,
        `"${i.dataValidade}"`,
        `"${i.regiao}"`
      ].join(';'))
    })

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `promocionais_cd994_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Banner Superior & Controles de Conexão com Google Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={24} className="text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">
                Itens Promocionais • Aba NE/NO/CO
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Planilha Conectada
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 font-mono">
                  (Atualizado: {lastUpdated})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta dinâmica direta da planilha oficial de itens promocionais, campanhas e prazos de validade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Recarregar dados da planilha Google"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs"
            title="Abrir planilha no Google Sheets"
          >
            <ExternalLink size={14} />
            <span>Abrir Planilha</span>
          </a>

          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Exportar dados filtrados em CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Itens</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {loading ? '...' : items.length.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">SKUs Promocionais cadastrados</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Tag size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campanhas Ativas</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {loading ? '...' : campanhasOptions.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Segmentadas na aba NE/NO/CO</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Linhas de Produto</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {loading ? '...' : linhasOptions.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Departamentos envolvidos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Itens Filtrados</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : filteredItems.length.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Visíveis na tabela abaixo</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Filter size={20} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Campo Busca */}
          <div className="lg:col-span-2 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição, IBM, GEMCO, linha, família ou campanha..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filtro Linha */}
          <div>
            <select
              value={selectedLinha}
              onChange={(e) => setSelectedLinha(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="all">Todas as Linhas ({linhasOptions.length})</option>
              {linhasOptions.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Filtro Campanha */}
          <div>
            <select
              value={selectedCampanha}
              onChange={(e) => setSelectedCampanha(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="all">Todas as Campanhas ({campanhasOptions.length})</option>
              {campanhasOptions.map(c => (
                <option key={c} value={c}>{c.replace(/[\r\n]+/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Filtro Família */}
          <div>
            <select
              value={selectedFamilia}
              onChange={(e) => setSelectedFamilia(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="all">Todas as Famílias ({familiasOptions.length})</option>
              {familiasOptions.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {(search || selectedLinha !== 'all' || selectedFamilia !== 'all' || selectedCampanha !== 'all' || selectedRegiao !== 'all') && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filtro ativo: exibindo <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> registros
            </span>
            <button
              onClick={() => {
                setSearch('')
                setSelectedLinha('all')
                setSelectedFamilia('all')
                setSelectedCampanha('all')
                setSelectedRegiao('all')
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Alerta de erro se houver */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Tabela de Itens Promocionais */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3.5 py-3 font-mono">IBM</th>
                <th className="px-3 py-3 font-mono">GEMCO</th>
                <th className="px-4 py-3">Descrição do Produto</th>
                <th className="px-3.5 py-3">Família</th>
                <th className="px-3.5 py-3">Linha</th>
                <th className="px-3.5 py-3">Campanha</th>
                <th className="px-3 py-3 text-center">Data Início</th>
                <th className="px-3 py-3 text-center">Data Validade</th>
                <th className="px-3 py-3 text-center">Região</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Carregando itens promocionais da planilha...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet size={32} className="text-slate-300" />
                      <span className="text-xs font-semibold">Nenhum item promocional encontrado com os filtros selecionados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr 
                    key={`${item.ibm}-${idx}`}
                    className="hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {item.ibm}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {item.gemco}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 max-w-xs truncate" title={item.descricao}>
                      {item.descricao}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {item.familia || '-'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                        {item.linha || '-'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800 text-[11px] max-w-xs truncate" title={item.campanha}>
                      <span className="font-semibold text-indigo-900">
                        {item.campanha ? item.campanha.replace(/[\r\n]+/g, ' ') : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {item.dataInicio || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10.5px] font-bold">
                        {item.dataValidade || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {item.regiao || 'BR'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Aba <strong>NE/NO/CO</strong> sincronizada diretamente com a base Promocionais.</span>
          </div>
          <div>
            Mostrando <strong className="text-slate-800">{filteredItems.length}</strong> de <strong className="text-slate-800">{items.length}</strong> itens
          </div>
        </div>
      </div>
    </div>
  )
}
