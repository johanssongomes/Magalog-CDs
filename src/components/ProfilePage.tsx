import React, { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Camera,
  CheckCircle2,
  Save,
  KeyRound,
  FileText,
  MapPin,
  Heart,
  Phone,
  Edit3,
  Flame,
  BadgeAlert,
  Cake,
  Activity,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react'
import { useAuth, type ColaboradorData } from '../lib/authContext'
import { supabase } from '../lib/supabase'
import initialColaboradores from '../data/initialColaboradores.json'

export function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'geral' | 'ficha' | 'seguranca'>('geral')
  const [colabData, setColabData] = useState<ColaboradorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Campos customizáveis do perfil
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Campos de segurança (senha)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Carregar dados completos do colaborador
  useEffect(() => {
    if (!user) return

    setName(user.name || '')
    setBio(user.bio || '')
    setPhone(user.phone || '')
    setAvatarUrl(user.avatar_url || '')

    const loadColaborador = async () => {
      setLoading(true)
      try {
        const targetId = user.colaborador_id || user.id
        const loginPrefix = (user.email || '').split('@')[0].toLowerCase()

        // 1. Tenta buscar no banco Supabase
        const { data, error } = await supabase
          .from('colaboradores')
          .select('*')
          .or(`id.eq.${targetId},login.ilike.${loginPrefix}`)
          .maybeSingle()

        // 2. Busca também na base oficial de colaboradores
        const localFound = (initialColaboradores as any[]).find(c => 
          (c.id && String(c.id) === String(targetId)) ||
          (c.login && c.login.toLowerCase() === loginPrefix) ||
          (c.contratado && user.name && c.contratado.toLowerCase() === user.name.toLowerCase())
        )

        const source = data || localFound

        if (source) {
          setColabData({
            id: String(source.id || targetId),
            contratado: source.contratado || user.name,
            cargo: source.cargo || user.cargo || user.role,
            centroDeCusto: source.centro_de_custo || source.centroDeCusto || '',
            cd: source.cd || '6994',
            login: source.login || loginPrefix.toUpperCase(),
            cpf: source.cpf || '',
            rg: source.rg || '',
            sexo: source.sexo || '',
            cargoAnterior: source.cargo_anterior || source.cargoAnterior || '',
            dataAdmissao: source.data_admissao || source.dataAdmissao || '',
            dataNascimento: source.data_nascimento || source.dataNascimento || '',
            situacaoSistema: source.situacao_sistema || source.situacaoSistema || 'Em Atividade Normal',
            status: source.status || '',
            possuiMedidas: source.possui_medidas || source.possuiMedidas || '',
            possuiFeedback: source.possui_feedback || source.possuiFeedback || '',
            idLider: source.id_lider || source.idLider || '',
            nomeLider: source.nome_lider || source.nomeLider || '',
            setor: source.setor || '',
            turno: source.turno || '',
            ferias: source.ferias || '',
            codCentroCusto: source.cod_centro_custo || source.codCentroCusto || '',
            gerencia: source.gerencia || '',
            periodo45Dias: source.periodo_45_dias || source.periodo45Dias || '',
            periodo90Dias: source.periodo_90_dias || source.periodo90Dias || '',
            diaNiver: source.dia_niver || source.diaNiver || '',
            mesNiver: source.mes_niver || source.mesNiver || '',
            aniversario: source.aniversario || '',
            novaIdade: source.nova_idade || source.novaIdade || '',
            tempoDeEmpresa: source.tempo_de_empresa || source.tempoDeEmpresa || '',
            mesAdm: source.mes_adm || source.mesAdm || '',
            diaAdm: source.dia_adm || source.diaAdm || '',
            anoAdm: source.ano_adm || source.anoAdm || ''
          })
        } else if (user.dados_colaborador) {
          setColabData(user.dados_colaborador)
        } else {
          setColabData({
            id: targetId,
            contratado: user.name,
            cargo: user.cargo || user.role,
            login: loginPrefix.toUpperCase(),
            cd: '6994',
            idLider: '',
            nomeLider: ''
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do colaborador:', err)
      } finally {
        setLoading(false)
      }
    }

    loadColaborador()
  }, [user])

  if (!user) return null

  // Cálculo de anos trabalhados para as medalhas de tempo de casa (1 medalha para cada 5 anos)
  const getYearsOfService = (): number => {
    if (colabData?.tempoDeEmpresa) {
      const match = colabData.tempoDeEmpresa.match(/(\d+)\s*a/i)
      if (match) return parseInt(match[1], 10)
    }
    if (colabData?.dataAdmissao) {
      const parts = colabData.dataAdmissao.split('/')
      if (parts.length === 3) {
        const admDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        const now = new Date()
        const diffMs = now.getTime() - admDate.getTime()
        const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25))
        return Math.max(0, diffYears)
      }
    }
    return 0
  }

  // Cálculo de tempo de casa inteligente caso não venha da planilha
  const calculateCompanyTime = () => {
    if (colabData?.tempoDeEmpresa && colabData.tempoDeEmpresa.trim() !== '') {
      return colabData.tempoDeEmpresa
    }
    if (!colabData?.dataAdmissao) return 'Em atividade'
    try {
      const parts = colabData.dataAdmissao.split('/')
      if (parts.length === 3) {
        const admDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
        const now = new Date()
        const diffMs = now.getTime() - admDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const years = Math.floor(diffDays / 365)
        const months = Math.floor((diffDays % 365) / 30)

        if (years > 0 && months > 0) return `${years}a ${months}m`
        if (years > 0) return `${years}a`
        if (months > 0) return `${months}m`
        return `${diffDays}d`
      }
    } catch {}
    return colabData?.dataAdmissao || 'Não informado'
  }

  // Upload/Alteração de Foto de Perfil com salvamento instantâneo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setFeedback({ text: 'A imagem deve ter no máximo 3MB.', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = async (uploadEvent) => {
      const result = uploadEvent.target?.result as string
      if (result) {
        setAvatarUrl(result)
        try {
          await updateProfile({ avatar_url: result })
          setFeedback({ text: 'Foto de perfil salva e atualizada com sucesso!', type: 'success' })
        } catch (err) {
          console.error('Erro ao salvar foto de perfil:', err)
          setFeedback({ text: 'Foto carregada! Clique em "Salvar Alterações" para confirmar.', type: 'success' })
        }
      }
    }
    reader.readAsDataURL(file)
  }

  // Salvar Informações Gerais do Perfil (Nome, Bio, Telefone, Foto)
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl
      })

      // Atualiza também contratado na tabela colaboradores caso tenha mudado
      if (colabData && name.trim() !== colabData.contratado) {
        await supabase
          .from('colaboradores')
          .update({ contratado: name.trim() })
          .eq('id', colabData.id)
      }

      setFeedback({ text: 'Perfil geral atualizado com sucesso!', type: 'success' })
      if (refreshProfile) await refreshProfile()
    } catch (err: any) {
      console.error('Erro ao salvar perfil geral:', err)
      setFeedback({ text: err.message || 'Erro ao salvar alterações.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Salvar Ficha Cadastral do Colaborador
  const handleSaveFicha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colabData) return
    setSaving(true)
    setFeedback(null)

    try {
      const finalId = colabData.id || user.colaborador_id || user.id
      const { error } = await supabase.from('colaboradores').upsert([{
        id: finalId,
        contratado: colabData.contratado || name || user.name,
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
        ano_adm: colabData.anoAdm
      }], { onConflict: 'id' })

      if (error) throw error

      setFeedback({ text: 'Ficha funcional e cadastral atualizada com sucesso!', type: 'success' })
      if (refreshProfile) await refreshProfile()
    } catch (err: any) {
      console.error('Erro ao salvar ficha:', err)
      setFeedback({ text: err.message || 'Erro ao salvar ficha cadastral.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Trocar Senha
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
      await updateProfile({ password_hash: newPassword })
      try {
        await supabase.auth.updateUser({ password: newPassword })
      } catch {}

      setFeedback({ text: 'Senha de acesso alterada com sucesso!', type: 'success' })
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

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : 'US'
  const companyTime = calculateCompanyTime()
  const yearsOfService = getYearsOfService()
  const quinquennios = Math.floor(yearsOfService / 5)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* 1. HERO BANNER DO PERFIL (Estilo Premium e Robusto) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        {/* Banner Cover com Gradiente Corporativo Magalog */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-sm">
              <Building2 size={13} className="text-blue-300" />
              CD {colabData?.cd || '994'} &bull; GESTÃO LOGÍSTICA
            </span>
          </div>
        </div>

        {/* Informações Principais do Usuário sobrepostas */}
        <div className="px-5 sm:px-6 pb-6 pt-0 relative -mt-16 sm:-mt-20 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 min-w-0 flex-1">
            {/* Foto de Perfil / Avatar Interativo com Botão de Upload */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-4 border-slate-900 overflow-hidden shadow-2xl flex items-center justify-center text-blue-300 font-black text-2xl sm:text-3xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white">
                    {initials}
                  </div>
                )}
              </div>

              {/* Botão de Upload de Foto */}
              <label 
                title="Alterar Foto de Perfil"
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl cursor-pointer shadow-lg border-2 border-slate-900 transition-transform group-hover:scale-105"
              >
                <Camera size={15} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>

              {/* Indicador de Status Online */}
              <span className="absolute top-1.5 left-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            {/* Nome, Cargo e Crachá com proteção contra estouro */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight whitespace-nowrap truncate max-w-full">
                  {user.name}
                </h1>
                {(colabData?.id || user.colaborador_id) && (
                  <span className="shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    ID: {colabData?.id || user.colaborador_id}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-blue-400 flex items-center gap-1.5 truncate max-w-full">
                  <Briefcase size={14} className="shrink-0" />
                  <span className="truncate">{user.cargo || colabData?.cargo || user.role}</span>
                </span>
                <span className="hidden sm:inline text-slate-600">&bull;</span>
                <span className="text-slate-400 flex items-center gap-1.5 truncate max-w-full">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
              </div>

              {/* Medalhas de Tempo de Casa (1 a cada 5 anos) */}
              {quinquennios > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {Array.from({ length: quinquennios }).map((_, idx) => (
                    <span
                      key={idx}
                      title={`Medalha de ${(idx + 1) * 5} anos de dedicação na empresa (${yearsOfService} anos totais)`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs backdrop-blur-xs transition hover:scale-105"
                    >
                      <Award size={13} className="text-amber-400 fill-amber-400/30 shrink-0" />
                      <span>{(idx + 1) * 5} Anos</span>
                    </span>
                  ))}
                  <span className="text-[11px] text-amber-400/70 font-medium ml-1">
                    {quinquennios === 1 ? '1ª Medalha de Carreira' : `${quinquennios} Medalhas de Carreira`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Badges Rápidos de Carreira e Tempo de Casa */}
          <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2.5 shrink-0 self-start lg:self-end mt-2 lg:mt-0">
            {/* Card Tempo de Casa */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 min-w-[130px] flex flex-col justify-center">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tempo de Casa</span>
                {quinquennios > 0 && (
                  <span className="inline-flex items-center text-[10px] text-amber-400 font-extrabold" title={`${quinquennios} medalha(s) ganha(s)`}>
                    <Award size={12} className="fill-amber-400" />
                    {quinquennios}x
                  </span>
                )}
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
                <Clock size={13} className="text-amber-400 shrink-0" />
                <span className="truncate">{companyTime}</span>
              </span>
            </div>

            {/* Card Situação */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 min-w-[130px] flex flex-col justify-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Situação</span>
              <span className="font-extrabold text-xs sm:text-sm text-emerald-400 flex items-center gap-1.5 truncate">
                <CheckCircle2 size={13} className="shrink-0" />
                <span className="truncate">{colabData?.situacaoSistema || 'Em Atividade'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE AÇÕES */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm' 
            : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <BadgeAlert size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-mono text-sm">
            &times;
          </button>
        </div>
      )}

      {/* 2. NAVEGAÇÃO DE ABAS DO PERFIL */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setActiveTab('geral'); setFeedback(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'geral'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={16} />
          <span>Visão Geral & Bio</span>
        </button>

        <button
          onClick={() => { setActiveTab('ficha'); setFeedback(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'ficha'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText size={16} />
          <span>Ficha Cadastral & Lotação</span>
        </button>

        <button
          onClick={() => { setActiveTab('seguranca'); setFeedback(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'seguranca'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound size={16} />
          <span>Segurança & Senha</span>
        </button>
      </div>

      {/* 3. CONTEÚDO DAS ABAS */}

      {/* ABA 1: VISÃO GERAL & BIO */}
      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Edição da Bio, Foto e Contatos */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Apresentação & Biografia</h3>
                    <p className="text-[11px] text-slate-400">Conte um pouco sobre sua trajetória, projetos e rotina no CD.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>

              {/* Nome de Exibição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo de Exibição
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-slate-50/50"
                />
              </div>

              {/* BIO / Sobre Mim */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biografia / Sobre Mim
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: Atuo no CD 994 como Assistente de Logística, apaixonada por otimização de processos, melhorias contínuas e trabalho em equipe..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden resize-none bg-slate-50/50"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Essa biografia ficará visível para os outros colaboradores do sistema no seu perfil.
                </span>
              </div>

              {/* Telefone / Ramal / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp / Ramal
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(85) 99999-9999 ou Ramal 204"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link da Imagem de Foto de Perfil (Opcional)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>
            </form>

            {/* Painel de Estatísticas / Métricas Pessoais do Colaborador */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                Destaques Funcionais
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admissão</span>
                  <span className="font-black text-sm text-slate-800 mt-1 block">
                    {colabData?.dataAdmissao || 'Não informado'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aniversário</span>
                  <span className="font-black text-sm text-slate-800 mt-1 block">
                    {colabData?.aniversario || colabData?.dataNascimento || 'Não informado'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turno / Setor</span>
                  <span className="font-black text-xs text-slate-800 mt-1 block truncate">
                    {colabData?.setor || colabData?.turno || 'Transporte'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feedback / Medidas</span>
                  <span className="font-black text-xs text-emerald-600 mt-1 block">
                    {colabData?.possuiFeedback ? colabData.possuiFeedback : 'Sem Pendências'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Cartão de Visita Corporativo */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono">
                  Crachá Digital
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {colabData?.cd || 'CD 994'}
                </span>
              </div>

              <div className="py-5 text-center space-y-3">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/30 border border-blue-400/40 mx-auto overflow-hidden shadow-inner flex items-center justify-center font-bold text-xl text-blue-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <div>
                  <h4 className="font-black text-base text-white">{name || user.name}</h4>
                  <p className="text-xs text-blue-300 font-semibold mt-0.5">{user.cargo || colabData?.cargo || user.role}</p>
                </div>
              </div>

              {bio && (
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 italic leading-relaxed">
                  "{bio}"
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Líder Direto:</span>
                  <span className="font-bold text-white text-right">
                    {colabData?.nomeLider && colabData.nomeLider.trim() !== '' ? colabData.nomeLider : 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Login Corporativo:</span>
                  <span className="font-mono font-bold text-blue-400">{colabData?.login || user.email.split('@')[0].toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Centro de Custo:</span>
                  <span className="font-bold text-white text-right truncate max-w-[160px]">{colabData?.centroDeCusto || '40203'}</span>
                </div>
              </div>
            </div>

            {/* Informações de Acesso e Permissões */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                Páginas Autorizadas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(user.allowed_pages || []).map((pageId) => (
                  <span key={pageId} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {pageId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: FICHA CADASTRAL COMPLETA & LOTAÇÃO */}
      {activeTab === 'ficha' && (
        <form onSubmit={handleSaveFicha} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Ficha Cadastral e Dados do Colaborador</h3>
              <p className="text-xs text-slate-400">Consulte ou atualize suas informações cadastrais vinculadas ao Quadro de Pessoas (TT).</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Gravando...' : 'Salvar Ficha'}</span>
            </button>
          </div>

          {/* Grupo 1: Dados Principais */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              Dados Principais & Lotação
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula / ID</label>
                <input
                  type="text"
                  value={colabData?.id || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, id: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={colabData?.contratado || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, contratado: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Atual</label>
                <input
                  type="text"
                  value={colabData?.cargo || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, cargo: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Centro de Custo</label>
                <input
                  type="text"
                  value={colabData?.centroDeCusto || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, centroDeCusto: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CD / Filial</label>
                <input
                  type="text"
                  value={colabData?.cd || '994'}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, cd: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Grupo 2: Liderança, Setor e Turno */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              Liderança, Turno & Setor
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ID do Líder</label>
                <input
                  type="text"
                  value={colabData?.idLider || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, idLider: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Líder</label>
                <input
                  type="text"
                  value={colabData?.nomeLider || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, nomeLider: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Turno / Setor</label>
                <input
                  type="text"
                  value={colabData?.setor || colabData?.turno || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, setor: e.target.value, turno: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Grupo 3: Datas e Documentos */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              Datas, Admissão & Documentos
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Admissão</label>
                <input
                  type="text"
                  value={colabData?.dataAdmissao || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, dataAdmissao: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento / Aniversário</label>
                <input
                  type="text"
                  value={colabData?.aniversario || colabData?.dataNascimento || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, aniversario: e.target.value, dataNascimento: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tempo de Empresa Registrado</label>
                <input
                  type="text"
                  value={colabData?.tempoDeEmpresa || ''}
                  onChange={(e) => setColabData(prev => prev ? ({ ...prev, tempoDeEmpresa: e.target.value }) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ABA 3: SEGURANÇA & SENHA */}
      {activeTab === 'seguranca' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <KeyRound size={22} />
            </div>
            <h3 className="font-black text-base text-slate-800">Alteração de Senha de Acesso</h3>
            <p className="text-xs text-slate-500">Mantenha sua conta corporativa protegida com uma senha forte.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmação da Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 mt-2"
            >
              {saving ? 'Atualizando Senha...' : 'Confirmar e Alterar Senha'}
            </button>
          </form>
        </div>
      )}

    </div>
  )
}
