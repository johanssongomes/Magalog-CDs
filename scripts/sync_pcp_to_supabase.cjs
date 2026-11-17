const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPcp() {
  const pcpPath = path.resolve(__dirname, "../Estoque/PCP J'S MARTINS.xlsx");
  if (!fs.existsSync(pcpPath)) {
    console.error('Arquivo não encontrado:', pcpPath);
    process.exit(1);
  }

  console.log('Lendo planilha:', pcpPath);
  const wb = xlsx.readFile(pcpPath);
  const ws = wb.Sheets['Plan1'] || wb.Sheets[wb.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(ws);
  console.log(`Total de linhas lidas: ${rawRows.length.toLocaleString('pt-BR')}`);

  console.log('Limpando tabela pcp_js_martins no Supabase...');
  const { error: delErr } = await supabase.from('pcp_js_martins').delete().neq('id', 0);
  if (delErr) {
    console.warn('Aviso ao limpar tabela:', delErr.message);
  }

  console.log('Mapeando e inserindo dados em lotes...');
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < rawRows.length; i += batchSize) {
    const chunk = rawRows.slice(i, i + batchSize).map(r => ({
      filorig: Number(r.FILORIG) || 994,
      codfil: Number(r.CODFIL) || 994,
      filentrega: Number(r.FILENTREGA) || null,
      numlote: r.NUMLOTE ? String(r.NUMLOTE) : null,
      fllibfat: r.FLLIBFAT ? String(r.FLLIBFAT) : null,
      tpnota: Number(r.TPNOTA) || null,
      numpedven: r.NUMPEDVEN ? String(r.NUMPEDVEN) : null,
      numpedcomp: r.NUMPEDCOMP ? String(r.NUMPEDCOMP) : null,
      dtpedido: r.DTPEDIDO ? String(r.DTPEDIDO) : null,
      dtentrega: r.DTENTREGA ? String(r.DTENTREGA) : null,
      dtlibfat: r.DTLIBFAT ? String(r.DTLIBFAT) : null,
      preventrega: r.PREVENTREGA ? String(r.PREVENTREGA) : null,
      item: String(r.ITEM || ''),
      ibm: r.IBM ? String(r.IBM) : null,
      descricao: String(r.DESCRICAO || ''),
      ref: r.REF ? String(r.REF) : null,
      fantasia: r.FANTASIA ? String(r.FANTASIA) : null,
      qtcomp: Number(r.QTCOMP) || 0,
      fisico: Number(r.FISICO) || 0,
      resfis: Number(r.RESFIS) || 0,
      logico: Number(r.LOGICO) || 0,
      reslog: Number(r.RESLOG) || 0,
      tecnico: Number(r.TECNICO) || 0,
      futuro: Number(r.FUTURO) || 0,
      transito: Number(r.TRANSITO) || 0,
      status: r.STATUS ? String(r.STATUS) : null,
      situacao: r.SITUACAO ? String(r.SITUACAO) : null,
      linha: r.LINHA ? String(r.LINHA) : null,
      linha_ajustada: r.LINHA_AJUSTADA ? String(r.LINHA_AJUSTADA) : null,
      nucleo: r.NUCLEO ? String(r.NUCLEO) : null,
      familia: r.FAMILIA ? String(r.FAMILIA) : null,
      codrota: r.CODROTA ? String(r.CODROTA) : null,
      descricaorota: r.DESCRICAOROTA ? String(r.DESCRICAOROTA) : null,
      codmodal: r.CODMODAL ? String(r.CODMODAL) : null,
      descricaomodal: r.DESCRICAOMODAL ? String(r.DESCRICAOMODAL) : null,
      status_operacao: r.STATUS_OPERACAO ? String(r.STATUS_OPERACAO) : 'EM PROCESSO',
      operacao: r.OPERACAO ? String(r.OPERACAO) : null,
      cub_tot: Number(r.CUB_TOT) || 0,
      pesoliq: Number(r.PESOLIQ) || 0,
      precounit: Number(r.PRECOUNIT) || 0,
      vltotal: Number(r.VLTOTAL) || 0,
      qtped: Number(r.QTPED) || 0,
      dtentregaagendada: r.DTENTREGAAGENDADA ? String(r.DTENTREGAAGENDADA) : null,
      dt_hr_libfat: r.DT_HR_LIBFAT ? String(r.DT_HR_LIBFAT) : null,
      faixa_dias_reduzida: r.FAIXA_DIAS_REDUZIDA ? String(r.FAIXA_DIAS_REDUZIDA) : null
    }));

    const { error: insErr } = await supabase.from('pcp_js_martins').insert(chunk);
    if (insErr) {
      console.error(`Erro ao inserir lote ${i} - ${i + batchSize}:`, insErr.message);
      break;
    }
    inserted += chunk.length;
    console.log(`Progresso: ${inserted.toLocaleString('pt-BR')} de ${rawRows.length.toLocaleString('pt-BR')} registros inseridos...`);
  }

  console.log(`Carga finalizada com sucesso! Total inserido: ${inserted.toLocaleString('pt-BR')}`);
}

syncPcp();
