# 🚀 Checklist de Lançamento

> **Status:** PRÉ-LANÇAMENTO  
> **Última atualização:** Janeiro 2025  
> **Responsável:** Time de Desenvolvimento + Admin

---

## 📋 Como Usar Este Checklist

1. **Revise cada seção** antes do lançamento
2. **Marque os itens** conforme forem concluídos (`[ ]` → `[x]`)
3. **Documente problemas** encontrados na seção de notas
4. **Não lance** até que TODOS os itens críticos estejam concluídos
5. **Mantenha este documento** atualizado durante o processo

**Legenda:**
- 🔴 **CRÍTICO** - Bloqueante para lançamento
- 🟡 **IMPORTANTE** - Altamente recomendado
- 🟢 **DESEJÁVEL** - Nice to have

---

## 🔒 1. SEGURANÇA (CRÍTICO)

### 1.1 Row Level Security (RLS)

- [ ] 🔴 **Todas as tabelas têm RLS habilitado**
  ```sql
  -- Verificar no Supabase Dashboard > Database > Tables
  -- Ou rodar query:
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  ```
  - [ ] `profiles`
  - [ ] `orders`
  - [ ] `order_items`
  - [ ] `addresses`
  - [ ] `cart_items`
  - [ ] `wishlist_items`
  - [ ] `reviews`
  - [ ] `fiscal_notes`
  - [ ] `user_subscriptions`
  - [ ] `coupons`
  - [ ] `security_audit_log`
  - [ ] `user_2fa_settings`

- [ ] 🔴 **Policies testadas para cada role**
  - [ ] Usuário comum (role: `user`)
  - [ ] Admin (role: `admin`)
  - [ ] Usuário não autenticado (anônimo)

- [ ] 🔴 **Nenhuma policy com `USING (true)` em tabelas sensíveis**
  ```sql
  -- Verificar policies muito permissivas
  SELECT schemaname, tablename, policyname, qual
  FROM pg_policies
  WHERE qual = 'true';
  ```

### 1.2 Autenticação

- [ ] 🔴 **Supabase Auth configurado**
  - [ ] Email confirmado habilitado
  - [ ] Rate limiting de login ativo (max 10 tentativas/5min)
  - [ ] Senhas com requisitos mínimos (8+ caracteres, maiúsculas, números)
  
- [ ] 🟡 **2FA (Two-Factor Authentication)**
  - [ ] Edge function `verify-2fa` deployada
  - [ ] Tabela `user_2fa_settings` criada
  - [ ] Testado fluxo completo de setup
  - [ ] Testado login com 2FA
  - [ ] Backup codes funcionando

- [ ] 🔴 **Senha segura**
  - [ ] Validação com Zod schemas
  - [ ] Check de senhas vazadas (pwned passwords API)
  - [ ] Requisitos claros na UI

### 1.3 Rate Limiting

- [ ] 🔴 **Rate limiting ativo em endpoints críticos**
  - [ ] Login: 10 req/5min
  - [ ] Checkout: 5 req/min
  - [ ] API geral: 100 req/min
  - [ ] Geração de NFe: 3 req/5min
  - [ ] Criação de conta: 3 req/hora

- [ ] 🔴 **Supabase Rate Limiting configurado**
  ```
  Dashboard > Settings > API > Rate Limits
  - Anonymous requests: 100/hour
  - Authenticated requests: 200/hour
  ```

### 1.4 Input Validation

- [ ] 🔴 **Validação com Zod em todos os forms**
  - [ ] Login/Registro
  - [ ] Checkout
  - [ ] Perfil do usuário
  - [ ] Criação de cupons (admin)
  - [ ] Emissão de NFe

- [ ] 🔴 **Sanitização de inputs no backend (edge functions)**
  ```typescript
  // Exemplo de validação em edge function
  const schema = z.object({
    email: z.string().email(),
    // ...
  });
  const validated = schema.parse(data);
  ```

### 1.5 Audit Log

