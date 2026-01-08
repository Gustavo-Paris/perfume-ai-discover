-- Add NCM column to perfumes table for fiscal data
-- NCM 3303.00.10 is the default code for perfumes and eau de cologne

ALTER TABLE public.perfumes 
ADD COLUMN IF NOT EXISTS ncm text DEFAULT '3303.00.10';