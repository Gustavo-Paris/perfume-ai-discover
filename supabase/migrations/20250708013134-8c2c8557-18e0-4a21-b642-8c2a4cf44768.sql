-- Atualizar itens existentes da wishlist para usar a coleção padrão
UPDATE public.wishlist 
SET collection_id = (
  SELECT id FROM public.wishlist_collections 
  WHERE user_id = wishlist.user_id 
  AND is_default = true 
  LIMIT 1
)
WHERE collection_id IS NULL;