

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
            attributesToHighlight: []
          }
        }
      });

      if (error) {
        return [];
      }

      const results = data.hits || [];
      setCachedResult(query, results);
      return results;
    } catch (error) {
      
      return [];
    }
  }, [isAvailable]);

  return { search, isAvailable };
};

