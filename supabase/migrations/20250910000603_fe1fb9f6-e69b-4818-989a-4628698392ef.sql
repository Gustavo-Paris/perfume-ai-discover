-- Consolidação e Padronização de Perfumes - Versão Corrigida
-- Etapa 1: Consolidar lotes duplicados do mesmo perfume com mesmo custo

-- Primeiro, identificar lotes duplicados e consolidar quantidades no lote mais antigo
UPDATE inventory_lots 
SET 
  qty_ml = (
    SELECT SUM(qty_ml) 
    FROM inventory_lots il2 
    WHERE il2.perfume_id = inventory_lots.perfume_id 
    AND il2.cost_per_ml = inventory_lots.cost_per_ml
  ),
  total_cost = (
    SELECT SUM(total_cost) 
    FROM inventory_lots il3 
    WHERE il3.perfume_id = inventory_lots.perfume_id 
    AND il3.cost_per_ml = inventory_lots.cost_per_ml
  )
WHERE inventory_lots.created_at = (
  SELECT MIN(created_at) 
  FROM inventory_lots il4 
  WHERE il4.perfume_id = inventory_lots.perfume_id 
  AND il4.cost_per_ml = inventory_lots.cost_per_ml
);

-- Deletar lotes duplicados (manter apenas o mais antigo)
DELETE FROM inventory_lots 
WHERE id NOT IN (
  SELECT DISTINCT ON (perfume_id, cost_per_ml) id
  FROM inventory_lots
  ORDER BY perfume_id, cost_per_ml, created_at ASC
);

-- Etapa 2: Corrigir marcas incorretas baseado nas informações fornecidas

-- Corrigir perfumes com marca "Import"
UPDATE perfumes SET brand = 'Al Haramain' WHERE name ILIKE '%atheeri%' AND brand = 'Import';
UPDATE perfumes SET brand = 'Armaf' WHERE name ILIKE '%club de nuit maleka%' AND brand = 'Import';
UPDATE perfumes SET brand = 'Orientica' WHERE name ILIKE '%orientica%' AND brand = 'Import';
UPDATE perfumes SET brand = 'Prada' WHERE name ILIKE '%prada paradoxe%' AND brand = 'Import';

-- Corrigir perfumes com marca "Inspired" 
UPDATE perfumes SET brand = 'Reyane Tradition' WHERE name ILIKE '%amana%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Lattafa' WHERE name ILIKE '%asad bourbon%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Parfums de Marly' WHERE name ILIKE '%delina%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Lattafa' WHERE name ILIKE '%fakhar%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Givenchy' WHERE name ILIKE '%givenchy gent%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Burberry' WHERE name ILIKE '%goddess%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Tom Ford' WHERE name ILIKE '%hombre leather%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Reyane Tradition' WHERE name ILIKE '%oud gourmand%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Jean Paul Gaultier' WHERE name ILIKE '%scandal absolut%' AND brand = 'Inspired';
UPDATE perfumes SET brand = 'Sospiro' WHERE name ILIKE '%sospiro erba%' AND brand = 'Inspired';

-- Corrigir marca específica do Atheeri para Lattafa (conforme orientação do usuário)
UPDATE perfumes SET brand = 'Lattafa' WHERE name ILIKE '%atheeri%';

-- Etapa 3: Consolidar perfumes duplicados (Atheeri Paraguai + Atheeri)
DO $$
DECLARE
    main_perfume_id uuid;
    duplicate_perfume_id uuid;
BEGIN
    -- Encontrar o perfume principal Atheeri
    SELECT id INTO main_perfume_id 
    FROM perfumes 
    WHERE name ILIKE '%atheeri%' AND name NOT ILIKE '%paraguai%'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Encontrar o perfume duplicado Atheeri Paraguai
    SELECT id INTO duplicate_perfume_id 
    FROM perfumes 
    WHERE name ILIKE '%atheeri paraguai%'
    LIMIT 1;
    
    -- Se ambos existem, consolidar
    IF main_perfume_id IS NOT NULL AND duplicate_perfume_id IS NOT NULL AND main_perfume_id != duplicate_perfume_id THEN
        -- Transferir lotes
        UPDATE inventory_lots 
        SET perfume_id = main_perfume_id 
        WHERE perfume_id = duplicate_perfume_id;
        
        -- Transferir outros registros relacionados se existirem
        UPDATE stock_movements 
        SET perfume_id = main_perfume_id 
        WHERE perfume_id = duplicate_perfume_id;
        
        UPDATE cart_items 
        SET perfume_id = main_perfume_id 
        WHERE perfume_id = duplicate_perfume_id;
        
        UPDATE wishlist 
        SET perfume_id = main_perfume_id 
        WHERE perfume_id = duplicate_perfume_id;
        
        UPDATE order_items 
        SET perfume_id = main_perfume_id 
        WHERE perfume_id = duplicate_perfume_id;
        
        -- Deletar perfume duplicado
        DELETE FROM perfumes WHERE id = duplicate_perfume_id;
    END IF;
END $$;

-- Etapa 4: Padronizar nomes dos perfumes
-- Remover tamanhos dos nomes e padronizar
UPDATE perfumes SET name = 'Amana' WHERE name ILIKE '%amana 85ml%';
UPDATE perfumes SET name = 'Oud Gourmand' WHERE name ILIKE '%oud gourmand 85ml%';
UPDATE perfumes SET name = 'Givenchy Gentleman Society' WHERE name ILIKE '%givenchy gent%';
UPDATE perfumes SET name = 'Goddess' WHERE name ILIKE '%goddess%' AND brand = 'Burberry';
UPDATE perfumes SET name = 'Ombré Leather' WHERE name ILIKE '%hombre leather%';

-- Padronizar capitalização mantendo nomes compostos corretos
UPDATE perfumes SET name = REPLACE(REPLACE(REPLACE(
    INITCAP(LOWER(name)), 
    ' De ', ' de '), 
    ' Da ', ' da '), 
    ' Do ', ' do ')
WHERE name ~ '[a-z]';

-- Corrigir nomes específicos que podem ter ficado errados na capitalização
UPDATE perfumes SET name = 'Club de Nuit Intense Man' WHERE name ILIKE '%club de nuit intense man%';
UPDATE perfumes SET name = 'Club de Nuit Maleka' WHERE name ILIKE '%club de nuit maleka%';
UPDATE perfumes SET name = 'Club de Nuit Feminino' WHERE name ILIKE '%club de nuit feminino%';

-- Etapa 5: Recalcular custos médios para todos os perfumes afetados
DO $$
DECLARE
    perfume_record RECORD;
BEGIN
    FOR perfume_record IN 
        SELECT DISTINCT id FROM perfumes
    LOOP
        PERFORM update_perfume_avg_cost(perfume_record.id);
    END LOOP;
END $$;

-- Etapa 6: Recalcular todos os preços baseado nos novos custos
SELECT recalculate_all_prices();

-- Verificação final: Mostrar resumo da consolidação
SELECT 
    'Consolidação concluída' as status,
    COUNT(*) as total_perfumes,
    COUNT(DISTINCT brand) as total_brands,
    COUNT(CASE WHEN brand IN ('Import', 'Inspired') THEN 1 END) as perfumes_com_marca_incorreta
FROM perfumes;