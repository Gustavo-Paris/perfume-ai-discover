-- Final comprehensive security check

-- Show exactly what columns competitors can see vs what's protected
WITH public_columns AS (
  SELECT column_name, 'EXPOSED TO COMPETITORS' as status
  FROM information_schema.columns 
  WHERE table_name = 'perfumes_public'
),
sensitive_columns AS (
  SELECT column_name, 'PROTECTED FROM COMPETITORS' as status
  FROM information_schema.columns 
  WHERE table_name = 'perfumes' 
  AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage')
),
all_columns AS (
  SELECT * FROM public_columns
  UNION ALL
  SELECT * FROM sensitive_columns
)
SELECT 
  column_name,
  status,
  CASE 
    WHEN column_name IN ('avg_cost_per_ml', 'target_margin_percentage') THEN '🔒 BUSINESS SECRET'
    WHEN column_name LIKE 'price_%' THEN '💲 PRICING (OK TO SHOW)'
    ELSE '📋 CATALOG INFO (OK TO SHOW)'
  END as classification
FROM all_columns
ORDER BY status DESC, classification DESC, column_name;

-- Verify RLS is working
SELECT 
  'FINAL SECURITY STATUS' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN '✅ SECURED WITH RLS' ELSE '❌ VULNERABLE' END as security_status
FROM pg_tables 
WHERE tablename = 'perfumes';