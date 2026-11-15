const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const supplyPath = path.resolve(__dirname, '../Estoque/Supply.xlsx');
const outputPath = path.resolve(__dirname, '../src/data/supply_pivot_summary.json');

if (!fs.existsSync(supplyPath)) {
  console.error('Arquivo Estoque/Supply.xlsx não encontrado!');
  process.exit(1);
}

console.log('Lendo planilha:', supplyPath);
const wb = xlsx.readFile(supplyPath);
const ws = wb.Sheets['Base Supply'] || wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);
console.log(`Total de linhas carregadas: ${data.length.toLocaleString('pt-BR')}`);

const filiaisSet = new Set();
data.forEach(r => { if (r.FILIAL) filiaisSet.add(Number(r.FILIAL)); });
const filiais = Array.from(filiaisSet).sort((a,b) => a - b);

const summary = {};

data.forEach(r => {
  const status = String(r.STATUS_ESTOQUE || 'OUTROS').trim();
  const linha = String(r.DESCLINHA || 'SEM LINHA').trim();
  const codProd = String(r.CODIGO_PRODUTO || '').trim();
  const desc = String(r.DESCRICAO || '').trim();
  const codDf = String(r.CODPRODDF || '').trim();
  const filial = Number(r.FILIAL) || 0;

  const f994 = Number(r.FISICO_994) || 0;
  const l994 = Number(r.LOGICO_994) || 0;
  const t994 = Number(r.TRANSITO_994) || 0;
  const e994 = Number(r.ESTOQUE_994) || 0;

  const fLoj = Number(r.FISICO) || 0;
  const lLoj = Number(r.LOGICO) || 0;
  const tLoj = Number(r.TRANSITO) || 0;
  const eLoj = Number(r.ESTOQUE_LOJA) || 0;

  if (!summary[status]) summary[status] = {};
  if (!summary[status][linha]) {
    summary[status][linha] = {
      t994: { FISICO: 0, LOGICO: 0, TRANSITO: 0, ESTOQUE: 0 },
      fTot: {},
      skus: {}
    };
  }

  const lObj = summary[status][linha];

  if (!lObj.fTot[filial]) {
    lObj.fTot[filial] = [0, 0, 0, 0];
  }
  lObj.fTot[filial][0] += fLoj;
  lObj.fTot[filial][1] += lLoj;
  lObj.fTot[filial][2] += tLoj;
  lObj.fTot[filial][3] += eLoj;

  if (!lObj.skus[codProd]) {
    lObj.skus[codProd] = {
      c: codProd,
      d: codDf,
      n: desc,
      m9: { FISICO: f994, LOGICO: l994, TRANSITO: t994, ESTOQUE: e994 },
      fil: {}
    };
    lObj.t994.FISICO += f994;
    lObj.t994.LOGICO += l994;
    lObj.t994.TRANSITO += t994;
    lObj.t994.ESTOQUE += e994;
  }

  if (fLoj > 0 || lLoj > 0 || tLoj > 0 || eLoj > 0) {
    lObj.skus[codProd].fil[filial] = [fLoj, lLoj, tLoj, eLoj];
  }
});

const output = {
  filiais,
  statuses: Object.keys(summary),
  summary
};

fs.writeFileSync(outputPath, JSON.stringify(output));
console.log(`Pivot summary gerado com sucesso em: ${outputPath}`);
console.log(`Tamanho final: ${Math.round(fs.statSync(outputPath).size / 1024)} KB`);
