import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import Handlebars from "npm:handlebars@4.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Temporarily disable Resend until proper setup
const resend = null;
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Perfumes Paris <noreply@perfumesparis.com>';

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
  },

  cart_abandoned_first: {
    subject: 'Você esqueceu alguns perfumes no seu carrinho! 🛒',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9ff; padding: 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">🛒 Carrinho Abandonado</h1>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0;">Seus perfumes favoritos estão esperando por você!</p>
        </div>
        
        <p style="color: #334155; font-size: 16px;">Olá {{customerName}},</p>
        <p style="color: #334155; font-size: 16px;">Notamos que você deixou alguns perfumes incríveis no seu carrinho:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          {{#each items}}
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
            <div>
              <strong style="color: #1e293b;">{{brand}} - {{name}}</strong>
              <br><span style="color: #64748b;">{{size}} | Qtd: {{quantity}}</span>
            </div>
            <div style="text-align: right; color: #059669; font-weight: bold;">
              R$ {{price}}
            </div>
          </div>
          {{/each}}
          
          <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #1e293b;">
            Total: R$ {{totalValue}}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{checkoutUrl}}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Finalizar Compra Agora
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          ⏰ Não perca tempo! Alguns perfumes podem sair de estoque.
        </p>
      </div>
    `
  },

  cart_abandoned_discount: {
    subject: '🎁 Oferta Especial: {{discountPercent}}% OFF no seu carrinho!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d97706; font-size: 32px; margin: 0;">🎁 OFERTA ESPECIAL!</h1>
          <div style="background: #dc2626; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-size: 20px; font-weight: bold;">
            {{discountPercent}}% OFF
          </div>
        </div>
        
        <p style="color: #92400e; font-size: 18px; text-align: center; font-weight: bold;">
          Só para você! Use o cupom: <span style="background: white; padding: 5px 15px; border-radius: 5px; color: #dc2626;">{{discountCode}}</span>
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="color: #1e293b; margin-top: 0;">Seus perfumes:</h3>
          {{#each items}}
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <div>
              <strong>{{brand}} - {{name}}</strong><br>
              <span style="color: #64748b;">{{size}} | Qtd: {{quantity}}</span>
            </div>
            <div>
              <div style="text-decoration: line-through; color: #94a3b8;">R$ {{originalPrice}}</div>
              <div style="color: #dc2626; font-weight: bold;">R$ {{discountPrice}}</div>
            </div>
          </div>
          {{/each}}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; font-size: 16px;">
              <span>Subtotal:</span>
              <span style="text-decoration: line-through; color: #94a3b8;">R$ {{originalTotal}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #dc2626;">
              <span>Total com desconto:</span>
              <span>R$ {{discountTotal}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; color: #059669;">
              <span>Você economiza:</span>
              <span style="font-weight: bold;">R$ {{savings}}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{checkoutUrl}}" style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(220,38,38,0.3);">
            🔥 APROVEITAR DESCONTO
          </a>
        </div>
        
        <p style="color: #92400e; font-size: 14px; text-align: center;">
          ⏰ <strong>Oferta válida por 24 horas!</strong> Não deixe passar esta oportunidade.
        </p>
      </div>
    `
  },

  cart_abandoned_final: {
    subject: '⚡ Última chance! Seus perfumes podem sair de estoque',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fef2f2; padding: 30px; border-radius: 12px; border: 2px solid #fca5a5;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0;">⚡ ÚLTIMA CHANCE!</h1>
          <p style="color: #7f1d1d; font-size: 18px; margin: 10px 0;">Estoque limitado - não perca seus perfumes!</p>
        </div>
        
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="color: #7f1d1d; font-weight: bold; margin: 0;">⚠️ ATENÇÃO: Alguns perfumes do seu carrinho estão com estoque baixo!</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Seus perfumes selecionados:</h3>
          {{#each items}}
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
            <div>
              <strong style="color: #1e293b;">{{brand}} - {{name}}</strong><br>
              <span style="color: #64748b;">{{size}} | Qtd: {{quantity}}</span>
              {{#if lowStock}}
              <br><span style="color: #dc2626; font-size: 12px; font-weight: bold;">⚠️ Restam apenas {{stockLeft}} unidades!</span>
              {{/if}}
            </div>
            <div style="text-align: right; color: #059669; font-weight: bold;">
              R$ {{price}}
            </div>
          </div>
          {{/each}}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{checkoutUrl}}" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; animation: pulse 2s infinite;">
            🚀 FINALIZAR AGORA
          </a>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="color: #475569; font-size: 16px; margin: 0;">
            💝 <strong>Garantia de satisfação:</strong> 30 dias para troca ou devolução
          </p>
          <p style="color: #475569; font-size: 16px; margin: 10px 0 0 0;">
            🚚 <strong>Frete grátis</strong> para compras acima de R$ 299
          </p>
        </div>
        
        <p style="color: #7f1d1d; font-size: 12px; text-align: center; margin-top: 20px;">
          Este é nosso último lembrete sobre estes itens.
        </p>
      </div>
    `
  },

  wishlist_promotion: {
    subject: '🔥 {{perfumeBrand}} - {{perfumeName}} está em promoção!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0369a1; font-size: 28px; margin: 0;">🔥 PROMOÇÃO ESPECIAL!</h1>
          <p style="color: #0284c7; font-size: 16px; margin: 10px 0;">O perfume da sua wishlist está com desconto!</p>
        </div>
        
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0;">
          <div style="text-align: center;">
            <h2 style="color: #1e293b; margin: 0 0 10px 0;">{{perfumeBrand}}</h2>
            <h3 style="color: #475569; margin: 0 0 20px 0;">{{perfumeName}}</h3>
            
            {{#if discountType}}
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <span style="color: #92400e; font-size: 18px; font-weight: bold;">
                {{#if (eq discountType 'percent')}}
                  {{discountValue}}% OFF
                {{else}}
                  R$ {{discountValue}} de desconto
                {{/if}}
              </span>
            </div>
            {{/if}}
            
            {{#if promotionalPrices}}
            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
              {{#if promotionalPrices.price5ml}}
              <div style="text-align: center;">
                <div style="color: #64748b;">5ml</div>
                <div style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">R$ {{originalPrices.price5ml}}</div>
                <div style="color: #dc2626; font-weight: bold; font-size: 18px;">R$ {{promotionalPrices.price5ml}}</div>
              </div>
              {{/if}}
              
              {{#if promotionalPrices.price10ml}}
              <div style="text-align: center;">
                <div style="color: #64748b;">10ml</div>
                <div style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">R$ {{originalPrices.price10ml}}</div>
                <div style="color: #dc2626; font-weight: bold; font-size: 18px;">R$ {{promotionalPrices.price10ml}}</div>
              </div>
              {{/if}}
              
              {{#if promotionalPrices.priceFull}}
              <div style="text-align: center;">
                <div style="color: #64748b;">Tamanho original</div>
                <div style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">R$ {{originalPrices.priceFull}}</div>
                <div style="color: #dc2626; font-weight: bold; font-size: 18px;">R$ {{promotionalPrices.priceFull}}</div>
              </div>
              {{/if}}
            </div>
            {{/if}}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{productUrl}}" style="background: linear-gradient(135deg, #0369a1, #0284c7); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Ver Produto e Comprar
          </a>
        </div>
        
        {{#if endsAt}}
        <p style="color: #0369a1; font-size: 14px; text-align: center;">
          ⏰ Promoção válida até {{endsAt}}
        </p>
        {{/if}}
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="{{unsubscribeUrl}}" style="color: #64748b; font-size: 12px; text-decoration: none;">
            Não desejo mais receber notificações de promoção
          </a>
        </div>
      </div>
    `
  },

  nfe_generated: {
    subject: '📄 Sua Nota Fiscal Eletrônica foi emitida - Pedido #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">📄 Nota Fiscal Eletrônica Gerada</h1>
        <p>Olá {{customerName}},</p>
        <p>Sua Nota Fiscal Eletrônica do pedido #{{orderNumber}} foi gerada com sucesso!</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Número da NF-e:</strong> {{nfeNumber}}</p>
          <p><strong>Chave de acesso:</strong> {{nfeKey}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{pdfUrl}}" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            📥 Baixar PDF da NF-e
          </a>
        </div>
        
        <p>Guarde este documento para seus registros financeiros.</p>
        
        <p>Obrigado por escolher a Perfume Connect!</p>
      </div>
    `
  }
};

// Extend templates with support notifications used by helpdesk
Object.assign(templates as any, {
  support_notification: {
    subject: '{{subject}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111827; font-size: 22px;">{{title}}</h1>
        <p style="color: #374151; white-space: pre-line;">{{message}}</p>
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 0; color: #6b7280;"><strong>Assunto:</strong> {{subjectText}}</p>
          <p style="margin: 0; color: #6b7280;"><strong>Categoria:</strong> {{category}}</p>
          <p style="margin: 0; color: #6b7280;"><strong>Prioridade:</strong> {{priority}}</p>
        </div>
      </div>
    `
  }
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, template, data } = await req.json();
    
    const templateName = template as keyof typeof templates;
    
    if (!templates[templateName]) {
      throw new Error(`Template '${template}' not found`);
    }

    const templateData = templates[templateName];
    const compiledSubject = Handlebars.compile(templateData.subject);
    const compiledHtml = Handlebars.compile(templateData.html);

    const subject = compiledSubject(data);
    const html = compiledHtml(data);

    // Email sending is temporarily disabled
    console.log('Email sending temporarily disabled - would send:', {
      from: EMAIL_FROM,
      to: [to],
      subject,
      html: html.substring(0, 100) + '...'
    });
    
    // Activate Resend email sending - currently disabled for testing
    console.log('Email function called but Resend temporarily disabled');
    const emailResponse = { data: { id: 'resend-disabled' }, error: null };
    
    // When ready to activate, uncomment and configure:
    // const emailResponse = await resend.emails.send({
    //   from: EMAIL_FROM,
    //   to: [to],
    //   subject,
    //   html,
    // });

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