- [ ] 🔴 **Security audit log funcionando**
  - [ ] Eventos de login registrados
  - [ ] Falhas de autenticação logadas
  - [ ] Ações administrativas auditadas
  - [ ] Acesso a dados sensíveis registrado

- [ ] 🟡 **Dashboard de segurança acessível**
  - [ ] `/admin/security-metrics` funcionando
  - [ ] `/admin/security-logs` mostrando dados reais
  - [ ] Filtros e exportação CSV operacionais

- [ ] 🟡 **Alertas de segurança configurados**
  - [ ] Email de alerta para múltiplas falhas de login
  - [ ] Notificação de acesso suspeito
  - [ ] Destinatários corretos configurados

### 1.6 HTTPS e Headers de Segurança

- [ ] 🔴 **SSL/TLS ativo**
  - [ ] Certificado válido
  - [ ] HTTPS forçado (redirect de HTTP)
  - [ ] HSTS header configurado

- [ ] 🟡 **Security headers configurados**
  ```
  Content-Security-Policy
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  ```

---

## 💳 2. PAGAMENTOS (CRÍTICO)

### 2.1 Stripe

- [ ] 🔴 **Stripe em modo PRODUÇÃO**
  - [ ] Secret key de produção configurada
  - [ ] Public key de produção no frontend
  - [ ] Ambiente `PRODUCTION` (não `test`)

- [ ] 🔴 **Webhooks configurados**
  - [ ] Endpoint: `https://seu-dominio.com/functions/v1/stripe-webhook`
  - [ ] Eventos necessários selecionados:
    - `checkout.session.completed`
    - `checkout.session.expired`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
  - [ ] Webhook secret configurado nas edge functions

- [ ] 🔴 **Testes de pagamento**
  - [ ] Cartão de crédito aprovado
  - [ ] Cartão de crédito recusado
  - [ ] PIX gerado corretamente
  - [ ] PIX pago (simulação)
  - [ ] Webhook recebido e processado

- [ ] 🟡 **Cupons de desconto**
  - [ ] Validação funcionando
  - [ ] Aplicação de desconto correta
  - [ ] Limite de uso respeitado
  - [ ] Expiração respeitada

- [ ] 🟡 **Reembolsos**
  - [ ] Processo documentado
  - [ ] Testado em ambiente sandbox

### 2.2 Processamento de Pedidos

- [ ] 🔴 **Fluxo completo testado**
  - [ ] Pedido criado com status `pending`
  - [ ] Pagamento confirmado → status `paid`
  - [ ] Estoque baixado automaticamente
  - [ ] NFe gerada automaticamente
  - [ ] Email de confirmação enviado

- [ ] 🔴 **Baixa de estoque**
  - [ ] Material movements registrado
  - [ ] Estoque em ml calculado corretamente
  - [ ] Alertas de estoque baixo funcionando

- [ ] 🟡 **Cancelamento de pedido**
  - [ ] Pedido pode ser cancelado antes do envio
  - [ ] Estoque revertido corretamente
  - [ ] NFe cancelada (se aplicável)
  - [ ] Cliente notificado

---

## 🧾 3. FISCAL (CRÍTICO)

### 3.1 Focus NFe

- [ ] 🔴 **Ambiente de PRODUÇÃO**
  - [ ] Token de produção configurado
  - [ ] `ambiente_nfe` = `producao` na tabela `company_settings`
  - [ ] **ATENÇÃO:** NFe de produção têm valor fiscal real!

- [ ] 🔴 **Certificado A1 válido**
  - [ ] Certificado não expirado
  - [ ] Base64 do certificado correto
  - [ ] Senha do certificado correta
  - [ ] Testado com sucesso em homologação

- [ ] 🔴 **Dados da empresa completos**
  - [ ] CNPJ válido
  - [ ] Razão social
  - [ ] Nome fantasia
  - [ ] Inscrição estadual
  - [ ] Inscrição municipal
  - [ ] Endereço completo (rua, número, CEP, cidade, UF)
  - [ ] Código do município (IBGE)
  - [ ] Regime tributário correto

