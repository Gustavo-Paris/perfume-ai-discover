/**
 * FASE 3: Componentes para exibição segura de dados sensíveis
 * Exibe dados sensíveis mascarados com opção de revelar temporariamente
 */

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  maskCPF,
  maskCNPJ,
  maskEmail,
  maskPhone,
  maskCardNumber,
} from '@/utils/dataProtection';

type SensitiveDataType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'card' | 'custom';

interface SensitiveDataDisplayProps {
  value: string;
  type: SensitiveDataType;
  label?: string;
  allowReveal?: boolean;
  allowCopy?: boolean;
  customMask?: (value: string) => string;
  className?: string;
}

/**
 * Componente para exibir dados sensíveis de forma segura
 */
export const SensitiveDataDisplay: React.FC<SensitiveDataDisplayProps> = ({
  value,
  type,
  label,
  allowReveal = true,
  allowCopy = false,
  customMask,
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Função de mascaramento baseada no tipo
  const getMaskedValue = (val: string): string => {
    if (customMask) return customMask(val);
    
    switch (type) {
      case 'cpf':
        return maskCPF(val);
      case 'cnpj':
        return maskCNPJ(val);
      case 'email':
        return maskEmail(val);
      case 'phone':
        return maskPhone(val);
      case 'card':
        return maskCardNumber(val);
      default:
        return val;
    }
  };

  const displayValue = isRevealed ? value : getMaskedValue(value);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      toast({
        title: "Copiado!",
        description: "Dado copiado para a área de transferência.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar.",
        variant: "destructive",
      });
    }
  };

  const handleReveal = () => {
    setIsRevealed(!isRevealed);
    
    // Auto-ocultar após 5 segundos
    if (!isRevealed) {
      setTimeout(() => {
        setIsRevealed(false);
      }, 5000);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}:
        </span>
      )}
      
      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
        {displayValue}
      </code>

      <div className="flex gap-1">
        {allowReveal && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReveal}
            className="h-7 w-7 p-0"
            title={isRevealed ? "Ocultar" : "Revelar"}
          >
            {isRevealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}

        {allowCopy && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copiar"
            disabled={isCopied}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Componente específico para exibir CPF
 */
export const CPFDisplay: React.FC<Omit<SensitiveDataDisplayProps, 'type'>> = (props) => (
  <SensitiveDataDisplay {...props} type="cpf" />
);

/**
 * Componente específico para exibir CNPJ
 */
export const CNPJDisplay: React.FC<Omit<SensitiveDataDisplayProps, 'type'>> = (props) => (
  <SensitiveDataDisplay {...props} type="cnpj" />
);

/**
 * Componente específico para exibir Email
 */
export const EmailDisplay: React.FC<Omit<SensitiveDataDisplayProps, 'type'>> = (props) => (
  <SensitiveDataDisplay {...props} type="email" />
);

/**
 * Componente específico para exibir Telefone
 */
export const PhoneDisplay: React.FC<Omit<SensitiveDataDisplayProps, 'type'>> = (props) => (
  <SensitiveDataDisplay {...props} type="phone" />
);

/**
 * Componente específico para exibir Cartão
 */
export const CardDisplay: React.FC<Omit<SensitiveDataDisplayProps, 'type'>> = (props) => (
  <SensitiveDataDisplay {...props} type="card" />
);
