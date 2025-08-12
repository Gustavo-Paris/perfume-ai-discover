import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [STRIPE-WEBHOOK] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecret || !webhookSecret) {
      log("ERROR: Missing Stripe secrets", { hasSecretKey: !!stripeSecret, hasWebhookSecret: !!webhookSecret });
      return new Response(JSON.stringify({ error: "Stripe secrets not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    const payload = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature || "", webhookSecret);
    } catch (err) {
      log("ERROR: Invalid webhook signature", { message: err instanceof Error ? err.message : String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Event received", { id: event.id, type: event.type });

    // Supabase clients
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const confirmOrder = async (orderDraftId: string, transactionId: string, paymentMethod: "credit_card" | "pix" = "credit_card") => {
      log("Calling confirm-order", { orderDraftId, transactionId, paymentMethod });
      const { data, error } = await supabaseAnon.functions.invoke("confirm-order", {
        body: {
          orderDraftId,
          paymentData: {
            transaction_id: transactionId,
            payment_method: paymentMethod,
            status: "paid",
          },
        },
      });
      if (error) {
        log("ERROR: confirm-order failed", { message: error.message });
        return { success: false, error: error.message };
      }
      log("confirm-order success");
      return data;
    };

    const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
      const transactionId = session.id;
      const orderDraftId = (session.metadata && (session.metadata as any).order_draft_id) || null;

      // Try to detect payment method (fallback to credit_card)
      let paymentMethod: "credit_card" | "pix" = "credit_card";
      try {
        if (session.payment_intent && typeof session.payment_intent === "string") {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
          if ((pi.payment_method_types || []).includes("pix")) {
            paymentMethod = "pix";
          }
        } else if ((session.payment_method_types || []).includes("pix")) {
          // Not 100% accurate (available vs chosen), but reasonable fallback
          paymentMethod = "pix";
        }
      } catch (_e) {
        // ignore and keep default
      }

      // Idempotency guard: if an order already has this transaction_id, skip
      const { data: existingOrder } = await supabaseService
        .from("orders")
        .select("id")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (existingOrder) {
        log("Order already confirmed, skipping confirm-order", { orderId: existingOrder.id });
        return { skipped: true };
      }

      if (orderDraftId) {
        return await confirmOrder(orderDraftId, transactionId, paymentMethod);
      } else {
        // If no draft id, attempt to update any pending order created by checkout to paid (by stripe_session_id)
        const { data: pendingOrder } = await supabaseService
          .from("orders")
          .select("id")
          .eq("stripe_session_id", transactionId)
          .maybeSingle();

        if (pendingOrder) {
          const { error: updErr } = await supabaseService
            .from("orders")
            .update({
              payment_status: "paid",
              status: "paid",
              transaction_id: transactionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", pendingOrder.id);

          if (updErr) {
            log("ERROR: updating pending order", { message: updErr.message });
            return { success: false, error: updErr.message };
          }
          log("Pending order updated to paid", { orderId: pendingOrder.id });
          return { success: true };
        }

        log("No orderDraftId or pending order found; nothing to do");
        return { success: true, note: "no-op" };
      }
    };

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await handleCheckoutCompleted(session);
        return new Response(JSON.stringify({ received: true, result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Optional: mark failures
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const tx = pi.id;
        log("Payment failed", { payment_intent: tx });

        // Try to update any matching order
        await supabaseService
          .from("orders")
          .update({
            payment_status: "failed",
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .or(`transaction_id.eq.${tx},stripe_session_id.eq.${tx}`);

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default: {
        // Acknowledge unhandled events
        return new Response(JSON.stringify({ received: true, ignored: event.type }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    log("ERROR: Unhandled", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Webhook handler error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
