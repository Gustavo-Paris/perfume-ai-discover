
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers } = await req.json();
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing recommendation request with answers:', answers);

    // Get default AI provider
    const { data: aiProvider, error: providerError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('is_default', true)
      .single();

    if (providerError || !aiProvider) {
      throw new Error('Default AI provider not found');
    }

    // Get all perfumes with stock
    const { data: perfumes, error: perfumesError } = await supabase
      .from('perfumes')
      .select('*');

    if (perfumesError) {
      throw new Error('Failed to fetch perfumes');
    }

    // Filter perfumes with stock (assuming stock exists if prices exist)
    const availablePerfumes = perfumes?.filter(p => 
      (p.price_5ml && p.price_5ml > 0) || (p.price_10ml && p.price_10ml > 0)
    ) || [];

    // Create catalog for AI
    const catalog = availablePerfumes.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      family: p.family,
      gender: p.gender,
      description: p.description,
      top_notes: p.top_notes,
      heart_notes: p.heart_notes,
      base_notes: p.base_notes
    }));

    // Build prompt for AI
    const prompt = `You are a perfumery expert recommender. Based on the user's preferences, choose up to 5 perfumes from this catalog that best match their profile.

User Preferences:
- Gender: ${answers.gender}
- Fragrance Family: ${answers.family}
- Occasion: ${answers.occasion}
- Intensity: ${answers.intensity}
- Budget: ${answers.budget}
- Additional preferences: ${answers.preferences}

Perfume Catalog:
${JSON.stringify(catalog, null, 2)}

Respond ONLY with a JSON array of perfume IDs sorted by best match (best match first). Example: ["id1", "id2", "id3"]`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiProvider.model,
        temperature: aiProvider.temperature,
        messages: [
          {
            role: 'system',
            content: 'You are a perfumery expert. Respond only with valid JSON arrays of perfume IDs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content.trim();
    
    console.log('AI Response:', aiResponse);

    // Parse AI response
    let perfumeIds: string[];
    try {
      perfumeIds = JSON.parse(aiResponse);
      if (!Array.isArray(perfumeIds)) {
        throw new Error('AI response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: return first 5 available perfumes
      perfumeIds = availablePerfumes.slice(0, 5).map(p => p.id);
    }

    // Validate and filter IDs
    const validIds = perfumeIds.filter(id => 
      availablePerfumes.some(p => p.id === id)
    ).slice(0, 5);

    const result = { perfumeIds: validIds };

    // Get user ID from auth header if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (authError) {
        console.log('No valid auth token provided');
      }
    }

    // Save recommendation session
    const { error: sessionError } = await supabase
      .from('recommendation_sessions')
      .insert({
        user_id: userId,
        answers_json: answers,
        recommended_json: result,
        ai_provider_id: aiProvider.id
      });

    if (sessionError) {
      console.error('Failed to save session:', sessionError);
      // Don't throw error, just log it
    }

    console.log('Recommendation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
