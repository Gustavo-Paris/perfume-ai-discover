
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { orderDraftId } = await req.json()

    if (!orderDraftId) {
      return new Response(
        JSON.stringify({ error: 'Order draft ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing shipping quote for order draft:', orderDraftId)

    // Get order draft with address data
    const { data: orderDraft, error: draftError } = await supabase
      .from('order_drafts')
      .select(`
        *,
        addresses (*)
      `)
      .eq('id', orderDraftId)
      .single()

    if (draftError || !orderDraft) {
      console.error('Error fetching order draft:', draftError)
      return new Response(
        JSON.stringify({ error: 'Rascunho de pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get cart items for the user
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (*)
      `)
      .eq('user_id', orderDraft.user_id)

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error('Error fetching cart items:', cartError)
      return new Response(
        JSON.stringify({ error: 'Itens do carrinho não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const address = orderDraft.addresses
    if (!address || !address.cep) {
      return new Response(
        JSON.stringify({ error: 'Endereço não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found address CEP:', address.cep)
    console.log('Found cart items:', cartItems.length)

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!melhorEnvioToken) {
      throw new Error('MELHOR_ENVIO_TOKEN not configured')
    }

    // Calculate total weight and dimensions from cart items
    let totalWeight = 0
    let totalValue = 0
    
    cartItems.forEach(item => {
      // Estimate weight based on perfume size (ml to grams conversion)
      const itemWeight = item.size_ml * 0.8 // 1ml of perfume ≈ 0.8g
      totalWeight += itemWeight * item.quantity
      
      // Calculate item price based on size
      let itemPrice = 0
      if (item.size_ml === 5) {
        itemPrice = item.perfumes.price_5ml || 0
      } else if (item.size_ml === 10) {
        itemPrice = item.perfumes.price_10ml || 0
      } else {
        itemPrice = item.perfumes.price_full || 0
      }
      totalValue += itemPrice * item.quantity
    })

    // Minimum weight and dimensions for perfume packaging
    const weight = Math.max(totalWeight, 100) // minimum 100g
    const length = 15 // cm
    const height = 10 // cm  
    const width = 10 // cm

    console.log('Calculated weight:', weight, 'grams')
    console.log('Calculated value:', totalValue)

    const quotePayload = {
      from: {
        postal_code: "01310-100" // São Paulo - SP (sandbox origin)
      },
      to: {
        postal_code: address.cep.replace(/\D/g, '') // Remove non-digits
      },
      products: [{
        id: "perfume-package",
        width: width,
        height: height,
        length: length,
        weight: weight / 1000, // convert to kg
        insurance_value: totalValue,
        quantity: 1
      }]
    }

    console.log('Sending quote payload to Melhor Envio:', JSON.stringify(quotePayload, null, 2))

    const response = await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'parisco.dev/0.1 (gustavo.b.paris@gmail.com)'
      },
      body: JSON.stringify(quotePayload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Melhor Envio API Error:', response.status, errorData)
      throw new Error(`Melhor Envio API error: ${response.status} - ${errorData}`)
    }

    const quotes = await response.json()
    console.log('Received quotes from Melhor Envio:', quotes)
    
    // Transform quotes to our format
    const formattedQuotes = quotes
      .filter(quote => quote.error === null || quote.error === undefined)
      .map(quote => ({
        service: quote.name,
        company: quote.company.name,
        price: parseFloat(quote.price),
        deadline: parseInt(quote.delivery_time),
        service_id: quote.id,
        company_id: quote.company.id
      }))

    console.log('Returning formatted quotes:', formattedQuotes)

    return new Response(
      JSON.stringify({ quotes: formattedQuotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in shipping-quote:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
