
-- Create table for conversational curation sessions
CREATE TABLE public.conversational_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  conversation_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_perfumes JSONB,
  session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'abandoned')),
  user_profile_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for conversational_sessions
CREATE POLICY "Users can view their own conversational sessions" 
  ON public.conversational_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversational sessions" 
  ON public.conversational_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversational sessions" 
  ON public.conversational_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversational_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_conversational_sessions_updated_at
  BEFORE UPDATE ON public.conversational_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_conversational_sessions_updated_at();
