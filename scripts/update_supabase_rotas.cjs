const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL\s*=\s*([^\r\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*([^\r\n]+)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

// Read INITIAL_FILIAL_ROTA_PARAMS from file
const content = fs.readFileSync('src/data/pcp_filial_rotas_params.ts', 'utf8');
const start = content.indexOf('[');
const end = content.lastIndexOf(']');
if (start === -1 || end === -1) {
  console.error('Could not find array in pcp_filial_rotas_params.ts');
  process.exit(1);
}

const initialList = eval(content.slice(start, end + 1));

async function run() {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('cell_key, value')
    .eq('cell_key', 'pcp_filial_rotas_params');

  let currentList = [];
  if (data && data[0] && data[0].value) {
    try {
      currentList = JSON.parse(data[0].value);
    } catch (e) {
      currentList = [];
    }
  }

  const map = new Map();
  for (const item of initialList) {
    map.set(item.filialRota.toUpperCase(), item);
  }
  for (const item of currentList) {
    if (!map.has(item.filialRota.toUpperCase())) {
      map.set(item.filialRota.toUpperCase(), item);
    }
  }

  // Ensure SEDEX and LOGPLACE exist
  if (!map.has('LOGPLACE')) {
    map.set('LOGPLACE', { filialRota: 'LOGPLACE', destino: 'LOGPLACE', regiao: 'INTERIOR' });
  }
  if (!map.has('SEDEX')) {
    map.set('SEDEX', { filialRota: 'SEDEX', destino: 'SEDEX', regiao: 'CAPITAL' });
  }
  if (!map.has('SEDEX - CAPITAL')) {
    map.set('SEDEX - CAPITAL', { filialRota: 'SEDEX - CAPITAL', destino: 'SEDEX', regiao: 'CAPITAL' });
  }
  if (!map.has('SEDEX - INTERIOR')) {
    map.set('SEDEX - INTERIOR', { filialRota: 'SEDEX - INTERIOR', destino: 'SEDEX', regiao: 'INTERIOR' });
  }

  const merged = Array.from(map.values());
  console.log(`Updating Supabase pcp_filial_rotas_params with ${merged.length} items...`);

  const { error: upsertErr } = await supabase
    .from('performance_metrics')
    .upsert({
      cell_key: 'pcp_filial_rotas_params',
      value: JSON.stringify(merged),
      updated_at: new Date().toISOString()
    }, { onConflict: 'cell_key' });

  if (upsertErr) {
    console.error('Upsert error:', upsertErr);
  } else {
    console.log('Successfully updated Supabase pcp_filial_rotas_params!');
  }
}

run();
