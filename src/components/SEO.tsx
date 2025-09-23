import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({ 
  title = 'Paris & Co - Perfumaria Premium Online', 
  description = 'Descubra perfumes exclusivos com nossa curadoria especializada. Fragrâncias de alta qualidade, entrega rápida e garantia "Amou ou Troca". Milhares de clientes satisfeitos.',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.origin : 'https://paris-co.com',
  type = 'website'
}: SEOProps) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="author" content="Paris & Co" />
      <meta name="keywords" content="perfumes, fragrâncias, perfumaria online, perfume importado, perfume nacional, eau de parfum, eau de toilette" />
      <link rel="canonical" href={url} />
      
      {/* Performance hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "Paris & Co",
          "description": "Perfumaria premium online especializada em fragrâncias exclusivas",
          "url": url,
          "logo": `${url}/logo.png`,
          "sameAs": [
            "https://instagram.com/pariseco",
            "https://facebook.com/pariseco"
          ],
          "priceRange": "$$",
          "paymentAccepted": ["Credit Card", "Pix", "Bank Transfer"],
          "currenciesAccepted": "BRL"
        })}
      </script>
    </Helmet>
  );
};

export default SEO;