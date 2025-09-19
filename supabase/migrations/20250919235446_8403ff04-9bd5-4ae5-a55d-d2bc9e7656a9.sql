-- Final security verification - check exactly what data competitors can access

-- First, let's see what's in the public view (safe for competitors)
SELECT column_name as public_columns
FROM information_schema.columns 
WHERE table_name = 'perfumes_public'
ORDER BY column_name;

-- Test: Try to access sensitive data as anonymous user
SET ROLE anon;

-- This should work (public catalog data)
SELECT 'PUBLIC DATA TEST' as test, COUNT(*) as records_visible
FROM perfumes_public;

-- This should fail (sensitive business data)
BEGIN;
SELECT 'SENSITIVE DATA TEST' as test, 
       'SHOULD BE BLOCKED' as expected_result,
       COUNT(*) as records_if_vulnerable
FROM perfumes 
WHERE avg_cost_per_ml IS NOT NULL OR target_margin_percentage IS NOT NULL
LIMIT 1;
EXCEPTION WHEN insufficient_privilege THEN
  SELECT 'SENSITIVE DATA TEST' as test, 
         '✅ PROPERLY BLOCKED' as actual_result,
         0 as records_visible;
END;

RESET ROLE;