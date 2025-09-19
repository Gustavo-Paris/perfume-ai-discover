-- Fix perfumes access for public users and recommendation system
-- Add a policy to allow public read access to perfumes for the recommendation system

CREATE POLICY "Public can view perfume catalog for recommendations" ON perfumes
FOR SELECT
TO public
USING (true);