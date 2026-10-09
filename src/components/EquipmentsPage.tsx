import React, { useState } from 'react'
import { 
  FolderKanban, Plus, Filter, Search, Cpu, CheckCircle2, AlertTriangle, 
  Wrench, Battery, Edit3, Trash2, X, LayoutDashboard, BarChart3, Clock, Truck, ShieldAlert
} from 'lucide-react'

export interface Equipment {
  id: string
  code: string
  name: string
  category: 'Coletora RF' | 'Empilhadeira' | 'Transpaleteira' | 'Scanner / Leitor' | 'Impressora Térmica'
  unit: string
  status: 'Operacional' | 'Manutenção' | 'Reservado'
  battery: number
  lastCheck: string
}

const INITIAL_EQUIPMENTS: Equipment[] = [
  { id: '1', code: 'EQP-COL-01', name: 'Coletora Zebra TC21 #01', category: 'Coletora RF', unit: 'CD Louveira', status: 'Operacional', battery: 94, lastCheck: '09/Out 08:30' },
  { id: '2', code: 'EQP-COL-02', name: 'Coletora Zebra TC21 #02', category: 'Coletora RF', unit: 'CD Louveira', status: 'Operacional', battery: 82, lastCheck: '09/Out 07:15' },
  { id: '3', code: 'EQP-EMP-05', name: 'Empilhadeira Retrátil Toyota #05', category: 'Empilhadeira', unit: 'CD Cabreúva', status: 'Manutenção', battery: 15, lastCheck: '08/Out 16:40' },
  { id: '4', code: 'EQP-TRN-12', name: 'Transpaleteira Elétrica Still #12', category: 'Transpaleteira', unit: 'CD Extrema', status: 'Operacional', battery: 100, lastCheck: '09/Out 06:00' },
  { id: '5', code: 'EQP-SCN-08', name: 'Leitor Honeywell Xenon 1950', category: 'Scanner / Leitor', unit: 'CD Louveira', status: 'Operacional', battery: 67, lastCheck: '09/Out 09:10' },
  { id: '6', code: 'EQP-IMP-03', name: 'Impressora Zebra ZT411', category: 'Impressora Térmica', unit: 'CD Cabreúva', status: 'Reservado', battery: 100, lastCheck: '07/Out 14:20' }
]

type SubPage = 'dashboard' | 'list' | 'maintenance' | 'reports'

