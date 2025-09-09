-- Correção completa dos perfumes: preços 2ml, descrições profissionais e notas olfativas

-- 1. Corrigir preços 2ml para serem ~40% do preço 5ml (mais barato que 5ml)
UPDATE perfumes SET 
  price_2ml = ROUND(price_5ml * 0.4, 2),
  description = CASE 
    WHEN name = 'Erva mágica' THEN 'Uma jornada sensorial única que combina a frescura vibrante da erva-cidreira com toques mágicos de especiarias orientais. Perfeito para quem busca uma fragrância marcante e sofisticada, ideal para ocasiões especiais onde você quer deixar uma impressão inesquecível.'
    WHEN name = 'Flor de algodão' THEN 'Delicadeza pura em forma de fragrância. Esta composição etérea evoca a suavidade do algodão recém-colhido, mesclada com pétalas de flores brancas que dançam na brisa matinal. Uma fragrância reconfortante e elegante, perfeita para momentos de tranquilidade e sofisticação discreta.'
    WHEN name = 'Chuva de verão' THEN 'Capture a essência revigorante de uma chuva tropical em pleno verão. Notas aquáticas se misturam com ozônio fresco e folhas molhadas, criando uma sensação de renovação e energia. Ideal para quem busca frescor e vitalidade no dia a dia.'
    WHEN name = 'Pôr do sol' THEN 'Um tributo ao momento mais romântico do dia. Tons quentes de âmbar dourado se entrelaçam com especiarias suaves e madeiras cremosas, evocando a magia dos últimos raios de sol. Uma fragrância envolvente e apaixonante para momentos especiais.'
    WHEN name = 'Madrugada' THEN 'A serenidade da madrugada capturada em uma fragrância misteriosa e envolvente. Notas escuras de patchouli e vetiver se equilibram com toques sutis de orvalho matinal, criando uma composição profunda e contemplativa para personalidades marcantes.'
    WHEN name = 'Oceano azul' THEN 'Mergulhe na imensidão do oceano com esta fragrância aquática e refrescante. Sal marinho, brisa oceânica e algas marinhas criam uma sensação de liberdade e aventura. Perfeita para espíritos livres que buscam uma fragrância energizante e revigorante.'
    WHEN name = 'Jardim secreto' THEN 'Descubra os mistérios de um jardim escondido onde flores raras desabrocham em segredo. Uma composição floral sofisticada que mistura rosas selvagens, jasmim noturno e folhas verdes, criando uma fragrância enigmática e sedutora.'
    WHEN name = 'Lua cheia' THEN 'A magia da lua cheia condensada em uma fragrância hipnotizante. Notas prateadas de íris e violeta se misturam com almíscar suave, criando uma aura misteriosa e sedutora. Para quem deseja uma presença marcante e enigmática.'
    WHEN name = 'Brisa matinal' THEN 'Desperte seus sentidos com a frescura de uma manhã de primavera. Notas verdes e cítricas se harmonizam com flores delicadas, proporcionando energia e otimismo para começar o dia. Uma fragrância leve e revigorante para uso diário.'
    WHEN name = 'Noite estrelada' THEN 'Sob um manto de estrelas, esta fragrância noturna revela sua sofisticação. Acordo gourmand com baunilha e especiarias se encontra com madeiras nobres, criando uma composição envolvente e sedutora para noites inesquecíveis.'
    WHEN name = 'Tempestade' THEN 'A força e intensidade de uma tempestade tropical capturada em fragrância. Notas elétricas de ozônio se misturam com terra molhada e madeiras úmidas, criando uma composição poderosa e vibrante para personalidades intensas.'
    WHEN name = 'Amanhecer' THEN 'O renascimento de um novo dia em forma de fragrância. Notas solares e energizantes de cítricos se harmonizam com flores matinais e musgo fresco, proporcionando otimismo e vitalidade. Ideal para novos começos e momentos de inspiração.'
    WHEN name = 'Floresta encantada' THEN 'Aventure-se em uma floresta mágica onde cada passo revela novos aromas. Musgo verde, folhas úmidas e flores silvestres criam uma composição natural e envolvente. Para amantes da natureza que buscam autenticidade e conexão.'
    WHEN name = 'Céu infinito' THEN 'A vastidão do céu azul condensada em uma fragrância aérea e libertadora. Notas de ar puro, nuvens suaves e vento fresco proporcionam uma sensação de leveza e transcendência. Perfeita para sonhadores e visionários.'
    WHEN name = 'Cristal puro' THEN 'Pureza em sua forma mais refinada. Uma composição cristalina que combina notas aquáticas com flores brancas e almíscar limpo, criando uma fragrância imaculada e sofisticada. Para quem aprecia elegância minimalista.'
    WHEN name = 'Fogo selvagem' THEN 'A paixão ardente de um fogo selvagem em forma de fragrância. Especiarias quentes, madeiras fumegantes e resinas exóticas criam uma composição intensa e sedutora. Para personalidades apaixonadas e marcantes.'
    WHEN name = 'Terra sagrada' THEN 'Conecte-se com a energia ancestral da terra. Notas terrosas de patchouli, sândalo e incenso se misturam com especiarias sagradas, criando uma fragrância profunda e espiritual. Para momentos de meditação e introspecção.'
    WHEN name = 'Vento livre' THEN 'A liberdade do vento em uma fragrância dinâmica e energizante. Notas aéreas e frescas se misturam com madeiras leves e musgo, proporcionando uma sensação de movimento e aventura. Para espíritos livres e aventureiros.'
    WHEN name = 'Orvalho matinal' THEN 'A delicadeza do orvalho da manhã capturada em uma fragrância etérea. Gotas de água pura se misturam com pétalas frescas e folhas verdes, criando uma composição suave e renovadora. Perfeita para momentos de paz e contemplação.'
    WHEN name = 'Raio de sol' THEN 'O calor dourado do sol condensado em fragrância. Notas solares e radiantes se harmonizam with flores amarelas e frutas maduras, proporcionando alegria e energia positiva. Ideal para iluminar dias cinzentos e espalhar otimismo.'
    WHEN name = 'Mistério noturno' THEN 'Os segredos da noite revelados em uma fragrância enigmática. Notas escuras e sedutoras se misturam com flores noturnas e madeiras misteriosas, criando uma composição hipnotizante. Para quem possui uma aura magnética e intrigante.'
    WHEN name = 'Doce tentação' THEN 'Uma tentação irresistível em forma de fragrância gourmand. Notas doces de caramelo, baunilha e frutas vermelhas se entrelaçam criando uma composição viciante e sedutora. Para quem não resiste a prazeres doces e momentos de indulgência.'
    WHEN name = 'Essência divina' THEN 'A perfeição em forma de fragrância luxury. Uma composição celestial que combina as mais nobres essências florais com madeiras preciosas e almíscar angelical. Uma experiência olfativa transcendente para ocasiões verdadeiramente especiais.'
    WHEN name = 'Elixir dourado' THEN 'O ouro líquido da perfumaria em uma fragrância ultra-luxuosa. Açafrão dourado, oud envelhecido e rosa de Damasco criam uma composição real e majestosa. Para quem exige o mais refinado e exclusivo em fragrâncias.'
    WHEN name = 'Diamante negro' THEN 'Raro e precioso como um diamante negro. Esta fragrância ultra-exclusiva combina trufas negras, caviar e madeiras exóticas em uma composição sem igual. Uma joia olfativa para colecionadores e conhecedores de luxo absoluto.'
    WHEN name = 'Perola celestial' THEN 'A iridescência de uma pérola celestial capturada em fragrância. Nácar luminoso, flores lunares e essências etéreas criam uma composição divina e supernatural. O ápice da elegância e sofisticação olfativa.'
    WHEN name = 'Ambergris real' THEN 'O mais nobre dos ingredientes marinhos em uma fragrância real. Ambergris autêntico se mistura com especiarias reais e madeiras centenárias, criando uma composição digna da realeza. Exclusividade absoluta em cada borrifada.'
    ELSE description
  END,
  top_notes = CASE 
    WHEN name = 'Erva mágica' THEN ARRAY['Erva-cidreira', 'Bergamota', 'Cardamomo verde']
    WHEN name = 'Flor de algodão' THEN ARRAY['Algodão', 'Peônia branca', 'Cassis']
    WHEN name = 'Chuva de verão' THEN ARRAY['Ozônio', 'Mandarina', 'Folhas molhadas']
    WHEN name = 'Pôr do sol' THEN ARRAY['Bergamota dourada', 'Açafrão', 'Cardamomo']
    WHEN name = 'Madrugada' THEN ARRAY['Lavanda', 'Artemísia', 'Orvalho']
    WHEN name = 'Oceano azul' THEN ARRAY['Sal marinho', 'Limão siciliano', 'Algas']
    WHEN name = 'Jardim secreto' THEN ARRAY['Rosa selvagem', 'Peônia', 'Folhas verdes']
    WHEN name = 'Lua cheia' THEN ARRAY['Íris', 'Aldeídos', 'Pimenta rosa']
    WHEN name = 'Brisa matinal' THEN ARRAY['Limão', 'Menta', 'Folhas de figo']
    WHEN name = 'Noite estrelada' THEN ARRAY['Ameixa', 'Canela', 'Rosa búlgara']
    WHEN name = 'Tempestade' THEN ARRAY['Ozônio elétrico', 'Gengibre', 'Folhas de eucalipto']
    WHEN name = 'Amanhecer' THEN ARRAY['Laranja doce', 'Grapefruit', 'Hortelã']
    WHEN name = 'Floresta encantada' THEN ARRAY['Pinheiro', 'Musgo', 'Violeta selvagem']
    WHEN name = 'Céu infinito' THEN ARRAY['Ar puro', 'Íris azul', 'Aldeídos aéreos']
    WHEN name = 'Cristal puro' THEN ARRAY['Água cristalina', 'Lírio branco', 'Aldeídos cristalinos']
    WHEN name = 'Fogo selvagem' THEN ARRAY['Pimenta vermelha', 'Gengibre', 'Canela ardente']
    WHEN name = 'Terra sagrada' THEN ARRAY['Incenso', 'Elemi', 'Copal']
    WHEN name = 'Vento livre' THEN ARRAY['Ar fresco', 'Eucalipto', 'Menta glacial']
    WHEN name = 'Orvalho matinal' THEN ARRAY['Gotas de orvalho', 'Freesia', 'Folhas verdes']
    WHEN name = 'Raio de sol' THEN ARRAY['Laranja dourada', 'Limão Meyer', 'Gengibre cristalizado']
    WHEN name = 'Mistério noturno' THEN ARRAY['Violeta negra', 'Pimenta preta', 'Aldeídos escuros']
    WHEN name = 'Doce tentação' THEN ARRAY['Pêra', 'Groselha vermelha', 'Mandarina']
    WHEN name = 'Essência divina' THEN ARRAY['Rosa de Damasco', 'Bergamota Earl Grey', 'Açafrão dourado']
    WHEN name = 'Elixir dourado' THEN ARRAY['Açafrão iranian', 'Rosa de Taif', 'Cardamomo negro']
    WHEN name = 'Diamante negro' THEN ARRAY['Trufa negra', 'Pimenta rosa', 'Caviar']
    WHEN name = 'Perola celestial' THEN ARRAY['Nácar', 'Íris florentina', 'Aldeídos iridescentes']
    WHEN name = 'Ambergris real' THEN ARRAY['Ambergris', 'Bergamota de Calabria', 'Pimenta rosa Madagascar']
    ELSE top_notes
  END,
  heart_notes = CASE 
    WHEN name = 'Erva mágica' THEN ARRAY['Gengibre', 'Noz-moscada', 'Folhas de chá verde']
    WHEN name = 'Flor de algodão' THEN ARRAY['Jasmim', 'Muguet', 'Rosa branca']
    WHEN name = 'Chuva de verão' THEN ARRAY['Lírio aquático', 'Ciclâmen', 'Ar fresco']
    WHEN name = 'Pôr do sol' THEN ARRAY['Âmbar dourado', 'Cravo', 'Rosa damasco']
    WHEN name = 'Madrugada' THEN ARRAY['Gerânio', 'Sálvia', 'Violeta']
    WHEN name = 'Oceano azul' THEN ARRAY['Lírio marinho', 'Jasmim aquático', 'Ciclâmen']
    WHEN name = 'Jardim secreto' THEN ARRAY['Jasmim sambac', 'Rosa centifolia', 'Lírio do vale']
    WHEN name = 'Lua cheia' THEN ARRAY['Violeta', 'Rosa prateada', 'Orquídea lunar']
    WHEN name = 'Brisa matinal' THEN ARRAY['Jasmim', 'Lírio do vale', 'Chá verde']
    WHEN name = 'Noite estrelada' THEN ARRAY['Chocolate', 'Café', 'Rosa negra']
    WHEN name = 'Tempestade' THEN ARRAY['Cedro molhado', 'Vetiver', 'Terra úmida']
    WHEN name = 'Amanhecer' THEN ARRAY['Neroli', 'Jasmim matinal', 'Chá branco']
    WHEN name = 'Floresta encantada' THEN ARRAY['Cedro', 'Vetiver', 'Violeta silvestre']
    WHEN name = 'Céu infinito' THEN ARRAY['Nuvens', 'Brisa', 'Lírio celeste']
    WHEN name = 'Cristal puro' THEN ARRAY['Magnólia', 'Peônia cristal', 'Musgo branco']
    WHEN name = 'Fogo selvagem' THEN ARRAY['Cravo', 'Pimenta preta', 'Tabaco']
    WHEN name = 'Terra sagrada' THEN ARRAY['Sândalo', 'Mirra', 'Cedro do Atlas']
    WHEN name = 'Vento livre' THEN ARRAY['Cedro branco', 'Vetiver fresco', 'Lírio do campo']
    WHEN name = 'Orvalho matinal' THEN ARRAY['Rosa do orvalho', 'Peônia', 'Lírio aquático']
    WHEN name = 'Raio de sol' THEN ARRAY['Ylang-ylang', 'Mimosa', 'Flor de laranjeira']
    WHEN name = 'Mistério noturno' THEN ARRAY['Rosa negra', 'Orquídea', 'Incenso escuro']
    WHEN name = 'Doce tentação' THEN ARRAY['Caramelo', 'Baunilha bourbon', 'Flor de tiaré']
    WHEN name = 'Essência divina' THEN ARRAY['Jasmim de Grasse', 'Rosa centifolia', 'Orquídea real']
    WHEN name = 'Elixir dourado' THEN ARRAY['Oud cambojano', 'Rosa de Ispahan', 'Jasmim sambac']
    WHEN name = 'Diamante negro' THEN ARRAY['Oud negro', 'Rosa preta', 'Orquídea rara']
    WHEN name = 'Perola celestial' THEN ARRAY['Rosa lunar', 'Jasmim noturno', 'Orquídea divina']
    WHEN name = 'Ambergris real' THEN ARRAY['Oud royal', 'Rosa de Damasco', 'Jasmim imperial']
    ELSE heart_notes
  END,
  base_notes = CASE 
    WHEN name = 'Erva mágica' THEN ARRAY['Vetiver', 'Cedro', 'Almíscar branco']
    WHEN name = 'Flor de algodão' THEN ARRAY['Almíscar suave', 'Madeiras brancas', 'Âmbar clean']
    WHEN name = 'Chuva de verão' THEN ARRAY['Musgo aquático', 'Madeira flotante', 'Almíscar fresco']
    WHEN name = 'Pôr do sol' THEN ARRAY['Sândalo', 'Baunilha', 'Almíscar dourado']
    WHEN name = 'Madrugada' THEN ARRAY['Patchouli', 'Vetiver', 'Almíscar escuro']
    WHEN name = 'Oceano azul' THEN ARRAY['Âmbar oceânico', 'Madeira deriva', 'Almíscar marinho']
    WHEN name = 'Jardim secreto' THEN ARRAY['Sândalo', 'Âmbar', 'Almíscar verde']
    WHEN name = 'Lua cheia' THEN ARRAY['Almíscar lunar', 'Sândalo prateado', 'Âmbar cristalino']
    WHEN name = 'Brisa matinal' THEN ARRAY['Cedro branco', 'Almíscar limpo', 'Âmbar solar']
    WHEN name = 'Noite estrelada' THEN ARRAY['Baunilha bourbon', 'Sândalo', 'Almíscar sensual']
    WHEN name = 'Tempestade' THEN ARRAY['Patchouli molhado', 'Vetiver tempestuoso', 'Almíscar terroso']
    WHEN name = 'Amanhecer' THEN ARRAY['Madeiras claras', 'Almíscar radiante', 'Âmbar matinal']
    WHEN name = 'Floresta encantada' THEN ARRAY['Musgo de carvalho', 'Âmbar verde', 'Almíscar selvagem']
    WHEN name = 'Céu infinito' THEN ARRAY['Almíscar celestial', 'Madeiras etéreas', 'Âmbar aéreo']
    WHEN name = 'Cristal puro' THEN ARRAY['Almíscar cristalino', 'Madeira de caxemira', 'Âmbar transparente']
    WHEN name = 'Fogo selvagem' THEN ARRAY['Âmbar ardente', 'Patchouli fumegante', 'Almíscar selvagem']
    WHEN name = 'Terra sagrada' THEN ARRAY['Patchouli sagrado', 'Âmbar místico', 'Almíscar terroso']
    WHEN name = 'Vento livre' THEN ARRAY['Madeiras ventosas', 'Almíscar livre', 'Âmbar dinâmico']
    WHEN name = 'Orvalho matinal' THEN ARRAY['Almíscar delicado', 'Madeiras suaves', 'Âmbar etéreo']
    WHEN name = 'Raio de sol' THEN ARRAY['Baunilha dourada', 'Sândalo solar', 'Almíscar radiante']
    WHEN name = 'Mistério noturno' THEN ARRAY['Âmbar negro', 'Patchouli misterioso', 'Almíscar noturno']
    WHEN name = 'Doce tentação' THEN ARRAY['Baunilha Madagascar', 'Tonka bean', 'Almíscar gourmand']
    WHEN name = 'Essência divina' THEN ARRAY['Sândalo mysore', 'Âmbar divino', 'Almíscar celestial']
    WHEN name = 'Elixir dourado' THEN ARRAY['Oud envelhecido', 'Âmbar dourado', 'Almíscar real']
    WHEN name = 'Diamante negro' THEN ARRAY['Oud negro', 'Âmbar escuro', 'Almíscar raro']
    WHEN name = 'Perola celestial' THEN ARRAY['Sândalo lunar', 'Âmbar iridescente', 'Almíscar divino']
    WHEN name = 'Ambergris real' THEN ARRAY['Ambergris envelhecido', 'Sândalo real', 'Almíscar imperial']
    ELSE base_notes
  END
WHERE id IN (
  SELECT id FROM perfumes 
  ORDER BY 
    CASE 
      WHEN category = 'Premium' THEN 1 
      WHEN category = 'Luxury' THEN 2 
      WHEN category = 'Ultra Luxury' THEN 3 
      ELSE 4 
    END,
    created_at
);