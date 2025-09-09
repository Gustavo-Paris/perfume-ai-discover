-- PARTE 4: COMPLETAR DESCRIÇÕES DOS PERFUMES PREMIUM RESTANTES

UPDATE perfumes SET description = CASE name
  WHEN 'Eternal Oud' THEN 'Uma celebração eterna do oud em sua forma mais refinada e duradoura. Esta fragrância atemporal abre com oud envelhecido e rosa persa, revelando um coração de incenso sagrado, madeira de sândalo e especiarias orientais. A base eterna de âmbar fóssil, almíscar tibetano e resinas preciosas cria uma presença que transcende o tempo, perfeita para momentos eternamente memoráveis.'

  WHEN 'Fakhar' THEN 'O orgulho oriental materializado em uma fragrância de prestígio incomparável. Esta composição majestosa abre com açafrão dourado e cardamomo real, evoluindo para um coração orgulhoso de rosa de Damasco, oud purificado e especiarias nobres. A base gloriosa de âmbar real, almíscar de gazela e madeiras centenárias cria uma presença que inspira respeito e admiração.'

  WHEN 'Lattafa Asad EDP' THEN 'A força e majestade do leão capturadas em uma fragrância poderosa e imponente. Esta composição viril abre com bergamota selvagem e pimenta negra, revelando um coração feroz de couro curtido, tabaco e especiarias ardentes. A base dominante de âmbar escuro, vetiver selvagem e almíscar felino cria uma presença que comanda território e respeito.'

  WHEN 'Lattafa Yara EDP' THEN 'Uma doçura sedutora que encanta e hipnotiza com sua feminilidade irresistível. Esta fragrância gourmand abre com heliotropo e orquídea, evoluindo para um coração doce de caramelo floral, baunilha de Tahiti e flor de tiaré. A base sedutora de almíscar de cassis, âmbar gourmand e madeiras cremosas cria uma trilha viciante e absolutamente feminina.'

  WHEN 'Liquid Brun' THEN 'Uma interpretação líquida e intensa da elegância masculina contemporânea. Esta fragrância marrom profunda abre com bergamota escura e cardamomo negro, revelando um coração líquido de tabaco envelhecido, couro macio e especiarias fumegantes. A base fluida de âmbar líquido, vetiver chocolate e almíscar terroso cria uma textura olfativa rica e envolvente.'

  WHEN 'Liquid Brun Homme' THEN 'A versão masculina definitiva da elegância líquida, criada para o homem sofisticado. Esta composição robusta abre com bergamota negra e gengibre, desenvolvendo um coração masculino de couro italiano, madeira de cedro e tabaco cubano. A base sólida de âmbar escuro, patchouli e almíscar viril cria uma presença confiante e magnética.'

  WHEN 'Orientica Amber Rouge' THEN 'Um âmbar vermelho ardente que incendeia os sentidos com sua intensidade apaixonada. Esta fragrância intensa abre com açafrão flamejante e pimenta vermelha, evoluindo para um coração ardente de âmbar líquido, rosa escarlate e especiarias incandescentes. A base flamejante de labdanum, almíscar vermelho e madeiras queimadas cria uma experiência olfativa verdadeiramente explosiva.'

  WHEN 'Orientica Azure Fantasy' THEN 'Uma fantasia azul celestial que transporta para dimensões oníricas de beleza. Esta fragrância etérea abre com bergamota azul e íris cristalina, revelando um coração fantástico de violeta aquática, jasmim lunar e especiarias etéreas. A base fantástica de âmbar azul, almíscar cristalino e madeiras celestiais cria uma experiência que transcende a realidade.'

  WHEN 'Sabah Al Ward' THEN 'A manhã das rosas capturada em uma fragrância que celebra o despertar floral. Esta composição matinal abre com rosa damascena fresca e bergamota matinal, revelando um coração floral de jasmim do amanhecer, peônia e folhas de rosa. A base suave de almíscar rosado, âmbar claro e madeiras delicadas cria uma presença feminina e reconfortante como uma manhã de primavera.'

  WHEN 'Supremacy Collector''s' THEN 'Uma edição de colecionador que representa o ápice da supremacia olfativa. Esta fragrância exclusiva abre com bergamota premium e cardamomo rare, evoluindo para um coração supremo de oud selecionado, rosa de colecionador e especiarias únicas. A base suprema de âmbar vintage, almíscar de coleção e madeiras raras cria uma experiência reservada apenas para os verdadeiros conhecedores.'

  ELSE description
END
WHERE category = 'Premium' AND name IN (
  'Eternal Oud', 'Fakhar', 'Lattafa Asad EDP', 'Lattafa Yara EDP', 'Liquid Brun',
  'Liquid Brun Homme', 'Orientica Amber Rouge', 'Orientica Azure Fantasy', 
  'Sabah Al Ward', 'Supremacy Collector''s'
);