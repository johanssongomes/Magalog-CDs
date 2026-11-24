import { supabase } from './supabase'

export interface EstoqueSyncStatus {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning' | 'unknown'
  step?: string
  progress?: number
  message?: string
  total?: number
  elapsed_seconds?: number
  error?: string
  updated_at?: string
}

// Disparar sincronização do Estoque Oracle WIS (EstoqueCD.sql) para o Supabase
export async function triggerEstoqueWisSync(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const requestPayload = {
      action: 'sync',
      status: 'requested',
      progress: 10,
      message: 'Solicitação enviada. Conectando ao Oracle WIS (ODBC)...',
      requested_at: new Date().toISOString()
    }

    // 1. Grava diretamente no Supabase (funciona na Vercel e em qualquer lugar)
    const { error: supaErr } = await supabase
      .from('performance_metrics')
      .upsert({
        cell_key: 'estoque_sync_command',
        value: JSON.stringify(requestPayload),
        updated_at: new Date().toISOString()
      }, { onConflict: 'cell_key' })

    if (supaErr) {
      console.warn('Aviso ao registrar comando de estoque no Supabase:', supaErr.message)
    }

    // 2. Tenta também acionar backend local se disponível
    try {
      fetch('/api/estoque/sync-wis', { method: 'POST' }).catch(() => { })
    } catch { }

    return {
      success: true,
      message: 'Solicitação de sincronização de Estoque enviada ao sincronizador corporativo.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Falha ao registrar comando de sincronização de Estoque.',
      error: err.message
    }
  }
}

// Consultar status atual da sincronização de Estoque (direto do Supabase)
export async function getEstoqueSyncStatus(): Promise<EstoqueSyncStatus> {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('value, updated_at')
      .eq('cell_key', 'estoque_sync_command')
      .maybeSingle()

    if (!error && data && data.value) {
      try {
        const parsed = JSON.parse(data.value)
        return {
          ...parsed,
          updated_at: parsed.updated_at || data.updated_at
        }
      } catch { }
    }

    try {
      const res = await fetch('/api/estoque/sync-status')
      if (res.ok) return await res.json()
    } catch { }

    return { status: 'unknown' }
  } catch {
    return { status: 'error', message: 'Erro ao consultar status' }
  }
}
