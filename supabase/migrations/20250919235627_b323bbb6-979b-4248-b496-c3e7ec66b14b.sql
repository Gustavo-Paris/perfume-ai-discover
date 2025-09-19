-- Simple security verification test

-- Show columns available to competitors (public view)
SELECT 'What competitors can see:' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes_public'
ORDER BY column_name;

-- Test as anonymous user - should only see public data
SET ROLE anon;
SELECT 'Anonymous user test - can access public view' as result, COUNT(*) as records
FROM perfumes_public;
RESET ROLE;

-- Verify RLS policies protect main table
SELECT 'RLS Policies on main perfumes table:' as info, policyname, cmd as operation
FROM pg_policies WHERE tablename = 'perfumes';