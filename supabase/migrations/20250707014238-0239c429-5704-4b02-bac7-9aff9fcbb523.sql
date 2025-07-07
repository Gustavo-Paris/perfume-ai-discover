-- 7. Sistema de carrinho abandonado inteligente

-- Tabela para rastrear sessões de carrinho
CREATE TABLE cart_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text, -- Para usuários não logados
  
  -- Estado do carrinho
  status text DEFAULT 'active', -- active, abandoned, recovered, converted
  items_count integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  
  -- Timestamps importantes
  created_at timestamp DEFAULT now(),
  last_activity timestamp DEFAULT now(),
  abandoned_at timestamp,
  first_reminder_sent timestamp,
  second_reminder_sent timestamp,
  recovery_discount_sent timestamp,
  
  -- Dados do contexto
  device_type text, -- mobile, desktop, tablet
  traffic_source text, -- organic, social, email, direct
  user_agent text,
  
  -- Métricas de abandono
  abandonment_stage text, -- browsing, adding_items, checkout_started, payment_failed
  exit_page text,
  time_spent_minutes integer,
  
  UNIQUE(user_id, session_id)
);

-- Tabela para histórico de recuperação
CREATE TABLE cart_recovery_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_session_id uuid REFERENCES cart_sessions(id) ON DELETE CASCADE,
  
  -- Tipo de tentativa
  recovery_type text NOT NULL, -- email_reminder, push_notification, discount_offer, remarketing
  
  -- Conteúdo da recuperação
  subject text,
  message text,
  discount_offered numeric DEFAULT 0,
  discount_code text,
  
  -- Resultado
  sent_at timestamp DEFAULT now(),
  opened_at timestamp,
  clicked_at timestamp,
  converted boolean DEFAULT false,
  conversion_value numeric DEFAULT 0,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_cart_sessions_user ON cart_sessions(user_id, last_activity DESC);
CREATE INDEX idx_cart_sessions_abandoned ON cart_sessions(abandoned_at) WHERE status = 'abandoned';
CREATE INDEX idx_cart_sessions_status ON cart_sessions(status, last_activity DESC);
CREATE INDEX idx_cart_recovery_attempts_session ON cart_recovery_attempts(cart_session_id, sent_at DESC);

-- RLS
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart sessions" ON cart_sessions
  FOR ALL USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Admins can view all cart sessions" ON cart_sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own recovery attempts" ON cart_recovery_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cart_sessions cs 
      WHERE cs.id = cart_recovery_attempts.cart_session_id 
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage recovery attempts" ON cart_recovery_attempts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert recovery attempts" ON cart_recovery_attempts
  FOR INSERT WITH CHECK (true);

