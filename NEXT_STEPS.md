# Próximos Passos - Sistema de Segurança

## 🎯 Status Atual

### ✅ Implementado (100% Core + 85% Aplicação)
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

### 🔄 Em Progresso
- 🔄 Integrar audit logs em mais componentes e edge functions
- 🔄 Aplicar schemas em formulários restantes
- 🔄 Implementar alertas automáticos

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

### 2. Completar Integração de Audit Logs
**Status**: 60% implementado
**Tempo estimado**: 2h

- [x] Hook useSecurityAudit criado
- [x] Logs em Auth.tsx (login, signup, password change)
- [ ] Adicionar logs em edge functions:
  - `create-stripe-checkout`
  - `confirm-order`
  - `generate-nfe`
  - `moderate-review`
- [ ] Logs em ações administrativas:
  - CRUD de perfumes
  - Aprovação/rejeição de reviews
  - Mudanças de configuração da empresa
  - Gerenciamento de roles
- [ ] Relatórios semanais automáticos (email para admins)

### 3. Testes de Segurança Completos
**Status**: Não iniciado
**Tempo estimado**: 3h

- [ ] **Rate Limiting**: Fazer >5 requisições rápidas e verificar bloqueio
- [ ] **CSRF Protection**: Tentar POST sem token CSRF
- [ ] **Input Sanitization**: Tentar injetar `<script>alert('xss')</script>`
- [ ] **RLS Policies**: Tentar acessar dados de outro usuário
- [ ] **SQL Injection**: Testar inputs com `'; DROP TABLE--`
- [ ] **Auth Bypass**: Tentar acessar rotas admin sem permissão

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

### 3. Aplicar Schemas em Formulários Restantes
**Tempo**: 30min cada

- [x] `src/pages/Auth.tsx` ✅
- [x] `src/components/reviews/ReviewForm.tsx` ✅
- [x] `src/components/checkout/AddressForm.tsx` ✅
- [ ] `src/components/checkout/PaymentStep.tsx`
- [ ] `src/components/support/SupportChat.tsx`
- [ ] `src/pages/Configuracoes.tsx`
- [ ] `src/components/admin/CompanyConfigManager.tsx`

### 4. Edge Functions com Middleware
**Tempo**: 20min cada

- [x] `confirm-order` ✅
- [x] `process-payment` ✅
- [ ] `create-stripe-checkout`
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

**Mais Impacto**: **Completar Integração de Audit Logs em Edge Functions**

Por quê?
- ✅ Hook useSecurityAudit criado e funcional
- ✅ Logs de autenticação já implementados
- ✅ Sistema de alertas monitora eventos críticos
- ❌ Edge functions críticas ainda não logam eventos
- ❌ Ações administrativas não estão sendo auditadas

O que implementar:
1. Adicionar logs em edge functions críticas (confirm-order, generate-nfe, etc)
2. Implementar logs em ações admin (CRUD de perfumes, aprovação de reviews)
3. Garantir rastreabilidade completa de operações sensíveis

**Tempo**: ~2 horas
**Impacto**: Alto (compliance e auditoria completa)

---

**Última atualização:** 2025-10-07  
**Próxima revisão:** 2025-10-14
