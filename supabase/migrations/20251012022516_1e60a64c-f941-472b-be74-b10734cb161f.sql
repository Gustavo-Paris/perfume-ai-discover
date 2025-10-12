-- Migration: Move Extensions to Dedicated Schema
-- Description: Move PostgreSQL extensions from public schema to dedicated 'extensions' schema

-- Create dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Move extensions to dedicated schema
DO $$
DECLARE
  ext_record RECORD;
  sql_command TEXT;
BEGIN
  FOR ext_record IN 
    SELECT extname
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE nspname = 'public'
      AND extname NOT IN ('plpgsql')
  LOOP
    sql_command := format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
    
    BEGIN
      EXECUTE sql_command;
      RAISE NOTICE 'Moved extension: % to extensions schema', ext_record.extname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not move extension %: %', ext_record.extname, SQLERRM;
    END;
  END LOOP;
END $$;

-- Update search_path for roles to include extensions schema
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;