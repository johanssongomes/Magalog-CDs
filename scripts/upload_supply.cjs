const fs = require('fs');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://alwkfgqylejckbgienju.supabase.co';
const supabaseKey = 'sb_publishable_dG6fHMjcet0Iek_PiS52IA_1xiveTKh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadSupply() {
  console.log('1. Lendo arquivo Estoque/Supply.xlsx (Aba "Base Supply")...');
  const startRead = Date.now();
  const wb = xlsx.readFile('Estoque/Supply.xlsx');
  const sheet = wb.Sheets['Base Supply'] || wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`Leitura concluída em ${((Date.now() - startRead) / 1000).toFixed(1)}s. Total de linhas: ${rows.length}`);

  // Limpeza e formatação dos registros
  console.log('2. Formatando registros para a tabela supply_lojas...');
  const formattedRecords = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    
    formattedRecords.push({
      codfil: Number(r.CODFIL) || 994,
      codigo_produto: String(r.CODIGO_PRODUTO ?? '').trim(),
      codproddf: String(r.CODPRODDF ?? '').trim(),
      descricao: String(r.DESCRICAO ?? '').trim(),

      fisico_994: Number(r.FISICO_994) || 0,
      tecnico_994: Number(r.TECNICO_994) || 0,
      resfis_994: Number(r.RESFIS_994) || 0,
      reslog_994: Number(r.RESLOG_994) || 0,
      logico_994: Number(r.LOGICO_994) || 0,
      transito_994: Number(r.TRANSITO_994) || 0,
      estoque_994: Number(r.ESTOQUE_994) || 0,

      filial: Number(r.FILIAL) || 0,
      fisico: Number(r.FISICO) || 0,
      tecnico: Number(r.TECNICO) || 0,
      resfis: Number(r.RESFIS) || 0,
      reslog: Number(r.RESLOG) || 0,
      logico: Number(r.LOGICO) || 0,
      transito: Number(r.TRANSITO) || 0,
      estoque_loja: Number(r.ESTOQUE_LOJA) || 0,

      cmup: Number(r.CMUP) || 0,
      valor_estoque_994: Number(r.VALOR_ESTOQUE_994) || 0,
      status_estoque: String(r.STATUS_ESTOQUE ?? '').trim(),
      desclinha: String(r.DESCLINHA ?? '').trim()
    });
  }

  console.log(`Total formatado: ${formattedRecords.length}. Limpando dados anteriores de supply_lojas...`);
  const { error: delError } = await supabase.from('supply_lojas').delete().neq('id', 0);
  if (delError) {
    console.warn('Aviso ao limpar supply_lojas:', delError.message);
  } else {
    console.log('Tabela limpa com sucesso.');
  }

  // Envio em lotes (batch size 1.000)
  const BATCH_SIZE = 1000;
  let inserted = 0;
  const startUpload = Date.now();

  for (let i = 0; i < formattedRecords.length; i += BATCH_SIZE) {
    const batch = formattedRecords.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const { error } = await supabase.from('supply_lojas').insert(batch);

        if (error) {
          console.error(`Erro no lote ${i} a ${i + batch.length} (tentativa ${attempts}):`, error.message);
          await new Promise(r => setTimeout(r, 1500));
        } else {
          success = true;
          inserted += batch.length;
        }
      } catch (err) {
        console.error(`Falha no lote ${i} (tentativa ${attempts}):`, err.message);
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (i % 10000 === 0 || i + BATCH_SIZE >= formattedRecords.length) {
      const elapsed = ((Date.now() - startUpload) / 1000).toFixed(1);
      const pct = ((inserted / formattedRecords.length) * 100).toFixed(1);
      console.log(`Progresso: ${inserted}/${formattedRecords.length} (${pct}%) inseridos em ${elapsed}s...`);
    }
  }

  console.log(`\n🎉 Upload Concluído! Total inserido: ${inserted} registros.`);
}

uploadSupply().catch(console.error);

