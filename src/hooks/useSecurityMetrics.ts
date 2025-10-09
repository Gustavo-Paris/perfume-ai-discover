import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

interface SecurityMetrics {
  // Métricas de Login
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  blockedAttempts: number;
  uniqueIPs: number;
  
  // Métricas de Acesso
  totalAccessLogs: number;
  suspiciousAccessCount: number;
  adminAccessCount: number;
  
  // Métricas de Dados Sensíveis
  addressAccessCount: number;
  businessDataAccessCount: number;
  
  // Métricas de Compliance
  complianceAuditCount: number;
}

interface TimeSeriesData {
  date: string;
  failed_attempts: number;
  successful_logins: number;
}

export const useSecurityMetrics = (days: number = 7) => {
  const startDate = subDays(new Date(), days);

  // Métricas gerais
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['security-metrics', days],
    queryFn: async (): Promise<SecurityMetrics> => {
      // Login attempts
      const { data: loginAttempts } = await supabase
        .from('login_attempts')
        .select('attempt_type, ip_address')
        .gte('created_at', startDate.toISOString());

      const failed = loginAttempts?.filter(a => a.attempt_type === 'failed').length || 0;
      const successful = loginAttempts?.filter(a => a.attempt_type === 'success').length || 0;
      const blocked = loginAttempts?.filter(a => a.attempt_type === 'blocked').length || 0;
      const uniqueIPs = new Set(loginAttempts?.map(a => a.ip_address).filter(Boolean)).size;

      // Access logs
      const { count: accessCount } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const { count: adminAccessCount } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .like('route', '%admin%');

      // Sensitive data access
      const { count: addressAccessCount } = await supabase
        .from('address_access_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      const { count: businessDataAccessCount } = await supabase
        .from('business_data_access_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Compliance audits
      const { count: complianceCount } = await supabase
        .from('compliance_audit_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      return {
        totalLoginAttempts: (loginAttempts?.length || 0),
        failedLoginAttempts: failed,
        successfulLogins: successful,
        blockedAttempts: blocked,
        uniqueIPs,
        totalAccessLogs: accessCount || 0,
        suspiciousAccessCount: 0, // Pode ser calculado com regras específicas
        adminAccessCount: adminAccessCount || 0,
        addressAccessCount: addressAccessCount || 0,
        businessDataAccessCount: businessDataAccessCount || 0,
        complianceAuditCount: complianceCount || 0,
      };
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Time series para gráficos
  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ['security-timeseries', days],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const { data } = await supabase
        .from('login_attempts')
        .select('created_at, attempt_type')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (!data) return [];

      // Agrupar por dia
      const grouped = data.reduce((acc: Record<string, { failed: number; success: number }>, item) => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { failed: 0, success: 0 };
        }
        if (item.attempt_type === 'failed') {
          acc[date].failed++;
        } else if (item.attempt_type === 'success') {
          acc[date].success++;
        }
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, counts]) => ({
        date,
        failed_attempts: counts.failed,
        successful_logins: counts.success,
      }));
    },
  });

  // Detectar atividades suspeitas
  const { data: suspiciousActivities, isLoading: suspiciousLoading } = useQuery({
    queryKey: ['suspicious-activities', days],
    queryFn: async () => {
      // IPs com múltiplas tentativas falhadas
      const { data: failedByIP } = await supabase
        .from('login_attempts')
        .select('ip_address, email, created_at')
        .eq('attempt_type', 'failed')
        .gte('created_at', startDate.toISOString());

      const ipCounts: Record<string, number> = failedByIP?.reduce((acc: Record<string, number>, item) => {
        const ipAddress = item.ip_address as string | null;
        if (ipAddress) {
          acc[ipAddress] = (acc[ipAddress] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // IPs com mais de 5 tentativas falhadas
      const suspicious = Object.entries(ipCounts)
        .filter(([, count]) => count >= 5)
        .map(([ip, count]) => ({ ip, count }));

      return suspicious;
    },
  });

  return {
    metrics,
    timeSeries,
    suspiciousActivities,
    isLoading: metricsLoading || timeSeriesLoading || suspiciousLoading,
  };
};
