-- ================================================
-- SISTEMA COMPLETO DE ASSINATURAS / CLUBE DE DECANTS
-- ================================================

-- Criar enum para status de assinatura
CREATE TYPE subscription_status AS ENUM (
  'active',
  'paused', 
  'cancelled',
  'past_due'
);

-- Criar enum para status de envio
CREATE TYPE shipment_status AS ENUM (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'failed'
);

-- Criar enum para preferência de intensidade
CREATE TYPE intensity_preference AS ENUM (
  'light',
  'medium',
  'strong',
  'any'
);

-- ================================================
-- TABELA 1: subscription_plans
-- ================================================
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  decants_per_month INTEGER NOT NULL,
  size_ml INTEGER NOT NULL CHECK (size_ml IN (5, 10)),
  stripe_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- TABELA 2: user_subscriptions
-- ================================================
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- ================================================
-- TABELA 3: subscription_preferences
-- ================================================
CREATE TABLE public.subscription_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  preferred_families TEXT[] DEFAULT '{}',
  preferred_gender TEXT[] DEFAULT '{}',
  excluded_notes TEXT[] DEFAULT '{}',
  intensity_preference intensity_preference DEFAULT 'any',
  surprise_me BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscription_id)
);

-- ================================================
-- TABELA 4: subscription_shipments
-- ================================================
CREATE TABLE public.subscription_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  perfume_ids UUID[] NOT NULL,
  status shipment_status NOT NULL DEFAULT 'pending',
  tracking_code TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  order_id UUID REFERENCES public.orders(id),
  selection_reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscription_id, month_year)
);

-- ================================================
-- TABELA 5: subscription_history
-- ================================================
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_shipments_subscription_id ON public.subscription_shipments(subscription_id);
CREATE INDEX idx_subscription_shipments_month_year ON public.subscription_shipments(month_year);
CREATE INDEX idx_subscription_shipments_status ON public.subscription_shipments(status);
CREATE INDEX idx_subscription_history_subscription_id ON public.subscription_history(subscription_id);

-- ================================================
-- TRIGGERS PARA updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_subscription_preferences_updated_at
  BEFORE UPDATE ON public.subscription_preferences
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_subscription_shipments_updated_at
  BEFORE UPDATE ON public.subscription_shipments
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- subscription_plans: Todos podem ver planos ativos
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- user_subscriptions: Usuários veem suas próprias assinaturas
CREATE POLICY "Users view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- subscription_preferences: Usuários gerenciam suas preferências
CREATE POLICY "Users manage own preferences"
  ON public.subscription_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE id = subscription_preferences.subscription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all preferences"
  ON public.subscription_preferences FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- subscription_shipments: Usuários veem seus envios
CREATE POLICY "Users view own shipments"
  ON public.subscription_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE id = subscription_shipments.subscription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all shipments"
  ON public.subscription_shipments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- subscription_history: Usuários veem seu histórico
CREATE POLICY "Users view own history"
  ON public.subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE id = subscription_history.subscription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all history"
  ON public.subscription_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (true);

-- ================================================
-- DADOS INICIAIS: Planos de Assinatura
-- ================================================
INSERT INTO public.subscription_plans (name, description, price_monthly, decants_per_month, size_ml, features, display_order) VALUES
(
  'Básico',
  'Perfeito para começar sua jornada olfativa',
  49.90,
  2,
  5,
  '["2 decants 5ml por mês", "Escolha de famílias olfativas", "Frete grátis", "Cancelamento flexível"]'::jsonb,
  1
),
(
  'Premium',
  'A escolha ideal para entusiastas',
  89.90,
  4,
  5,
  '["4 decants 5ml por mês", "Curadoria personalizada", "Frete grátis", "10% de desconto na loja", "Acesso antecipado a lançamentos"]'::jsonb,
  2
),
(
  'Luxury',
  'Experiência exclusiva para conhecedores',
  149.90,
  4,
  10,
  '["4 decants 10ml por mês", "Fragrâncias premium e nicho", "Curadoria VIP personalizada", "Frete grátis", "15% de desconto na loja", "Acesso antecipado a lançamentos", "Suporte prioritário"]'::jsonb,
  3
);

-- ================================================
-- FUNÇÃO AUXILIAR: Registrar evento de assinatura
-- ================================================
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_subscription_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO public.subscription_history (
    subscription_id,
    event_type,
    event_data,
    created_by
  ) VALUES (
    p_subscription_id,
    p_event_type,
    p_event_data,
    auth.uid()
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;