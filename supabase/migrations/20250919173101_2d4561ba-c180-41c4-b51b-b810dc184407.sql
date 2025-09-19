-- First, let's check the current state of the conversational_sessions table
SELECT schemaname, tablename, rowsecurity, policy_name, roles, cmd, qual
FROM pg_tables pt
LEFT JOIN pg_policies pp ON pt.tablename = pp.tablename
WHERE pt.tablename = 'conversational_sessions';

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversational_sessions'
ORDER BY ordinal_position;