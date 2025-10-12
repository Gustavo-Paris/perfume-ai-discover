import { Shield, Award, Truck, Users, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrustSignal {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: string;
}

const trustSignals: TrustSignal[] = [
  {
    icon: Users,
    title: '+5.000 Clientes Satisfeitos',
    description: 'Mais de 5 mil pessoas já encontraram seu perfume ideal conosco',
    highlight: '4.9/5'
  },
  {
    icon: Star,
    title: 'Avaliação 4.9/5',
    description: 'Classificação média baseada em centenas de avaliações reais',
    highlight: '500+ avaliações'
  },
  {
    icon: Shield,
    title: 'Garantia Amou ou Troca',
    description: '7 dias para trocar se não se apaixonar pela fragrância',
    highlight: '100% seguro'
  },
  {
    icon: Award,
    title: 'Produtos Autênticos',
    description: 'Todos os perfumes são originais e de alta qualidade',
    highlight: 'Verificado'
  }
];

interface TrustSignalsProps {
  variant?: 'horizontal' | 'grid';
  className?: string;
  showHighlight?: boolean;
}

/**
 * TrustSignals Component
 * 
 * Displays trust indicators to build credibility and confidence.
 */
export const TrustSignals = ({
  variant = 'horizontal',
  className,
  showHighlight = true
}: TrustSignalsProps) => {
  return (
    <div
      className={cn(
        'w-full',
        variant === 'horizontal' && 'flex flex-wrap justify-center gap-6',
        variant === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
        className
      )}
    >
      {trustSignals.map((signal, index) => {
        const Icon = signal.icon;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200',
              variant === 'horizontal' && 'max-w-xs'
            )}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {signal.title}
                </h3>
                {showHighlight && signal.highlight && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    {signal.highlight}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {signal.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
