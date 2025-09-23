-- Primeiro, tentar habilitar a extensão net se disponível
CREATE EXTENSION IF NOT EXISTS http;

-- Se a extensão net não existir, vamos desabilitar temporariamente os triggers que dependem dela
-- até que possamos configurar adequadamente

-- Remover trigger que gera NFe automaticamente (que usa net.http_post)
DROP TRIGGER IF EXISTS auto_generate_nfe_trigger ON orders;

-- Remover outros triggers que possam usar funções net
DROP TRIGGER IF EXISTS send_order_confirmation_email_trigger ON orders;
DROP TRIGGER IF EXISTS send_payment_approval_email_trigger ON orders;

-- Criar versões simplificadas dos triggers essenciais que não dependem de net

-- Trigger para pontos de fidelidade (sem HTTP calls)
CREATE OR REPLACE FUNCTION public.award_order_points_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Award points when order status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Add points directly without external calls
    INSERT INTO points_transactions (user_id, delta, balance_after, source, description, order_id)
    VALUES (
      NEW.user_id,
      FLOOR(NEW.total_amount)::INTEGER,
      COALESCE((SELECT balance_after FROM points_transactions WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 1), 0) + FLOOR(NEW.total_amount)::INTEGER,
      'order_paid',
      'Pontos ganhos com pedido #' || NEW.order_number,
      NEW.id
    );
    
    -- Update user profile points
    UPDATE profiles SET points = COALESCE(points, 0) + FLOOR(NEW.total_amount)::INTEGER WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger simplificado para pontos
CREATE TRIGGER award_order_points_simple_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_order_points_simple();

-- Trigger para processar afiliados (sem HTTP calls)
CREATE OR REPLACE FUNCTION public.process_order_affiliate_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Process affiliate referral when order is paid
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Check if there's affiliate data in order metadata
    IF NEW.address_data ? 'affiliate_code' THEN
      PERFORM process_affiliate_referral(
        NEW.address_data->>'affiliate_code',
        NEW.id,
        NEW.total_amount
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para afiliados
CREATE TRIGGER process_order_affiliate_simple_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_order_affiliate_simple();