# 🏗️ Arquitetura Técnica do Sistema

> **Versão:** 1.0  
> **Stack:** React + TypeScript + Supabase + Stripe + Focus NFe  
> **Última atualização:** Janeiro 2025

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [Fluxo de Emissão de NFe](#fluxo-de-emissão-de-nfe)
6. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
7. [Edge Functions](#edge-functions)
8. [Sistema de Segurança](#sistema-de-segurança)
9. [Integrações Externas](#integrações-externas)

---

## 🎯 Visão Geral

O sistema é uma plataforma de e-commerce especializada em perfumaria fina, com foco em **decantados** (amostras) e **assinaturas mensais**. A arquitetura é serverless, utilizando Supabase como backend completo (banco de dados PostgreSQL, autenticação, storage e edge functions).

### Características Principais

- ✅ **SPA (Single Page Application)** com React + Vite
- ✅ **Serverless** com Supabase Edge Functions (Deno)
- ✅ **Real-time** via Supabase subscriptions
- ✅ **Type-safe** com TypeScript end-to-end
- ✅ **Responsive** com Tailwind CSS
- ✅ **Secure** com RLS (Row Level Security) e rate limiting
- ✅ **Compliance** com LGPD e regulamentações fiscais brasileiras

---

## 🛠️ Stack Tecnológico

### Frontend
```
React 18.3.1
TypeScript 5.x
Vite 5.x
Tailwind CSS 3.x
React Router 6.x
TanStack Query 5.x (react-query)
Zod (validação de schemas)
React Hook Form
Framer Motion (animações)
```

### Backend (Supabase)
```
PostgreSQL 15.x
PostgREST (API automática)
Supabase Auth (JWT)
Supabase Storage
Deno (Edge Functions runtime)
```

### Integrações
```
Stripe (pagamentos)
Focus NFe (notas fiscais)
Melhor Envio (logística)
Resend (emails transacionais)
Sentry (error tracking)
Google Analytics 4
```

### DevOps
```
Git + GitHub
Lovable (deployment)
Supabase Cloud
Netlify Functions (backup)
```

---

## 🔐 Arquitetura de Autenticação

### Fluxo de Login Básico

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Supabase Auth
    participant Database
    participant RLS

    User->>Frontend: Submit email/password
    Frontend->>Supabase Auth: signInWithPassword()
    Supabase Auth->>Database: Validate credentials
    
    alt Credentials valid
        Database-->>Supabase Auth: User data
        Supabase Auth-->>Frontend: JWT Token + Session
        Frontend->>RLS: Set auth.uid() context
        Frontend->>User: Redirect to dashboard
    else Credentials invalid
        Supabase Auth-->>Frontend: Error
        Frontend->>Database: Log failed attempt
        Frontend->>User: Show error message
    end
```

### Fluxo de Login com 2FA

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Supabase Auth
    participant Database
    participant Edge Function

    User->>Frontend: Submit email/password
    Frontend->>Supabase Auth: signInWithPassword()
    Supabase Auth-->>Frontend: Success (step 1)
    
    Frontend->>Database: Check user_2fa_settings
    
    alt 2FA Enabled
        Database-->>Frontend: 2FA secret found
        Frontend->>Supabase Auth: signOut() (temporary)
        Frontend->>User: Show 2FA input screen
        User->>Frontend: Enter TOTP code
        Frontend->>Edge Function: verify-2fa
        Edge Function->>Edge Function: Validate TOTP
        
        alt TOTP valid
            Edge Function-->>Frontend: Success
            Frontend->>Supabase Auth: signInWithPassword() (again)
            Supabase Auth-->>Frontend: JWT Token
            Frontend->>Database: Log 2FA success
            Frontend->>User: Redirect to dashboard
        else TOTP invalid
            Edge Function-->>Frontend: Error
            Frontend->>Database: Log 2FA failure
            Frontend->>User: Show error
        end
    else 2FA Disabled
        Frontend->>User: Redirect to dashboard
    end
```

### Sistema de Roles

```mermaid
erDiagram
    auth_users ||--o{ user_roles : has
    user_roles ||--|| app_role : is
    
    auth_users {
        uuid id PK
        string email
        timestamp created_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
    }
    
    app_role {
        enum values
    }
```

**Enum de Roles:**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

**Função de Verificação (Security Definer):**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Uso em RLS Policies:**
```sql
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

---

## 💳 Fluxo de Pagamento

### Pagamento com Cartão de Crédito (Stripe)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Edge Function
    participant Stripe
    participant Database
    participant Email Service

    User->>Frontend: Click "Finalizar Compra"
    Frontend->>Edge Function: create-stripe-checkout
    Edge Function->>Stripe: Create Checkout Session
    Stripe-->>Edge Function: Session URL
    Edge Function->>Database: Create order (status: pending)
    Edge Function-->>Frontend: Redirect URL
    Frontend->>User: Redirect to Stripe
    
    User->>Stripe: Enter card details
    Stripe->>Stripe: Process payment
    
    alt Payment Success
        Stripe->>Edge Function: Webhook (checkout.session.completed)
        Edge Function->>Database: Update order (status: paid)
        Edge Function->>Edge Function: Trigger generate-nfe
        Edge Function->>Database: Decrease stock
        Edge Function->>Email Service: Send confirmation email
        Edge Function-->>Stripe: 200 OK
        Stripe->>User: Redirect to success page
    else Payment Failed
        Stripe->>Edge Function: Webhook (checkout.session.expired)
        Edge Function->>Database: Update order (status: failed)
        Edge Function-->>Stripe: 200 OK
        Stripe->>User: Redirect to cancel page
    end
```

### Pagamento com PIX

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Edge Function
    participant Stripe
    participant Database
    participant Admin

    User->>Frontend: Select PIX payment
    Frontend->>Edge Function: create-stripe-checkout (PIX mode)
    Edge Function->>Stripe: Create Payment Intent (PIX)
    Stripe-->>Edge Function: PIX QR Code + Key
    Edge Function->>Database: Create order (status: pending)
    Edge Function-->>Frontend: PIX data
    Frontend->>User: Display QR Code
    
    User->>User: Open banking app
    User->>Stripe: Complete PIX payment
    
    Stripe->>Edge Function: Webhook (payment_intent.succeeded)
    Edge Function->>Database: Update order (status: processing)
    Edge Function->>Admin: Notify admin for approval
    
    Admin->>Frontend: Review payment proof
    Admin->>Edge Function: Approve order
    Edge Function->>Database: Update order (status: paid)
    Edge Function->>Edge Function: Trigger generate-nfe
    Edge Function->>Email Service: Send confirmation
```

### Estados do Pedido

```mermaid
stateDiagram-v2
    [*] --> pending: Order created
    pending --> processing: Payment initiated
    processing --> paid: Payment confirmed
    processing --> failed: Payment failed
    paid --> shipped: Package shipped
    shipped --> delivered: Package delivered
    
    pending --> cancelled: User/admin cancels
    processing --> cancelled: Payment timeout
    paid --> cancelled: Admin cancels (with refund)
    
    failed --> [*]
    cancelled --> [*]
    delivered --> [*]
```

---

## 🧾 Fluxo de Emissão de NFe

### Processo Completo

```mermaid
sequenceDiagram
    participant Order Service
    participant generate-nfe Function
    participant Database
    participant Focus NFe API
    participant SEFAZ
    participant Email Service
    participant Customer

    Order Service->>generate-nfe Function: Order paid event
    generate-nfe Function->>Database: Fetch order details
    generate-nfe Function->>Database: Fetch company settings
    generate-nfe Function->>Database: Fetch customer address
    
    generate-nfe Function->>generate-nfe Function: Build NFe XML
    generate-nfe Function->>generate-nfe Function: Calculate taxes
    
    generate-nfe Function->>Focus NFe API: POST /nfe
    Focus NFe API->>Focus NFe API: Validate XML
    Focus NFe API->>SEFAZ: Submit for authorization
    
    alt Authorization Success
        SEFAZ-->>Focus NFe API: Authorization protocol
        Focus NFe API-->>generate-nfe Function: NFe data + access key
        generate-nfe Function->>Database: Insert fiscal_notes (status: authorized)
        generate-nfe Function->>Database: Insert fiscal_note_items
        generate-nfe Function->>Focus NFe API: GET /nfe/{ref}/pdf
        Focus NFe API-->>generate-nfe Function: PDF file
        generate-nfe Function->>Email Service: Send email with PDF/XML
        Email Service->>Customer: Delivery email
    else Authorization Failed
        SEFAZ-->>Focus NFe API: Rejection message
        Focus NFe API-->>generate-nfe Function: Error details
        generate-nfe Function->>Database: Insert fiscal_notes (status: error)
        generate-nfe Function->>Database: Log error in audit
        generate-nfe Function->>Email Service: Alert admin
    end
```

### Cancelamento de NFe

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant cancel-nfe Function
    participant Focus NFe API
    participant SEFAZ
    participant Database

    Admin->>Frontend: Click "Cancelar NFe"
    Frontend->>cancel-nfe Function: POST with justification
    cancel-nfe Function->>Database: Fetch fiscal note
    cancel-nfe Function->>cancel-nfe Function: Validate (< 24h)
    
    cancel-nfe Function->>Focus NFe API: POST /nfe/{ref}/cancelamento
    Focus NFe API->>SEFAZ: Submit cancellation
    
    alt Cancellation Accepted
        SEFAZ-->>Focus NFe API: Cancellation protocol
        Focus NFe API-->>cancel-nfe Function: Success
        cancel-nfe Function->>Database: Update fiscal_notes (status: cancelled)
        cancel-nfe Function->>Database: Log cancellation event
        cancel-nfe Function-->>Frontend: Success message
        Frontend->>Admin: Show confirmation
    else Cancellation Rejected
        SEFAZ-->>Focus NFe API: Rejection (e.g., expired)
        Focus NFe API-->>cancel-nfe Function: Error
        cancel-nfe Function-->>Frontend: Error message
        Frontend->>Admin: Show error + guidance
    end
```

### Retry Mechanism

```mermaid
flowchart TD
    A[NFe Generation Failed] --> B{Retry Count < 3?}
    B -->|Yes| C[Wait exponential backoff]
    C --> D[Retry generation]
    D --> E{Success?}
    E -->|Yes| F[Mark as authorized]
    E -->|No| B
    B -->|No| G[Mark as permanently failed]
    G --> H[Notify admin for manual intervention]
```

**Backoff Strategy:**
- Attempt 1: Immediate
- Attempt 2: 30 seconds
- Attempt 3: 2 minutes
- After 3 failures: Manual intervention required

---

## 🗄️ Estrutura do Banco de Dados

### Diagrama ER Principal

```mermaid
erDiagram
    auth_users ||--o{ profiles : has
    auth_users ||--o{ user_roles : has
    auth_users ||--o{ orders : places
    auth_users ||--o{ wishlist_items : has
    auth_users ||--o{ user_subscriptions : subscribes
    
    orders ||--|{ order_items : contains
    orders ||--|| addresses : ships_to
    orders ||--o| fiscal_notes : has
    
    fiscal_notes ||--|{ fiscal_note_items : contains
    
    perfumes ||--o{ order_items : in
    perfumes ||--o{ inventory_lots : has
    perfumes ||--o{ wishlist_items : in
    perfumes ||--o{ reviews : receives
    
    subscription_plans ||--o{ user_subscriptions : has
    user_subscriptions ||--o{ subscription_shipments : generates
    
    coupons ||--o{ coupon_redemptions : redeemed_in
```

### Tabelas de Segurança

```mermaid
erDiagram
    security_audit_log {
        uuid id PK
        uuid user_id FK
        text event_type
        text event_description
        text risk_level
        inet ip_address
        jsonb metadata
        timestamp created_at
    }
    
    login_attempts {
        uuid id PK
        text email
        inet ip_address
        text attempt_type
        text user_agent
        timestamp created_at
    }
    
    user_2fa_settings {
        uuid id PK
        uuid user_id FK
        text secret
        boolean enabled
        text[] backup_codes
        timestamp created_at
    }
    
    access_logs {
        uuid id PK
        uuid user_id FK
        text route
        inet ip_address
        text user_agent
        timestamp created_at
    }
```

### Tabelas de Negócio

```mermaid
erDiagram
    orders {
        uuid id PK
        uuid user_id FK
        uuid address_id FK
        text order_number
        text status
        numeric total
        numeric shipping_cost
        text payment_method
        text payment_status
        timestamp created_at
    }
    
    order_items {
        uuid id PK
        uuid order_id FK
        uuid perfume_id FK
        integer quantity
        integer size_ml
        numeric unit_price
        numeric total_price
    }
    
    perfumes {
        uuid id PK
        text name
        text brand
        text[] notes_top
        text[] notes_heart
        text[] notes_base
        text gender
        integer stock_ml
        text image_url
        boolean active
    }
    
    inventory_lots {
        uuid id PK
        uuid perfume_id FK
        text lot_code
        integer qty_ml
        numeric cost_per_ml
        date expiry_date
        timestamp created_at
    }
```

### Tabelas Fiscais

```mermaid
erDiagram
    fiscal_notes {
        uuid id PK
        uuid order_id FK
        integer numero
        integer serie
        text chave_acesso
        text status
        text protocolo_autorizacao
        numeric valor_total
        numeric valor_produtos
        numeric valor_icms
        text xml_content
        text pdf_url
        text focus_nfe_ref
        timestamp data_emissao
        timestamp data_autorizacao
    }
    
    fiscal_note_items {
        uuid id PK
        uuid fiscal_note_id FK
        uuid order_item_id FK
        integer numero_item
        text codigo_produto
        text descricao
        numeric quantidade
        numeric valor_unitario
        numeric valor_total
        text ncm
        text cfop
    }
    
    company_settings {
        uuid id PK
        text cnpj
        text razao_social
        text nome_fantasia
        text inscricao_estadual
        text regime_tributario
        text ambiente_nfe
        text focus_nfe_token
        text certificado_a1_base64
    }
```

### Índices Importantes

```sql
-- Performance em queries comuns
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_fiscal_notes_order_id ON fiscal_notes(order_id);
CREATE INDEX idx_security_audit_risk_level ON security_audit_log(risk_level);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at DESC);

-- Full-text search em perfumes
CREATE INDEX idx_perfumes_search ON perfumes USING gin(to_tsvector('portuguese', name || ' ' || brand));
```

---

## ⚡ Edge Functions

### Lista Completa

| Função | Descrição | Auth | Rate Limit |
|--------|-----------|------|------------|
| `create-stripe-checkout` | Cria sessão de pagamento Stripe | ✅ | 10/min |
| `stripe-webhook` | Processa eventos Stripe | ❌ | - |
| `generate-nfe` | Emite nota fiscal via Focus NFe | ❌ | 5/min |
| `cancel-nfe` | Cancela NFe emitida | ✅ Admin | 3/min |
| `send-email` | Envia emails transacionais | ❌ | 20/min |
| `conversational-recommend` | Recomendação de perfumes via IA | ✅ | 15/min |
| `process-payment` | Processa pagamento PIX manual | ✅ Admin | 10/min |
| `validate-coupon` | Valida cupom de desconto | ✅ | 30/min |
| `shipping-quote` | Cotação de frete Melhor Envio | ✅ | 20/min |
| `confirm-order` | Confirma pedido e baixa estoque | ❌ | - |
| `verify-2fa` | Verifica código TOTP 2FA | ✅ | 5/min |
| `moderate-review` | Moderação de review com IA | ❌ | 10/min |
| `cart-recovery` | Sistema de recuperação de carrinho | ❌ | - |
| `process-monthly-subscriptions` | Processa assinaturas mensais | ❌ Cron | - |

### Estrutura de uma Edge Function

```typescript
// supabase/functions/example/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Business logic here
    const { data } = await req.json();
    
    // Return response
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Secrets Management

**Secrets necessários:**
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Admin access

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Focus NFe
FOCUS_NFE_TOKEN=xxx

# Melhor Envio
MELHOR_ENVIO_TOKEN=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# OpenAI (para IA de recomendação)
OPENAI_API_KEY=sk-xxx

# Sentry (error tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Como adicionar secrets:**
```bash
# Via Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx

# Via Dashboard
Supabase Dashboard > Project Settings > Edge Functions > Secrets
```

---

## 🔒 Sistema de Segurança

### Row Level Security (RLS)

**Conceito:** Cada query ao PostgreSQL é filtrada automaticamente baseada no usuário autenticado (`auth.uid()`).

**Exemplo de Policy:**
```sql
-- Usuários só podem ver seus próprios pedidos
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todos os pedidos
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

### Rate Limiting

**Implementação:** Supabase + Custom middleware

**Limites padrão:**
```typescript
const RATE_LIMITS = {
  'checkout': { requests: 5, window: 60 }, // 5 req/min
  'login': { requests: 10, window: 300 }, // 10 req/5min
  'api': { requests: 100, window: 60 }, // 100 req/min
  'heavy': { requests: 3, window: 300 }, // 3 req/5min (NFe, etc.)
};
```

**Tabela de tracking:**
```sql
CREATE TABLE rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP ou user_id
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp DEFAULT now(),
  blocked boolean DEFAULT false
);
```

### CSRF Protection

**Implementação:** Token em sessão + validação

```typescript
// Hook: useCSRFToken
export const useCSRFToken = () => {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!storedToken) {
      const newToken = generateRandomToken();
      sessionStorage.setItem('csrf_token', newToken);
      setToken(newToken);
    } else {
      setToken(storedToken);
    }
  }, []);

  return token;
};

// Validação no backend
const validateCSRF = (reqToken: string, sessionToken: string) => {
  if (reqToken !== sessionToken) {
    throw new Error('CSRF token invalid');
  }
};
```

### Input Validation (Zod)

**Schemas centralizados:**
```typescript
// utils/validationSchemas.ts
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    perfume_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    size_ml: z.number().int().positive(),
  })),
  address_id: z.string().uuid(),
  payment_method: z.enum(['credit_card', 'pix']),
});
```

**Uso:**
```typescript
const handleSubmit = async (data: unknown) => {
  const validated = signInSchema.parse(data); // Throws se inválido
  await login(validated);
};
```

### Audit Log

**Eventos registrados:**
- Login/logout
- Alteração de senha
- Criação/edição/deleção de registros sensíveis
- Acesso a dados de outros usuários (admin)
- Exportação de dados
- Alterações em configurações de pagamento
- Emissão/cancelamento de NFe

**Estrutura:**
```typescript
interface AuditLog {
  id: string;
  user_id: string;
  event_type: string;
  event_description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
}
```

---

## 🔗 Integrações Externas

### Stripe

**Propósito:** Processamento de pagamentos (cartão e PIX)

**Webhooks implementados:**
```typescript
const STRIPE_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
];
```

**Fluxo de Webhook:**
1. Stripe envia evento para `/functions/v1/stripe-webhook`
2. Função valida assinatura (security)
3. Processa evento baseado no tipo
4. Atualiza ordem/pagamento no banco
5. Dispara edge functions subsequentes (NFe, email)
6. Retorna 200 OK para Stripe

### Focus NFe

**Propósito:** Emissão e cancelamento de notas fiscais eletrônicas

**Endpoints usados:**
```
POST /v2/nfes - Criar NFe
GET /v2/nfes/{ref} - Consultar NFe
POST /v2/nfes/{ref}/cancelamento - Cancelar NFe
GET /v2/nfes/{ref}/download - Baixar PDF
```

**Autenticação:** Bearer token no header

**Ambientes:**
- Homologação: testes sem valor fiscal
- Produção: NFe válidas legalmente

### Melhor Envio

**Propósito:** Cotação e compra de fretes

**Endpoints usados:**
```
POST /api/v2/me/shipment/calculate - Cotação
POST /api/v2/me/cart - Adicionar ao carrinho
POST /api/v2/me/shipment/checkout - Comprar frete
POST /api/v2/me/shipment/print - Imprimir etiqueta
```

**Fluxo:**
1. Cliente finaliza checkout
2. Sistema calcula frete via Melhor Envio
3. Exibe opções (PAC, SEDEX, etc.)
4. Cliente escolhe
5. Após pagamento, sistema compra frete automaticamente
6. Etiqueta gerada e disponibilizada para admin

### Resend

**Propósito:** Envio de emails transacionais

**Templates implementados:**
- Confirmação de pedido
- NFe emitida (com anexos PDF/XML)
- Pedido enviado (com código de rastreamento)
- Recuperação de carrinho abandonado
- Confirmação de assinatura
- Alerta de segurança (para admins)

**Estrutura:**
```typescript
interface EmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}
```

---

## 📊 Monitoramento e Observabilidade

### Sentry (Error Tracking)

**Eventos capturados:**
- Erros JavaScript no frontend
- Exceções não tratadas em edge functions
- Falhas de integração externa
- Problemas de performance

**Configuração:**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% de transações rastreadas
});
```

### Google Analytics 4

**Eventos rastreados:**
- Pageviews
- Adições ao carrinho
- Início de checkout
- Compras concluídas
- Buscas
- Interações com recomendações de IA

**Implementação:**
```typescript
import { initGA4 } from '@/utils/analytics';

// Inicializa GA4
initGA4('G-XXXXXXXXXX');

// Rastreamento de evento
gtag('event', 'purchase', {
  transaction_id: order.id,
  value: order.total,
  currency: 'BRL',
  items: order.items,
});
```

### Performance Monitoring

**Métricas coletadas:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)
- Tempo de resposta de edge functions

**Ferramenta:** `@/utils/performanceMonitor.ts`

---

## 🚀 Deploy e CI/CD

### Ambiente de Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Rodar edge functions localmente
supabase functions serve

# Rodar testes
npm run test
```

### Ambiente de Produção

**Deploy Frontend:**
- Plataforma: Lovable/Netlify
- Branch: `main`
- Build command: `npm run build`
- Deploy automático em push

**Deploy Edge Functions:**
```bash
# Via Supabase CLI
supabase functions deploy

# Individual
supabase functions deploy generate-nfe
```

**Configuração de Secrets:**
```bash
supabase secrets set --env-file .env.production
```

### Checklist de Deploy

- [ ] Testes passando
- [ ] Build sem erros
- [ ] Secrets configurados
- [ ] RLS policies ativas
- [ ] Rate limiting configurado
- [ ] Webhooks apontando para produção
- [ ] DNS configurado
- [ ] SSL ativo
- [ ] Monitoramento ativo
- [ ] Backups configurados

---

## 📚 Recursos Adicionais

### Documentação Externa

- [Supabase Docs](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Focus NFe Docs](https://focusnfe.com.br/doc/)
- [Melhor Envio API](https://docs.melhorenvio.com.br/)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)

### Padrões de Código

**Estrutura de pastas:**
```
src/
├── components/        # Componentes React
│   ├── ui/           # Componentes UI base (shadcn)
│   ├── admin/        # Componentes admin
│   └── ...
├── hooks/            # Custom hooks
├── pages/            # Páginas (rotas)
├── utils/            # Utilitários
├── types/            # TypeScript types
├── contexts/         # React contexts
└── integrations/     # Integrações (Supabase client)
```

**Convenções:**
- Componentes: PascalCase
- Hooks: camelCase com prefixo `use`
- Constantes: UPPER_SNAKE_CASE
- Variáveis: camelCase
- Arquivos: kebab-case

---

## 🎉 Conclusão

Esta arquitetura foi desenhada para ser:
- ✅ **Escalável:** Serverless permite scaling automático
- ✅ **Segura:** RLS + 2FA + rate limiting + audit log
- ✅ **Maintainable:** Type-safe, bem documentada, padrões claros
- ✅ **Compliant:** LGPD + regulamentações fiscais brasileiras
- ✅ **Observável:** Logs, métricas, error tracking

Para dúvidas técnicas ou sugestões de arquitetura, contate o time de desenvolvimento.

---

**Versão:** 1.0 | **Última atualização:** Janeiro 2025
