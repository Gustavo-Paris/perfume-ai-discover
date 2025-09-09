-- PARTE 5: COMPLETAR ÚLTIMAS DESCRIÇÕES PREMIUM

UPDATE perfumes SET description = CASE name
  WHEN 'Turathi Blue' THEN 'Uma fragrância fresca que evoca o azul infinito do oceano mediterrâneo. Esta composição aquática abre com bergamota azul e brisa marinha, desenvolvendo um coração de lírio aquático, sal marinho e folhas de algas. A base refrescante de âmbar oceânico, madeira flotante e almíscar marinho cria uma sensação de liberdade e frescor duradouro, perfeita para dias de calor intenso.'

  WHEN 'Victoria' THEN 'Um tributo à feminilidade clássica e atemporal, criada para a mulher vitoriosa. Esta fragrância elegante combina bergamota real e pêra cristalizada na abertura, revelando um coração de rosa inglesa, jasmim imperial e violeta aristocrática. A base majestosa de âmbar dourado, sândalo real e almíscar de veludo cria uma presença digna de uma verdadeira rainha.'

  WHEN 'Vulcan Feu' THEN 'O fogo vulcânico em sua expressão mais intensa e apaixonada. Esta fragrância ígnea explode com pimenta vermelha e bergamota flamejante, evoluindo para um coração ardente de especiarias vulcânicas, tabaco incandescente e madeiras carbonizadas. A base eruptiva de âmbar lava, resinas fumegantes e almíscar de fogo cria uma experiência olfativa verdadeiramente explosiva.'

  WHEN 'Yara Candy' THEN 'A doçura mais irresistível transformada em uma fragrância viciante como bala. Esta composição gourmand abre com algodão doce e bergamota açucarada, revelando um coração de caramelo líquido, baunilha cristalizada e frutas confitadas. A base açucarada de âmbar doce, almíscar cremoso e madeiras adocicadas cria uma trilha que desperta sorrisos por onde passa.'

  WHEN 'Yara Moi' THEN 'A versão mais intensa e sedutora do clássico Yara, criada para momentos especiais. Esta fragrância gourmand sofisticada combina frutas exóticas e bergamota dourada na abertura, desenvolvendo um coração de caramelo aged, baunilha Madagascar e especiarias doces. A base envolvente de âmbar gourmet, tonka bean e almíscar sensual cria uma presença irresistível e memorável.'

  WHEN 'Yara Tous' THEN 'Uma interpretação feminina e doce que celebra a alegria de viver. Esta fragrância encantadora abre com pêra suculenta e bergamota cristalina, revelando um coração de flores doces, baunilha cremosa e caramelo artesanal. A base reconfortante de âmbar macio, almíscar delicado e madeiras suaves cria uma aura de felicidade e bem-estar que contagia a todos ao redor.'

  ELSE description
END
WHERE category = 'Premium' AND name IN (
  'Turathi Blue', 'Victoria', 'Vulcan Feu', 'Yara Candy', 'Yara Moi', 'Yara Tous'
);