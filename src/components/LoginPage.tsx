import React, { useState } from 'react'
import { useAuth } from '../lib/authContext'
import { Lock, Mail, ArrowRight, ShieldCheck, Warehouse, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, informe seu e-mail e senha de acesso.')
      return
    }

    setLoading(true)
    setError(null)

    const res = await login(email, password)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070d1e] text-slate-100 p-4 relative overflow-hidden font-sans">
      {/* Background Decorativo com Luzes e Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      
      {/* Círculos de luzes gradientes no fundo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Card Principal de Login */}
      <div className="relative w-full max-w-md z-10">
        {/* Borda decorativa externa com gradiente brilhante */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-3xl opacity-70 blur-xs" />
        
        <div className="relative bg-[#0b1329]/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/80 flex flex-col">
          {/* Topo / Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/30">
                <div className="w-full h-full bg-[#0b1329] rounded-[15px] flex items-center justify-center">
                  <Warehouse size={32} className="text-cyan-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-[#0b1329]" />
              </span>
            </div>

            <h1 className="text-xl font-black tracking-wide text-white uppercase flex items-center gap-1.5">
              CD 994 <span className="text-cyan-400 font-light">|</span> Gestão Logística
            </h1>
            <p className="text-xs font-semibold text-blue-300 tracking-wider uppercase mt-1">
              Painel Operacional & Indicadores
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in zoom-in-95 duration-150">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Formulário de Acesso */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                E-mail Corporativo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@magalog.com.br"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Login com Tags de Níveis de Acesso */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Níveis de Acesso Integrados
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-semibold">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                Admin
                <span className="block text-[8px] text-slate-400 font-normal mt-0.5">Acesso Total</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                Gerente
                <span className="block text-[8px] text-slate-400 font-normal mt-0.5">Operacional & 360</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-300">
                Colaborador
                <span className="block text-[8px] text-slate-400 font-normal mt-0.5">Rotinas Diárias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
