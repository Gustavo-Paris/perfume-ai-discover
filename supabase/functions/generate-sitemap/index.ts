import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Development logging helper
const debugLog = (...args: any[]) => {
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    console.log('[DEBUG]', ...args);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Base URL do site (produção)
    const baseUrl = 'https://decants.lovable.app';

    // Buscar todos os perfumes
    const { data: perfumes, error } = await supabase
      .from('perfumes')
      .select('id, name, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Páginas estáticas
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/catalogo', priority: '0.9', changefreq: 'daily' },
      { url: '/curadoria', priority: '0.8', changefreq: 'weekly' },
      { url: '/fidelidade', priority: '0.7', changefreq: 'monthly' },
      { url: '/wishlist', priority: '0.6', changefreq: 'weekly' },
      { url: '/carrinho', priority: '0.5', changefreq: 'weekly' },
      { url: '/auth', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacidade', priority: '0.4', changefreq: 'yearly' },
      { url: '/termos-uso', priority: '0.4', changefreq: 'yearly' },
    ];

    // Gerar XML do sitemap
    const now = new Date().toISOString();
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;

    // Adicionar páginas estáticas
    staticPages.forEach(page => {
      sitemapXml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Adicionar páginas de perfumes
    perfumes?.forEach(perfume => {
      const lastmod = perfume.updated_at || now;
      sitemapXml += `
  <url>
    <loc>${baseUrl}/perfume/${perfume.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    sitemapXml += '\n</urlset>';

    debugLog(`✅ Sitemap gerado com ${staticPages.length} páginas estáticas e ${perfumes?.length || 0} perfumes`);

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar sitemap:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
