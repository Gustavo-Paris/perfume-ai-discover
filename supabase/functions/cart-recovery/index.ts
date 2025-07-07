import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [CART-RECOVERY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Cart recovery function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Detectar carrinhos abandonados
    const { data: abandonedCarts, error: cartError } = await supabase
      .rpc('detect_abandoned_carts');

    if (cartError) {
      logStep("Error detecting abandoned carts", cartError);
      throw cartError;
    }

    logStep("Abandoned carts detected", { count: abandonedCarts?.length || 0 });

    let emailsSent = 0;
    let errorsCount = 0;

    // Processar cada carrinho abandonado
    for (const cart of abandonedCarts || []) {
      try {
        await processAbandonedCart(supabase, cart);
        emailsSent++;
      } catch (error) {
        errorsCount++;
        logStep("Error processing cart", { cartId: cart.cart_session_id, error });
      }
    }

    logStep("Cart recovery completed", { 
      totalCarts: abandonedCarts?.length || 0,
      emailsSent,
      errors: errorsCount 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: abandonedCarts?.length || 0,
        emailsSent,
        errors: errorsCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cart recovery", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Erro na recuperação de carrinho: ${errorMessage}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processAbandonedCart(supabase: any, cart: any) {
  const action = cart.recommended_action;
  const cartSessionId = cart.cart_session_id;
  
  logStep("Processing cart", { cartId: cartSessionId, action, priority: cart.priority_score });

  // Buscar dados do carrinho e itens
  const { data: cartItems, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      *,
      perfumes (
        name,
        brand,
        price_5ml,
        price_10ml,
        price_full
      )
    `)
    .eq('user_id', cart.user_id);

  if (itemsError) throw itemsError;

  if (!cartItems || cartItems.length === 0) {
    logStep("No cart items found, skipping", { cartId: cartSessionId });
    return;
  }

  // Preparar dados dos itens
  const items = cartItems.map(item => ({
    name: item.perfumes.name,
    brand: item.perfumes.brand,
    size: `${item.size_ml}ml`,
    quantity: item.quantity,
    price: getItemPrice(item.perfumes, item.size_ml).toFixed(2).replace('.', ','),
    originalPrice: getItemPrice(item.perfumes, item.size_ml).toFixed(2).replace('.', ',')
  }));

  const totalValue = cartItems.reduce((sum, item) => 
    sum + (getItemPrice(item.perfumes, item.size_ml) * item.quantity), 0
  );

  // Buscar dados do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', cart.user_id)
    .single();

  if (!profile?.email) {
    logStep("No user email found, skipping", { cartId: cartSessionId });
    return;
  }

  let emailTemplate: string;
  let emailData: any = {
    customerName: profile.name || 'Cliente',
    items,
    totalValue: totalValue.toFixed(2).replace('.', ','),
    checkoutUrl: `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').replace('supabase.co', 'lovable.app')}/checkout`
  };

  // Determinar template e dados baseado na ação recomendada
  switch (action) {
    case 'first_reminder':
      emailTemplate = 'cart_abandoned_first';
      break;
      
    case 'discount_offer':
      emailTemplate = 'cart_abandoned_discount';
      const discountPercent = 10; // 10% de desconto
      const discountCode = generateDiscountCode();
      
      // Criar cupom de desconto
      await createDiscountCoupon(supabase, discountCode, discountPercent);
      
      emailData = {
        ...emailData,
        discountPercent,
        discountCode,
        originalTotal: totalValue.toFixed(2).replace('.', ','),
        discountTotal: (totalValue * 0.9).toFixed(2).replace('.', ','),
        savings: (totalValue * 0.1).toFixed(2).replace('.', ','),
        items: items.map(item => ({
          ...item,
          discountPrice: (parseFloat(item.price.replace(',', '.')) * 0.9).toFixed(2).replace('.', ',')
        }))
      };
      break;
      
    case 'final_reminder':
      emailTemplate = 'cart_abandoned_final';
      // Adicionar informações de estoque baixo (simulado)
      emailData.items = items.map(item => ({
        ...item,
        lowStock: Math.random() > 0.7, // 30% chance de estoque baixo
        stockLeft: Math.floor(Math.random() * 5) + 1
      }));
      break;
      
    default:
      logStep("Unknown action, skipping", { action, cartId: cartSessionId });
      return;
  }

  // Criar tentativa de recuperação
  const { error: attemptError } = await supabase
    .rpc('create_cart_recovery_attempt', {
      cart_session_uuid: cartSessionId,
      recovery_type_param: action,
      subject_param: null,
      message_param: null,
      discount_offered_param: action === 'discount_offer' ? 10 : 0,
      discount_code_param: action === 'discount_offer' ? emailData.discountCode : null
    });

  if (attemptError) {
    logStep("Error creating recovery attempt", attemptError);
  }

  // Enviar email
  const { error: emailError } = await supabase.functions.invoke('send-email', {
    body: {
      to: profile.email,
      template: emailTemplate,
      data: emailData
    }
  });

  if (emailError) {
    logStep("Error sending recovery email", emailError);
    throw emailError;
  }

  logStep("Recovery email sent successfully", { 
    cartId: cartSessionId, 
    template: emailTemplate,
    to: profile.email 
  });
}

function getItemPrice(perfume: any, sizeML: number): number {
  switch (sizeML) {
    case 5:
      return perfume.price_5ml || (perfume.price_full * 0.1);
    case 10:
      return perfume.price_10ml || (perfume.price_full * 0.2);
    default:
      return perfume.price_full;
  }
}

function generateDiscountCode(): string {
  return 'VOLTA' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createDiscountCoupon(supabase: any, code: string, discountPercent: number) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Válido por 24 horas

  const { error } = await supabase
    .from('coupons')
    .insert({
      code,
      type: 'percent',
      value: discountPercent,
      max_uses: 1,
      expires_at: expiresAt.toISOString(),
      min_order_value: 0
    });

  if (error) {
    logStep("Error creating discount coupon", { code, error });
  }
}