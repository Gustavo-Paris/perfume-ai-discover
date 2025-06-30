
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import AIBeam from '@/components/ui/AIBeam';
import { samplePerfumes } from '@/data/perfumes';

const Home = () => {
  const featuredPerfumes = samplePerfumes.slice(0, 8);

  return (
    <div className="min-h-screen bg-navy">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#7F5AF0" strokeWidth="0.5" opacity="0.12"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="animate-fade-in-up">
            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl mb-6 text-gold">
              Descubra o
              <span className="block">Perfume Ideal</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-2xl mx-auto font-sans font-medium">
              Uma curadoria personalizada com inteligência artificial para encontrar a fragrância perfeita para você
            </p>
            
            <AIBeam />
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                asChild 
                size="lg" 
                className="btn-primary text-lg px-8 py-4"
              >
                <Link to="/curadoria">
                  Começar Curadoria
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="btn-secondary text-lg px-8 py-4"
              >
                <Link to="/catalogo">
                  Ver Catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-gold">
              Por que escolher a Paris & Co?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-sans font-medium">
              Oferecemos uma experiência única na descoberta de fragrâncias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="glass text-center border-gold/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-navy" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gold">
                  Curadoria IA
                </h3>
                <p className="text-white/70 text-sm font-sans">
                  Inteligência artificial personalizada para encontrar sua fragrância ideal
                </p>
              </CardContent>
            </Card>

            <Card className="glass text-center border-gold/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-navy" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gold">
                  Garantia Amou ou Troca
                </h3>
                <p className="text-white/70 text-sm font-sans">
                  Até 7 dias para trocar se não se apaixonar pela fragrância
                </p>
              </CardContent>
            </Card>

            <Card className="glass text-center border-gold/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-navy" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gold">
                  Frete Grátis
                </h3>
                <p className="text-white/70 text-sm font-sans">
                  Acima de R$ 299 ou para clientes Platinum
                </p>
              </CardContent>
            </Card>

            <Card className="glass text-center border-gold/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-6 w-6 text-navy" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gold">
                  Programa Fidelidade
                </h3>
                <p className="text-white/70 text-sm font-sans">
                  Ganhe pontos a cada compra e troque por descontos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Perfumes */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4 text-gold">
              Fragrâncias em Destaque
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-sans font-medium">
              Descubra nossa seleção curada dos perfumes mais desejados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {featuredPerfumes.map((perfume) => (
              <PerfumeCard key={perfume.id} perfume={perfume} />
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="btn-secondary">
              <Link to="/catalogo">
                Ver Todos os Perfumes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-gold rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-6 text-gold">
              Pronto para encontrar seu perfume ideal?
            </h2>
            <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto font-sans font-medium">
              Nossa curadoria personalizada utiliza inteligência artificial para recomendar fragrâncias que combinam perfeitamente com seu estilo
            </p>
            
            <div className="w-full max-w-md mx-auto mb-8">
              <AIBeam />
            </div>
            
            <Button 
              asChild 
              size="lg" 
              className="btn-primary text-lg px-8 py-4"
            >
              <Link to="/curadoria">
                Iniciar Curadoria Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