- [ ] 🔴 **Produtos com NCM cadastrado**
  ```sql
  -- Verificar perfumes sem NCM
  SELECT id, name FROM perfumes WHERE ncm IS NULL OR ncm = '';
  ```
  - [ ] Todos os perfumes têm NCM
  - [ ] NCM correto para perfumes (geralmente: 3303.00.10)
  - [ ] CFOP definido (ex: 5102 para venda dentro do estado)

### 3.2 Emissão de NFe

- [ ] 🔴 **Edge function `generate-nfe` deployada**
  - [ ] Secrets configurados (FOCUS_NFE_TOKEN)
  - [ ] Testada com pedido real
  - [ ] Gera XML corretamente
  - [ ] Calcula impostos (ICMS, PIS, COFINS)

- [ ] 🔴 **Fluxo automático testado**
  - [ ] Pedido pago → NFe gerada em < 30 segundos
  - [ ] Chave de acesso retornada
  - [ ] Protocolo de autorização recebido
  - [ ] PDF gerado
  - [ ] XML armazenado

- [ ] 🔴 **Email com NFe**
  - [ ] PDF anexado
  - [ ] XML anexado (opcional, mas recomendado)
  - [ ] Link para download no email
  - [ ] Template profissional

- [ ] 🟡 **Retry mechanism**
  - [ ] Falhas transitórias retentadas (3x)
  - [ ] Backoff exponencial implementado
  - [ ] Admin notificado após falhas permanentes

### 3.3 Cancelamento de NFe

- [ ] 🔴 **Edge function `cancel-nfe` deployada**
  - [ ] Validação de prazo (< 24h)
  - [ ] Justificativa obrigatória (min 15 caracteres)
  - [ ] Atualiza status no banco

- [ ] 🔴 **Testado com sucesso**
  - [ ] NFe cancelada em homologação
  - [ ] Protocolo de cancelamento recebido
  - [ ] Status atualizado para `cancelled`

---

## 🏗️ 4. INFRAESTRUTURA (CRÍTICO)

### 4.1 Banco de Dados

- [ ] 🔴 **Backups automáticos configurados**
  - [ ] Supabase: Backups diários automáticos (plano Pro+)
  - [ ] Retenção de 7 dias mínimo
  - [ ] Testado processo de restore

- [ ] 🟡 **Índices criados para performance**
  ```sql
  -- Verificar índices existentes
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  ```
  - [ ] `orders(user_id)`
  - [ ] `orders(status)`
  - [ ] `order_items(order_id)`
  - [ ] `fiscal_notes(order_id)`
  - [ ] `security_audit_log(created_at)`

- [ ] 🟡 **Triggers funcionando**
  - [ ] `update_updated_at_column` em todas as tabelas necessárias
  - [ ] Triggers de auditoria
  - [ ] Triggers de estoque

### 4.2 Monitoramento

- [ ] 🟡 **Sentry configurado**
  - [ ] DSN de produção
  - [ ] Source maps enviados
  - [ ] Testado com erro intencional
  - [ ] Alertas para admins configurados

- [ ] 🟡 **Google Analytics 4**
  - [ ] Measurement ID correto
  - [ ] Eventos principais configurados:
    - Pageview
    - Add to cart
    - Begin checkout
    - Purchase
  - [ ] Testado com Google Tag Assistant

- [ ] 🟢 **Uptime monitoring**
  - [ ] Serviço externo (ex: UptimeRobot, Pingdom)
  - [ ] Alertas em caso de downtime
  - [ ] Monitorando endpoints críticos

### 4.3 DNS e Domínio

- [ ] 🔴 **Domínio apontando corretamente**
  - [ ] Registro A ou CNAME configurado
  - [ ] Propagação DNS completa (24-48h)
  - [ ] WWW e non-WWW ambos funcionando
  - [ ] Redirect para HTTPS

