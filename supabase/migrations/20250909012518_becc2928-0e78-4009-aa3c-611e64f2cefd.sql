-- CORREÇÃO COMPLETA DOS PERFUMES

-- 1. REMOVER OPÇÃO 2ML DE PERFUMES NÃO ULTRA LUXURY
UPDATE perfumes 
SET price_2ml = NULL 
WHERE category != 'Ultra Luxury';

-- 2. REAJUSTAR PREÇOS PARA FICAREM JUSTOS E COMPETITIVOS
-- Premium: preços acessíveis (5ml: R$15-25, 10ml: R$25-45, Full: R$45-85)
UPDATE perfumes SET 
  price_5ml = ROUND(15 + RANDOM() * 10, 2),  -- R$15-25
  price_10ml = ROUND(25 + RANDOM() * 20, 2), -- R$25-45  
  price_full = ROUND(45 + RANDOM() * 40, 2)  -- R$45-85
WHERE category = 'Premium';

-- Luxury: preços médios (5ml: R$25-40, 10ml: R$45-75, Full: R$80-150)
UPDATE perfumes SET 
  price_5ml = ROUND(25 + RANDOM() * 15, 2),  -- R$25-40
  price_10ml = ROUND(45 + RANDOM() * 30, 2), -- R$45-75
  price_full = ROUND(80 + RANDOM() * 70, 2)  -- R$80-150
WHERE category = 'Luxury';

-- Ultra Luxury: preços premium mas realistas (2ml: R$25-35, 5ml: R$50-70, 10ml: R$90-130, Full: R$180-300)
UPDATE perfumes SET 
  price_2ml = ROUND(25 + RANDOM() * 10, 2),   -- R$25-35
  price_5ml = ROUND(50 + RANDOM() * 20, 2),   -- R$50-70
  price_10ml = ROUND(90 + RANDOM() * 40, 2),  -- R$90-130
  price_full = ROUND(180 + RANDOM() * 120, 2) -- R$180-300
WHERE category = 'Ultra Luxury';

-- 3. ATUALIZAR DESCRIÇÕES PROFISSIONAIS
UPDATE perfumes SET description = CASE name
  -- ULTRA LUXURY (descrições exclusivas e sofisticadas)
  WHEN 'Delina' THEN 'Uma obra-prima olfativa que personifica a elegância feminina absoluta. Esta composição exclusiva combina pétalas de rosa de Damasco com lítchia suculenta e noz-moscada, criando uma sinfonia floral-frutada de rara sofisticação. O coração revela jasmim de Grasse, peônia e incenso, envolvidos por uma base luxuosa de baunilha bourbon, almíscar de caxemira e madeira de oud. Uma fragrância para mulheres que não temem ser inesquecíveis.'
  
  WHEN 'Hombre Leather' THEN 'A quintessência da masculinidade moderna capturada em uma fragrância de couro excepcional. Bergamota italiana e pimenta rosa abrem esta composição viril, enquanto o coração revela couro curtido artesanalmente, mesclado com especiarias raras e tabaco envelhecido. A base profunda de sândalo de Mysore, âmbar negro e vetiver haitiano cria uma presença magnética e inesquecível. Para o homem que comanda respeito pela sua mera presença.'
  
  WHEN 'Prada Paradoxe Intense' THEN 'Um paradoxo olfativo fascinante que desafia convenções e redefine a feminilidade contemporânea. Esta intensificação magistral combina pimenta rosa vibrante com bergamota de Calabria, evoluindo para um coração hipnotizante de flor de laranjeira e jasmim sambac. A base revela o contraste sedutor entre âmbar cristalino e almíscar sensual, criando uma fragrância que é simultaneamente delicada e poderosa, clássica e vanguardista.'
  
  WHEN 'Sospiro Erba Magica' THEN 'Uma jornada sensorial através de um jardim encantado onde cada respiração revela novos segredos. Esta criação artesanal começa com uma explosão de ervas aromáticas mediterrâneas - manjericão selvagem, tomilho siciliano e alecrim - temperadas com limão de Amalfi. O coração mágico desvenda violeta cristalizada, íris florentina e folhas de figueira, enquanto a base terrosa de vetiver, patchouli e musgo de carvalho cria uma ancoragem natural e hipnotizante.'

  -- LUXURY (descrições sofisticadas)
  WHEN 'Givenchy Gent' THEN 'Uma interpretação magistral da elegância masculina parisiense. Esta fragrância sofisticada abre com bergamota francesa e cardamomo negro, evoluindo para um coração de gerânio bourbon e folhas de violeta. A base revela sândalo cremoso, vetiver de Java e almíscar de cachemira, criando uma composição refinada para o cavalheiro contemporâneo que aprecia luxo discreto.'
  
  WHEN 'Goddess' THEN 'Uma celebração da feminilidade divina em sua forma mais pura e poderosa. Esta fragrância celestial combina péra asiática e bergamota dourada na abertura, revelando um coração de jasmim real, magnólia branca e orquídea rara. A base envolvente de baunilha de Madagascar, âmbar solar e almíscar angelical cria uma aura magnética que desperta a deusa interior em cada mulher.'
  
  WHEN 'Orientica Royal Amber' THEN 'Um tributo ao âmbar mais nobre, criado para realeza moderna. Esta composição opulenta inicia com açafrão iraniano e rosa de Taif, desenvolvendo um coração de âmbar líquido, incenso de Omã e especiarias preciosas. A base majestosa de oud cambojano, sândalo real e almíscar tibetano cria uma fragrância digna de palácios, para quem exige o absoluto em luxo olfativo.'
  
  WHEN 'Orientica Royal Victory' THEN 'A fragrância da conquista e do triunfo, criada para celebrar vitórias extraordinárias. Abre com bergamota imperial e pimenta rosa Madagascar, evoluindo para um coração vitorioso de cravo de Zanzibar, canela do Ceilão e noz-moscada das Molucas. A base triunfante combina madeiras nobres, âmbar dourado e almíscar real, criando uma presença que anuncia sucesso.'
  
  WHEN 'Oud Gourmand 85ml' THEN 'Uma fusão revolucionária entre o oud tradicional e a gourmandise francesa. Esta criação única combina oud cambojano purificado com baunilha de Tahiti, criando uma abertura simultaneamente exótica e familiar. O coração revela caramelo flambado, fava tonka venezuelana e especiarias doces, enquanto a base de âmbar gourmet e almíscar cremoso cria uma experiência olfativa verdadeiramente viciante.'
  
  WHEN 'Scandal Absolut' THEN 'O escândalo mais delicioso da perfumaria contemporânea. Esta fragrância audaciosa e irresistível combina mel selvagem e gardênia na abertura, evoluindo para um coração escandaloso de jasmim sambac, tuberosa e patchouli cremoso. A base sedutora de baunilha bourbon, almíscar sensual e madeiras cremosas cria uma composição que provoca, seduz e nunca é esquecida.'

  ELSE description -- Manter descrição atual se não está na lista
END
WHERE category IN ('Ultra Luxury', 'Luxury') AND name IN (
  'Delina', 'Hombre Leather', 'Prada Paradoxe Intense', 'Sospiro Erba Magica',
  'Givenchy Gent', 'Goddess', 'Orientica Royal Amber', 'Orientica Royal Victory', 
  'Oud Gourmand 85ml', 'Scandal Absolut'
);