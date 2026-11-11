const fs = require('fs');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://alwkfgqylejckbgienju.supabase.co';
const supabaseKey = 'sb_publishable_dG6fHMjcet0Iek_PiS52IA_1xiveTKh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadBaseValores() {
  console.log('1. Lendo arquivo Estoque/Basevalores.xlsx...');
  const startRead = Date.now();
  const wb = xlsx.readFile('Estoque/Basevalores.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`Leitura concluída em ${((Date.now() - startRead) / 1000).toFixed(1)}s. Total de linhas: ${rows.length}`);

  // Deduplicação pelo código para evitar conflitos na chave primária
  console.log('2. Deduplicando registros por código...');
  const uniqueRecordsMap = new Map();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const codigo = String(r.COD_GEMCO ?? '').trim();
    if (!codigo) continue;
    const ibm = r.IBM !== undefined && r.IBM !== null ? String(r.IBM).trim() : null;
    const custo_inv = typeof r.CUSTO_INV === 'number' ? r.CUSTO_INV : parseFloat(String(r.CUSTO_INV).replace(',', '.')) || 0;

    uniqueRecordsMap.set(codigo, {
      codigo,
      ibm,
      custo_inv
    });
  }

  const allRecords = Array.from(uniqueRecordsMap.values());
  console.log(`Total de registros únicos a inserir: ${allRecords.length}`);

  // Envio em lotes (batch size 1.000 para balancear velocidade e estabilidade HTTP)
  const BATCH_SIZE = 1000;
  let inserted = 0;
  const startUpload = Date.now();

  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      attempts++;
      try {
        const { error } = await supabase
          .from('base_valores')
          .upsert(batch, { onConflict: 'codigo', ignoreDuplicates: false });

        if (error) {
          console.error(`Erro no lote ${i} a ${i + batch.length} (tentativa ${attempts}):`, error.message);
          await new Promise(r => setTimeout(r, 1500));
        } else {
          success = true;
          inserted += batch.length;
        }
      } catch (err) {
        console.error(`Exceção no lote ${i} (tentativa ${attempts}):`, err.message);
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!success) {
      console.error(`Falha definitiva no lote iniciado em ${i}. Continuando para o próximo...`);
    }

    if (i % 20000 === 0 || i + BATCH_SIZE >= allRecords.length) {
      const pct = ((inserted / allRecords.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startUpload) / 1000).toFixed(0);
      console.log(`Progresso: ${inserted.toLocaleString('pt-BR')} / ${allRecords.length.toLocaleString('pt-BR')} (${pct}%) - ${elapsed}s decorridos`);
    }
  }

  console.log(`Concluído! ${inserted} registros processados em ${((Date.now() - startUpload) / 1000).toFixed(1)}s.`);
}

uploadBaseValores().catch(err => {
  console.error('Erro geral no script:', err);
});
