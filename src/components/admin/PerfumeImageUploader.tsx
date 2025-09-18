import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePerfumeImageUpload } from '@/hooks/usePerfumeImageUpload';
import { Upload, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PerfumeImageUploader = () => {
  console.log('PerfumeImageUploader: Component loading');
  const { perfumeImages, uploadImages, isUploading, uploadedImages } = usePerfumeImageUpload();

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Imagens de Perfumes
          </CardTitle>
          <CardDescription>
            Faça upload das imagens identificadas para o bucket do Supabase e obtenha URLs para uso no cadastro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perfumeImages.map((image, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{image.brand} - {image.name}</div>
                  <div className="text-sm text-muted-foreground">{image.fileName}</div>
                </div>
                <Badge variant="outline">
                  {image.fileName.split('.').pop()?.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>

          <Button 
            onClick={uploadImages} 
            disabled={isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Enviando imagens...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Fazer Upload de Todas as Imagens
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Imagens Enviadas - URLs para Cadastro
            </CardTitle>
            <CardDescription>
              URLs públicas das imagens no Supabase Storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={copyAllUrls}
              variant="outline"
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Todas as URLs
            </Button>

            <Separator />

            <div className="space-y-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{image.brand} - {image.name}</div>
                      <div className="text-sm text-muted-foreground break-all">
                        {image.url}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(image.url, `${image.brand} - ${image.name}`)}
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
                  {index < uploadedImages.length - 1 && <Separator />}
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