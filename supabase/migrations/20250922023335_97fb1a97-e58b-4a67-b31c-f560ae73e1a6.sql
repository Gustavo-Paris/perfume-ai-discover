-- Corrigir função de verificação com formato correto
CREATE OR REPLACE FUNCTION public.check_price_integrity()
RETURNS TABLE(
  perfume_id UUID,
  perfume_name TEXT,
  brand TEXT,
  issue_type TEXT,
  current_prices JSONB,
  suggested_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH price_analysis AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      p.price_2ml,
      p.price_5ml,
      p.price_10ml,
      p.price_full,
      p.avg_cost_per_ml,
      p.target_margin_percentage,
      -- Calcular margem real baseada no preço de 5ml
      CASE 
        WHEN p.avg_cost_per_ml > 0 AND p.price_5ml > 0 THEN 
          (p.price_5ml / (p.avg_cost_per_ml * 5))
        ELSE 0 
      END as actual_margin,
      CASE 
        WHEN p.price_5ml <= 0 AND p.price_10ml <= 0 THEN 'zero_prices'
        WHEN p.avg_cost_per_ml <= 0 THEN 'zero_cost'
        -- Margem muito baixa = menos de 1.5x (50% lucro)
        WHEN p.price_5ml > 0 AND p.avg_cost_per_ml > 0 AND (p.price_5ml / (p.avg_cost_per_ml * 5)) < 1.5 THEN 'low_margin'
        -- Margem muito alta = mais de 5x (400% lucro)
        WHEN p.price_5ml > 0 AND p.avg_cost_per_ml > 0 AND (p.price_5ml / (p.avg_cost_per_ml * 5)) > 5 THEN 'high_margin'
        ELSE 'ok'
      END as issue
    FROM perfumes p
  )
  SELECT 
    pa.id,
    pa.name,
    pa.brand,
    pa.issue,
    jsonb_build_object(
      'price_2ml', pa.price_2ml,
      'price_5ml', pa.price_5ml,
      'price_10ml', pa.price_10ml,
      'price_full', pa.price_full,
      'avg_cost_per_ml', pa.avg_cost_per_ml,
      'target_margin', pa.target_margin_percentage,
      'actual_margin', pa.actual_margin
    ),
    CASE pa.issue
      WHEN 'zero_prices' THEN 'Recalcular preços usando margem padrão'
      WHEN 'zero_cost' THEN 'Atualizar custo médio do perfume'
      WHEN 'low_margin' THEN 'Margem atual: ' || ROUND(pa.actual_margin, 2)::TEXT || 'x - Ajustar para pelo menos 1.5x'
      WHEN 'high_margin' THEN 'Margem atual: ' || ROUND(pa.actual_margin, 2)::TEXT || 'x - Considerar reduzir para até 5x'
      ELSE 'OK'
    END
  FROM price_analysis pa
  WHERE pa.issue != 'ok';
END;
$$;

-- Executar correção novamente com margem ajustada
SELECT auto_fix_perfume_prices() as corrected_fix;