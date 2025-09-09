-- Inserir receitas para os perfumes (baseado nos materiais inseridos)
-- Buscar IDs dos materiais e perfumes para as receitas
DO $$
DECLARE
    rec RECORD;
    frasco_5ml_id uuid;
    frasco_10ml_id uuid;
    etiqueta_5ml_id uuid;
    etiqueta_10ml_id uuid;
    caixa_id uuid;
BEGIN
    -- Buscar IDs dos materiais
    SELECT id INTO frasco_5ml_id FROM materials WHERE name = 'Frasco 5ml';
    SELECT id INTO frasco_10ml_id FROM materials WHERE name = 'Frasco 10ml';
    SELECT id INTO etiqueta_5ml_id FROM materials WHERE name = 'Etiqueta 5ml';
    SELECT id INTO etiqueta_10ml_id FROM materials WHERE name = 'Etiqueta 10ml';
    SELECT id INTO caixa_id FROM materials WHERE name = 'Caixa';
    
    -- Para cada perfume, criar receitas para 5ml e 10ml
    FOR rec IN SELECT id FROM perfumes LOOP
        -- Receita para 5ml
        INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed) VALUES
        (rec.id, 5, frasco_5ml_id, 1),
        (rec.id, 5, etiqueta_5ml_id, 1),
        (rec.id, 5, caixa_id, 1);
        
        -- Receita para 10ml
        INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed) VALUES
        (rec.id, 10, frasco_10ml_id, 1),
        (rec.id, 10, etiqueta_10ml_id, 1),
        (rec.id, 10, caixa_id, 1);
    END LOOP;
END $$;