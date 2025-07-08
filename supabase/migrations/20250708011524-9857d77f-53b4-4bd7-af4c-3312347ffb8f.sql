-- Criar tabelas para listas personalizadas de favoritos
CREATE TABLE public.wishlist_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#ef4444',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wishlist_collections ENABLE ROW LEVEL SECURITY;

-- Policies para wishlist_collections
CREATE POLICY "Users can manage their own collections" 
ON public.wishlist_collections 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adicionar coluna collection_id na tabela wishlist existente
ALTER TABLE public.wishlist ADD COLUMN collection_id UUID DEFAULT NULL;

-- Foreign key para collection
ALTER TABLE public.wishlist 
ADD CONSTRAINT wishlist_collection_id_fkey 
FOREIGN KEY (collection_id) 
REFERENCES public.wishlist_collections(id) 
ON DELETE SET NULL;

-- Criar tabela para comparações de perfumes
CREATE TABLE public.perfume_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL DEFAULT 'Comparação',
  perfume_ids UUID[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS para comparações
ALTER TABLE public.perfume_comparisons ENABLE ROW LEVEL SECURITY;

-- Policies para comparações
CREATE POLICY "Users can manage their own comparisons" 
ON public.perfume_comparisons 
FOR ALL 
USING ((auth.uid() = user_id) OR (user_id IS NULL))
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_wishlist_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wishlist_collections_updated_at
BEFORE UPDATE ON public.wishlist_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_collections_updated_at();

CREATE OR REPLACE FUNCTION public.update_perfume_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perfume_comparisons_updated_at
BEFORE UPDATE ON public.perfume_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_perfume_comparisons_updated_at();

-- Inserir coleção padrão para usuários existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.wishlist
  LOOP
    INSERT INTO public.wishlist_collections (user_id, name, description, is_default)
    VALUES (
      user_record.user_id, 
      'Meus Favoritos', 
      'Lista padrão de favoritos',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END
$$;