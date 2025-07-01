import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, HeartHandshake, Star, Cpu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import FeaturedProducts from '@/components/home/FeaturedProducts';
const Home = () => {
  return <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-56px)] py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
              <div className="max-w-xl">
                
                
                <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                  Descubra o
                  <span className="block text-brand-gradient">Perfume Ideal</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Uma curadoria personalizada com inteligência artificial para encontrar a fragrância perfeita para você
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="ai-halo rounded-3xl">
                    <Button asChild size="lg" className="bg-navy/70 hover:bg-navy/90 text-white rounded-full font-medium text-base px-8 py-4">
                      <Link to="/curadoria">
                        Começar Curadoria
                        <Sparkles className="ml-2 h-[18px] w-[18px]" />
                      </Link>
                    </Button>
                  </div>
                  <Button asChild variant="outline" size="lg" className="btn-secondary text-base px-8 py-4">
                    <Link to="/catalogo">
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
              <div className="relative">
                <div className="relative z-10">
                  <img src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=700&fit=crop&crop=center&q=80" alt="Coleção de perfumes luxuosos" className="w-full max-w-[600px] h-[700px] object-cover rounded-2xl shadow-2xl mx-auto" loading="eager" />
                </div>
                
                {/* Floating card */}
                <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl px-6 py-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <p className="font-medium text-gray-900">IA Personalizada</p>
                      <p className="text-sm text-gray-600">Recomendação inteligente</p>
                    </div>
                  </div>
                </div>

                {/* Background decoration */}
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -z-10 opacity-60"></div>
                <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -z-10 opacity-60"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Features Section */}
      <motion.section className="py-20 px-4 bg-white" initial={{
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
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-gray-900">
              Por que escolher a Paris & Co?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos uma experiência única na descoberta de fragrâncias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Curadoria IA
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Inteligência artificial personalizada para encontrar sua fragrância ideal
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Garantia Amou ou Troca
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Até 7 dias para trocar se não se apaixonar pela fragrância
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Frete Grátis
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Acima de R$ 299 ou para clientes Platinum
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
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
      <motion.section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800" initial={{
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
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl py-[50px] px-[50px]">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-gray-900">
              Pronto para encontrar seu perfume ideal?
            </h2>
            <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nossa curadoria personalizada utiliza inteligência artificial para recomendar fragrâncias que combinam perfeitamente com seu estilo
            </p>
            
            <div className="ai-halo rounded-3xl">
              <Button asChild size="lg" className="bg-gold text-navy rounded-full font-medium text-lg px-10 py-4 hover:bg-gold/90">
                <Link to="/curadoria" className="py-0 px-[20px]">
                  Iniciar Curadoria Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>;
};
export default Home;