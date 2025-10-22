import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ProcessPaymentRequest {
  order_id: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ========== PAYMENT AUTOMATION START ==========`);
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { order_id }: ProcessPaymentRequest = await req.json();
    console.log(`[${requestId}] Request body:`, { order_id });
    
    if (!order_id) {
      console.error(`[${requestId}] Missing order_id in request`);
      throw new Error('order_id is required');
    }
    
    console.log(`[${requestId}] Processing payment automation for order:`, order_id);

    console.log(`[${requestId}] Initializing Supabase client`);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get order details
    console.log(`[${requestId}] Fetching order details`);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error(`[${requestId}] Order fetch error:`, orderError);
      throw new Error('Order not found');
    }

    console.log(`[${requestId}] Order found:`, { 
      order_number: order.order_number, 
      payment_status: order.payment_status,
      status: order.status 
    });

    if (order.payment_status !== 'paid') {
      console.error(`[${requestId}] Order not paid:`, order.payment_status);
      throw new Error('Order payment not confirmed');
    }

    const tasks = [];
    const results: any = {
      order_id: order_id,
      tasks_completed: []
    };

    console.log(`[${requestId}] Starting 4 automation tasks in parallel`);
    
    // Task 1: Generate NFe automatically
    tasks.push(async () => {
      console.log(`[${requestId}] [Task 1/3] Starting NFe generation`);
      const startTime = Date.now();
      try {
        const { data: nfeResult, error: nfeError } = await supabase.functions.invoke('generate-nfe', {
          body: { order_id: order_id }
        });

        if (nfeError) {
          throw nfeError;
        }

        const duration = Date.now() - startTime;
        results.tasks_completed.push({
          task: 'nfe_generation',
          success: true,
          duration_ms: duration,
          data: nfeResult
        });
        
        console.log(`[${requestId}] [Task 1/3] ✅ NFe generated successfully in ${duration}ms`);
        return nfeResult;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[${requestId}] [Task 1/3] ❌ NFe generation failed after ${duration}ms:`, error);
        
        results.tasks_completed.push({
          task: 'nfe_generation',
          success: false,
          duration_ms: duration,
          error: errorMessage
        });
        
        // Create notifications for all admins about NFe failure
        try {
          console.log(`[${requestId}] Creating admin notifications for NFe failure`);
          const { data: adminRoles, error: adminError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');
          
          if (adminError) {
            console.error(`[${requestId}] Failed to fetch admin users:`, adminError);
          } else if (adminRoles && adminRoles.length > 0) {
            const notifications = adminRoles.map(admin => ({
              type: 'system',
              message: `Falha na geração automática de NFe para pedido ${order.order_number}`,
              user_id: admin.user_id,
              metadata: {
                order_id: order_id,
                order_number: order.order_number,
                error: errorMessage,
                request_id: requestId,
                retry_available: true,
                automation_context: true
              }
            }));
            
            const { error: notifError } = await supabase
              .from('notifications')
              .insert(notifications);
            
            if (notifError) {
              console.error(`[${requestId}] Failed to create admin notifications:`, notifError);
            } else {
              console.log(`[${requestId}] ✅ Created ${notifications.length} admin notification(s)`);
            }
          }
        } catch (notifError) {
          console.error(`[${requestId}] Error creating notifications:`, notifError);
        }
        
        throw error;
      }
    });

    // Task 2: Send order confirmation email
    tasks.push(async () => {
      console.log(`[${requestId}] [Task 2/3] Starting confirmation email`);
      const startTime = Date.now();
      try {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            *,
            perfume:perfumes (
              id, name, brand
            )
          `)
          .eq('order_id', order_id);

        console.log(`[${requestId}] [Task 2/3] Fetched ${orderItems?.length || 0} order items`);

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

        const emailTo = order.address_data?.email || order.user_email;
        console.log(`[${requestId}] [Task 2/3] Sending email to:`, emailTo);

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: emailTo,
            template: 'order_confirmed',
            data: emailData
          }
        });

        if (emailError) {
          throw emailError;
        }

        const duration = Date.now() - startTime;
        results.tasks_completed.push({
          task: 'confirmation_email',
          success: true,
          duration_ms: duration,
          data: emailResult
        });

        console.log(`[${requestId}] [Task 2/3] ✅ Email sent successfully in ${duration}ms`);
        return emailResult;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] [Task 2/3] ⚠️  Email failed after ${duration}ms:`, error);
        results.tasks_completed.push({
          task: 'confirmation_email',
          success: false,
          duration_ms: duration,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't throw here - email failure shouldn't break the flow
      }
    });

    // Task 3: Create shipping label automatically (FASE 2)
    tasks.push(async () => {
      console.log(`[${requestId}] [Task 3/4] Starting shipping label creation`);
      const startTime = Date.now();
      try {
        const { data: labelResult, error: labelError } = await supabase.functions.invoke('me-buy-label', {
          body: { orderId: order_id }
        });

        if (labelError) {
          throw labelError;
        }

        const duration = Date.now() - startTime;
        results.tasks_completed.push({
          task: 'shipping_label',
          success: true,
          duration_ms: duration,
          data: labelResult
        });
        
        console.log(`[${requestId}] [Task 3/4] ✅ Shipping label created successfully in ${duration}ms`);
        return labelResult;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[${requestId}] [Task 3/4] ❌ Shipping label creation failed after ${duration}ms:`, error);
        
        results.tasks_completed.push({
          task: 'shipping_label',
          success: false,
          duration_ms: duration,
          error: errorMessage
        });
        
        // Create admin notification for label failure
        try {
          console.log(`[${requestId}] Creating admin notifications for label failure`);
          const { data: adminRoles, error: adminError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');
          
          if (adminError) {
            console.error(`[${requestId}] Failed to fetch admin users:`, adminError);
          } else if (adminRoles && adminRoles.length > 0) {
            const notifications = adminRoles.map(admin => ({
              type: 'system',
              message: `Falha na criação automática de etiqueta para pedido ${order.order_number}`,
              user_id: admin.user_id,
              metadata: {
                order_id: order_id,
                order_number: order.order_number,
                error: errorMessage,
                request_id: requestId,
                retry_available: true,
                automation_context: true
              }
            }));
            
            const { error: notifError } = await supabase
              .from('notifications')
              .insert(notifications);
            
            if (notifError) {
              console.error(`[${requestId}] Failed to create admin notifications:`, notifError);
            } else {
              console.log(`[${requestId}] ✅ Created ${notifications.length} admin notification(s)`);
            }
          }
        } catch (notifError) {
          console.error(`[${requestId}] Error creating notifications:`, notifError);
        }
        
        // Don't throw - label failure shouldn't break the flow
      }
    });

    // Task 4: Update order status to processing
    tasks.push(async () => {
      console.log(`[${requestId}] [Task 4/4] Starting order status update`);
      const startTime = Date.now();
      try {
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

        const duration = Date.now() - startTime;
        results.tasks_completed.push({
          task: 'order_status_update',
          success: true,
          duration_ms: duration
        });

        console.log(`[${requestId}] [Task 4/4] ✅ Status updated to 'processing' in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] [Task 4/4] ⚠️  Status update failed after ${duration}ms:`, error);
        results.tasks_completed.push({
          task: 'order_status_update',
          success: false,
          duration_ms: duration,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't throw here - this shouldn't break the flow
      }
    });

    // Execute all tasks
    console.log(`[${requestId}] Waiting for all tasks to complete...`);
    const taskResults = await Promise.allSettled(tasks.map(task => task()));

    // Log summary
    const successCount = results.tasks_completed.filter((t: any) => t.success).length;
    const totalTasks = results.tasks_completed.length;
    console.log(`[${requestId}] Tasks completed: ${successCount}/${totalTasks} successful`);
    
    results.tasks_completed.forEach((task: any) => {
      const icon = task.success ? '✅' : '❌';
      console.log(`[${requestId}] ${icon} ${task.task}: ${task.success ? 'SUCCESS' : 'FAILED'} (${task.duration_ms}ms)`);
    });

    console.log(`[${requestId}] ========== PAYMENT AUTOMATION END ==========`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment automation completed',
        request_id: requestId,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] ❌ FATAL ERROR in payment automation:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.log(`[${requestId}] ========== PAYMENT AUTOMATION END (ERROR) ==========`);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        request_id: requestId,
        error: errorMessage,
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});