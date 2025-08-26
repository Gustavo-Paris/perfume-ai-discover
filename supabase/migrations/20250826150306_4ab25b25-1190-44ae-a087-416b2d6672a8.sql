-- Habilitar proteção contra senhas vazadas
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE 1=1;