- [ ] 🔴 **SSL/TLS ativo**
  - [ ] Certificado válido (Let's Encrypt ou similar)
  - [ ] Sem avisos de segurança no navegador
  - [ ] HTTPS forçado

- [ ] 🟡 **Email profissional**
  - [ ] Email `contato@seudominio.com` funcionando
  - [ ] Email `suporte@seudominio.com` funcionando
  - [ ] Email `nao-responder@seudominio.com` para emails transacionais

### 4.4 Performance

- [ ] 🟡 **Lighthouse score > 90**
  - [ ] Performance: > 90
  - [ ] Accessibility: > 90
  - [ ] Best Practices: > 90
  - [ ] SEO: > 90

- [ ] 🟡 **Imagens otimizadas**
  - [ ] Formato WebP quando possível
  - [ ] Lazy loading implementado
  - [ ] Tamanhos responsivos (srcset)

- [ ] 🟢 **CDN configurado**
  - [ ] Assets estáticos servidos via CDN
  - [ ] Cache headers corretos
  - [ ] Compressão gzip/brotli ativa

---

## 📱 5. FUNCIONALIDADES (IMPORTANTE)

### 5.1 Catálogo

- [ ] 🔴 **Produtos cadastrados**
  - [ ] Mínimo 10 perfumes ativos
  - [ ] Imagens de qualidade (alta resolução)
  - [ ] Descrições completas
  - [ ] Notas olfativas corretas
  - [ ] Preços configurados
  - [ ] Estoque disponível

- [ ] 🟡 **Filtros funcionando**
  - [ ] Por gênero (masculino, feminino, unissex)
  - [ ] Por família olfativa
  - [ ] Por faixa de preço
  - [ ] Por marca

- [ ] 🟡 **Busca funcionando**
  - [ ] Busca por nome
  - [ ] Busca por marca
  - [ ] Resultados relevantes

### 5.2 Carrinho e Checkout

- [ ] 🔴 **Fluxo completo testado**
  - [ ] Adicionar produto ao carrinho
  - [ ] Alterar quantidade
  - [ ] Remover produto
  - [ ] Aplicar cupom
  - [ ] Calcular frete
  - [ ] Selecionar método de pagamento
  - [ ] Finalizar compra

- [ ] 🔴 **Validação de estoque**
  - [ ] Impede checkout se estoque insuficiente
  - [ ] Atualiza quantidade disponível em tempo real

- [ ] 🟡 **Recuperação de carrinho**
  - [ ] Email enviado após 1h de abandono
  - [ ] Link volta para carrinho salvo
  - [ ] Cupom de incentivo incluído

### 5.3 Área do Cliente

- [ ] 🔴 **Meus Pedidos**
  - [ ] Lista todos os pedidos
  - [ ] Detalhes de cada pedido
  - [ ] Status atualizado
  - [ ] Rastreamento (quando enviado)
  - [ ] Download de NFe

- [ ] 🟡 **Wishlist**
  - [ ] Adicionar/remover produtos
  - [ ] Notificação quando produto em promoção
  - [ ] Compartilhar wishlist

- [ ] 🟡 **Perfil**
  - [ ] Editar dados cadastrais
  - [ ] Gerenciar endereços
  - [ ] Alterar senha
  - [ ] Ativar 2FA

### 5.4 Assinaturas (se aplicável)

- [ ] 🔴 **Planos cadastrados**
  - [ ] Basic (1 perfume/mês)
  - [ ] Premium (2 perfumes/mês)
  - [ ] Luxury (3+ perfumes/mês)

- [ ] 🔴 **Cobrança recorrente**
  - [ ] Stripe Billing configurado
  - [ ] Primeira cobrança imediata
  - [ ] Cobranças mensais automáticas
  - [ ] Webhook de renovação

- [ ] 🟡 **Cancelamento**
  - [ ] Cliente pode cancelar a qualquer momento
  - [ ] Efetivo no final do ciclo
  - [ ] Sem penalidades

### 5.5 Reviews

- [ ] 🟡 **Sistema de avaliações**
  - [ ] Cliente pode avaliar após compra
  - [ ] Estrelas (1-5)
  - [ ] Comentário textual
  - [ ] Moderação prévia (opcional)

- [ ] 🟡 **Exibição de reviews**
  - [ ] Na página do produto
  - [ ] Média de estrelas visível
  - [ ] Ordenação (mais recentes, mais úteis)

---

## 🎨 6. UX/UI (IMPORTANTE)

### 6.1 Responsividade

- [ ] 🔴 **Testado em dispositivos reais**
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] Tablet
  - [ ] Desktop (1920px, 1366px)

