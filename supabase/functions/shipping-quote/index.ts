
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
    console.log('Starting shipping quote function...')
    
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { orderDraftId } = await req.json()
    console.log('Order draft ID received:', orderDraftId)

    if (!orderDraftId) {
      console.log('Missing order draft ID')
      return new Response(
        JSON.stringify({ error: 'Order draft ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get order draft with address data
    console.log('Fetching order draft...')
    const { data: orderDraft, error: draftError } = await supabase
      .from('order_drafts')
      .select(`
        *,
        addresses (*)
      `)
      .eq('id', orderDraftId)
      .single()

    if (draftError) {
      console.error('Error fetching order draft:', draftError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar rascunho de pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!orderDraft) {
      console.log('Order draft not found')
      return new Response(
        JSON.stringify({ error: 'Rascunho de pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Order draft found:', orderDraft.id)

    // Get cart items for the user
    console.log('Fetching cart items for user:', orderDraft.user_id)
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (*)
      `)
      .eq('user_id', orderDraft.user_id)

    if (cartError) {
      console.error('Error fetching cart items:', cartError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar itens do carrinho' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!cartItems || cartItems.length === 0) {
      console.log('No cart items found')
      return new Response(
        JSON.stringify({ error: 'Nenhum item no carrinho' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Cart items found:', cartItems.length)

    const address = orderDraft.addresses
    if (!address || !address.cep) {
      console.log('Address not found or missing CEP')
      return new Response(
        JSON.stringify({ error: 'Endereço ou CEP não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Address CEP:', address.cep)

    // Check for local delivery settings
    const { data: localSettings, error: localError } = await supabase
      .from('local_delivery_settings')
      .select('*')
      .single()

    if (localError) {
      console.error('Error fetching local delivery settings:', localError)
    }

    // Check if delivery is local (same city)
    const isLocalDelivery = localSettings && 
      localSettings.local_delivery_enabled && 
      address.city && 
      address.city.toLowerCase() === localSettings.company_city.toLowerCase() &&
      address.state && 
      address.state.toLowerCase() === localSettings.company_state.toLowerCase()

    console.log('Is local delivery:', isLocalDelivery)

    // If local delivery, return local options
    if (isLocalDelivery && localSettings) {
      const localOptions = []

      // Add pickup option if available
      if (localSettings.pickup_available) {
        localOptions.push({
          service: 'Retirada no Local',
          company: 'Loja Física',
          price: 0,
          deadline: 0,
          service_id: 'pickup',
          company_id: 'local',
          local: true,
          pickup_address: localSettings.pickup_address,
          pickup_instructions: localSettings.pickup_instructions
        })
      }

      // Add local delivery option
      localOptions.push({
        service: 'Entrega Local',
        company: 'Entrega Própria',
        price: parseFloat(localSettings.local_delivery_fee.toString()),
        deadline: 1,
        service_id: 'local_delivery',
        company_id: 'local',
        local: true
      })

      console.log('Returning local delivery options:', localOptions)
      return new Response(
        JSON.stringify({ quotes: localOptions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!melhorEnvioToken) {
      console.error('MELHOR_ENVIO_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Token do Melhor Envio não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Melhor Envio token found')

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

    const responseText = await response.text()
    console.log('Melhor Envio response status:', response.status)
    console.log('Melhor Envio response:', responseText)

    if (!response.ok) {
      console.error('Melhor Envio API Error:', response.status, responseText)
      return new Response(
        JSON.stringify({ 
          error: 'Erro na API do Melhor Envio',
          details: responseText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let quotes
    try {
      quotes = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Parsed quotes:', quotes)
    
    // Transform quotes to our format
    const formattedQuotes = quotes
      .filter((quote: any) => !quote.error)
      .map((quote: any) => ({
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in shipping-quote function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
