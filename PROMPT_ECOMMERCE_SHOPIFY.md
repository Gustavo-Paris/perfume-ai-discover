# 🎯 PROMPT COMPLETO: E-COMMERCE PARIS & CO COM LOVABLE + SHOPIFY

## 📌 CONTEXTO DO NEGÓCIO

Crie um e-commerce premium de perfumaria focado em **decants** (amostras de 2ml, 5ml, 10ml) e **miniaturas** (30ml, 50ml, 100ml) de fragrâncias importadas de alta qualidade. O negócio se chama **Paris & Co** e tem como diferencial:

- **Curadoria por IA**: Sistema conversacional que recomenda perfumes baseado em preferências olfativas
- **Clube de Assinatura**: 3 planos mensais com caixas curadas personalizadas
- **Programa de Fidelidade**: Sistema de pontos com 3 níveis (Silver, Gold, Platinum)
- **Garantia "Amou ou Troca"**: 7 dias para devolver se não gostar
- **Frete grátis** acima de R$ 150
- **Selo de originalidade**: Todos os perfumes são autênticos

---

## 🛠️ STACK TECNOLÓGICA OBRIGATÓRIA

### **Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn/ui
- React Router 6
- React Query (TanStack Query)
- Framer Motion (animações)
- React Helmet Async (SEO)

### **Backend & Integrações**
- **Supabase**: Auth, Database, Storage, Edge Functions
- **Shopify**: Catálogo de produtos, inventário, carrinho, checkout, pagamentos, fulfillment, assinaturas
- **Lovable AI Gateway**: Curadoria conversacional de perfumes
- **Resend**: Emails transacionais

### **Design System**
- Cores principais: Roxo `#7C3AED`, Azul `#2563EB`
- Tipografia: Playfair Display (headings), Inter (body)
- Componentes: Shadcn/ui customizados

---

## 🎨 IDENTIDADE VISUAL

### Paleta de Cores
```css
:root {
  --primary: 262 83% 58%; /* Roxo #7C3AED */
  --secondary: 217 91% 60%; /* Azul #2563EB */
  --accent: 280 65% 60%; /* Rosa suave */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}
```

### Tipografia
- **Headings**: Playfair Display (serif elegante)
- **Body**: Inter (sans-serif moderna)

### Tom de Comunicação
- Sofisticado mas acessível
- Educativo sobre perfumaria
- Focado na experiência sensorial

---

## 📦 ESTRUTURA DE PRODUTOS (SHOPIFY)

### Coleções
1. **Decants**: Amostras de 2ml, 5ml, 10ml
2. **Miniaturas**: Frascos de 30ml, 50ml, 100ml
3. **Assinaturas**: 3 planos mensais

### Variantes de Produto
Cada perfume tem variantes de tamanho:
- 2ml (R$ 15-25)
- 5ml (R$ 30-50)
- 10ml (R$ 50-90)
- 30ml (R$ 120-180)
- 50ml (R$ 180-280)
- 100ml (R$ 300-500)

### Metafields Customizados (Shopify)
Para cada produto, adicionar:
```json
{
  "top_notes": ["Bergamota", "Limão", "Pimenta Rosa"],
  "heart_notes": ["Jasmim", "Rosa", "Íris"],
  "base_notes": ["Âmbar", "Baunilha", "Almíscar"],
  "olfactory_family": "Floral Oriental",
  "gender": "Unissex",
  "intensity": "Moderada",
  "longevity": "6-8 horas",
  "sillage": "Moderado",
  "season": "Primavera/Verão",
  "occasions": ["Dia a dia", "Trabalho", "Encontros"]
}
```

### Tags (para filtros)
- Gênero: `masculino`, `feminino`, `unissex`
- Família: `floral`, `amadeirado`, `citrico`, `oriental`, `chipre`, `fougere`
- Marca: `dior`, `chanel`, `creed`, `tom-ford`, etc.
- Intensidade: `leve`, `moderado`, `intenso`

---

## 🧠 FUNCIONALIDADES PRINCIPAIS

### 1️⃣ CURADORIA POR IA (`/curadoria`)

**Objetivo**: Ajudar usuários a descobrir perfumes através de conversa guiada.

**Fluxo**:
1. Chatbot faz 5-7 perguntas:
   - "Qual gênero de perfume você procura?" (masculino/feminino/unissex)
   - "Quais famílias olfativas você gosta?" (chips selecionáveis)
   - "Existe alguma nota que você AMA?" (autocomplete)
   - "Existe alguma nota que você DETESTA?" (autocomplete)
   - "Qual intensidade você prefere?" (leve/moderada/intensa)
   - "Para qual ocasião?" (dia a dia/trabalho/noite/esporte)
   - "Qual seu orçamento para decants?" (R$ 30-50 / R$ 50-100 / R$ 100+)

