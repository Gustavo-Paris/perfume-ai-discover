-- Drop ALL existing triggers and functions that could use net.http_post
DROP TRIGGER IF EXISTS award_order_points_trigger ON orders;
DROP TRIGGER IF EXISTS auto_generate_nfe_trigger ON orders;
DROP TRIGGER IF EXISTS send_order_confirmation_trigger ON orders; 
DROP TRIGGER IF EXISTS send_payment_approval_trigger ON orders;
DROP TRIGGER IF EXISTS send_shipping_label_trigger ON shipments;
DROP TRIGGER IF EXISTS send_delivery_trigger ON shipments;

-- Drop all problematic functions completely
DROP FUNCTION IF EXISTS auto_generate_nfe() CASCADE;
DROP FUNCTION IF EXISTS send_order_confirmation_email() CASCADE;
DROP FUNCTION IF EXISTS send_payment_approval_email() CASCADE;
DROP FUNCTION IF EXISTS send_shipping_label_email() CASCADE;
DROP FUNCTION IF EXISTS send_delivery_email() CASCADE;
DROP FUNCTION IF EXISTS trigger_email_notification(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS award_order_points() CASCADE;
DROP FUNCTION IF EXISTS award_order_points_simple() CASCADE;

-- Create a minimal function that only awards points (no HTTP calls)
CREATE OR REPLACE FUNCTION public.award_order_points_safe()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points, no HTTP calls
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    PERFORM public.add_points_transaction(
      NEW.user_id,
      FLOOR(NEW.total_amount)::INTEGER,
      'order_paid',
      'Pontos ganhos com pedido #' || NEW.order_number,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the safe trigger
CREATE TRIGGER award_order_points_safe_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_order_points_safe();