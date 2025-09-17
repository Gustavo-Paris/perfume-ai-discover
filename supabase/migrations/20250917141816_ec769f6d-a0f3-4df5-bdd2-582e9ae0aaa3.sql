-- Corrigir margens existentes que foram divididas incorretamente
-- Valores menores que 1.0 provavelmente foram divididos por erro
UPDATE perfumes 
SET target_margin_percentage = target_margin_percentage * 100
WHERE target_margin_percentage < 1.0 AND target_margin_percentage > 0;