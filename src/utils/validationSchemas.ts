/**
 * FASE 4: Schemas de validação reutilizáveis com Zod
 * Centraliza validações client-side para consistência e segurança
 */

import { z } from 'zod';
import { validateCPF, validateCNPJ, validateEmail as validateEmailUtil } from './dataProtection';

// ========================================
// SCHEMAS BÁSICOS
// ========================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .max(255, 'Email muito longo')
  .email('Email inválido')
  .refine((email) => validateEmailUtil(email), {
    message: 'Formato de email inválido',
  });

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha muito longa')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Senha deve conter pelo menos uma letra maiúscula',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Senha deve conter pelo menos uma letra minúscula',
  })
  .refine((password) => /\d/.test(password), {
    message: 'Senha deve conter pelo menos um número',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: 'Senha deve conter pelo menos um caractere especial',
  });

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(100, 'Nome muito longo')
  .refine((name) => name.length >= 3, {
    message: 'Nome deve ter pelo menos 3 caracteres',
  });

export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Telefone inválido')
  .max(15, 'Telefone inválido')
  .refine((phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }, {
    message: 'Telefone deve ter 10 ou 11 dígitos',
  });

export const cpfSchema = z
  .string()
  .trim()
  .refine((cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11 && validateCPF(cleaned);
  }, {
    message: 'CPF inválido',
  });

export const cnpjSchema = z
  .string()
  .trim()
  .refine((cnpj) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.length === 14 && validateCNPJ(cleaned);
  }, {
    message: 'CNPJ inválido',
  });

export const cpfCnpjSchema = z
  .string()
  .trim()
  .refine((doc) => {
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) return validateCPF(cleaned);
    if (cleaned.length === 14) return validateCNPJ(cleaned);
    return false;
  }, {
    message: 'CPF ou CNPJ inválido',
  });

export const cepSchema = z
  .string()
  .trim()
  .refine((cep) => {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  }, {
    message: 'CEP deve ter 8 dígitos',
  });

// ========================================
// SCHEMAS DE ENDEREÇO
// ========================================

