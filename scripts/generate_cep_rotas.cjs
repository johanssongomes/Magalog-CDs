const fs = require('fs');

const sample = JSON.parse(fs.readFileSync('src/data/pcp_planning_summary.json', 'utf8'));

function cleanCep(c) {
  if (!c && c !== 0) return '';
  let str = String(c).trim().replace(/\.0+$/, '').replace(/\D/g, '');
  if (!str) return '';
  if (str.length <= 5) return str;
  return str.padStart(8, '0').slice(-8);
}

function isGeneric(r) {
  if (!r) return true;
  const upper = r.toUpperCase();
  if (upper.includes('CANDEIAS')) return true;
  if (upper.includes('TR NE')) return true;
  if (upper.includes('1500-RP1')) return true;
  if (upper.includes('3NW 4SX 5XX-CE CAP')) return true;
  if (upper.includes('5XX-CE CAP') && !upper.includes('FORTALEZA') && !upper.includes('CAUCAIA') && !upper.includes('MARACANAU')) return true;
  if (upper.includes('5XX-CE INT') && !upper.includes('994') && !upper.includes('991')) return true;
  if (upper.includes('1SX 2SX') && !upper.includes('994') && !upper.includes('991')) return true;
  if (upper.includes('1NW 2NW') && !upper.includes('994') && !upper.includes('991')) return true;
  return false;
}

const cepCounts = new Map();
const prefix5Counts = new Map();

for (const r of sample) {
  const rota = (r.descricaorota || '').trim();
  if (rota && !isGeneric(rota)) {
    const cep = cleanCep(r.cep_entrega);
    if (cep && cep.length === 8) {
      if (!cepCounts.has(cep)) cepCounts.set(cep, {});
      cepCounts.get(cep)[rota] = (cepCounts.get(cep)[rota] || 0) + 1;

      const p5 = cep.slice(0, 5);
      if (!prefix5Counts.has(p5)) prefix5Counts.set(p5, {});
      prefix5Counts.get(p5)[rota] = (prefix5Counts.get(p5)[rota] || 0) + 1;
    }
  }
}

const list = [];
for (const [cep, rotas] of cepCounts.entries()) {
  const bestRota = Object.entries(rotas).sort((a,b) => b[1] - a[1])[0][0];
  list.push({ cep, descricaorota: bestRota });
}

for (const [p5, rotas] of prefix5Counts.entries()) {
  const bestRota = Object.entries(rotas).sort((a,b) => b[1] - a[1])[0][0];
  list.push({ cep: p5, descricaorota: bestRota, cidade: 'Região Prefix ' + p5 });
}

