
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle } from 'lucide-react';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { usePerfumes } from '@/hooks/usePerfumes';

interface RecommendationResultsProps {
  recommendedIds: string[];
  onStartOver: () => void;
  onContinueConversation: () => void;
}

const RecommendationResults = ({ recommendedIds, onStartOver, onContinueConversation }: RecommendationResultsProps) => {
  const { data: databasePerfumes } = usePerfumes();

  const recommendedPerfumes = databasePerfumes?.filter(p => 
    recommendedIds.includes(p.id)
  ) || [];

  // Sort by recommendation order
  const sortedPerfumes = recommendedIds
    .map(id => recommendedPerfumes.find(p => p.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="font-playfair text-3xl font-bold mb-4">
          Suas 3 Recomendações Precisas
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Com base em nossa conversa detalhada, selecionei estas fragrâncias que combinam perfeitamente com seu perfil
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {sortedPerfumes.map((perfume, index) => {
          const perfumeForCard = {
            id: perfume.id,
            name: perfume.name,
            brand: perfume.brand,
            family: perfume.family,
            gender: perfume.gender,
            size_ml: [50, 100],
            price_full: Number(perfume.price_full),
            price_5ml: perfume.price_5ml ? Number(perfume.price_5ml) : 0,
            price_10ml: perfume.price_10ml ? Number(perfume.price_10ml) : 0,
            stock_full: 10,
            stock_5ml: 50,
            stock_10ml: 30,
            description: perfume.description || '',
            image_url: perfume.image_url || '',
            top_notes: perfume.top_notes,
            heart_notes: perfume.heart_notes,
            base_notes: perfume.base_notes,
            created_at: perfume.created_at
          };

          return (
            <div key={perfume.id} className="relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white font-bold text-sm z-10">
                {index + 1}
              </div>
              <PerfumeCard perfume={perfumeForCard} />
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-6">
        <div className="p-6 bg-gradient-to-r from-gold-50 to-amber-50 rounded-lg border border-gold-200">
          <h3 className="font-playfair text-xl font-semibold mb-2 text-gold-700">
            Não encontrou o que procurava?
          </h3>
          <p className="text-muted-foreground mb-4">
            Continue nossa conversa e vamos refinar ainda mais suas preferências
          </p>
          <Button 
            onClick={onContinueConversation}
            className="gradient-gold text-white hover:opacity-90 mr-4"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Continuar Conversa
          </Button>
        </div>
        
        <div className="space-x-4">
          <Button onClick={onStartOver} variant="outline">
            Nova Curadoria
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/catalogo'}>
            Ver Catálogo Completo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationResults;
