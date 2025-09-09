-- Correção dos preços: aplicar margem de 50% (preço = custo * 2)
-- Primeiro dividir pelos 4x aplicados anteriormente, depois aplicar 2x

UPDATE perfumes SET 
  price_2ml = ROUND((price_2ml / 4) * 2, 2),  -- Voltar ao custo e aplicar 2x (50% margem)
  price_5ml = ROUND((price_5ml / 4) * 2, 2),  -- Voltar ao custo e aplicar 2x (50% margem)
  price_10ml = ROUND((price_10ml / 4) * 2, 2), -- Voltar ao custo e aplicar 2x (50% margem)
  price_full = ROUND((price_full / 3.5) * 2, 2) -- Voltar ao custo e aplicar 2x (50% margem)
WHERE id IN (SELECT id FROM perfumes);