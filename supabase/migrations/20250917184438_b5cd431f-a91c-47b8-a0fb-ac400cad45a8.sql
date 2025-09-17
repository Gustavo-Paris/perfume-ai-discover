-- Criar tabela para configurações de entrega local
CREATE TABLE public.local_delivery_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_city text NOT NULL DEFAULT 'Chapecó',
  company_state text NOT NULL DEFAULT 'SC',
  company_cep text NOT NULL DEFAULT '89814000',
  local_delivery_fee numeric NOT NULL DEFAULT 10.00,
  pickup_available boolean NOT NULL DEFAULT true,
  pickup_address text NOT NULL DEFAULT 'Rua Florianópolis - D, 828 - Jardim Itália, Chapecó - SC',
  pickup_instructions text DEFAULT 'Retirada disponível de segunda a sexta das 8h às 18h.',
  local_delivery_radius_km integer DEFAULT 15,
  local_delivery_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.local_delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage local delivery settings" ON public.local_delivery_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view local delivery settings" ON public.local_delivery_settings
  FOR SELECT USING (true);

-- Inserir configuração padrão
INSERT INTO public.local_delivery_settings (
  company_city,
  company_state,
  company_cep,
  local_delivery_fee,
  pickup_available,
  pickup_address,
  pickup_instructions
) VALUES (
  'Chapecó',
  'SC', 
  '89814000',
  10.00,
  true,
  'Rua Florianópolis - D, 828 - Jardim Itália, Chapecó - SC',
  'Retirada disponível de segunda a sexta das 8h às 18h. Entre em contato pelo WhatsApp para coordenar.'
);

-- Trigger para updated_at
CREATE TRIGGER update_local_delivery_settings_updated_at
  BEFORE UPDATE ON public.local_delivery_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();