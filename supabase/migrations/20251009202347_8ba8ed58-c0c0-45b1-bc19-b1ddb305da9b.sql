-- Create table for 2FA settings
CREATE TABLE public.user_2fa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_2fa_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_2fa_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
ON public.user_2fa_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings"
ON public.user_2fa_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all 2FA settings
CREATE POLICY "Admins can view all 2FA settings"
ON public.user_2fa_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_user_2fa_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_2fa_settings_updated_at
BEFORE UPDATE ON public.user_2fa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_2fa_settings_updated_at();

-- Add index for faster lookups
CREATE INDEX idx_user_2fa_settings_user_id ON public.user_2fa_settings(user_id);
CREATE INDEX idx_user_2fa_settings_enabled ON public.user_2fa_settings(enabled);