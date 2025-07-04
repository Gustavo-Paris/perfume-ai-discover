-- Add email notification triggers for existing functionality

-- Function to trigger email notifications
CREATE OR REPLACE FUNCTION public.trigger_email_notification(
  notification_type TEXT,
  record_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the email-triggers edge function
  PERFORM net.http_post(
    url := 'https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/email-triggers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
    ),
    body := jsonb_build_object(
      'type', notification_type,
      'payload', record_id::text
    )
  );
END;
$$;

-- Update order creation trigger to include email
CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send email notification
  PERFORM public.trigger_email_notification('order_created', NEW.id);
  RETURN NEW;
END;
$$;

-- Update payment approval trigger to include email
CREATE OR REPLACE FUNCTION public.send_payment_approval_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send email when payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    PERFORM public.trigger_email_notification('payment_approved', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Update shipping label trigger to include email
CREATE OR REPLACE FUNCTION public.send_shipping_label_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send email when tracking code is added
  IF NEW.tracking_code IS NOT NULL AND OLD.tracking_code IS NULL THEN
    PERFORM public.trigger_email_notification('shipping_label', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Update delivery trigger to include email
CREATE OR REPLACE FUNCTION public.send_delivery_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send email when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    PERFORM public.trigger_email_notification('order_delivered', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Update review approval trigger to include email
CREATE OR REPLACE FUNCTION public.send_review_approval_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Send email when review status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM public.trigger_email_notification('review_approved', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER send_order_confirmation_email_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_order_confirmation_email();

CREATE TRIGGER send_payment_approval_email_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_payment_approval_email();

CREATE TRIGGER send_shipping_label_email_trigger
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_shipping_label_email();

CREATE TRIGGER send_delivery_email_trigger
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_delivery_email();

CREATE TRIGGER send_review_approval_email_trigger
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.send_review_approval_email();