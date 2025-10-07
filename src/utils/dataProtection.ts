/**
 * FASE 3: Proteção de dados sensíveis & Criptografia
 * Utilitários para mascaramento e criptografia de dados sensíveis
 */

// ========================================
// MASCARAMENTO DE DADOS
// ========================================

/**
 * Mascara CPF
 * Exemplo: 123.456.789-10 vira 123.xxx.xxx-10
 */
export const maskCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.xxx.xxx-$4');
};

/**
 * Mascara CNPJ  
 * Exemplo: 12.345.678/0001-90 vira 12.xxx.xxx/xxxx-90
 */
export const maskCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.xxx.xxx/xxxx-$5');
};

/**
 * Mascara email
 * Exemplo: user@example.com vira u***@example.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  
  const visibleChars = Math.max(1, Math.floor(local.length * 0.3));
  const masked = local.slice(0, visibleChars) + '***';
  
  return `${masked}@${domain}`;
};

/**
 * Mascara telefone
 * Exemplo: (11) 98765-4321 vira (11) xxxxx-4321
 */
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return phone;
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) xxxxx-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) xxxx-$3');
};

/**
 * Mascara número de cartão
 * Exemplo: 1234 5678 9012 3456 vira xxxx xxxx xxxx 3456
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length !== 16) return cardNumber;
  
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, 'xxxx xxxx xxxx $4');
};

/**
 * Mascara CVV: 123 vira xxx
 */
export const maskCVV = (cvv: string): string => {
  return 'x'.repeat(cvv.length);
};

// ========================================
// FORMATAÇÃO DE DADOS
// ========================================

/**
 * Formata CPF: 12345678910 → 123.456.789-10
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ: 12345678000190 → 12.345.678/0001-90
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone: 11987654321 → (11) 98765-4321
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// ========================================
// VALIDAÇÃO DE DADOS
// ========================================

/**
 * Valida CPF usando algoritmo oficial
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ usando algoritmo oficial
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14 || /^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
};

/**
 * Valida email usando regex
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ========================================
// CRIPTOGRAFIA SIMPLES (Client-side)
// ========================================

/**
 * Criptografa dados sensíveis usando Base64 + obfuscação
 * NOTA: Esta é uma criptografia básica. Para dados críticos,
 * use criptografia server-side adequada.
 */
export const encryptSensitiveData = (data: string, key: string = 'default'): string => {
  try {
    const obfuscated = data.split('').map((char, i) => {
      const keyChar = key.charCodeAt(i % key.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    
    return btoa(obfuscated);
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
};

/**
 * Descriptografa dados usando Base64 + desobfuscação
 */
export const decryptSensitiveData = (encrypted: string, key: string = 'default'): string => {
  try {
    const decoded = atob(encrypted);
    const deobfuscated = decoded.split('').map((char, i) => {
      const keyChar = key.charCodeAt(i % key.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    
    return deobfuscated;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encrypted;
  }
};

// ========================================
// UTILITÁRIOS DE SEGURANÇA
// ========================================

/**
 * Remove informações sensíveis de objetos para logging
 */
export const sanitizeForLogging = (obj: any): any => {
  const sensitive = ['password', 'senha', 'token', 'secret', 'api_key', 'cvv', 'card'];
  
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return '***REDACTED***';
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = sanitize(val);
        }
      }
      return sanitized;
    }
    return value;
  };
  
  return sanitize(obj);
};

/**
 * Detecta e mascara automaticamente dados sensíveis em strings
 */
export const autoMaskSensitiveData = (text: string): string => {
  let masked = text;
  
  // CPF
  masked = masked.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, (match) => maskCPF(match));
  
  // CNPJ
  masked = masked.replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, (match) => maskCNPJ(match));
  
  // Email
  masked = masked.replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, (match) => maskEmail(match));
  
  // Telefone
  masked = masked.replace(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, (match) => maskPhone(match));
  
  // Cartão (16 dígitos)
  masked = masked.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, (match) => maskCardNumber(match));
  
  return masked;
};

/**
 * Verifica se uma string contém dados sensíveis
 */
export const containsSensitiveData = (text: string): boolean => {
  const patterns = [
    /\d{3}\.\d{3}\.\d{3}-\d{2}/, // CPF
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, // CNPJ
    /[^\s@]+@[^\s@]+\.[^\s@]+/, // Email
    /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/, // Telefone
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Cartão
  ];
  
  return patterns.some(pattern => pattern.test(text));
};
