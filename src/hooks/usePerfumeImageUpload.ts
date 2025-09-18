import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PerfumeImageUpload {
  name: string;
  brand: string;
  fileName: string;
  localPath: string;
}

export const usePerfumeImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{
    name: string;
    brand: string;
    url: string;
  }[]>([]);

  const perfumeImages: PerfumeImageUpload[] = [
    {
      name: "Supremacy Collector's Edition",
      brand: "Afnan",
      fileName: "afnan-supremacy-collectors-edition.png",
      localPath: "/temp-uploads/afnan-supremacy-collectors-edition.png"
    },
    {
      name: "Turathi",
      brand: "Afnan", 
      fileName: "afnan-turathi.jpg",
      localPath: "/temp-uploads/afnan-turathi.jpg"
    },
    {
      name: "Club de Nuit Intense Man",
      brand: "Armaf",
      fileName: "armaf-club-de-nuit-intense-man.png", 
      localPath: "/temp-uploads/armaf-club-de-nuit-intense-man.png"
    },
    {
      name: "Club de Nuit Woman",
      brand: "Armaf",
      fileName: "armaf-club-de-nuit-woman.jpg",
      localPath: "/temp-uploads/armaf-club-de-nuit-woman.jpg"
    },
    {
      name: "Asad",
      brand: "Lattafa",
      fileName: "lattafa-asad.png",
      localPath: "/temp-uploads/lattafa-asad.png"
    },
    {
      name: "Azzure Aoud",
      brand: "Azzure",
      fileName: "azzure-aoud.jpg",
      localPath: "/temp-uploads/azzure-aoud.jpg"
    },
    {
      name: "Badee Al Oud Oud For Glory", 
      brand: "Lattafa",
      fileName: "lattafa-badee-al-oud-glory.png",
      localPath: "/temp-uploads/lattafa-badee-al-oud-glory.png"
    },
    {
      name: "Eclaire",
      brand: "Lattafa",
      fileName: "lattafa-eclaire.png", 
      localPath: "/temp-uploads/lattafa-eclaire.png"
    },
    {
      name: "Terra Pura Magica",
      brand: "Sospiro",
      fileName: "sospiro-terra-pura-magica.png",
      localPath: "/temp-uploads/sospiro-terra-pura-magica.png"
    },
    {
      name: "Classic Stone",
      brand: "Niche Emarati",
      fileName: "niche-emarati-classic-stone.png",
      localPath: "/temp-uploads/niche-emarati-classic-stone.png"
    }
  ];

  const uploadImages = async () => {
    setIsUploading(true);
    const results: { name: string; brand: string; url: string; }[] = [];

    try {
      for (const image of perfumeImages) {
        try {
          // Fetch the image from local path
          const response = await fetch(image.localPath);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${image.fileName}`);
          }
          
          const blob = await response.blob();
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('perfume-images')
            .upload(image.fileName, blob, {
              contentType: blob.type,
              upsert: true // Replace if exists
            });

          if (error) {
            throw error;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('perfume-images')
            .getPublicUrl(image.fileName);

          results.push({
            name: image.name,
            brand: image.brand,
            url: urlData.publicUrl
          });

          toast({
            title: "Imagem enviada",
            description: `${image.brand} - ${image.name}`,
          });

        } catch (error) {
          console.error(`Error uploading ${image.fileName}:`, error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${image.brand} - ${image.name}`,
            variant: "destructive",
          });
        }
      }

      setUploadedImages(results);
      
      toast({
        title: "Upload concluído! ✅",
        description: `${results.length} imagens enviadas para o Supabase`,
      });

    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast({
        title: "Erro no upload em lote",
        description: "Erro ao processar as imagens",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    perfumeImages,
    uploadImages,
    isUploading,
    uploadedImages,
  };
};