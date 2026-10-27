/**
 * Utilitário para filtragem hierárquica de liderança (Árvore de Subordinação)
 * 
 * Regra:
 * - Se o usuário logado for Admin Master (ou possuir acesso irrestrito), tem visão geral total.
 * - Caso contrário (Líder, Supervisor, Coordenador, etc.), ele visualiza:
 *     1. A si próprio (para acompanhar seus próprios apontamentos/dados)
 *     2. Seus liderados diretos (cujo idLider é o ID dele)
 *     3. Subordinados indiretos em cascata (liderados dos seus supervisores/líderes)
 */

export function getHierarchyUserIds(
  currentUserId: string | undefined | null,
  allColaboradores: Array<{ id?: string | number; idLider?: string | number; [key: string]: any }>,
  isAdminOrMaster: boolean = false
): Set<string> | null {
  // Se for Admin ou Master, retorna null indicando que NÃO deve restringir (visão total)
  if (isAdminOrMaster || !currentUserId) {
    return null
  }

  const cleanCurrentId = String(currentUserId).trim().toLowerCase()
  if (!cleanCurrentId) {
    return null
  }

  // Monta mapa de líder -> lista de subordinados diretos
  const subordinatesMap = new Map<string, string[]>()

  allColaboradores.forEach(c => {
    const cId = String(c.id || '').trim().toLowerCase()
    const leaderId = String(c.idLider || '').trim().toLowerCase()

    if (leaderId && cId) {
      if (!subordinatesMap.has(leaderId)) {
        subordinatesMap.set(leaderId, [])
      }
      subordinatesMap.get(leaderId)!.push(cId)
    }
  })

  // Coleta recursiva em cascata (BFS/DFS) de toda a árvore descendente
  const allowedIds = new Set<string>()
  allowedIds.add(cleanCurrentId) // O próprio colaborador pode se ver

  const queue: string[] = [cleanCurrentId]

  while (queue.length > 0) {
    const leader = queue.shift()!
    const subs = subordinatesMap.get(leader) || []
    for (const subId of subs) {
      if (!allowedIds.has(subId)) {
        allowedIds.add(subId)
        queue.push(subId)
      }
    }
  }

  return allowedIds
}
