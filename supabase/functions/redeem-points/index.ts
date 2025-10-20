import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, pointsToRedeem } = await req.json();

    if (!orderId || !pointsToRedeem || pointsToRedeem <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate user has enough points
    const { data: currentPoints, error: pointsError } = await supabase
      .rpc('get_user_points_balance', { user_uuid: user.id });

    if (pointsError) {
      console.error('Error getting user points:', pointsError);
      return new Response(JSON.stringify({ error: 'Error checking points balance' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (currentPoints < pointsToRedeem) {
      return new Response(JSON.stringify({ error: 'Insufficient points' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate discount (100 points = R$5)
    const discountAmount = pointsToRedeem * 0.05;

    // Add redemption transaction
    const { error: redeemError } = await supabase
      .rpc('add_points_transaction', {
        user_uuid: user.id,
        points_delta: -pointsToRedeem,
        transaction_source: 'redemption',
        transaction_description: `Resgate de ${pointsToRedeem} pontos (desconto R$ ${discountAmount.toFixed(2)})`,
        related_order_id: orderId
      });

    if (redeemError) {
      console.error('Error redeeming points:', redeemError);
      return new Response(JSON.stringify({ error: 'Error redeeming points' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} redeemed ${pointsToRedeem} points for R$ ${discountAmount.toFixed(2)} discount`);

    return new Response(JSON.stringify({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountAmount: discountAmount,
      message: `${pointsToRedeem} pontos resgatados com sucesso!`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in redeem-points function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});