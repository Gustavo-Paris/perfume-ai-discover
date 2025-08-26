-- Criação das tabelas para sistema de Nota Fiscal Eletrônica

-- Configurações da empresa
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  endereco_logradouro TEXT NOT NULL,
  endereco_numero TEXT NOT NULL,
  endereco_complemento TEXT,
  endereco_bairro TEXT NOT NULL,
  endereco_cep TEXT NOT NULL,
  endereco_cidade TEXT NOT NULL,
  endereco_uf TEXT NOT NULL,
  endereco_codigo_municipio TEXT NOT NULL,
  telefone TEXT,
  email TEXT NOT NULL,
  regime_tributario TEXT NOT NULL DEFAULT 'simples_nacional',
  certificado_a1_base64 TEXT,
  certificado_senha TEXT,
  ambiente_nfe TEXT NOT NULL DEFAULT 'homologacao', -- 'producao' ou 'homologacao'
  focus_nfe_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dados fiscais dos produtos
CREATE TABLE public.product_fiscal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  ncm TEXT NOT NULL DEFAULT '3303.00.10', -- NCM padrão para perfumes
  cfop TEXT NOT NULL DEFAULT '5102', -- Venda de mercadoria para consumidor final
  cest TEXT, -- Código Especificador da Substituição Tributária
  origem_mercadoria TEXT NOT NULL DEFAULT '0', -- 0=Nacional
  icms_situacao_tributaria TEXT NOT NULL DEFAULT '102', -- Simples Nacional - sem permissão de crédito
  icms_aliquota NUMERIC(5,2) DEFAULT 0,
  pis_situacao_tributaria TEXT NOT NULL DEFAULT '49', -- Outras operações de saída
  pis_aliquota NUMERIC(5,4) DEFAULT 0,
  cofins_situacao_tributaria TEXT NOT NULL DEFAULT '49', -- Outras operações de saída  
  cofins_aliquota NUMERIC(5,4) DEFAULT 0,
  ipi_situacao_tributaria TEXT NOT NULL DEFAULT '99', -- Outras
  ipi_aliquota NUMERIC(5,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(perfume_id)
);

-- Notas fiscais emitidas
CREATE TABLE public.fiscal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  serie INTEGER NOT NULL DEFAULT 1,
  chave_acesso TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, authorized, rejected, cancelled
  protocolo_autorizacao TEXT,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  valor_total NUMERIC(10,2) NOT NULL,
  valor_produtos NUMERIC(10,2) NOT NULL,
  valor_icms NUMERIC(10,2) DEFAULT 0,
  valor_pis NUMERIC(10,2) DEFAULT 0,
  valor_cofins NUMERIC(10,2) DEFAULT 0,
  valor_ipi NUMERIC(10,2) DEFAULT 0,
  xml_content TEXT,
  pdf_url TEXT,
  focus_nfe_ref TEXT, -- Referência da Focus NFe
  erro_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(numero, serie)
);

-- Itens das notas fiscais
CREATE TABLE public.fiscal_note_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_note_id UUID NOT NULL REFERENCES public.fiscal_notes(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  codigo_produto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT NOT NULL,
  cfop TEXT NOT NULL,
  unidade_comercial TEXT NOT NULL DEFAULT 'UN',
  quantidade NUMERIC(10,4) NOT NULL,
  valor_unitario NUMERIC(10,4) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  valor_icms NUMERIC(10,2) DEFAULT 0,
  valor_pis NUMERIC(10,2) DEFAULT 0,
  valor_cofins NUMERIC(10,2) DEFAULT 0,
  valor_ipi NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sequence para numeração das notas
CREATE SEQUENCE public.fiscal_note_number_seq START 1;

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.generate_fiscal_note_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval('fiscal_note_number_seq');
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_company_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_company_settings_updated_at();

CREATE OR REPLACE FUNCTION public.update_product_fiscal_data_updated_at()  
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_product_fiscal_data_updated_at
BEFORE UPDATE ON public.product_fiscal_data
FOR EACH ROW
EXECUTE FUNCTION public.update_product_fiscal_data_updated_at();

CREATE OR REPLACE FUNCTION public.update_fiscal_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_fiscal_notes_updated_at
BEFORE UPDATE ON public.fiscal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_fiscal_notes_updated_at();

-- RLS Policies
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fiscal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_note_items ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar configurações da empresa
CREATE POLICY "Admins can manage company settings"
ON public.company_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem gerenciar dados fiscais dos produtos
CREATE POLICY "Admins can manage product fiscal data"
ON public.product_fiscal_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem ver todas as notas, usuários só as suas
CREATE POLICY "Admins can manage all fiscal notes"
ON public.fiscal_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own fiscal notes"
ON public.fiscal_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = fiscal_notes.order_id 
  AND orders.user_id = auth.uid()
));

-- Apenas admins podem gerenciar itens das notas
CREATE POLICY "Admins can manage fiscal note items"
ON public.fiscal_note_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver itens de suas próprias notas
CREATE POLICY "Users can view their own fiscal note items"
ON public.fiscal_note_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.fiscal_notes fn
  JOIN public.orders o ON fn.order_id = o.id
  WHERE fn.id = fiscal_note_items.fiscal_note_id
  AND o.user_id = auth.uid()
));

-- Inserir dados fiscais padrão para produtos existentes
INSERT INTO public.product_fiscal_data (perfume_id)
SELECT id FROM public.perfumes
ON CONFLICT (perfume_id) DO NOTHING;