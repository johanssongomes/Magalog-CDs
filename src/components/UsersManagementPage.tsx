import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  useAuth, 
  type AppUserProfile, 
  type UserRole, 
  type ColaboradorData,
  getDefaultPagesForCargo,
  mapCargoToValidRole
} from '../lib/authContext'
import { OnlineUsersModal } from './OnlineUsersModal'
import initialUsersData from '../data/initialUsers.json'
import initialColaboradoresData from '../data/initialColaboradores.json'
import * as XLSX from 'xlsx'
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Zap,
  FolderKanban,
  BarChart3,
  Clock,
  Settings,
  Globe,
  DollarSign,
  CalendarDays,
  Radio,
  User,
  KeyRound,
  FileSpreadsheet,
  Briefcase,
  Layers,
  ChevronDown,
  Info,
  UploadCloud,
  Download,
  Loader2,
  FolderOpen
} from 'lucide-react'

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { id: 'performance', label: 'Performance', icon: <Zap size={14} /> },
  { id: 'catalog', label: 'Equipamentos', icon: <FolderKanban size={14} /> },
  { id: 'pmts', label: 'Gestão 360°', icon: <BarChart3 size={14} /> },
  { id: 'agenda', label: 'Agenda Corporativa', icon: <CalendarDays size={14} /> },
  { id: 'budget', label: 'Gestão Orçamentária', icon: <DollarSign size={14} /> },
  { id: 'inventory', label: 'Banco de Horas', icon: <Clock size={14} /> },
  { id: 'settings', label: 'Central Operacional', icon: <Settings size={14} /> },
  { id: 'links', label: 'Links Úteis', icon: <Globe size={14} /> },
  { id: 'users', label: 'Gestão de Usuários', icon: <Users size={14} /> }
]

const CARGOS_DISPONIVEIS = [
  'ANALISTA LOGISTICA JR',
  'ANALISTA LOGISTICA PL',
  'ANALISTA LOGISTICA SR',
  'ANALISTA SUPORTE TECNICO PL',
  'ASSISTENTE ADMINISTRATIVO II',
  'ASSISTENTE ADMINISTRATIVO III',
  'ASSISTENTE LOGISTICA',
  'AUX ADM APRENDIZ',
  'AUX LIMPEZA',
  'AUX MOVIMENTACAO LOGISTICA I',
  'BOMBEIRO CIVIL',
  'CONFERENTE',
  'CONSULTOR INTERNO GP PL',
  'COORDENADOR LOG SEGUR PATRIMON',
  'COORDENADOR LOGISTICA',
  'FARMACEUTICO',
  'GERENTE REGIONAL LOGISTICA SR',
  'LIDER DE LOGISTICA',
  'LIDER MOVIMENTACAO LOGISTICA',
  'MEDICO TRABALHO JR',
  'OPERADOR EQUIP MOVIMENTACAO II',
  'SUPERVISOR LOGISTICA',
  'TECN SEG TRABALHO PL',
  'TECNICO MANUTENÇÃO',
  'ADMIN'
]

