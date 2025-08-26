-- Trigger para gerar NF-e automaticamente quando pedido for pago
CREATE OR REPLACE FUNCTION public.auto_generate_nfe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só processa se mudou para 'paid' e não era 'paid' antes
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Verificar se já existe NF-e para este pedido
    IF NOT EXISTS (
      SELECT 1 FROM public.fiscal_notes 
      WHERE order_id = NEW.id
    ) THEN
      -- Chamar função para gerar NF-e em background
      PERFORM net.http_post(
        url := 'https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/generate-nfe',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'order_id', NEW.id::text
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS auto_generate_nfe_trigger ON public.orders;
CREATE TRIGGER auto_generate_nfe_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_nfe();