const knownPrefixes = [
  { cep: '62870', descricaorota: '994-EC1 CE PACAJUS', cidade: 'Pacajus' },
  { cep: '62900', descricaorota: '994-EC1 CE LIMOEIRO DO NORTE', cidade: 'Limoeiro do Norte' },
  { cep: '62940', descricaorota: '994-EC1 CE LIMOEIRO DO NORTE SAT 1', cidade: 'Morada Nova / Limoeiro' },
  { cep: '63000', descricaorota: '994-EC1 CE JUAZ DO NORTE', cidade: 'Juazeiro do Norte' },
  { cep: '63010', descricaorota: '994-EC1 CE JUAZ DO NORTE', cidade: 'Juazeiro do Norte' },
  { cep: '63015', descricaorota: '994-EC1 CE JUAZ DO NORTE', cidade: 'Juazeiro do Norte' },
  { cep: '63020', descricaorota: '994-EC1 CE JUAZ DO NORTE', cidade: 'Juazeiro do Norte' },
  { cep: '63030', descricaorota: '994-EC1 CE JUAZ DO NORTE', cidade: 'Juazeiro do Norte' },
  { cep: '63100', descricaorota: '994-EC1 CE CRATO', cidade: 'Crato' },
  { cep: '63120', descricaorota: '994-EC1 CE CRATO', cidade: 'Crato' },
  { cep: '63140', descricaorota: '994-EC1 CE BARBALHA', cidade: 'Barbalha' },
  { cep: '63500', descricaorota: '994-EC1 CE IGUATU', cidade: 'Iguatu' },
  { cep: '63504', descricaorota: '994-EC1 CE IGUATU', cidade: 'Iguatu' },
  { cep: '62700', descricaorota: '994-EC1 CE CANINDE', cidade: 'Canindé' },
  { cep: '62750', descricaorota: '994-EC1 CE CANINDE SAT 1', cidade: 'Aratuba / Canindé' },
  { cep: '62760', descricaorota: '994-EC1 CE CANINDE SAT 2', cidade: 'Baturité / Canindé' },
  { cep: '62764', descricaorota: '994-EC1 CE CANINDE SAT 2', cidade: 'Guaramiranga / Canindé' },
  { cep: '62800', descricaorota: '994-EC1 CE ARACATI', cidade: 'Aracati' },
  { cep: '62840', descricaorota: '994-EC1 CE ARACATI SAT 1', cidade: 'Beberibe / Aracati' },
  { cep: '62400', descricaorota: '994-EC1 CE CAMOCIM', cidade: 'Camocim' },
  { cep: '62414', descricaorota: '994-EC1 CE CAMOCIM SAT 1', cidade: 'Barroquinha / Camocim' },
  { cep: '62450', descricaorota: '994-EC1 CE CAMOCIM SAT 2', cidade: 'Granja / Camocim' },
  { cep: '62000', descricaorota: '994-EC1 CE SOBRAL', cidade: 'Sobral' },
  { cep: '62010', descricaorota: '994-EC1 CE SOBRAL', cidade: 'Sobral' },
  { cep: '62200', descricaorota: '994-EC1 CE SOBRAL SAT 1', cidade: 'Sobral Polo' },
  { cep: '62270', descricaorota: '994-EC1 CE SANTA QUITERIA', cidade: 'Catunda / Sta Quitéria' },
  { cep: '62285', descricaorota: '994-EC1 CE SANTA QUITERIA', cidade: 'Varjota / Sta Quitéria' },
  { cep: '61600', descricaorota: '994-EC1 CE CAUCAIA A', cidade: 'Caucaia' },
  { cep: '61606', descricaorota: '994-EC1 CE CAUCAIA A', cidade: 'Caucaia Centro' },
  { cep: '61629', descricaorota: '994-EC1 CE CAUCAIA B', cidade: 'Caucaia Litoral' },
  { cep: '61900', descricaorota: '994-EC1 CE MARACANAU', cidade: 'Maracanaú' },
  { cep: '61976', descricaorota: '994-EC1 CE MARANGUAPE SAT 1', cidade: 'Maranguape Interior' },
  { cep: '61800', descricaorota: '994-EC1 CE MARANGUAPE', cidade: 'Maranguape' },
  { cep: '61801', descricaorota: '994-EC1 CE MARANGUAPE', cidade: 'Maranguape' }
];

for (const kp of knownPrefixes) {
  if (!list.some(x => x.cep === kp.cep)) {
    list.push(kp);
  }
}

list.sort((a,b) => a.cep.localeCompare(b.cep));

const header = `export interface CepRotaParamItem {
  cep: string          // CEP de 8 dígitos ou prefixo de 5 dígitos
  descricaorota: string // Rota oficial correspondente (ex: '994-EC1 CE PACAJUS' ou '994-EC2 CE FORTALEZA A')
  destino?: string     // Destino opcional (ex: 'PACAJUS')
  regiao?: string      // Região opcional (ex: 'METROPOLITANA')
  cidade?: string      // Cidade/bairro ou observação
}

// Limpa e normaliza CEP para busca
export function cleanCep(c: any): string {
  if (!c && c !== 0) return ''
  let str = String(c).trim().replace(/\\.0+$/, '').replace(/\\D/g, '')
  if (!str) return ''
  if (str.length <= 5) return str
  return str.padStart(8, '0').slice(-8)
}

// Detecta se uma rota é genérica de trânsito/cross-docking
export function isGenericRoute(r: string | undefined | null): boolean {
  if (!r) return true
  const upper = r.trim().toUpperCase()
  if (upper.includes('CANDEIAS')) return true
  if (upper.includes('TR NE CEARA')) return true
  if (upper.includes('1500-RP1')) return true
  if (upper.includes('3NW 4SX 5XX-CE CAP')) return true
  if (upper.includes('5XX-CE CAP') && !upper.includes('FORTALEZA') && !upper.includes('CAUCAIA') && !upper.includes('MARACANAU')) return true
  if (upper.includes('5XX-CE INT') && !upper.includes('994') && !upper.includes('991')) return true
  if (upper.includes('1SX 2SX') && !upper.includes('994') && !upper.includes('991')) return true
  if (upper.includes('1NW 2NW') && !upper.includes('994') && !upper.includes('991')) return true
  return false
}

export const INITIAL_CEP_ROTA_PARAMS: CepRotaParamItem[] = `;

fs.writeFileSync('src/data/pcp_cep_rotas_params.ts', header + JSON.stringify(list, null, 2) + '\n', 'utf8');
console.log('Successfully written src/data/pcp_cep_rotas_params.ts with ' + list.length + ' rules.');