const defaultColaboradorForm: ColaboradorData = {
  id: '',
  contratado: '',
  cargo: 'CONFERENTE',
  centroDeCusto: 'CD S - CONTROLE DE ESTOQUE',
  cd: '6994',
  login: '',
  cpf: '',
  rg: '',
  sexo: 'M',
  cargoAnterior: '',
  dataAdmissao: '',
  dataNascimento: '',
  situacaoSistema: 'Em Atividade Normal',
  status: '',
  possuiMedidas: '',
  possuiFeedback: '',
  idLider: '',
  nomeLider: '',
  setor: '',
  turno: '1º',
  ferias: '',
  codCentroCusto: '70704',
  gerencia: 'ARMAZENAGEM OPERACIONAL',
  periodo45Dias: '',
  periodo90Dias: '',
  diaNiver: '',
  mesNiver: '',
  aniversario: '',
  novaIdade: '',
  tempoDeEmpresa: '',
  mesAdm: '',
  diaAdm: '',
  anoAdm: ''
}

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser, onlineUsers } = useAuth()
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false)
  const [users, setUsers] = useState<AppUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCargo, setFilterCargo] = useState('todos')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modal para Criar / Editar Perfil do Usuário
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUserProfile | null>(null)
  const [activeTabModal, setActiveTabModal] = useState<'dados' | 'acesso'>('dados')

  // Estado dos Dados do Perfil / Formulário
  const [formColabId, setFormColabId] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formCargo, setFormCargo] = useState('CONFERENTE')
  const [formAllowedPages, setFormAllowedPages] = useState<string[]>([])
  const [formActive, setFormActive] = useState(true)
  const [formColaboradorData, setFormColaboradorData] = useState<ColaboradorData>(defaultColaboradorForm)
  const [saving, setSaving] = useState(false)

  // Estados de Importação de Planilha Excel / CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [bulkFileName, setBulkFileName] = useState('')
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [bulkParsedData, setBulkParsedData] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [duplicatesBlockedCount, setDuplicatesBlockedCount] = useState(0)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Gerador automático de e-mail institucional
  const generateEmailFromLoginOrName = (login?: string, name?: string) => {
    if (login && login.trim()) {
      return `${login.trim().toLowerCase()}@magalog.com.br`
    }
    if (name && name.trim()) {
      const parts = name.trim().toLowerCase().split(/\s+/)
      const p1 = parts[0]?.slice(0, 4) || 'user'
      const p2 = parts[parts.length - 1] || 'cd'
      return `${p1}_${p2}@magalog.com.br`
    }
    return ''
  }

  // Função auxiliar para encontrar colaborador na planilha por e-mail ou nome
  const findColaboradorInSpreadsheet = (email?: string, name?: string): ColaboradorData | undefined => {
    const list = (initialColaboradoresData as unknown as ColaboradorData[]) || []
    const cleanEmail = (email || '').toLowerCase().trim()
    const prefix = cleanEmail.split('@')[0].replace(/[._-]/g, '')
    const cleanName = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

    // 1. Procura direta por login
    let match = list.find(c => {
      if (!c.login) return false
      const l = c.login.toLowerCase().replace(/[._-]/g, '')
      return l === prefix || prefix.includes(l) || l.includes(prefix)
    })
    if (match) return match

    // 2. Procura por partes do nome
    const nameParts = cleanName.split(/\s+/).filter(p => p.length >= 3)
    if (nameParts.length > 0) {
      match = list.find(c => {
        const cName = (c.contratado || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return nameParts.every(part => cName.includes(part))
      })
    }
    return match
  }

  // Helper para mapear linha da tabela colaboradores do Supabase para formato ColaboradorData
  const mapColaboradorFromSupabase = (row: any): ColaboradorData => ({
    id: String(row.id || ''),
    contratado: row.contratado || '',
    cargo: row.cargo || '',
    centroDeCusto: row.centro_de_custo || '',
    cd: row.cd || '6994',
    login: row.login || '',
    cpf: row.cpf || '',
    rg: row.rg || '',
    sexo: row.sexo || '',
    cargoAnterior: row.cargo_anterior || '',
    dataAdmissao: row.data_admissao || '',
    dataNascimento: row.data_nascimento || '',
    situacaoSistema: row.situacao_sistema || '',
    status: row.status || '',
    possuiMedidas: row.possui_medidas || '',
    possuiFeedback: row.possui_feedback || '',
    idLider: row.id_lider || '',
    nomeLider: row.nome_lider || '',
    setor: row.setor || '',
    turno: row.turno || '',
    ferias: row.ferias || '',
    codCentroCusto: row.cod_centro_custo || '',
    gerencia: row.gerencia || '',
    periodo45Dias: row.periodo_45_dias || '',
    periodo90Dias: row.periodo_90_dias || '',
    diaNiver: row.dia_niver || '',
    mesNiver: row.mes_niver || '',
    aniversario: row.aniversario || '',
    novaIdade: row.nova_idade || '',
    tempoDeEmpresa: row.tempo_de_empresa || '',
    mesAdm: row.mes_adm || '',
    diaAdm: row.dia_adm || '',
    anoAdm: row.ano_adm || ''
  })

  // Carrega Usuários da Tabela app_users e colaboradores do Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true)
      let initialList = (initialUsersData as unknown as AppUserProfile[]) || []

      // Carregar lista de IDs excluídos armazenados localmente e no banco
      let deletedIds: string[] = []
      try {
        const storedDeleted = localStorage.getItem('magalog_deleted_user_ids')
        if (storedDeleted) deletedIds = JSON.parse(storedDeleted)
      } catch {}

      // 1. Tentar sincronizar em paralelo do Supabase app_users e colaboradores
      const [appUsersRes, colabRes] = await Promise.all([
        supabase.from('app_users').select('*').order('created_at', { ascending: false }),
        supabase.from('colaboradores').select('*')
      ])

      const dbData = appUsersRes.data
      const colabData = colabRes.data

      // Filtra da lista inicial qualquer registro que tenha sido excluído
      const deletedSet = new Set(
        deletedIds
          .map(id => String(id || '').toLowerCase().trim())
          .filter(id => id.length > 0 && id !== 'undefined' && id !== 'null')
      )
      if (deletedSet.size > 0) {
        initialList = initialList.filter(u => {
          const uId = String(u.id || u.colaborador_id || '').toLowerCase().trim()
          const uEmail = (u.email || '').toLowerCase().trim()
          return (!uId || !deletedSet.has(uId)) && (!uEmail || !deletedSet.has(uEmail))
        })
      }

      // Mapa de colaboradores salvos no Supabase por ID e Login
      const colabMapById = new Map<string, ColaboradorData>()
      const colabMapByLogin = new Map<string, ColaboradorData>()
      if (colabData && colabData.length > 0) {
        colabData.forEach(row => {
          const mapped = mapColaboradorFromSupabase(row)
          if (mapped.id) colabMapById.set(String(mapped.id).trim(), mapped)
          if (mapped.login) colabMapByLogin.set(mapped.login.toLowerCase().trim(), mapped)
        })
      }

      if (dbData && dbData.length > 0) {
        // Criar mapa para lookup rápido por email
        const dbMap = new Map(dbData.map(d => [d.email?.toLowerCase(), d]))

        // Atualiza os usuários da lista base (187) com dados do banco se houver
        const mergedList = initialList.map(u => {
          // Busca no banco pelo e-mail padrão institucional ou alternativo
          let dbItem = dbMap.get(u.email?.toLowerCase())
          if (!dbItem && u.name) {
            const legacyMatch = dbData.find(d => {
              if (d.email?.toLowerCase() === u.email?.toLowerCase()) return true
              const match = findColaboradorInSpreadsheet(d.email, d.name)
              return match?.id === u.id
            })
            if (legacyMatch) dbItem = legacyMatch
          }

          // Busca dados de colaborador atualizados do banco (Supabase colaboradores)
          const targetColabId = String(u.id || u.colaborador_id || '').trim()
          const loginPrefix = (u.email || '').split('@')[0].toLowerCase().trim()
          const dbColab = colabMapById.get(targetColabId) || colabMapByLogin.get(loginPrefix)

          const finalDadosColaborador = dbColab 
            ? { ...(u.dados_colaborador || {}), ...dbColab }
            : u.dados_colaborador

          if (dbItem) {
            return {
              ...u,
              role: dbItem.role || u.role || u.cargo,
              cargo: u.cargo || dbItem.cargo || dbItem.role,
              allowed_pages: dbItem.allowed_pages || u.allowed_pages,
              active: dbItem.active !== undefined ? dbItem.active : u.active,
              dados_colaborador: finalDadosColaborador
            }
          }

          return {
            ...u,
            dados_colaborador: finalDadosColaborador
          }
        })

        // Adiciona apenas usuários do Supabase que realmente não pertencem a nenhum colaborador da lista (ID único)
        dbData.forEach(d => {
          const colab = findColaboradorInSpreadsheet(d.email, d.name)
          const targetId = colab?.id || d.colaborador_id || d.id
          
          // Se já existe um colaborador com esse mesmo ID ou e-mail, NÃO duplica na tabela
          const alreadyExists = mergedList.some(m => 
            (m.id && targetId && m.id === targetId) || 
            (m.email?.toLowerCase() === d.email?.toLowerCase())
          )

          if (!alreadyExists) {
            const targetColabId = String(targetId || '').trim()
            const loginPrefix = (d.email || '').split('@')[0].toLowerCase().trim()
            const dbColab = colabMapById.get(targetColabId) || colabMapByLogin.get(loginPrefix)

            const finalColab = dbColab ? { ...(colab || {}), ...dbColab } : colab
            const finalCargo = finalColab?.cargo || d.cargo || d.role

            mergedList.unshift({
              id: targetId,
              colaborador_id: targetId,
              email: d.email,
              name: finalColab?.contratado || d.name,
              role: finalCargo,
              cargo: finalCargo,
              allowed_pages: d.allowed_pages || getDefaultPagesForCargo(finalCargo),
              active: d.active !== false,
              dados_colaborador: finalColab
            })
          }
        })

        // Ordena alfabeticamente pelo nome para exibição impecável
        mergedList.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

        setUsers(mergedList)
        localStorage.setItem('magalog_users_list', JSON.stringify(mergedList))
      } else {
        // Se não houver app_users, ainda assim mescla com os colaboradores do Supabase se existirem
        const mergedList = initialList.map(u => {
          const targetColabId = String(u.id || u.colaborador_id || '').trim()
          const loginPrefix = (u.email || '').split('@')[0].toLowerCase().trim()
          const dbColab = colabMapById.get(targetColabId) || colabMapByLogin.get(loginPrefix)
          return dbColab ? { ...u, dados_colaborador: { ...(u.dados_colaborador || {}), ...dbColab } } : u
        })
        setUsers(mergedList)
        localStorage.setItem('magalog_users_list', JSON.stringify(mergedList))
      }
    } catch (err: any) {
      console.warn('Carregando base local de usuários:', err)
      const baseList = (initialUsersData as unknown as AppUserProfile[]) || []
      setUsers(baseList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Abrir Modal de Criação de Novo Usuário
  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setActiveTabModal('dados')
    const initialCargo = 'CONFERENTE'
    setFormColabId('')
    setFormName('')
    setFormEmail('')
    setFormPassword('123456') // Senha padrão solicitada
    setFormCargo(initialCargo)
    setFormAllowedPages(getDefaultPagesForCargo(initialCargo))
    setFormActive(true)
    setFormColaboradorData({
      ...defaultColaboradorForm,
      id: '',
      contratado: '',
      cargo: initialCargo
    })
    setIsModalOpen(true)
  }

  // Abrir Modal de Edição / Visualização de Perfil Completo
  const handleOpenEditModal = (u: AppUserProfile) => {
    setEditingUser(u)
    setActiveTabModal('dados')
    const colab = u.dados_colaborador || {
      ...defaultColaboradorForm,
      id: u.colaborador_id || u.id,
      contratado: u.name,
      cargo: u.cargo || u.role || 'CONFERENTE',
      login: u.email.split('@')[0].toUpperCase()
    }
    setFormColabId(u.colaborador_id || u.id)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword(u.password_hash || '123456')
    const userCargo = u.cargo || u.role || colab.cargo || 'CONFERENTE'
    setFormCargo(userCargo)
    setFormAllowedPages(u.allowed_pages || getDefaultPagesForCargo(userCargo))
    setFormActive(u.active !== false)
    setFormColaboradorData({
      ...colab,
      id: u.colaborador_id || u.id,
      contratado: u.name,
      cargo: userCargo
    })
    setIsModalOpen(true)
  }

  // Quando o Cargo muda, atualiza o acesso recomendado e perfil
  const handleCargoChange = (newCargo: string) => {
    setFormCargo(newCargo)
    setFormAllowedPages(getDefaultPagesForCargo(newCargo))
    setFormColaboradorData(prev => ({ ...prev, cargo: newCargo }))
  }

  // Alterna permissão de página específica
  const togglePagePermission = (pageId: string) => {
    if (formAllowedPages.includes(pageId)) {
      setFormAllowedPages(formAllowedPages.filter(id => id !== pageId))
    } else {
      setFormAllowedPages([...formAllowedPages, pageId])
    }
  }

  // Salvar Criação ou Alterações do Perfil do Usuário
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const finalEmail = formEmail.trim().toLowerCase() || generateEmailFromLoginOrName(formColaboradorData.login, formName)
      const finalId = formColabId.trim() || formColaboradorData.id || String(Date.now()).slice(-6)

      const updatedColaborador: ColaboradorData = {
        ...formColaboradorData,
        id: finalId,
        contratado: formName.trim().toUpperCase(),
        cargo: formCargo.trim().toUpperCase(),
        login: formColaboradorData.login || finalEmail.split('@')[0].toUpperCase()
      }

      const updatedUserProfile: AppUserProfile = {
        id: editingUser ? editingUser.id : finalId,
        colaborador_id: finalId,
        name: formName.trim().toUpperCase(),
        email: finalEmail,
        role: formCargo,
        cargo: formCargo,
        password_hash: formPassword || '123456',
        allowed_pages: formAllowedPages,
        active: formActive,
        dados_colaborador: updatedColaborador
      }

      // 1. Atualizar ou Inserir no estado local & localStorage
      let updatedUsersList: AppUserProfile[]
      if (editingUser) {
        updatedUsersList = users.map(u => (u.id === editingUser.id || u.email === editingUser.email) ? updatedUserProfile : u)
      } else {
        updatedUsersList = [updatedUserProfile, ...users]
      }
      setUsers(updatedUsersList)
      localStorage.setItem('magalog_users_list', JSON.stringify(updatedUsersList))

      // 2. Persistir no Supabase se disponível
      try {
        const payloadSupabase = {
          email: finalEmail,
          name: updatedUserProfile.name,
          role: mapCargoToValidRole(formCargo),
          allowed_pages: formAllowedPages,
          active: formActive,
          password_hash: updatedUserProfile.password_hash,
          updated_at: new Date().toISOString()
        }
        const { error: upsertErr } = await supabase.from('app_users').upsert([payloadSupabase], { onConflict: 'email' })
        if (upsertErr) {
          console.error('Erro ao salvar no app_users Supabase:', upsertErr)
        }
      } catch (dbErr) {
        console.warn('Aviso ao sincronizar com app_users no Supabase:', dbErr)
      }

      // Sincronizar também com a tabela colaboradores do Quadro TT
      try {
        const { error: colabError } = await supabase.from('colaboradores').upsert([{
          id: finalId,
          contratado: updatedColaborador.contratado,
          cargo: updatedColaborador.cargo,
          centro_de_custo: updatedColaborador.centroDeCusto,
          cd: updatedColaborador.cd || '6994',
          login: updatedColaborador.login,
          cpf: updatedColaborador.cpf,
          rg: updatedColaborador.rg,
          sexo: updatedColaborador.sexo,
          cargo_anterior: updatedColaborador.cargoAnterior,
          data_admissao: updatedColaborador.dataAdmissao,
          data_nascimento: updatedColaborador.dataNascimento,
          situacao_sistema: updatedColaborador.situacaoSistema,
          status: updatedColaborador.status,
          possui_medidas: updatedColaborador.possuiMedidas,
          possui_feedback: updatedColaborador.possuiFeedback,
          id_lider: updatedColaborador.idLider,
          nome_lider: updatedColaborador.nomeLider,
          setor: updatedColaborador.setor,
          turno: updatedColaborador.turno,
          ferias: updatedColaborador.ferias,
          cod_centro_custo: updatedColaborador.codCentroCusto,
          gerencia: updatedColaborador.gerencia,
          periodo_45_dias: updatedColaborador.periodo45Dias,
          periodo_90_dias: updatedColaborador.periodo90Dias,
          dia_niver: updatedColaborador.diaNiver,
          mes_niver: updatedColaborador.mesNiver,
          aniversario: updatedColaborador.aniversario,
          nova_idade: updatedColaborador.novaIdade,
          tempo_de_empresa: updatedColaborador.tempoDeEmpresa,
          mes_adm: updatedColaborador.mesAdm,
          dia_adm: updatedColaborador.diaAdm,
          ano_adm: updatedColaborador.anoAdm
        }], { onConflict: 'id' })

        if (colabError) {
          console.error('Erro ao salvar em colaboradores Supabase:', colabError)
        }
      } catch (colabErr) {
        console.warn('Aviso ao sincronizar colaborador no Supabase:', colabErr)
      }

      // Atualiza o cache do Quadro TT em tempo real e dispara evento de sincronização instantânea
      try {
        const storedQuadro = localStorage.getItem('magalog_quadro_colaboradores')
        if (storedQuadro) {
          const quadroList = JSON.parse(storedQuadro)
          const targetColabId = String(finalColaboradorId).trim().toLowerCase()
          let found = false
          const updatedQuadro = quadroList.map((c: any) => {
            if (String(c.id || '').trim().toLowerCase() === targetColabId) {
              found = true
              return { ...c, ...updatedColaborador }
            }
            return c
          })
          if (!found) {
            updatedQuadro.unshift(updatedColaborador)
          }
          localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updatedQuadro))
        }
      } catch {}

      try {
        window.dispatchEvent(new CustomEvent('magalog_users_updated', {
          detail: { action: editingUser ? 'update' : 'create', id: finalColaboradorId, colaborador: updatedColaborador }
        }))
      } catch {}

      // Recarrega todos os dados do Supabase para garantir que a tela e o cache fiquem sincronizados com o banco
      await fetchUsers()

      setMessage({ 
        text: editingUser ? 'Perfil e permissões do usuário atualizados com sucesso!' : 'Novo usuário cadastrado com sucesso!', 
        type: 'success' 
      })
      setIsModalOpen(false)
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err)
      setMessage({ text: err.message || 'Erro ao processar dados do usuário.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Excluir usuário definitivamente
  const handleDelete = async (u: AppUserProfile) => {
    if (!confirm(`Deseja realmente remover o usuário "${u.name}" (${u.email})?`)) return

    try {
      const targetId = String(u.id || u.colaborador_id || '').trim()
      const targetEmail = (u.email || '').trim().toLowerCase()

      // 1. Atualizar estado local
      const filtered = users.filter(x => {
        const xId = String(x.id || x.colaborador_id || '').trim()
        const xEmail = (x.email || '').trim().toLowerCase()
        return xId !== targetId && xEmail !== targetEmail
      })
      setUsers(filtered)
      localStorage.setItem('magalog_users_list', JSON.stringify(filtered))

      // 2. Registrar na lista persistente de excluídos (evita que o initialUsers.json reintroduza o colaborador)
      try {
        const storedDeleted = localStorage.getItem('magalog_deleted_user_ids')
        const currentDeleted: string[] = storedDeleted ? JSON.parse(storedDeleted) : []
        if (targetId && !currentDeleted.includes(targetId)) currentDeleted.push(targetId)
        if (targetEmail && !currentDeleted.includes(targetEmail)) currentDeleted.push(targetEmail)
        localStorage.setItem('magalog_deleted_user_ids', JSON.stringify(currentDeleted))
      } catch {}

      // 3. Deletar do Supabase (app_users e colaboradores)
      try {
        await Promise.all([
          supabase.from('app_users').delete().eq('email', targetEmail),
          targetId ? supabase.from('colaboradores').delete().eq('id', targetId) : Promise.resolve()
        ])
      } catch (dbErr) {
        console.warn('Aviso ao deletar do Supabase:', dbErr)
      }

      // 4. Sincronizar cache da Gestão 360° (Quadro TT)
      try {
        const storedQuadro = localStorage.getItem('magalog_quadro_colaboradores')
        if (storedQuadro) {
          const quadroList = JSON.parse(storedQuadro)
          const normTargetId = targetId.toLowerCase()
          const updatedQuadro = quadroList.filter((c: any) => String(c.id || '').trim().toLowerCase() !== normTargetId)
          localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(updatedQuadro))
        }
      } catch {}

      // 5. Dispara evento customizado para atualização instantânea em componentes na mesma janela
      try {
        window.dispatchEvent(new CustomEvent('magalog_users_updated', { detail: { action: 'delete', id: targetId, email: targetEmail } }))
      } catch {}

      setMessage({ text: `Usuário "${u.name}" removido com sucesso.`, type: 'success' })
    } catch (err: any) {
      console.error('Erro ao remover usuário:', err)
      setMessage({ text: err.message || 'Erro ao remover usuário.', type: 'error' })
    }
  }

  // Baixar planilha modelo
  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/modelo_cadastro_colaboradores.xlsx'
    link.download = 'Modelo 1.xlsx'
    link.click()
  }

  // Processamento do arquivo Excel/CSV selecionado
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkFileName(file.name)
    setBulkFeedback(null)

    const formatExcelDate = (val: any) => {
      if (!val) return ''
      if (typeof val === 'number') {
        const d = (XLSX.SSF as any).parse_date_code(val)
        if (d) {
          const pad = (n: number) => String(n).padStart(2, '0')
          return `${pad(d.d)}/${pad(d.m)}/${d.y}`
        }
      }
      return String(val).trim()
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (!rawJson || rawJson.length === 0) {
          setBulkFeedback({ type: 'error', message: 'A planilha selecionada está vazia.' })
          setBulkParsedData([])
          return
        }

        // Sets para impedir duplicados internos na própria planilha
        const seenIds = new Set<string>()
        const seenEmails = new Set<string>()

        // Sets de IDs e e-mails já cadastrados na base do sistema
        const existingIds = new Set(users.map(u => String(u.id || u.colaborador_id || '').trim().toLowerCase()).filter(Boolean))
        const existingEmails = new Set(users.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean))

        const parsed: any[] = []
        let duplicatesBlocked = 0

        for (const row of rawJson) {
          const keys = Object.keys(row)
          const findVal = (terms: string[]) => {
            const exactKey = keys.find(k => terms.some(t => k.toLowerCase().trim() === t.toLowerCase().trim()))
            if (exactKey) return row[exactKey]
            const partialKey = keys.find(k => terms.some(t => {
              const normK = k.toLowerCase().trim()
              const normT = t.toLowerCase().trim()
              if (normT === 'centro_custo' || normT === 'centro de custo') {
                return (normK === 'centro_custo' || normK === 'centro de custo') || (normK.includes('centro') && !normK.includes('cod'))
              }
              return normK.includes(normT)
            }))
            return partialKey ? row[partialKey] : ''
          }

          const rawId = String(findVal(['id', 'matrícula', 'matricula', 'crachá', 'cracha', 'codigo', 'código'])).trim()
          const rawContratado = String(findVal(['contratado', 'nome', 'colaborador', 'funcionario', 'funcionário'])).trim()

          if (rawId || rawContratado) {
            const normId = (rawId || `AUTO-${Math.floor(100000 + Math.random() * 900000)}`).trim()
            const normNome = (rawContratado || 'SEM NOME').trim().toUpperCase()
            const idKey = normId.toLowerCase()

            const cargo = String(findVal(['cargo']) || 'CONFERENTE').trim().toUpperCase()
            const login = String(findVal(['login'])).trim().toLowerCase()
            const email = generateEmailFromLoginOrName(login, normNome).toLowerCase()

            // 1. Bloqueia se já apareceu na própria planilha
            if (seenIds.has(idKey) || (email && seenEmails.has(email))) {
              duplicatesBlocked++
              continue
            }

            // 2. Bloqueia se o ID ou E-mail já estiver cadastrado no sistema
            if (existingIds.has(idKey) || (email && existingEmails.has(email))) {
              duplicatesBlocked++
              continue
            }

            seenIds.add(idKey)
            if (email) seenEmails.add(email)

            const rawCentroCusto = String(findVal(['centro_custo', 'centro de custo', 'centro custo'])).trim().toUpperCase()
            const rawCodCentroCusto = String(findVal(['cod_centro_custo', 'cod centro custo', 'codigo centro de custo'])).trim()

            const colabItem: ColaboradorData = {
              id: normId,
              contratado: normNome,
              cargo: cargo,
              centroDeCusto: rawCentroCusto && !/^\d+$/.test(rawCentroCusto) ? rawCentroCusto : (rawCentroCusto || 'GERAL CD 6994'),
              cd: String(findVal(['cd']) || '6994').trim(),
              login: login ? login.toUpperCase() : email.split('@')[0].toUpperCase(),
              cpf: String(findVal(['cpf'])).trim(),
              rg: String(findVal(['rg'])).trim(),
              sexo: String(findVal(['sexo'])).trim(),
              cargoAnterior: String(findVal(['cargo anterior'])).trim(),
              dataAdmissao: formatExcelDate(findVal(['data_admissao', 'data admissao', 'admissao'])),
              dataNascimento: formatExcelDate(findVal(['data_nascimento', 'data nascimento', 'nascimento'])),
              situacaoSistema: String(findVal(['situacao sistema', 'situação sistema', 'situacao']) || 'Em Atividade Normal').trim(),
              status: String(findVal(['status'])).trim(),
              possuiMedidas: String(findVal(['possui medidas'])).trim(),
              possuiFeedback: String(findVal(['possui feedback'])).trim(),
              idLider: String(findVal(['id lider', 'id líder'])).trim(),
              nomeLider: String(findVal(['nome lider', 'nome líder'])).trim(),
              setor: String(findVal(['setor'])).trim(),
              turno: String(findVal(['turno'])).trim(),
              ferias: String(findVal(['férias', 'ferias'])).trim(),
              codCentroCusto: rawCodCentroCusto,
              gerencia: String(findVal(['gerência', 'gerencia'])).trim(),
              periodo45Dias: formatExcelDate(findVal(['período 45 dias', 'periodo 45 dias'])),
              periodo90Dias: formatExcelDate(findVal(['período 90 dias', 'periodo 90 dias'])),
              diaNiver: String(findVal(['dia niver'])).trim(),
              mesNiver: String(findVal(['mes niver'])).trim(),
              aniversario: formatExcelDate(findVal(['aniversário', 'aniversario'])),
              novaIdade: String(findVal(['nova idade'])).trim(),
              tempoDeEmpresa: String(findVal(['tempo de empresa'])).trim(),
              mesAdm: String(findVal(['mês adm', 'mes adm'])).trim(),
              diaAdm: String(findVal(['dia adm'])).trim(),
              anoAdm: String(findVal(['ano adm'])).trim()
            }

            parsed.push({
              id: normId,
              colaborador_id: normId,
              email: email,
              name: normNome,
              role: cargo,
              cargo: cargo,
              allowed_pages: getDefaultPagesForCargo(cargo),
              active: true,
              password_hash: '123456',
              dados_colaborador: colabItem
            })
          }
        }

        setDuplicatesBlockedCount(duplicatesBlocked)

        if (parsed.length === 0) {
          if (duplicatesBlocked > 0) {
            setBulkFeedback({ 
              type: 'warning', 
              message: `Todos os ${duplicatesBlocked} registros da planilha foram ignorados por já estarem cadastrados no sistema (IDs ou e-mails já existentes). Nenhum dado duplicado foi importado.` 
            })
          } else {
            setBulkFeedback({ type: 'error', message: 'Não foi possível encontrar colunas válidas na planilha.' })
          }
          setBulkParsedData([])
        } else {
          setBulkParsedData(parsed)
          setBulkFeedback({
            type: 'success',
            message: `${parsed.length} novos usuários identificados para cadastro.${duplicatesBlocked > 0 ? ` (${duplicatesBlocked} registros com ID já cadastrado foram ignorados e bloqueados)` : ''}`
          })
        }
      } catch (err: any) {
        setBulkFeedback({ type: 'error', message: 'Erro ao ler arquivo: ' + (err.message || 'formato inválido') })
        setBulkParsedData([])
      }
    }
    reader.readAsBinaryString(file)
  }

  // Confirmar Importação e Gravar no Supabase (app_users e colaboradores)
  const handleConfirmBulkImport = async () => {
    if (bulkParsedData.length === 0) return
    setIsImporting(true)

    try {
      // 1. Preparar dados para a tabela colaboradores
      const colaboradoresRows = bulkParsedData.map(u => ({
        id: u.dados_colaborador.id,
        contratado: u.dados_colaborador.contratado,
        cargo: u.dados_colaborador.cargo,
        centro_de_custo: u.dados_colaborador.centroDeCusto,
        cd: u.dados_colaborador.cd || '6994',
        login: u.dados_colaborador.login,
        cpf: u.dados_colaborador.cpf,
        rg: u.dados_colaborador.rg,
        sexo: u.dados_colaborador.sexo,
        cargo_anterior: u.dados_colaborador.cargoAnterior,
        data_admissao: u.dados_colaborador.dataAdmissao,
        data_nascimento: u.dados_colaborador.dataNascimento,
        situacao_sistema: u.dados_colaborador.situacaoSistema,
        status: u.dados_colaborador.status,
        possui_medidas: u.dados_colaborador.possuiMedidas,
        possui_feedback: u.dados_colaborador.possuiFeedback,
        id_lider: u.dados_colaborador.idLider,
        nome_lider: u.dados_colaborador.nomeLider,
        setor: u.dados_colaborador.setor,
        turno: u.dados_colaborador.turno,
        ferias: u.dados_colaborador.ferias,
        cod_centro_custo: u.dados_colaborador.codCentroCusto,
        gerencia: u.dados_colaborador.gerencia,
        periodo_45_dias: u.dados_colaborador.periodo45Dias,
        periodo_90_dias: u.dados_colaborador.periodo90Dias,
        dia_niver: u.dados_colaborador.diaNiver,
        mes_niver: u.dados_colaborador.mesNiver,
        aniversario: u.dados_colaborador.aniversario,
        nova_idade: u.dados_colaborador.novaIdade,
        tempo_de_empresa: u.dados_colaborador.tempoDeEmpresa,
        mes_adm: u.dados_colaborador.mesAdm,
        dia_adm: u.dados_colaborador.diaAdm,
        ano_adm: u.dados_colaborador.anoAdm
      }))

      // 2. Preparar dados para a tabela app_users
      const appUsersRows = bulkParsedData.map(u => ({
        email: u.email,
        name: u.name,
        role: mapCargoToValidRole(u.cargo),
        allowed_pages: u.allowed_pages,
        active: true,
        password_hash: '123456',
        updated_at: new Date().toISOString()
      }))

      // Upsert no Supabase
      for (let i = 0; i < colaboradoresRows.length; i += 100) {
        await supabase.from('colaboradores').upsert(colaboradoresRows.slice(i, i + 100), { onConflict: 'id' })
      }

      for (let i = 0; i < appUsersRows.length; i += 100) {
        await supabase.from('app_users').upsert(appUsersRows.slice(i, i + 100), { onConflict: 'email' })
      }

      // Sincronizar cache local magalog_quadro_colaboradores para a Gestão 360°
      try {
        const fullColabs = bulkParsedData.map(u => u.dados_colaborador)
        localStorage.setItem('magalog_quadro_colaboradores', JSON.stringify(fullColabs))
      } catch {}

      await fetchUsers()

      setBulkFeedback({
        type: 'success',
        message: `Sucesso! ${bulkParsedData.length} usuários e colaboradores foram salvos e atualizados na base de dados principal.`
      })

      setTimeout(() => {
        setIsImportModalOpen(false)
        setBulkParsedData([])
        setBulkFileName('')
        setBulkFeedback(null)
      }, 1500)
    } catch (err: any) {
      console.error('Erro na importação em massa:', err)
      setBulkFeedback({ type: 'error', message: 'Erro ao salvar no banco: ' + (err.message || 'falha de comunicação') })
    } finally {
      setIsImporting(false)
    }
  }

  // Filtragem da lista
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.cargo || u.role || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.colaborador_id || u.id || '').toLowerCase().includes(search.toLowerCase())

    const matchesCargo = filterCargo === 'todos' || (u.cargo || u.role) === filterCargo
    return matchesSearch && matchesCargo
  })

  // Lista única de cargos para filtro
  const uniqueCargos = Array.from(new Set(users.map(u => u.cargo || u.role).filter(Boolean))).sort()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Controle de Usuários & Permissões</h1>
          </div>
          <p className="text-xs text-slate-500">
            Gerencie o perfil completo, matrículas (ID), credenciais e autorização de acesso às páginas por Cargo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            title="Baixar planilha modelo para importação de colaboradores"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Download size={15} className="text-slate-500" />
            <span>Baixar Modelo (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              setBulkFeedback(null)
              setBulkParsedData([])
              setBulkFileName('')
              setIsImportModalOpen(true)
            }}
            title="Importar planilha para cadastro e atualização em massa de usuários e colaboradores"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <UploadCloud size={16} className="text-indigo-600" />
            <span>Importar Planilha</span>
          </button>

          <button
            onClick={() => setIsOnlineModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Radio size={16} className="text-emerald-600 animate-pulse" />
            <span>Quem está online</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/60 text-emerald-800 font-extrabold">
              {Math.max(onlineUsers.length, 1)}
            </span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus size={16} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Barra de Filtro e Busca */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ID, nome, e-mail ou cargo..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Filtrar Cargo:</span>
              <select
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-slate-700 font-medium shadow-2xs max-w-[220px] truncate"
              >
                <option value="todos">Todos os Cargos ({users.length})</option>
                {uniqueCargos.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end md:self-auto">
            <span>Listando:</span>
            <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">{filteredUsers.length}</strong>
            <span>de {users.length} usuários</span>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">ID / Matrícula</th>
                <th className="px-4 py-3">Usuário & E-mail</th>
                <th className="px-4 py-3">Cargo (Permissão)</th>
                <th className="px-4 py-3">Páginas Autorizadas</th>
                <th className="px-4 py-3">Presença</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right min-w-[120px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando usuários da planilha Modelo 1...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum colaborador ou usuário encontrado para a busca.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email
                  const onlineInfo = onlineUsers.find(
                    o => o.email?.toLowerCase() === u.email?.toLowerCase()
                  )
                  const isOnline = Boolean(onlineInfo || isCurrent)
                  const colabId = u.colaborador_id || u.id || '-'
                  const userCargo = u.cargo || u.role || 'CONFERENTE'

                  return (
                    <tr key={u.id || u.email} className="hover:bg-slate-50/90 transition-colors">
                      {/* ID / Matrícula */}
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px]">
                          {colabId}
                        </span>
                      </td>

                      {/* Usuário & E-mail */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-semibold">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-blue-600 font-mono mt-0.5 flex items-center gap-1">
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Cargo (Substituiu os Níveis) */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                          <Briefcase size={11} className="mr-1 text-slate-500" />
                          {userCargo}
                        </span>
                      </td>

                      {/* Páginas Autorizadas */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {userCargo.toUpperCase().includes('ADMIN') ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                              Acesso Total (Todas as Telas)
                            </span>
                          ) : (
                            u.allowed_pages?.map(pId => {
                              const page = AVAILABLE_PAGES.find(p => p.id === pId)
                              return (
                                <span key={pId} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                  {page?.label || pId}
                                </span>
                              )
                            })
                          )}
                        </div>
                      </td>

                      {/* Presença Online */}
                      <td className="px-4 py-3.5">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.active !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-3.5 text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-2 pr-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            title="Editar Perfil Completo & Permissões"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100/70 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200 shadow-2xs"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              title="Remover Usuário"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200 shadow-2xs"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE PERFIL DO USUÁRIO & PERMISSÕES COM 2 ABAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Cabeçalho do Perfil */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{formName || 'Novo Usuário do Sistema'}</span>
                    {formColabId && (
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-bold">
                        MATRÍCULA / ID: {formColabId}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ficha cadastral completa com todos os dados do formato <span className="font-semibold text-slate-700">Modelo Pessoas (Modelo 1)</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* ABAS DE NAVEGAÇÃO DO MODAL */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-4">
              <button
                type="button"
                onClick={() => setActiveTabModal('dados')}
                className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTabModal === 'dados'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>Aba 1: Dados do Colaborador (Planilha)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabModal('acesso')}
                className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTabModal === 'acesso'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound size={16} />
                <span>Aba 2: Dados de Acesso & Permissões por Cargo</span>
              </button>
            </div>

            {/* CONTEÚDO DO FORMULÁRIO */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-6 space-y-5 flex-1">

                {/* ======================================================== */}
                {/* ABA 1: DADOS DO COLABORADOR (PLANILHA MODELO 1)          */}
                {/* ======================================================== */}
                {activeTabModal === 'dados' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    
                    {/* SEÇÃO 1: DADOS PRINCIPAIS & LOTAÇÃO */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Dados Principais & Lotação</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">ID / Matrícula</label>
                          <input
                            type="text"
                            required
                            value={formColabId}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormColabId(val)
                              setFormColaboradorData({ ...formColaboradorData, id: val })
                            }}
                            placeholder="Ex: 435638"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-3">
                          <label className="text-[11px] font-bold text-slate-700">Nome do Contratado</label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase()
                              setFormName(val)
                              setFormColaboradorData({ ...formColaboradorData, contratado: val })
                              if (!editingUser && !formEmail) {
                                setFormEmail(generateEmailFromLoginOrName(formColaboradorData.login, val))
                              }
                            }}
                            placeholder="Ex: ACISNE MELO VICTOR"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Cargo Atual</label>
                          <select
                            value={formCargo}
                            onChange={(e) => handleCargoChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          >
                            {CARGOS_DISPONIVEIS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Cargo Anterior</label>
                          <input
                            type="text"
                            value={formColaboradorData.cargoAnterior || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, cargoAnterior: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">CD</label>
                          <input
                            type="text"
                            value={formColaboradorData.cd || '6994'}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, cd: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Centro de Custo</label>
                          <input
                            type="text"
                            value={formColaboradorData.centroDeCusto || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, centroDeCusto: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">Cód. Centro Custo</label>
                          <input
                            type="text"
                            value={formColaboradorData.codCentroCusto || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, codCentroCusto: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Gerência</label>
                          <input
                            type="text"
                            value={formColaboradorData.gerencia || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, gerencia: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Situação Sistema</label>
                          <input
                            type="text"
                            value={formColaboradorData.situacaoSistema || 'Em Atividade Normal'}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, situacaoSistema: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 2: LIDERANÇA, TURNO & SETOR */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">2</span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Liderança, Turno & Setor</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">ID Líder</label>
                          <input
                            type="text"
                            value={formColaboradorData.idLider || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, idLider: e.target.value })}
                            placeholder="Ex: 204403"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-3">
                          <label className="text-[11px] font-bold text-slate-700">Nome do Líder</label>
                          <input
                            type="text"
                            value={formColaboradorData.nomeLider || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, nomeLider: e.target.value.toUpperCase() })}
                            placeholder="Ex: FRANCISCO MICHAEL LIMA BATISTA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Setor</label>
                          <input
                            type="text"
                            value={formColaboradorData.setor || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, setor: e.target.value.toUpperCase() })}
                            placeholder="Ex: SUPRIMENTO, EXPEDIÇÃO"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Turno</label>
                          <input
                            type="text"
                            value={formColaboradorData.turno || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, turno: e.target.value })}
                            placeholder="Ex: 1º, 2º, 3º, Adm"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">Status</label>
                          <input
                            type="text"
                            value={formColaboradorData.status || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, status: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">Possui Medidas</label>
                          <input
                            type="text"
                            value={formColaboradorData.possuiMedidas || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, possuiMedidas: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Possui Feedback</label>
                          <input
                            type="text"
                            value={formColaboradorData.possuiFeedback || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, possuiFeedback: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 3: ADMISSÃO, EXPERIÊNCIA & FÉRIAS */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold">3</span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Admissão, Experiência & Férias</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Data de Admissão</label>
                          <input
                            type="text"
                            value={formColaboradorData.dataAdmissao || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, dataAdmissao: e.target.value })}
                            placeholder="DD/MM/AAAA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Tempo de Empresa</label>
                          <input
                            type="text"
                            value={formColaboradorData.tempoDeEmpresa || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, tempoDeEmpresa: e.target.value })}
                            placeholder="Ex: 6a-10m-10d"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Férias</label>
                          <input
                            type="text"
                            value={formColaboradorData.ferias || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, ferias: e.target.value })}
                            placeholder="Ex: Gozando Férias"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Período 45 Dias (Experiência)</label>
                          <input
                            type="text"
                            value={formColaboradorData.periodo45Dias || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, periodo45Dias: e.target.value })}
                            placeholder="DD/MM/AAAA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Período 90 Dias (Experiência)</label>
                          <input
                            type="text"
                            value={formColaboradorData.periodo90Dias || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, periodo90Dias: e.target.value })}
                            placeholder="DD/MM/AAAA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Dia / Mês / Ano Adm</label>
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="text"
                              value={formColaboradorData.diaAdm || ''}
                              onChange={(e) => setFormColaboradorData({ ...formColaboradorData, diaAdm: e.target.value })}
                              placeholder="Dia"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                            />
                            <input
                              type="text"
                              value={formColaboradorData.mesAdm || ''}
                              onChange={(e) => setFormColaboradorData({ ...formColaboradorData, mesAdm: e.target.value })}
                              placeholder="Mês"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                            />
                            <input
                              type="text"
                              value={formColaboradorData.anoAdm || ''}
                              onChange={(e) => setFormColaboradorData({ ...formColaboradorData, anoAdm: e.target.value })}
                              placeholder="Ano"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 4: DOCUMENTOS & DADOS PESSOAIS */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200/60">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">4</span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">Documentos & Dados Pessoais</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Login Corporativo</label>
                          <input
                            type="text"
                            value={formColaboradorData.login || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase()
                              setFormColaboradorData({ ...formColaboradorData, login: val })
                              if (!editingUser) {
                                setFormEmail(generateEmailFromLoginOrName(val, formName))
                              }
                            }}
                            placeholder="Ex: JSEP_SILVA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">CPF</label>
                          <input
                            type="text"
                            value={formColaboradorData.cpf || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">RG</label>
                          <input
                            type="text"
                            value={formColaboradorData.rg || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, rg: e.target.value })}
                            placeholder="Registro Geral"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">Sexo</label>
                          <select
                            value={formColaboradorData.sexo || 'M'}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, sexo: e.target.value })}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          >
                            <option value="M">Masculino (M)</option>
                            <option value="F">Feminino (F)</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-1 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Data de Nascimento</label>
                          <input
                            type="text"
                            value={formColaboradorData.dataNascimento || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, dataNascimento: e.target.value })}
                            placeholder="DD/MM/AAAA"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700">Idade Atual</label>
                          <input
                            type="text"
                            value={formColaboradorData.novaIdade || ''}
                            onChange={(e) => setFormColaboradorData({ ...formColaboradorData, novaIdade: e.target.value })}
                            placeholder="Ex: 50"
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2 md:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Dia e Mês de Aniversário</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formColaboradorData.diaNiver || ''}
                              onChange={(e) => setFormColaboradorData({ ...formColaboradorData, diaNiver: e.target.value })}
                              placeholder="Dia (Ex: 20)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                            />
                            <input
                              type="text"
                              value={formColaboradorData.mesNiver || ''}
                              onChange={(e) => setFormColaboradorData({ ...formColaboradorData, mesNiver: e.target.value })}
                              placeholder="Mês (Ex: 9)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ======================================================== */}
                {/* ABA 2: DADOS DE ACESSO & PERMISSÕES POR CARGO            */}
                {/* ======================================================== */}
                {activeTabModal === 'acesso' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    
                    {/* Bloco de Credenciais */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800">
                        <KeyRound size={16} className="text-blue-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Credenciais de Autenticação</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            E-mail Institucional (@magalog.com.br)
                          </label>
                          <input
                            type="email"
                            required
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value.toLowerCase())}
                            placeholder="usuario@magalog.com.br"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Padrão: <code>login@magalog.com.br</code> (ex: <code>jsep_silva@magalog.com.br</code>)
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Senha de Acesso (Padrão 123456)
                          </label>
                          <input
                            type="text"
                            required
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            placeholder="123456"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Senha inicial padrão: <code>123456</code>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bloco de Cargo & Permissão */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-slate-800">
                          <Briefcase size={16} className="text-blue-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Nível de Permissão pelo Cargo
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {formCargo}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Selecione o Cargo para atribuir permissões automáticas:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                          {CARGOS_DISPONIVEIS.map((cargoOption) => {
                            const isSelected = formCargo === cargoOption
                            return (
                              <button
                                key={cargoOption}
                                type="button"
                                onClick={() => handleCargoChange(cargoOption)}
                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <div className="text-[10px] font-bold uppercase truncate">{cargoOption}</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Páginas com Acesso Autorizado */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-slate-500" />
                            Páginas com Acesso Autorizado para este Usuário
                          </label>
                          {formCargo.toUpperCase().includes('ADMIN') && (
                            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              Administrador: Acesso Total
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 bg-white border border-slate-200 rounded-xl">
                          {AVAILABLE_PAGES.map((page) => {
                            const isChecked = formCargo.toUpperCase().includes('ADMIN') || formAllowedPages.includes(page.id)
                            return (
                              <label
                                key={page.id}
                                className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold shadow-2xs' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={formCargo.toUpperCase().includes('ADMIN')}
                                  onChange={() => togglePagePermission(page.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="flex items-center gap-1.5 truncate">
                                  {page.icon}
                                  <span className="truncate">{page.label}</span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Usuário Ativo / Inativo */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-xs font-bold text-slate-700">Status da Conta no Sistema</span>
                          <p className="text-[10px] text-slate-400">Usuários inativos têm o acesso bloqueado imediatamente.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormActive(!formActive)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                            formActive ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              formActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* Rodapé com Botões de Ação */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {activeTabModal === 'dados' ? 'Aba 1: Dados do Colaborador' : 'Aba 2: Dados de Acesso & Permissões'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal de Importação de Planilha para Cadastro em Massa */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <UploadCloud size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importar Planilha de Colaboradores</h3>
                  <p className="text-xs text-slate-500">Cadastre e atualize perfis de usuários em massa através de arquivo Excel ou CSV</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setBulkFeedback(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="space-y-4 text-xs">
              {/* Baixar Modelo */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">Precisa do modelo padrão?</p>
                    <p className="text-[11px] text-blue-700/80">Planilha com todos os campos do formato Modelo 1 (ID, Nome, Cargo, Centro de Custo, etc.).</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Baixar Modelo</span>
                </button>
              </div>

              {/* Upload Área */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-blue-600" />
                  Selecione o arquivo no seu computador
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <UploadCloud size={30} className="mx-auto text-blue-500" />
                  {bulkFileName ? (
                    <div>
                      <p className="text-xs font-bold text-blue-700">{bulkFileName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Clique para escolher outro arquivo se desejar</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">Clique para selecionar a planilha (.xlsx, .xls, .csv)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mapeamento automático de todas as colunas da Ficha Cadastral</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback de Importação */}
              {bulkFeedback && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  bulkFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : bulkFeedback.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {bulkFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : bulkFeedback.type === 'warning' ? (
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold leading-relaxed">{bulkFeedback.message}</span>
                </div>
              )}

              {/* Prévia dos Primeiros Registros */}
              {bulkParsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Prévia dos Dados ({bulkParsedData.length} registros)</span>
                    <span className="text-emerald-600 font-semibold font-mono text-[11px]">Pronto para gravar no banco</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Cargo</th>
                          <th className="p-2">E-mail Gerado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkParsedData.slice(0, 5).map((u, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-blue-700 font-bold">{u.id}</td>
                            <td className="p-2 font-semibold text-slate-800">{u.name}</td>
                            <td className="p-2 text-slate-600">{u.cargo}</td>
                            <td className="p-2 text-slate-500 font-mono text-[11px]">{u.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setBulkFeedback(null); }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={isImporting || bulkParsedData.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Salvando no Banco de Dados...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Confirmar & Gravar Dados</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Usuários Online */}
      <OnlineUsersModal 
        isOpen={isOnlineModalOpen} 
        onClose={() => setIsOnlineModalOpen(false)} 
      />
    </div>
  )
}
