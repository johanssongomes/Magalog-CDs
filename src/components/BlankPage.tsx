import React from 'react'

interface BlankPageProps {
  title: string
  description: string
  icon: React.ReactNode
  badge: string
}

export const BlankPage: React.FC<BlankPageProps> = ({ title, description, icon, badge }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-white shadow-sm transition-all duration-300 hover:border-slate-400">
      <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 mb-4 ring-1 ring-blue-100 shadow-md shadow-blue-500/5">
        {icon}
      </div>
      
      <span className="px-3 py-1 mb-3 text-xs font-bold tracking-wider text-blue-700 uppercase bg-blue-50 rounded-full border border-blue-200">
        {badge}
      </span>
      
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-2">
        {title}
      </h2>
      
      <p className="max-w-md text-slate-500 text-sm mb-6">
        {description}
      </p>

      <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Pronto para desenvolvimento
      </div>
    </div>
  )
}
