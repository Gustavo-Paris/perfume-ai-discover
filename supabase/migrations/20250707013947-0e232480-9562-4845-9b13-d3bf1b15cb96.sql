-- 4. Analytics de uso para decisões

-- Tabela para rastrear uso do catálogo
CREATE TABLE catalog_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text, -- Para usuários não logados
  
  -- Dados da busca/filtro
  search_term text,
  filters_used jsonb DEFAULT '{}'::jsonb,
  sort_by text,
  results_count integer,
  
  -- Contexto
  page_type text DEFAULT 'catalog', -- catalog, search, home, etc
  user_agent text,
  referrer text,
  
  -- Métricas
  time_spent_seconds integer,
  items_clicked integer DEFAULT 0,
  
  created_at timestamp DEFAULT now()
);

-- Tabela para rastrear interações com perfumes
CREATE TABLE perfume_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  perfume_id uuid REFERENCES perfumes(id) ON DELETE CASCADE,
  
  -- Tipo de interação
  interaction_type text NOT NULL, -- view, wishlist_add, cart_add, purchase, etc
  
  -- Contexto da interação
  source_page text, -- catalog, search, recommendations, etc
  position_in_list integer, -- posição na lista se aplicável
  
  -- Dados adicionais
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_catalog_analytics_user_time ON catalog_analytics(user_id, created_at DESC);
CREATE INDEX idx_catalog_analytics_search ON catalog_analytics(search_term) WHERE search_term IS NOT NULL;
CREATE INDEX idx_catalog_analytics_filters ON catalog_analytics USING gin(filters_used);

CREATE INDEX idx_perfume_interactions_user ON perfume_interactions(user_id, created_at DESC);
CREATE INDEX idx_perfume_interactions_perfume ON perfume_interactions(perfume_id, interaction_type);
CREATE INDEX idx_perfume_interactions_type ON perfume_interactions(interaction_type, created_at DESC);

-- RLS
ALTER TABLE catalog_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfume_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas - Analytics são sensíveis, apenas admins e próprio usuário
CREATE POLICY "Users can view their own analytics" ON catalog_analytics
  FOR SELECT USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can insert their own analytics" ON catalog_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics" ON catalog_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own interactions" ON perfume_interactions
  FOR SELECT USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can insert their own interactions" ON perfume_interactions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all interactions" ON perfume_interactions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Função para registrar interação com perfume
CREATE OR REPLACE FUNCTION log_perfume_interaction(
  perfume_uuid uuid,
  interaction_type_param text,
  source_page_param text DEFAULT NULL,
  position_param integer DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  interaction_id uuid;
  current_user_id uuid;
  current_session_id text;
BEGIN
  current_user_id := auth.uid();
  current_session_id := current_setting('app.session_id', true);
  
  INSERT INTO perfume_interactions (
    user_id, session_id, perfume_id, interaction_type, 
    source_page, position_in_list, metadata
  )
  VALUES (
    current_user_id, current_session_id, perfume_uuid, interaction_type_param,
    source_page_param, position_param, metadata_param
  )
  RETURNING id INTO interaction_id;
  
  RETURN interaction_id;
END;
$$;