import { supabase } from '@/integrations/supabase/client';

export const generateSitemap = async () => {
  const baseUrl = 'https://sua-perfumaria.com';
  
  // Static pages
  const staticPages = [
    '',
    '/curadoria',
    '/fidelidade', 
    '/catalogo',
    '/privacidade',
    '/troca-devolucao'
  ];

  // Get all perfumes for dynamic pages
  const { data: perfumes } = await supabase
    .from('perfumes')
    .select('id, created_at');

  const perfumePages = perfumes?.map(perfume => ({
    url: `/perfume/${perfume.id}`,
    lastmod: perfume.created_at
  })) || [];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${perfumePages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return sitemap;
};