2. **Edge Function**: `conversational-recommend`
   - Recebe respostas do usuário
   - Consulta catálogo Shopify via Storefront API
   - Usa **Lovable AI** (Gemini 2.0 Flash) para analisar preferências
   - Retorna 5-10 perfumes ranqueados com score de match
   - Salva sessão em `recommendation_sessions` (Supabase)

3. Exibe resultados em grid com:
   - Foto do perfume
   - Nome + marca
   - Score de match (ex: "95% compatível")
   - Notas principais
   - Preço dos decants (2ml, 5ml, 10ml)
   - Botão "Adicionar ao Carrinho"
   - Botão "Saber Mais"

**Tabela Supabase**:
```sql
CREATE TABLE recommendation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  answers_json JSONB NOT NULL,
  recommended_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2️⃣ CATÁLOGO INTELIGENTE (`/catalogo`)

**Layout**: Grid responsivo (1→2→4 colunas)

**Filtros Dinâmicos** (sidebar esquerda):
- Gênero (radio)
- Família Olfativa (checkboxes múltiplos)
- Marca (checkboxes com busca)
- Tamanho (checkboxes)
- Faixa de Preço (slider R$ 0-500)
- Intensidade (checkboxes)
- Nota Específica (autocomplete)

**Ordenação**:
- Relevância (padrão)
- Menor Preço
- Maior Preço
- Mais Vendidos
- Lançamentos

**Busca**:
- Header com busca global
- Autocomplete usando Shopify Predictive Search API
- Sugestões: produtos + marcas + notas

**Card de Produto**:
- Imagem com lazy loading
- Badge: "Bestseller" / "Novo" / "10% OFF"
- Nome + marca
- Família olfativa (pequeno texto)
- Preço a partir de (menor variante)
- Estrelas (média de reviews)
- Ícone de coração (wishlist)
- Hover: botão "Ver Detalhes"

**Performance**:
- Infinite scroll (carregar 20 produtos por vez)
- Skeleton loaders enquanto carrega
- Cache de 5 minutos (React Query)

---

### 3️⃣ PÁGINA DE PRODUTO (`/produto/:handle`)

**Layout**:
- Esquerda (50%): Galeria de imagens (zoom on hover)
- Direita (50%): Informações

**Seções**:
1. **Header**
   - Nome do perfume (H1)
   - Marca (link clicável)
   - Avaliação (estrelas + quantidade)
   - Badge de família olfativa

2. **Seletor de Variante**
   - Botões de tamanho (2ml, 5ml, 10ml...)
   - Preço atualiza dinamicamente
   - Mostrar "X unidades restantes" se estoque < 10

3. **Ações**
   - Quantidade (input numérico)
   - Botão "Adicionar ao Carrinho" (destaque)
   - Botão "Adicionar à Wishlist" (outline)
   - Botão "Comparar" (opcional)

4. **Descrição**
   - História do perfume (2-3 parágrafos)
   - Para quem é recomendado

5. **Pirâmide Olfativa** (visual bonito)
   - **Notas de Saída**: Lista com ícones
   - **Notas de Coração**: Lista com ícones
   - **Notas de Base**: Lista com ícones

6. **Características**
   - Intensidade: [barra visual]
   - Longevidade: 6-8 horas
   - Sillage: Moderado
   - Melhor estação: Primavera/Verão
   - Ocasiões: chips clicáveis

7. **Reviews de Clientes**
   - Filtrar por estrelas
   - Mostrar fotos enviadas pelos clientes
   - Ordenar por: Mais recentes / Mais úteis
   - Botão "Escrever Review" (só se comprou)

8. **Produtos Relacionados** (carrossel)
   - "Quem comprou este, também comprou..."
   - 6-8 produtos similares (mesma família ou marca)

**SEO**:
- Meta title: `{Nome do Perfume} - {Marca} | Paris & Co`
- Meta description: Primeiras 2 linhas da descrição + "Compre decants autênticos com frete grátis acima de R$ 150"
- Schema.org Product markup (JSON-LD)

---

### 4️⃣ CARRINHO E CHECKOUT (SHOPIFY NATIVO)

**Carrinho** (`/carrinho`):
- Lista de itens (imagem, nome, tamanho, quantidade, preço)
- Botão "-" e "+" para alterar quantidade
- Botão "Remover"
- Subtotal
- **Cupom de desconto** (input + botão "Aplicar")
- **Resgatar Pontos de Fidelidade**: 
  - "Você tem 350 pontos (R$ 35 de desconto)"
  - Checkbox "Usar pontos nesta compra"
- Frete: Calculado no checkout
- Total
- Botão "Finalizar Compra" → redireciona para Shopify Checkout

**Shopify Checkout**:
- Gerencia endereço, método de envio, pagamento
- Aceita: Cartão de Crédito, PIX, Boleto
- Integrado com Melhor Envio (frete via Correios/transportadoras)

**Pós-Compra**:
- Redirect para `/pedido-confirmado/:order_id`
- Mostrar resumo do pedido
- Adicionar pontos de fidelidade via webhook
- Enviar email de confirmação (Resend)

---

### 5️⃣ SISTEMA DE ASSINATURAS (`/assinaturas`)

**Conceito**: Clube mensal de perfumes curados com base nas preferências do assinante.

#### **Planos de Assinatura** (Shopify Subscriptions)

| Plano       | Preço/Mês | Decants | Trial | Benefícios                           |
|-------------|-----------|---------|-------|--------------------------------------|
| **Essencial** | R$ 79     | 3x 5ml  | 7 dias | Curadoria IA + 5% de desconto loja   |
| **Premium**   | R$ 139    | 5x 5ml  | 7 dias | Curadoria IA + 10% desconto + brinde |
| **Luxo**      | R$ 249    | 3x 10ml | 7 dias | Curadoria IA + 15% desconto + frete grátis + embalagem premium |

#### **Página `/assinaturas`**
- Hero explicando o conceito
- Cards dos 3 planos com CTA "Assinar Agora"
- Seção "Como Funciona":
  1. Escolha seu plano e configure suas preferências
  2. Todo mês, curamos 3-5 perfumes baseados no seu gosto
  3. Receba em casa sem pagar frete adicional
  4. Avalie os perfumes e compre miniaturas com desconto

- FAQ:
  - "Posso pausar minha assinatura?"
  - "Posso pular um mês?"
  - "Como cancelo?"
  - "Recebo perfumes repetidos?"

#### **Tabelas Supabase**
```sql
-- Planos (seed com 3 registros)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Essencial", "Premium", "Luxo"
  price DECIMAL NOT NULL,
  decants_quantity INT NOT NULL,
  decants_size TEXT NOT NULL, -- "5ml" ou "10ml"
  trial_days INT DEFAULT 7,
  discount_percent INT,
  perks JSONB -- ["Frete grátis", "Embalagem premium"]
);

