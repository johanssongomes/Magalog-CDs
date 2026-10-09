-- Execute este código no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- no projeto: alwkfgqylejckbgienju

create table if not exists performance_metrics (
  cell_key text primary key,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Permite leitura e escrita pública (ou configure RLS se preferir)
alter table performance_metrics enable row level security;

create policy "Permitir acesso total para leitura/escrita" 
on performance_metrics 
for all 
using (true) 
with check (true);
