import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface CartRecoveryPayload {
  action: 'check_abandoned' | 'send_recovery' | 'schedule_reminders';
  cart_session_id?: string;
  recovery_type?: 'first_reminder' | 'discount_offer' | 'final_reminder';
}

// const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const payload: CartRecoveryPayload = await req.json();
    console.log('Cart recovery action:', payload.action);

    switch (payload.action) {
      case 'check_abandoned':
        return await checkAbandonedCarts();
      
      case 'send_recovery':
        if (!payload.cart_session_id || !payload.recovery_type) {
          throw new Error('cart_session_id and recovery_type are required');
        }
        return await sendRecoveryEmail(payload.cart_session_id, payload.recovery_type);
      
      case 'schedule_reminders':
        return await scheduleRecoveryReminders();
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in cart recovery:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function checkAbandonedCarts() {
  // Detectar carrinhos abandonados
  const { data: abandonedCarts, error } = await supabase
    .rpc('detect_abandoned_carts');

  if (error) {
    throw new Error(`Error detecting abandoned carts: ${error.message}`);
  }

  // Marcar carrinhos como abandonados no banco
  await supabase.rpc('mark_cart_as_abandoned');

  console.log(`Found ${abandonedCarts?.length || 0} abandoned carts`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      abandoned_carts_count: abandonedCarts?.length || 0,
      carts: abandonedCarts 
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function sendRecoveryEmail(cartSessionId: string, recoveryType: string) {
  console.log(`Sending ${recoveryType} email for cart session: ${cartSessionId}`);

  // Buscar dados do carrinho
  const { data: cartSession, error: cartError } = await supabase
    .from('cart_sessions')
    .select(`
      *,
      profiles:user_id (name, email)
    `)
    .eq('id', cartSessionId)
    .single();

  if (cartError || !cartSession) {
    throw new Error(`Cart session not found: ${cartError?.message}`);
  }

  const userEmail = cartSession.profiles?.email;
  const userName = cartSession.profiles?.name || 'Cliente';

  if (!userEmail) {
    throw new Error('User email not found');
  }

  // Buscar itens do carrinho para o usuário
  const { data: cartItems, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      *,
      perfumes (name, brand, image_url, price_full, price_5ml, price_10ml)
    `)
    .eq('user_id', cartSession.user_id);

  if (itemsError) {
    console.error('Error fetching cart items:', itemsError);
  }

  // Configurar email baseado no tipo de recuperação
  let subject: string;
  let emailContent: string;
  let discountCode: string | null = null;
  let discountAmount = 0;

  switch (recoveryType) {
    case 'first_reminder':
      subject = `${userName}, você esqueceu algo especial! 💎`;
      emailContent = generateFirstReminderEmail(userName, cartItems || []);
      break;
    
    case 'discount_offer':
      // Gerar cupom de desconto de 10%
      discountCode = `VOLTA${Date.now().toString().slice(-6)}`;
      discountAmount = 10;
      
      // Criar cupom no banco
      await supabase.from('coupons').insert({
        code: discountCode,
        type: 'percent',
        value: discountAmount,
        max_uses: 1,
        usage_per_user: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        is_active: true
      });

      subject = `${userName}, 10% OFF especial para você! 🎉`;
      emailContent = generateDiscountOfferEmail(userName, cartItems || [], discountCode);
      break;
    
    case 'final_reminder':
      subject = `${userName}, última chance! ⏰`;
      emailContent = generateFinalReminderEmail(userName, cartItems || []);
      break;
    
    default:
      throw new Error('Invalid recovery type');
  }

  // Enviar email
  // const emailResult = await resend.emails.send({
  //   from: 'Petit Charm <noreply@petitcharm.com>',
  //   to: [userEmail],
  //   subject,
  //   html: emailContent,
  // });

  // if (emailResult.error) {
  //   throw new Error(`Failed to send email: ${emailResult.error.message}`);
  // }

  console.log('Email sending temporarily disabled - would send:', { userEmail, subject });

  // Registrar tentativa de recuperação
  const { error: attemptError } = await supabase
    .rpc('create_cart_recovery_attempt', {
      cart_session_uuid: cartSessionId,
      recovery_type_param: recoveryType,
      subject_param: subject,
      message_param: emailContent,
      discount_offered_param: discountAmount,
      discount_code_param: discountCode
    });

  if (attemptError) {
    console.error('Error creating recovery attempt:', attemptError);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      email_sent: true,
      discount_code: discountCode 
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function scheduleRecoveryReminders() {
  console.log('Scheduling recovery reminders...');

  const { data: abandonedCarts, error } = await supabase
    .rpc('detect_abandoned_carts');

  if (error) {
    throw new Error(`Error detecting abandoned carts: ${error.message}`);
  }

  let processedCount = 0;

  for (const cart of abandonedCarts || []) {
    try {
      const action = cart.recommended_action;
      
      if (['first_reminder', 'discount_offer', 'final_reminder'].includes(action)) {
        await sendRecoveryEmail(cart.cart_session_id, action);
        processedCount++;
        
        // Adicionar delay para não sobrecarregar o sistema de emails
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing cart ${cart.cart_session_id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      processed_count: processedCount,
      total_abandoned: abandonedCarts?.length || 0
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

function generateFirstReminderEmail(userName: string, cartItems: any[]): string {
  const itemsHtml = cartItems.map(item => `
    <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
      <img src="${item.perfumes?.image_url || '/placeholder.jpg'}" 
           alt="${item.perfumes?.name}" 
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
      <div>
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${item.perfumes?.brand} - ${item.perfumes?.name}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">Quantidade: ${item.quantity} x ${item.size_ml}ml</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #d4347a;">
          R$ ${(item.perfumes?.price_full || 0).toFixed(2)}
        </p>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d4347a, #ff6b9d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Petit Charm 💎</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Você esqueceu algo especial!</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="color: #333; margin-bottom: 20px;">Olá, ${userName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Notamos que você deixou alguns perfumes incríveis no seu carrinho. 
          Que tal finalizar sua compra antes que esses tesouros sejam descobertos por outros?
        </p>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #d4347a; margin-bottom: 15px;">Seus Perfumes Selecionados:</h3>
          ${itemsHtml}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SITE_URL')}/carrinho" 
             style="background: linear-gradient(135deg, #d4347a, #ff6b9d); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Finalizar Compra Agora
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
          Este email foi enviado porque você tem itens em seu carrinho. 
          Se não deseja mais receber esses lembretes, <a href="#" style="color: #d4347a;">clique aqui</a>.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateDiscountOfferEmail(userName: string, cartItems: any[], discountCode: string): string {
  const itemsHtml = cartItems.map(item => `
    <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
      <img src="${item.perfumes?.image_url || '/placeholder.jpg'}" 
           alt="${item.perfumes?.name}" 
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
      <div>
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${item.perfumes?.brand} - ${item.perfumes?.name}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">Quantidade: ${item.quantity} x ${item.size_ml}ml</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #d4347a;">
          R$ ${(item.perfumes?.price_full || 0).toFixed(2)}
        </p>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d4347a, #ff6b9d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🎉 OFERTA ESPECIAL! 🎉</h1>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">10% OFF para você!</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="color: #333; margin-bottom: 20px;">Olá, ${userName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Como você demonstrou interesse em nossos perfumes, temos uma oferta especial: 
          <strong style="color: #d4347a;">10% de desconto</strong> em todo o seu pedido!
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #d4347a; margin: 0 0 10px 0;">Seu Cupom Exclusivo:</h3>
          <div style="background: white; padding: 15px; border: 2px dashed #d4347a; border-radius: 8px; font-size: 24px; font-weight: bold; color: #d4347a;">
            ${discountCode}
          </div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
            Válido por 7 dias • Uso único
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #d4347a; margin-bottom: 15px;">Seus Perfumes Selecionados:</h3>
          ${itemsHtml}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SITE_URL')}/carrinho" 
             style="background: linear-gradient(135deg, #d4347a, #ff6b9d); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Usar Cupom e Finalizar
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
          Oferta válida até ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}. 
          Não perca esta oportunidade!
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateFinalReminderEmail(userName: string, cartItems: any[]): string {
  const itemsHtml = cartItems.map(item => `
    <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
      <img src="${item.perfumes?.image_url || '/placeholder.jpg'}" 
           alt="${item.perfumes?.name}" 
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
      <div>
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${item.perfumes?.brand} - ${item.perfumes?.name}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">Quantidade: ${item.quantity} x ${item.size_ml}ml</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #d4347a;">
          R$ ${(item.perfumes?.price_full || 0).toFixed(2)}
        </p>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">⏰ ÚLTIMA CHANCE!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Seus perfumes estão esperando...</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
        <h2 style="color: #333; margin-bottom: 20px;">Olá, ${userName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Este é nosso último lembrete sobre os perfumes incríveis que você selecionou. 
          Não queremos que você perca essas fragrâncias especiais!
        </p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ff6b35; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-weight: bold;">
            ⚠️ Estoque limitado! Alguns itens podem não estar mais disponíveis se você esperar mais.
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #d4347a; margin-bottom: 15px;">Últimos itens reservados para você:</h3>
          ${itemsHtml}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SITE_URL')}/carrinho" 
             style="background: linear-gradient(135deg, #ff6b35, #ff8c42); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
            Garantir Meus Perfumes Agora
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
          Caso não deseje mais receber nossos lembretes, entendemos. 
          <a href="#" style="color: #d4347a;">Clique aqui</a> para não receber mais emails.
        </p>
        
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 15px;">
          Petit Charm - Perfumes únicos para pessoas especiais
        </p>
      </div>
    </body>
    </html>
  `;
}