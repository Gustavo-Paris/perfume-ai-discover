

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit for this IP
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (clientData.count >= RATE_LIMIT) {
    // Log potential bot activity
    if (clientData.count === RATE_LIMIT) {
      console.log(`Rate limit exceeded for IP: ${ip} at ${new Date().toISOString()}`);
      // TODO: In production, log MarketingEvent when this happens ≥ 100 times/day
    }
    return true;
  }

  clientData.count++;
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    
    // Check rate limit
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Max 30 requests per minute.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const algoliaAppId = Deno.env.get('ALGOLIA_APP_ID');
    const algoliaSearchKey = Deno.env.get('ALGOLIA_SEARCH_KEY');

    if (!algoliaAppId || !algoliaSearchKey) {
      return new Response(JSON.stringify({ 
        error: 'Algolia credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, params } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Query parameter is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simplified search parameters - removing restrictSearchableAttributes
    const searchParams = {
      hitsPerPage: 8,
      attributesToRetrieve: ["id", "name", "brand", "price_full", "image_url"],
      attributesToHighlight: [],
      ...params
    };

    // Use direct HTTP request to Algolia Search API
    const searchUrl = `https://${algoliaAppId}-dsn.algolia.net/1/indexes/perfumes/query`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': algoliaSearchKey,
        'X-Algolia-Application-Id': algoliaAppId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ...searchParams
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Algolia search error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Search service unavailable' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const searchResult = await searchResponse.json();
    console.log(`Search performed for query: "${query}", found ${searchResult.hits?.length || 0} results`);

    return new Response(JSON.stringify({ hits: searchResult.hits || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Algolia proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Search service unavailable' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

