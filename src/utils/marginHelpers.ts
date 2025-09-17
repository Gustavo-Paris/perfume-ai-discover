/**
 * Utilitários para padronizar o sistema de margem de lucro
 * 
 * PADRÃO DEFINIDO:
 * - Interface: Usuário vê e digita em PORCENTAGEM (80%, 100%, etc)
 * - Banco: Armazena como MULTIPLICADOR (1.8, 2.0, etc)
 * - Cálculos: Usa MULTIPLICADOR internamente
 * - Fórmula: Preço = Custo × Multiplicador
 */

/**
 * Converte porcentagem da interface para multiplicador do banco
 * @param percentage Valor da interface (ex: 80)
 * @returns Multiplicador para o banco (ex: 1.8)
 */
export const percentageToMultiplier = (percentage: number): number => {
  return 1 + (percentage / 100);
};

/**
 * Converte multiplicador do banco para porcentagem da interface
 * @param multiplier Valor do banco (ex: 1.8)
 * @returns Porcentagem para interface (ex: 80)
 */
export const multiplierToPercentage = (multiplier: number): number => {
  return (multiplier - 1) * 100;
};

/**
 * Formata margem para exibição na interface
 * @param multiplier Valor multiplicador do banco
 * @returns String formatada (ex: "80%")
 */
export const formatMarginDisplay = (multiplier?: number | null): string => {
  if (!multiplier || multiplier <= 1) return "100%"; // Default 100% markup
  return `${((multiplier - 1) * 100).toFixed(0)}%`;
};

/**
 * Valida se uma margem está dentro dos limites aceitáveis
 * @param percentage Porcentagem da interface
 * @returns true se válida
 */
export const isValidMargin = (percentage: number): boolean => {
  return percentage >= 50 && percentage <= 300; // Permitir até 300% de margem
};

/**
 * Garante que o valor de margem seja válido, aplicando fallback se necessário
 * @param multiplier Valor multiplicador do banco
 * @returns Multiplicador válido (default: 2.0 = 100%)
 */
export const ensureValidMarginMultiplier = (multiplier?: number | null): number => {
  if (!multiplier || multiplier <= 1) return 2.0; // 100% default
  return multiplier;
};

// Manter compatibilidade com código legado
export const percentageToDecimal = percentageToMultiplier;
export const decimalToPercentage = multiplierToPercentage;