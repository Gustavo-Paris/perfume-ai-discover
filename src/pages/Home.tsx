
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { samplePerfumes } from '@/data/perfumes';

const Home = () => {
  const featuredPerfumes = samplePerfumes.slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1920&h=1080&fit=crop')`
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <div className="animate-fade-in">
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Descubra o
              <span className="block gradient-text">Perfume Ideal</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
              Uma curadoria personalizada com inteligência artificial para encontrar a fragrância perfeita para você
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="gradient-gold text-white hover:opacity-90 text-lg px-8 py-4"
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
                className="border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg px-8 py-4"
              >
                <Link to="/catalogo">
                  Ver Catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 rounded-full bg-gold-400/20 animate-float" />
        <div className="absolute bottom-32 right-16 w-24 h-24 rounded-full bg-gold-500/10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-20 w-8 h-8 rounded-full bg-white/20 animate-float" style={{ animationDelay: '2s' }} />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              Por que escolher a <span className="gradient-text">Paris & Co</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma experiência única na descoberta de fragrâncias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="perfume-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-playfair font-semibold text-lg mb-2">
                  Curadoria IA
                </h3>
                <p className="text-muted-foreground text-sm">
                  Inteligência artificial personalizada para encontrar sua fragrância ideal
                </p>
              </CardContent>
            </Card>

            <Card className="perfume-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-playfair font-semibold text-lg mb-2">
                  Garantia Amou ou Troca
                </h3>
                <p className="text-muted-foreground text-sm">
                  Até 7 dias para trocar se não se apaixonar pela fragrância
                </p>
              </CardContent>
            </Card>

            <Card className="perfume-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-playfair font-semibold text-lg mb-2">
                  Frete Grátis
                </h3>
                <p className="text-muted-foreground text-sm">
                  Acima de R$ 299 ou para clientes Platinum
                </p>
              </CardContent>
            </Card>

            <Card className="perfume-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-playfair font-semibold text-lg mb-2">
                  Programa Fidelidade
                </h3>
                <p className="text-muted-foreground text-sm">
                  Ganhe pontos a cada compra e troque por descontos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Perfumes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              Fragrâncias em <span className="gradient-text">Destaque</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra nossa seleção curada dos perfumes mais desejados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {featuredPerfumes.map((perfume) => (
              <PerfumeCard key={perfume.id} perfume={perfume} />
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/catalogo">
                Ver Todos os Perfumes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-6">
            Pronto para encontrar seu perfume ideal?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Nossa curadoria personalizada utiliza inteligência artificial para recomendar fragrâncias que combinam perfeitamente com seu estilo
          </p>
          <Button 
            asChild 
            size="lg" 
            className="gradient-gold text-white hover:opacity-90 text-lg px-8 py-4"
          >
            <Link to="/curadoria">
              Iniciar Curadoria Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
