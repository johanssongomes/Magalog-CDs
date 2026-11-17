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

  console.log('Mapeando e inserindo dados com todas as 53 colunas em lotes...');
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < rawRows.length; i += batchSize) {
    const chunk = rawRows.slice(i, i + batchSize).map(r => ({
      filorig: Number(r.FILORIG) || 994,
      codfil: Number(r.CODFIL) || 994,
      filentrega: Number(r.FILENTREGA) || null,
      numlote: r.NUMLOTE !== undefined ? String(r.NUMLOTE) : null,
      fllibfat: r.FLLIBFAT !== undefined ? String(r.FLLIBFAT) : null,
      tpnota: Number(r.TPNOTA) || null,
      numpedven: r.NUMPEDVEN !== undefined ? String(r.NUMPEDVEN) : null,
      numpedcomp: r.NUMPEDCOMP !== undefined ? String(r.NUMPEDCOMP) : null,
      dtpedido: r.DTPEDIDO !== undefined ? String(r.DTPEDIDO) : null,
      dtentrega: r.DTENTREGA !== undefined ? String(r.DTENTREGA) : null,
      dtlibfat: r.DTLIBFAT !== undefined ? String(r.DTLIBFAT) : null,
      preventrega: r.PREVENTREGA !== undefined ? String(r.PREVENTREGA) : null,
      item: String(r.ITEM || ''),
      ibm: r.IBM !== undefined ? String(r.IBM) : null,
      descricao: String(r.DESCRICAO || ''),
      ref: r.REF !== undefined ? String(r.REF) : null,
      fantasia: r.FANTASIA !== undefined ? String(r.FANTASIA) : null,
      qtcomp: Number(r.QTCOMP) || 0,
      fisico: Number(r.FISICO) || 0,
      resfis: Number(r.RESFIS) || 0,
      logico: Number(r.LOGICO) || 0,
      reslog: Number(r.RESLOG) || 0,
      tecnico: Number(r.TECNICO) || 0,
      futuro: Number(r.FUTURO) || 0,
      transito: Number(r.TRANSITO) || 0,
      status: r.STATUS !== undefined ? String(r.STATUS) : null,
      situacao: r.SITUACAO !== undefined ? String(r.SITUACAO) : null,
      linha: r.LINHA !== undefined ? String(r.LINHA) : null,
      linha_ajustada: r.LINHA_AJUSTADA !== undefined ? String(r.LINHA_AJUSTADA) : null,
      nucleo: r.NUCLEO !== undefined ? String(r.NUCLEO) : null,
      familia: r.FAMILIA !== undefined ? String(r.FAMILIA) : null,
      codrota: r.CODROTA !== undefined ? String(r.CODROTA) : null,
      descricaorota: r.DESCRICAOROTA !== undefined ? String(r.DESCRICAOROTA) : null,
      codmodal: r.CODMODAL !== undefined ? String(r.CODMODAL) : null,
      descricaomodal: r.DESCRICAOMODAL !== undefined ? String(r.DESCRICAOMODAL) : null,
      status_operacao: r.STATUS_OPERACAO ? String(r.STATUS_OPERACAO) : 'EM PROCESSO',
      operacao: r.OPERACAO !== undefined ? String(r.OPERACAO) : null,
      dtalter: r.DTALTER !== undefined ? String(r.DTALTER) : null,
      cub_tot: Number(r.CUB_TOT) || 0,
      pesoliq: Number(r.PESOLIQ) || 0,
      precounit: Number(r.PRECOUNIT) || 0,
      vltotal: Number(r.VLTOTAL) || 0,
      qtped: Number(r.QTPED) || 0,
      flag_estorno_caixa: r.FLAG_ESTORNO_CAIXA !== undefined ? String(r.FLAG_ESTORNO_CAIXA) : null,
      n: r.N !== undefined ? String(r.N) : null,
      turnoagendado: r.TURNOAGENDADO !== undefined ? String(r.TURNOAGENDADO) : null,
      dtentregaagendada: r.DTENTREGAAGENDADA !== undefined ? String(r.DTENTREGAAGENDADA) : null,
      cod_vendedor: r.COD_VENDEDOR !== undefined ? String(r.COD_VENDEDOR) : null,
      prazo_entrega: r.PRAZO_ENTREGA !== undefined ? String(r.PRAZO_ENTREGA) : null,
      data_entrega_prevista: r.DATA_ENTREGA_PREVISTA !== undefined ? String(r.DATA_ENTREGA_PREVISTA) : null,
      cep_entrega: r.CEP_ENTREGA !== undefined ? String(r.CEP_ENTREGA) : null,
      dt_hr_libfat: r.DT_HR_LIBFAT !== undefined ? String(r.DT_HR_LIBFAT) : null,
      faixa_dias_reduzida: r.FAIXA_DIAS_REDUZIDA !== undefined ? String(r.FAIXA_DIAS_REDUZIDA) : null
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
