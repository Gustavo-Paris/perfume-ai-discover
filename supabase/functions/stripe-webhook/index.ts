import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const log = (step: string, details?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [STRIPE-WEBHOOK] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

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

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabaseService
      .from("payment_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      log("Duplicate event detected, skipping", { event_id: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

        // Log successful payment event
        await supabaseService.from("payment_events").insert({
          type: event.type,
          event_id: event.id,
          transaction_id: session.id,
          payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          status: "succeeded",
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "brl",
          raw_event: event,
        });

        return new Response(JSON.stringify({ received: true, result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle payment failures
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const tx = pi.id;
        const failureMessage = pi.last_payment_error?.message || "Payment failed";
        log("Payment failed", { payment_intent: tx, reason: failureMessage });

        // Find matching order
        const { data: failedOrder } = await supabaseService
          .from("orders")
          .select("id, user_id")
          .or(`transaction_id.eq.${tx},stripe_session_id.eq.${tx}`)
          .maybeSingle();

        if (failedOrder) {
          // Update order status
          await supabaseService
            .from("orders")
            .update({
              payment_status: "failed",
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedOrder.id);

          // Clean up reservations for this user
          await supabaseService
            .from("reservations")
            .delete()
            .eq("user_id", failedOrder.user_id);

          log("Order marked as failed and reservations cleaned", { orderId: failedOrder.id });
        }

        // Log payment event for audit
        await supabaseService.from("payment_events").insert({
          type: "payment_failed",
          event_id: event.id,
          payment_intent_id: tx,
          status: "failed",
          amount: pi.amount / 100, // Convert from cents
          currency: pi.currency,
          raw_event: event,
        });

        return new Response(JSON.stringify({ received: true, processed: !!failedOrder }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle expired checkout sessions (PIX timeout)
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        log("Checkout session expired", { session_id: sessionId });

        // Find and cancel order
        const { data: expiredOrder } = await supabaseService
          .from("orders")
          .select("id, user_id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (expiredOrder) {
          await supabaseService
            .from("orders")
            .update({
              payment_status: "expired",
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", expiredOrder.id);

          // Clean up reservations
          await supabaseService
            .from("reservations")
            .delete()
            .eq("user_id", expiredOrder.user_id);

          log("Expired session order cancelled", { orderId: expiredOrder.id });
        }

        // Log event
        await supabaseService.from("payment_events").insert({
          type: "session_expired",
          event_id: event.id,
          transaction_id: sessionId,
          status: "expired",
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "brl",
          raw_event: event,
        });

        return new Response(JSON.stringify({ received: true, processed: !!expiredOrder }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle charge failures
      case "charge.failed": {
        const charge = event.data.object as Stripe.Charge;
        log("Charge failed", { charge_id: charge.id, reason: charge.failure_message });

        await supabaseService.from("payment_events").insert({
          type: "charge_failed",
          event_id: event.id,
          charge_id: charge.id,
          payment_intent_id: typeof charge.payment_intent === "string" ? charge.payment_intent : null,
          status: "failed",
          amount: charge.amount / 100,
          currency: charge.currency,
          raw_event: event,
        });

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
