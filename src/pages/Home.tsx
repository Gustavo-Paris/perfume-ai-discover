
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, HeartHandshake, Star, Cpu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import FeaturedProducts from '@/components/home/FeaturedProducts';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-56px)] py-12 md:py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8,
            ease: "easeOut"
          }} className="order-2 lg:order-1">
              <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
                
                
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
                  Descubra o
                  <span className="block text-brand-gradient">Perfume Ideal</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed px-4 sm:px-0">
                  Uma curadoria personalizada com inteligência artificial para encontrar a fragrância perfeita para você
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start px-4 sm:px-0">
                  <div className="relative w-full sm:w-auto">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-full font-medium text-sm md:text-base px-6 md:px-8 py-3 md:py-4 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <Link to="/curadoria" className="flex items-center justify-center">
                        Começar Curadoria
                        <Sparkles className="ml-2 h-4 w-4 md:h-[18px] md:w-[18px]" />
                      </Link>
                    </Button>
                  </div>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto btn-secondary text-sm md:text-base px-6 md:px-8 py-3 md:py-4 transition-all duration-300">
                    <Link to="/catalogo" className="flex items-center justify-center">
                      Ver Catálogo
                    </Link>
                  </Button>
                </div>

                {/* Social Proof */}
                
              </div>
            </motion.div>

            {/* Right Column - Hero Image */}
            <motion.div className="order-1 lg:order-2" initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: 0.2
          }}>
              <div className="relative max-w-lg mx-auto px-4 sm:px-0">
                <div className="relative z-10">
                  <img src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=700&fit=crop&crop=center&q=80" alt="Coleção de perfumes luxuosos" className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] object-cover rounded-2xl shadow-2xl" loading="eager" />
                </div>
                
                {/* Floating card */}
                <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl px-3 md:px-6 py-2 md:py-4 shadow-xl">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs md:text-base">IA Personalizada</p>
                      <p className="text-[10px] md:text-sm text-gray-600">Recomendação inteligente</p>
                    </div>
                  </div>
                </div>

                {/* Background decoration */}
                <div className="absolute -top-4 -right-4 w-32 h-32 md:w-48 md:h-48 lg:w-72 lg:h-72 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -z-10 opacity-60"></div>
                <div className="absolute -bottom-4 md:-bottom-8 -left-4 md:-left-8 w-24 h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -z-10 opacity-60"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Features Section */}
      <motion.section className="py-12 md:py-20 px-4 bg-white" initial={{
      opacity: 0,
      y: 50
    }} whileInView={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6,
      ease: "easeOut"
    }} viewport={{
      once: true
    }}>
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 md:mb-6 text-gray-900">
              Por que escolher a Paris & Co?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos uma experiência única na descoberta de fragrâncias
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6 md:pt-8 pb-6 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-3 text-gray-900">
                  Curadoria IA
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Inteligência artificial personalizada para encontrar sua fragrância ideal
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6 md:pt-8 pb-6 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-3 text-gray-900">
                  Garantia Amou ou Troca
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Até 7 dias para trocar se não se apaixonar pela fragrância
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6 md:pt-8 pb-6 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-3 text-gray-900">
                  Frete Grátis
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Acima de R$ 299 ou para clientes Platinum
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-6 md:pt-8 pb-6 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-3 text-gray-900">
                  Programa Fidelidade
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ganhe pontos a cada compra e troque por descontos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className="py-12 md:py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800" initial={{
      opacity: 0,
      y: 50
    }} whileInView={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6,
      ease: "easeOut"
    }} viewport={{
      once: true
    }}>
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl">
            <div className="text-center">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 md:mb-6 text-gray-900">
                Pronto para encontrar seu perfume ideal?
              </h2>
              <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                Nossa curadoria personalizada utiliza inteligência artificial para recomendar fragrâncias que combinam perfeitamente com seu estilo
              </p>
              
              <div className="relative inline-block w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-full font-medium text-sm md:text-base lg:text-lg px-6 md:px-8 lg:px-10 py-3 md:py-4 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Link to="/curadoria" className="flex items-center justify-center">
                    Iniciar Curadoria Gratuita
                    <Sparkles className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