-- Assinaturas dos usuários
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  subscription_plan_id UUID REFERENCES subscription_plans,
  shopify_subscription_id TEXT UNIQUE, -- ID da subscription no Shopify
  status TEXT DEFAULT 'active', -- active, paused, cancelled
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preferências de curadoria
CREATE TABLE subscription_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id UUID REFERENCES user_subscriptions UNIQUE,
  preferred_families TEXT[], -- ["floral", "amadeirado"]
  excluded_notes TEXT[], -- ["patchouli", "alcool"]
  preferred_gender TEXT, -- "unissex"
  intensity TEXT, -- "moderado"
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de envios mensais
CREATE TABLE subscription_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id UUID REFERENCES user_subscriptions,
  month_year TEXT NOT NULL, -- "2025-01"
  curated_perfumes JSONB, -- [{"shopify_product_id": "123", "variant_id": "456", "name": "Dior Sauvage 5ml"}]
  shopify_order_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, shipped, delivered
  tracking_code TEXT,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Fluxo de Assinatura**

1. **Usuário assina**:
   - Clica em "Assinar Premium"
   - Redireciona para Shopify Checkout com produto de assinatura
   - Shopify processa pagamento recorrente
   - Webhook `subscription_created` dispara

2. **Webhook Handler** (Edge Function `process-subscription-payment`):
   - Recebe evento do Shopify
   - Cria registro em `user_subscriptions`
   - Envia email de boas-vindas (Resend)
   - Redireciona para `/minha-assinatura/configurar-preferencias`

3. **Configurar Preferências** (`/minha-assinatura/preferencias`):
   - Formulário com 5 perguntas (similar à curadoria)
   - Salva em `subscription_preferences`

4. **Curadoria Mensal Automática** (Edge Function `curate-monthly-box`):
   - Agendada via **Supabase Cron** (todo dia 1º do mês, 00:00)
   - Para cada `user_subscription` com `status = 'active'`:
     - Buscar preferências em `subscription_preferences`
     - Consultar histórico de envios (`subscription_shipments`)
     - Usar **Lovable AI** para selecionar N perfumes (baseado no plano)
     - Regras:
       - Não repetir perfumes dos últimos 6 meses
       - Respeitar famílias preferidas
       - Excluir notas indesejadas
       - Variar intensidade
     - Criar pedido no Shopify (draft order → auto-fulfill)
     - Salvar em `subscription_shipments`
     - Enviar email com prévia da caixa (Resend)

5. **Página `/minha-assinatura`**:
   - **Status da Assinatura**: Ativo / Pausado / Trial
   - **Próxima Cobrança**: 01/02/2025 (R$ 139)
   - **Preferências Configuradas**: Editar
   - **Histórico de Envios**:
     - Lista de meses anteriores
     - "Janeiro 2025 - 5 perfumes enviados" (clicável para ver quais)
   - **Ações**:
     - Botão "Pausar Assinatura" (mantém plano mas pula mês)
     - Botão "Pular Próximo Mês"
     - Botão "Cancelar Assinatura" (modal de confirmação)
     - Botão "Alterar Plano"

---

### 6️⃣ PROGRAMA DE FIDELIDADE (`/fidelidade`)

