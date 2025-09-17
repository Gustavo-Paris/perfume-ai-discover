-- Atualizar constraint da tabela reservations para permitir 20ml
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_size_ml_check;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_size_ml_check 
CHECK (size_ml IN (2, 5, 10, 20));