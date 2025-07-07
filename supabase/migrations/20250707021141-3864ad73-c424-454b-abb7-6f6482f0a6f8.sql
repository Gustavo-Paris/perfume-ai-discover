-- Tabela para histórico de buscas
CREATE TABLE public.search_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_result_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address INET
);

-- Tabela para sugestões populares
CREATE TABLE public.popular_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  conversion_rate NUMERIC(5,4) DEFAULT 0,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para sugestões personalizadas
CREATE TABLE public.search_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  suggestion_text TEXT NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'product', 'brand', 'category', 'note'
  related_id UUID, -- ID do produto/marca relacionado
  score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at DESC);
CREATE INDEX idx_popular_searches_count ON public.popular_searches(search_count DESC);
CREATE INDEX idx_search_suggestions_user_id ON public.search_suggestions(user_id);

-- RLS Policies
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas para search_queries
CREATE POLICY "Users can view their own search queries" 
ON public.search_queries 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own search queries" 
ON public.search_queries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all search queries" 
ON public.search_queries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para popular_searches
CREATE POLICY "Everyone can view popular searches" 
ON public.popular_searches 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage popular searches" 
ON public.popular_searches 
FOR ALL 
USING (true);

-- Políticas para search_suggestions
CREATE POLICY "Users can view their own suggestions" 
ON public.search_suggestions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own suggestions" 
ON public.search_suggestions 
FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL);