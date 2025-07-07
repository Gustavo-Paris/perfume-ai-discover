-- 2. Sistema de estoque real integrado

-- Criar view otimizada que combina perfumes com estoque real
CREATE OR REPLACE VIEW perfumes_with_stock AS
SELECT 
  p.*,
  -- Estoque total em ml
  COALESCE(SUM(il.qty_ml), 0) as total_stock_ml,
  
  -- Estoque por tamanho baseado no estoque real
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 5, 0)::int) as stock_5ml,
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 10, 0)::int) as stock_10ml,
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 50, 0)::int) as stock_full,
  
  -- Indicadores úteis
  CASE 
    WHEN COALESCE(SUM(il.qty_ml), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(il.qty_ml), 0) < 30 THEN 'low_stock'
    WHEN COALESCE(SUM(il.qty_ml), 0) < 100 THEN 'medium_stock'
    ELSE 'high_stock'
  END as stock_status,
  
  -- Data do último lote adicionado
  MAX(il.created_at) as last_stock_update
  
FROM perfumes p
LEFT JOIN inventory_lots il ON p.id = il.perfume_id
GROUP BY p.id, p.name, p.brand, p.family, p.gender, p.price_full, p.price_5ml, 
         p.price_10ml, p.description, p.image_url, p.top_notes, p.heart_notes, 
         p.base_notes, p.category, p.created_at;

-- RLS para a view (herda das tabelas base)
ALTER VIEW perfumes_with_stock SET (security_invoker = true);

-- Função para verificar disponibilidade de tamanho específico
CREATE OR REPLACE FUNCTION check_perfume_availability(
  perfume_uuid uuid, 
  size_ml_param integer, 
  quantity_requested integer DEFAULT 1
)
RETURNS TABLE(
  available boolean,
  max_quantity integer,
  stock_ml integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_ml integer;
  units_available integer;
BEGIN
  -- Buscar estoque total em ml
  SELECT COALESCE(SUM(il.qty_ml), 0)
  INTO total_ml
  FROM inventory_lots il
  WHERE il.perfume_id = perfume_uuid;
  
  -- Calcular quantas unidades do tamanho solicitado estão disponíveis
  units_available := total_ml / size_ml_param;
  
  RETURN QUERY SELECT 
    units_available >= quantity_requested as available,
    units_available as max_quantity,
    total_ml as stock_ml;
END;
$$;