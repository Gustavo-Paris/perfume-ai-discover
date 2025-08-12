
-- 1) Adiciona stripe_session_id em orders (usada pelo webhook e fallback do checkout)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Índice único parcial para garantir unicidade quando houver valor
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_unique
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- 2) Opcional: preparar coluna para rastrear PaymentIntent diretamente
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Índice para buscas por payment_intent_id (opcional, mas útil)
CREATE INDEX IF NOT EXISTS orders_payment_intent_id_idx
  ON public.orders (payment_intent_id);