export const addressSchema = z.object({
  name: nameSchema,
  street: z.string().trim().min(1, 'Rua é obrigatória').max(200, 'Rua muito longa'),
  number: z.string().trim().min(1, 'Número é obrigatório').max(20, 'Número muito longo'),
  complement: z.string().trim().max(100, 'Complemento muito longo').optional(),
  district: z.string().trim().min(1, 'Bairro é obrigatório').max(100, 'Bairro muito longo'),
  city: z.string().trim().min(1, 'Cidade é obrigatória').max(100, 'Cidade muito longa'),
  state: z.string().trim().length(2, 'Estado deve ter 2 caracteres').toUpperCase(),
  cep: cepSchema,
  cpf_cnpj: cpfCnpjSchema.optional(),
  country: z.string().default('Brasil'),
  is_default: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// ========================================
// SCHEMAS DE AUTENTICAÇÃO
// ========================================

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ========================================
// SCHEMAS DE REVIEW
// ========================================

export const reviewSchema = z.object({
  perfume_id: z.string().uuid('ID de perfume inválido'),
  rating: z.number().int().min(1, 'Avaliação mínima: 1').max(5, 'Avaliação máxima: 5'),
  comment: z
    .string()
    .trim()
    .min(10, 'Comentário deve ter no mínimo 10 caracteres')
    .max(1000, 'Comentário muito longo')
    .optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ========================================
// SCHEMAS DE SUPPORT CHAT
// ========================================

export const supportChatSchema = z.object({
  subject: z.string().max(200, { message: "Assunto deve ter no máximo 200 caracteres" }).optional(),
  category: z.enum(['pedidos', 'produtos', 'entrega', 'pagamento', 'devolucao', 'tecnico', 'outros']).optional(),
  message: z.string()
    .trim()
    .min(1, { message: "Mensagem não pode estar vazia" })
    .max(2000, { message: "Mensagem deve ter no máximo 2000 caracteres" }),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(500, { message: "Feedback deve ter no máximo 500 caracteres" }).optional(),
});

// ========================================
// SCHEMAS DE CUPOM
// ========================================

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, 'Código do cupom é obrigatório')
  .max(50, 'Código muito longo')
  .regex(/^[A-Z0-9_-]+$/i, 'Código inválido');

// ========================================
// SCHEMAS DE CHECKOUT
// ========================================

export const checkoutItemSchema = z.object({
  perfume_id: z.string().uuid('ID de perfume inválido'),
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  brand: z.string().trim().min(1, 'Marca é obrigatória').max(100, 'Marca muito longa'),
  size_ml: z.number().int().min(1, 'Tamanho inválido').max(1000, 'Tamanho muito grande'),
  quantity: z.number().int().min(1, 'Quantidade mínima: 1').max(99, 'Quantidade máxima: 99'),
  unit_price: z.number().min(0.01, 'Preço inválido').max(100000, 'Preço muito alto'),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Carrinho vazio').max(50, 'Muitos itens'),
  payment_method: z.enum(['pix', 'card'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' }),
  }),
  user_email: emailSchema.optional(),
  order_draft_id: z.string().uuid().optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  csrfToken: z.string().length(64, 'Token CSRF inválido').optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ========================================
// SCHEMAS DE SUPORTE
// ========================================

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(5, 'Assunto muito curto').max(200, 'Assunto muito longo'),
  category: z.enum(['pedido', 'produto', 'pagamento', 'entrega', 'outro'], {
    errorMap: () => ({ message: 'Categoria inválida' }),
  }),
  priority: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  description: z.string().trim().min(20, 'Descrição muito curta').max(2000, 'Descrição muito longa'),
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: phoneSchema.optional(),
  order_number: z.string().trim().max(50).optional(),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

// ========================================
// SCHEMAS DE PERFIL
// ========================================

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
});

// ========================================
// SCHEMAS DE CONFIGURAÇÃO DA EMPRESA
// ========================================

export const companyConfigSchema = z.object({
  razao_social: z.string().trim().min(1, 'Razão social é obrigatória').max(200, 'Razão social muito longa'),
  nome_fantasia: z.string().trim().max(200, 'Nome fantasia muito longo').optional(),
  cnpj: cnpjSchema,
  inscricao_estadual: z.string().trim().max(20, 'Inscrição estadual muito longa').optional(),
  inscricao_municipal: z.string().trim().max(20, 'Inscrição municipal muito longa').optional(),
  endereco_completo: z.string().trim().min(1, 'Endereço é obrigatório').max(300, 'Endereço muito longo'),
  cep: cepSchema,
  cidade: z.string().trim().min(1, 'Cidade é obrigatória').max(100, 'Cidade muito longa'),
  estado: z.string().trim().length(2, 'Estado deve ter 2 caracteres').toUpperCase(),
  telefone: phoneSchema,
  email_contato: emailSchema,
  email_sac: emailSchema.optional(),
  responsavel_tecnico: z.string().trim().max(100, 'Nome do responsável muito longo').optional(),
  regime_tributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real']).optional(),
  certificado_a1_base64: z.string().max(100000, 'Certificado muito grande').optional(),
  certificado_senha: z.string().max(100, 'Senha muito longa').optional(),
  ambiente_nfe: z.enum(['homologacao', 'producao']).optional(),
  focus_nfe_token: z.string().max(200, 'Token muito longo').optional(),
});

export type CompanyConfigFormData = z.infer<typeof companyConfigSchema>;

// ========================================
// UTILITÁRIOS DE VALIDAÇÃO
// ========================================

/**
 * Valida e retorna erros de forma amigável
 */
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
};

/**
 * Sanitiza objeto removendo campos não permitidos
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  allowedFields: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {};
  
  allowedFields.forEach((field) => {
    if (field in obj) {
      sanitized[field] = obj[field];
    }
  });
  
  return sanitized;
};
