const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL\s*=\s*([^\r\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*([^\r\n]+)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('cell_key, value')
    .in('cell_key', ['pcp_filial_rotas_params', 'pcp_cep_rotas_params', 'pcp_modal_params']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const item of data || []) {
    try {
      const parsed = JSON.parse(item.value);
      console.log(`Type: ${item.cell_key}, count: ${Array.isArray(parsed) ? parsed.length : 'not array'}`);
      if (item.cell_key === 'pcp_filial_rotas_params') {
        console.log('  Has SEDEX:', parsed.some(x => x.filialRota === 'SEDEX'));
        console.log('  Has LOGPLACE:', parsed.some(x => x.filialRota === 'LOGPLACE'));
      }
    } catch (e) {
      console.log(`Type: ${item.cell_key}, parse error`);
    }
  }
}

run();
