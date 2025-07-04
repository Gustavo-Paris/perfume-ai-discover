import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import Handlebars from "npm:handlebars@4.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Perfume Connect <noreply@perfumeconnect.com>';

// Email templates
const templates = {
  order_confirmed: {
    subject: 'Pedido Confirmado #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Pedido Confirmado!</h1>
        <p>Olá {{customerName}},</p>
        <p>Seu pedido #{{orderNumber}} foi confirmado com sucesso!</p>
        
        <h2>Itens do Pedido:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          {{#each items}}
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">{{brand}} - {{name}} ({{size}})</td>
            <td style="padding: 10px; text-align: center;">{{quantity}}x</td>
            <td style="padding: 10px; text-align: right;">R$ {{price}}</td>
          </tr>
          {{/each}}
        </table>
        
        <p style="font-size: 18px; font-weight: bold; text-align: right;">
          Total: R$ {{total}}
        </p>
        
        <p>Endereço de entrega:<br>
        {{shippingAddress.street}}, {{shippingAddress.number}}<br>
        {{shippingAddress.district}} - {{shippingAddress.city}}/{{shippingAddress.state}}<br>
        CEP: {{shippingAddress.cep}}
        </p>
        
        <p>Obrigado por escolher a Perfume Connect!</p>
      </div>
    `
  },
  
  payment_approved: {
    subject: 'Pagamento Aprovado - Pedido #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">Pagamento Aprovado!</h1>
        <p>Olá {{customerName}},</p>
        <p>Seu pagamento do pedido #{{orderNumber}} foi aprovado!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Valor pago:</strong> R$ {{total}}</p>
          <p><strong>Método:</strong> {{paymentMethod}}</p>
        </div>
        
        <p>Seu pedido está sendo preparado e você receberá um novo email quando for enviado.</p>
        
        <p>Obrigado pela preferência!</p>
      </div>
    `
  },
  
  shipping_label: {
    subject: 'Pedido Enviado - #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Pedido Enviado!</h1>
        <p>Olá {{customerName}},</p>
        <p>Seu pedido #{{orderNumber}} foi enviado!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Código de rastreamento:</strong> {{trackingCode}}</p>
          <p><strong>Transportadora:</strong> {{shippingService}}</p>
          <p><strong>Prazo estimado:</strong> {{estimatedDays}} dias úteis</p>
        </div>
        
        <p>Você pode acompanhar seu pedido através do código de rastreamento.</p>
        
        <p>Obrigado pela preferência!</p>
      </div>
    `
  },
  
  order_delivered: {
    subject: 'Pedido Entregue - #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">Pedido Entregue!</h1>
        <p>Olá {{customerName}},</p>
        <p>Seu pedido #{{orderNumber}} foi entregue!</p>
        
        <p>Esperamos que você tenha uma experiência incrível com seus novos perfumes.</p>
        
        <p>Que tal deixar uma avaliação? Você ganha pontos por cada avaliação aprovada!</p>
        
        <p>Obrigado por escolher a Perfume Connect!</p>
      </div>
    `
  },
  
  review_approved: {
    subject: 'Avaliação Aprovada - Parabéns!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">Avaliação Aprovada!</h1>
        <p>Olá {{customerName}},</p>
        <p>Sua avaliação do perfume {{perfumeBrand}} - {{perfumeName}} foi aprovada!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Pontos ganhos:</strong> {{pointsEarned}} pontos</p>
        </div>
        
        <p>Obrigado por compartilhar sua experiência com outros clientes!</p>
        
        <p>Continue avaliando produtos e acumulando pontos!</p>
      </div>
    `
  },
  
  stock_alert_admin: {
    subject: 'Alerta de Estoque Baixo - {{perfumeBrand}} {{perfumeName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Alerta de Estoque Baixo</h1>
        <p>O perfume {{perfumeBrand}} - {{perfumeName}} está com estoque baixo.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p><strong>Produto:</strong> {{perfumeBrand}} - {{perfumeName}}</p>
          <p><strong>Estoque atual:</strong> {{remainingStock}} ml</p>
          <p><strong>Depósito:</strong> {{warehouseName}}</p>
        </div>
        
        <p>Considere reabastecer o estoque o mais breve possível.</p>
      </div>
    `
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, template, data } = await req.json();
    
    if (!templates[template]) {
      throw new Error(`Template '${template}' not found`);
    }

    const templateData = templates[template];
    const compiledSubject = Handlebars.compile(templateData.subject);
    const compiledHtml = Handlebars.compile(templateData.html);

    const subject = compiledSubject(data);
    const html = compiledHtml(data);

    const emailResponse = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);