- [ ] 🔴 **Navegação mobile funcional**
  - [ ] Menu hamburger
  - [ ] Carrinho acessível
  - [ ] Checkout otimizado para mobile

### 6.2 Acessibilidade

- [ ] 🟡 **Navegação por teclado**
  - [ ] Tab order lógica
  - [ ] Focus visível
  - [ ] Atalhos de teclado (opcional)

- [ ] 🟡 **Screen readers**
  - [ ] Labels em todos os inputs
  - [ ] Alt text em imagens
  - [ ] ARIA labels onde necessário

- [ ] 🟡 **Contraste de cores**
  - [ ] WCAG AA mínimo
  - [ ] Texto legível em todos os fundos

### 6.3 Mensagens de Erro

- [ ] 🔴 **Mensagens claras e acionáveis**
  - [ ] "Email já cadastrado" → "Já tem uma conta? Faça login"
  - [ ] "Estoque insuficiente" → Mostra quantidade disponível
  - [ ] "Erro ao processar pagamento" → Opções de contato

- [ ] 🟡 **Toasts/Notificações**
  - [ ] Sucesso em verde
  - [ ] Erro em vermelho
  - [ ] Info em azul
  - [ ] Auto-dismiss após 5s

---

## 📄 7. COMPLIANCE E LEGAL (CRÍTICO)

### 7.1 LGPD (Lei Geral de Proteção de Dados)

- [ ] 🔴 **Política de Privacidade publicada**
  - [ ] URL: `/privacidade`
  - [ ] Linguagem clara e acessível
  - [ ] Atualizada com práticas reais
  - [ ] Link no footer e no registro

- [ ] 🔴 **Termos de Uso publicados**
  - [ ] URL: `/termos-uso`
  - [ ] Cobre uso do site e serviços
  - [ ] Limitações de responsabilidade
  - [ ] Link no footer e no registro

- [ ] 🔴 **Consent banner (cookies)**
  - [ ] Aparece na primeira visita
  - [ ] Opções: Aceitar todos / Rejeitar / Personalizar
  - [ ] Registra consentimento no banco
  - [ ] Permite revogar consentimento

- [ ] 🟡 **Direitos do titular**
  - [ ] Exportar dados pessoais
  - [ ] Deletar conta (com confirmação)
  - [ ] Retificar dados
  - [ ] Portabilidade de dados

- [ ] 🟡 **Audit log de acesso a dados**
  - [ ] Quem acessou dados de quem
  - [ ] Quando
  - [ ] Para qual finalidade
  - [ ] Retenção de logs por 6 meses+

### 7.2 Código de Defesa do Consumidor

- [ ] 🔴 **Política de Troca e Devolução**
  - [ ] URL: `/troca-devolucao`
  - [ ] 7 dias para arrependimento (CDC Art. 49)
  - [ ] Processo claro de solicitação
  - [ ] Prazo de reembolso especificado

- [ ] 🔴 **Informações claras no checkout**
  - [ ] Valor total (produtos + frete)
  - [ ] Prazo de entrega estimado
  - [ ] Dados da empresa (CNPJ, endereço)
  - [ ] Canal de atendimento (SAC)

- [ ] 🟡 **SAC (Serviço de Atendimento ao Consumidor)**
  - [ ] Email: sac@seudominio.com
  - [ ] Telefone (opcional, mas recomendado)
  - [ ] Horário de atendimento divulgado
  - [ ] Resposta em até 24h úteis

### 7.3 Fiscal

