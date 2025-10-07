/**
 * FASE 3: Hook para inputs de dados sensíveis
 * Gerencia estado, formatação e validação de dados sensíveis
 */

import { useState, useCallback } from 'react';
import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  validateCPF,
  validateCNPJ,
  validateEmail,
} from '@/utils/dataProtection';

type InputType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'text';

interface UseSensitiveInputOptions {
  initialValue?: string;
  type: InputType;
  maxLength?: number;
  autoFormat?: boolean;
  validateOnChange?: boolean;
}

interface UseSensitiveInputReturn {
  value: string;
  formattedValue: string;
  isValid: boolean;
  error: string | null;
  setValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  reset: () => void;
}

/**
 * Hook para gerenciar inputs de dados sensíveis com validação e formatação
 */
export const useSensitiveInput = ({
  initialValue = '',
  type,
  maxLength,
  autoFormat = true,
  validateOnChange = false,
}: UseSensitiveInputOptions): UseSensitiveInputReturn => {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formata o valor de acordo com o tipo
  const formatValue = useCallback((val: string): string => {
    if (!autoFormat) return val;

    const cleaned = val.replace(/\D/g, '');

    switch (type) {
      case 'cpf':
        return formatCPF(cleaned);
      case 'cnpj':
        return formatCNPJ(cleaned);
      case 'phone':
        return formatPhone(cleaned);
      default:
        return val;
    }
  }, [type, autoFormat]);

  // Valida o valor de acordo com o tipo
  const validate = useCallback((val: string): { isValid: boolean; error: string | null } => {
    const cleaned = val.replace(/\D/g, '');

    switch (type) {
      case 'cpf':
        if (cleaned.length === 0) return { isValid: true, error: null };
        if (cleaned.length !== 11) return { isValid: false, error: 'CPF incompleto' };
        if (!validateCPF(cleaned)) return { isValid: false, error: 'CPF inválido' };
        return { isValid: true, error: null };

      case 'cnpj':
        if (cleaned.length === 0) return { isValid: true, error: null };
        if (cleaned.length !== 14) return { isValid: false, error: 'CNPJ incompleto' };
        if (!validateCNPJ(cleaned)) return { isValid: false, error: 'CNPJ inválido' };
        return { isValid: true, error: null };

      case 'phone':
        if (cleaned.length === 0) return { isValid: true, error: null };
        if (cleaned.length < 10 || cleaned.length > 11) {
          return { isValid: false, error: 'Telefone inválido' };
        }
        return { isValid: true, error: null };

      case 'email':
        if (val.length === 0) return { isValid: true, error: null };
        if (!validateEmail(val)) return { isValid: false, error: 'Email inválido' };
        return { isValid: true, error: null };

      default:
        return { isValid: true, error: null };
    }
  }, [type]);

  // Handler para onChange
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Aplicar maxLength
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
    }

    // Limpar caracteres não numéricos para tipos específicos
    if (['cpf', 'cnpj', 'phone'].includes(type)) {
      newValue = newValue.replace(/\D/g, '');
    }

    setValue(newValue);

    // Validar em tempo real se configurado
    if (validateOnChange) {
      const validation = validate(newValue);
      setIsValid(validation.isValid);
      setError(validation.error);
    }
  }, [type, maxLength, validateOnChange, validate]);

  // Handler para onBlur (validação ao sair do campo)
  const handleBlur = useCallback(() => {
    const validation = validate(value);
    setIsValid(validation.isValid);
    setError(validation.error);
  }, [value, validate]);

  // Reset
  const reset = useCallback(() => {
    setValue(initialValue);
    setIsValid(true);
    setError(null);
  }, [initialValue]);

  return {
    value,
    formattedValue: formatValue(value),
    isValid,
    error,
    setValue,
    handleChange,
    handleBlur,
    reset,
  };
};
