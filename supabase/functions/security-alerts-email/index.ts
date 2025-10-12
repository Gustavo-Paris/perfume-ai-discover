import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  created_at: string;
}

const ADMIN_EMAILS = [
  // These should be configured in the database or environment
  "admin@paris-co.com"
];

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get alert details from request
    const alert: SecurityAlert = await req.json();

    // Fetch admin emails from database
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id, profiles(email)')
      .eq('role', 'admin');

    const adminEmails = admins?.map(a => a.profiles?.email).filter(Boolean) || ADMIN_EMAILS;

    // Prepare email content based on severity
    const severityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    }[alert.severity];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .alert-box {
              background: white;
              border-left: 4px solid ${
                alert.severity === 'critical' ? '#ef4444' :
                alert.severity === 'high' ? '#f97316' :
                alert.severity === 'medium' ? '#eab308' : '#3b82f6'
              };
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${severityEmoji} Alerta de Segurança - Paris & Co</h1>
              <p>Severidade: <strong>${alert.severity.toUpperCase()}</strong></p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <h2>Tipo: ${alert.type}</h2>
                <p><strong>Mensagem:</strong></p>
                <p>${alert.message}</p>
                
                ${alert.details ? `
                  <p><strong>Detalhes:</strong></p>
                  <pre style="background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.details, null, 2)}
                  </pre>
                ` : ''}
                
                <p><strong>Data/Hora:</strong> ${new Date(alert.created_at).toLocaleString('pt-BR')}</p>
              </div>
              
              <a href="${SUPABASE_URL}/dashboard/project/${Deno.env.get('SUPABASE_PROJECT_ID')}/logs" class="button">
                Ver Logs Completos
              </a>
            </div>
            
            <div class="footer">
              <p>Este é um alerta automático do sistema de segurança Paris & Co.</p>
              <p>Para desativar estes alertas, acesse as configurações de segurança no painel admin.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to all admins
    const emailPromises = adminEmails.map(email =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Segurança Paris & Co <noreply@paris-co.com>",
          to: [email],
          subject: `${severityEmoji} [${alert.severity.toUpperCase()}] Alerta de Segurança - ${alert.type}`,
          html: emailHtml,
        }),
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Security alert emails sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        message: `Alert email sent to ${successCount} admin(s)`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending security alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
