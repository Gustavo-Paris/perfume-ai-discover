-- Security verification with correct syntax

-- Check what columns are in public view (what competitors can see)
SELECT 'What competitors can access:' as info, 
       array_agg(column_name ORDER BY column_name) as public_columns
FROM information_schema.columns 
WHERE table_name = 'perfumes_public';

-- Check what sensitive columns exist in main table (should be protected)
SELECT 'Sensitive data that should be protected:' as info,
       array_agg(column_name ORDER BY column_name) as sensitive_columns  
FROM information_schema.columns 
WHERE table_name = 'perfumes' 
AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage');

-- Simple access test as anon user
SET ROLE anon;
SELECT 'Anonymous user can access perfumes_public:' as test, 
       CASE WHEN COUNT(*) > 0 THEN 'YES (expected for catalog)' ELSE 'NO' END as result
FROM perfumes_public 
LIMIT 1;
RESET ROLE;

-- Test if anon can access main table directly (should fail)
SET ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM perfumes LIMIT 1) THEN
    RAISE NOTICE 'SECURITY BREACH: Anonymous can access main perfumes table!';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'SECURITY OK: Anonymous access to main table blocked';
END $$;
RESET ROLE;