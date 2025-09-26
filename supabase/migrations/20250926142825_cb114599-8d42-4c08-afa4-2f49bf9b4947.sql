-- Migrar dados existentes de company_settings para company_info (se houver)
INSERT INTO company_info (
  cnpj, razao_social, nome_fantasia, inscricao_estadual, inscricao_municipal,
  endereco_completo, cep, cidade, estado, telefone, email_contato, email_sac,
  regime_tributario, certificado_a1_base64, certificado_senha, ambiente_nfe, focus_nfe_token
)
SELECT 
  cnpj, razao_social, nome_fantasia, inscricao_estadual, 
  COALESCE(inscricao_municipal, ''),
  CONCAT(endereco_logradouro, ', ', endereco_numero, 
         CASE WHEN endereco_complemento IS NOT NULL AND endereco_complemento != '' 
              THEN ', ' || endereco_complemento ELSE '' END, 
         ', ', endereco_bairro) as endereco_completo,
  endereco_cep, endereco_cidade, endereco_uf, telefone, email, email,
  regime_tributario, certificado_a1_base64, certificado_senha, ambiente_nfe, focus_nfe_token
FROM company_settings 
WHERE NOT EXISTS (SELECT 1 FROM company_info)
ON CONFLICT (cnpj) DO NOTHING;