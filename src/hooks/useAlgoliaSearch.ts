
import { useState, useEffect, useCallback } from 'react';
import { algoliasearch } from 'algoliasearch';
import { supabase } from '@/integrations/supabase/client';

const algoliaAppId = 'vjlfwmwhvxlicykqetnk'; // Using project ID as fallback
const algoliaSearchKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4'; // Using anon key as fallback

interface AlgoliaResult {
  objectID: string;
  id: string;
  name: string;
  brand: string;
  image_url: string;
  price_full: number;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useAlgoliaSearch = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    try {
      setIsAvailable(true);
    } catch (error) {
      console.log('Algolia not available:', error);
      setIsAvailable(false);
    }
  }, []);

  const getCachedResult = (query: string): AlgoliaResult[] | null => {
    try {
      const cached = sessionStorage.getItem(`algolia:${query}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_TTL) {
        sessionStorage.removeItem(`algolia:${query}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.log('Cache error:', error);
      return null;
    }
  };

  const setCachedResult = (query: string, results: AlgoliaResult[]) => {
    try {
      const cacheData = {
        data: results,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`algolia:${query}`, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Cache set error:', error);
    }
  };

  const search = useCallback(async (query: string): Promise<AlgoliaResult[]> => {
    if (!isAvailable || !query.trim()) {
      return [];
    }

    // Check cache first
    const cached = getCachedResult(query);
    if (cached) {
      return cached;
    }

    try {
      // Use the rate-limited proxy instead of direct Algolia call
      const { data, error } = await supabase.functions.invoke('algolia-proxy', {
        body: {
          query,
          params: {
            hitsPerPage: 8,
            attributesToRetrieve: ["id", "name", "brand", "price_full", "image_url"],
            attributesToHighlight: [],
            attributesToSearchIn: ['name', 'brand', 'family', 'notes']
          }
        }
      });

      if (error) {
        console.log('Search error:', error);
        return [];
      }

      const results = data.hits || [];
      setCachedResult(query, results);
      return results;
    } catch (error) {
      console.log('Search error:', error);
      return [];
    }
  }, [isAvailable]);

  return { search, isAvailable };
};
