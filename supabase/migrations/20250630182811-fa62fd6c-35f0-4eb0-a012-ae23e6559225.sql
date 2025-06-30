
-- Create table for AI providers configuration
CREATE TABLE public.ai_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key_env TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.4,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for recommendation sessions
CREATE TABLE public.recommendation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  answers_json JSONB NOT NULL,
  recommended_json JSONB,
  ai_provider_id UUID REFERENCES public.ai_providers NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default AI provider
INSERT INTO public.ai_providers (name, api_key_env, model, temperature, is_default)
VALUES ('OpenAI', 'OPENAI_API_KEY', 'gpt-4o', 0.4, true);

-- Enable RLS on both tables
ALTER TABLE public.ai_providers ENABLE ROW LEVEL security;
ALTER TABLE public.recommendation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for ai_providers (read-only for authenticated users)
CREATE POLICY "AI providers are viewable by authenticated users" 
  ON public.ai_providers 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policies for recommendation_sessions
CREATE POLICY "Users can view their own recommendation sessions" 
  ON public.recommendation_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create recommendation sessions" 
  ON public.recommendation_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own recommendation sessions" 
  ON public.recommendation_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);
