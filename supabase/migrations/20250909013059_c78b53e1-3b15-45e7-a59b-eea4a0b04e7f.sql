-- PARTE 5: FINALIZAR TODOS OS PERFUMES PREMIUM RESTANTES

UPDATE perfumes SET description = CASE name
  WHEN 'Turathi Blue' THEN 'Uma fragrância fresca como a brisa azul do mediterrâneo ao amanhecer. Esta composição refrescante abre com bergamota azul e sal marinho, evoluindo para um coração de lavanda provençal, alecrim silvestre e folhas de eucalipto. A base fresca de âmbar oceânico, madeiras flotadas e almíscar aquático cria uma sensação de liberdade e vitalidade que perdura o dia todo.'

  WHEN 'Victoria' THEN 'Um tributo à feminilidade clássica e elegante que nunca sai de moda. Esta fragrância atemporal combina bergamota vitoriana e péra cristalizada na abertura, revelando um coração de rosa inglesa, violeta e jasmim real. A base nobre de âmbar cristalino, sândalo suave e almíscar de seda cria uma presença refinada digna de uma verdadeira dama.'

  WHEN 'Vulcan Feu' THEN 'O fogo vulcânico mais intenso materializado em uma fragrância de pura energia. Esta composição ígnea explode com bergamota flamejante e pimenta vulcânica, desenvolvendo um coração de especiarias incandescentes, tabaco ardente e madeiras carbonizadas. A base eruptiva de âmbar líquido, resinas fumegantes e almíscar de lava cria uma presença que queima na memória para sempre.'

  WHEN 'Yara Candy' THEN 'A doçura mais irresistível transformada em uma fragrância gourmand viciante. Esta criação açucarada abre com algodão doce e bergamota cristalizada, revelando um coração de caramelo líquido, baunilha doce e frutas confitadas. A base deliciosa de açúcar mascavo, almíscar cremoso e madeiras doces cria uma trilha que desperta o sorriso e a alegria em todos ao redor.'

  WHEN 'Yara Moi' THEN 'A versão mais intensa e sedutora da lendária Yara, criada para momentos de máxima feminilidade. Esta intensificação gourmand combina frutas vermelhas maceradas e bergamota intensa na abertura, evoluindo para um coração de caramelo concentrado, baunilha bourbon e flores doces. A base envolvente de âmbar gourmand intenso e almíscar viciante cria uma presença irresistível e memorável.'

  WHEN 'Yara Tous' THEN 'Uma inspiração doce que celebra a feminilidade jovem e radiante. Esta fragrância encantadora abre com pêra doce e bergamota dourada, revelando um coração de flor de laranjeira, jasmim suave e baunilha delicada. A base reconfortante de âmbar macio, almíscar de algodão e madeiras cremosas cria uma aura de ternura e sofisticação juvenil.'

  ELSE description
END
WHERE category = 'Premium' AND name IN (
  'Turathi Blue', 'Victoria', 'Vulcan Feu', 'Yara Candy', 'Yara Moi', 'Yara Tous'
);

-- Também atualizar notas olfativas específicas para os Ultra Luxury
UPDATE perfumes SET 
  top_notes = CASE name
    WHEN 'Delina' THEN ARRAY['Rosa de Damasco', 'Lítchia', 'Noz-moscada']
    WHEN 'Hombre Leather' THEN ARRAY['Bergamota italiana', 'Pimenta rosa', 'Couro']
    WHEN 'Prada Paradoxe Intense' THEN ARRAY['Pimenta rosa', 'Bergamota Calabria', 'Aldeídos']
    WHEN 'Sospiro Erba Magica' THEN ARRAY['Manjericão', 'Tomilho', 'Limão Amalfi']
    ELSE top_notes
  END,
  heart_notes = CASE name
    WHEN 'Delina' THEN ARRAY['Jasmim de Grasse', 'Peônia', 'Incenso']
    WHEN 'Hombre Leather' THEN ARRAY['Couro curtido', 'Especiarias', 'Tabaco']
    WHEN 'Prada Paradoxe Intense' THEN ARRAY['Flor de laranjeira', 'Jasmim sambac', 'Íris']
    WHEN 'Sospiro Erba Magica' THEN ARRAY['Violeta cristalizada', 'Íris florentina', 'Folhas de figueira']
    ELSE heart_notes
  END,
  base_notes = CASE name
    WHEN 'Delina' THEN ARRAY['Baunilha bourbon', 'Almíscar caxemira', 'Oud']
    WHEN 'Hombre Leather' THEN ARRAY['Sândalo Mysore', 'Âmbar negro', 'Vetiver haitiano']
    WHEN 'Prada Paradoxe Intense' THEN ARRAY['Âmbar cristalino', 'Almíscar sensual', 'Madeiras brancas']
    WHEN 'Sospiro Erba Magica' THEN ARRAY['Vetiver', 'Patchouli', 'Musgo de carvalho']
    ELSE base_notes
  END
WHERE category = 'Ultra Luxury';