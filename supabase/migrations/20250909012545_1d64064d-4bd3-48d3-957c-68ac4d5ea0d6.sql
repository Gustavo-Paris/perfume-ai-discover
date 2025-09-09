-- CORREÇÃO COMPLETA DOS PERFUMES - VERSÃO CORRIGIDA

-- 1. REMOVER OPÇÃO 2ML DE PERFUMES NÃO ULTRA LUXURY
UPDATE perfumes 
SET price_2ml = NULL 
WHERE category != 'Ultra Luxury';

-- 2. REAJUSTAR PREÇOS PARA FICAREM JUSTOS E COMPETITIVOS
-- Premium: preços acessíveis (5ml: R$15-25, 10ml: R$25-45, Full: R$45-85)
UPDATE perfumes SET 
  price_5ml = (15 + RANDOM() * 10)::numeric(10,2),  -- R$15-25
  price_10ml = (25 + RANDOM() * 20)::numeric(10,2), -- R$25-45  
  price_full = (45 + RANDOM() * 40)::numeric(10,2)  -- R$45-85
WHERE category = 'Premium';

-- Luxury: preços médios (5ml: R$25-40, 10ml: R$45-75, Full: R$80-150)
UPDATE perfumes SET 
  price_5ml = (25 + RANDOM() * 15)::numeric(10,2),  -- R$25-40
  price_10ml = (45 + RANDOM() * 30)::numeric(10,2), -- R$45-75
  price_full = (80 + RANDOM() * 70)::numeric(10,2)  -- R$80-150
WHERE category = 'Luxury';

-- Ultra Luxury: preços premium mas realistas (2ml: R$25-35, 5ml: R$50-70, 10ml: R$90-130, Full: R$180-300)
UPDATE perfumes SET 
  price_2ml = (25 + RANDOM() * 10)::numeric(10,2),   -- R$25-35
  price_5ml = (50 + RANDOM() * 20)::numeric(10,2),   -- R$50-70
  price_10ml = (90 + RANDOM() * 40)::numeric(10,2),  -- R$90-130
  price_full = (180 + RANDOM() * 120)::numeric(10,2) -- R$180-300
WHERE category = 'Ultra Luxury';