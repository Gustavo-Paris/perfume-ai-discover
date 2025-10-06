-- Add cfop field to product_fiscal_data (required for Brazilian NFe)
-- CFOP = Código Fiscal de Operações e Prestações

-- Add the column with a default value first (to handle existing records)
ALTER TABLE public.product_fiscal_data 
ADD COLUMN IF NOT EXISTS cfop TEXT DEFAULT '5102';

-- Update any existing NULL values to default CFOP
-- 5102 = Venda de mercadoria adquirida ou recebida de terceiros (dentro do estado)
UPDATE public.product_fiscal_data 
SET cfop = '5102' 
WHERE cfop IS NULL;

-- Now make it NOT NULL since all records have a value
ALTER TABLE public.product_fiscal_data 
ALTER COLUMN cfop SET NOT NULL;

-- Add check constraint for valid CFOP format (4 digits)
ALTER TABLE public.product_fiscal_data
ADD CONSTRAINT cfop_format_check 
CHECK (cfop ~ '^\d{4}$');

-- Add comment explaining common CFOPs
COMMENT ON COLUMN public.product_fiscal_data.cfop IS 
'Código Fiscal de Operações e Prestações. Exemplos comuns:
5102 = Venda dentro do estado
6102 = Venda fora do estado  
5405 = Venda de bem do ativo imobilizado
Deve ter 4 dígitos numéricos';