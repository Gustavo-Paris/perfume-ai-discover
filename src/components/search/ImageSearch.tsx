import { useState, useRef } from 'react';
import { Upload, Camera, X, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { useImageSearch } from '@/hooks/useImageSearch';

interface ImageSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageSearch({ isOpen, onClose }: ImageSearchProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    searchByImage, 
    results, 
    isLoading, 
    progress, 
    clearResults 
  } = useImageSearch();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Buscar perfumes similares
    await searchByImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    clearResults();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="image-search-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Busca por Imagem
          </DialogTitle>
        </DialogHeader>
        
        <div id="image-search-description" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Faça upload de uma foto de perfume para encontrar produtos similares em nosso catálogo
          </p>

          {!uploadedImage ? (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Arraste uma imagem aqui ou clique para selecionar
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Formatos aceitos: JPG, PNG, WebP (máx. 10MB)
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Usar Câmera
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Dicas para melhores resultados
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Use fotos claras e bem iluminadas</li>
                    <li>Certifique-se que o frasco está bem visível</li>
                    <li>Evite fotos muito escuras ou desfocadas</li>
                    <li>O perfume deve ocupar a maior parte da imagem</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Imagem Carregada */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <LazyImage
                    src={uploadedImage}
                    alt="Imagem carregada"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleReset}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Analisando imagem...</h3>
                  {isLoading && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {progress < 25 && "Processando imagem..."}
                        {progress >= 25 && progress < 50 && "Identificando características..."}
                        {progress >= 50 && progress < 75 && "Comparando com catálogo..."}
                        {progress >= 75 && "Finalizando busca..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resultados */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Perfumes Similares Encontrados
                    </h3>
                    <Badge variant="secondary">
                      {results.length} resultados
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((result) => (
                      <div key={result.perfume.id} className="space-y-2">
                        <PerfumeCard perfume={result.perfume} />
                        <div className="flex items-center gap-2 px-2">
                          <Badge 
                            variant={result.confidence > 0.8 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {Math.round(result.confidence * 100)}% similar
                          </Badge>
                          {result.matchedFeatures && (
                            <span className="text-xs text-muted-foreground">
                              {result.matchedFeatures.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleReset} variant="outline" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Nova Busca
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
              
              {!isLoading && results.length === 0 && uploadedImage && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum perfume similar encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Não conseguimos encontrar perfumes similares à sua imagem. 
                      Tente uma foto diferente ou use nossa busca por texto.
                    </p>
                    <Button onClick={handleReset} variant="outline">
                      Tentar Novamente
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}