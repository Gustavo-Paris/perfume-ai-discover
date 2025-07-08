import { useState } from 'react';
import { Camera, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageSearch } from '@/components/search/ImageSearch';
import { Link } from 'react-router-dom';

export default function ImageSearchDemo() {
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  const features = [
    {
      title: "Inteligência Artificial",
      description: "Tecnologia avançada de reconhecimento de imagem para identificar características únicas dos perfumes",
      icon: "🤖"
    },
    {
      title: "Busca Visual",
      description: "Encontre perfumes similares baseado na forma do frasco, cor e design",
      icon: "👁️"
    },
    {
      title: "Compatibilidade",
      description: "Funciona com fotos do celular, câmera ou imagens salvas no dispositivo",
      icon: "📱"
    },
    {
      title: "Resultados Precisos",
      description: "Sistema de scoring que mostra o percentual de similaridade entre produtos",
      icon: "🎯"
    }
  ];

  const examples = [
    {
      name: "Frasco Retangular",
      description: "Perfumes com frascos geométricos e modernos",
      image: "/placeholder.svg"
    },
    {
      name: "Design Clássico",
      description: "Frascos tradicionais com linhas elegantes",
      image: "/placeholder.svg"
    },
    {
      name: "Formato Único",
      description: "Designs diferenciados e criativos",
      image: "/placeholder.svg"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link to="/search" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Busca
        </Link>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Camera className="h-10 w-10 text-primary" />
            Busca por Imagem
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Revolucione sua forma de encontrar perfumes! Faça upload de uma foto e descubra fragrâncias similares em segundos.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => setIsImageSearchOpen(true)}
            className="text-lg px-8 py-6"
          >
            <Camera className="h-5 w-5 mr-2" />
            Começar Busca por Imagem
          </Button>
        </div>
      </div>

      {/* Como Funciona */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processo Passo a Passo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processo de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Upload da Imagem</h3>
              <p className="text-muted-foreground">
                Faça upload de uma foto do perfume ou use a câmera para capturar uma imagem
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Análise AI</h3>
              <p className="text-muted-foreground">
                Nossa IA analisa características como forma, cor, design e marca do frasco
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Resultados</h3>
              <p className="text-muted-foreground">
                Receba uma lista de perfumes similares com percentual de confiança
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Exemplos de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {examples.map((example) => (
              <div key={example.name} className="border rounded-lg p-4">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{example.name}</h3>
                <p className="text-sm text-muted-foreground">{example.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas para Melhores Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">✅ Recomendado</h4>
              <ul className="space-y-2 text-sm">
                <li>• Foto clara e bem iluminada</li>
                <li>• Frasco ocupando maior parte da imagem</li>
                <li>• Fundo neutro ou simples</li>
                <li>• Ângulo frontal ou ligeiramente inclinado</li>
                <li>• Qualidade de imagem alta</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600 mb-3">❌ Evitar</h4>
              <ul className="space-y-2 text-sm">
                <li>• Fotos muito escuras ou desfocadas</li>
                <li>• Múltiplos produtos na mesma imagem</li>
                <li>• Reflexos excessivos no frasco</li>
                <li>• Ângulos muito estranhos</li>
                <li>• Imagens de baixa resolução</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <div className="text-center mt-12 py-8">
        <h2 className="text-2xl font-bold mb-4">Pronto para Experimentar?</h2>
        <p className="text-muted-foreground mb-6">
          Descubra uma nova forma de encontrar seus perfumes favoritos
        </p>
        <Button 
          size="lg" 
          onClick={() => setIsImageSearchOpen(true)}
          className="text-lg px-8 py-6"
        >
          <Camera className="h-5 w-5 mr-2" />
          Iniciar Busca por Imagem
        </Button>
      </div>

      {/* Modal de busca por imagem */}
      <ImageSearch 
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />
    </div>
  );
}