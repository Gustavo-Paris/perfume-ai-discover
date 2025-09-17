/**
 * Utilitários para padronizar o sistema de margem de lucro
 * 
 * PADRÃO DEFINIDO:
 * - Interface: Usuário vê e digita em PORCENTAGEM (200%, 150%, etc)
 * - Banco: Armazena como DECIMAL (2.0, 1.5, etc)
 * - Cálculos: Usa DECIMAL internamente
 */

/**
 * Converte porcentagem da interface para decimal do banco
 * @param percentage Valor da interface (ex: 200)
 * @returns Decimal para o banco (ex: 2.0)
 */
export const percentageToDecimal = (percentage: number): number => {
  return percentage / 100;
};

/**
 * Converte decimal do banco para porcentagem da interface
 * @param decimal Valor do banco (ex: 2.0)
 * @returns Porcentagem para interface (ex: 200)
 */
export const decimalToPercentage = (decimal: number): number => {
  return decimal * 100;
};

/**
 * Formata margem para exibição na interface
 * @param decimal Valor decimal do banco
 * @returns String formatada (ex: "200%")
 */
export const formatMarginDisplay = (decimal?: number | null): string => {
  if (!decimal) return "200%";
  return `${(decimal * 100).toFixed(0)}%`;
};

/**
 * Valida se uma margem está dentro dos limites aceitáveis
 * @param percentage Porcentagem da interface
 * @returns true se válida
 */
export const isValidMargin = (percentage: number): boolean => {
  return percentage >= 50 && percentage <= 500;
};

/**
 * Garante que o valor de margem seja válido, aplicando fallback se necessário
 * @param decimal Valor decimal do banco
 * @returns Decimal válido (default: 2.0 = 200%)
 */
export const ensureValidMarginDecimal = (decimal?: number | null): number => {
  if (!decimal || decimal <= 0) return 2.0; // 200% default
  return decimal;
};