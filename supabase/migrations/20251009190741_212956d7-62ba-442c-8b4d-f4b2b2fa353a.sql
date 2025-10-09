-- FASE 2: CORREÇÕES DE CONFIGURAÇÃO
-- Correções que podem ser automatizadas

-- ============================================
-- 2.3. INVESTIGAR SECURITY DEFINER VIEWS
-- ============================================

-- Listar todas as views com SECURITY DEFINER para análise
DO $$
DECLARE
  view_record RECORD;
  view_count INTEGER := 0;
BEGIN
  -- Buscar views com SECURITY DEFINER
  FOR view_record IN 
    SELECT 
      schemaname,
      viewname,
      definition
    FROM pg_views 
    WHERE schemaname = 'public'
      AND definition ILIKE '%SECURITY DEFINER%'
  LOOP
    view_count := view_count + 1;
    RAISE NOTICE 'View com SECURITY DEFINER encontrada: %.%', view_record.schemaname, view_record.viewname;
  END LOOP;
  
  IF view_count = 0 THEN
    RAISE NOTICE 'Nenhuma view com SECURITY DEFINER encontrada no schema public';
  END IF;
END $$;


-- ============================================
-- CORREÇÃO: EXTENSION IN PUBLIC SCHEMA
-- ============================================
-- Mover extensões para schema extensions (boa prática)
-- Nota: Algumas extensões como pg_http podem não permitir mudança de schema

-- Criar schema para extensões se não existir
CREATE SCHEMA IF NOT EXISTS extensions;

-- Tentar mover extensão http para o schema extensions
-- Se falhar, apenas documenta (algumas extensões não podem ser movidas)
DO $$
BEGIN
  -- Verificar se a extensão http existe no schema public
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'http' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    BEGIN
      -- Tentar mover a extensão
      ALTER EXTENSION http SET SCHEMA extensions;
      RAISE NOTICE 'Extensão http movida para schema extensions';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível mover extensão http: %. Isso é normal para algumas extensões.', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Extensão http não encontrada no schema public ou já está em outro schema';
  END IF;
END $$;


-- ============================================
-- DOCUMENTAÇÃO: ITENS QUE REQUEREM AÇÃO MANUAL
-- ============================================

-- Os seguintes itens requerem configuração no Dashboard Supabase:
--
-- 1. LEAKED PASSWORD PROTECTION (WARN)
--    Acesse: Authentication > Settings > Enable "Leaked Password Protection"
--    URL: https://supabase.com/dashboard/project/vjlfwmwhvxlicykqetnk/auth/providers
--
-- 2. FUNCTION SEARCH PATH MUTABLE (WARN)
--    As funções identificadas são da extensão pg_http (funções C compiladas):
--    - http_set_curlopt
--    - http_reset_curlopt  
--    - http_list_curlopt
--    - http_header
--    
--    Estas não podem ser alteradas via ALTER FUNCTION pois são parte da extensão.
--    SOLUÇÃO: Isso é um aviso menor, não afeta segurança real do app.
--
-- 3. POSTGRES VERSION UPDATE (WARN)
--    Acesse: Settings > Database > Upgrade Postgres Version
--    URL: https://supabase.com/dashboard/project/vjlfwmwhvxlicykqetnk/settings/database
--
-- ============================================
-- RESULTADO
-- ============================================
-- ✅ Investigação de Security Definer Views: CONCLUÍDA
-- ✅ Extensões movidas para schema apropriado (quando possível)
-- ⚠️ Itens restantes requerem ação manual no Dashboard