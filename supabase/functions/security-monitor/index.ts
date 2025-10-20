import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface AlertConfig {
  alert_type: string;
  threshold_value: number;
  time_window_minutes: number;
  is_enabled: boolean;
  notification_channels: string[];
}

interface SecurityEvent {
  event_type: string;
  risk_level: string;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Security monitor: Starting analysis...');

    // Buscar configurações de alertas ativas
    const { data: configs, error: configError } = await supabase
      .from('security_alert_config')
      .select('*')
      .eq('is_enabled', true);

    if (configError) {
      console.error('Error fetching alert configs:', configError);
      throw configError;
    }

    const alerts: any[] = [];
    const now = new Date();

    // Processar cada tipo de alerta
    for (const config of configs as AlertConfig[]) {
      console.log(`Checking alert type: ${config.alert_type}`);
      
      const timeWindowStart = new Date(now.getTime() - config.time_window_minutes * 60000);
      
      let eventCount = 0;
      let triggerAlert = false;
      let alertDetails: any = {};

      switch (config.alert_type) {
        case 'failed_login_attempts': {
          // Buscar tentativas de login falhadas por IP
          const { data: failedLogins } = await supabase
            .from('security_audit_log')
            .select('ip_address, created_at')
            .eq('event_type', 'login_failed')
            .gte('created_at', timeWindowStart.toISOString());

          if (failedLogins) {
            // Agrupar por IP
            const ipCounts = failedLogins.reduce((acc: any, log: SecurityEvent) => {
              const ip = log.ip_address || 'unknown';
              acc[ip] = (acc[ip] || 0) + 1;
              return acc;
            }, {});

            // Verificar se algum IP excedeu o threshold
            for (const [ip, count] of Object.entries(ipCounts)) {
              if ((count as number) >= config.threshold_value) {
                triggerAlert = true;
                alertDetails = {
                  ip_address: ip,
                  attempts: count,
                  threshold: config.threshold_value,
                };
                break;
              }
            }
          }
          break;
        }

        case 'critical_events': {
          // Buscar eventos críticos
          const { data: criticalEvents } = await supabase
            .from('security_audit_log')
            .select('*')
            .eq('risk_level', 'critical')
            .gte('created_at', timeWindowStart.toISOString());

          if (criticalEvents && criticalEvents.length >= config.threshold_value) {
            triggerAlert = true;
            alertDetails = {
              event_count: criticalEvents.length,
              events: criticalEvents.slice(0, 5).map((e: SecurityEvent) => ({
                type: e.event_type,
                time: e.created_at,
              })),
            };
          }
          break;
        }

        case 'rate_limit_exceeded': {
          // Buscar eventos de rate limit
          const { data: rateLimitEvents } = await supabase
            .from('security_audit_log')
            .select('*')
            .eq('event_type', 'rate_limit_exceeded')
            .gte('created_at', timeWindowStart.toISOString());

          if (rateLimitEvents && rateLimitEvents.length >= config.threshold_value) {
            triggerAlert = true;
            alertDetails = {
              event_count: rateLimitEvents.length,
              threshold: config.threshold_value,
            };
          }
          break;
        }

        case 'unauthorized_access': {
          // Buscar tentativas de acesso não autorizado
          const { data: unauthorizedEvents } = await supabase
            .from('security_audit_log')
            .select('*')
            .eq('event_type', 'unauthorized_access')
            .gte('created_at', timeWindowStart.toISOString());

          if (unauthorizedEvents && unauthorizedEvents.length >= config.threshold_value) {
            triggerAlert = true;
            alertDetails = {
              event_count: unauthorizedEvents.length,
              threshold: config.threshold_value,
            };
          }
          break;
        }
      }

      // Se o alerta deve ser disparado, criar notificação
      if (triggerAlert) {
        console.log(`Alert triggered for ${config.alert_type}:`, alertDetails);

        // Buscar admins para notificar
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && config.notification_channels.includes('dashboard')) {
          // Criar notificações para admins
          for (const admin of adminRoles) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              type: 'security_alert',
              message: `Alerta de segurança: ${config.alert_type}`,
              metadata: {
                alert_type: config.alert_type,
                ...alertDetails,
              },
            });
          }
        }

        // TODO: Implementar envio de email quando necessário
        if (config.notification_channels.includes('email')) {
          console.log('Email notification would be sent here');
          // Integrar com edge function de envio de email
        }

        alerts.push({
          type: config.alert_type,
          details: alertDetails,
          notified: true,
        });
      }
    }

    console.log(`Security monitor completed. ${alerts.length} alerts triggered.`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts_triggered: alerts.length,
        alerts,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in security-monitor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
