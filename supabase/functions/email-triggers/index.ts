import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, payload } = await req.json();
    
    console.log('Email trigger received:', type, payload);

    switch (type) {
      case 'order_created':
        await handleOrderCreated(supabase, payload);
        break;
      case 'payment_approved':
        await handlePaymentApproved(supabase, payload);
        break;
      case 'shipping_label':
        await handleShippingLabel(supabase, payload);
        break;
      case 'order_delivered':
        await handleOrderDelivered(supabase, payload);
        break;
      case 'review_approved':
        await handleReviewApproved(supabase, payload);
        break;
      case 'stock_alert':
        await handleStockAlert(supabase, payload);
        break;
      default:
        throw new Error(`Unknown trigger type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in email-triggers function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

async function handleOrderCreated(supabase: any, orderId: string) {
  // Get order details with items and user info
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        perfumes (name, brand)
      ),
      profiles (name, email)
    `)
    .eq('id', orderId)
    .single();

  if (!order) return;

  const items = order.order_items.map((item: any) => ({
    name: item.perfumes.name,
    brand: item.perfumes.brand,
    quantity: item.quantity,
    size: `${item.size_ml}ml`,
    price: item.total_price
  }));

  await sendEmailViaFunction({
    to: order.profiles.email,
    template: 'order_confirmed',
    data: {
      orderNumber: order.order_number,
      customerName: order.profiles.name,
      items,
      total: order.total_amount,
      shippingAddress: order.address_data
    }
  });
}

async function handlePaymentApproved(supabase: any, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, profiles (name, email)')
    .eq('id', orderId)
    .single();

  if (!order) return;

  await sendEmailViaFunction({
    to: order.profiles.email,
    template: 'payment_approved',
    data: {
      orderNumber: order.order_number,
      customerName: order.profiles.name,
      total: order.total_amount,
      paymentMethod: order.payment_method
    }
  });
}

async function handleShippingLabel(supabase: any, shipmentId: string) {
  const { data: shipment } = await supabase
    .from('shipments')
    .select(`
      *,
      orders (
        order_number,
        profiles (name, email)
      )
    `)
    .eq('id', shipmentId)
    .single();

  if (!shipment) return;

  await sendEmailViaFunction({
    to: shipment.orders.profiles.email,
    template: 'shipping_label',
    data: {
      orderNumber: shipment.orders.order_number,
      customerName: shipment.orders.profiles.name,
      trackingCode: shipment.tracking_code,
      shippingService: shipment.service_name,
      estimatedDays: shipment.estimated_delivery_days
    }
  });
}

async function handleOrderDelivered(supabase: any, shipmentId: string) {
  const { data: shipment } = await supabase
    .from('shipments')
    .select(`
      *,
      orders (
        order_number,
        profiles (name, email)
      )
    `)
    .eq('id', shipmentId)
    .single();

  if (!shipment) return;

  await sendEmailViaFunction({
    to: shipment.orders.profiles.email,
    template: 'order_delivered',
    data: {
      orderNumber: shipment.orders.order_number,
      customerName: shipment.orders.profiles.name,
      trackingCode: shipment.tracking_code
    }
  });
}

async function handleReviewApproved(supabase: any, reviewId: string) {
  const { data: review } = await supabase
    .from('reviews')
    .select(`
      *,
      perfumes (name, brand),
      profiles (name, email)
    `)
    .eq('id', reviewId)
    .single();

  if (!review) return;

  await sendEmailViaFunction({
    to: review.profiles.email,
    template: 'review_approved',
    data: {
      customerName: review.profiles.name,
      perfumeName: review.perfumes.name,
      perfumeBrand: review.perfumes.brand,
      pointsEarned: 20
    }
  });
}

async function handleStockAlert(supabase: any, lotId: string) {
  const { data: lot } = await supabase
    .from('inventory_lots')
    .select(`
      *,
      perfumes (name, brand),
      warehouses (name)
    `)
    .eq('id', lotId)
    .single();

  if (!lot) return;

  // Get admin emails
  const { data: admins } = await supabase
    .from('user_roles')
    .select('profiles (email)')
    .eq('role', 'admin');

  for (const admin of admins || []) {
    await sendEmailViaFunction({
      to: admin.profiles.email,
      template: 'stock_alert_admin',
      data: {
        perfumeName: lot.perfumes.name,
        perfumeBrand: lot.perfumes.brand,
        remainingStock: lot.qty_ml,
        warehouseName: lot.warehouses.name
      }
    });
  }
}

async function sendEmailViaFunction(emailData: any) {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}

serve(handler);