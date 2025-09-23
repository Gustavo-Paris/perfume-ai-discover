
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          perfumes (
            id,
            name,
            brand
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Pedido não encontrado')
    }

    // Check if shipment already exists
    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (existingShipment && existingShipment.pdf_url) {
      return new Response(
        JSON.stringify({
          success: true,
          shipment: existingShipment,
          melhor_envio_data: {
            cart_id: existingShipment.melhor_envio_cart_id,
            tracking_code: existingShipment.tracking_code,
            pdf_url: existingShipment.pdf_url
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODO SANDBOX/MOCK - Simular criação de etiqueta
    console.log('Simulando criação de etiqueta para pedido:', order.order_number)

    // Generate mock data
    const mockCartId = `MOCK_${Date.now()}`
    const mockTrackingCode = `BR${order.order_number}${Math.random().toString(36).substring(2, 8).toUpperCase()}BR`
    const mockPdfUrl = `https://sandbox.melhorenvio.com.br/api/v2/me/shipment/print/${mockCartId}.pdf`

    // Create or update shipment record
    const shipmentData = {
      order_id: orderId,
      melhor_envio_cart_id: mockCartId,
      melhor_envio_shipment_id: mockCartId,
      tracking_code: mockTrackingCode,
      pdf_url: mockPdfUrl,
      status: 'label_printed',
      service_name: order.shipping_service || 'PAC',
      service_price: order.shipping_cost,
      estimated_delivery_days: order.shipping_deadline || 5
    }

    let shipmentResult
    if (existingShipment) {
      const { data, error } = await supabase
        .from('shipments')
        .update(shipmentData)
        .eq('id', existingShipment.id)
        .select()
        .single()
      
      shipmentResult = { data, error }
    } else {
      const { data, error } = await supabase
        .from('shipments')
        .insert(shipmentData)
        .select()
        .single()
      
      shipmentResult = { data, error }
    }

    if (shipmentResult.error) {
      console.error('Database error:', shipmentResult.error)
      throw new Error('Erro ao salvar dados da remessa')
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', orderId)

    console.log('Etiqueta simulada criada com sucesso:', mockTrackingCode)

    return new Response(
      JSON.stringify({
        success: true,
        shipment: shipmentResult.data,
        melhor_envio_data: {
          cart_id: mockCartId,
          tracking_code: mockTrackingCode,
          pdf_url: mockPdfUrl
        },
        mock: true,
        message: 'Etiqueta simulada criada (modo sandbox)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in me-buy-label:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs para mais detalhes'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
