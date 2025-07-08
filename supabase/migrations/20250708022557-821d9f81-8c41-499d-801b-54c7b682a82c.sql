-- Atualizar constraint para permitir tipo de notificação de suporte
ALTER TABLE public.notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'stock_alert'::text,
  'order_update'::text, 
  'review_approved'::text,
  'system'::text,
  'new_support_chat'::text,
  'wishlist_promotion'::text
]));