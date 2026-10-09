import React, { useState } from 'react'
import { 
  FolderKanban, Plus, Filter, Search, Cpu, CheckCircle2, AlertTriangle, 
  Wrench, Battery, Edit3, Trash2, X, LayoutDashboard, BarChart3, Clock, Truck, ShieldAlert, DollarSign
} from 'lucide-react'

export type FinancialType = 'CAPEX' | 'OPEX'
export type EquipmentStatus = 'Em Uso' | 'Manutenção' | 'Reserva (Não utilizado)'

export interface MaintenanceRecord {
  id: string
  date: string
  description: string
  cost: number
  provider: string
  type: 'Preventiva' | 'Corretiva'
}

export interface Equipment {
  id: string
  code: string
  name: string
  category: string
  financialType: FinancialType
  cost: number // Custo de Aquisição (CAPEX) ou Valor da Locação Mensal (OPEX)
  maintenanceCost: number // Custo acumulado de manutenções
  unit: string
  status: EquipmentStatus
  battery: number
  lastCheck: string
  maintenances?: MaintenanceRecord[]
}

const INITIAL_CATEGORIES = [
  'Coletora RF',
  'Empilhadeira',
  'Transpaleteira',
  'Scanner / Leitor',
  'Impressora Térmica'
]

const INITIAL_EQUIPMENTS: Equipment[] = [
  { 
    id: '1', 
    code: 'EQP-COL-01', 
    name: 'Coletora Zebra TC21 #01', 
    category: 'Coletora RF', 
    financialType: 'CAPEX', 
    cost: 4500.00,
    maintenanceCost: 350.00,
    unit: 'CD Louveira', 
    status: 'Em Uso', 
    battery: 94, 
    lastCheck: '09/Out 08:30',
    maintenances: [
      { id: 'm1', date: '15/Set/2026', description: 'Troca de película de proteção e acionador de gatilho', cost: 350.00, provider: 'Zebra Tech', type: 'Corretiva' }
    ]
  },
  { 
    id: '2', 
    code: 'EQP-COL-02', 
    name: 'Coletora Zebra TC21 #02', 
    category: 'Coletora RF', 
    financialType: 'CAPEX', 
    cost: 4500.00,
    maintenanceCost: 0.00,
    unit: 'CD Louveira', 
    status: 'Em Uso', 
    battery: 82, 
    lastCheck: '09/Out 07:15',
    maintenances: []
  },
  { 
    id: '3', 
    code: 'EQP-EMP-05', 
    name: 'Empilhadeira Retrátil Toyota #05', 
    category: 'Empilhadeira', 
    financialType: 'OPEX', 
    cost: 3800.00, // Aluguel mensal
    maintenanceCost: 1200.00,
    unit: 'CD Cabreúva', 
    status: 'Manutenção', 
    battery: 15, 
    lastCheck: '08/Out 16:40',
    maintenances: [
      { id: 'm2', date: '08/Out/2026', description: 'Substituição do conjunto de tração hidráulica', cost: 1200.00, provider: 'Toyota Forklifts', type: 'Corretiva' }
    ]
  },
  { 
    id: '4', 
    code: 'EQP-TRN-12', 
    name: 'Transpaleteira Elétrica Still #12', 
    category: 'Transpaleteira', 
    financialType: 'OPEX', 
    cost: 2100.00, // Aluguel mensal
    maintenanceCost: 280.00,
    unit: 'CD Extrema', 
    status: 'Em Uso', 
    battery: 100, 
    lastCheck: '09/Out 06:00',
    maintenances: [
      { id: 'm3', date: '01/Out/2026', description: 'Revisão preventiva e lubrificação das rodas', cost: 280.00, provider: 'Still Brasil', type: 'Preventiva' }
    ]
  },
  { 
    id: '5', 
    code: 'EQP-SCN-08', 
    name: 'Leitor Honeywell Xenon 1950', 
    category: 'Scanner / Leitor', 
    financialType: 'CAPEX', 
    cost: 1850.00,
    maintenanceCost: 0.00,
    unit: 'CD Louveira', 
    status: 'Em Uso', 
    battery: 67, 
    lastCheck: '09/Out 09:10',
    maintenances: []
  },
  { 
    id: '6', 
    code: 'EQP-IMP-03', 
    name: 'Impressora Zebra ZT411', 
    category: 'Impressora Térmica', 
    financialType: 'CAPEX', 
    cost: 8900.00,
    maintenanceCost: 450.00,
    unit: 'CD Cabreúva', 
    status: 'Reserva (Não utilizado)', 
    battery: 100, 
    lastCheck: '07/Out 14:20',
    maintenances: [
      { id: 'm4', date: '20/Set/2026', description: 'Troca da cabeça de impressão térmica', cost: 450.00, provider: 'Zebra Tech', type: 'Corretiva' }
    ]
  }
]