- [ ] 🔴 **NFe emitida para todos os pedidos**
  - [ ] Automática após confirmação de pagamento
  - [ ] Enviada por email
  - [ ] Disponível para download na área do cliente

- [ ] 🔴 **Dados fiscais corretos**
  - [ ] CNPJ da empresa
  - [ ] Inscrição estadual
  - [ ] Endereço fiscal
  - [ ] Regime tributário

---

## 🎯 8. MARKETING E SEO (DESEJÁVEL)

### 8.1 SEO On-Page

- [ ] 🟡 **Meta tags configuradas**
  - [ ] Title tag único por página (< 60 caracteres)
  - [ ] Meta description (< 160 caracteres)
  - [ ] Open Graph tags (Facebook/LinkedIn)
  - [ ] Twitter Card tags

- [ ] 🟡 **Sitemap.xml**
  - [ ] Gerado automaticamente
  - [ ] URL: `/sitemap.xml`
  - [ ] Submetido ao Google Search Console

- [ ] 🟡 **Robots.txt**
  - [ ] URL: `/robots.txt`
  - [ ] Permite crawling de páginas públicas
  - [ ] Bloqueia áreas admin

- [ ] 🟢 **Schema.org / Structured Data**
  - [ ] Product schema em páginas de produto
  - [ ] Organization schema
  - [ ] Review schema (se aplicável)

### 8.2 Tracking e Analytics

- [ ] 🟡 **Google Analytics 4 configurado**
  - [ ] Tracking code instalado
  - [ ] Conversões configuradas (compra, signup)
  - [ ] Enhanced ecommerce

- [ ] 🟢 **Facebook Pixel** (opcional)
  - [ ] Pixel instalado
  - [ ] Eventos de conversão configurados

- [ ] 🟢 **Google Tag Manager** (opcional)
  - [ ] Container instalado
  - [ ] Tags organizadas

### 8.3 Email Marketing

- [ ] 🟢 **Captura de emails**
  - [ ] Newsletter signup no footer
  - [ ] Pop-up de boas-vindas (com cupom)
  - [ ] Checkbox no checkout (opt-in)

- [ ] 🟢 **Sequências automáticas**
  - [ ] Email de boas-vindas
  - [ ] Carrinho abandonado
  - [ ] Pós-compra (agradecimento + upsell)
  - [ ] Reengajamento (clientes inativos)

---

## 🧪 9. TESTES (IMPORTANTE)

### 9.1 Testes Manuais

- [ ] 🔴 **Fluxo completo de compra**
  - [ ] Testado por 3+ pessoas
  - [ ] Desktop e mobile
  - [ ] Diferentes navegadores (Chrome, Safari, Firefox)
  - [ ] Diferentes métodos de pagamento

- [ ] 🔴 **Cenários de erro**
  - [ ] Pagamento recusado
  - [ ] Estoque esgotado no meio do checkout
  - [ ] Cupom inválido
  - [ ] Endereço de entrega fora de área de cobertura

### 9.2 Testes de Carga (opcional)

- [ ] 🟢 **Teste de performance**
  - [ ] Simular 100 usuários simultâneos
  - [ ] Tempo de resposta < 2s
  - [ ] Sem erros 5xx

- [ ] 🟢 **Teste de pico**
  - [ ] Simular lançamento (500+ usuários simultâneos)
  - [ ] Sistema não cai
  - [ ] Auto-scaling funcionando (se configurado)

---

## 📞 10. SUPORTE E OPERAÇÕES (IMPORTANTE)

### 10.1 Treinamento da Equipe

- [ ] 🔴 **Admin treinado**
  - [ ] Como processar pedidos
  - [ ] Como emitir/cancelar NFe
  - [ ] Como gerenciar estoque
  - [ ] Como criar cupons
  - [ ] Como usar dashboard de segurança

- [ ] 🔴 **Manual operacional entregue**
  - [ ] `docs/ADMIN_MANUAL.md` revisado
  - [ ] Equipe leu e entendeu
  - [ ] Dúvidas esclarecidas

