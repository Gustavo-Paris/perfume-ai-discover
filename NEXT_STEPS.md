# Próximos Passos - Sistema de Segurança

## 🎯 Status Atual

### ✅ Implementado (100% Core + 95% Aplicação)
- ✅ FASE 1: Autenticação robusta e session management
- ✅ FASE 2: Validação server-side, RLS Policies
- ✅ FASE 3: Proteção de dados sensíveis & Criptografia
- ✅ FASE 4: Validação robusta & Headers de segurança
- ✅ Documentação completa (SECURITY.md)
- ✅ Guia de implementação (IMPLEMENTATION_GUIDE.md)
- ✅ Headers HTTP (vercel.json, netlify.toml)
- ✅ Schemas aplicados (Auth.tsx, ReviewForm.tsx, AddressForm.tsx)
- ✅ Sistema de Audit Logs (tabela + hook + dashboard)
- ✅ Dashboard de segurança em `/admin/security-logs`
- ✅ Logs automáticos de autenticação (login, signup, password change)
- ✅ Sistema de Alertas Automáticos (cron + edge function + dashboard)
- ✅ Audit logs em edge functions críticas (confirm-order, generate-nfe, create-stripe-checkout, moderate-review)
- ✅ Audit logs em ações administrativas (CRUD de perfumes)

### 🔄 Em Progresso
- ✅ Aplicar schemas em formulários restantes (COMPLETO - 95%)
- 🔄 Implementar alertas de email para administradores

---

## 🔴 Alta Prioridade

### 1. Sistema de Alertas Automáticos ✅✅✅
**Status**: COMPLETAMENTE IMPLEMENTADO
**Tempo estimado**: 2h
**Impacto**: CRÍTICO

**Objetivo**: Notificar admins automaticamente sobre eventos de segurança críticos

Tarefas:
- [x] Criar edge function `security-monitor` ✅
- [x] Detectar padrões suspeitos (múltiplos logins falhados, rate limits) ✅
- [x] Dashboard de configuração de alertas em `/admin/security-alerts` ✅
- [x] Configurar thresholds de alerta ✅
- [x] Criar notificações no dashboard ✅
- [x] Agendar execução periódica via cron job (a cada 10 minutos) ✅
- [ ] Enviar emails de alerta para administradores (pendente integração Resend)

Critérios de alerta implementados:
- ✅ Mais de 5 tentativas de login falhadas em 10min (mesmo IP)
- ✅ Eventos com risk_level='critical'
- ✅ Rate limit excedido >10x em 1 hora
- ✅ Tentativas de acesso não autorizado

**Sistema funcionando**: O monitoramento está rodando automaticamente a cada 10 minutos via pg_cron

### 2. Completar Integração de Audit Logs ✅✅
**Status**: 95% implementado
**Tempo estimado**: 2h

- [x] Hook useSecurityAudit criado ✅
- [x] Logs em Auth.tsx (login, signup, password change) ✅
- [x] Logs em edge functions críticas:
  - [x] `confirm-order` ✅
  - [x] `generate-nfe` ✅
  - [x] `create-stripe-checkout` ✅
  - [x] `moderate-review` ✅
- [x] Logs em ações administrativas:
  - [x] CRUD de perfumes ✅
  - [x] Moderação de reviews (via edge function) ✅
  - [ ] Mudanças de configuração da empresa
  - [ ] Gerenciamento de roles
- [ ] Relatórios semanais automáticos (email para admins)

### 3. Testes de Segurança Completos ✅✅✅
**Status**: IMPLEMENTADO - Pronto para execução
**Tempo estimado**: 3h (implementação) + 1h (execução)
**Impacto**: CRÍTICO

**Objetivo**: Validar todas as proteções de segurança através de testes automatizados

Tarefas:
- [x] **Criar suite de testes** ✅
  - [x] auth.test.ts - Testes de autenticação ✅
  - [x] data-protection.test.ts - Testes de proteção de dados ✅
  - [x] schema-validation.test.ts - Testes de validação ✅
  - [x] rate-limit.test.ts - Testes de rate limiting ✅
  - [x] csrf.test.ts - Testes de CSRF protection ✅
  - [x] input-sanitization.test.ts - Testes de sanitização ✅
  - [x] rls.test.ts - Testes de RLS policies ✅
  - [x] security-test-runner.ts - Utilitário de testes ✅

- [ ] **Executar e validar testes**
  - [ ] Executar `npm run test:security`
  - [ ] Validar 100% de aprovação
  - [ ] Gerar relatório de segurança
  - [ ] Corrigir falhas se houver

- [ ] **Testes Manuais Complementares**
  - [ ] Rate Limiting: Fazer >5 requisições rápidas no checkout
  - [ ] CSRF Protection: Tentar POST sem token CSRF
  - [ ] Input Sanitization: Tentar injetar `<script>alert('xss')</script>`
  - [ ] RLS Policies: Tentar acessar dados de outro usuário
  - [ ] SQL Injection: Testar inputs com `'; DROP TABLE--`
  - [ ] Auth Bypass: Tentar acessar rotas admin sem permissão

**Cobertura de Testes**: 50+ testes de segurança implementados
**Categorias**: Autenticação, Proteção de Dados, Validação, Rate Limiting, CSRF, XSS, SQL Injection, RLS

---

## 🟡 Média Prioridade

