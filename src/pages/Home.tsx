
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import FeaturedSlider from '@/components/home/FeaturedSlider';
import FloatingShapes from '@/components/ui/FloatingShapes';

const Home = () => {
  return (
    <div className="min-h-screen bg-navy">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Floating Shapes Background */}
        <div className="hidden md:block">
          <FloatingShapes />
        </div>
        
        {/* Content Grid */}
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="font-display font-bold text-5xl md:text-6xl text-gold mb-4">
                Descubra o
                <span className="block">Perfume Ideal</span>
              </h1>
              <p className="text-xl text-white/80 max-w-[500px] mb-8 font-sans font-medium">
                Uma curadoria personalizada com inteligência artificial para encontrar a fragrância perfeita para você
              </p>
              
              <div className="flex flex-col md:flex-row gap-6">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gold text-navy rounded-full px-8 py-3 font-medium hover:translate-y-[1px] transition-all duration-200 shadow-[0_2px_6px_rgba(212,175,55,0.4)]"
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
                  className="outline-gold text-gold hover:bg-gold/10 rounded-full px-8 py-3"
                >
                  <Link to="/catalogo">
                    Ver Catálogo
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <div className="relative">
                <img
                  src="/images/hero-perfume.jpg"
                  alt="Frascos luxuosos"
                  className="w-full max-w-[550px] h-[700px] object-cover rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mx-auto"
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                
                {/* Badge overlay - hidden on mobile */}
                <div className="hidden md:block absolute bottom-6 right-6 backdrop-blur-md bg-navy/60 border border-gold/15 rounded-xl px-4 py-2 text-sm text-gold">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                    IA Personalizada
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Perfumes Slider */}
      <FeaturedSlider />

      {/* Features Section */}
      <motion.section 
        className="py-20 px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, threshold: 0.1 }}
      >
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
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, threshold: 0.1 }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-gold rounded-3xl p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-6 text-gold">
              Pronto para encontrar seu perfume ideal?
            </h2>
            <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto font-sans font-medium">
              Nossa curadoria personalizada utiliza inteligência artificial para recomendar fragrâncias que combinam perfeitamente com seu estilo
            </p>
            
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
      </motion.section>
    </div>
  );
};

export default Home;
