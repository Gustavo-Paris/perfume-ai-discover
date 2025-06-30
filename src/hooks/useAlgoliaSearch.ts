
import { useState, useEffect, useCallback } from 'react';
import { algoliasearch } from 'algoliasearch';

const algoliaAppId = 'vjlfwmwhvxlicykqetnk'; // Using project ID as fallback
const algoliaSearchKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4'; // Using anon key as fallback

interface AlgoliaResult {
  objectID: string;
  id: string;
  name: string;
  brand: string;
  family: string;
  image_url: string;
  price_5ml: number;
}

export const useAlgoliaSearch = () => {
  const [searchClient, setSearchClient] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    try {
      // Try to initialize Algolia client
      const client = algoliasearch(algoliaAppId, algoliaSearchKey);
      setSearchClient(client);
      setIsAvailable(true);
    } catch (error) {
      console.log('Algolia not available:', error);
      setIsAvailable(false);
    }
  }, []);

  const search = useCallback(async (query: string): Promise<AlgoliaResult[]> => {
    if (!searchClient || !isAvailable || !query.trim()) {
      return [];
    }

    try {
      const index = searchClient.initIndex('perfumes');
      const { hits } = await index.search(query, {
        hitsPerPage: 8,
        attributesToSearchIn: ['name', 'brand', 'family', 'notes'],
      });
      return hits as AlgoliaResult[];
    } catch (error) {
      console.log('Search error:', error);
      return [];
    }
  }, [searchClient, isAvailable]);

  return { search, isAvailable };
};
