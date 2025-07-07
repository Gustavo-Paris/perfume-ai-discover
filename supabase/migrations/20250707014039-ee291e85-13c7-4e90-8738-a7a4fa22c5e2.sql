-- 5. Sistema de recomendações baseado em comportamento

-- Tabela para armazenar pesos de similaridade entre perfumes
CREATE TABLE perfume_similarities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_a_id uuid REFERENCES perfumes(id) ON DELETE CASCADE,
  perfume_b_id uuid REFERENCES perfumes(id) ON DELETE CASCADE,
  
  -- Diferentes tipos de similaridade
  notes_similarity numeric DEFAULT 0, -- baseado em notas olfativas
  behavior_similarity numeric DEFAULT 0, -- baseado em comportamento dos usuários
  purchase_similarity numeric DEFAULT 0, -- "quem comprou X também comprou Y"
  
  -- Score final combinado
  combined_score numeric DEFAULT 0,
  
  -- Metadados
  last_calculated timestamp DEFAULT now(),
  calculation_count integer DEFAULT 1,
  
  created_at timestamp DEFAULT now(),
  
  -- Garantir que não há duplicatas
  UNIQUE(perfume_a_id, perfume_b_id)
);

-- Índices para busca rápida de recomendações
CREATE INDEX idx_perfume_similarities_a ON perfume_similarities(perfume_a_id, combined_score DESC);
CREATE INDEX idx_perfume_similarities_b ON perfume_similarities(perfume_b_id, combined_score DESC);
CREATE INDEX idx_perfume_similarities_score ON perfume_similarities(combined_score DESC);

-- RLS
ALTER TABLE perfume_similarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view similarities" ON perfume_similarities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage similarities" ON perfume_similarities
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Função para calcular similaridade baseada em notas olfativas
CREATE OR REPLACE FUNCTION calculate_notes_similarity(perfume_a_id uuid, perfume_b_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  notes_a text[];
  notes_b text[];
  common_notes integer;
  total_notes integer;
  similarity_score numeric;
BEGIN
  -- Buscar notas dos perfumes
  SELECT 
    ARRAY(SELECT unnest(COALESCE(top_notes, '{}') || COALESCE(heart_notes, '{}') || COALESCE(base_notes, '{}')))
  INTO notes_a
  FROM perfumes WHERE id = perfume_a_id;
  
  SELECT 
    ARRAY(SELECT unnest(COALESCE(top_notes, '{}') || COALESCE(heart_notes, '{}') || COALESCE(base_notes, '{}')))
  INTO notes_b
  FROM perfumes WHERE id = perfume_b_id;
  
  -- Calcular interseção e união
  SELECT 
    array_length(array(SELECT unnest(notes_a) INTERSECT SELECT unnest(notes_b)), 1),
    array_length(array(SELECT unnest(notes_a) UNION SELECT unnest(notes_b)), 1)
  INTO common_notes, total_notes;
  
  -- Calcular similaridade Jaccard
  IF total_notes > 0 THEN
    similarity_score := COALESCE(common_notes, 0)::numeric / total_notes::numeric;
  ELSE
    similarity_score := 0;
  END IF;
  
  RETURN similarity_score;
END;
$$;

-- Função para buscar recomendações para um perfume
CREATE OR REPLACE FUNCTION get_perfume_recommendations(
  perfume_uuid uuid,
  limit_count integer DEFAULT 5,
  min_score numeric DEFAULT 0.1
)
RETURNS TABLE(
  perfume_id uuid,
  name text,
  brand text,
  image_url text,
  price_5ml numeric,
  price_full numeric,
  similarity_score numeric,
  recommendation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.image_url,
    p.price_5ml,
    p.price_full,
    ps.combined_score,
    CASE 
      WHEN ps.purchase_similarity > 0.3 THEN 'Frequentemente comprados juntos'
      WHEN ps.notes_similarity > 0.4 THEN 'Notas olfativas similares'
      WHEN ps.behavior_similarity > 0.3 THEN 'Perfil de usuário similar'
      ELSE 'Recomendado para você'
    END as recommendation_reason
  FROM perfume_similarities ps
  JOIN perfumes p ON (
    CASE 
      WHEN ps.perfume_a_id = perfume_uuid THEN ps.perfume_b_id 
      ELSE ps.perfume_a_id 
    END
  ) = p.id
  WHERE (ps.perfume_a_id = perfume_uuid OR ps.perfume_b_id = perfume_uuid)
    AND ps.combined_score >= min_score
  ORDER BY ps.combined_score DESC
  LIMIT limit_count;
END;
$$;

-- Função para recomendações baseadas no histórico do usuário
CREATE OR REPLACE FUNCTION get_user_recommendations(
  user_uuid uuid DEFAULT auth.uid(),
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  perfume_id uuid,
  name text,
  brand text,
  image_url text,
  price_5ml numeric,
  price_full numeric,
  recommendation_score numeric,
  recommendation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_perfumes AS (
    -- Perfumes que o usuário já interagiu
    SELECT DISTINCT pi.perfume_id
    FROM perfume_interactions pi
    WHERE pi.user_id = user_uuid
      AND pi.interaction_type IN ('view', 'wishlist_add', 'cart_add', 'purchase')
  ),
  user_preferences AS (
    -- Preferências baseadas em interações
    SELECT 
      p.family,
      p.gender,
      COUNT(*) as interaction_count
    FROM perfume_interactions pi
    JOIN perfumes p ON pi.perfume_id = p.id
    WHERE pi.user_id = user_uuid
    GROUP BY p.family, p.gender
    ORDER BY interaction_count DESC
  )
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.image_url,
    p.price_5ml,
    p.price_full,
    -- Score baseado em preferências + popularidade
    (up.interaction_count::numeric / 10.0 + 
     COALESCE(stats.popularity_score, 0)) as recommendation_score,
    'Baseado no seu histórico' as recommendation_reason
  FROM perfumes p
  JOIN user_preferences up ON p.family = up.family AND p.gender = up.gender
  LEFT JOIN (
    -- Score de popularidade
    SELECT 
      pi.perfume_id,
      COUNT(*)::numeric / 100.0 as popularity_score
    FROM perfume_interactions pi
    WHERE pi.created_at > now() - interval '30 days'
    GROUP BY pi.perfume_id
  ) stats ON p.id = stats.perfume_id
  WHERE p.id NOT IN (SELECT perfume_id FROM user_perfumes) -- Excluir já vistos
  ORDER BY recommendation_score DESC
  LIMIT limit_count;
END;
$$;