-- Função para detectar carrinhos abandonados
CREATE OR REPLACE FUNCTION detect_abandoned_carts()
RETURNS TABLE(
  cart_session_id uuid,
  user_id uuid,
  session_id text,
  items_count integer,
  total_value numeric,
  hours_since_abandonment numeric,
  recommended_action text,
  priority_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH abandoned_analysis AS (
    SELECT 
      cs.*,
      -- Calcular tempo desde última atividade
      EXTRACT(EPOCH FROM (now() - cs.last_activity)) / 3600.0 as hours_inactive,
      
      -- Analisar valor do carrinho para priorização
      CASE 
        WHEN cs.total_value > 200 THEN 'high_value'
        WHEN cs.total_value > 100 THEN 'medium_value'
        ELSE 'low_value'
      END as value_segment,
      
      -- Verificar tentativas de recuperação anteriores
      COUNT(cra.id) as recovery_attempts_count,
      MAX(cra.sent_at) as last_recovery_attempt
      
    FROM cart_sessions cs
    LEFT JOIN cart_recovery_attempts cra ON cs.id = cra.cart_session_id
    WHERE cs.status = 'active'
      AND cs.last_activity < now() - interval '1 hour' -- Abandonado há mais de 1h
      AND cs.items_count > 0
    GROUP BY cs.id
  )
  SELECT 
    aa.id,
    aa.user_id,
    aa.session_id,
    aa.items_count,
    aa.total_value,
    aa.hours_inactive,
    
    -- Determinar ação recomendada baseada no tempo e tentativas
    CASE 
      WHEN aa.hours_inactive BETWEEN 1 AND 24 AND aa.recovery_attempts_count = 0 THEN 'first_reminder'
      WHEN aa.hours_inactive BETWEEN 24 AND 72 AND aa.recovery_attempts_count <= 1 THEN 'discount_offer'
      WHEN aa.hours_inactive > 72 AND aa.recovery_attempts_count <= 2 THEN 'final_reminder'
      ELSE 'remarketing_list'
    END as recommended_action,
    
    -- Score de prioridade (0-100)
    GREATEST(0, LEAST(100, 
      -- Base score por valor
      CASE aa.value_segment
        WHEN 'high_value' THEN 50
        WHEN 'medium_value' THEN 30
        ELSE 15
      END +
      -- Urgência baseada no tempo
      CASE 
        WHEN aa.hours_inactive < 6 THEN 30
        WHEN aa.hours_inactive < 24 THEN 20
        WHEN aa.hours_inactive < 72 THEN 10
        ELSE 5
      END +
      -- Engagement anterior
      CASE 
        WHEN aa.user_id IS NOT NULL THEN 15 -- Usuário registrado
        ELSE 5
      END +
      -- Penalizar muitas tentativas
      GREATEST(0, 10 - (aa.recovery_attempts_count * 5))
    ))::integer as priority_score
    
  FROM abandoned_analysis aa
  WHERE aa.hours_inactive >= 1 -- Abandonado há pelo menos 1 hora
  ORDER BY priority_score DESC, aa.total_value DESC;
END;
$$;

-- Função para criar tentativa de recuperação
CREATE OR REPLACE FUNCTION create_cart_recovery_attempt(
  cart_session_uuid uuid,
  recovery_type_param text,
  subject_param text DEFAULT NULL,
  message_param text DEFAULT NULL,
  discount_offered_param numeric DEFAULT 0,
  discount_code_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_id uuid;
  cart_record RECORD;
BEGIN
  -- Buscar informações do carrinho
  SELECT * INTO cart_record
  FROM cart_sessions
  WHERE id = cart_session_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart session not found';
  END IF;
  
  -- Criar tentativa de recuperação
  INSERT INTO cart_recovery_attempts (
    cart_session_id, recovery_type, subject, message, 
    discount_offered, discount_code
  )
  VALUES (
    cart_session_uuid, recovery_type_param, subject_param, message_param,
    discount_offered_param, discount_code_param
  )
  RETURNING id INTO attempt_id;
  
  -- Atualizar timestamps no carrinho
  UPDATE cart_sessions
  SET 
    first_reminder_sent = CASE 
      WHEN recovery_type_param = 'first_reminder' AND first_reminder_sent IS NULL 
      THEN now() ELSE first_reminder_sent 
    END,
    second_reminder_sent = CASE 
      WHEN recovery_type_param = 'discount_offer' AND second_reminder_sent IS NULL 
      THEN now() ELSE second_reminder_sent 
    END,
    recovery_discount_sent = CASE 
      WHEN discount_offered_param > 0 AND recovery_discount_sent IS NULL 
      THEN now() ELSE recovery_discount_sent 
    END
  WHERE id = cart_session_uuid;
  
  RETURN attempt_id;
END;
$$;

-- Função para marcar carrinho como abandonado
CREATE OR REPLACE FUNCTION mark_cart_as_abandoned()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE cart_sessions
  SET 
    status = 'abandoned',
    abandoned_at = now()
  WHERE status = 'active'
    AND last_activity < now() - interval '1 hour'
    AND abandoned_at IS NULL;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Trigger para atualizar última atividade quando itens do carrinho mudam
CREATE OR REPLACE FUNCTION update_cart_session_activity()
RETURNS TRIGGER AS $$
DECLARE
  session_uuid uuid;
  current_total numeric;
  current_count integer;
BEGIN
  -- Encontrar ou criar sessão do carrinho
  SELECT cs.id INTO session_uuid
  FROM cart_sessions cs
  WHERE cs.user_id = COALESCE(NEW.user_id, OLD.user_id)
    OR cs.session_id = current_setting('app.session_id', true)
  ORDER BY last_activity DESC
  LIMIT 1;
  
  -- Calcular totais atuais do carrinho
  SELECT 
    COUNT(*),
    COALESCE(SUM(ci.quantity * 
      CASE ci.size_ml 
        WHEN 5 THEN COALESCE(p.price_5ml, p.price_full * 0.1)
        WHEN 10 THEN COALESCE(p.price_10ml, p.price_full * 0.2)
        ELSE p.price_full
      END
    ), 0)
  INTO current_count, current_total
  FROM cart_items ci
  JOIN perfumes p ON ci.perfume_id = p.id
  WHERE ci.user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Criar ou atualizar sessão
  INSERT INTO cart_sessions (user_id, session_id, items_count, total_value, last_activity)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    current_setting('app.session_id', true),
    current_count,
    current_total,
    now()
  )
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET 
    items_count = current_count,
    total_value = current_total,
    last_activity = now(),
    status = CASE WHEN current_count > 0 THEN 'active' ELSE status END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER cart_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_session_activity();