**Conceito**: Quanto mais o cliente compra, mais pontos acumula e sobe de nível.

#### **Sistema de Tiers**

| Tier      | Gasto Total   | Pontos por R$ 1 | Benefícios                                    |
|-----------|---------------|-----------------|-----------------------------------------------|
| **Silver**   | R$ 0 - R$ 499    | 1x (1 pt)       | Aniversariante ganha 50 pontos                |
| **Gold**     | R$ 500 - R$ 1.999 | 1.5x (1.5 pt)   | Frete grátis em pedidos acima de R$ 100       |
| **Platinum** | R$ 2.000+        | 2x (2 pt)       | Frete grátis sempre + amostras exclusivas     |

**Resgate de Pontos**:
- 100 pontos = R$ 10 de desconto
- 500 pontos = 1 decant 5ml grátis
- 1000 pontos = 1 miniatura 30ml grátis

#### **Tabelas Supabase**
```sql
-- Adicionar colunas em profiles
ALTER TABLE profiles ADD COLUMN loyalty_points INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN loyalty_tier TEXT DEFAULT 'silver';
ALTER TABLE profiles ADD COLUMN total_spent DECIMAL DEFAULT 0;

-- Histórico de transações de pontos
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  points INT NOT NULL, -- positivo = ganhou, negativo = resgatou
  type TEXT NOT NULL, -- 'earned_purchase', 'redeemed_discount', 'birthday_bonus'
  order_id TEXT, -- Shopify order ID (se aplicável)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Edge Function: `calculate-loyalty-tier`**
Triggered por webhook do Shopify após pedido pago:

```typescript
// Pseudocódigo
async function calculateLoyaltyTier(orderId: string) {
  const order = await shopify.getOrder(orderId);
  const userId = await getUserByEmail(order.customer.email);
  
  // Atualizar total gasto
  await supabase
    .from('profiles')
    .update({ 
      total_spent: raw('total_spent + ?', order.total_price),
    })
    .eq('id', userId);
  
  // Calcular tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_spent, loyalty_tier')
    .eq('id', userId)
    .single();
  
  let newTier = 'silver';
  let multiplier = 1;
  
  if (profile.total_spent >= 2000) {
    newTier = 'platinum';
    multiplier = 2;
  } else if (profile.total_spent >= 500) {
    newTier = 'gold';
    multiplier = 1.5;
  }
  
  // Adicionar pontos
  const points = Math.floor(order.total_price * multiplier);
  
  await supabase.from('loyalty_transactions').insert({
    user_id: userId,
    points,
    type: 'earned_purchase',
    order_id: orderId,
    description: `Compra no valor de R$ ${order.total_price}`
  });
  
  await supabase
    .from('profiles')
    .update({ 
      loyalty_points: raw('loyalty_points + ?', points),
      loyalty_tier: newTier
    })
    .eq('id', userId);
  
  // Se subiu de tier, enviar email
  if (newTier !== profile.loyalty_tier) {
    await sendEmail({
      to: order.customer.email,
      template: 'tier_upgraded',
      data: { newTier, benefits: getTierBenefits(newTier) }
    });
  }
}
```

#### **Página `/fidelidade`**
- **Hero**: "Quanto mais você compra, mais você ganha"
- **Seu Status Atual** (card destaque):
  - Badge do tier (Silver/Gold/Platinum)
  - Saldo de pontos: **350 pontos** (R$ 35 em descontos)
  - Barra de progresso para próximo tier:
    - "Faltam R$ 150 para alcançar Gold!"
  - Botão "Resgatar Pontos"

- **Tabela Comparativa de Tiers** (bonita, com ícones)

- **Como Ganhar Pontos**:
  - Compras (1pt, 1.5pt ou 2pt por R$ 1)
  - Aniversário (+50 pontos)
  - Primeira compra (+20 pontos)
  - Avaliar produtos (+5 pontos por review)

- **Como Resgatar**:
  - No carrinho, checkbox "Usar X pontos para R$ Y desconto"
  - Catálogo de recompensas (decants/miniaturas grátis)

- **Histórico de Pontos** (tabela):
  - Data | Descrição | Pontos | Saldo

---

### 7️⃣ REVIEWS COM FOTOS (`/produto/:handle` + Admin)

#### **Tabela Supabase**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  shopify_product_id TEXT NOT NULL,
  shopify_order_id TEXT, -- Para validar se comprou
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_urls TEXT[], -- URLs do Supabase Storage
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(shopify_product_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);
```

#### **Formulário de Review** (`/pedidos/:id/avaliar`)
- Só aparece para quem comprou o produto
- Rating (1-5 estrelas)
- Comentário (textarea, máx 500 caracteres)
- Upload de até 3 fotos (Supabase Storage)
- Botão "Enviar Review"
- Após enviar: "Obrigado! Sua avaliação será publicada após aprovação."

