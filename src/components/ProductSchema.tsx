import { DatabasePerfume } from '@/types';

interface ProductSchemaProps {
  perfume: DatabasePerfume;
  currentPrice: number;
  selectedSize: 5 | 10;
}

const ProductSchema = ({ perfume, currentPrice, selectedSize }: ProductSchemaProps) => {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": perfume.name,
    "image": perfume.image_url || '/placeholder.svg',
    "description": perfume.description || `${perfume.name} - ${perfume.brand}. ${perfume.family}`,
    "sku": `${perfume.id}-${selectedSize}ml`,
    "brand": {
      "@type": "Brand",
      "name": perfume.brand
    },
    "category": perfume.family,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "BRL",
      "price": currentPrice,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Sua Perfumaria"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "1"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default ProductSchema;