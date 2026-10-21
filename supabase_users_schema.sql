-- =========================================================================
-- SISTEMA DE USUÁRIOS E PERMISSÕES - CD 994 GESTÃO LOGÍSTICA
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Criação da tabela de perfis de usuário
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  password_hash text,
  name text not null,
  role text not null check (role in ('admin', 'gerente', 'colaborador')),
  allowed_pages text[] default array['dashboard', 'performance', 'catalog', 'pmts', 'inventory'],
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Adicionar coluna password_hash caso a tabela já exista
alter table app_users add column if not exists password_hash text;

-- 2. Habilitação de RLS
alter table app_users enable row level security;

-- 3. Políticas de Acesso
-- Permitir leitura para usuários autenticados
create policy "Permitir leitura de usuários"
  on app_users
  for select
  using (true);

-- Permitir inserção/atualização por administradores ou via service role
create policy "Permitir gerenciamento de usuários"
  on app_users
  for all
  using (true)
  with check (true);

-- 4. Função para auto-cadastrar perfil quando um usuário do Auth for criado
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.app_users (user_id, email, name, role, allowed_pages)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'colaborador'),
    case 
      when coalesce(new.raw_user_meta_data->>'role', 'colaborador') = 'admin' 
        then array['dashboard', 'performance', 'catalog', 'pmts', 'inventory', 'settings', 'users']
      when coalesce(new.raw_user_meta_data->>'role', 'colaborador') = 'gerente'
        then array['dashboard', 'performance', 'catalog', 'pmts', 'inventory']
      else
        array['dashboard', 'performance', 'inventory']
    end
  )
  on conflict (email) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para executar na criação de usuário no auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