#### **Moderação de Reviews** (`/admin/reviews`)
- Lista de reviews pendentes (`is_approved = false`)
- Mostrar: usuário, produto, rating, comentário, fotos
- Botões: **Aprovar** / **Reprovar** (exclui)
- Ao aprovar: `is_approved = true` + enviar email para o usuário

#### **Exibição na Página do Produto**
- Ordenar por: Mais recentes / Mais úteis
- Filtrar por: 5 estrelas, 4 estrelas, etc.
- Layout de card: foto do usuário, nome, rating, comentário, data
- Se tem fotos: galeria clicável (modal fullscreen)

---

### 8️⃣ WISHLIST (`/wishlist`)

#### **Tabela Supabase**
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  shopify_product_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shopify_product_id)
);
```

#### **Funcionalidade**
- Ícone de coração nos cards de produto
- Clique no coração → adiciona/remove da wishlist
- Toast: "Adicionado à wishlist" / "Removido da wishlist"
- Badge com contador no header: ícone de coração + número

#### **Página `/wishlist`**
- Grid de produtos salvos (mesmo layout do catálogo)
- Botão "Adicionar ao Carrinho" em cada card
- Botão "Remover da Wishlist"
- Se lista vazia: "Sua wishlist está vazia" + CTA para catálogo

#### **Notificação de Promoção** (bonus feature)
- Se produto na wishlist entra em promoção → enviar email
- Edge function agendada (diária) checa promoções ativas

---

### 9️⃣ COMPARAÇÃO DE PRODUTOS (`/comparacao`)

#### **Funcionalidade**
- Usuário pode adicionar até 3 produtos para comparar
- URL: `/comparacao?ids=prod1,prod2,prod3`
- Layout: tabela responsiva (3 colunas)

**Comparar**:
- Foto
- Nome + Marca
- Família Olfativa
- Notas (Saída, Coração, Base)
- Intensidade
- Longevidade
- Sillage
- Preços (por tamanho)
- Avaliação média
- Botão "Adicionar ao Carrinho"

**Acesso**:
- Botão "Comparar" nas páginas de produto
- Ícone no header (acumula selecionados)

---

### 🔟 BUSCA AVANÇADA (Header + `/buscar`)

#### **Busca Global** (header)
- Input com ícone de lupa
- Autocomplete usando **Shopify Predictive Search API**
- Sugestões mostram:
  - Produtos (foto + nome + preço)
  - Marcas (com logo)
  - Notas olfativas (ex: "Baunilha" → mostra produtos)

#### **Página de Resultados** (`/buscar?q=dior`)
- Mesma estrutura do catálogo (filtros + grid)
- Highlight da palavra-chave nos resultados
- Se 0 resultados: sugestões baseadas em busca similar

---

## 👤 PAINEL DO CLIENTE

### 1️⃣ Dashboard (`/minha-conta`)
- **Header**: Foto de perfil + nome + tier badge
- **Cartões**:
  - **Pontos de Fidelidade**: Saldo + barra de progresso
  - **Assinatura Ativa**: Status + próxima cobrança (se houver)
  - **Pedidos Recentes**: Últimos 3 pedidos (status + total)
- **Menu Lateral**:
  - Meus Pedidos
  - Minha Assinatura
  - Programa de Fidelidade
  - Wishlist
  - Endereços
  - Configurações
  - Sair

### 2️⃣ Meus Pedidos (`/pedidos`)
- Lista de pedidos (via Shopify Orders API)
- Card por pedido:
  - Número do pedido
  - Data
  - Status (Pago, Em Separação, Enviado, Entregue)
  - Total
  - Botão "Ver Detalhes"
  - Se enviado: Botão "Rastrear" (integração Melhor Envio)

- **Detalhes do Pedido** (`/pedidos/:id`):
  - Itens comprados (foto + nome + quantidade + preço)
  - Subtotal, frete, descontos, total
  - Endereço de entrega
  - Método de pagamento
  - Status de envio + tracking code
  - Botão "Deixar Review" (para produtos ainda sem review)

### 3️⃣ Gestão de Endereços (`/enderecos`)
- CRUD de endereços
- Formulário:
  - CEP (autocomplete via ViaCEP)
  - Rua, número, complemento
  - Bairro, cidade, estado
  - Checkbox "Endereço padrão"
- Validar CEP antes de salvar

**Tabela Supabase**:
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  label TEXT, -- "Casa", "Trabalho"
  zip_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📧 EMAILS TRANSACIONAIS (RESEND)

### Edge Function: `send-email`
Recebe:
- `to`: email do destinatário
- `template`: nome do template
- `data`: objeto com variáveis do template

### Templates a Criar (React Email ou Handlebars)

1. **welcome** (Boas-vindas)
   - Assunto: "Bem-vindo à Paris & Co! 🎁"
   - Conteúdo: Apresentação da marca + cupom de 10% na primeira compra

2. **order_confirmation** (Confirmação de pedido)
   - Assunto: "Pedido #12345 confirmado!"
   - Conteúdo: Resumo do pedido + prazo de entrega

3. **shipment_sent** (Pedido enviado)
   - Assunto: "Seu pedido foi enviado! 📦"
   - Conteúdo: Código de rastreamento + link para rastrear

4. **subscription_created** (Assinatura confirmada)
   - Assunto: "Bem-vindo ao Clube Paris & Co! 💜"
   - Conteúdo: Detalhes do plano + próxima cobrança

5. **subscription_reminder** (Lembrete 3 dias antes da cobrança)
   - Assunto: "Sua caixa mensal será cobrada em 3 dias"
   - Conteúdo: Valor + botão para pausar/cancelar

6. **monthly_box_preview** (Prévia da caixa mensal)
   - Assunto: "Sua caixa de janeiro está a caminho! ✨"
   - Conteúdo: Fotos e descrição dos 3-5 perfumes curados

7. **tier_upgraded** (Subiu de tier)
   - Assunto: "Parabéns! Você é agora Gold! 🏆"
   - Conteúdo: Novos benefícios do tier

8. **wishlist_on_sale** (Item da wishlist em promoção)
   - Assunto: "🔥 Produto da sua wishlist está com desconto!"
   - Conteúdo: Nome do produto + desconto + CTA

9. **review_approved** (Review aprovada)
   - Assunto: "Sua avaliação foi publicada!"
   - Conteúdo: Link para ver a review

10. **password_reset** (Redefinir senha)
    - Assunto: "Redefinir sua senha"
    - Conteúdo: Link mágico com token

---

## 🎨 PÁGINAS INSTITUCIONAIS

### 1. **Home** (`/`)
- **Hero Section**:
  - Vídeo de fundo ou imagem elegante
  - Headline: "Descubra o perfume perfeito para você"
  - Subheadline: "Curadoria personalizada por IA + Decants autênticos"
  - CTA: "Fazer Curadoria Agora" (link para `/curadoria`)

- **Produtos em Destaque**:
  - Carrossel com 10 bestsellers
  - Lazy loading de imagens

- **Como Funciona** (3 passos):
  1. Responda 7 perguntas
  2. Receba recomendações personalizadas
  3. Compre decants e descubra seu favorito

- **Diferenciais** (grid de 4 cards):
  - 🌟 100% Originais
  - 📦 Frete Grátis acima de R$ 150
  - 🔄 Garantia "Amou ou Troca"
  - 🎁 Programa de Fidelidade

- **Depoimentos** (carrossel de 6 reviews reais)

- **Newsletter** (footer):
  - "Receba novidades e promoções exclusivas"
  - Input email + botão "Assinar"

### 2. **Sobre Nós** (`/sobre`)
- História da Paris & Co
- Missão: democratizar o acesso a perfumes premium
- Valores: autenticidade, curadoria, experiência
- Fotos da equipe (opcional)

### 3. **FAQ** (`/faq`)
- Accordion com 20 perguntas:
  - Sobre produtos (autenticidade, validade, armazenamento)
  - Sobre envio (prazo, frete, rastreamento)
  - Sobre devolução (como funciona "Amou ou Troca")
  - Sobre assinatura (trial, cancelamento, pausa)
  - Sobre fidelidade (como ganhar pontos, como resgatar)

### 4. **Trocas e Devoluções** (`/trocas`)
- Política "Amou ou Troca": 7 dias para devolver
- Como solicitar devolução
- Prazo de reembolso (7-14 dias úteis)
- Produtos não elegíveis (decants abertos sem defeito)

### 5. **Termos de Uso** (`/termos`)
- Gerado via advogado ou template LGPD

### 6. **Política de Privacidade** (`/privacidade`)
- Conformidade LGPD
- Dados coletados (email, endereço, histórico de compras)
- Uso de cookies
- Direitos do usuário (acessar, deletar dados)

### 7. **Contato** (`/contato`)
- Formulário: nome, email, assunto, mensagem
- Submeter via Edge Function → Resend envia para suporte@parisandco.com.br
- Informações:
  - Email: contato@parisandco.com.br
  - WhatsApp: (11) 91234-5678
  - Instagram: @parisandco

---

## 🛡️ ADMIN & MODERAÇÃO

### **Proteção de Rotas**
```sql
-- Enum de roles
CREATE TYPE app_role AS ENUM ('admin', 'customer');

