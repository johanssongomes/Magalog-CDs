const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Compiling CEP ranges from Conta frete 1 and Conta frete 2...');

const cf1Path = path.resolve(__dirname, '../Estoque/Conta frete 1.xlsb');
const cf2Path = path.resolve(__dirname, '../Estoque/Conta frete 2.xlsb');

if (!fs.existsSync(cf1Path) || !fs.existsSync(cf2Path)) {
  console.error('Planilhas Conta frete 1 ou 2 não encontradas em Estoque/');
  process.exit(1);
}

const wb1 = XLSX.readFile(cf1Path);
const cta1 = XLSX.utils.sheet_to_json(wb1.Sheets['CTA FRETE SITE'], { range: 1 });

const wb2 = XLSX.readFile(cf2Path);
const sedex = XLSX.utils.sheet_to_json(wb2.Sheets['Tabela Sedex']);

function toOfficialRoute(loc, geo) {
  if (!loc) return null;
  const l = String(loc).trim().toUpperCase();
  const g = String(geo || '').trim().toUpperCase();

  if (l.startsWith('994-FORTALEZA')) {
    const letra = l.replace('994-FORTALEZA', '').trim();
    if (letra.length === 1) return '994-EC2 CE FORTALEZA ' + letra;
  }
  if (l === '994-CAUCAIA A' || l === '994-CAUCAIA B') {
    return '994-EC1 CE ' + l.replace('994-', '');
  }
  if (l.startsWith('994-')) {
    const baseName = l.replace('994-', '').trim();
    if (g.startsWith('SAT')) {
      const satClean = g.replace(/[^0-9]/g, '');
      return '994-EC1 CE ' + baseName + ' SAT ' + satClean;
    } else {
      return '994-EC1 CE ' + baseName;
    }
  }
  if (l === 'LOGPLACE' || g.includes('FRACIONADO')) {
    return 'LOGPLACE';
  }
  return l;
}

// 1. Logplace ranges
const logplaceRanges = [];
const seenLogplace = new Set();

// 2. CTA1 general ranges (Fortaleza, Pacajus, Sobral, etc.)
const ctaGeneralRanges = [];
const seenCta = new Set();

for (const r of cta1) {
  const ini = Number(r['CEP Inicial']);
  const fim = Number(r['CEP Final']);
  if (!ini || !fim) continue;
  const loc = String(r['LOCALIZAÇÃO COMERCIAL'] || '').trim().toUpperCase();
  const geo = String(r['GEOGRAFIA COMERCIAL'] || '').trim().toUpperCase();
  const transp = String(r['Transportador a considerar'] || '').trim().toUpperCase();
  const cidade = String(r['Localidade'] || '').trim();
  const uf = String(r['UF'] || '').trim();

  const k = ini + '-' + fim;

  if (loc === 'LOGPLACE' || transp === 'LOGPLACE') {
    if (!seenLogplace.has(k)) {
      seenLogplace.add(k);
      logplaceRanges.push({
        ini,
        fim,
        tipo: 'LOGPLACE',
        rota: 'LOGPLACE',
        regiao: 'INTERIOR',
        cidade,
        uf
      });
    }
  } else {
    if (!seenCta.has(k)) {
      seenCta.add(k);
      const rotaOficial = toOfficialRoute(loc, geo);
      ctaGeneralRanges.push({
        ini,
        fim,
        tipo: 'POLO',
        rota: rotaOficial,
        cidade,
        uf
      });
    }
  }
}

// 3. Sedex ranges
const sedexRanges = [];
const seenSedex = new Set();
for (const r of sedex) {
  const ini = Number(r['CEP INICIAL']);
  const fim = Number(r['CEP FINAL']);
  if (!ini || !fim) continue;
  const k = ini + '-' + fim;
  if (!seenSedex.has(k)) {
    seenSedex.add(k);
    const loc = String(r['LOCALIZAÇÃO'] || '').toUpperCase();
    const isCapital = loc.includes('CAPITAL');
    sedexRanges.push({
      ini,
      fim,
      tipo: 'SEDEX',
      rota: isCapital ? 'SEDEX - CAPITAL' : 'SEDEX - INTERIOR',
      regiao: isCapital ? 'CAPITAL' : 'INTERIOR',
      cidade: r['CIDADE'] || '',
      uf: r['UF'] || ''
    });
  }
}

console.log(`Logplace ranges: ${logplaceRanges.length}`);
console.log(`Sedex ranges: ${sedexRanges.length}`);
console.log(`CTA1 general ranges: ${ctaGeneralRanges.length}`);

const header = `export interface CepRangeRule {
  ini: number
  fim: number
  tipo: 'LOGPLACE' | 'SEDEX' | 'POLO'
  rota: string
  regiao?: string
  cidade?: string
  uf?: string
}

export const CEP_RANGES_LOGPLACE: CepRangeRule[] = ${JSON.stringify(logplaceRanges, null, 2)}

export const CEP_RANGES_SEDEX: CepRangeRule[] = ${JSON.stringify(sedexRanges, null, 2)}

export const CEP_RANGES_CONTA_FRETE: CepRangeRule[] = ${JSON.stringify(ctaGeneralRanges, null, 2)}

// Helper para localizar faixa em lista de ranges ordenada
export function findCepInRange(numCep: number, ranges: CepRangeRule[]): CepRangeRule | undefined {
  if (!numCep) return undefined
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    if (numCep >= r.ini && numCep <= r.fim) {
      return r
    }
  }
  return undefined
}
`;

const outputPath = path.resolve(__dirname, '../src/data/pcp_cep_ranges_params.ts');
fs.writeFileSync(outputPath, header, 'utf8');
console.log(`Arquivo gerado com sucesso em: ${outputPath}`);
