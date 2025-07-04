import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
}

interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    tracking?: string;
    order_id?: string;
  };
}

async function validateSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request for webhook validation/handshake - do this FIRST
  if (req.method === 'GET') {
    return new Response('Webhook live', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookSecret = Deno.env.get('MELHOR_ENVIO_WEBHOOK_SECRET');
    if (!webhookSecret && req.method === 'POST') {
      console.error('MELHOR_ENVIO_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Get request body and signature
    const body = await req.text();
    
    // Only validate signature for POST requests
    if (req.method === 'POST') {
      const signature = req.headers.get('x-signature');

      if (!signature) {
        console.error('Missing x-signature header');
        return new Response('Missing signature header', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Validate signature
      const isValid = await validateSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { 
          status: 401,
          headers: corsHeaders 
        });
      }
    }

    // Parse webhook payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError);
      return new Response('Invalid JSON payload', { 
        status: 400,
        headers: corsHeaders 
      });
    }
    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    const { event, data } = payload;

    // Process different webhook events
    switch (event) {
      case 'shipment.posted': {
        console.log('Processing shipment.posted event for shipment:', data.id);
        
        // Update shipment status to 'shipped'
        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ 
            status: 'shipped',
            updated_at: new Date().toISOString()
          })
          .eq('melhor_envio_shipment_id', data.id);

        if (shipmentError) {
          console.error('Error updating shipment status:', shipmentError);
          return new Response('Error updating shipment', { 
            status: 500,
            headers: corsHeaders 
          });
        }

        console.log('Shipment status updated to shipped');
        break;
      }

      case 'shipment.delivered': {
        console.log('Processing shipment.delivered event for shipment:', data.id);
        
        // Get shipment and related order
        const { data: shipment, error: getError } = await supabase
          .from('shipments')
          .select(`
            *,
            orders!inner(
              id,
              user_id,
              status
            )
          `)
          .eq('melhor_envio_shipment_id', data.id)
          .single();

        if (getError || !shipment) {
          console.error('Error getting shipment:', getError);
          return new Response('Shipment not found', { 
            status: 404,
            headers: corsHeaders 
          });
        }

        // Update shipment status to 'delivered'
        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ 
            status: 'delivered',
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        if (shipmentError) {
          console.error('Error updating shipment status:', shipmentError);
          return new Response('Error updating shipment', { 
            status: 500,
            headers: corsHeaders 
          });
        }

        // Update order status to 'delivered'
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'delivered',
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.orders.id);

        if (orderError) {
          console.error('Error updating order status:', orderError);
          return new Response('Error updating order', { 
            status: 500,
            headers: corsHeaders 
          });
        }

        // Add 20 loyalty points to user profile
        const { data: profile, error: getProfileError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', shipment.orders.user_id)
          .single();

        if (getProfileError) {
          console.error('Error getting user profile:', getProfileError);
        } else {
          const newPoints = (profile.points || 0) + 20;
          
          const { error: pointsError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', shipment.orders.user_id);

          if (pointsError) {
            console.error('Error updating loyalty points:', pointsError);
          } else {
            console.log(`Added 20 loyalty points to user ${shipment.orders.user_id}. New total: ${newPoints}`);
          }
        }

        console.log('Delivery processed successfully');
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
        break;
    }

    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
})