### 10.2 Canais de Suporte

- [ ] 🔴 **Email de suporte ativo**
  - [ ] `suporte@seudominio.com`
  - [ ] Equipe monitorando
  - [ ] SLA definido (ex: resposta em 24h)

- [ ] 🟡 **Chat ao vivo** (opcional)
  - [ ] Widget instalado
  - [ ] Horário de atendimento definido
  - [ ] Chatbot para FAQs básicas

- [ ] 🟡 **FAQ publicado**
  - [ ] Perguntas mais comuns respondidas
  - [ ] Categorizado por tópico
  - [ ] Busca funcionando

### 10.3 Procedimentos de Emergência

- [ ] 🔴 **Plano de rollback**
  - [ ] Como reverter deploy se necessário
  - [ ] Backups testados
  - [ ] Tempo de recuperação < 1h

- [ ] 🟡 **Contatos de emergência**
  - [ ] Desenvolvedor principal: [telefone]
  - [ ] Sysadmin: [telefone]
  - [ ] Suporte Supabase: https://supabase.com/support
  - [ ] Suporte Stripe: https://support.stripe.com

---

## ✅ 11. GO/NO-GO DECISION

### Critérios Obrigatórios para Lançamento

**Todos os itens 🔴 CRÍTICOS devem estar marcados como concluídos.**

- [ ] **Segurança: 100% dos itens críticos**
- [ ] **Pagamentos: 100% dos itens críticos**
- [ ] **Fiscal: 100% dos itens críticos**
- [ ] **Infraestrutura: 100% dos itens críticos**
- [ ] **Compliance: 100% dos itens críticos**

### Decisão Final

**Data da revisão:** __________________  
**Responsável:** ______________________

**Decisão:**
- [ ] ✅ **GO** - Todos os critérios críticos atendidos. Autorizado para lançamento.
- [ ] ⚠️ **GO COM RESSALVAS** - Lançamento autorizado, mas com itens pendentes (documentar abaixo).
- [ ] ❌ **NO-GO** - Critérios críticos não atendidos. Lançamento adiado.

**Ressalvas/Pendências (se aplicável):**
```
- [Item pendente 1]
- [Item pendente 2]
- [Prazo para resolução]
```

**Assinaturas:**
- Desenvolvedor: __________________
- Admin/Gerente: __________________
- Stakeholder: __________________

---

## 📝 12. PÓS-LANÇAMENTO

### Primeiras 24 horas

- [ ] Monitorar Sentry para erros
- [ ] Verificar Analytics para tráfego
- [ ] Acompanhar primeiros pedidos
- [ ] Testar NFe de produção (primeiro pedido real)
- [ ] Responder feedbacks de early adopters

### Primeira semana

- [ ] Revisar métricas de conversão
- [ ] Ajustar copy baseado em feedback
- [ ] Otimizar performance (se necessário)
- [ ] Criar campanha de marketing

### Primeiro mês

- [ ] Analisar dados de Analytics
- [ ] Identificar bottlenecks no funil
- [ ] Planejar features com base em feedback
- [ ] Revisar políticas (se necessário)

---

## 📌 NOTAS E OBSERVAÇÕES

**Issues encontrados durante o checklist:**
```
- [Registre aqui qualquer problema encontrado]
- [Documente soluções ou workarounds aplicados]
```

**Melhorias sugeridas para futuro:**
```
- [Ideias de features]
- [Otimizações de performance]
- [Melhorias de UX]
```

---

## 🎉 CONCLUSÃO

Parabéns por chegar até aqui! Lançar um e-commerce é um projeto complexo e este checklist garante que nada importante foi esquecido.

**Lembre-se:**
- Lançamento não é o fim, é o começo
- Iteração contínua é essencial
- Feedback dos usuários é ouro
- Mantenha o sistema seguro e atualizado

**Boa sorte com o lançamento! 🚀**

---

**Documento mantido por:** Time de Desenvolvimento  
**Versão:** 1.0  
**Última atualização:** Janeiro 2025
