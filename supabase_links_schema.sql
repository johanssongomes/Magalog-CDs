-- =========================================================================
-- TABELA DE LINKS ÚTEIS E SISTEMAS OPERACIONAIS - CD 994
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Projeto: alwkfgqylejckbgienju
-- =========================================================================

-- 1. Criação da tabela de links úteis
create table if not exists useful_links (
  id text primary key,
  title text not null,
  url text not null,
  description text,
  category text not null default 'Sistemas Internos',
  icon_color text default 'bg-blue-600',
  is_favorite boolean default false,
  target_roles text[] default array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'],
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Adicionar colunas caso a tabela já exista
alter table useful_links add column if not exists target_roles text[] default array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'];
alter table useful_links add column if not exists created_by text;
alter table useful_links add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 2. Habilitação de RLS
alter table useful_links enable row level security;

-- 3. Políticas de Acesso
drop policy if exists "Permitir leitura de links úteis" on useful_links;
create policy "Permitir leitura de links úteis"
  on useful_links
  for select
  using (true);

drop policy if exists "Permitir gerenciamento de links úteis" on useful_links;
create policy "Permitir gerenciamento de links úteis"
  on useful_links
  for all
  using (true)
  with check (true);

-- 4. Inserção dos links padrão caso a tabela esteja vazia
insert into useful_links (id, title, url, description, category, icon_color, is_favorite, target_roles)
values
  ('link-1', 'Portal Magalog / Intranet', 'https://magalog.com.br', 'Portal de serviços corporativos, comunicações e ferramentas internas.', 'Sistemas Internos', 'bg-blue-600', true, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']),
  ('link-2', 'WMS Operacional', 'https://wms.magalog.com.br', 'Acesso ao sistema de gestão de armazém, separação, pulmão e endereçamento.', 'Operação & WMS', 'bg-indigo-600', true, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']),
  ('link-3', 'TMS & Rastreamento de Frotas', 'https://tms.magalog.com.br', 'Gestão de transportes, despacho de cargas e rastreamento de veículos.', 'Transporte & Docas', 'bg-emerald-600', false, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']),
  ('link-4', 'Planilhas Google / Drive Compartilhado', 'https://drive.google.com', 'Pastas compartilhadas com relatórios, escalas e planos de ação do CD 994.', 'Documentos & Gestão', 'bg-amber-600', true, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']),
  ('link-5', 'Portal de Chamados TI / Suporte', 'https://suporte.magalog.com.br', 'Abertura de chamados para coletores, impressoras térmicas e rede Wi-Fi.', 'Suporte & TI', 'bg-purple-600', false, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador']),
  ('link-6', 'Receita Federal / Consulta NF-e', 'https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx', 'Consulta da autenticidade e status de Notas Fiscais Eletrônicas em trânsito.', 'Fiscal & Documentos', 'bg-cyan-600', false, array['admin', 'gerente', 'coordenador', 'supervisor', 'lider', 'bp', 'colaborador'])
on conflict (id) do nothing;
