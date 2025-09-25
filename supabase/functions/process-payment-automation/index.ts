import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPaymentRequest {
  order_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id }: ProcessPaymentRequest = await req.json();
    
    console.log('Processing payment automation for order:', order_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Order payment not confirmed');
    }

    const tasks = [];
    const results: any = {
      order_id: order_id,
      tasks_completed: []
    };

    // Task 1: Generate NFe automatically
    tasks.push(async () => {
      try {
        console.log('Auto-generating NF-e...');
        const { data: nfeResult, error: nfeError } = await supabase.functions.invoke('generate-nfe', {
          body: { order_id: order_id }
        });

        if (nfeError) {
          throw nfeError;
        }

        results.tasks_completed.push({
          task: 'nfe_generation',
          success: true,
          data: nfeResult
        });
        
        console.log('NF-e generated successfully');
        return nfeResult;
      } catch (error) {
        console.error('NF-e generation failed:', error);
        results.tasks_completed.push({
          task: 'nfe_generation',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    // Task 2: Send order confirmation email
    tasks.push(async () => {
      try {
        console.log('Sending order confirmation email...');
        
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            *,
            perfume:perfumes (
              id, name, brand
            )
          `)
          .eq('order_id', order_id);

        const emailData = {
          orderNumber: order.order_number,
          customerName: order.address_data?.name || 'Cliente',
          items: orderItems?.map((item: any) => ({
            name: item.perfume.name,
            brand: item.perfume.brand,
            quantity: item.quantity,
            size: `${item.size_ml}ml`,
            price: item.total_price
          })) || [],
          total: order.total_amount,
          shippingAddress: order.address_data
        };

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: order.address_data?.email || order.user_email,
            template: 'order_confirmed',
            data: emailData
          }
        });

        if (emailError) {
          throw emailError;
        }

        results.tasks_completed.push({
          task: 'confirmation_email',
          success: true,
          data: emailResult
        });

        console.log('Confirmation email sent successfully');
        return emailResult;
      } catch (error) {
        console.error('Confirmation email failed:', error);
        results.tasks_completed.push({
          task: 'confirmation_email',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't throw here - email failure shouldn't break the flow
      }
    });

    // Task 3: Update order status to processing
    tasks.push(async () => {
      try {
        console.log('Updating order status to processing...');
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id);

        if (updateError) {
          throw updateError;
        }

        results.tasks_completed.push({
          task: 'order_status_update',
          success: true
        });

        console.log('Order status updated to processing');
      } catch (error) {
        console.error('Order status update failed:', error);
        results.tasks_completed.push({
          task: 'order_status_update',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't throw here - this shouldn't break the flow
      }
    });

    // Execute all tasks
    await Promise.allSettled(tasks.map(task => task()));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment automation completed',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in payment automation:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});