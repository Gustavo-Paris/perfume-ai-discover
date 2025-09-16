-- Criar materiais de embalagem usando o tipo correto 'input'
INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description, is_active)
SELECT 'Frasco 2ml', 'input', 'frasco', 'unidade', 0.50, 'Frasco de vidro para decants de 2ml', true
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Frasco 2ml');

INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description, is_active)
SELECT 'Frasco 5ml', 'input', 'frasco', 'unidade', 0.80, 'Frasco de vidro para decants de 5ml', true
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Frasco 5ml');

INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description, is_active)
SELECT 'Frasco 10ml', 'input', 'frasco', 'unidade', 1.20, 'Frasco de vidro para decants de 10ml', true
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Frasco 10ml');

INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description, is_active)
SELECT 'Etiqueta Padrão', 'input', 'etiqueta', 'unidade', 0.15, 'Etiqueta adesiva padrão para decants', true
WHERE NOT EXISTS (SELECT 1 FROM public.materials WHERE name = 'Etiqueta Padrão');