export const EquipmentsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubPage>('dashboard')
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos')
  
  // Modal Novo/Editar Equipamento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<Equipment['category']>('Coletora RF')
  const [formUnit, setFormUnit] = useState('CD Louveira')
  const [formStatus, setFormStatus] = useState<Equipment['status']>('Operacional')
  const [formBattery, setFormBattery] = useState(100)

  const handleOpenAddModal = () => {
    setEditingId(null)
    setFormCode(`EQP-NEW-${Math.floor(10 + Math.random() * 90)}`)
    setFormName('')
    setFormCategory('Coletora RF')
    setFormUnit('CD Louveira')
    setFormStatus('Operacional')
    setFormBattery(100)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (eqp: Equipment) => {
    setEditingId(eqp.id)
    setFormCode(eqp.code)
    setFormName(eqp.name)
    setFormCategory(eqp.category)
    setFormUnit(eqp.unit)
    setFormStatus(eqp.status)
    setFormBattery(eqp.battery)
    setIsModalOpen(true)
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
        unit: formUnit,
        status: formStatus,
        battery: formBattery,
        lastCheck
      }
      setEquipments(prev => [...prev, newEqp])
    }

    setIsModalOpen(false)
  }

  // Filtrar Equipamentos
  const filteredEquipments = equipments.filter(eqp => {
    const matchesSearch = eqp.name.toLowerCase().includes(searchQuery.toLowerCase()) || eqp.code.toLowerCase().includes(searchQuery.toLowerCase()) || eqp.unit.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || eqp.category === selectedCategory
    const matchesStatus = selectedStatus === 'Todos' || eqp.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Estatísticas do Dashboard de Equipamentos
  const totalEquipments = equipments.length
  const operacionaisCount = equipments.filter(e => e.status === 'Operacional').length
  const manutencaoCount = equipments.filter(e => e.status === 'Manutenção').length
  const bateriaBaixaCount = equipments.filter(e => e.battery < 25).length

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
                Painel de Telemetria & Ativos
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard de Equipamentos dos CDs</h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Acompanhe o estado operacional de coletores RF, empilhadeiras, leitores e impressoras em tempo real em todas as unidades Magalog.
              </p>
            </div>
          </div>

          {/* Cards de KPIs Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Cpu size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Cadastrado</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalEquipments} <span className="text-xs font-medium text-slate-500">equipamentos</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Frota completa mapeada</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Operacionais</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{operacionaisCount} <span className="text-xs font-medium text-emerald-600">({Math.round((operacionaisCount / (totalEquipments || 1)) * 100)}%)</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Prontos para uso imediato</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Wrench size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Em Manutenção</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{manutencaoCount} <span className="text-xs font-medium text-rose-600">Equipamento(s)</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Com ordem de serviço aberta</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Battery size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Bateria Crítica</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{bateriaBaixaCount} <span className="text-xs font-medium text-amber-600">Requer carga</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Bateria abaixo de 25%</div>
              </div>
            </div>
          </div>

          {/* Seções em Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Lista de Alertas de Manutenção */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-600" /> Manutenções e Ocorrências Ativas
                  </h3>
                  <p className="text-xs text-slate-500">Status dos equipamentos que necessitam de intervenção técnica.</p>
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
                        <div className="text-xs font-bold text-slate-900">{item.name} <span className="font-mono text-blue-900">({item.code})</span></div>
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

                {equipments.filter(e => e.status === 'Manutenção' || e.battery < 20).length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">
                    ✅ Nenhum equipamento com alerta no momento. Todos operando normalmente.
                  </div>
                )}
              </div>
            </div>

            {/* Distribuição por CD */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck size={18} className="text-blue-600" /> Alocação por Unidade CD
              </h3>

              <div className="space-y-3 text-xs font-medium">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-800">CD Louveira (SP)</span>
                    <span className="font-mono font-bold text-blue-900">3 Equipamentos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-800">CD Cabreúva (SP)</span>
                    <span className="font-mono font-bold text-blue-900">2 Equipamentos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-800">CD Extrema (MG)</span>
                    <span className="font-mono font-bold text-blue-900">1 Equipamento</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '17%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-PÁGINA 2: EQUIPAMENTOS CADASTRADOS (LISTA E CADASTRO) */}
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
                  Consulte, edite ou cadastre coletores, empilhadeiras, leitores e impressoras térmicas dos CDs Magalog.
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

          {/* Bar de Busca e Filtros */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por código, nome ou CD..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Filter size={14} className="text-slate-400" /> Categoria:
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Todos">Todas Categorias</option>
                <option value="Coletora RF">Coletora RF</option>
                <option value="Empilhadeira">Empilhadeira</option>
                <option value="Transpaleteira">Transpaleteira</option>
                <option value="Scanner / Leitor">Scanner / Leitor</option>
                <option value="Impressora Térmica">Impressora Térmica</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Operacional">🟢 Operacional</option>
                <option value="Manutenção">🔴 Manutenção</option>
                <option value="Reservado">🟡 Reservado</option>
              </select>
            </div>
          </div>

          {/* Tabela de Equipamentos Cadastrados */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[11px] border-b border-slate-800">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nome / Descrição</th>
                    <th className="p-3">Categoria</th>
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
                        {eqp.status === 'Operacional' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Operacional
                          </span>
                        )}
                        {eqp.status === 'Manutenção' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-rose-800 bg-rose-50 rounded-full border border-rose-200 inline-flex items-center gap-1">
                            <Wrench size={11} /> Manutenção
                          </span>
                        )}
                        {eqp.status === 'Reservado' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 rounded-full border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle size={11} /> Reservado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{eqp.lastCheck}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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

            {equipments.filter(e => e.status === 'Manutenção').length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                ✅ Nenhuma manutenção em aberto no momento. Todos os equipamentos estão em operação.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SUB-PÁGINA 4: RELATÓRIO DE ATIVOS */}
      {activeSubTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" /> Relatório Consolidado de Ativos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estatísticas completas da distribuição e histórico de uso dos equipamentos nos CDs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Resumo da Frota</div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Coletoras RF</span>
                <span className="font-mono font-bold text-blue-900">2 Coletoras</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Empilhadeiras</span>
                <span className="font-mono font-bold text-blue-900">1 Empilhadeira</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Transpaleteiras</span>
                <span className="font-mono font-bold text-blue-900">1 Transpaleteira</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Scanners & Impressoras</span>
                <span className="font-mono font-bold text-blue-900">2 Equipamentos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm">Saúde da Bateria Média</div>
              <div className="text-2xl font-extrabold text-emerald-700">76.3%</div>
              <p className="text-slate-500 text-[11px]">
                A saúde geral das baterias dos coletores e empilhadeiras está dentro do padrão recomendado (acima de 70%).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Equipamento */}
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

            <form onSubmit={handleSaveForm} className="space-y-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Coletora RF">Coletora RF</option>
                    <option value="Empilhadeira">Empilhadeira</option>
                    <option value="Transpaleteira">Transpaleteira</option>
                    <option value="Scanner / Leitor">Scanner / Leitor</option>
                    <option value="Impressora Térmica">Impressora Térmica</option>
                  </select>
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
                    <option value="Operacional">Operacional</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Reservado">Reservado</option>
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
    </div>
  )
}
