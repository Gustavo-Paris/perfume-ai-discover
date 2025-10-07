# Guia de Implementação - Segurança Aplicada

Este guia mostra como aplicar as camadas de segurança implementadas no projeto.

## ✅ O Que Foi Implementado

### FASE 1: Autenticação Robusta ✅
- ✅ Auto-logout por inatividade
- ✅ Validação contínua de sessão
- ✅ Verificação de senhas vazadas (HIBP API)
- ✅ Validação de força de senha
- ✅ CSRF protection
- ✅ Rate limiting client-side

### FASE 2: Validação Server-Side & RLS ✅
- ✅ RLS habilitado em todas as tabelas públicas
- ✅ Policies de segurança por role
- ✅ Função `has_role()` para verificação de permissões
- ✅ `security_audit_log` para logging de eventos
- ✅ Índices para performance
- ✅ Comentários de documentação em tabelas sensíveis

### FASE 3: Proteção de Dados Sensíveis ✅
- ✅ Utilitários de mascaramento (CPF, CNPJ, email, telefone, cartão)
- ✅ Componentes seguros de exibição
- ✅ Hook `useSensitiveInput` para inputs validados
- ✅ Validação oficial de CPF/CNPJ
- ✅ Formatação automática

### FASE 4: Validação Robusta & Headers ✅
- ✅ Schemas Zod reutilizáveis
- ✅ Middleware de validação para edge functions
- ✅ Headers de segurança HTTP configurados
- ✅ Documentação completa (SECURITY.md)

## 🔧 Como Aplicar no Código

### 1. Usar Schemas de Validação

**Antes:**
```tsx
// ❌ Validação manual propensa a erros
if (!email || !email.includes('@')) {
  setError('Email inválido');
}
```

**Depois:**
```tsx
// ✅ Usar schema validado
import { emailSchema } from '@/utils/validationSchemas';

const result = emailSchema.safeParse(email);
if (!result.success) {
  setError(result.error.errors[0].message);
}
```

### 2. Componentes de Dados Sensíveis

**Antes:**
```tsx
// ❌ Exibir CPF completo sem proteção
<p>CPF: {user.cpf}</p>
```

**Depois:**
```tsx
// ✅ Usar componente seguro
import { CPFDisplay } from '@/components/security/SensitiveDataDisplay';

<CPFDisplay 
  value={user.cpf}
  allowReveal={true}
  allowCopy={false}
/>
```

### 3. Inputs de Dados Sensíveis

**Antes:**
```tsx
// ❌ Input manual sem validação
<Input
  value={cpf}
  onChange={(e) => setCpf(e.target.value)}
/>
```

**Depois:**
```tsx
// ✅ Hook com validação e formatação
import { useSensitiveInput } from '@/hooks/useSensitiveInput';

const cpfInput = useSensitiveInput({
  type: 'cpf',
  autoFormat: true,
  validateOnChange: true
});

<Input
  value={cpfInput.formattedValue}
  onChange={cpfInput.handleChange}
  onBlur={cpfInput.handleBlur}
/>
{cpfInput.error && <p className="text-red-600">{cpfInput.error}</p>}
```

### 4. Edge Functions Seguras

**Antes:**
```typescript
// ❌ Sem validação adequada
serve(async (req) => {
  const { data } = await req.json();
  // Processar diretamente...
});
```

**Depois:**
```typescript
// ✅ Com middleware de validação
import { validateRequest, createErrorResponse } from '../_shared/validationMiddleware.ts';

serve(async (req) => {
  const supabase = createClient(/* ... */);
  
  // Validação automática
  const validation = await validateRequest(req, supabase, {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: { maxAttempts: 5, windowMinutes: 10 }
  });

  if (!validation.valid) {
    return createErrorResponse(validation.error!, validation.statusCode!);
  }

  const { user } = validation;
  // Processar com segurança...
});
```

### 5. Formulários Validados

**Exemplo Completo:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressFormData } from '@/utils/validationSchemas';
import { useCSRFToken } from '@/hooks/useCSRFToken';

