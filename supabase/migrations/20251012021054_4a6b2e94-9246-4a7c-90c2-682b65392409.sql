-- Migration: Fix Function Search Path
-- Description: Set explicit search_path on all functions to prevent SQL injection

DO $$
DECLARE
  func_record RECORD;
  sql_command TEXT;
BEGIN
  FOR func_record IN 
    SELECT 
      p.oid,
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  LOOP
    sql_command := format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp', 
                          func_record.schema_name, 
                          func_record.function_name,
                          func_record.args);
    
    BEGIN
      EXECUTE sql_command;
      RAISE NOTICE 'Fixed function: %.%(%) - search_path set to public, pg_temp', 
                   func_record.schema_name, 
                   func_record.function_name,
                   func_record.args;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not fix function %.%(%): %', 
                      func_record.schema_name, 
                      func_record.function_name,
                      func_record.args,
                      SQLERRM;
    END;
  END LOOP;
END $$;