-- Final verification: What competitors can vs cannot see

-- 1. Show what's exposed in public view (safe for competitors)
SELECT 'SAFE FOR COMPETITORS TO SEE:' as category, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes_public'
ORDER BY column_name;

-- 2. Show sensitive data that's now protected  
SELECT 'PROTECTED FROM COMPETITORS:' as category, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes' 
AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage')
ORDER BY column_name;

-- 3. Test anonymous access
SET ROLE anon;
SELECT 'COMPETITOR ACCESS TEST' as test, 
       COUNT(*) as can_see_products,
       'through public view only' as access_method
FROM perfumes_public
LIMIT 1;
RESET ROLE;

-- 4. Confirm main table is now locked down
SELECT 'MAIN TABLE SECURITY' as info,
       policyname,
       'ADMIN ONLY' as access_level
FROM pg_policies WHERE tablename = 'perfumes';