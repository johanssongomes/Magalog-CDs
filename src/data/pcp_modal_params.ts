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

export function getTipoModal(modalidade: string): string {
  const mod = (modalidade || '').trim().toUpperCase()
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
  { codmodal: 'LEN', modalidade: 'ABA' },
  { codmodal: 'COU', modalidade: 'COURRIER' },
  { codmodal: 'ESE', modalidade: 'COURRIER' },
  { codmodal: 'SOA', modalidade: 'ABA' },
  { codmodal: 'RET', modalidade: 'ABA' },
  { codmodal: 'ROM', modalidade: 'RODOVIARIO' },
  { codmodal: 'PRM', modalidade: 'ABA' },
  { codmodal: 'SPO', modalidade: 'ABA' },
  { codmodal: 'RLE', modalidade: 'ABA' },
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
  { codmodal: 'COG', modalidade: 'COURRIER' },
  { codmodal: 'DEN', modalidade: 'COURRIER' },
  { codmodal: 'RUP', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'HUB', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'TEL', modalidade: 'ABA' },
  { codmodal: 'TEP', modalidade: 'ABA' },
  { codmodal: 'RPA', modalidade: 'ABA' },
  { codmodal: 'REC', modalidade: 'TRANSFERENCIA' },
  { codmodal: 'HUR', modalidade: 'TRANSFERENCIA' }
]
