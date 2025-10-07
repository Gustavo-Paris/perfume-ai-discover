# Guia de Segurança - Perfumes Paris

Este documento descreve as práticas de segurança implementadas no projeto e diretrizes para desenvolvimento seguro.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Validação de Dados](#validação-de-dados)
4. [Proteção de Dados Sensíveis](#proteção-de-dados-sensíveis)
5. [Segurança em Edge Functions](#segurança-em-edge-functions)
6. [Headers de Segurança](#headers-de-segurança)
7. [Checklist de Segurança](#checklist-de-segurança)

## 🔒 Visão Geral

O projeto implementa múltiplas camadas de segurança seguindo as melhores práticas da indústria:

- ✅ **Autenticação robusta** com Supabase Auth
- ✅ **Autorização baseada em roles** (RLS policies)
- ✅ **Validação client-side e server-side**
- ✅ **Proteção CSRF**
- ✅ **Rate limiting**
- ✅ **Sanitização de inputs**
- ✅ **Criptografia de dados sensíveis**
- ✅ **Headers de segurança HTTP**
- ✅ **Logging de eventos de segurança**

## 🔐 Autenticação e Autorização

### Autenticação

O projeto usa **Supabase Auth** para gerenciar autenticação:

```typescript
// src/contexts/AuthContext.tsx
const { signIn, signUp, signOut } = useAuth();

// Login com validação de senha
await signIn(email, password);

// Registro com verificação de força de senha
await signUp(email, password, name);
```

**Recursos de segurança:**
- ✅ Validação de força de senha (8+ caracteres, maiúsculas, números, símbolos)
- ✅ Verificação contra senhas vazadas (Have I Been Pwned API)
- ✅ Auto-logout após inatividade (configurável)
- ✅ Validação contínua de sessão
- ✅ Refresh automático de tokens

### Autorização (RLS)

**Row Level Security (RLS)** está habilitado em todas as tabelas sensíveis:

```sql
-- Exemplo: Usuários só veem seus próprios pedidos
CREATE POLICY "Users can only view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);
```

**Tabelas protegidas:**
- `addresses` - Endereços de entrega
- `orders` - Pedidos
- `profiles` - Perfis de usuário
- `company_info` - Dados da empresa (apenas admins)
- `security_audit_log` - Logs de auditoria (apenas admins)

### Roles

Sistema de roles implementado via tabela `user_roles`:

```typescript
// Verificar se usuário é admin
const isAdmin = await has_role(auth.uid(), 'admin');
```

**Roles disponíveis:**
- `admin` - Acesso total
- `moderator` - Gerenciar reviews e suporte
- `user` - Usuário padrão

## ✅ Validação de Dados

### Client-Side

Todas as entradas de usuário são validadas usando **Zod**:

```typescript
import { addressSchema } from '@/utils/validationSchemas';

// Validar formulário de endereço
const result = addressSchema.safeParse(formData);
if (!result.success) {
  // Tratar erros de validação
}
```

**Schemas disponíveis:**
- `emailSchema` - Email
- `passwordSchema` - Senha forte
- `cpfSchema` / `cnpjSchema` - Documentos brasileiros
- `addressSchema` - Endereço completo
- `checkoutSchema` - Dados de checkout
- `reviewSchema` - Avaliações

### Server-Side

Edge functions validam **todos os inputs**:

```typescript
// supabase/functions/_shared/validationMiddleware.ts
const validation = await validateRequest(req, supabase, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: { maxAttempts: 5, windowMinutes: 10 }
});

if (!validation.valid) {
  return createErrorResponse(validation.error!, validation.statusCode!);
}
```

**Validações server-side:**
- ✅ CSRF token
- ✅ Rate limiting
- ✅ Autenticação
- ✅ Sanitização de strings
- ✅ Validação de tipos e ranges
- ✅ Origem do request

## 🛡️ Proteção de Dados Sensíveis

### Mascaramento

Dados sensíveis são mascarados na exibição:

```typescript
import { maskCPF, maskEmail, maskPhone } from '@/utils/dataProtection';

// CPF: 123.456.789-10 → 123.xxx.xxx-10
const masked = maskCPF('12345678910');

// Email: user@example.com → u***@example.com
const maskedEmail = maskEmail('user@example.com');
```

**Componentes seguros:**
```tsx
import { CPFDisplay, EmailDisplay } from '@/components/security/SensitiveDataDisplay';

<CPFDisplay 
  value="12345678910" 
  allowReveal={true}  // Permite revelar temporariamente
  allowCopy={true}    // Botão para copiar
/>
```

### Validação de Documentos

```typescript
import { validateCPF, validateCNPJ } from '@/utils/dataProtection';

// Validar CPF usando algoritmo oficial
if (!validateCPF(cpf)) {
  // CPF inválido
}
```

### Input Seguro

Hook para gerenciar inputs sensíveis:

```typescript
import { useSensitiveInput } from '@/hooks/useSensitiveInput';

const cpfInput = useSensitiveInput({
  type: 'cpf',
  autoFormat: true,
  validateOnChange: true
});

// Uso em formulário
<Input
  value={cpfInput.formattedValue}
  onChange={cpfInput.handleChange}
  onBlur={cpfInput.handleBlur}
  error={cpfInput.error}
/>
```

## 🔧 Segurança em Edge Functions

### Middleware de Validação

Todas as edge functions devem usar o middleware de validação:

```typescript
import { validateRequest, createErrorResponse } from "../_shared/validationMiddleware.ts";

serve(async (req) => {
  // Validação automática
  const validation = await validateRequest(req, supabase, {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: { maxAttempts: 3, windowMinutes: 5 }
  });

  if (!validation.valid) {
    return createErrorResponse(validation.error!, validation.statusCode!);
  }

  const { user } = validation;
  // Processar request...
});
```

### Sanitização

Sempre sanitizar inputs em edge functions:

```typescript
import { sanitizeString, validateAndSanitizeCheckoutItems } from "../_shared/security.ts";

// Sanitizar string
const cleanName = sanitizeString(userInput);

// Validar e sanitizar array de items
const cleanItems = validateAndSanitizeCheckoutItems(items);
```

### Rate Limiting

Implementado tanto client-side quanto server-side:

```typescript
// Client-side
import { useRateLimit } from '@/hooks/useRateLimit';

const rateLimit = useRateLimit('checkout', {
  maxAttempts: 3,
  windowMs: 300000 // 5 minutos
});

if (rateLimit.blocked) {
  // Bloqueado
}

// Server-side (automático via middleware)
```

### CSRF Protection

```typescript
// Client-side
import { useCSRFToken } from '@/hooks/useCSRFToken';

const { token, validateToken } = useCSRFToken();

// Incluir token em requests
await supabase.functions.invoke('function-name', {
  body: {
    csrfToken: token,
    // ... outros dados
  }
});

// Server-side (automático via middleware)
```

## 🌐 Headers de Segurança

### Configuração Recomendada

**Para Vercel**, adicionar em `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

### Content Security Policy (CSP)

Definir CSP rigorosa para prevenir XSS:

```typescript
// src/utils/securityHeaders.ts
export const CSP_HEADER = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co",
    // ... mais configurações
  ].join('; ')
};
```

## ✔️ Checklist de Segurança

### Antes de Deploy

- [ ] Todos os secrets estão em variáveis de ambiente (não no código)
- [ ] RLS habilitado em todas as tabelas públicas
- [ ] Validação client-side e server-side em todos os formulários
- [ ] CSRF protection em operações críticas
- [ ] Rate limiting configurado
- [ ] Headers de segurança HTTP configurados
- [ ] Logs de segurança funcionando
- [ ] Auto-logout configurado
- [ ] HTTPS forçado (Strict-Transport-Security)
- [ ] Dados sensíveis mascarados

### Código

- [ ] Nunca usar `dangerouslySetInnerHTML` com dados de usuário
- [ ] Sempre sanitizar inputs antes de usar em queries
- [ ] Validar tipos e ranges de todos os inputs
- [ ] Usar prepared statements (Supabase client já faz isso)
- [ ] Não logar dados sensíveis no console
- [ ] Não expor stack traces em produção

### Supabase

- [ ] RLS habilitado em todas as tabelas
- [ ] Policies testadas para diferentes roles
- [ ] Service role key nunca exposta no frontend
- [ ] Auth configurado corretamente
- [ ] Backups automáticos habilitados

### Monitoramento

- [ ] Logs de segurança sendo coletados
- [ ] Alertas configurados para eventos críticos
- [ ] Monitoramento de rate limiting
- [ ] Análise periódica de logs de auditoria

## 🚨 Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**. 

Entre em contato com a equipe de segurança em: **[seu-email-de-seguranca]**

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSRF Protection](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**Última atualização:** 2025-10-07  
**Versão:** 4.0.0
