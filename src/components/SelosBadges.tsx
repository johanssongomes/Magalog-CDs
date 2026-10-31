import React from 'react'
import { Shield, Flame, Award } from 'lucide-react'

export interface SelosBadgesProps {
  selos?: string[] | null
  size?: 'sm' | 'md'
  className?: string
}

export const SELO_DEFINITIONS: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  CIPA: {
    label: 'CIPA',
    icon: Shield,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    text: 'text-emerald-700',
    border: 'border-emerald-300'
  },
  CONSELHO: {
    label: 'Conselho',
    icon: Award,
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    text: 'text-blue-700',
    border: 'border-blue-300'
  },
  BRIGADA: {
    label: 'Brigada',
    icon: Flame,
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    text: 'text-amber-700',
    border: 'border-amber-300'
  }
}

export const SelosBadges: React.FC<SelosBadgesProps> = ({ selos, size = 'sm', className = '' }) => {
  if (!selos || !Array.isArray(selos) || selos.length === 0) return null

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {selos.map((s) => {
        const key = String(s).trim().toUpperCase()
        const def = SELO_DEFINITIONS[key]
        if (!def) return null
        const Icon = def.icon

        if (size === 'sm') {
          return (
            <span
              key={key}
              title={`Membro da ${def.label}`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wide border text-[9px] shadow-2xs ${def.bg}`}
            >
              <Icon size={10} className="shrink-0" />
              <span>{def.label}</span>
            </span>
          )
        }

        return (
          <span
            key={key}
            title={`Membro da ${def.label}`}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider border text-[10px] shadow-2xs ${def.bg}`}
          >
            <Icon size={12} className="shrink-0" />
            <span>{def.label}</span>
          </span>
        )
      })}
    </div>
  )
}

