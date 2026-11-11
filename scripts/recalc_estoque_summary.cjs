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

function getFaixaDias(dias) {
  if (dias === 0) return '0 DIAS';
  if (dias <= 7) return '7 DIAS';
  if (dias <= 30) return '30 DIAS';
  if (dias <= 90) return '90 DIAS';
  if (dias <= 120) return '120 DIAS';
  return 'ACIMA DE 120 DIAS';
}

function summarizeBloqueios() {
  const bloqRows = rowsEstoque.filter(r => String(r.DS_AREA_ERP || '').trim().toUpperCase() === 'BLOQUEADO');
  const motivosMap = {};
  let totalPecas = 0;
  let totalCubagem = 0;
  let totalValor = 0;
  const allSkusSet = new Set();
  const totalFaixas = {
    '0 DIAS': 0,
    '7 DIAS': 0,
    '30 DIAS': 0,
    '90 DIAS': 0,
    '120 DIAS': 0,
    'ACIMA DE 120 DIAS': 0
  };

  bloqRows.forEach(r => {
    let rawMotivo = String(r.AREA_ARMEZENAGEM || 'OUTROS').trim();
    const motivo = rawMotivo.replace(/^\d+\s*-\s*/, '').trim();
    const cod = String(r.CODIGO || '').trim();
    const gemco = String(r.COD_GEMCO || '').trim();
    const master = gemco || cod.split('/')[0];
    const qnts = Number(r.QNTS) || 0;
    const cub = Number(r.CUB_TOTAL) || 0;
    const dias = Number(r.DIAS_ARMAZENAGEM) || 0;
    const faixa = getFaixaDias(dias);

    const custoMaster = mapaCustos.get(master) || mapaCustos.get(cod) || 0;
    const numVolumes = masterVolumesCount.get(master) || 1;
    const custoUnitarioVolume = numVolumes > 1 ? (custoMaster / numVolumes) : custoMaster;
    const valorItem = qnts * custoUnitarioVolume;

    allSkusSet.add(master);
    totalPecas += qnts;
    totalCubagem += cub;
    totalValor += valorItem;
    totalFaixas[faixa] += valorItem;

    if (!motivosMap[motivo]) {
      motivosMap[motivo] = {
        motivo,
        skusSet: new Set(),
        pecas: 0,
        cubagem: 0,
        valorTotal: 0,
        faixas: {
          '0 DIAS': 0,
          '7 DIAS': 0,
          '30 DIAS': 0,
          '90 DIAS': 0,
          '120 DIAS': 0,
          'ACIMA DE 120 DIAS': 0
        },
        itemsMap: {}
      };
    }
    const item = motivosMap[motivo];
    item.skusSet.add(master);
    item.pecas += qnts;
    item.cubagem += cub;
    item.valorTotal += valorItem;
    item.faixas[faixa] += valorItem;

    if (master) {
      if (!item.itemsMap[master]) {
        item.itemsMap[master] = {
          empresa: r.EMPRESA || '1994 - CD994-MARACANAU',
          sku: master,
          descricao: r.DS_ITEM || '',
          linha: r.DS_LINHA || '',
          classe: r.CLASSE_ITEM || '',
          endereco: r.END3 || '',
          diasBloq: dias,
          pecas: 0,
          cubagem: 0,
          valorTotal: 0
        };
      }
      const it = item.itemsMap[master];
      it.pecas += qnts;
      it.cubagem += cub;
      it.valorTotal += valorItem;
      if (dias > it.diasBloq) it.diasBloq = dias;
    }
  });

  const motivos = Object.values(motivosMap).map(m => ({
    motivo: m.motivo,
    skus: m.skusSet.size,
    pecas: m.pecas,
    cubagem: Math.round(m.cubagem * 100) / 100,
    valorTotal: Math.round(m.valorTotal * 100) / 100,
    faixas: {
      '0 DIAS': Math.round(m.faixas['0 DIAS'] * 100) / 100,
      '7 DIAS': Math.round(m.faixas['7 DIAS'] * 100) / 100,
      '30 DIAS': Math.round(m.faixas['30 DIAS'] * 100) / 100,
      '90 DIAS': Math.round(m.faixas['90 DIAS'] * 100) / 100,
      '120 DIAS': Math.round(m.faixas['120 DIAS'] * 100) / 100,
      'ACIMA DE 120 DIAS': Math.round(m.faixas['ACIMA DE 120 DIAS'] * 100) / 100
    },
    items: Object.values(m.itemsMap).map(it => ({
      ...it,
      cubagem: Math.round(it.cubagem * 1000) / 1000,
      valorTotal: Math.round(it.valorTotal * 100) / 100
    })).sort((a, b) => b.valorTotal - a.valorTotal)
  })).sort((a, b) => b.valorTotal - a.valorTotal);

  return {
    totalLinhas: bloqRows.length,
    totalSkus: allSkusSet.size,
    totalPecas,
    totalCubagem: Math.round(totalCubagem * 100) / 100,
    totalValor: Math.round(totalValor * 100) / 100,
    totalFaixas: {
      '0 DIAS': Math.round(totalFaixas['0 DIAS'] * 100) / 100,
      '7 DIAS': Math.round(totalFaixas['7 DIAS'] * 100) / 100,
      '30 DIAS': Math.round(totalFaixas['30 DIAS'] * 100) / 100,
      '90 DIAS': Math.round(totalFaixas['90 DIAS'] * 100) / 100,
      '120 DIAS': Math.round(totalFaixas['120 DIAS'] * 100) / 100,
      'ACIMA DE 120 DIAS': Math.round(totalFaixas['ACIMA DE 120 DIAS'] * 100) / 100
    },
    motivos
  };
}

const resBom = summarize(true);
console.log('Result BOM:');
console.log('Total Valor BOM: R$', resBom.totalValor);
resBom.categorias.forEach(c => {
  console.log(' - ' + c.nome + ': R$ ' + c.valor + ' (' + c.cubagem + ' m³)');
});

const resBloqueios = summarizeBloqueios();
console.log('Result Bloqueios:');
console.log('Total Valor Bloqueios: R$', resBloqueios.totalValor, 'm³:', resBloqueios.totalCubagem, 'SKUs:', resBloqueios.totalSkus);

const fullSummary = {
  updatedAt: new Date().toISOString(),
  capacidades,
  bomOnly: summarize(true),
  todos: summarize(false),
  bloqueios: resBloqueios
};
fs.writeFileSync('src/data/estoque_categoria_summary.json', JSON.stringify(fullSummary, null, 2));
console.log('estoque_categoria_summary.json atualizado com sucesso!');

