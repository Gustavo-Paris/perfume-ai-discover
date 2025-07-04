import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateCouponRequest {
  code: string;
  orderTotal: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Usuário não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { code, orderTotal }: ValidateCouponRequest = await req.json();

    if (!code || orderTotal == null) {
      throw new Error('Código do cupom e valor do pedido são obrigatórios');
    }

    console.log('Validating coupon:', { code, orderTotal, userId: user.id });

    // Call the validate_coupon function
    const { data: validationResult, error } = await supabase
      .rpc('validate_coupon', {
        coupon_code: code,
        order_total: orderTotal,
        user_uuid: user.id
      });

    if (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }

    console.log('Coupon validation result:', validationResult);

    return new Response(JSON.stringify(validationResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in validate-coupon function:', error);
    
    return new Response(JSON.stringify({ 
      valid: false,
      error: error.message || 'Erro ao validar cupom'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);