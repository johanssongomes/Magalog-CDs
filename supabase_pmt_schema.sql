-- =========================================================================
-- ESQUEMA SQL: GESTÃO E IMPORTAÇÃO DE PMTs (Magalog CDs)
-- Execute este script no SQL Editor do seu Dashboard Supabase:
-- https://supabase.com/dashboard/project/alwkfgqylejckbgienju/sql
-- =========================================================================

-- 1. TABELA PRINCIPAL DE REGISTROS PMT
CREATE TABLE IF NOT EXISTS public.pmt_records (
  id BIGSERIAL PRIMARY KEY,
  ano INT NOT NULL,
  mes INT NOT NULL,
  cd VARCHAR(50) NOT NULL,
  dia DATE,
  modal_agrupado VARCHAR(100),
  sigla VARCHAR(50),
  div_moveis VARCHAR(50),
  canal_venda VARCHAR(100),
  tipo_saida VARCHAR(50),
  modal VARCHAR(150),
  valor_plan_diario_cd NUMERIC(18, 4) DEFAULT 0,
  pedido_plan_diario_cd NUMERIC(18, 4) DEFAULT 0,
  cub_plan_diario_cd NUMERIC(18, 4) DEFAULT 0,
  pecas_plan_diario_cd NUMERIC(18, 4) DEFAULT 0,
  pedido_unico_plan_diario_cd NUMERIC(18, 4) DEFAULT 0,
  modal_saida VARCHAR(50),
  categoria VARCHAR(100),
  categoria_produtividade VARCHAR(150),
  plataforma_venda VARCHAR(100),
  versao VARCHAR(50) DEFAULT 'v1',
  arquivo_origem VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE HISTÓRICO DE IMPORTAÇÕES E VERSÕES
CREATE TABLE IF NOT EXISTS public.pmt_imports (
  id BIGSERIAL PRIMARY KEY,
  ano INT NOT NULL,
  mes INT NOT NULL,
  versao VARCHAR(50) DEFAULT 'v1',
  arquivo_nome VARCHAR(255) NOT NULL,
  total_linhas INT DEFAULT 0,
  cd_filtro VARCHAR(50) DEFAULT '994',
  status VARCHAR(50) DEFAULT 'concluido',
  substituiu_base BOOLEAN DEFAULT true,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ÍNDICES DE ALTA PERFORMANCE (Otimizados para filtros de Ano, Mês, CD e Datas)
CREATE INDEX IF NOT EXISTS idx_pmt_ano_mes ON public.pmt_records(ano, mes);
CREATE INDEX IF NOT EXISTS idx_pmt_cd ON public.pmt_records(cd);
CREATE INDEX IF NOT EXISTS idx_pmt_cd_ano_mes ON public.pmt_records(cd, ano, mes);
CREATE INDEX IF NOT EXISTS idx_pmt_dia ON public.pmt_records(dia);
CREATE INDEX IF NOT EXISTS idx_pmt_modal_agrupado ON public.pmt_records(modal_agrupado);
CREATE INDEX IF NOT EXISTS idx_pmt_modal ON public.pmt_records(modal);
CREATE INDEX IF NOT EXISTS idx_pmt_modal_saida ON public.pmt_records(modal_saida);

-- 4. SEGURANÇA E POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.pmt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmt_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura total pmt_records" ON public.pmt_records;
CREATE POLICY "Permitir leitura total pmt_records" 
ON public.pmt_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura total pmt_imports" ON public.pmt_imports;
CREATE POLICY "Permitir leitura total pmt_imports" 
ON public.pmt_imports FOR ALL USING (true) WITH CHECK (true);

-- 5. FUNÇÃO AUXILIAR PARA ATUALIZAR/SUBSTITUIR A BASE DE UM MÊS
-- Permite limpar a base antiga daquele mês/ano antes de carregar a nova versão
CREATE OR REPLACE FUNCTION public.remover_pmt_mes(p_ano INT, p_mes INT)
RETURNS INT AS $$
DECLARE
  linhas_removidas INT;
BEGIN
  DELETE FROM public.pmt_records WHERE ano = p_ano AND mes = p_mes;
  GET DIAGNOSTICS linhas_removidas = ROW_COUNT;
  RETURN linhas_removidas;
END;
$$ LANGUAGE plpgsql;
