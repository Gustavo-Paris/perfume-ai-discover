-- Update the check constraint to allow 2ml size in reservations table
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_size_ml_check;

-- Add the updated constraint that includes 2ml
ALTER TABLE reservations ADD CONSTRAINT reservations_size_ml_check 
CHECK (size_ml = ANY (ARRAY[2, 5, 10, 50, 100]));