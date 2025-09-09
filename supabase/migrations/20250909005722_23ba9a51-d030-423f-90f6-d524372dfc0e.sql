-- Criar lotes de estoque com códigos únicos
DO $$
DECLARE
    warehouse_id uuid;
    perfume_record RECORD;
    lot_counter integer := 1;
BEGIN
    -- Buscar ID do warehouse de Chapecó
    SELECT id INTO warehouse_id FROM warehouses WHERE location = 'Chapecó, SC' LIMIT 1;
    
    -- Criar lotes Premium (estoque alto)
    FOR perfume_record IN 
        SELECT id, name, brand, avg_cost_per_ml 
        FROM perfumes 
        WHERE category = 'Premium' AND avg_cost_per_ml < 3.00
        ORDER BY name
        LIMIT 10
    LOOP
        INSERT INTO inventory_lots (
            lot_code, perfume_id, qty_ml, cost_per_ml, total_cost, 
            warehouse_id, supplier, expiry_date
        ) VALUES (
            UPPER(LEFT(perfume_record.brand, 3)) || '-' || LPAD(lot_counter::text, 3, '0') || '-' || TO_CHAR(CURRENT_DATE, 'MMYY'),
            perfume_record.id,
            500, -- 500ml por lote
            perfume_record.avg_cost_per_ml,
            500 * perfume_record.avg_cost_per_ml,
            warehouse_id,
            'Fornecedor Principal',
            CURRENT_DATE + INTERVAL '24 months'
        );
        lot_counter := lot_counter + 1;
    END LOOP;
    
    -- Criar lotes Luxury (estoque médio)
    FOR perfume_record IN 
        SELECT id, name, brand, avg_cost_per_ml 
        FROM perfumes 
        WHERE category = 'Luxury'
        ORDER BY name
        LIMIT 8
    LOOP
        INSERT INTO inventory_lots (
            lot_code, perfume_id, qty_ml, cost_per_ml, total_cost, 
            warehouse_id, supplier, expiry_date
        ) VALUES (
            UPPER(LEFT(perfume_record.brand, 3)) || '-' || LPAD(lot_counter::text, 3, '0') || '-' || TO_CHAR(CURRENT_DATE, 'MMYY'),
            perfume_record.id,
            300, -- 300ml por lote
            perfume_record.avg_cost_per_ml,
            300 * perfume_record.avg_cost_per_ml,
            warehouse_id,
            'Fornecedor Premium',
            CURRENT_DATE + INTERVAL '18 months'
        );
        lot_counter := lot_counter + 1;
    END LOOP;
    
    -- Criar lotes Ultra Luxury (estoque baixo)
    FOR perfume_record IN 
        SELECT id, name, brand, avg_cost_per_ml 
        FROM perfumes 
        WHERE category = 'Ultra Luxury'
        ORDER BY name
        LIMIT 5
    LOOP
        INSERT INTO inventory_lots (
            lot_code, perfume_id, qty_ml, cost_per_ml, total_cost, 
            warehouse_id, supplier, expiry_date
        ) VALUES (
            UPPER(LEFT(perfume_record.brand, 3)) || '-' || LPAD(lot_counter::text, 3, '0') || '-' || TO_CHAR(CURRENT_DATE, 'MMYY'),
            perfume_record.id,
            150, -- 150ml por lote
            perfume_record.avg_cost_per_ml,
            150 * perfume_record.avg_cost_per_ml,
            warehouse_id,
            'Fornecedor Luxury',
            CURRENT_DATE + INTERVAL '12 months'
        );
        lot_counter := lot_counter + 1;
    END LOOP;
    
END $$;