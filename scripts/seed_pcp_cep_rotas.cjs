const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split('\n')) {
      if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    }
  } catch {}
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tsContent = fs.readFileSync('src/data/pcp_cep_rotas_params.ts', 'utf8');
  const marker = 'export const INITIAL_CEP_ROTA_PARAMS: CepRotaParamItem[] = ';
  const startIdx = tsContent.indexOf(marker) + marker.length;
  const jsonPart = tsContent.substring(startIdx).trim();
  const data = JSON.parse(jsonPart);

  console.log(`Uploading ${data.length} CEP rules to Supabase performance_metrics...`);

  const { error } = await supabase
    .from('performance_metrics')
    .upsert({
      cell_key: 'pcp_cep_rotas_params',
      value: JSON.stringify(data),
      updated_at: new Date().toISOString()
    }, { onConflict: 'cell_key' });

  if (error) {
    console.error('Error uploading to Supabase:', error.message);
    process.exit(1);
  }

  console.log('Successfully saved pcp_cep_rotas_params in Supabase performance_metrics!');
}

run();
