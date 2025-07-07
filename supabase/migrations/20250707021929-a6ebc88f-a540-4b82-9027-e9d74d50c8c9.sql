-- Função para incrementar contador de buscas populares
CREATE OR REPLACE FUNCTION public.increment_search_count(search_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.popular_searches 
  SET 
    search_count = search_count + 1,
    last_searched = now()
  WHERE query = search_query;
  
  -- Se não existe, criar novo registro
  IF NOT FOUND THEN
    INSERT INTO public.popular_searches (query, search_count, last_searched)
    VALUES (search_query, 1, now())
    ON CONFLICT (query) DO UPDATE SET
      search_count = popular_searches.search_count + 1,
      last_searched = now();
  END IF;
END;
$$;