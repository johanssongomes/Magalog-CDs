-- =========================================================================
-- FUNÇÕES RPC NO SUPABASE PARA PMT (Resumo e Matriz Diária)
-- Permite que a Vercel e qualquer usuário fora da rede consulte
-- agregações instantâneas de milhares de linhas direto pelo Supabase
-- =========================================================================

-- 1. Resumo Geral e Modais
CREATE OR REPLACE FUNCTION public.get_pmt_summary(p_ano INT, p_mes INT, p_cd VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
  v_modals JSONB;
  v_daily JSONB;
  v_total_geral INT;
BEGIN
  -- Resumo do CD
  SELECT json_build_object(
    'total_linhas', COUNT(*),
    'total_valor', COALESCE(ROUND(SUM(valor_plan_diario_cd), 2), 0),
    'total_pecas', COALESCE(ROUND(SUM(pecas_plan_diario_cd), 2), 0),
    'total_pedidos', COALESCE(ROUND(SUM(pedido_plan_diario_cd), 2), 0),
    'total_cub', COALESCE(ROUND(SUM(cub_plan_diario_cd), 2), 0),
    'versao', COALESCE(MAX(versao), 'v1'),
    'arquivo_origem', COALESCE(MAX(arquivo_origem), '')
  )::JSONB INTO v_summary
  FROM public.pmt_records
  WHERE cd = p_cd AND ano = p_ano AND mes = p_mes;

  -- Agrupado por Modal
  SELECT COALESCE(json_agg(m), '[]'::json)::JSONB INTO v_modals
  FROM (
    SELECT 
      modal_agrupado,
      COUNT(*) as linhas,
      ROUND(SUM(valor_plan_diario_cd), 2) as valor,
      ROUND(SUM(pecas_plan_diario_cd), 2) as pecas,
      ROUND(SUM(pedido_plan_diario_cd), 2) as pedidos,
      ROUND(SUM(cub_plan_diario_cd), 2) as cub
    FROM public.pmt_records
    WHERE cd = p_cd AND ano = p_ano AND mes = p_mes
    GROUP BY modal_agrupado
    ORDER BY valor DESC
  ) m;

  -- Agrupado Diário
  SELECT COALESCE(json_agg(d), '[]'::json)::JSONB INTO v_daily
  FROM (
    SELECT 
      dia,
      COUNT(*) as linhas,
      ROUND(SUM(valor_plan_diario_cd), 2) as valor,
      ROUND(SUM(pecas_plan_diario_cd), 2) as pecas,
      ROUND(SUM(pedido_plan_diario_cd), 2) as pedidos
    FROM public.pmt_records
    WHERE cd = p_cd AND ano = p_ano AND mes = p_mes AND dia IS NOT NULL
    GROUP BY dia
    ORDER BY dia ASC
  ) d;

  -- Total geral de linhas de todos os CDs naquele mês
  SELECT COUNT(*) INTO v_total_geral
  FROM public.pmt_records
  WHERE ano = p_ano AND mes = p_mes;

  RETURN json_build_object(
    'ano', p_ano,
    'mes', p_mes,
    'cd', p_cd,
    'summary', COALESCE(v_summary, '{}'::jsonb),
    'modals', COALESCE(v_modals, '[]'::jsonb),
    'daily', COALESCE(v_daily, '[]'::jsonb),
    'totalGeralLinhas', COALESCE(v_total_geral, 0)
  )::JSONB;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Linhas agregadas para Matriz Diária
CREATE OR REPLACE FUNCTION public.get_pmt_matrix_data(p_ano INT, p_mes INT, p_cd VARCHAR, p_group_by VARCHAR)
RETURNS TABLE (
  group_name VARCHAR,
  dia_mes TEXT,
  pedidos NUMERIC,
  pecas NUMERIC,
  cub NUMERIC
) AS $$
BEGIN
  IF p_group_by = 'categoria_produtividade' OR p_group_by = 'categoria' THEN
    RETURN QUERY
    SELECT 
      categoria_produtividade::VARCHAR AS group_name,
      to_char(dia, 'DD')::TEXT AS dia_mes,
      COALESCE(SUM(pedido_plan_diario_cd), 0) AS pedidos,
      COALESCE(SUM(pecas_plan_diario_cd), 0) AS pecas,
      COALESCE(SUM(cub_plan_diario_cd), 0) AS cub
    FROM public.pmt_records
    WHERE cd = p_cd AND ano = p_ano AND mes = p_mes AND dia IS NOT NULL 
      AND categoria_produtividade IS NOT NULL AND categoria_produtividade != '' AND categoria_produtividade != '-'
    GROUP BY categoria_produtividade, to_char(dia, 'DD');
  ELSE
    RETURN QUERY
    SELECT 
      modal::VARCHAR AS group_name,
      to_char(dia, 'DD')::TEXT AS dia_mes,
      COALESCE(SUM(pedido_plan_diario_cd), 0) AS pedidos,
      COALESCE(SUM(pecas_plan_diario_cd), 0) AS pecas,
      COALESCE(SUM(cub_plan_diario_cd), 0) AS cub
    FROM public.pmt_records
    WHERE cd = p_cd AND ano = p_ano AND mes = p_mes AND dia IS NOT NULL 
      AND modal IS NOT NULL AND modal != '' AND modal != '-'
    GROUP BY modal, to_char(dia, 'DD');
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
