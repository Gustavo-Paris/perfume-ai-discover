
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { useRecommend } from '@/hooks/useRecommend';
import { usePerfumes } from '@/hooks/usePerfumes';
import { RecommendationAnswers } from '@/types/recommendation';

interface Question {
  id: keyof RecommendationAnswers;
  title: string;
  type: 'radio' | 'textarea';
  options?: string[];
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 'gender',
    title: 'Para quem é o perfume?',
    type: 'radio',
    options: ['Para mim (masculino)', 'Para mim (feminino)', 'Para presente (masculino)', 'Para presente (feminino)', 'Não tenho preferência']
  },
  {
    id: 'family',
    title: 'Que tipo de fragrância você prefere?',
    type: 'radio',
    options: ['Fresca e cítrica', 'Floral e delicada', 'Amadeirada e elegante', 'Oriental e intensa', 'Não sei, me ajude a descobrir']
  },
  {
    id: 'occasion',
    title: 'Para que ocasiões pretende usar?',
    type: 'radio',
    options: ['Dia a dia / trabalho', 'Ocasiões especiais', 'Noite / encontros', 'Todas as ocasiões', 'Depende do humor']
  },
  {
    id: 'intensity',
    title: 'Qual intensidade você prefere?',
    type: 'radio',
    options: ['Suave e discreta', 'Moderada', 'Marcante e duradoura', 'Muito intensa', 'Varia conforme a ocasião']
  },
  {
    id: 'budget',
    title: 'Qual seu orçamento?',
    type: 'radio',
    options: ['Até R$ 200', 'R$ 200 - R$ 400', 'R$ 400 - R$ 600', 'Acima de R$ 600', 'Preço não é problema']
  },
  {
    id: 'preferences',
    title: 'Conte-nos mais sobre suas preferências',
    type: 'textarea',
    placeholder: 'Descreva fragrâncias que você gosta, ambientes que te inspiram, ou qualquer detalhe que possa nos ajudar a entender melhor seu estilo...'
  }
];

const Curadoria = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<RecommendationAnswers>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  const { recommend, loading: isAnalyzing } = useRecommend();
  const { data: databasePerfumes } = usePerfumes();

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Final step - get AI recommendations
      try {
        const result = await recommend(answers as RecommendationAnswers);
        setRecommendedIds(result.perfumeIds);
        setShowResults(true);
      } catch (error) {
        toast({
          title: "Erro ao processar recomendações",
          description: "Tente novamente em instantes.",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const canProceed = () => {
    const question = questions[currentQuestion];
    return answers[question.id] && String(answers[question.id]).trim() !== '';
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 to-white">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="font-playfair text-2xl font-bold">Analisando suas preferências...</h2>
            <p className="text-muted-foreground">Nossa IA está processando suas respostas para encontrar os perfumes ideais</p>
          </div>
          <div className="w-64 mx-auto">
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const recommendedPerfumes = databasePerfumes?.filter(p => 
      recommendedIds.includes(p.id)
    ) || [];

    // Sort by recommendation order
    const sortedPerfumes = recommendedIds
      .map(id => recommendedPerfumes.find(p => p.id === id))
      .filter(Boolean);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              Suas Recomendações Personalizadas
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Baseado em suas preferências, nossa IA selecionou estas fragrâncias especialmente para você
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {sortedPerfumes.map((perfume) => {
              // Convert DatabasePerfume to Perfume format
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
                <PerfumeCard key={perfume.id} perfume={perfumeForCard} />
              );
            })}
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Não encontrou o que procurava? 
            </p>
            <div className="space-x-4">
              <Button onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setShowResults(false);
                setRecommendedIds([]);
              }}>
                Refazer Curadoria
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/catalogo'}>
                Ver Catálogo Completo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
            Curadoria Personalizada
          </h1>
          <p className="text-muted-foreground mb-6">
            Responda algumas perguntas para descobrir suas fragrâncias ideais
          </p>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <Card className="perfume-card">
          <CardHeader>
            <CardTitle className="font-playfair text-xl">
              {question.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === 'radio' && question.options && (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="cursor-pointer flex-1 py-2"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'textarea' && (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={question.placeholder}
                className="min-h-24"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gradient-gold text-white hover:opacity-90"
          >
            {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Curadoria;
