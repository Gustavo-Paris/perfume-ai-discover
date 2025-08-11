import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prefix } = await req.json();

    if (!prefix || typeof prefix !== 'string' || !/^[a-fA-F0-9]{5}$/.test(prefix)) {
      return new Response(JSON.stringify({ error: 'Invalid prefix' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hibpUrl = `https://api.pwnedpasswords.com/range/${prefix.toUpperCase()}`;
    const res = await fetch(hibpUrl, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'parisco-edge/1.0 (password check)'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: 'HIBP request failed', details: text }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await res.text();
    // Parse response: lines of "SUFFIX:COUNT"
    const suffixes = body.split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [suffix, count] = line.split(':');
        return { suffix, count: Number(count) };
      });

    return new Response(JSON.stringify({ suffixes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('password-pwned-check error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
