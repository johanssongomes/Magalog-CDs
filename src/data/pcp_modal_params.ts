export interface ModalParamItem {
  codmodal: string
  modalidade: string
  tipoModal?: string
  descricao?: string
}

// Regra de de-para: Modalidade -> Tipo Modal
export const MODALIDADE_TIPO_MAP: Record<string, string> = {
  'RODOVIARIO': 'Venda',
  'COURRIER': 'Venda',
  'ABA': 'Abastecimento',
  'TRANSFERENCIA': 'Tranfs'
}

export function getTipoModal(modalidade: string, codmodal?: string, descricaomodal?: string): string {
  const cod = String(codmodal || '').trim().toUpperCase()
  const desc = String(descricaomodal || '').trim().toUpperCase()
  const mod = String(modalidade || '').trim().toUpperCase()

  // Regra Oficial: RET, LEN e RLE são considerados Vendas
  if (
    cod === 'RET' || cod === 'LEN' || cod === 'RLE' ||
    desc.includes('RET') || desc.includes('LEN') || desc.includes('RLE') ||
    mod.includes('RET') || mod.includes('LEN') || mod.includes('RLE')
  ) {
    return 'Venda'
  }

  return MODALIDADE_TIPO_MAP[mod] || 'Venda'
}

export const INITIAL_MODAL_PARAMS: ModalParamItem[] = [
  { codmodal: 'RD1', modalidade: 'RODOVIARIO' },
  { codmodal: 'PRO', modalidade: 'RODOVIARIO' },
  { codmodal: 'EAL', modalidade: 'ABA' },
  { codmodal: 'TRA', modalidade: 'RODOVIARIO' },
  { codmodal: 'ABA', modalidade: 'ABA' },
  { codmodal: 'CD0', modalidade: 'COURRIER' },
  { codmodal: 'RDP', modalidade: 'COURRIER' },
  { codmodal: 'DIF', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'LEN', modalidade: 'RODOVIARIO' },
  { codmodal: 'COU', modalidade: 'COURRIER' },
  { codmodal: 'ESE', modalidade: 'COURRIER' },
  { codmodal: 'SOA', modalidade: 'ABA' },
  { codmodal: 'RET', modalidade: 'RODOVIARIO' },
  { codmodal: 'ROM', modalidade: 'RODOVIARIO' },
  { codmodal: 'PRM', modalidade: 'ABA' },
  { codmodal: 'SPO', modalidade: 'ABA' },
  { codmodal: 'RLE', modalidade: 'RODOVIARIO' },
  { codmodal: 'MUL', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'ABR', modalidade: 'ABA' },
  { codmodal: 'INA', modalidade: 'ABA' },
  { codmodal: 'RTY', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'PRF', modalidade: 'ABA' },
  { codmodal: 'RBL', modalidade: 'RODOVIARIO' },
  { codmodal: 'RBK', modalidade: 'RODOVIARIO' },
  { codmodal: 'CBK', modalidade: 'COURRIER' },
  { codmodal: 'POF', modalidade: 'ABA' },
  { codmodal: 'ATV', modalidade: 'ABA' },
  { codmodal: 'RYR', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'BAL', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'REG', modalidade: 'ABA' },
  { codmodal: 'DIN', modalidade: 'ABA' },
  { codmodal: 'DIP', modalidade: 'ABA' },
  { codmodal: 'SOS', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'DTZ', modalidade: 'COURRIER' },
  { codmodal: 'COP', modalidade: 'COURRIER' },
  { codmodal: 'CSE', modalidade: 'COURRIER' },
  { codmodal: 'SED', modalidade: 'COURRIER' },
  { codmodal: 'RUP', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'HUB', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'TEL', modalidade: 'ABA' },
  { codmodal: 'TEP', modalidade: 'ABA' },
  { codmodal: 'RPA', modalidade: 'ABA' },
  { codmodal: 'REC', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'HUR', modalidade: 'TRANSFERENCIA' }
]