### 1. Autenticação de Dois Fatores (2FA)
**Status**: Não iniciado
**Tempo estimado**: 4h

- [ ] Implementar TOTP com biblioteca `otpauth`
- [ ] Criar UI de configuração de 2FA
- [ ] Gerar e armazenar códigos de recuperação
- [ ] Testar fluxo completo (enable, login, disable)
- [ ] Documentar processo para usuários

### 2. Session Management Avançado
**Status**: Não iniciado
**Tempo estimado**: 2h

- [ ] Detectar múltiplos logins simultâneos
- [ ] Adicionar botão "Logout de todos os dispositivos"
- [ ] Mostrar histórico de sessões ativas
- [ ] Implementar geolocalização de logins
- [ ] Alertar usuário sobre login em novo dispositivo

### 3. Aplicar Schemas em Formulários Restantes ✅
**Status**: COMPLETO
**Tempo**: 30min cada

- [x] `src/pages/Auth.tsx` ✅
- [x] `src/components/reviews/ReviewForm.tsx` ✅
- [x] `src/components/checkout/AddressForm.tsx` ✅
- [x] `src/components/checkout/PaymentStep.tsx` ✅ (já tinha CSRF e rate limiting)
- [x] `src/components/support/SupportChat.tsx` ✅
- [x] `src/pages/Configuracoes.tsx` ✅ (já tinha validações básicas, agora com Zod)
- [ ] `src/components/admin/CompanyConfigManager.tsx` (componente admin - baixa prioridade)

### 4. Edge Functions com Middleware
**Tempo**: 20min cada

- [x] `confirm-order` ✅
- [x] `process-payment` ✅
- [x] `create-stripe-checkout` ✅
- [ ] `validate-coupon`
- [ ] `recommend`
- [ ] `conversational-recommend`
- [ ] `shipping-quote`

---

## 🟢 Baixa Prioridade

### 1. Compliance LGPD
- [ ] Implementar exportação de dados pessoais (JSON)
- [ ] Criar fluxo de exclusão completa de conta
- [ ] Adicionar consentimentos granulares
- [ ] Logs de processamento de dados pessoais

### 2. Melhorias de UX de Segurança
- [ ] Indicador de força de senha em tempo real com barra
- [ ] Mensagens de erro mais amigáveis
- [ ] Tooltips explicando requisitos de segurança
- [ ] Página "Central de Segurança" para usuários

### 3. Documentação Adicional
- [ ] Guia de resposta a incidentes
- [ ] Runbook de troubleshooting de segurança
- [ ] Exemplos de uso de todos os hooks
- [ ] Checklist de deploy de segurança

---

## 📊 Métricas de Segurança

### Monitorar no Dashboard `/admin/security-logs`

**Diariamente:**
- 📈 Total de eventos por nível de risco
- 🚨 Eventos críticos/altos (devem ser 0)
- 🔐 Logins falhados por IP
- ⚡ Rate limits excedidos

**Semanalmente:**
- 📊 Tendências de eventos de segurança
- 👥 Usuários mais ativos
- 🌍 Distribuição geográfica de acessos
- 🔍 Padrões anômalos

**Mensalmente:**
- 📉 Comparativo mês anterior
- 🎯 Taxa de sucesso de autenticação
- 🛡️ Efetividade de proteções
- 📚 Compliance de auditoria

---

## ⚠️ Warnings de Segurança Detectados

Warnings do linter Supabase (não relacionados à última migração):

1. **Security Definer Views** (2x): Revisar views com SECURITY DEFINER
2. **Function Search Path** (4x): Adicionar `SET search_path = public` nas funções
3. **Extension in Public**: Mover extensões para schema separado
4. **Leaked Password Protection**: ⚠️ **AÇÃO NECESSÁRIA** - Habilitar no Supabase Dashboard
5. **Postgres Version**: ⚠️ **AÇÃO NECESSÁRIA** - Atualizar versão

### ⚡ Ações Imediatas Recomendadas

**Para o Usuário (Supabase Dashboard):**

1. **Habilitar Proteção de Senha Vazada:**
   - Acesse: Authentication > Providers
   - Ative: "Leaked Password Protection"

2. **Atualizar Postgres (quando possível):**
   - Acesse: Project Settings > Database
   - Clique: "Upgrade Database"

**Para o Desenvolvedor (Próxima migração):**
- Corrigir funções sem `search_path` definido
- Revisar views com SECURITY DEFINER

---

## 🎯 Recomendação da Próxima Ação

**Mais Impacto**: **Testes de Segurança Completos**

Por quê?
- ✅ Sistema de audit logs completamente implementado
- ✅ Alertas automáticos funcionando a cada 10 minutos
- ✅ Logs em edge functions críticas e ações admin
- ✅ Hook useSecurityAudit integrado
- ❌ Falta validação prática de todas as proteções
- ❌ Necessário garantir que as proteções funcionam corretamente

O que implementar:
1. Criar suite de testes de segurança
2. Testar rate limiting na prática
3. Validar proteções CSRF
4. Verificar sanitização de inputs
5. Testar RLS policies com diferentes usuários
6. Documentar resultados e ajustar proteções

**Tempo**: ~3 horas
**Impacto**: Crítico (validação completa do sistema de segurança)

---

**Última atualização:** 2025-10-07  
**Próxima revisão:** 2025-10-14