-- Tabela de roles
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  role app_role DEFAULT 'customer'
);

-- RLS: apenas admins acessam rotas /admin/*
CREATE POLICY "Admins can access admin tables"
  ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função helper
CREATE FUNCTION has_role(user_id UUID, check_role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND role = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### **Painéis Admin**

#### 1. `/admin/reviews` (Moderação de Reviews)
- Tabela de reviews pendentes
- Colunas: Usuário, Produto, Rating, Comentário, Fotos, Data
- Ações: Aprovar (✓) / Reprovar (✗)
- Filtros: Pendentes / Aprovadas / Todas

#### 2. `/admin/assinaturas` (Gestão de Assinaturas)
- Lista de todas assinaturas
- Filtros: Ativo / Pausado / Cancelado / Trial
- Ver preferências de cada assinante
- Preview da próxima caixa curada
- Botão "Processar Curadoria Manualmente" (trigger edge function)

#### 3. `/admin/cupons` (Gestão de Cupons)
- CRUD de cupons
- Campos: Código, Tipo (percentual/fixo), Valor, Validade, Uso Máximo
- Sincronizar com Shopify Discount Codes

#### 4. `/admin/dashboard` (Métricas)
- KPIs:
  - Visitas únicas (hoje/semana/mês)
  - Taxa de conversão
  - AOV (Average Order Value)
  - Assinantes ativos
  - Churn rate
  - Reviews pendentes
- Gráficos (Recharts):
  - Vendas diárias (últimos 30 dias)
  - Top 10 produtos
  - Distribuição por tier de fidelidade

---

## ⚡ OTIMIZAÇÕES & PERFORMANCE

### **Frontend**
1. **Code Splitting**:
   - React.lazy() para rotas pesadas (Admin, Curadoria)
   - Suspense com skeleton loaders

2. **Lazy Loading de Imagens**:
   - Usar Shopify CDN com parâmetros de resize
   - Atributo `loading="lazy"` em todas as imagens
   - Placeholder blur enquanto carrega

3. **Prefetch**:
   - Prefetch de produtos populares (React Query)
   - Prefetch da página de produto ao hover em card

4. **Cache**:
   - React Query com `staleTime: 5 * 60 * 1000` (5 minutos)
   - Cache de recomendações IA por sessão

5. **Infinite Scroll**:
   - Catálogo carrega 20 produtos por vez
   - Hook `useInfiniteScroll` com Intersection Observer

6. **Debounce**:
   - Busca no header com debounce de 300ms

### **Backend (Edge Functions)**
1. **Rate Limiting**:
   - Supabase Edge Functions com limite por IP
   - 10 requisições/minuto para `conversational-recommend`

2. **Caching de Catálogo**:
   - Cache de produtos Shopify em Supabase (atualizar a cada 1h)

### **SEO**
1. **Meta Tags Dinâmicas** (React Helmet Async):
   - Title, description, OG tags por página
   - Canonical URLs

2. **Schema.org Markup**:
   - Product schema em páginas de produto
   - Organization schema no footer

3. **Sitemap.xml**:
   - Gerar via Shopify (automático)

4. **Robots.txt**:
   - Permitir crawling de todas as páginas públicas

---

## 📊 ANALYTICS & MONITORAMENTO

### **Google Analytics 4**
- Instalar gtag.js no `index.html`
- Eventos customizados:
  - `view_item` (produto visualizado)
  - `add_to_cart` (adicionado ao carrinho)
  - `begin_checkout` (iniciou checkout)
  - `purchase` (compra finalizada)
  - `curated_recommendation` (usou curadoria IA)

### **Shopify Analytics**
- Dashboard nativo do Shopify para:
  - Vendas diárias/mensais
  - Top produtos
  - Taxa de conversão do checkout

### **Supabase Logs**
- Monitorar Edge Functions (erros, latência)
- Alertas de erro via email (Resend)

---

## 🚀 DEPLOY & LANÇAMENTO

### **Deploy**
1. Publicar via Lovable (botão "Publish")
2. Conectar domínio `parisandco.com.br`:
   - A record apontando para Lovable
   - CNAME `www` para domínio principal
3. Forçar HTTPS (Lovable faz automático)

### **Configurar Webhooks Shopify → Supabase**
No Shopify Admin → Settings → Notifications → Webhooks:
- `orders/create` → `https://[project-id].supabase.co/functions/v1/calculate-loyalty-tier`
- `orders/paid` → `https://[project-id].supabase.co/functions/v1/send-email` (template: order_confirmation)
- `fulfillments/create` → `https://[project-id].supabase.co/functions/v1/send-email` (template: shipment_sent)
- `subscription_contracts/create` → `https://[project-id].supabase.co/functions/v1/process-subscription-payment`

### **Configurar Cron Jobs (Supabase)**
```sql
-- Curadoria mensal (dia 1º, 00:00)
SELECT cron.schedule(
  'curate-monthly-subscriptions',
  '0 0 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-id].supabase.co/functions/v1/curate-monthly-box',
    headers := jsonb_build_object('Authorization', 'Bearer [anon-key]')
  );
  $$
);

-- Lembrete de assinatura (3 dias antes do dia 1º)
SELECT cron.schedule(
  'subscription-reminder',
  '0 10 28 * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-id].supabase.co/functions/v1/send-subscription-reminder',
    headers := jsonb_build_object('Authorization', 'Bearer [anon-key]')
  );
  $$
);
```

### **Seed de Produtos**
1. No Shopify Admin, importar CSV com 50+ perfumes:
   - Colunas: Handle, Title, Body, Vendor, Type, Tags, Variants (preço por tamanho)
2. Adicionar metafields manualmente ou via Shopify API
3. Upload de imagens de alta qualidade (mínimo 1200x1200px)

### **Seed de Planos de Assinatura (Supabase)**
```sql
INSERT INTO subscription_plans (name, price, decants_quantity, decants_size, discount_percent, perks) VALUES
('Essencial', 79, 3, '5ml', 5, '["Curadoria IA", "5% desconto na loja"]'),
('Premium', 139, 5, '5ml', 10, '["Curadoria IA", "10% desconto", "Brinde mensal"]'),
('Luxo', 249, 3, '10ml', 15, '["Curadoria IA", "15% desconto", "Frete grátis", "Embalagem premium"]');
```

---

## ✅ CHECKLIST PRÉ-LANÇAMENTO

**Shopify**:
- [ ] 50+ produtos cadastrados com variantes
- [ ] Metafields preenchidos (notas, família, etc.)
- [ ] Imagens de alta qualidade (todas 1200x1200px)
- [ ] Discount codes criados (cupom de lançamento: `INAUGURA25`)
- [ ] Assinaturas configuradas (3 planos)
- [ ] Melhor Envio integrado para frete
- [ ] Métodos de pagamento ativos (cartão, PIX, boleto)

**Supabase**:
- [ ] Tabelas criadas (profiles, reviews, wishlist, subscriptions, etc.)
- [ ] RLS habilitado em todas as tabelas
- [ ] Edge Functions deployadas e testadas
- [ ] Webhooks Shopify configurados
- [ ] Cron jobs agendados (curadoria mensal)
- [ ] Seed de planos de assinatura

**Frontend**:
- [ ] Todas as páginas funcionando (15+ rotas)
- [ ] Design responsivo (mobile + desktop)
- [ ] Meta tags SEO em todas as páginas
- [ ] Performance >90 no Lighthouse
- [ ] Lazy loading de imagens
- [ ] Infinite scroll no catálogo

**Emails**:
- [ ] Resend configurado com domínio verificado
- [ ] 10 templates criados (welcome, order_confirmation, etc.)
- [ ] Testar envio de cada template

**Integrações**:
- [ ] Lovable AI funcionando (curadoria)
- [ ] Google Analytics 4 instalado
- [ ] Supabase Auth com OAuth Google
- [ ] Shopify Storefront API conectado

**Segurança**:
- [ ] HTTPS forçado
- [ ] RLS testado (nenhum usuário acessa dados de outro)
- [ ] Rate limiting em edge functions
- [ ] CORS configurado corretamente

**Conteúdo**:
- [ ] Páginas institucionais (sobre, FAQ, termos, privacidade)
- [ ] Política de trocas "Amou ou Troca"
- [ ] Footer com links e selos de segurança
- [ ] 15 FAQs escritas

**Testes**:
- [ ] Fluxo completo: Cadastro → Curadoria → Compra → Checkout
- [ ] Assinatura: Trial → Cobrança → Curadoria → Cancelamento
- [ ] Fidelidade: Pontos acumulados + Resgate
- [ ] Reviews: Enviar → Moderar → Publicar
- [ ] Wishlist: Adicionar → Remover → Notificação

**Marketing**:
- [ ] Cupom de lançamento ativo (`INAUGURA25` = 15% off)
- [ ] Email para lista de espera (se houver)
- [ ] Post de lançamento em redes sociais
- [ ] Banner no site: "Inauguração - 15% OFF na primeira compra"

---

## 🎯 RESULTADO FINAL ESPERADO

Um e-commerce completo, elegante e funcional com:

✅ **Curadoria por IA** (diferencial competitivo único)  
✅ **Sistema de assinaturas** com trial e curadoria mensal automática  
✅ **Programa de fidelidade** com 3 tiers e gamificação  
✅ **Integração nativa Shopify** (estoque, pagamento, logística sem dor de cabeça)  
✅ **Reviews com fotos** e moderação  
✅ **Wishlist** inteligente com notificações  
✅ **Comparação de produtos**  
✅ **10 emails transacionais** automatizados  
✅ **Design premium** e responsivo  
✅ **Performance otimizada** (Lighthouse >90)  
✅ **SEO completo** (meta tags, sitemap, schema.org)  
✅ **Painel admin** para moderar e gerenciar  
✅ **Analytics** (GA4 + Shopify)  

**Tempo estimado de desenvolvimento**: 18-20 dias de trabalho focado  
**Complexidade**: Média-Alta (devido a IA + assinaturas)  
**Escalabilidade**: Alta (Shopify aguenta milhões de pedidos, Supabase escala horizontal)

---

## 🚀 PRÓXIMOS PASSOS

1. **Copie este prompt completo**
2. **Crie um novo projeto no Lovable**
3. **Cole o prompt e peça**: "Implemente FASE 1: Configuração Base"
4. **Vá implementando fase por fase** (teste cada uma antes de avançar)
5. **Ao finalizar FASE 13**: Celebre o lançamento! 🎉

**Boa sorte com a Paris & Co!** 💜✨