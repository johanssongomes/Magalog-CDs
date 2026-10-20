-- =========================================================================
-- ESQUEMA SQL: TABELA DE COLABORADORES (Quadro TT / Modelo Pessoas)
-- Execute este script no SQL Editor do seu Dashboard Supabase:
-- https://supabase.com/dashboard/project/alwkfgqylejckbgienju/sql
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.colaboradores (
  id VARCHAR(50) PRIMARY KEY, -- Matrícula / ID
  contratado VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  centro_de_custo VARCHAR(255) NOT NULL,
  cd VARCHAR(50) DEFAULT '994',
  login VARCHAR(100),
  cpf VARCHAR(50),
  rg VARCHAR(50),
  sexo VARCHAR(20),
  cargo_anterior VARCHAR(255),
  data_admissao VARCHAR(50),
  data_nascimento VARCHAR(50),
  situacao_sistema VARCHAR(150) DEFAULT 'Em Atividade Normal',
  status VARCHAR(100),
  possui_medidas VARCHAR(50),
  possui_feedback VARCHAR(50),
  id_lider VARCHAR(50),
  nome_lider VARCHAR(255),
  setor VARCHAR(150),
  turno VARCHAR(50),
  ferias VARCHAR(100),
  cod_centro_custo VARCHAR(100),
  gerencia VARCHAR(150),
  periodo_45_dias VARCHAR(50),
  periodo_90_dias VARCHAR(50),
  dia_niver VARCHAR(10),
  mes_niver VARCHAR(10),
  aniversario VARCHAR(50),
  nova_idade VARCHAR(10),
  tempo_de_empresa VARCHAR(100),
  mes_adm VARCHAR(10),
  dia_adm VARCHAR(10),
  ano_adm VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta rápida por Cargo, Centro de Custo, Gerência e Situação
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON public.colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cc ON public.colaboradores(centro_de_custo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_gerencia ON public.colaboradores(gerencia);
CREATE INDEX IF NOT EXISTS idx_colaboradores_situacao ON public.colaboradores(situacao_sistema);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cd ON public.colaboradores(cd);

-- Segurança e Políticas RLS (Row Level Security)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'colaboradores' AND policyname = 'Permitir acesso total colaboradores'
  ) THEN
    CREATE POLICY "Permitir acesso total colaboradores" 
    ON public.colaboradores 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
