
-- ORDERS
DROP TRIGGER IF EXISTS trg_orders_set_order_number ON public.orders;
CREATE TRIGGER trg_orders_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();

DROP TRIGGER IF EXISTS trg_orders_touch_updated_at ON public.orders;
CREATE TRIGGER trg_orders_touch_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();

DROP TRIGGER IF EXISTS trg_orders_email_after_insert ON public.orders;
CREATE TRIGGER trg_orders_email_after_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.send_order_confirmation_email();

DROP TRIGGER IF EXISTS trg_orders_payment_approval_email ON public.orders;
CREATE TRIGGER trg_orders_payment_approval_email
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.send_payment_approval_email();

DROP TRIGGER IF EXISTS trg_orders_award_points ON public.orders;
CREATE TRIGGER trg_orders_award_points
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.award_order_points();


-- SHIPMENTS
DROP TRIGGER IF EXISTS trg_shipments_touch_updated_at ON public.shipments;
CREATE TRIGGER trg_shipments_touch_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_shipments_updated_at();

DROP TRIGGER IF EXISTS trg_shipments_label_email ON public.shipments;
CREATE TRIGGER trg_shipments_label_email
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.send_shipping_label_email();

DROP TRIGGER IF EXISTS trg_shipments_delivery_email ON public.shipments;
CREATE TRIGGER trg_shipments_delivery_email
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.send_delivery_email();


-- REVIEWS
DROP TRIGGER IF EXISTS trg_reviews_touch_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_touch_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_award_points ON public.reviews;
CREATE TRIGGER trg_reviews_award_points
AFTER UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.award_review_points();

DROP TRIGGER IF EXISTS trg_reviews_send_approval_email ON public.reviews;
CREATE TRIGGER trg_reviews_send_approval_email
AFTER UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.send_review_approval_email();


-- PROMOTIONS
DROP TRIGGER IF EXISTS trg_promotions_touch_updated_at ON public.promotions;
CREATE TRIGGER trg_promotions_touch_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_promotions_updated_at();

DROP TRIGGER IF EXISTS trg_promotions_notify_wishlist ON public.promotions;
CREATE TRIGGER trg_promotions_notify_wishlist
AFTER INSERT OR UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.notify_wishlist_promotion();


-- SUPPORT CONVERSATIONS
DROP TRIGGER IF EXISTS trg_support_conversations_touch_updated_at ON public.support_conversations;
CREATE TRIGGER trg_support_conversations_touch_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_support_conversations_updated_at();


-- WISHLIST COLLECTIONS
DROP TRIGGER IF EXISTS trg_wishlist_collections_touch_updated_at ON public.wishlist_collections;
CREATE TRIGGER trg_wishlist_collections_touch_updated_at
BEFORE UPDATE ON public.wishlist_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_collections_updated_at();


-- PERFUME COMPARISONS
DROP TRIGGER IF EXISTS trg_perfume_comparisons_touch_updated_at ON public.perfume_comparisons;
CREATE TRIGGER trg_perfume_comparisons_touch_updated_at
BEFORE UPDATE ON public.perfume_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_perfume_comparisons_updated_at();
