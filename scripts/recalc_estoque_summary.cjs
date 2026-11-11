const xlsx = require('xlsx');
const fs = require('fs');

console.log('1. Carregando Basevalores...');
const wbValores = xlsx.readFile('Estoque/Basevalores.xlsx');
const rowsValores = xlsx.utils.sheet_to_json(wbValores.Sheets[wbValores.SheetNames[0]]);
const mapaCustos = new Map();
rowsValores.forEach(r => {
  const cod = String(r.COD_GEMCO ?? '').trim();
  const custo = parseFloat(r.CUSTO_INV) || 0;
  if (cod && custo > 0) mapaCustos.set(cod, custo);
});
console.log('Custos carregados:', mapaCustos.size);

console.log('2. Carregando EstoqueCD...');
const wbEstoque = xlsx.readFile('Estoque/EstoqueCD.xlsx');
const rowsEstoque = xlsx.utils.sheet_to_json(wbEstoque.Sheets[wbEstoque.SheetNames[0]]);

// Mapear quantos volumes cada produto master possui
const masterVolumesCount = new Map();
rowsEstoque.forEach(r => {
  const cod = String(r.CODIGO || '').trim();
  const gemco = String(r.COD_GEMCO || '').trim();
  const ds = String(r.DS_ITEM || '').toUpperCase();

  // Caso 1: CODIGO contém barra (ex: 7942242/2)
  if (cod.includes('/')) {
    const parts = cod.split('/');
    const master = parts[0];
    const volNum = parseInt(parts[1], 10);
    if (!isNaN(volNum)) {
      const currentMax = masterVolumesCount.get(master) || 0;
      if (volNum > currentMax) masterVolumesCount.set(master, volNum);
    }
  }

  // Caso 2: DS_ITEM contém padrão VOL:X/Y ou VOL X/Y
  const volMatch = ds.match(/VOL:?\s*(\d+)\s*\/\s*(\d+)/);
  if (volMatch) {
    const totalVols = parseInt(volMatch[2], 10);
    const master = gemco || cod.split('/')[0];
    if (!isNaN(totalVols) && totalVols > 0) {
      const currentMax = masterVolumesCount.get(master) || 0;
      if (totalVols > currentMax) masterVolumesCount.set(master, totalVols);
    }
  }
});
console.log('Itens com múltiplos volumes identificados:', masterVolumesCount.size);

const mapping = {
  '99ACE': 'Madeira',
  '99AER': 'Mercado',
  '99ALM': 'Mercado',
  '99BDC': 'Mercado',
  '99BEB': 'Mercado',
  '99COF': 'Cofre',
  '99COL': 'Colchão/Estofado',
  '99DIV': 'Diversos',
  '99ECC': 'Colchão/Estofado',
  '99EIS': 'Diversos',
  '99HIG': 'Mercado',
  '99LIM': 'Mercado',
  '99LIV': 'Mercado',
  '99LNB': 'Eletro Pesado',
  '99MOV': 'Madeira',
  '99PDE': 'Diversos',
  '99PET': 'Mercado',
  '99PNE': 'Pneu',
  '99TV': 'Imagem'
};

const capacidades = {
  'Cofre': 127,
  'Colchão/Estofado': 5226,
  'Diversos': 2975,
  'Eletro Pesado': 13128,
  'Linha Branca': 13128,
  'Imagem': 2535,
  'Madeira': 2798,
  'Mercado': 358,
  'Pneu': 372
};

function summarize(filterBom) {
  const catTotals = {};
  let totalCub = 0;
  let totalQtd = 0;
  let totalValor = 0;
  let countRows = 0;

  rowsEstoque.forEach(r => {
    const area = String(r.DS_AREA_ERP || '').trim().toUpperCase();
    if (filterBom && area !== 'BOM') return;

    countRows++;
    const cod = String(r.CODIGO || '').trim();
    const gemco = String(r.COD_GEMCO || '').trim();
    const master = gemco || cod.split('/')[0];
    const c = r.CLASSE_ITEM || 'Outros';
    const cat = mapping[c] || 'Diversos';
    const cub = Number(r.CUB_TOTAL) || 0;
    const qnts = Number(r.QNTS) || 0;

    // Custo dividido pelo número de volumes
    const custoMaster = mapaCustos.get(master) || mapaCustos.get(cod) || 0;
    const numVolumes = masterVolumesCount.get(master) || 1;
    const custoUnitarioVolume = numVolumes > 1 ? (custoMaster / numVolumes) : custoMaster;
    const valorItem = qnts * custoUnitarioVolume;

    if (!catTotals[cat]) {
      catTotals[cat] = { cubagem: 0, pecas: 0, valor: 0, itens: 0 };
    }
    catTotals[cat].cubagem += cub;
    catTotals[cat].pecas += qnts;
    catTotals[cat].valor += valorItem;
    catTotals[cat].itens += 1;
    totalCub += cub;
    totalQtd += qnts;
    totalValor += valorItem;
  });

  const totalCapacidade = 27519;
  return {
    totalCubagem: Math.round(totalCub * 100) / 100,
    totalCapacidade,
    totalOcupacao: totalCapacidade > 0 ? Math.round((totalCub / totalCapacidade) * 1000) / 10 : 0,
    totalPecas: totalQtd,
    totalValor: Math.round(totalValor * 100) / 100,
    totalLinhas: countRows,
    categorias: Object.entries(catTotals).map(([nome, val]) => {
      const cap = capacidades[nome] || 0;
      const cub = Math.round(val.cubagem * 100) / 100;
      const ocupacao = cap > 0 ? (cub / cap) * 100 : 0;
      return {
        nome,
        cubagem: cub,
        capacidade: cap,
        ocupacao: Math.round(ocupacao * 10) / 10,
        pecas: val.pecas,
        valor: Math.round(val.valor * 100) / 100,
        itens: val.itens,
        percentual: totalCub > 0 ? Math.round((cub / totalCub) * 1000) / 10 : 0
      };
    }).sort((a,b) => b.cubagem - a.cubagem)
  };
}

const resBom = summarize(true);
console.log('Result BOM:');
console.log('Total Valor BOM: R$', resBom.totalValor);
resBom.categorias.forEach(c => {
  console.log(' - ' + c.nome + ': R$ ' + c.valor + ' (' + c.cubagem + ' m³)');
});

const fullSummary = {
  updatedAt: new Date().toISOString(),
  capacidades,
  bomOnly: summarize(true),
  todos: summarize(false)
};
fs.writeFileSync('src/data/estoque_categoria_summary.json', JSON.stringify(fullSummary, null, 2));
console.log('estoque_categoria_summary.json atualizado com sucesso!');
