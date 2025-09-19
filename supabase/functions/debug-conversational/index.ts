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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== DEBUG CONVERSATIONAL API ===');

    // Check OpenAI API Key
    console.log('OpenAI API Key exists:', !!openaiApiKey);
    console.log('OpenAI API Key length:', openaiApiKey?.length || 0);

    // Test OpenAI API
    let openaiTest = 'FAIL';
    if (openaiApiKey) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          }),
        });
        
        if (response.ok) {
          openaiTest = 'SUCCESS';
        } else {
          const errorText = await testResponse.text();
          openaiTest = `ERROR: ${testResponse.status} - ${errorText}`;
        }
      } catch (e) {
        openaiTest = `EXCEPTION: ${e.message}`;
      }
    }
    
    console.log('OpenAI API Test:', openaiTest);

    // Check Supabase connection and perfumes
    let perfumeCount = 0;
    let perfumeTest = 'FAIL';
    try {
      const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('id, name, brand')
        .limit(5);
      
      if (error) {
        perfumeTest = `ERROR: ${error.message}`;
      } else {
        perfumeCount = perfumes?.length || 0;
        perfumeTest = 'SUCCESS';
      }
    } catch (e) {
      perfumeTest = `EXCEPTION: ${e.message}`;
    }
    
    console.log('Perfume Test:', perfumeTest);
    console.log('Perfume Count:', perfumeCount);

    // Test simple recommendation logic
    let recommendationTest = 'FAIL';
    if (openaiApiKey && perfumeCount > 0) {
      try {
        const { data: samplePerfumes } = await supabase
          .from('perfumes')
          .select('id, name, brand, gender, family')
          .limit(3);

        const testPrompt = `Escolha 1 perfume masculino desta lista para um homem jovem que gosta de perfumes frescos: ${JSON.stringify(samplePerfumes)}. Responda apenas com o ID do perfume escolhido.`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 100
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          recommendationTest = `SUCCESS: ${result.choices[0].message.content}`;
        } else {
          recommendationTest = `ERROR: ${response.status}`;
        }
      } catch (e) {
        recommendationTest = `EXCEPTION: ${e.message}`;
      }
    }
    
    console.log('Recommendation Test:', recommendationTest);

    return new Response(JSON.stringify({
      status: 'DEBUG COMPLETE',
      openai_key_exists: !!openaiApiKey,
      openai_test: openaiTest,
      perfume_test: perfumeTest,
      perfume_count: perfumeCount,
      recommendation_test: recommendationTest,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Debug function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'DEBUG ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});