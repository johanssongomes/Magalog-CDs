import React, { useState, useEffect, useMemo } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Save, 
  KeyRound, 
  FileText,
  BadgeAlert
} from 'lucide-react'
import { useAuth, type ColaboradorData } from '../lib/authContext'
import { supabase } from '../lib/supabase'
import initialColaboradoresData from '../data/initialColaboradores.json'
import { SelosBadges } from './SelosBadges'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'dados' | 'seguranca'>('dados')
  const [colabData, setColabData] = useState<ColaboradorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Lista de líderes disponíveis com ID e Nome para autocompletar e seleção bidirecional
  const listaLideresOpcoes = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>()
    try {
      const stored = localStorage.getItem('magalog_quadro_colaboradores')
      const list = stored ? JSON.parse(stored) : initialColaboradoresData
      if (Array.isArray(list)) {
        list.forEach((c: any) => {
          const cargo = (c.cargo || '').toUpperCase()
          const isLeaderRole = cargo.includes('LIDER') || cargo.includes('SUPERVISOR') || cargo.includes('COORDENADOR') || cargo.includes('GERENTE')
          if (isLeaderRole && c.contratado && c.id) {
            map.set(String(c.id).trim(), { id: String(c.id).trim(), nome: String(c.contratado).trim().toUpperCase() })
          }
          if (c.idLider && c.nomeLider) {
            const idTrim = String(c.idLider).trim()
            if (!map.has(idTrim)) {
              map.set(idTrim, { id: idTrim, nome: String(c.nomeLider).trim().toUpperCase() })
            }
          }
        })
      }
    } catch {}
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [isOpen])

  // Campos de troca de senha
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isOpen || !user) return

    const loadData = async () => {
      setLoading(true)
      try {
        const isMaster = (user.email || '').toLowerCase().includes('johansson') || (user.email || '').toLowerCase().includes('joh_gomes')
        const targetId = isMaster ? '169959' : (user.colaborador_id || user.id)
        const loginPrefix = isMaster ? 'JOH_GOMES' : (user.email || '').split('@')[0].toLowerCase()

        // Busca dados mais recentes da tabela colaboradores
        let { data, error } = await supabase
          .from('colaboradores')
          .select('*')
          .or(`id.eq.${targetId},login.ilike.${loginPrefix}`)
          .maybeSingle()

        // Se ainda não encontrou e for mestre ou tiver nome, busca por contratado
        if (!data) {
          const searchName = isMaster ? 'JOHANSSON' : (user.name || '').split(' ')[0]
          if (searchName) {
            const { data: byName } = await supabase
              .from('colaboradores')
              .select('*')
              .ilike('contratado', `%${searchName}%`)
              .maybeSingle()
            if (byName) data = byName
          }
        }

        if (data && !error) {
          setColabData({
            id: String(data.id || targetId),
            contratado: data.contratado || user.name,
            cargo: data.cargo || user.cargo || user.role,
            centroDeCusto: data.centro_de_custo || '',
            cd: data.cd || '6994',
            login: data.login || loginPrefix.toUpperCase(),
            cpf: data.cpf || '',
            rg: data.rg || '',
            sexo: data.sexo || '',
            cargoAnterior: data.cargo_anterior || '',
            dataAdmissao: data.data_admissao || '',
            dataNascimento: data.data_nascimento || '',
            situacaoSistema: data.situacao_sistema || 'Em Atividade Normal',
            status: data.status || '',
            possuiMedidas: data.possui_medidas || '',
            possuiFeedback: data.possui_feedback || '',
            idLider: data.id_lider || '',
            nomeLider: data.nome_lider || '',
            setor: data.setor || '',
            turno: data.turno || '',
            ferias: data.ferias || '',
            codCentroCusto: data.cod_centro_custo || '',
            gerencia: data.gerencia || '',
            periodo45Dias: data.periodo_45_dias || '',
            periodo90Dias: data.periodo_90_dias || '',
            diaNiver: data.dia_niver || '',
            mesNiver: data.mes_niver || '',
            aniversario: data.aniversario || '',
            novaIdade: data.nova_idade || '',
            tempoDeEmpresa: data.tempo_de_empresa || '',
            mesAdm: data.mes_adm || '',
            diaAdm: data.dia_adm || '',
            anoAdm: data.ano_adm || ''
          })
        } else if (user.dados_colaborador) {
          setColabData(user.dados_colaborador)
        } else {
          setColabData({
            id: targetId,
            contratado: user.name,
            cargo: user.cargo || user.role,
            login: loginPrefix.toUpperCase(),
            cd: '6994'
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setFeedback({ text: 'A nova senha deve possuir pelo menos 6 caracteres.', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ text: 'A confirmação de senha não confere.', type: 'error' })
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      // 1. Atualiza na tabela app_users
      const { error: appErr } = await supabase
        .from('app_users')
        .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
        .eq('email', user.email)

      if (appErr) throw appErr

      // 2. Se houver autenticação Auth Supabase vinculada
      try {
        await supabase.auth.updateUser({ password: newPassword })
      } catch {}

      setFeedback({ text: 'Senha atualizada com sucesso!', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
      if (refreshProfile) await refreshProfile()
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err)
      setFeedback({ text: err.message || 'Erro ao alterar senha.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveColaborador = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colabData) return
    setSaving(true)
    setFeedback(null)

    try {
      const finalId = colabData.id || user.colaborador_id || user.id
      const { error } = await supabase.from('colaboradores').upsert([{
        id: finalId,
        contratado: colabData.contratado || user.name,
        cargo: colabData.cargo || user.cargo || user.role,
        centro_de_custo: colabData.centroDeCusto,
        cd: colabData.cd || '6994',
        login: colabData.login,
        cpf: colabData.cpf,
        rg: colabData.rg,
        sexo: colabData.sexo,
        cargo_anterior: colabData.cargoAnterior,
        data_admissao: colabData.dataAdmissao,
        data_nascimento: colabData.dataNascimento,
        situacao_sistema: colabData.situacaoSistema,
        status: colabData.status,
        possui_medidas: colabData.possuiMedidas,
        possui_feedback: colabData.possuiFeedback,
        id_lider: colabData.idLider,
        nome_lider: colabData.nomeLider,
        setor: colabData.setor,
        turno: colabData.turno,
        ferias: colabData.ferias,
        cod_centro_custo: colabData.codCentroCusto,
        gerencia: colabData.gerencia,
        periodo_45_dias: colabData.periodo45Dias,
        periodo_90_dias: colabData.periodo90Dias,
        dia_niver: colabData.diaNiver,
        mes_niver: colabData.mesNiver,
        aniversario: colabData.aniversario,
        nova_idade: colabData.novaIdade,
        tempo_de_empresa: colabData.tempoDeEmpresa,
        mes_adm: colabData.mesAdm,
        dia_adm: colabData.diaAdm,
        ano_adm: colabData.anoAdm,
        selos: colabData.selos || []
      }], { onConflict: 'id' })

      // Sincroniza também no extra_profile
      try {
        const emailClean = (user?.email || '').trim().toLowerCase()
        if (emailClean) {
          const profileStorageKey = `_user_extra_profile_${emailClean}`
          const { data: existingExtra } = await supabase
            .from('performance_metrics')
            .select('value')
            .eq('cell_key', profileStorageKey)
            .maybeSingle()
          let parsedExtra: any = {}
          if (existingExtra?.value) {
            try { parsedExtra = JSON.parse(existingExtra.value) } catch { }
          }
          parsedExtra.selos = colabData.selos || []
          await supabase
            .from('performance_metrics')
            .upsert({
              cell_key: profileStorageKey,
              value: JSON.stringify(parsedExtra),
              updated_at: new Date().toISOString()
            }, { onConflict: 'cell_key' })
        }
      } catch { }

      if (error) throw error

      setFeedback({ text: 'Informações de perfil atualizadas com sucesso!', type: 'success' })
      if (refreshProfile) await refreshProfile()
    } catch (err: any) {
      console.error('Erro ao salvar dados do perfil:', err)
      setFeedback({ text: err.message || 'Erro ao salvar alterações.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho do Perfil */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-lg shadow-inner">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{user.name}</h3>
                {(colabData?.id || user.colaborador_id) && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold">
                    ID: {colabData?.id || user.colaborador_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                <span className="text-blue-400 font-semibold">{user.cargo || user.role}</span>
                <span>•</span>
                <span className="text-slate-400">{user.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('dados'); setFeedback(null) }}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dados'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={15} />
            <span>Ficha do Colaborador</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('seguranca'); setFeedback(null) }}
            className={`py-3 px-1 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'seguranca'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound size={15} />
            <span>Segurança & Senha</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <BadgeAlert size={16} className="text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Carregando dados do perfil...</span>
            </div>
          ) : activeTab === 'dados' ? (
            <form onSubmit={handleSaveColaborador} className="space-y-6">
              {/* Seção 1: Dados Principais */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</div>
                  <span>Dados Principais & Lotação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Matrícula / ID</label>
                    <input
                      type="text"
                      disabled
                      value={colabData?.id || ''}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label>
                    <input
                      type="text"
                      value={colabData?.contratado || ''}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, contratado: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo Atual</label>
                    <input
                      type="text"
                      disabled
                      value={colabData?.cargo || user.cargo || user.role}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Centro de Custo</label>
                    <input
                      type="text"
                      value={colabData?.centroDeCusto || ''}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, centroDeCusto: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CD / Filial</label>
                    <input
                      type="text"
                      value={colabData?.cd || '6994'}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, cd: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gerência</label>
                    <input
                      type="text"
                      value={colabData?.gerencia || ''}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, gerencia: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Situação Sistema</label>
                    <input
                      type="text"
                      value={colabData?.situacaoSistema || 'Em Atividade Normal'}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, situacaoSistema: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Selos / Comissões Especiais (Conselho, CIPA, Brigada) */}
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Selos & Comissões Especiais
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'CIPA', label: 'CIPA', bgChecked: 'bg-emerald-500 text-white' },
                      { id: 'CONSELHO', label: 'Conselho', bgChecked: 'bg-blue-600 text-white' },
                      { id: 'BRIGADA', label: 'Brigada', bgChecked: 'bg-amber-500 text-white' }
                    ].map(selo => {
                      const currentSelos = Array.isArray(colabData?.selos) ? colabData.selos : []
                      const isChecked = currentSelos.includes(selo.id)
                      return (
                        <button
                          key={selo.id}
                          type="button"
                          onClick={() => {
                            const next = isChecked
                              ? currentSelos.filter(s => s !== selo.id)
                              : [...currentSelos, selo.id]
                            setColabData(prev => prev ? ({ ...prev, selos: next }) : null)
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            isChecked
                              ? `${selo.bgChecked} border-transparent shadow-sm scale-102`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-white' : 'bg-slate-300'}`}></span>
                          <span>{selo.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Seção 2: Liderança, Turno & Setor */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</div>
                  <span>Liderança, Turno & Setor</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">ID Líder</label>
                    <input
                      type="text"
                      list="profile-lideres-id-list"
                      value={colabData?.idLider || ''}
                      onChange={e => {
                        const newId = e.target.value
                        const found = listaLideresOpcoes.find(l => l.id.toLowerCase() === newId.trim().toLowerCase())
                        setColabData(prev => prev ? ({
                          ...prev,
                          idLider: newId,
                          nomeLider: found ? found.nome : prev.nomeLider
                        }) : null)
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                    <datalist id="profile-lideres-id-list">
                      {listaLideresOpcoes.map(l => (
                        <option key={`prof-id-${l.id}`} value={l.id}>{l.nome}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Líder</label>
                    <input
                      type="text"
                      list="profile-lideres-nome-list"
                      value={colabData?.nomeLider || ''}
                      onChange={e => {
                        const newName = e.target.value.toUpperCase()
                        const found = listaLideresOpcoes.find(l => l.nome.toLowerCase() === newName.trim().toLowerCase())
                        setColabData(prev => prev ? ({
                          ...prev,
                          nomeLider: newName,
                          idLider: found ? found.id : prev.idLider
                        }) : null)
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                    <datalist id="profile-lideres-nome-list">
                      {listaLideresOpcoes.map(l => (
                        <option key={`prof-nome-${l.id}`} value={l.nome}>{`ID: ${l.id}`}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Turno / Setor</label>
                    <input
                      type="text"
                      value={`${colabData?.turno || ''} ${colabData?.setor ? `- ${colabData.setor}` : ''}`}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, turno: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Documentos & Dados Pessoais */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</div>
                  <span>Documentos & Dados Pessoais</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Login Corporativo</label>
                    <input
                      type="text"
                      disabled
                      value={colabData?.login || user.email.split('@')[0]}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CPF</label>
                    <input
                      type="text"
                      value={colabData?.cpf || ''}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, cpf: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data Admissão</label>
                    <input
                      type="text"
                      value={colabData?.dataAdmissao || ''}
                      onChange={e => setColabData(prev => prev ? ({ ...prev, dataAdmissao: e.target.value }) : null)}
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md mx-auto py-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                <KeyRound size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold mb-0.5">Segurança da Conta</div>
                  <p className="text-amber-700">
                    Sua nova senha passará a ser solicitada nos próximos logins para o e-mail <strong>{user.email}</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:border-blue-600 focus:outline-none shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:border-blue-600 focus:outline-none shadow-2xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound size={16} />
                  <span>{saving ? 'Atualizando...' : 'Atualizar Minha Senha'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
