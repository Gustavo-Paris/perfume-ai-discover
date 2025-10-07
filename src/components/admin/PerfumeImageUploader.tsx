import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { usePerfumeImageUpload } from '@/hooks/usePerfumeImageUpload';
import { Upload, Copy, CheckCircle, ExternalLink, X, Image, CloudUpload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadedImage {
  name: string;
  url: string;
  file: File;
}

const PerfumeImageUploader = () => {
  const { perfumeImages, uploadImages, isUploading, uploadedImages } = usePerfumeImageUpload();
  
  // Estado para upload personalizado
  const [customFiles, setCustomFiles] = useState<File[]>([]);
  const [customUploading, setCustomUploading] = useState(false);
  const [customUploadedImages, setCustomUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const copyToClipboard = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: `URL de ${name} copiada para área de transferência`,
    });
  };

  const copyAllUrls = () => {
    const allUrls = uploadedImages.map(img => 
      `${img.brand} - ${img.name}: ${img.url}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(allUrls);
    toast({
      title: "Todas URLs copiadas!",
      description: "Lista completa de URLs copiada para área de transferência",
    });
  };

  // Funções para upload personalizado
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length !== files.length) {
        toast({
          title: "Alguns arquivos ignorados",
          description: "Apenas imagens são aceitas (JPG, PNG, WEBP)",
          variant: "destructive",
        });
      }
      
      setCustomFiles(prev => [...prev, ...imageFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setCustomFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setCustomFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateFileName = (file: File): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const baseName = file.name.replace(/\.[^/.]+$/, "").toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${baseName}-${timestamp}-${randomSuffix}.${extension}`;
  };

  const uploadCustomImages = async () => {
    if (customFiles.length === 0) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Selecione ou arraste imagens para fazer upload",
        variant: "destructive",
      });
      return;
    }

    setCustomUploading(true);
    const results: UploadedImage[] = [];

    try {
      for (const file of customFiles) {
        try {
          const fileName = generateFileName(file);
          
          const { data, error } = await supabase.storage
            .from('perfume-images')
            .upload(fileName, file, {
              contentType: file.type,
              upsert: false
            });

          if (error) {
            throw error;
          }

          const { data: urlData } = supabase.storage
            .from('perfume-images')
            .getPublicUrl(fileName);

          results.push({
            name: fileName,
            url: urlData.publicUrl,
            file: file
          });

          toast({
            title: "Imagem enviada",
            description: `${file.name} → ${fileName}`,
          });

        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}`,
            variant: "destructive",
          });
        }
      }

      setCustomUploadedImages(prev => [...prev, ...results]);
      setCustomFiles([]); // Limpar arquivos após upload
      
      toast({
        title: "Upload concluído! ✅",
        description: `${results.length} imagens enviadas com sucesso`,
      });

    } catch (error) {
      console.error('Error in custom upload:', error);
      toast({
        title: "Erro no upload",
        description: "Erro ao processar as imagens",
        variant: "destructive",
      });
    } finally {
      setCustomUploading(false);
    }
  };

  const copyCustomUrls = () => {
    const allUrls = customUploadedImages.map(img => 
      `${img.name}: ${img.url}`
    ).join('\n');
    
    navigator.clipboard.writeText(allUrls);
    toast({
      title: "URLs copiadas!",
      description: "URLs das suas imagens copiadas para área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload personalizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Upload Personalizado de Imagens
          </CardTitle>
          <CardDescription>
            Selecione ou arraste suas próprias imagens para fazer upload direto para o Supabase Storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de drag & drop */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Arraste e solte suas imagens aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique para selecionar arquivos
            </p>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Imagens
            </Button>
          </div>

          {/* Lista de arquivos selecionados */}
          {customFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Arquivos Selecionados ({customFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={uploadCustomImages} 
            disabled={customUploading || customFiles.length === 0}
            className="w-full"
            size="lg"
          >
            {customUploading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Enviando {customFiles.length} imagens...
              </>
            ) : (
              <>
                <CloudUpload className="mr-2 h-4 w-4" />
                Fazer Upload de {customFiles.length} Imagens
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Imagens enviadas (upload personalizado) */}
      {customUploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Suas Imagens Enviadas
            </CardTitle>
            <CardDescription>
              URLs das suas imagens no Supabase Storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={copyCustomUrls}
              variant="outline"
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Todas as URLs
            </Button>

            <Separator />

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {customUploadedImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{image.name}</div>
                      <div className="text-sm text-muted-foreground break-all">
                        {image.url}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(image.url, image.name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  {index < customUploadedImages.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PerfumeImageUploader;