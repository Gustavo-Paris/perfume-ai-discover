import { useEffect, useState } from 'react';
import { Sparkles, Search, Zap, CheckCircle } from 'lucide-react';

interface LoadingTransitionProps {
  onComplete: () => void;
}

const LoadingTransition = ({ onComplete }: LoadingTransitionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Search, text: "Analisando suas preferências...", duration: 1500 },
    { icon: Sparkles, text: "Buscando perfumes no catálogo...", duration: 1500 },
    { icon: Zap, text: "Personalizando recomendações...", duration: 1000 },
    { icon: CheckCircle, text: "Análise concluída!", duration: 500 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Wait a bit more before calling onComplete
        setTimeout(onComplete, 800);
      }
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      <div className="relative">
        {/* Animated background glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-lg animate-pulse"></div>
        
        {/* Main icon container */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <CurrentIcon className="h-10 w-10 text-white animate-bounce" />
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-pink-400 rounded-full"></div>
          <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full"></div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="font-playfair text-2xl font-bold text-gray-800">
          {steps[currentStep].text}
        </h3>
        
        {/* Progress bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Etapa {currentStep + 1} de {steps.length}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex space-x-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <StepIcon className="h-4 w-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoadingTransition;