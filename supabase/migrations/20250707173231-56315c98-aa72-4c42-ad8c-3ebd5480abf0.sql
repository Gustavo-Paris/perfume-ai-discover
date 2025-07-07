-- Função para criar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code(user_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Criar código base a partir do nome ou usar padrão
  IF user_name IS NOT NULL THEN
    base_code := UPPER(LEFT(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g'), 6));
  ELSE
    base_code := 'AFF';
  END IF;
  
  -- Garantir que seja único
  LOOP
    IF counter = 0 THEN
      final_code := base_code || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');
    ELSE
      final_code := base_code || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    END IF;
    
    -- Verificar se já existe
    IF NOT EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = final_code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      final_code := 'AFF' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Trigger para atualizar helpful_count nas reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count + 
      CASE 
        WHEN NEW.is_helpful AND NOT OLD.is_helpful THEN 1
        WHEN NOT NEW.is_helpful AND OLD.is_helpful THEN -1
        ELSE 0
      END
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE 0 END
    WHERE id = OLD.review_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();