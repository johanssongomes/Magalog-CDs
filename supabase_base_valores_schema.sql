-- =========================================================================
-- ESQUEMA SQL: TABELA BASE DE VALORES / CUSTOS DOS PRODUTOS
-- Execute este script no SQL Editor do seu Dashboard Supabase:
-- https://supabase.com/dashboard/project/alwkfgqylejckbgienju/sql
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.base_valores (
  codigo VARCHAR(50) PRIMARY KEY, -- COD_GEMCO / CODIGO do produto
  ibm VARCHAR(50),                -- Código IBM
  custo_inv NUMERIC(15, 2),       -- Custo unitário de inventário (R$)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas e cruzamentos instantâneos com o Estoque
CREATE INDEX IF NOT EXISTS idx_base_valores_codigo ON public.base_valores(codigo);
CREATE INDEX IF NOT EXISTS idx_base_valores_ibm ON public.base_valores(ibm);

-- Habilitar RLS (Row Level Security) e permitir leitura/escrita
ALTER TABLE public.base_valores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica de base_valores"
  ON public.base_valores FOR SELECT
  USING (true);

CREATE POLICY "Permitir insercao e atualizacao publica de base_valores"
  ON public.base_valores FOR ALL
  USING (true)
  WITH CHECK (true);
