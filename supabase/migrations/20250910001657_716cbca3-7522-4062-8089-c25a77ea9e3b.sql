-- Plano de Correção Completo: Marcas, Duplicatas, Preços e Padronização
-- Etapa 1: Correção de Marcas

-- Azzure Aoud: Maison Alhambra → Frend Avenue
UPDATE perfumes 
SET brand = 'Frend Avenue'
WHERE name ILIKE '%azzure aoud%' AND brand = 'Maison Alhambra';

-- Bade's Al Oud: Bade's → Lattafa
UPDATE perfumes 
SET brand = 'Lattafa'
WHERE name ILIKE '%bade''s al oud%' AND brand = 'Bade''s';

-- Eclaire: Al Haramain → Lattafa  
UPDATE perfumes 
SET brand = 'Lattafa'
WHERE name ILIKE '%eclaire%' AND brand = 'Al Haramain';

-- Liquid Brun: Fragrance World → French Avenue
UPDATE perfumes 
SET brand = 'French Avenue'
WHERE name ILIKE '%liquid brun%' AND brand = 'Fragrance World';

-- Turathi Blue: Ard Al Zaafaran → Afnan
UPDATE perfumes 
SET brand = 'Afnan'
WHERE name ILIKE '%turathi blue%' AND brand = 'Ard Al Zaafaran';

-- Victoria: Secret → Lattafa
UPDATE perfumes 
SET brand = 'Lattafa'
WHERE name ILIKE '%victoria%' AND brand = 'Secret';

-- Todos os Yaras: Gostar → Lattafa
UPDATE perfumes 
SET brand = 'Lattafa'
WHERE name ILIKE '%yara%' AND brand = 'Gostar';

-- Etapa 2: Consolidação de Duplicatas - Liquid Brun
DO $$
DECLARE
    liquid_brun_main_id uuid;
    liquid_brun_homme_id uuid;
    lot_record RECORD;
    movement_record RECORD;
BEGIN
    -- Encontrar os IDs dos perfumes Liquid Brun
    SELECT id INTO liquid_brun_main_id 
    FROM perfumes 
    WHERE name = 'Liquid Brun' AND brand = 'French Avenue'
    LIMIT 1;
    
    SELECT id INTO liquid_brun_homme_id 
    FROM perfumes 
    WHERE name = 'Liquid Brun Homme' AND brand = 'French Avenue'
    LIMIT 1;
    
    -- Se ambos existem, consolidar
    IF liquid_brun_main_id IS NOT NULL AND liquid_brun_homme_id IS NOT NULL THEN
        -- Mover todos os lotes de estoque
        FOR lot_record IN 
            SELECT * FROM inventory_lots WHERE perfume_id = liquid_brun_homme_id
        LOOP
            UPDATE inventory_lots 
            SET perfume_id = liquid_brun_main_id
            WHERE id = lot_record.id;
        END LOOP;
        
        -- Mover movimentos de estoque
        FOR movement_record IN 
            SELECT * FROM stock_movements WHERE perfume_id = liquid_brun_homme_id
        LOOP
            UPDATE stock_movements 
            SET perfume_id = liquid_brun_main_id
            WHERE id = movement_record.id;
        END LOOP;
        
        -- Mover outros dados relacionados
        UPDATE cart_items SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        UPDATE order_items SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        UPDATE wishlist SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        UPDATE reviews SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        UPDATE promotions SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        UPDATE reservations SET perfume_id = liquid_brun_main_id WHERE perfume_id = liquid_brun_homme_id;
        
        -- Deletar o perfume duplicado
        DELETE FROM perfumes WHERE id = liquid_brun_homme_id;
    END IF;
END $$;

-- Etapa 3: Correção Crítica dos Preços - Criar lotes para perfumes sem estoque
DO $$
DECLARE
    perfume_record RECORD;
    new_lot_id uuid;
    base_cost_per_ml numeric := 0.30; -- Custo base de R$ 0,30 por ml
BEGIN
    -- Para cada perfume sem lotes de inventário, criar um lote inicial
    FOR perfume_record IN 
        SELECT p.* 
        FROM perfumes p 
        LEFT JOIN inventory_lots il ON p.id = il.perfume_id 
        WHERE il.perfume_id IS NULL
    LOOP
        -- Criar lote de inventário com custo base
        INSERT INTO inventory_lots (
            perfume_id, 
            lot_code, 
            qty_ml, 
            cost_per_ml, 
            total_cost, 
            warehouse_id,
            supplier,
            expiry_date
        )
        SELECT 
            perfume_record.id,
            'LOT-' || UPPER(SUBSTRING(perfume_record.name FROM 1 FOR 3)) || '-' || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0'),
            1000, -- 1000ml inicial
            base_cost_per_ml,
            1000 * base_cost_per_ml,
            w.id,
            'Estoque Inicial',
            CURRENT_DATE + INTERVAL '2 years'
        FROM warehouses w 
        WHERE w.is_primary = true OR w.id = (SELECT id FROM warehouses LIMIT 1)
        LIMIT 1
        RETURNING id INTO new_lot_id;
        
        -- Criar movimento de estoque inicial
        INSERT INTO stock_movements (
            perfume_id,
            lot_id, 
            change_ml,
            movement_type,
            notes
        ) VALUES (
            perfume_record.id,
            new_lot_id,
            1000,
            'purchase',
            'Estoque inicial criado durante correção de dados'
        );
    END LOOP;
END $$;

-- Etapa 4: Padronização de Nomes
-- Remover prefixos desnecessários dos perfumes Lattafa
UPDATE perfumes 
SET name = TRIM(REGEXP_REPLACE(name, '^Lattafa\s+', '', 'i'))
WHERE brand = 'Lattafa' AND name ILIKE 'lattafa %';

-- Padronizar capitalização - primeira letra maiúscula
UPDATE perfumes 
SET name = INITCAP(LOWER(name))
WHERE name ~ '[a-z]';

-- Correções específicas de capitalização para nomes conhecidos
UPDATE perfumes SET name = 'Yara Candy' WHERE name ILIKE '%yara candy%';
UPDATE perfumes SET name = 'Yara Moi' WHERE name ILIKE '%yara moi%';  
UPDATE perfumes SET name = 'Yara Tous' WHERE name ILIKE '%yara tous%';
UPDATE perfumes SET name = 'Azzure Aoud' WHERE name ILIKE '%azzure aoud%';
UPDATE perfumes SET name = 'Bade''s Al Oud' WHERE name ILIKE '%bade''s al oud%';
UPDATE perfumes SET name = 'Liquid Brun' WHERE name ILIKE '%liquid brun%';
UPDATE perfumes SET name = 'Turathi Blue' WHERE name ILIKE '%turathi blue%';

-- Etapa 5: Recalcular custos médios e preços
DO $$
DECLARE
    perfume_id_var uuid;
BEGIN
    -- Recalcular custos médios para todos os perfumes
    FOR perfume_id_var IN SELECT id FROM perfumes LOOP
        PERFORM update_perfume_avg_cost(perfume_id_var);
    END LOOP;
    
    -- Recalcular todos os preços baseados nos novos custos
    PERFORM recalculate_all_prices();
END $$;