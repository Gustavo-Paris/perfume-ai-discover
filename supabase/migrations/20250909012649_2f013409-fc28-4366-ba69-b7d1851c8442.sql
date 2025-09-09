-- PARTE 3: ATUALIZAR DESCRIÇÕES DOS PERFUMES PREMIUM

-- Atualizar descrições profissionais para perfumes Premium com descrições básicas
UPDATE perfumes SET description = CASE name
  WHEN 'Asad Bourbon' THEN 'Uma interpretação robusta e sofisticada do bourbon clássico. Esta fragrância masculina abre com notas vibrantes de bergamota e cardamomo, evoluindo para um coração rico de bourbon envelhecido, canela e noz-moscada. A base profunda de carvalho americano, baunilha e tabaco cria uma presença marcante e confiante, perfeita para o homem moderno que aprecia tradição e elegância.'

  WHEN 'Atheeri' THEN 'Uma composição etérea que transcende o comum, criando uma experiência olfativa quase celestial. Esta fragrância unissex combina bergamota cristalina e pétala de rosa na abertura, revelando um coração de jasmim noturno, íris e especiarias suaves. A base etérea de almíscar branco, madeiras claras e âmbar transparente cria uma presença sutil mas inesquecível.'

  WHEN 'Atheeri Paraguai' THEN 'Uma interpretação exclusiva da lendária Atheeri, trazendo a essência importada em uma composição refinada. Esta versão especial combina cítricos sul-americanos com flores tropicais, criando um coração de jasmim paraguaio e orquídea selvagem. A base de madeiras exóticas e almíscar tropical oferece uma experiência única e cativante.'

  WHEN 'Azzure Aoud' THEN 'Uma fusão harmoniosa entre o azul infinito do mar e a profundidade mística do oud. Esta fragrância sofisticada abre com bergamota azul e sal marinho, evoluindo para um coração de oud purificado, rosa aquática e especiarias marinhas. A base de âmbar oceânico e madeiras flotadas cria uma composição que evoca liberdade e mistério.'

  WHEN 'Bade''s Al Oud' THEN 'Uma homenagem ao oud tradicional em sua forma mais pura e respeitosa. Esta fragrância clássica apresenta oud cambojano autêntico na abertura, acompanhado de rosa de Damasco e açafrão dourado. O coração revela sândalo de Mysore e incenso de Omã, enquanto a base de âmbar negro e almíscar preserva a tradição milenar do oud oriental.'

  WHEN 'Classic Stone' THEN 'Uma fragrância que evoca a solidez e elegância das pedras preciosas lapidadas. Esta composição sofisticada abre com bergamota italiana e pimenta rosa, desenvolvendo um coração de gerânio mineral, violeta e especiarias secas. A base rochosa de vetiver, patchouli e musgo de pedra cria uma ancoragem terrosa e masculina inesquecível.'

  WHEN 'Club de Nuit Maleka' THEN 'A versão feminina sofisticada que celebra a elegância noturna oriental. Esta fragrância luxuosa combina groselha preta e bergamota na abertura, revelando um coração de rosa turca, jasmim sambac e especiarias douradas. A base sedutora de âmbar, patchouli e almíscar cria uma presença magnética perfeita para a mulher moderna e misteriosa.'

  WHEN 'Clube de nuit Feminino' THEN 'Uma interpretação feminina do clássico noturno, criada para a mulher que comanda a noite com elegância. Esta fragrância sofisticada abre com frutas vermelhas e bergamota siciliana, evoluindo para um coração de rosa búlgara, jasmim e íris. A base envolvente de baunilha, âmbar e madeiras cremosas cria uma trilha sedutora e inesquecível.'

  WHEN 'Clube de nuit Intense' THEN 'A intensificação magistral do clássico noturno, criada para momentos de máxima expressão. Esta versão potente abre com bergamota negra e groselha, desenvolvendo um coração intenso de rosa escura, patchouli e especiarias orientais. A base profunda de âmbar negro, madeiras fumegantes e almíscar cria uma presença dominante e hipnotizante.'

  WHEN 'Eclaire' THEN 'Uma fragrância luminosa que captura a essência da luz dourada do amanhecer. Esta composição radiante abre com bergamota solar e pêra cristalizada, revelando um coração de jasmim dourado, magnólia e flor de laranjeira. A base luminosa de âmbar solar, almíscar radiante e madeiras claras cria uma aura de positividade e elegância natural.'

  ELSE description
END
WHERE category = 'Premium' AND name IN (
  'Asad Bourbon', 'Atheeri', 'Atheeri Paraguai', 'Azzure Aoud', 'Bade''s Al Oud',
  'Classic Stone', 'Club de Nuit Maleka', 'Clube de nuit Feminino', 'Clube de nuit Intense', 'Eclaire'
);