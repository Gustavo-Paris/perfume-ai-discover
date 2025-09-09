-- Correção final: aplicar margens adequadas nos preços e completar dados faltantes

-- 1. Corrigir preços aplicando margem de 300-400% (typical perfume markup)
UPDATE perfumes SET 
  price_2ml = ROUND(price_2ml * 4, 2),  -- 4x markup
  price_5ml = ROUND(price_5ml * 4, 2),  -- 4x markup  
  price_10ml = ROUND(price_10ml * 4, 2), -- 4x markup
  price_full = ROUND(price_full * 3.5, 2) -- 3.5x markup para full size
WHERE id IN (SELECT id FROM perfumes);

-- 2. Garantir que descrições específicas foram aplicadas (alguns podem ter falhado)
UPDATE perfumes SET 
  description = 'Uma fragrância amadeirada e sofisticada que evoca a elegância do oriente. Amana combina madeiras nobres com especiarias exóticas, criando uma composição envolvente e misteriosa. Perfeita para ocasiões especiais onde você deseja causar uma impressão marcante e duradoura.',
  top_notes = ARRAY['Bergamota', 'Cardamomo', 'Pimenta rosa'],
  heart_notes = ARRAY['Cedro do Atlas', 'Sândalo', 'Especiarias orientais'],
  base_notes = ARRAY['Âmbar', 'Almíscar', 'Madeiras preciosas']
WHERE name = 'Amana';

-- 3. Completar dados para outros perfumes que podem ter ficado com descrições básicas
UPDATE perfumes SET 
  description = CASE 
    WHEN description IS NULL OR description = '' OR description = 'Fragrância amadeirada' 
    THEN 'Uma fragrância amadeirada e sofisticada que evoca a elegância do oriente. ' || name || ' combina madeiras nobres com especiarias exóticas, criando uma composição envolvente e misteriosa. Perfeita para ocasiões especiais onde você deseja causar uma impressão marcante e duradoura.'
    ELSE description
  END,
  top_notes = CASE 
    WHEN top_notes IS NULL OR array_length(top_notes, 1) IS NULL 
    THEN ARRAY['Bergamota', 'Cardamomo', 'Pimenta rosa']
    ELSE top_notes
  END,
  heart_notes = CASE 
    WHEN heart_notes IS NULL OR array_length(heart_notes, 1) IS NULL
    THEN ARRAY['Cedro do Atlas', 'Sândalo', 'Especiarias orientais'] 
    ELSE heart_notes
  END,
  base_notes = CASE 
    WHEN base_notes IS NULL OR array_length(base_notes, 1) IS NULL
    THEN ARRAY['Âmbar', 'Almíscar', 'Madeiras preciosas']
    ELSE base_notes
  END
WHERE description IS NULL OR description = '' OR description = 'Fragrância amadeirada' 
   OR top_notes IS NULL OR array_length(top_notes, 1) IS NULL;