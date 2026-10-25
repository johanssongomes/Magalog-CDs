-- =========================================================================
-- AGENDA CORPORATIVA - CD 994 GESTÃO LOGÍSTICA
-- Tabelas para Reuniões, Atas (ATAs), Planos de Ação e Eventos
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Tabela de Reuniões (Meetings)
create table if not exists corporate_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_type text not null default 'Reunião de Alinhamento', -- ex: 'Rito Operacional', 'Reunião Gerencial', '1:1', 'Comitê de Resultados'
  meeting_date date not null,
  start_time time not null,
  end_time time not null,
  location text, -- Sala de Reunião, Sala de Treinamento, Google Meet link, etc.
  organizer text not null,
  organizer_id text,
  participants text[] default '{}',
  agenda text, -- Pauta detalhada
  status text not null default 'Agendada' check (status in ('Agendada', 'Em andamento', 'Realizada', 'Cancelada')),
  notes text,
  created_at timestamp with time zone default timezone('America/Fortaleza', now()),
  updated_at timestamp with time zone default timezone('America/Fortaleza', now())
);

-- 2. Tabela de Atas de Reuniões (Meeting Minutes / ATAs)
create table if not exists corporate_meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references corporate_meetings(id) on delete set null,
  title text not null,
  meeting_date date not null,
  start_time time,
  end_time time,
  present_participants text[] default '{}',
  absent_participants text[] default '{}',
  objective text,
  agenda_discussed text,
  main_topics text,
  decisions text,
  pending_issues text,
  notes text,
  recorder_name text not null, -- Responsável pelo registro
  recorder_id text,
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Publicada', 'Cancelada')),
  published_at timestamp with time zone,
  version integer default 1,
  created_at timestamp with time zone default timezone('America/Fortaleza', now()),
  updated_at timestamp with time zone default timezone('America/Fortaleza', now())
);

-- 3. Tabela de Planos de Ação (Action Plans)
create table if not exists corporate_action_plans (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references corporate_meetings(id) on delete set null,
  minute_id uuid references corporate_meeting_minutes(id) on delete set null,
  description text not null,
  assignee text not null, -- Responsável
  department text not null default 'Operação', -- Área Responsável
  start_date date default current_date,
  due_date date not null, -- Prazo de conclusão
  priority text not null default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Crítica')),
  status text not null default 'Não iniciada' check (status in ('Não iniciada', 'Em andamento', 'Bloqueada', 'Concluída', 'Cancelada')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  completion_date date,
  comments text,
  history jsonb default '[]'::jsonb, -- Histórico de atualizações: [{ date, user, note }]
  created_at timestamp with time zone default timezone('America/Fortaleza', now()),
  updated_at timestamp with time zone default timezone('America/Fortaleza', now())
);

-- 4. Tabela de Eventos Corporativos e Operacionais (Events)
create table if not exists corporate_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Ritos operacionais' check (category in (
    'Reuniões gerenciais', 
    'Ritos operacionais', 
    'Treinamentos', 
    'Auditorias', 
    'Workshops', 
    'Eventos internos', 
    'Datas comemorativas', 
    'Campanhas operacionais', 
    'Outros eventos'
  )),
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  organizer text not null,
  target_audience text,
  responsible text,
  status text not null default 'Confirmado' check (status in ('Planejado', 'Confirmado', 'Realizado', 'Cancelado')),
  notes text,
  created_at timestamp with time zone default timezone('America/Fortaleza', now()),
  updated_at timestamp with time zone default timezone('America/Fortaleza', now())
);

-- 5. Habilitar RLS nas tabelas
alter table corporate_meetings enable row level security;
alter table corporate_meeting_minutes enable row level security;
alter table corporate_action_plans enable row level security;
alter table corporate_events enable row level security;

-- 6. Políticas de Acesso
create policy "Permitir leitura total para usuários autenticados" on corporate_meetings for select using (true);
create policy "Permitir gerenciamento total para usuários autenticados" on corporate_meetings for all using (true) with check (true);

create policy "Permitir leitura de atas para autenticados" on corporate_meeting_minutes for select using (true);
create policy "Permitir gerenciamento de atas para autenticados" on corporate_meeting_minutes for all using (true) with check (true);

create policy "Permitir leitura de planos de acao para autenticados" on corporate_action_plans for select using (true);
create policy "Permitir gerenciamento de planos de acao para autenticados" on corporate_action_plans for all using (true) with check (true);

create policy "Permitir leitura de eventos para autenticados" on corporate_events for select using (true);
create policy "Permitir gerenciamento de eventos para autenticados" on corporate_events for all using (true) with check (true);

-- 7. Dados Iniciais de Demonstração Corporativa para o CD 994
insert into corporate_meetings (title, meeting_type, meeting_date, start_time, end_time, location, organizer, participants, agenda, status, notes)
values
  ('Alinhamento Matinal Operacional CD 994', 'Ritos operacionais', current_date, '08:00', '08:30', 'Sala de Reunião 1 (Presencial)', 'Johansson Gomes', array['Johansson Gomes', 'Supervisores de Turno', 'Líderes de Expedição'], 'Alinhamento das metas volumétricas do dia, distribuição de docas e capacidade de transporte.', 'Realizada', 'Turno 1 operando com capacidade nominal de 100%.'),
  ('Comitê Semanal de Indicadores & SLA 1P', 'Reuniões gerenciais', (current_date + interval '1 day')::date, '14:30', '15:30', 'Google Meet / Sala Executiva', 'Gerência de Logística', array['Gerente Geral', 'Supervisores', 'Qualidade CTE'], 'Revisão do SLA de entrega por modal Courier/Rodo e tratativas de ofensores da malha.', 'Agendada', 'Levar dados consolidados do Tableau.'),
  ('Auditoria de Segurança e 5S nas Docas', 'Auditorias', (current_date + interval '3 day')::date, '10:00', '11:00', 'Pista e Docas 01 a 12', 'Coordenação de Qualidade', array['Segurança do Trabalho', 'Líderes Operacionais'], 'Auditoria semestral de conformidade das docas e inspeção visual dos equipamentos.', 'Agendada', 'Checklist padrão 5S LuizaLabs.')
on conflict do nothing;

insert into corporate_events (name, category, description, event_date, start_time, end_time, location, organizer, target_audience, responsible, status)
values
  ('Treinamento Operacional: Boas Práticas de Movimentação', 'Treinamentos', 'Capacitação prática sobre manuseio seguro de transpaleteiras e empilhadeiras no CD 994.', (current_date + interval '2 day')::date, '09:00', '11:30', 'Auditório de Treinamento', 'RH & Treinamento', 'Operadores de Empilhadeira e Auxiliares', 'Coordenação Operacional', 'Confirmado'),
  ('Campanha Black Friday 2026: Alinhamento de Pico', 'Campanhas operacionais', 'Preparação estratégica de efetivo, rotas especiais e dimensionamento de expedição.', (current_date + interval '5 day')::date, '15:00', '17:00', 'Sala Principal & Transmissão', 'Diretoria de Operações', 'Liderança e Supervisores', 'Gerente do CD', 'Planejado')
on conflict do nothing;
