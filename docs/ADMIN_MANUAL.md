# 📖 Manual Operacional - Administração

> **Versão:** 1.0  
> **Última atualização:** Janeiro 2025  
> **Público-alvo:** Administradores do sistema

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Dashboard de Segurança](#dashboard-de-segurança)
3. [Sistema de Alertas](#sistema-de-alertas)
4. [Gerenciamento de Pedidos](#gerenciamento-de-pedidos)
5. [Notas Fiscais (NFe)](#notas-fiscais-nfe)
6. [Cupons e Promoções](#cupons-e-promoções)
7. [Gerenciamento de Estoque](#gerenciamento-de-estoque)
8. [Assinaturas](#assinaturas)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Introdução

Este manual contém todas as informações necessárias para operar e gerenciar o sistema de e-commerce de perfumaria. Aqui você encontrará procedimentos detalhados, explicações de funcionalidades e soluções para problemas comuns.

### Acesso ao Painel Administrativo

- **URL:** `/admin`
- **Requisitos:** Conta com role `admin` no sistema
- **Autenticação:** Email/senha + 2FA (recomendado)

---

## 🛡️ Dashboard de Segurança

### 1.1 Acessando o Dashboard

Navegue até `/admin/security-metrics` para visualizar as métricas de segurança em tempo real.

### 1.2 Métricas Principais

#### **Total de Logins**
- Exibe quantidade de logins realizados no período
- Útil para identificar picos de atividade
- Verde: atividade normal
- Amarelo: aumento de 50%+
- Vermelho: aumento suspeito (100%+)

#### **Tentativas Falhadas**
- Mostra tentativas de login sem sucesso
- **ATENÇÃO:** Mais de 10 falhas consecutivas do mesmo IP pode indicar ataque de força bruta
- Ação recomendada: Verificar logs detalhados e considerar bloqueio temporário

#### **Acessos Bloqueados**
- Rate limiting em ação
- Requisições que excederam limites por minuto
- Normal: < 5 por hora
- Suspeito: > 20 por hora

#### **Eventos Críticos**
- Ações de alto risco detectadas
- Exemplos: múltiplas falhas de login, acesso a dados sensíveis, alterações em configurações críticas
- **Sempre investigar eventos críticos imediatamente**

### 1.3 Interpretação de Níveis de Risco

| Nível | Cor | Significado | Ação Requerida |
|-------|-----|-------------|----------------|
| **Low** | Verde | Atividade normal | Nenhuma |
| **Medium** | Amarelo | Atividade suspeita | Monitorar |
| **High** | Laranja | Possível ameaça | Investigar |
| **Critical** | Vermelho | Ameaça confirmada | Ação imediata |

### 1.4 Logs de Auditoria

Acesse `/admin/security-logs` para visualizar todos os eventos de segurança.

**Eventos importantes a monitorar:**
- `login_failed` - Falha de autenticação
- `login_success` - Login bem-sucedido
- `password_change` - Alteração de senha
- `admin_action` - Ação administrativa realizada
- `data_export` - Exportação de dados sensíveis
- `rate_limit_exceeded` - Limite de requisições excedido
- `suspicious_activity` - Comportamento anômalo detectado

**Filtros disponíveis:**
- Por nível de risco
- Por tipo de evento
- Por período (data)
- Por usuário
- Por IP

**Exportação:**
- Use o botão "Exportar CSV" para gerar relatórios
- Útil para auditorias e compliance

---

## 🔔 Sistema de Alertas

### 2.1 Configuração de Alertas

Acesse `/admin/security-alerts` para configurar alertas automáticos.

### 2.2 Tipos de Alertas

1. **Múltiplas Tentativas de Login Falhadas**
   - Dispara após 5 tentativas falhadas
   - Email enviado automaticamente para admins
   - Contém: IP, timestamp, email tentado

2. **Acesso Suspeito Detectado**
   - Padrões anômalos de navegação
   - Acesso de IPs desconhecidos a áreas sensíveis
   - Velocidade anormal de requisições

3. **Alteração em Configurações Críticas**
   - Mudanças em company_settings
   - Alteração de preços em lote
   - Modificação de cupons ativos

4. **Erro em Integração Externa**
   - Falha na Focus NFe
   - Falha no Stripe
   - Falha no Melhor Envio

### 2.3 Destinatários de Alertas

Para adicionar um destinatário:
1. Acesse `/admin/security-alerts`
2. Clique em "Adicionar Destinatário"
3. Insira email e nome
4. Selecione tipos de alerta
5. Salvar

**Recomendação:** Configure pelo menos 2 destinatários (redundância).

### 2.4 Como Responder a Alertas

#### Alerta: Múltiplas Falhas de Login
1. Acessar `/admin/security-logs`
2. Filtrar por `login_failed` e IP suspeito
3. Verificar se é um usuário legítimo que esqueceu a senha
4. Se for ataque: considerar bloqueio de IP (via Supabase Dashboard > Authentication > Rate Limits)

#### Alerta: Acesso Suspeito
1. Identificar o usuário no log
2. Verificar histórico recente de atividades
3. Se comprometido: desativar conta temporariamente
4. Contatar usuário por canal seguro

#### Alerta: Erro em Integração
1. Verificar status da integração externa
2. Revisar logs de edge functions
3. Verificar secrets/tokens
4. Processar manualmente se necessário

---

## 📦 Gerenciamento de Pedidos

### 3.1 Dashboard de Pedidos

Acesse `/admin/orders` para visualizar todos os pedidos.

### 3.2 Estados do Pedido

```
pending → processing → paid → shipped → delivered
                ↓
            cancelled / failed
```

| Estado | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| `pending` | Aguardando pagamento | Cancelar |
| `processing` | Pagamento em análise | Aprovar manualmente / Cancelar |
| `paid` | Pago e confirmado | Gerar NFe / Cancelar |
| `shipped` | Enviado | Atualizar rastreamento |
| `delivered` | Entregue | Nenhuma |
| `cancelled` | Cancelado | Reembolsar |
| `failed` | Falhou | Reprocessar / Cancelar |

### 3.3 Processamento Manual de Pagamento PIX

**Quando usar:** PIX aprovado mas não processado automaticamente.

**Passo a passo:**
1. Acesse `/admin/order-automation`
2. Localize o pedido pelo número ou ID
3. Verifique status atual: deve estar `pending`
4. Confirme recebimento do PIX (verificar extrato bancário)
5. Clique em "Aprovar Manualmente"
6. Sistema irá:
   - Atualizar status para `paid`
   - Emitir NFe automaticamente
   - Enviar email de confirmação
   - Baixar estoque

**⚠️ IMPORTANTE:** Só aprovar após confirmar recebimento real do pagamento!

### 3.4 Como Cancelar um Pedido

1. Acesse `/admin/orders`
2. Localize o pedido
3. Clique em "Detalhes"
4. Clique em "Cancelar Pedido"
5. Confirme a ação
6. Sistema irá:
   - Atualizar status para `cancelled`
   - Reverter estoque (se já baixado)
   - Cancelar NFe (se já emitida)
   - Registrar no audit log

**Pedidos que podem ser cancelados:**
- `pending` - sempre
- `processing` - sempre
- `paid` - só se não enviado ainda

### 3.5 Reembolsos

**Processo manual:**
1. Cancelar o pedido (procedimento acima)
2. Acessar Stripe Dashboard
3. Localizar a transação
4. Clicar em "Refund"
5. Inserir valor (total ou parcial)
6. Confirmar reembolso
7. Registrar em notes do pedido no sistema

**Prazos:**
- Cartão de crédito: 5-10 dias úteis
- PIX: não é possível reembolso automático (fazer transferência manual)

---

## 🧾 Notas Fiscais (NFe)

### 4.1 Configuração Inicial

Antes de emitir NFe, certifique-se:
1. Certificado A1 válido carregado em `/admin/company-config`
2. Dados da empresa completos
3. Focus NFe token configurado
4. Ambiente correto (homologação ou produção)

### 4.2 Emissão Automática

NFe é emitida automaticamente quando:
- Pedido muda de `processing` para `paid`
- Edge function `generate-nfe` é disparada
- Integração com Focus NFe é bem-sucedida

**Timeline esperada:**
- 0s: Pedido confirmado
- ~5s: NFe gerada e autorizada
- ~10s: Email enviado com PDF/XML

### 4.3 Emissão Manual

**Quando usar:**
- Falha na emissão automática
- Pedido criado manualmente
- Reemissão necessária

**Passo a passo:**
1. Acesse `/admin/fiscal-notes`
2. Clique em "Emitir NFe Manualmente"
3. Selecione o pedido
4. Revisar dados:
   - Destinatário (cliente)
   - Produtos e valores
   - Impostos calculados
5. Confirmar emissão
6. Aguardar processamento (5-15s)
7. Verificar status: deve mudar para `authorized`

### 4.4 Cancelamento de NFe

**Prazo:** Até 24h após emissão (regulamentação SEFAZ).

**Motivos comuns:**
- Pedido cancelado pelo cliente
- Erro nos dados do cliente
- Valor incorreto

**Passo a passo:**
1. Acesse `/admin/fiscal-notes`
2. Localize a NFe (status deve ser `authorized`)
3. Clique em "Cancelar NFe"
4. Insira justificativa (obrigatório, mínimo 15 caracteres)
5. Confirmar
6. Sistema irá:
   - Enviar requisição de cancelamento à Focus NFe
   - Atualizar status para `cancelled`
   - Registrar evento no audit log

**⚠️ ATENÇÃO:** Cancelamento é irreversível!

### 4.5 Troubleshooting NFe

#### Erro: "Certificado A1 inválido"
**Solução:**
1. Verificar validade do certificado (geralmente 1 ano)
2. Renovar certificado se expirado
3. Converter certificado .pfx para base64
4. Atualizar em `/admin/company-config`

#### Erro: "Rejeição 999 - Dados do destinatário incorretos"
**Solução:**
1. Verificar CPF/CNPJ do cliente
2. Corrigir endereço (CEP, UF, município)
3. Reprocessar NFe

#### Erro: "Timeout na Focus NFe"
**Solução:**
1. Verificar status da Focus NFe API
2. Aguardar 5 minutos
3. Usar botão "Retry" em `/admin/fiscal-notes`

#### NFe gerada mas email não enviado
**Solução:**
1. Verificar email do cliente no pedido
2. Acessar `/admin/fiscal-notes`
3. Baixar PDF/XML
4. Enviar manualmente via email

---

## 🎟️ Cupons e Promoções

### 5.1 Criar Cupom de Desconto

Acesse `/admin/coupons` e clique em "Novo Cupom".

### 5.2 Tipos de Cupom

#### **Percentual**
- Desconto em % sobre o valor total
- Exemplo: 10% OFF
- Campo `type`: `percentage`
- Campo `value`: 10 (representa 10%)

#### **Valor Fixo**
- Desconto em valor absoluto (R$)
- Exemplo: R$ 20 OFF
- Campo `type`: `fixed`
- Campo `value`: 20.00

#### **Frete Grátis**
- Zera custo de frete
- Campo `free_shipping`: true
- Pode combinar com desconto

### 5.3 Configurações Avançadas

**Uso por Usuário (`usage_per_user`):**
- Limita quantas vezes cada usuário pode usar
- Exemplo: 1 = apenas uma vez por usuário

**Uso Total (`max_uses`):**
- Limita uso global do cupom
- Exemplo: 100 = apenas 100 pessoas podem usar

**Valor Mínimo (`min_order_value`):**
- Pedido mínimo para usar cupom
- Exemplo: 100.00 = só para pedidos acima de R$ 100

**Desconto Máximo (`maximum_discount_amount`):**
- Limita desconto em cupons percentuais
- Exemplo: 50.00 = máximo R$ 50 de desconto

**Primeira Compra (`first_purchase_only`):**
- Restrito a novos clientes
- true = só quem nunca comprou

**Empilhável (`stackable`):**
- Permite combinar com outros cupons
- false = não pode usar junto com outros

**Auto-aplicar (`auto_apply`):**
- Aplica automaticamente no checkout
- true = não precisa digitar código

### 5.4 Promoções de Lançamento

Acesse `/admin/launch-setup` para configurar promoções especiais.

**Template: Early Bird (Primeiros Clientes)**
```
Código: EARLYBIRDXX
Tipo: percentage
Valor: 15
Uso máximo: 50
Primeira compra: true
Expira em: 7 dias
```

**Template: Frete Grátis**
```
Código: FRETEGRATIS
Tipo: percentage
Valor: 0
Frete grátis: true
Valor mínimo: 80.00
Uso máximo: 100
```

### 5.5 Monitorar Uso de Cupons

1. Acesse `/admin/coupons`
2. Coluna "Usos" mostra `current_uses / max_uses`
3. Clique no cupom para ver detalhes
4. Histórico de resgates em "Redemptions"

**Análise:**
- Taxa de conversão: resgates / visualizações
- Ticket médio com cupom
- Usuários únicos que usaram

---

## 📊 Gerenciamento de Estoque

### 6.1 Visualizar Estoque

Acesse `/admin/inventory` para ver estoque atual de todos os produtos.

### 6.2 Sistema de Lotes

Cada perfume pode ter múltiplos lotes:
- `lot_code`: Código identificador
- `qty_ml`: Quantidade em mililitros
- `cost_per_ml`: Custo por ml
- `expiry_date`: Validade
- `supplier`: Fornecedor

### 6.3 Adicionar Estoque

1. Acesse `/admin/inventory`
2. Selecione o perfume
3. Clique em "Adicionar Lote"
4. Preencha:
   - Código do lote
   - Quantidade (ml)
   - Custo unitário
   - Data de validade
   - Fornecedor
5. Salvar

**O sistema irá:**
- Incrementar estoque total
- Calcular custo médio ponderado
- Registrar movimento em `material_movements`

### 6.4 Baixa de Estoque

**Automática:**
- Ocorre quando pedido é confirmado (status `paid`)
- Calcula ml necessários baseado em tamanhos vendidos
- Baixa do lote mais antigo (FIFO)

**Manual:**
1. Acesse `/admin/inventory`
2. Selecione o perfume
3. Clique em "Registrar Saída"
4. Informar:
   - Quantidade (ml)
   - Motivo (quebra, amostra, etc.)
5. Confirmar

### 6.5 Alertas de Estoque Baixo

- Configurado em cada perfume: `min_stock_alert`
- Quando `qty_ml < min_stock_alert`:
  - Badge vermelho no dashboard
  - Notificação para admins
  - Email automático (se configurado)

**Ação recomendada:**
- Revisar histórico de vendas
- Calcular ponto de reposição
- Criar pedido de compra

---

## 🔄 Assinaturas

### 7.1 Planos de Assinatura

Acesse `/admin/subscriptions` para gerenciar planos.

**Planos disponíveis:**
- **Basic:** 1 perfume/mês
- **Premium:** 2 perfumes/mês
- **Luxury:** 3 perfumes/mês

### 7.2 Processar Assinaturas Manualmente

**Quando usar:**
- Falha no processamento automático
- Cliente solicitou antecipação
- Ajuste de data de envio

**Passo a passo:**
1. Acesse `/admin/subscriptions`
2. Aba "Processar Manualmente"
3. Selecione assinaturas a processar
4. Clique em "Processar Selecionadas"
5. Sistema irá:
   - Cobrar clientes
   - Gerar pedidos
   - Criar remessas
   - Enviar emails

### 7.3 Remessas Pendentes

Visualize em `/admin/subscriptions` > aba "Remessas Pendentes".

**Estados da remessa:**
- `pending`: Aguardando processamento
- `processing`: Em preparação
- `shipped`: Enviada
- `delivered`: Entregue
- `failed`: Falhou (pagamento recusado, etc.)

### 7.4 Cancelar Assinatura

**Usuário pode cancelar:**
- Pela própria conta em `/minha-assinatura`
- Sem cobrança de multa
- Efetivo no final do ciclo atual

**Admin pode cancelar:**
1. Acesse `/admin/subscriptions`
2. Localize assinatura
3. Clique em "Cancelar"
4. Confirmar
5. Registrar motivo em notes

---

## 🔧 Troubleshooting

### 8.1 Pedido não gerou NFe

**Sintomas:**
- Pedido em status `paid`
- Sem NFe associada após 5 minutos

**Diagnóstico:**
1. Acessar `/admin/fiscal-notes`
2. Verificar se há registro com status `error`
3. Ler mensagem de erro

**Soluções:**

| Erro | Causa Provável | Solução |
|------|----------------|---------|
| Certificado inválido | Expirado ou incorreto | Renovar/atualizar certificado |
| Dados destinatário | CPF/endereço incorreto | Corrigir dados do cliente e reemitir |
| Timeout | Focus NFe indisponível | Aguardar e usar botão "Retry" |
| Produto sem NCM | NCM não cadastrado | Cadastrar NCM no produto |

### 8.2 Pagamento aprovado mas estoque não baixou

**Sintomas:**
- Pedido `paid` mas `qty_ml` não diminuiu

**Diagnóstico:**
1. Verificar em `/admin/inventory` se estoque mudou
2. Acessar `material_movements` e buscar por `order_id`
3. Verificar logs do edge function `confirm-order`

**Solução:**
1. Se não houver movimento registrado:
   - Acesse `/admin/orders`
   - Clique no pedido
   - "Forçar Baixa de Estoque" (botão admin)
2. Se houver movimento mas estoque não atualizou:
   - Bug no sistema, reportar para TI
   - Ajustar estoque manualmente

### 8.3 Cliente não recebeu email de confirmação

**Possíveis causas:**
- Email incorreto no cadastro
- Email caiu em spam
- Falha no serviço de email (Resend)

**Verificação:**
1. Confirmar email do cliente em `/admin/users`
2. Verificar logs do Resend (se integrado)
3. Verificar logs do edge function `send-email`

**Solução imediata:**
1. Acesse `/admin/orders`
2. Localize o pedido
3. Clique em "Reenviar Email"
4. Confirmar

**Solução alternativa:**
- Baixar comprovante/NFe
- Enviar manualmente via email admin

### 8.4 Erro de Rate Limiting no Checkout

**Sintomas:**
- Cliente relata erro "Too many requests"
- Não consegue finalizar compra

**Causa:**
- Excedeu limite de requisições por minuto
- Comum em bots ou tentativas de fraude

**Solução para cliente legítimo:**
1. Verificar IP em `/admin/security-logs`
2. Se for cliente real:
   - Aumentar limite temporariamente em Supabase Dashboard
   - Ou aguardar 5 minutos (reset automático)
3. Se for suspeito:
   - Manter bloqueio
   - Investigar atividade

### 8.5 Cupom não está funcionando

**Sintomas:**
- Cliente relata que código não aceita
- Mensagem "Cupom inválido"

**Verificações:**
1. Acesse `/admin/coupons`
2. Localizar cupom pelo código
3. Verificar:
   - [ ] `is_active` está `true`
   - [ ] `expires_at` não passou
   - [ ] `current_uses` < `max_uses`
   - [ ] Valor do pedido > `min_order_value`
   - [ ] Cliente não excedeu `usage_per_user`
   - [ ] Se `first_purchase_only`, cliente não tem pedidos anteriores

**Solução:**
- Ajustar configurações se necessário
- Criar novo cupom equivalente se expirado
- Explicar regras ao cliente

### 8.6 Sistema lento / não carrega

**Verificações:**
1. Status do Supabase: https://status.supabase.com
2. Status do Stripe: https://status.stripe.com
3. Verificar cache do navegador (Ctrl+Shift+R)
4. Verificar console do navegador (F12)

**Se for problema de performance:**
1. Acessar `/admin/monitoring`
2. Verificar métricas de performance
3. Identificar queries lentas
4. Considerar otimizações (índices, cache)

**Se for problema de rede:**
1. Testar de outro dispositivo/rede
2. Verificar DNS
3. Verificar certificado SSL

---

## 📞 Suporte e Contatos

### Suporte Técnico
- **Email:** suporte@suaperfumaria.com
- **Horário:** Segunda a Sexta, 9h-18h

### Integrações Externas

**Focus NFe:**
- Site: https://focusnfe.com.br
- Suporte: suporte@acras.com.br
- Documentação: https://focusnfe.com.br/doc/

**Stripe:**
- Dashboard: https://dashboard.stripe.com
- Suporte: https://support.stripe.com
- Documentação: https://stripe.com/docs

**Melhor Envio:**
- Dashboard: https://melhorenvio.com.br
- Suporte: suporte@melhorenvio.com.br
- Documentação: https://docs.melhorenvio.com.br

**Supabase:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Status: https://status.supabase.com

---

## 📝 Glossário

- **RLS:** Row Level Security - segurança em nível de linha no banco
- **Edge Function:** Função serverless executada na borda (Deno)
- **2FA:** Two-Factor Authentication - autenticação de dois fatores
- **NFe:** Nota Fiscal Eletrônica
- **SEFAZ:** Secretaria da Fazenda
- **NCM:** Nomenclatura Comum do Mercosul (código de produto)
- **CFOP:** Código Fiscal de Operações e Prestações
- **PIX:** Sistema de pagamentos instantâneos brasileiro
- **RLS Policy:** Regra de segurança no Supabase
- **Webhook:** Callback HTTP para notificação de eventos
- **Rate Limiting:** Limitação de taxa de requisições

---

## 📌 Atalhos Úteis

| Página | URL | Atalho |
|--------|-----|--------|
| Dashboard Admin | `/admin` | - |
| Pedidos | `/admin/orders` | - |
| Notas Fiscais | `/admin/fiscal-notes` | - |
| Cupons | `/admin/coupons` | - |
| Estoque | `/admin/inventory` | - |
| Segurança | `/admin/security-metrics` | - |
| Logs | `/admin/security-logs` | - |
| Assinaturas | `/admin/subscriptions` | - |
| Usuários | `/admin/users` | - |
| Configurações | `/admin/company-config` | - |

---

**🎉 Fim do Manual Operacional**

> Para dúvidas ou sugestões de melhorias neste manual, contate o time de desenvolvimento.
