-- 1. Índices otimizados para consultas reais baseadas no uso do catálogo

-- Índice para filtros de marca (case-insensitive, usado no catálogo)
CREATE INDEX idx_perfumes_brand_lower ON perfumes(LOWER(brand));

-- Índice composto para filtros de família e gênero (muito usados juntos)
CREATE INDEX idx_perfumes_family_gender ON perfumes(family, gender);

-- Índice para ordenação por preço (usado nos filtros de preço)
CREATE INDEX idx_perfumes_price_search ON perfumes(price_5ml, price_full) WHERE price_5ml IS NOT NULL;

-- Índice de busca por texto completo em português (para search no catálogo)
CREATE INDEX idx_perfumes_search_text ON perfumes 
USING gin(to_tsvector('portuguese', name || ' ' || brand || ' ' || COALESCE(family, '')));

-- Índice para notas olfativas (usado em recomendações futuras)
CREATE INDEX idx_perfumes_notes ON perfumes 
USING gin((top_notes || heart_notes || base_notes));

-- Índice para criação (usado na ordenação padrão)
CREATE INDEX idx_perfumes_created_brand ON perfumes(created_at DESC, brand);