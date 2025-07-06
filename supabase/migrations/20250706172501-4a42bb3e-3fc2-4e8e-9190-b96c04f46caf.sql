-- Criar tabela de promoções
CREATE TABLE public.promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    original_price_5ml NUMERIC,
    original_price_10ml NUMERIC,
    original_price_full NUMERIC,
    promotional_price_5ml NUMERIC,
    promotional_price_10ml NUMERIC,
    promotional_price_full NUMERIC,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_promotions_perfume_id ON public.promotions(perfume_id);
CREATE INDEX idx_promotions_active ON public.promotions(is_active) WHERE is_active = true;
CREATE INDEX idx_promotions_dates ON public.promotions(starts_at, ends_at);

-- RLS policies
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
ON public.promotions
FOR SELECT
USING (is_active = true AND starts_at <= now() AND ends_at > now());

CREATE POLICY "Admins can manage promotions"
ON public.promotions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_promotions_updated_at();

-- Função para notificar usuários quando uma promoção é criada/ativada
CREATE OR REPLACE FUNCTION public.notify_wishlist_promotion()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Só processa se a promoção está ativa e dentro do período
  IF NEW.is_active = true AND NEW.starts_at <= now() AND NEW.ends_at > now() THEN
    -- Para inserções ou quando uma promoção torna-se ativa
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.is_active = false OR OLD.starts_at > now())) THEN
      -- Encontra todos os usuários que têm este perfume na wishlist
      FOR user_record IN
        SELECT DISTINCT w.user_id, p.name, p.brand
        FROM public.wishlist w
        JOIN public.perfumes p ON w.perfume_id = p.id
        WHERE w.perfume_id = NEW.perfume_id
      LOOP
        -- Cria notificação para cada usuário
        INSERT INTO public.notifications (type, message, user_id, metadata)
        VALUES (
          'wishlist_promotion',
          format('🔥 %s - %s está em promoção! %s', 
                 user_record.brand, 
                 user_record.name, 
                 NEW.title),
          user_record.user_id,
          jsonb_build_object(
            'promotion_id', NEW.id,
            'perfume_id', NEW.perfume_id,
            'discount_type', NEW.discount_type,
            'discount_value', NEW.discount_value,
            'ends_at', NEW.ends_at
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificações de promoção
CREATE TRIGGER notify_wishlist_promotion_trigger
AFTER INSERT OR UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.notify_wishlist_promotion();

-- Função para obter promoções ativas de um perfume
CREATE OR REPLACE FUNCTION public.get_active_promotion(perfume_uuid uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  discount_type text,
  discount_value numeric,
  promotional_price_5ml numeric,
  promotional_price_10ml numeric,
  promotional_price_full numeric,
  ends_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    p.ends_at
  FROM public.promotions p
  WHERE p.perfume_id = perfume_uuid
  AND p.is_active = true
  AND p.starts_at <= now()
  AND p.ends_at > now()
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;