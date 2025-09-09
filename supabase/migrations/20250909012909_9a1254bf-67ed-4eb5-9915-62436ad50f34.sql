-- PARTE 4: FINALIZAR DESCRIÇÕES DOS PERFUMES PREMIUM RESTANTES

UPDATE perfumes SET description = CASE name
  WHEN 'Eternal Oud' THEN 'Uma celebração eterna do oud mais nobre, criada para atravessar gerações. Esta fragrância atemporal apresenta oud envelhecido de 20 anos na abertura, harmonizado com rosa persa e açafrão real. O coração revela sândalo sagrado, incenso de templo e especiarias ancestrais. A base eterna de âmbar fossilizado e almíscar de caxemira garante uma longevidade excepcional e uma presença verdadeiramente marcante.'

  WHEN 'Fakhar' THEN 'O orgulho oriental materializado em uma fragrância de prestígio absoluto. Esta composição majestosa abre com bergamota real e cardamomo dourado, desenvolvendo um coração orgulhoso de rosa de Damasco, oud nobre e especiarias imperiais. A base gloriosa de âmbar real, sândalo precioso e almíscar de prestígio cria uma presença que honra as tradições mais nobres do Oriente.'

  WHEN 'Lattafa Asad EDP' THEN 'A força e majestade do leão capturadas em uma fragrância de poder absoluto. Esta composição viril abre com bergamota imperial e pimenta preta, evoluindo para um coração leonino de cedro do Atlas, especiarias selvagens e couro curtido. A base dominante de âmbar animal, vetiver selvagem e almíscar feroz cria uma presença que comanda respeito e admiração.'

  WHEN 'Lattafa Yara EDP' THEN 'A doçura feminina elevada à sua expressão mais refinada e sedutora. Esta fragrância gourmand sofisticada abre com frutas vermelhas cristalizadas e bergamota doce, revelando um coração de caramelo artesanal, baunilha bourbon e flor de tiaré. A base envolvente de âmbar gourmand, almíscar cremoso e madeiras doces cria uma trilha irresistível e viciante.'

  WHEN 'Liquid Brun' THEN 'A intensidade líquida do marrom mais profundo e sedutor. Esta fragrância misteriosa abre com especiarias escuras e bergamota fumegante, desenvolvendo um coração de chocolate belga, café expresso e tabaco envelhecido. A base líquida de âmbar escuro, madeiras torradas e almíscar terroso cria uma composição hipnotizante e profundamente masculina.'

  WHEN 'Liquid Brun Homme' THEN 'A versão masculina definitiva do líquido marrom, criada para o homem de caráter intenso. Esta fragrância potente combina bergamota defumada e pimenta negra na abertura, evoluindo para um coração de couro envelhecido, madeiras carbonizadas e especiarias tostadas. A base profunda de âmbar negro, vetiver fumegante e almíscar animal cria uma presença dominante e memorável.'

  WHEN 'Orientica Amber Rouge' THEN 'O âmbar vermelho mais intenso e apaixonado da perfumaria oriental. Esta fragrância ardente abre com bergamota rubra e especiarias flamejantes, desenvolvendo um coração de âmbar líquido, rosa vermelha e incenso ardente. A base ígnea de resinas preciosas, madeiras rubras e almíscar de fogo cria uma composição que queima na memória para sempre.'

  WHEN 'Orientica Azure Fantasy' THEN 'Uma fantasia azul que transporta para dimensões de sonho e mistério. Esta fragrância etérea combina bergamota celeste e ozônio cristalino na abertura, revelando um coração de flores lunares, íris azul e especiarias etéreas. A base fantástica de âmbar azure, madeiras celestiais e almíscar onírico cria uma experiência olfativa quase sobrenatural.'

  WHEN 'Sabah Al Ward' THEN 'A manhã das rosas capturada em sua essência mais pura e radiante. Esta fragrância matinal abre com pétalas de rosa cobertas de orvalho e bergamota aurora, desenvolvendo um coração de rosa damascena, jasmim matinal e folhas verdes. A base solar de âmbar dourado, almíscar suave e madeiras claras evoca a beleza eterna de um jardim ao amanhecer.'

  WHEN 'Supremacy Collector''s' THEN 'Uma edição de colecionador que representa o ápice da supremacia olfativa. Esta fragrância exclusiva combina ingredientes raros - bergamota centenária, rosa de coleção e especiarias de museu. O coração revela oud de arquivo, incenso de templo ancestral e flores preservadas em âmbar. A base colecionável de resinas fossilizadas e almíscar vintage cria uma peça única para verdadeiros conhecedores.'

  ELSE description
END
WHERE category = 'Premium' AND name IN (
  'Eternal Oud', 'Fakhar', 'Lattafa Asad EDP', 'Lattafa Yara EDP', 'Liquid Brun',
  'Liquid Brun Homme', 'Orientica Amber Rouge', 'Orientica Azure Fantasy', 
  'Sabah Al Ward', 'Supremacy Collector''s'
);