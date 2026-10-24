import React from 'react'
import { 
  BarChart2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Compass, 
  Info,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Globe,
  Sliders,
  Sparkles,
  Building2,
  Clock
} from 'lucide-react'

// Links oficiais do portal corporativo Tableau / Luizalabs
const TABLEAU_LINKS = [
  {
    id: 'performance-geral',
    title: 'Nível de Serviço 1P • Performance Geral',
    subtitle: 'Saída CD Entrega a Domicílio',
    url: 'https://bi.luizalabs.com/#/site/rede/views/NiveldeservicoDEZ2023-PILOTO/PerformanceGeral?:iid=1',
    description: 'Acompanhamento consolidado do SLA de entrega por CD de origem, modal de transporte (Courier, Micro, Rodo), ofensores e motivos de atraso.',
    category: 'Nível de Serviço & SLA',
    badge: 'Mais Acessado',
    color: 'from-blue-600 to-indigo-600',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    id: 'explorar-views',
    title: 'Explorar Todas as Exibições (Site Rede)',
    subtitle: 'Galeria Geral de Pastas de Trabalho',
    url: 'https://bi.luizalabs.com/#/site/rede/views',
    description: 'Acesso à lista completa de dashboards e pastas de trabalho publicadas para o time de Logística e Comercial da Rede Magalu.',
    category: 'Portal Tableau Server',
    badge: 'Diretório Completo',
    color: 'from-indigo-600 to-purple-600',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    id: 'carteira-courier',
    title: 'Carteira Courier & Monitoramento',
    subtitle: 'Gestão de Entregas Expressas',
    url: 'https://bi.luizalabs.com/#/site/rede/views',
    description: 'Indicadores operacionais das transportadoras parceiras, prazos de transferência e finalização das remessas expressas.',
    category: 'Transporte & Modais',
    badge: 'Operação',
    color: 'from-sky-600 to-cyan-600',
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200'
  },
  {
    id: 'qualidade-micro',
    title: 'Qualidade Detalhe Micro & Prazos Vistos',
    subtitle: 'Auditoria de Entregas & SLA',
    url: 'https://bi.luizalabs.com/#/site/rede/views',
    description: 'Detalhamento das ocorrências, conformidade dos prazos ofertados aos clientes e controle de pendências na malha.',
    category: 'Qualidade Operacional',
    badge: 'Qualidade',
    color: 'from-emerald-600 to-teal-600',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }
]

export const TableauIndicadoresPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Principal de Boas-Vindas e Conformidade */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        {/* Glow sutil de fundo */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck size={14} className="text-blue-600" />
                Em Conformidade com a Política de Segurança LuizaLabs
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Site: Rede
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Tableau Indicadores &bull; BI Luizalabs
            </h1>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Os painéis de Business Intelligence da companhia possuem autenticação corporativa protegida por 
              <strong> SSO (Google Workspace)</strong> e diretivas de segurança <strong>Same-Origin</strong>. 
              Utilize os acessos diretos abaixo para navegar com segurança, preservando suas permissões e histórico de filtros.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="https://bi.luizalabs.com/#/site/rede/views/NiveldeservicoDEZ2023-PILOTO/PerformanceGeral?:iid=1"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:translate-y-[-1px] cursor-pointer group"
            >
              <BarChart2 size={16} />
              <span>Abrir Performance Geral (Tableau)</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="https://bi.luizalabs.com/#/site/rede/views"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs"
            >
              <Compass size={15} />
              <span>Explorar Todas as Exibições</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid de Dashboards Oficiais */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Painéis Operacionais Disponíveis
            </h2>
            <p className="text-xs text-slate-500">
              Selecione o relatório desejado para abrir diretamente na sua sessão autenticada do Tableau.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold hidden sm:inline">
            bi.luizalabs.com
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TABLEAU_LINKS.map((link) => (
            <div
              key={link.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${link.iconBg}`}>
                      <BarChart2 size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {link.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {link.title}
                      </h3>
                      <p className="text-[11px] text-blue-600 font-medium">
                        {link.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {link.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Lock size={12} className="text-slate-400" />
                  <span>Acesso Restrito / SSO</span>
                </div>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <span>Acessar Painel</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orientações sobre a Política de Segurança & Como Funciona */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Autenticação Centralizada (SSO)</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            O Tableau Server utiliza a conta <strong>@magazineluiza.com.br</strong> para garantir que você visualize exatamente os dados permitidos para a sua gerência e CD.
          </p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
            <Lock size={16} className="text-blue-600" />
            <span>Proteção contra Clickjacking</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            O bloqueio de iframe (cabeçalho <em>X-Frame-Options: sameorigin</em>) é uma norma rigorosa de cibersegurança que protege relatórios estratégicos contra interceptações.
          </p>
        </div>

        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
            <Clock size={16} className="text-indigo-600" />
            <span>Atualização em Tempo Real</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ao abrir o Tableau diretamente, você tem acesso completo a todos os recursos nativos: filtros dinâmicos, alertas por e-mail e exportação em Excel ou PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
