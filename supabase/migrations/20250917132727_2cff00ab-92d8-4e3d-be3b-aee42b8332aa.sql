-- Corrigir margem do perfume Supremacy Collector's Edition
UPDATE perfumes 
SET target_margin_percentage = 0.50  -- 50% de margem
WHERE name ILIKE '%Supremacy Collector%';

-- Recalcular todos os preços dinamicamente com a margem correta
DO $$
DECLARE
    perfume_record RECORD;
    cost_result RECORD;
    sizes_array INTEGER[] := ARRAY[2, 5, 10, 20];
    size_item INTEGER;
BEGIN
    -- Para cada perfume Supremacy Collector
    FOR perfume_record IN 
        SELECT id FROM perfumes WHERE name ILIKE '%Supremacy Collector%'
    LOOP
        -- Para cada tamanho
        FOREACH size_item IN ARRAY sizes_array
        LOOP
            -- Calcular custo total
            SELECT * INTO cost_result 
            FROM calculate_product_total_cost(perfume_record.id, size_item);
            
            -- Definir preço dinâmico
            PERFORM set_perfume_price(
                perfume_record.id, 
                size_item, 
                cost_result.suggested_price
            );
            
            -- Atualizar preços hardcoded também para consistência
            IF size_item = 2 THEN
                UPDATE perfumes SET price_2ml = cost_result.suggested_price WHERE id = perfume_record.id;
            ELSIF size_item = 5 THEN
                UPDATE perfumes SET price_5ml = cost_result.suggested_price WHERE id = perfume_record.id;
            ELSIF size_item = 10 THEN
                UPDATE perfumes SET price_10ml = cost_result.suggested_price WHERE id = perfume_record.id;
            END IF;
        END LOOP;
    END LOOP;
END $$;