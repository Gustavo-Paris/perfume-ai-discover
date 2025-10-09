/**
 * Hook para registrar eventos de auditoria de segurança
 * Rastreia ações críticas para análise e compliance
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'account_created'
  | 'account_deleted'
  | 'admin_access'
  | 'data_export'
  | 'permission_change'
  | 'sensitive_data_access'
  | 'api_key_created'
  | 'api_key_deleted'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'company_config_update'
  | 'role_granted'
  | 'role_removed';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogEntry {
  event_type: SecurityEventType;
  description: string;
  risk_level: RiskLevel;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export const useSecurityAudit = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (entry: AuditLogEntry) => {
    try {
      // Capturar informações do navegador
      const userAgent = navigator.userAgent;
      
      // Tentar obter IP (em produção, isso viria do backend)
      let ipAddress: string | undefined;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        ipAddress = undefined;
      }

      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: user?.id || null,
          event_type: entry.event_type,
          event_description: entry.description,
          risk_level: entry.risk_level,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: entry.metadata || {},
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const logLogin = async (success: boolean, email?: string) => {
    await logSecurityEvent({
      event_type: success ? 'login_success' : 'login_failed',
      description: success 
        ? `Login bem-sucedido para ${email || 'usuário'}` 
        : `Tentativa de login falhou para ${email || 'usuário'}`,
      risk_level: success ? 'low' : 'medium',
      metadata: { email },
    });
  };

  const logPasswordChange = async () => {
    await logSecurityEvent({
      event_type: 'password_change',
      description: 'Senha alterada com sucesso',
      risk_level: 'medium',
    });
  };

  const logSensitiveDataAccess = async (resourceType: string, resourceId: string) => {
    await logSecurityEvent({
      event_type: 'sensitive_data_access',
      description: `Acesso a dados sensíveis: ${resourceType}`,
      risk_level: 'medium',
      resource_type: resourceType,
      resource_id: resourceId,
    });
  };

  const logAdminAccess = async (action: string) => {
    await logSecurityEvent({
      event_type: 'admin_access',
      description: `Ação administrativa: ${action}`,
      risk_level: 'high',
      metadata: { action },
    });
  };

  const logSuspiciousActivity = async (description: string, metadata?: Record<string, any>) => {
    await logSecurityEvent({
      event_type: 'suspicious_activity',
      description,
      risk_level: 'critical',
      metadata,
    });
  };

  const logRateLimitExceeded = async (endpoint: string) => {
    await logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      description: `Rate limit excedido para endpoint: ${endpoint}`,
      risk_level: 'medium',
      metadata: { endpoint },
    });
  };

  return {
    logSecurityEvent,
    logLogin,
    logPasswordChange,
    logSensitiveDataAccess,
    logAdminAccess,
    logSuspiciousActivity,
    logRateLimitExceeded,
  };
};
