-- Add NFe configuration fields to company_info table
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS regime_tributario TEXT DEFAULT 'simples_nacional';
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS certificado_a1_base64 TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS certificado_senha TEXT;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS ambiente_nfe TEXT DEFAULT 'homologacao';
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS focus_nfe_token TEXT;