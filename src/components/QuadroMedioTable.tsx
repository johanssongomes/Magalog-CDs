import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Download,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

// Dias da semana simplificados para o cabeçalho (D, S, T, Q, Q, S, S)
const WEEKDAY_ABBR = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
]

interface SectionData {
  initial: number
  // Mapa de dia (1..N) para valores numéricos
  orcado: Record<number, number>
  saidaFerias: Record<number, number>
  retornoFerias: Record<number, number>
  saidas: Record<number, number>
  entradas: Record<number, number>
}

interface QuadroMedioState {
  op: SectionData
  cd: SectionData
}

export function QuadroMedioTable() {
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    // Padrão atual ou Outubro (índice 9) se for outubro
    const current = new Date().getMonth()
    return current
  })
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())

  // Chave de persistência local por mês/ano
  const storageKey = `quadro_medio_data_${selectedYear}_${selectedMonth}`

  // Estado das tabelas OP e C&D
  const [data, setData] = useState<QuadroMedioState>(() => {
    try {
      const saved = localStorage.getItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Erro ao ler dados salvos:', e)
    }
    // Valores padrão iniciais ilustrativos conforme imagem do usuário
    return {
      op: {
        initial: 102,
        orcado: { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100, 10: 100, 11: 100, 12: 100, 13: 103, 14: 103, 15: 103, 16: 103, 17: 103, 18: 103, 19: 106, 20: 106, 21: 106, 22: 106, 23: 106, 24: 106, 25: 106, 26: 109, 27: 109, 28: 109, 29: 109, 30: 109, 31: 109 },
        saidaFerias: { 5: 4, 13: 2 },
        retornoFerias: { 1: 6, 17: 1, 21: 1 },
        saidas: { 6: 4 },
        entradas: { 13: 4, 19: 1, 26: 3 }
      },
      cd: {
        initial: 44,
        orcado: { 1: 54, 2: 54, 3: 54, 4: 54, 5: 54, 6: 54, 7: 54, 8: 54, 9: 54, 10: 54, 11: 54, 12: 54, 13: 54, 14: 54, 15: 54, 16: 54, 17: 54, 18: 54, 19: 54, 20: 54, 21: 54, 22: 54, 23: 54, 24: 54, 25: 54, 26: 54, 27: 54, 28: 54, 29: 54, 30: 54, 31: 54 },
        saidaFerias: { 5: 1, 13: 1 },
        retornoFerias: { 1: 1 },
        saidas: { 2: 1, 6: 1, 11: 4, 14: 1, 19: 1, 20: 1 },
        entradas: { 7: 1, 9: 1, 14: 1, 15: 1, 19: 3, 20: 1 }
      }
    }
  })

  // Carrega ao mudar mês/ano
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`)
      if (saved) {
        setData(JSON.parse(saved))
      } else {
        // Inicializa vazio ou padrão
        setData({
          op: { initial: 102, orcado: {}, saidaFerias: {}, retornoFerias: {}, saidas: {}, entradas: {} },
          cd: { initial: 44, orcado: {}, saidaFerias: {}, retornoFerias: {}, saidas: {}, entradas: {} }
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, [selectedMonth, selectedYear])

  // Salva no localStorage sempre que houver alteração
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const saveData = (newData: QuadroMedioState) => {
    setData(newData)
    try {
      localStorage.setItem(`quadro_medio_data_${selectedYear}_${selectedMonth}`, JSON.stringify(newData))
      setSaveStatus('Salvo!')
      setTimeout(() => setSaveStatus(null), 1500)
    } catch (e) {
      console.error('Erro ao salvar:', e)
    }
  }

  // Quantidade de dias no mês selecionado
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }, [selectedMonth, selectedYear])

  // Array com dados dos dias (número e sigla do dia da semana)
  const daysList = useMemo(() => {
    const list = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, selectedMonth, d)
      const dayOfWeek = date.getDay() // 0 = Domingo
      list.push({
        day: d,
        weekday: WEEKDAY_ABBR[dayOfWeek]
      })
    }
    return list
  }, [daysInMonth, selectedMonth, selectedYear])

  // Função genérica de atualização de célula
  const handleCellChange = (
    section: 'op' | 'cd',
    field: 'orcado' | 'saidaFerias' | 'retornoFerias' | 'saidas' | 'entradas',
    day: number,
    value: string
  ) => {
    const numValue = value === '' ? 0 : Number(value)
    if (isNaN(numValue)) return

    const newData: QuadroMedioState = {
      ...data,
      [section]: {
        ...data[section],
        [field]: {
          ...data[section][field],
          [day]: numValue
        }
      }
    }
    saveData(newData)
  }

  // Atualização do valor Inicial (Dia 0)
  const handleInitialChange = (section: 'op' | 'cd', value: string) => {
    const numValue = value === '' ? 0 : Number(value)
    if (isNaN(numValue)) return

    const newData: QuadroMedioState = {
      ...data,
      [section]: {
        ...data[section],
        initial: numValue
      }
    }
    saveData(newData)
  }

  // Cálculo dinâmico progressivo para cada seção
  // Fórmula demonstrada pelo usuário:
  // Quadro Atual (Dia D) = Quadro Atual (Dia D-1) - SaidaFerias + RetornoFerias + Entradas - Saidas
  // Gap = Quadro Atual - Quadro Orçado
  const calculateProgression = (section: 'op' | 'cd') => {
    const sec = data[section]
    const quadroAtualByDay: Record<number, number> = {}
    const gapByDay: Record<number, number> = {}

    let current = sec.initial || 0

    for (let d = 1; d <= daysInMonth; d++) {
      const orcado = sec.orcado[d] ?? 0
      const sFerias = sec.saidaFerias[d] ?? 0
      const rFerias = sec.retornoFerias[d] ?? 0
      const saidas = sec.saidas[d] ?? 0
      const entradas = sec.entradas[d] ?? 0

      // Quadro Atual = Anterior - SaidaFerias + RetornoFerias + Entradas - Saidas
      current = current - sFerias + rFerias + entradas - saidas
      quadroAtualByDay[d] = current
      gapByDay[d] = current - orcado
    }

    // Médias
    let sumOrcado = 0
    let countOrcado = 0
    for (let d = 1; d <= daysInMonth; d++) {
      if (sec.orcado[d] !== undefined) {
        sumOrcado += sec.orcado[d]
        countOrcado++
      }
    }
    const mediaOrcado = countOrcado > 0 ? Math.round(sumOrcado / countOrcado) : 0

    let sumAtual = 0
    for (let d = 1; d <= daysInMonth; d++) {
      sumAtual += quadroAtualByDay[d]
    }
    const mediaAtual = daysInMonth > 0 ? (sumAtual / daysInMonth).toFixed(1).replace('.', ',') : '0,0'

    let sumGap = 0
    for (let d = 1; d <= daysInMonth; d++) {
      sumGap += gapByDay[d]
    }
    const mediaGap = daysInMonth > 0 ? Math.round(sumGap / daysInMonth) : 0

    return {
      quadroAtualByDay,
      gapByDay,
      mediaOrcado,
      mediaAtual,
      mediaGap
    }
  }

  const opCalc = useMemo(() => calculateProgression('op'), [data.op, daysInMonth])
  const cdCalc = useMemo(() => calculateProgression('cd'), [data.cd, daysInMonth])

  // Navegar entre meses
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  // Preenchimento rápido de Quadro Orçado para o mês todo
  const applyOrcadoAll = (section: 'op' | 'cd') => {
    const currentFirst = data[section].orcado[1] || (section === 'op' ? 100 : 54)
    const promptVal = window.prompt(
      `Definir Quadro Orçado para todos os ${daysInMonth} dias de ${MONTH_NAMES[selectedMonth]} (${section.toUpperCase()}):`,
      String(currentFirst)
    )
    if (promptVal === null) return
    const num = Number(promptVal)
    if (isNaN(num)) return

    const newOrcado: Record<number, number> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      newOrcado[d] = num
    }

    const newData: QuadroMedioState = {
      ...data,
      [section]: {
        ...data[section],
        orcado: newOrcado
      }
    }
    saveData(newData)
  }

  // Exportar para CSV
  const exportCSV = () => {
    const monthName = MONTH_NAMES[selectedMonth]
    let csv = `QUADRO MEDIO - ${monthName}/${selectedYear}\n\n`

    const addSection = (title: string, section: 'op' | 'cd', calc: any) => {
      csv += `${title};Inicio;` + daysList.map((d) => `${d.weekday} ${d.day}`).join(';') + `;Media\n`
      // DATA
      csv += `DATA;0;` + daysList.map((d) => d.day).join(';') + `;\n`
      // Quadro Orçado
      csv += `Quadro Orçado;;` + daysList.map((d) => data[section].orcado[d.day] ?? '').join(';') + `;${calc.mediaOrcado}\n`
      // Saida de Ferias
      csv += `Saida de Ferias;;` + daysList.map((d) => data[section].saidaFerias[d.day] ?? '').join(';') + `;\n`
      // Retorno de Ferias
      csv += `Retorno de Ferias;;` + daysList.map((d) => data[section].retornoFerias[d.day] ?? '').join(';') + `;\n`
      // Saida(s)
      csv += `Saida(s);;` + daysList.map((d) => data[section].saidas[d.day] ?? '').join(';') + `;\n`
      // Entrada(s)
      csv += `Entrada(s);;` + daysList.map((d) => data[section].entradas[d.day] ?? '').join(';') + `;\n`
      // Quadro Atual
      csv += `Quadro Atual;${data[section].initial};` + daysList.map((d) => calc.quadroAtualByDay[d.day]).join(';') + `;${calc.mediaAtual}\n`
      // Gap
      csv += `Gap;;` + daysList.map((d) => calc.gapByDay[d.day]).join(';') + `;${calc.mediaGap}\n\n`
    }

    addSection(`${monthName} - OP`, 'op', opCalc)
    addSection(`${monthName} - C&D`, 'cd', cdCalc)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Quadro_Medio_${monthName}_${selectedYear}.csv`
    link.click()
  }

  // Renderizador de cada Grade
  const renderGridSection = (
    title: string,
    section: 'op' | 'cd',
    calc: ReturnType<typeof calculateProgression>,
    themeColor: 'blue' | 'wine'
  ) => {
    const isBlue = themeColor === 'blue'
    const headerBg = isBlue ? 'bg-[#003882]' : 'bg-[#5c1d38]'
    const headerBorder = isBlue ? 'border-[#00275c]' : 'border-[#431427]'
    const gapHighlightClass = isBlue
      ? (val: number) =>
          val >= 0
            ? 'bg-[#00a8e8] text-white font-bold'
            : 'bg-[#d9383a] text-white font-bold'
      : (val: number) =>
          val >= 0
            ? 'bg-[#00a8e8] text-white font-bold'
            : 'bg-[#80224b] text-white font-bold'

    return (
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden mb-6">
        {/* Barra superior de título e ferramentas */}
        <div className={`${headerBg} text-white px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-wide">
              {MONTH_NAMES[selectedMonth]} - {title}
            </span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-mono">
              Fórmula: Atual = Ant - Férias(S) + Férias(R) + Ent - Saí
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyOrcadoAll(section)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 rounded transition cursor-pointer text-white border border-white/20"
              title="Preencher Quadro Orçado em lote para o mês"
            >
              Preencher Orçado
            </button>
          </div>
        </div>

        {/* Tabela estilo planilha Excel */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-center border-collapse text-[11px] font-sans">
            <thead>
              {/* Linha 1: Nome da Seção + Dias da Semana (D, S, T, Q, Q, S, S) */}
              <tr className={`${headerBg} text-white font-bold text-[10px]`}>
                <th className={`border ${headerBorder} px-3 py-1 text-left w-36 uppercase tracking-wider`}>
                  {MONTH_NAMES[selectedMonth]} - {title}
                </th>
                <th className={`border ${headerBorder} px-1.5 py-1 w-12 bg-black/10`}>Inicio</th>
                {daysList.map((d) => (
                  <th key={d.day} className={`border ${headerBorder} px-1 py-1 min-w-[28px] max-w-[32px]`}>
                    {d.weekday}
                  </th>
                ))}
                <th className={`border ${headerBorder} px-2 py-1 w-24 bg-black/20 text-center font-bold text-[10px]`}>
                  Média QD Mês
                </th>
              </tr>

              {/* Linha 2: DATA + 0 + Dias do Mês (1..31) */}
              <tr className={`${headerBg} text-white font-bold text-[10px]`}>
                <th className={`border ${headerBorder} px-3 py-1 text-left italic`}>DATA</th>
                <th className={`border ${headerBorder} px-1.5 py-1 bg-black/10`}>0</th>
                {daysList.map((d) => (
                  <th key={d.day} className={`border ${headerBorder} px-1 py-1`}>
                    {d.day}
                  </th>
                ))}
                <th className={`border ${headerBorder} px-2 py-1 bg-black/20 text-center text-[10px]`}>
                  Aprovado
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Linha 3: Quadro Orçado (Manual) */}
              <tr className="hover:bg-slate-50 border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-semibold text-left italic text-slate-800 bg-slate-50/50">
                  Quadro Orçado
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => (
                  <td key={d.day} className="border border-slate-300 p-0">
                    <input
                      type="number"
                      value={data[section].orcado[d.day] ?? ''}
                      onChange={(e) => handleCellChange(section, 'orcado', d.day, e.target.value)}
                      placeholder=""
                      className="w-full h-7 text-center font-semibold text-slate-800 focus:bg-amber-50 focus:outline-blue-500 text-[11px] bg-transparent border-0"
                    />
                  </td>
                ))}
                {/* Média Orçado (Destaque Amarelo idêntico ao print) */}
                <td className="border border-slate-300 bg-[#ffff00] font-black text-slate-900 text-xs px-2">
                  {calc.mediaOrcado}
                </td>
              </tr>

              {/* Linha 4: Saida de Ferias (Manual) */}
              <tr className="hover:bg-slate-50 border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-semibold text-left italic text-slate-800 bg-slate-50/50">
                  Saida de Ferias
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => (
                  <td key={d.day} className="border border-slate-300 p-0 relative group">
                    <input
                      type="number"
                      value={data[section].saidaFerias[d.day] ?? ''}
                      onChange={(e) => handleCellChange(section, 'saidaFerias', d.day, e.target.value)}
                      className="w-full h-7 text-center font-bold text-slate-800 focus:bg-amber-50 focus:outline-blue-500 text-[11px] bg-transparent border-0"
                    />
                    {data[section].saidaFerias[d.day] ? (
                      <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-amber-500 border-l-transparent pointer-events-none" />
                    ) : null}
                  </td>
                ))}
                <td className="border border-slate-300 bg-slate-50"></td>
              </tr>

              {/* Linha 5: Retorno de Ferias (Manual) */}
              <tr className="hover:bg-slate-50 border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-semibold text-left italic text-slate-800 bg-slate-50/50">
                  Retorno de Ferias
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => (
                  <td key={d.day} className="border border-slate-300 p-0 relative">
                    <input
                      type="number"
                      value={data[section].retornoFerias[d.day] ?? ''}
                      onChange={(e) => handleCellChange(section, 'retornoFerias', d.day, e.target.value)}
                      className="w-full h-7 text-center font-bold text-slate-800 focus:bg-amber-50 focus:outline-blue-500 text-[11px] bg-transparent border-0"
                    />
                    {data[section].retornoFerias[d.day] ? (
                      <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-amber-500 border-l-transparent pointer-events-none" />
                    ) : null}
                  </td>
                ))}
                <td className="border border-slate-300 bg-slate-50"></td>
              </tr>

              {/* Linha 6: Saida(s) (Manual) */}
              <tr className="hover:bg-slate-50 border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-semibold text-left italic text-slate-800 bg-slate-50/50">
                  Saida(s)
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => (
                  <td key={d.day} className="border border-slate-300 p-0 relative">
                    <input
                      type="number"
                      value={data[section].saidas[d.day] ?? ''}
                      onChange={(e) => handleCellChange(section, 'saidas', d.day, e.target.value)}
                      className="w-full h-7 text-center font-bold text-slate-800 focus:bg-amber-50 focus:outline-blue-500 text-[11px] bg-transparent border-0"
                    />
                    {data[section].saidas[d.day] ? (
                      <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-amber-500 border-l-transparent pointer-events-none" />
                    ) : null}
                  </td>
                ))}
                <td className="border border-slate-300 bg-slate-50"></td>
              </tr>

              {/* Linha 7: Entrada(s) (Manual) */}
              <tr className="hover:bg-slate-50 border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-semibold text-left italic text-slate-800 bg-slate-50/50">
                  Entrada(s)
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => (
                  <td key={d.day} className="border border-slate-300 p-0 relative">
                    <input
                      type="number"
                      value={data[section].entradas[d.day] ?? ''}
                      onChange={(e) => handleCellChange(section, 'entradas', d.day, e.target.value)}
                      className="w-full h-7 text-center font-bold text-slate-800 focus:bg-amber-50 focus:outline-blue-500 text-[11px] bg-transparent border-0"
                    />
                    {data[section].entradas[d.day] ? (
                      <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-amber-500 border-l-transparent pointer-events-none" />
                    ) : null}
                  </td>
                ))}
                <td className="border border-slate-300 bg-slate-50"></td>
              </tr>

              {/* Linha 8: Quadro Atual (Fórmula Automática) */}
              <tr className="bg-slate-50/70 border-b border-slate-300 font-bold">
                <td className="border border-slate-300 px-3 py-1 text-left italic text-slate-900 font-black">
                  Quadro Atual
                </td>
                {/* Início (Dia 0) configurável */}
                <td className="border border-slate-300 p-0 bg-slate-100 font-black text-slate-900">
                  <input
                    type="number"
                    step="0.5"
                    value={data[section].initial}
                    onChange={(e) => handleInitialChange(section, e.target.value)}
                    title="Quadro inicial no dia 0"
                    className="w-full h-7 text-center font-black text-slate-900 bg-transparent border-0 focus:bg-amber-50 focus:outline-blue-500 text-[11px]"
                  />
                </td>
                {daysList.map((d) => {
                  const val = calc.quadroAtualByDay[d.day]
                  return (
                    <td
                      key={d.day}
                      className="border border-slate-300 px-1 py-1 text-slate-900 font-bold whitespace-nowrap bg-white"
                    >
                      {val.toFixed(1).replace('.', ',')}
                    </td>
                  )
                })}
                {/* Média Quadro Atual */}
                <td className="border border-slate-300 bg-white font-bold text-slate-900 text-xs px-2">
                  {calc.mediaAtual}
                </td>
              </tr>

              {/* Linha 9: Gap (Fórmula Automática: Quadro Atual - Quadro Orçado) */}
              <tr className="border-b border-slate-300">
                <td className="border border-slate-300 px-3 py-1 font-black text-left italic text-slate-900 bg-slate-50/50">
                  Gap
                </td>
                <td className="border border-slate-300 bg-slate-200"></td>
                {daysList.map((d) => {
                  const val = calc.gapByDay[d.day]
                  const cls = gapHighlightClass(val)
                  return (
                    <td key={d.day} className={`border border-slate-300 px-1 py-1 ${cls} text-[10px]`}>
                      {val > 0 ? `${val.toFixed(1).replace('.', ',')}` : val.toFixed(1).replace('.', ',')}
                    </td>
                  )
                })}
                {/* Média Gap */}
                <td className={`border border-slate-300 ${gapHighlightClass(calc.mediaGap)} text-xs px-2`}>
                  {calc.mediaGap}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de Controles Superiores: Navegação de Mês, Ano e Ações */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 hover:text-blue-600 transition shadow-2xs cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="font-extrabold text-sm text-slate-800 tracking-wide">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 hover:text-blue-600 transition shadow-2xs cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Seletores rápidos */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-blue-500 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-blue-500 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status e Ações */}
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-fade-in">
              <CheckCircle2 size={13} />
              {saveStatus}
            </span>
          )}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs hover:text-blue-600"
            title="Exportar planilha em formato CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Informativo explicativo das fórmulas */}
      <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold">Como funcionam os cálculos da grade:</p>
          <p className="text-[11px] text-blue-800">
            &bull; <strong>Quadro Atual (Dia D)</strong> = <code className="bg-white/80 px-1 py-0.5 rounded text-blue-950 font-bold font-mono">Quadro Atual (Dia D-1) - Saída de Férias + Retorno de Férias + Entrada(s) - Saída(s)</code> (inicia no valor do dia 0 / Início).
          </p>
          <p className="text-[11px] text-blue-800">
            &bull; <strong>Gap</strong> = <code className="bg-white/80 px-1 py-0.5 rounded text-blue-950 font-bold font-mono">Quadro Atual - Quadro Orçado</code>.
          </p>
          <p className="text-[11px] text-blue-800">
            &bull; Todos os campos manuais (Orçado, Férias, Entradas e Saídas) são editáveis diretamente e ficam salvos para cada mês e ano.
          </p>
        </div>
      </div>

      {/* Grade 1: OUTUBRO - OP (Tema Azul) */}
      {renderGridSection('OP', 'op', opCalc, 'blue')}

      {/* Grade 2: OUTUBRO - C&D (Tema Vinho/Bordeaux) */}
      {renderGridSection('C&D', 'cd', cdCalc, 'wine')}
    </div>
  )
}
