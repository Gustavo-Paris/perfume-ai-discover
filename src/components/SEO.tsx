import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  author?: string;
  canonical?: string;
}

const SEO = ({ 
  title = 'Paris & Co - Perfumaria Premium Online', 
  description = 'Descubra perfumes exclusivos com nossa curadoria especializada. Fragrâncias de alta qualidade, entrega rápida e garantia "Amou ou Troca". Milhares de clientes satisfeitos.',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : 'https://paris-co.com',
  type = 'website',
  keywords = 'perfumes, fragrâncias, perfumaria online, perfume importado, perfume nacional, eau de parfum, eau de toilette',
  author = 'Paris & Co',
  canonical
}: SEOProps) => {
  const canonicalUrl = canonical || url;
  const fullImageUrl = image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : 'https://paris-co.com'}${image}`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Paris & Co" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:creator" content="@pariseco" />
      
      {/* Performance hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      
      {/* Structured data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "Paris & Co",
          "description": "Perfumaria premium online especializada em fragrâncias exclusivas",
          "url": canonicalUrl,
          "logo": `${typeof window !== 'undefined' ? window.location.origin : 'https://paris-co.com'}/logo.png`,
          "image": fullImageUrl,
          "sameAs": [
            "https://instagram.com/pariseco",
            "https://facebook.com/pariseco"
          ],
          "priceRange": "$$",
          "paymentAccepted": ["Credit Card", "Pix", "Bank Transfer"],
          "currenciesAccepted": "BRL",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "BR"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;