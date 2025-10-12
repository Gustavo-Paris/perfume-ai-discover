-- Migration: Fix Security Definer Views
-- Description: Convert SECURITY DEFINER views to SECURITY INVOKER to prevent RLS bypass

-- List all views with SECURITY DEFINER (for audit purposes)
DO $$
DECLARE
  view_record RECORD;
BEGIN
  RAISE NOTICE 'Checking for SECURITY DEFINER views...';
  
  FOR view_record IN 
    SELECT 
      schemaname,
      viewname,
      viewowner
    FROM pg_views 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage')
  LOOP
    RAISE NOTICE 'View: %.% (Owner: %)', view_record.schemaname, view_record.viewname, view_record.viewowner;
  END LOOP;
END $$;

-- Convert all public schema views to SECURITY INVOKER
DO $$
DECLARE
  view_record RECORD;
  sql_command TEXT;
BEGIN
  FOR view_record IN 
    SELECT 
      schemaname,
      viewname
    FROM pg_views 
    WHERE schemaname = 'public'
  LOOP
    sql_command := format('ALTER VIEW %I.%I SET (security_invoker = on)', 
                          view_record.schemaname, 
                          view_record.viewname);
    
    BEGIN
      EXECUTE sql_command;
      RAISE NOTICE 'Fixed view: %.%', view_record.schemaname, view_record.viewname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not fix view %.%: %', 
                      view_record.schemaname, 
                      view_record.viewname, 
                      SQLERRM;
    END;
  END LOOP;
END $$;