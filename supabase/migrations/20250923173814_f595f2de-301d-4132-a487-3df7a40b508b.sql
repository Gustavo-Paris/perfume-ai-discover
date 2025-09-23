-- Criar função RPC para buscar pedidos com informações completas dos perfumes
CREATE OR REPLACE FUNCTION get_user_orders_with_perfumes(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    order_number text,
    total_amount numeric,
    subtotal numeric,
    shipping_cost numeric,
    status text,
    payment_method text,
    payment_status text,
    transaction_id text,
    shipping_service text,
    shipping_deadline integer,
    address_data jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.user_id,
        o.order_number,
        o.total_amount,
        o.subtotal,
        o.shipping_cost,
        o.status,
        o.payment_method,
        o.payment_status,
        o.transaction_id,
        o.shipping_service,
        o.shipping_deadline,
        o.address_data,
        o.created_at,
        o.updated_at,
        -- Agregar os order_items com informações dos perfumes em JSON
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'order_id', oi.order_id,
                    'perfume_id', oi.perfume_id,
                    'size_ml', oi.size_ml,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price,
                    'created_at', oi.created_at,
                    'perfume', jsonb_build_object(
                        'id', p.id,
                        'name', p.name,
                        'brand', p.brand,
                        'image_url', p.image_url
                    )
                ) ORDER BY oi.created_at
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::jsonb
        ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN perfumes p ON oi.perfume_id = p.id
    WHERE o.user_id = p_user_id
    GROUP BY o.id, o.user_id, o.order_number, o.total_amount, o.subtotal, 
             o.shipping_cost, o.status, o.payment_method, o.payment_status, 
             o.transaction_id, o.shipping_service, o.shipping_deadline, 
             o.address_data, o.created_at, o.updated_at
    ORDER BY o.created_at DESC;
END;
$$;