export const SecureForm = () => {
  const { token: csrfToken } = useCSRFToken();
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const onSubmit = async (data: AddressFormData) => {
    // Dados já validados pelo schema
    await supabase.functions.invoke('my-function', {
      body: {
        csrfToken, // Sempre incluir
        ...data
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Campos do formulário */}
    </form>
  );
};
```

## 📋 Próximos Passos Práticos

### 1. Atualizar Formulários Existentes

Aplicar schemas de validação em:
- [x] `src/components/checkout/AddressForm.tsx` 
- [ ] `src/pages/Auth.tsx` (login/signup)
- [ ] `src/components/reviews/ReviewForm.tsx`
- [ ] `src/components/admin/CompanyConfigManager.tsx`

### 2. Adicionar Headers de Segurança

Criar arquivo na raiz do projeto:

**vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 3. Testar Segurança

Executar testes de segurança:

```bash
# 1. Verificar RLS policies
# Acessar: https://supabase.com/dashboard/project/[PROJECT_ID]/database/policies

# 2. Testar rate limiting
# Fazer múltiplas requisições rápidas e verificar bloqueio

# 3. Validar CSRF
# Tentar fazer request sem token

# 4. Verificar sanitização
# Tentar injetar <script> em campos de texto
```

### 4. Configurar Monitoramento

Adicionar alertas para:
- ✅ Eventos de rate limit excedido
- ✅ Tentativas de CSRF inválido
- ✅ Falhas de autenticação repetidas
- ✅ Acessos a dados sensíveis

Query de exemplo:
```sql
-- Ver tentativas de CSRF nos últimos 7 dias
SELECT 
  event_type,
  COUNT(*) as total,
  DATE(created_at) as date
FROM security_audit_log
WHERE event_type = 'csrf_validation_failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC;
```

### 5. Documentar para o Time

- [x] SECURITY.md - Guia de segurança
- [x] IMPLEMENTATION_GUIDE.md - Este guia
- [ ] README.md - Adicionar seção de segurança
- [ ] Onboarding doc - Incluir práticas de segurança

## 🎯 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Revisar todas as RLS policies
- [ ] Testar rate limiting em staging
- [ ] Configurar headers HTTP (vercel.json)
- [ ] Verificar todos os secrets configurados
- [ ] Testar CSRF protection
- [ ] Validar auto-logout
- [ ] Revisar logs de segurança
- [ ] Documentar procedures de incident response
- [ ] Configurar alertas de segurança
- [ ] Fazer backup da base de dados

## 🔐 Exemplos de Uso

### Validar Email
```typescript
import { emailSchema } from '@/utils/validationSchemas';

const result = emailSchema.safeParse(userInput);
if (result.success) {
  // Email válido
  const email = result.data;
}
```

### Validar CPF
```typescript
import { validateCPF, formatCPF } from '@/utils/dataProtection';

const cpf = '12345678910';
if (validateCPF(cpf)) {
  const formatted = formatCPF(cpf); // 123.456.789-10
}
```

### Mascarar Dados Sensíveis
```typescript
import { maskEmail, maskPhone, maskCPF } from '@/utils/dataProtection';

const email = maskEmail('user@example.com'); // u***@example.com
const phone = maskPhone('11987654321'); // (11) xxxxx-4321
const cpf = maskCPF('12345678910'); // 123.xxx.xxx-10
```

### Rate Limiting
```typescript
import { useRateLimit } from '@/hooks/useRateLimit';

const rateLimit = useRateLimit('action-name', {
  maxAttempts: 5,
  windowMs: 60000 // 1 minuto
});

if (rateLimit.blocked) {
  toast.error('Muitas tentativas. Aguarde um momento.');
  return;
}

// Executar ação...
```

## 📚 Recursos

- [SECURITY.md](./SECURITY.md) - Documentação completa de segurança
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)

---

**Última atualização:** 2025-10-07  
**Status:** ✅ Implementação core completa, aplicação em andamento
