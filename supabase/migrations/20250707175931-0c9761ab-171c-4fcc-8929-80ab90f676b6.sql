-- Remove Gustavo Paris como afiliado
DELETE FROM affiliates 
WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'gustavo.b.paris@gmail.com'
);