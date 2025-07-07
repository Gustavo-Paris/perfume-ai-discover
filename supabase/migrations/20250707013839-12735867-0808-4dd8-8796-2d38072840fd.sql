-- 3. Cache inteligente para promoções ativas

-- Índice otimizado para promoções ativas (muito consultado)
CREATE INDEX idx_promotions_active_lookup ON promotions(perfume_id, is_active, starts_at, ends_at)
WHERE is_active = true;

-- Índice para consultas por período
CREATE INDEX idx_promotions_time_range ON promotions(starts_at, ends_at) 
WHERE is_active = true;

-- View materializada para promoções ativas (atualizada automaticamente)
CREATE OR REPLACE VIEW active_promotions AS
SELECT 
  p.*,
  perf.name as perfume_name,
  perf.brand as perfume_brand,
  perf.price_full as original_price_full,
  perf.price_5ml as original_price_5ml,
  perf.price_10ml as original_price_10ml
FROM promotions p
JOIN perfumes perf ON p.perfume_id = perf.id
WHERE p.is_active = true 
  AND p.starts_at <= now() 
  AND p.ends_at > now()
ORDER BY p.created_at DESC;

-- RLS para a view
ALTER VIEW active_promotions SET (security_invoker = true);

-- Função otimizada para buscar promoção ativa de um perfume específico
CREATE OR REPLACE FUNCTION get_active_promotion_optimized(perfume_uuid uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  discount_type text,
  discount_value numeric,
  promotional_price_5ml numeric,
  promotional_price_10ml numeric,
  promotional_price_full numeric,
  ends_at timestamp with time zone,
  time_remaining interval
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.discount_type,
    p.discount_value,
    p.promotional_price_5ml,
    p.promotional_price_10ml,
    p.promotional_price_full,
    p.ends_at,
    p.ends_at - now() as time_remaining
  FROM promotions p
  WHERE p.perfume_id = perfume_uuid
    AND p.is_active = true
    AND p.starts_at <= now()
    AND p.ends_at > now()
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

-- Trigger para invalidar cache quando promoções mudam
CREATE OR REPLACE FUNCTION refresh_promotion_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar aplicação para limpar cache
  PERFORM pg_notify('promotion_changed', 
    json_build_object(
      'perfume_id', COALESCE(NEW.perfume_id, OLD.perfume_id),
      'action', TG_OP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER promotion_cache_trigger
  AFTER INSERT OR UPDATE OR DELETE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION refresh_promotion_cache();