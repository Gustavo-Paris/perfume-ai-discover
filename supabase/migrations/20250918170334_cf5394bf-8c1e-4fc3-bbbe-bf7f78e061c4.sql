-- Criar bucket para imagens de perfumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfume-images', 
  'perfume-images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Políticas RLS para o bucket de imagens de perfumes
-- Qualquer um pode visualizar as imagens (público)
CREATE POLICY "Anyone can view perfume images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'perfume-images');

-- Apenas admins podem fazer upload de imagens
CREATE POLICY "Admins can upload perfume images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'perfume-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Apenas admins podem atualizar imagens
CREATE POLICY "Admins can update perfume images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'perfume-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Apenas admins podem deletar imagens
CREATE POLICY "Admins can delete perfume images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'perfume-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);