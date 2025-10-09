-- Permitir que TODOS (incluindo usuários não logados) vejam preços de perfumes
-- Isso é necessário para que visitantes do site vejam preços no catálogo
CREATE POLICY "Anyone can view perfume prices"
ON perfume_prices
FOR SELECT
TO public
USING (true);

-- Permitir que TODOS vejam configurações de materiais (necessário para tamanhos disponíveis)
CREATE POLICY "Anyone can view material configurations"
ON material_configurations
FOR SELECT
TO public
USING (true);

-- Comentário: Preços são informações públicas em e-commerce e devem ser visíveis
-- para todos os visitantes. Isso também ajuda com SEO (Google indexa preços).