type SubPage = 'dashboard' | 'list' | 'maintenance' | 'reports'

export const EquipmentsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubPage>('dashboard')
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES)
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos')
  const [selectedFinancialType, setSelectedFinancialType] = useState<string>('Todos')
  
  // Modal Criar Nova Categoria
  const [isNewCategoryInputOpen, setIsNewCategoryInputOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Modal Novo/Editar Equipamento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<string>('Coletora RF')
  const [formFinancialType, setFormFinancialType] = useState<FinancialType>('CAPEX')
  const [formCost, setFormCost] = useState<number>(0)
  const [formUnit, setFormUnit] = useState('CD Louveira')
  const [formStatus, setFormStatus] = useState<EquipmentStatus>('Em Uso')
  const [formBattery, setFormBattery] = useState(100)

  // Modal Registrar Nova Manutenção / Custo de Reparo
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false)
  const [selectedEqpForMaint, setSelectedEqpForMaint] = useState<Equipment | null>(null)
  const [maintDescription, setMaintDescription] = useState('')
  const [maintCost, setMaintCost] = useState<number>(0)
  const [maintProvider, setMaintProvider] = useState('')
  const [maintType, setMaintType] = useState<'Preventiva' | 'Corretiva'>('Corretiva')

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    if (!categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed])
    }
    setFormCategory(trimmed)
    setNewCategoryName('')
    setIsNewCategoryInputOpen(false)
  }

  const handleOpenAddModal = () => {
    setEditingId(null)
    setFormCode(`EQP-NEW-${Math.floor(10 + Math.random() * 90)}`)
    setFormName('')
    setFormCategory(categories[0] || 'Coletora RF')
    setFormFinancialType('CAPEX')
    setFormCost(4500)
    setFormUnit('CD Louveira')
    setFormStatus('Em Uso')
    setFormBattery(100)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (eqp: Equipment) => {
    setEditingId(eqp.id)
    setFormCode(eqp.code)
    setFormName(eqp.name)
    setFormCategory(eqp.category)
    setFormFinancialType(eqp.financialType || 'CAPEX')
    setFormCost(eqp.cost || 0)
    setFormUnit(eqp.unit)
    setFormStatus(eqp.status)
    setFormBattery(eqp.battery)
    setIsModalOpen(true)
  }

  const handleOpenMaintModal = (eqp: Equipment) => {
    setSelectedEqpForMaint(eqp)
    setMaintDescription('')
    setMaintCost(0)
    setMaintProvider('')
    setMaintType('Corretiva')
    setIsMaintModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setEquipments(prev => prev.filter(e => e.id !== id))
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formCode.trim()) return

    const now = new Date()
    const lastCheck = `${String(now.getDate()).padStart(2, '0')}/Out ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    if (editingId) {
      setEquipments(prev => prev.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            code: formCode,
            name: formName,
            category: formCategory,
            financialType: formFinancialType,
            cost: Number(formCost) || 0,
            unit: formUnit,
            status: formStatus,
            battery: formBattery,
            lastCheck
          }
        }
        return item
      }))
    } else {
      const newEqp: Equipment = {
        id: Date.now().toString(),
        code: formCode,
        name: formName,
        category: formCategory,
        financialType: formFinancialType,
        cost: Number(formCost) || 0,
        maintenanceCost: 0,
        unit: formUnit,
        status: formStatus,
        battery: formBattery,
        lastCheck,
        maintenances: []
      }
      setEquipments(prev => [...prev, newEqp])
    }

    setIsModalOpen(false)
  }

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEqpForMaint || !maintDescription.trim()) return

    const now = new Date()
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/Out/${now.getFullYear()}`

    const newMaint: MaintenanceRecord = {
      id: Date.now().toString(),
      date: dateStr,
      description: maintDescription,
      cost: Number(maintCost) || 0,
      provider: maintProvider || 'Assistência Técnica',
      type: maintType
    }

    setEquipments(prev => prev.map(eqp => {
      if (eqp.id === selectedEqpForMaint.id) {
        const updatedMaintenances = [...(eqp.maintenances || []), newMaint]
        const totalMaintCost = updatedMaintenances.reduce((acc, m) => acc + m.cost, 0)
        return {
          ...eqp,
          maintenanceCost: totalMaintCost,
          maintenances: updatedMaintenances
        }
      }
      return eqp
    }))

    setIsMaintModalOpen(false)
  }

  // Filtrar Equipamentos
  const filteredEquipments = equipments.filter(eqp => {
    const matchesSearch = eqp.name.toLowerCase().includes(searchQuery.toLowerCase()) || eqp.code.toLowerCase().includes(searchQuery.toLowerCase()) || eqp.unit.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || eqp.category === selectedCategory
    const matchesStatus = selectedStatus === 'Todos' || eqp.status === selectedStatus
    const matchesFinancial = selectedFinancialType === 'Todos' || eqp.financialType === selectedFinancialType
    return matchesSearch && matchesCategory && matchesStatus && matchesFinancial
  })

  // Estatísticas do Dashboard de Equipamentos
  const totalEquipments = equipments.length
  const emUsoCount = equipments.filter(e => e.status === 'Em Uso').length
  const manutencaoCount = equipments.filter(e => e.status === 'Manutenção').length
  const reservaCount = equipments.filter(e => e.status === 'Reserva (Não utilizado)').length
  const capexCount = equipments.filter(e => e.financialType === 'CAPEX').length
  const opexCount = equipments.filter(e => e.financialType === 'OPEX').length

  // Totais Financeiros
  const totalCapexValue = equipments.filter(e => e.financialType === 'CAPEX').reduce((acc, e) => acc + (e.cost || 0), 0)
  const totalOpexMonthlyValue = equipments.filter(e => e.financialType === 'OPEX').reduce((acc, e) => acc + (e.cost || 0), 0)
  const totalMaintenanceCost = equipments.reduce((acc, e) => acc + (e.maintenanceCost || 0), 0)

  return (
    <div className="space-y-5 w-full">
      {/* Sub-menu Horizontal de Navegação do Módulo Equipamentos */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-semibold'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard de Equipamentos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'list'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-semibold'
          }`}
        >
          <Cpu size={15} />
          <span>Equipamentos Cadastrados</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
            {totalEquipments}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-semibold'
          }`}
        >
          <Wrench size={15} />
          <span>Manutenções & Chamados</span>
          {manutencaoCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono font-bold">
              {manutencaoCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-semibold'
          }`}
        >
          <BarChart3 size={15} />
          <span>Relatório de Ativos</span>
        </button>
      </div>

      {/* CONTEÚDO DA SUB-PÁGINA 1: DASHBOARD DE EQUIPAMENTOS */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Top Banner Dashboard Equipamentos */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
              <Cpu size={220} />
            </div>
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Painel de Telemetria & Gestão de Ativos
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard de Equipamentos dos CDs</h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Acompanhe a classificação de investimentos (Capex / Opex), estado operacional e manutenções preventivas nos CDs Magalog.
              </p>
            </div>
          </div>

          {/* Cards de KPIs Rápidos incluindo Capex/Opex */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Cpu size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total de Equipamentos</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalEquipments} <span className="text-xs font-medium text-slate-500">ativos</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Frota mapeada nos CDs</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Equipamentos CAPEX</div>
                <div className="text-xl font-extrabold text-indigo-900 mt-0.5">{capexCount} <span className="text-xs font-medium text-indigo-600">({Math.round((capexCount / (totalEquipments || 1)) * 100)}%)</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ativos Próprios / Investimento</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Equipamentos OPEX</div>
                <div className="text-xl font-extrabold text-amber-900 mt-0.5">{opexCount} <span className="text-xs font-medium text-amber-600">({Math.round((opexCount / (totalEquipments || 1)) * 100)}%)</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Alugados / Locação Mensal</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Equipamentos Em Uso</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{emUsoCount} <span className="text-xs font-medium text-emerald-600">Ativos</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disponibilidade da Frota</div>
              </div>
            </div>
          </div>

          {/* Seções em Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Alertas e Manutenção */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-600" /> Ocorrências & Manutenções Preventivas
                  </h3>
                  <p className="text-xs text-slate-500">Status técnico e financeiro dos equipamentos com atenção.</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('list')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Ver Todos →
                </button>
              </div>

              <div className="space-y-3">
                {equipments.filter(e => e.status === 'Manutenção' || e.battery < 20).map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                        <Wrench size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="font-mono text-blue-900">({item.code})</span>
                          <span className={`px-2 py-0.2 text-[9px] font-extrabold rounded ${item.financialType === 'CAPEX' ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'}`}>
                            {item.financialType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{item.unit} • Categoria: {item.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-bold text-rose-800 bg-rose-50 rounded-full border border-rose-200">
                        {item.status === 'Manutenção' ? 'Em Manutenção' : 'Bateria Crítica'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo da Classificação Financeira */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-600" /> Classificação Financeira
              </h3>

              <div className="space-y-3 text-xs font-medium">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex justify-between font-bold text-indigo-950">
                    <span>CAPEX (Ativos Próprios)</span>
                    <span className="font-mono">{capexCount} Equipamentos</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-tight">
                    Equipamentos comprados como investimento de capital do CD.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex justify-between font-bold text-amber-950">
                    <span>OPEX (Alugados / Locação)</span>
                    <span className="font-mono">{opexCount} Equipamentos</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Equipamentos alugados sob contrato mensal de operação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-PÁGINA 2: EQUIPAMENTOS CADASTRADOS */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* Top Header Cadastrados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FolderKanban size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Equipamentos Cadastrados no Sistema
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte, edite ou cadastre coletores, empilhadeiras e leitores com classificação Capex ou Opex.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus size={16} /> Novo Equipamento
            </button>
          </div>

          {/* Bar de Busca e Filtros com Filtro Capex/Opex */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="relative w-full lg:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar código, nome ou CD..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                <Filter size={13} className="text-slate-400" /> Filtros:
              </div>

              {/* Filtro Capex / Opex */}
              <select
                value={selectedFinancialType}
                onChange={e => setSelectedFinancialType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Todos">Todos (Capex / Opex)</option>
                <option value="CAPEX">🔵 CAPEX (Ativo Próprio)</option>
                <option value="OPEX">🟠 OPEX (Locado / Alugado)</option>
              </select>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Todos">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Em Uso">🟢 Em Uso</option>
                <option value="Manutenção">🔴 Manutenção</option>
                <option value="Reserva (Não utilizado)">🟡 Reserva (Não utilizado)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Equipamentos com Coluna Capex / Opex */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nome / Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Classificação</th>
                    <th className="p-3 text-right">Custo / Valor Mensal</th>
                    <th className="p-3 text-right">Custo Manutenção</th>
                    <th className="p-3">Unidade (CD)</th>
                    <th className="p-3">Bateria / Saúde</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Última Checagem</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredEquipments.map((eqp) => (
                    <tr key={eqp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-900">{eqp.code}</td>
                      <td className="p-3 font-semibold text-slate-800">{eqp.name}</td>
                      <td className="p-3 text-slate-600 font-medium">{eqp.category}</td>
                      
                      {/* Coluna Classificação FinancialType */}
                      <td className="p-3 text-center">
                        {eqp.financialType === 'CAPEX' ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-md uppercase tracking-wider">
                            CAPEX
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 rounded-md uppercase tracking-wider">
                            OPEX
                          </span>
                        )}
                      </td>

                      {/* Coluna Custo do Equipamento */}
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        R$ {eqp.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span className="block text-[9px] font-sans text-slate-400 font-normal">
                          {eqp.financialType === 'CAPEX' ? 'Aquisição' : '/ Mês'}
                        </span>
                      </td>

                      {/* Coluna Custo Acumulado Manutenção */}
                      <td className="p-3 text-right font-mono font-semibold text-rose-700">
                        R$ {(eqp.maintenanceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 font-bold text-slate-700">{eqp.unit}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Battery size={14} className={eqp.battery < 20 ? 'text-rose-500' : 'text-emerald-600'} />
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${eqp.battery < 20 ? 'bg-rose-500' : eqp.battery < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${eqp.battery}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600">{eqp.battery}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {eqp.status === 'Em Uso' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Em Uso
                          </span>
                        )}
                        {eqp.status === 'Manutenção' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-rose-800 bg-rose-50 rounded-full border border-rose-200 inline-flex items-center gap-1">
                            <Wrench size={11} /> Manutenção
                          </span>
                        )}
                        {eqp.status === 'Reserva (Não utilizado)' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 rounded-full border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle size={11} /> Reserva (Não utilizado)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{eqp.lastCheck}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenMaintModal(eqp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Registrar Manutenção"
                          >
                            <Wrench size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(eqp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Editar Equipamento"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(eqp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir Equipamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-PÁGINA 3: MANUTENÇÕES & CHAMADOS */}
      {activeSubTab === 'maintenance' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={20} className="text-rose-600" /> Ordens de Serviço & Chamados de Manutenção
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento técnico dos equipamentos encaminhados para reparo preventivo ou corretivo.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {equipments.filter(e => e.status === 'Manutenção').map((eqp) => (
              <div key={eqp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{eqp.code}</span>
                    <span className="font-bold text-sm text-slate-800">{eqp.name}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${eqp.financialType === 'CAPEX' ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'}`}>
                      {eqp.financialType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Unidade: {eqp.unit} • Categoria: {eqp.category}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-bold text-rose-800 bg-rose-50 rounded-full border border-rose-200">
                    Aguardando Peça de Reposição
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(eqp)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-PÁGINA 4: RELATÓRIO DE ATIVOS */}
      {activeSubTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" /> Relatório Consolidado de Ativos (Capex vs Opex)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estatísticas completas de investimento e alocação de equipamentos nos CDs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Investimento Total (CAPEX)</div>
              <div className="text-xl font-extrabold text-indigo-900 font-mono">
                R$ {totalCapexValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-slate-500 text-[11px]">
                {capexCount} Equipamentos próprios cadastrados.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Custo Mensal Locação (OPEX)</div>
              <div className="text-xl font-extrabold text-amber-900 font-mono">
                R$ {totalOpexMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
              </div>
              <p className="text-slate-500 text-[11px]">
                {opexCount} Equipamentos alugados sob contrato.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Acumulado Manutenções</div>
              <div className="text-xl font-extrabold text-rose-700 font-mono">
                R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-slate-500 text-[11px]">
                Gastos totais com peças e serviços técnicos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Saúde da Bateria Média</div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">76.3%</div>
              <p className="text-slate-500 text-[11px]">
                Média geral de carga das baterias operacionais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Equipamento com Classificação Capex / Opex */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu size={18} className="text-blue-600" />
                {editingId ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Identificador *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Categoria *</label>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryInputOpen(!isNewCategoryInputOpen)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} /> {isNewCategoryInputOpen ? 'Selecionar' : 'Criar Categoria'}
                    </button>
                  </div>

                  {isNewCategoryInputOpen ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nome da categoria..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs font-semibold border border-blue-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome / Modelo do Equipamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coletora Zebra TC21 #09"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Classificação Financeira Capex / Opex & Valores */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-indigo-600" /> Classificação Financeira (Capex / Opex) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFinancialType('CAPEX')}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all ${
                        formFinancialType === 'CAPEX'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🔵 CAPEX (Ativo Próprio)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFinancialType('OPEX')}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all ${
                        formFinancialType === 'OPEX'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🟠 OPEX (Alugado / Locação)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formFinancialType === 'CAPEX' ? 'Custo de Aquisição (R$) *' : 'Valor da Locação Mensal (R$) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formCost}
                      onChange={e => setFormCost(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade (CD)</label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="CD Louveira">CD Louveira</option>
                    <option value="CD Cabreúva">CD Cabreúva</option>
                    <option value="CD Extrema">CD Extrema</option>
                    <option value="CD Alhandra">CD Alhandra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Em Uso">Em Uso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Reserva (Não utilizado)">Reserva (Não utilizado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bateria ({formBattery}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formBattery}
                    onChange={e => setFormBattery(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-600 mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Custo de Manutenção */}
      {isMaintModalOpen && selectedEqpForMaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={18} className="text-rose-600" />
                Registrar Manutenção / Ordem de Serviço
              </h3>
              <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">{selectedEqpForMaint.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">Código: {selectedEqpForMaint.code} • Unidade: {selectedEqpForMaint.unit}</div>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Reparo / Serviço *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Troca de peças, revisão periódica, reparo de tela..."
                  value={maintDescription}
                  onChange={e => setMaintDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Manutenção</label>
                  <select
                    value={maintType}
                    onChange={e => setMaintType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Corretiva">🔴 Corretiva</option>
                    <option value="Preventiva">🔵 Preventiva</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custo da Manutenção (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={maintCost}
                      onChange={e => setMaintCost(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fornecedor / Assistência Técnica</label>
                <input
                  type="text"
                  placeholder="Ex: Zebra Tech, Assistência Interna..."
                  value={maintProvider}
                  onChange={e => setMaintProvider(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                >
                  Salvar Manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
