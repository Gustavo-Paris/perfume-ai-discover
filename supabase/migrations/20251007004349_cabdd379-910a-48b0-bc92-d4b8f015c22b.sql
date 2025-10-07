-- FASE 2.2: Resolver avisos restantes do linter - Parte 3 (simplificado)

-- Mover extensão http do schema public para extensions
DO $$
BEGIN
    -- Criar schema extensions se não existir
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Verificar e mover extensão http se estiver no public
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'http'
    ) THEN
        ALTER EXTENSION http SET SCHEMA extensions;
        RAISE NOTICE 'Extensão http movida para schema extensions com sucesso';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Aviso ao mover extensão http: %. Isso pode não ser um problema crítico.', SQLERRM;
END $$;