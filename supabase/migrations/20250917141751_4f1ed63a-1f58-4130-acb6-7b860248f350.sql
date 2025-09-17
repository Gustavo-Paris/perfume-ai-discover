-- Corrigir margem do perfume que foi salva incorretamente
UPDATE perfumes 
SET target_margin_percentage = 0.8  -- 80% como decimal correto
WHERE id = '18d9fbbb-4ff3-42a0-8899-bdb46db79df8' 
AND target_margin_percentage = 0.008;