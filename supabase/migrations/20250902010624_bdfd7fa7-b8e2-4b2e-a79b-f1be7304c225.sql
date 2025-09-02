-- Fix privacy_consents RLS policies to prevent unauthorized access to sensitive data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create their own consents" ON public.privacy_consents;
DROP POLICY IF EXISTS "Users can view their own consents" ON public.privacy_consents;
DROP POLICY IF EXISTS "Users can update their own consents" ON public.privacy_consents;

-- Create secure RLS policies

-- Policy 1: Users can only view their own consent records (authenticated users only)
CREATE POLICY "Users can view own consents only" 
ON public.privacy_consents 
FOR SELECT 
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Policy 2: Users can only insert their own consent records (authenticated users)
CREATE POLICY "Users can create own consents only" 
ON public.privacy_consents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Policy 3: Users can only update their own consent records (authenticated users)
CREATE POLICY "Users can update own consents only" 
ON public.privacy_consents 
FOR UPDATE 
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Policy 4: System can manage consent records for compliance purposes (admin access)
CREATE POLICY "Admins can manage all consents" 
ON public.privacy_consents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Note: Anonymous consent records (user_id IS NULL) are now completely restricted
-- This prevents unauthorized access to IP addresses and browser fingerprints
-- Anonymous users will need to be handled through server-side functions if needed