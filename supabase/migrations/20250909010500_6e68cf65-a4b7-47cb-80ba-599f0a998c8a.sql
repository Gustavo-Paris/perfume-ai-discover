-- Atualizar perfumes com descrições detalhadas e notas olfativas
UPDATE perfumes SET 
  description = CASE name
    -- Premium Perfumes
    WHEN 'Dolce & Gabbana Light Blue' THEN 'Uma fragrância fresca e mediterrânea que evoca a sensação de liberdade das ilhas italianas. Perfeita para o uso diário, traz leveza e sofisticação em cada borrifada. Ideal para quem busca frescor e elegância casual.'
    WHEN 'Calvin Klein CK One' THEN 'O ícone unissex que revolucionou a perfumaria moderna. Uma composição limpa e contemporânea que se adapta a qualquer personalidade. Perfeito para o dia a dia urbano e momentos descontraídos.'
    WHEN 'Hugo Boss Bottled' THEN 'Masculinidade moderna em sua essência. Uma fragrância que combina tradição e inovação, ideal para o homem contemporâneo que valoriza elegância e sofisticação no cotidiano.'
    WHEN 'Paco Rabanne 1 Million' THEN 'O perfume da sedução e do carisma. Uma fragrância magnética que desperta confiança e atrai olhares. Perfeito para ocasiões especiais e momentos em que você quer se destacar.'
    WHEN 'Carolina Herrera Good Girl' THEN 'A dualidade feminina em uma única fragrância. Doce e rebelde, elegante e ousada. Para mulheres que não têm medo de mostrar sua complexidade e charme natural.'
    WHEN 'Versace Eros' THEN 'Paixão grega em forma de perfume. Uma fragrância poderosa que desperta os sentidos e conquista corações. Ideal para homens confiantes que sabem o que querem.'
    WHEN 'Yves Saint Laurent Black Opium' THEN 'Vício em forma de perfume. Uma fragrância intensa e sedutora que marca presença onde quer que você vá. Para mulheres fortes e determinadas.'
    WHEN 'Dior Sauvage' THEN 'A selvageria domesticada. Uma fragrância fresca e intensa que define a masculinidade moderna. Perfeita para quem busca naturalidade e força interior.'
    WHEN 'Chanel Coco Mademoiselle' THEN 'Elegância parisiense em sua forma mais pura. Uma fragrância atemporal que traduz sofisticação e feminilidade. Para mulheres que apreciam o refinamento clássico.'
    WHEN 'Tom Ford Black Orchid' THEN 'Mistério e luxúria em harmonia perfeita. Uma fragrância unissex que desafia convenções e desperta curiosidade. Para personalidades únicas e marcantes.'
    
    -- Luxury Perfumes  
    WHEN 'Creed Aventus' THEN 'A fragrância dos vencedores. Inspirada nos grandes imperadores da história, combina força e elegância em uma composição única. Para homens que lideram e inspiram.'
    WHEN 'Tom Ford Oud Wood' THEN 'O oud mais refinado e acessível. Uma jornada olfativa ao Oriente, suave e envolvente. Perfeita para quem aprecia a sofisticação das madeiras nobres.'
    WHEN 'Maison Margiela Replica By the Fireplace' THEN 'O conforto do lar em forma de perfume. Evoca memórias de noites aconchegantes junto à lareira. Uma fragrância que abraça e acolhe a alma.'
    WHEN 'Le Labo Santal 33' THEN 'O perfume cult de Nova York. Uma fragrância unissex viciante que se tornou símbolo de modernidade e bom gosto. Para quem busca exclusividade urbana.'
    WHEN 'Byredo Gypsy Water' THEN 'Liberdade cigana em essência. Uma fragrância que evoca viagens e aventuras, leve e misteriosa. Para espíritos livres que valorizam a autenticidade.'
    WHEN 'Diptyque Philosykos' THEN 'A figueira mediterrânea em sua totalidade. Das folhas aos frutos, uma homenagem botânica única. Para amantes da natureza e da arte olfativa.'
    WHEN 'Amouage Interlude Man' THEN 'Teatro olfativo em ato único. Uma fragrância dramática e complexa que conta histórias. Para homens que apreciam a arte da perfumaria de nicho.'
    WHEN 'Nasomatto Black Afgano' THEN 'Rebeldia verde em forma de perfume. Uma fragrância provocativa que desafia e seduz. Para personalidades alternativas e corajosas.'
    
    -- Ultra Luxury Perfumes
    WHEN 'Clive Christian No. 1' THEN 'A realeza olfativa. O perfume mais luxuoso do mundo, uma composição imperial que define a excelência absoluta. Para quem não aceita menos que a perfeição.'
    WHEN 'Roja Dove Creation-E' THEN 'Maestria perfumística em estado puro. Uma sinfonia olfativa que demonstra o que há de mais refinado na arte da perfumaria. Exclusividade para poucos.'
    WHEN 'Amouage Gold Woman' THEN 'Ouro líquido feminino. Uma fragrância que exala luxo e sofisticação oriental. Para mulheres que são verdadeiras rainhas em essência.'
    WHEN 'Creed Green Irish Tweed' THEN 'A elegância irlandesa em sua forma mais nobre. Uma fragrância clássica que atravessa gerações mantendo sua relevância. Para cavalheiros de bom gosto.'
    WHEN 'Baccarat Rouge 540' THEN 'Cristal olfativo em forma líquida. Uma fragrância que brilha como uma joia rara. Para quem aprecia o luxo em sua forma mais pura e radiante.'
    ELSE description
  END,
  
  top_notes = CASE name
    -- Premium
    WHEN 'Dolce & Gabbana Light Blue' THEN ARRAY['Limão Siciliano', 'Maçã Verde', 'Cedro', 'Sino de Canterbury']
    WHEN 'Calvin Klein CK One' THEN ARRAY['Limão', 'Toranja Rosa', 'Bergamota', 'Tangerina', 'Cardamomo']
    WHEN 'Hugo Boss Bottled' THEN ARRAY['Maçã', 'Ameixa', 'Limão', 'Bergamota', 'Folhas de Louro']
    WHEN 'Paco Rabanne 1 Million' THEN ARRAY['Toranja', 'Hortelã', 'Tangerina Vermelha']
    WHEN 'Carolina Herrera Good Girl' THEN ARRAY['Limão', 'Amêndoa', 'Café']
    WHEN 'Versace Eros' THEN ARRAY['Hortelã', 'Maçã Verde', 'Limão']
    WHEN 'Yves Saint Laurent Black Opium' THEN ARRAY['Pera', 'Laranja', 'Groselha Preta']
    WHEN 'Dior Sauvage' THEN ARRAY['Bergamota', 'Pimenta Rosa']
    WHEN 'Chanel Coco Mademoiselle' THEN ARRAY['Laranja', 'Bergamota', 'Tangerina']
    WHEN 'Tom Ford Black Orchid' THEN ARRAY['Trufa', 'Ylang Ylang', 'Bergamota', 'Groselha Preta']
    
    -- Luxury
    WHEN 'Creed Aventus' THEN ARRAY['Abacaxi', 'Bergamota', 'Maçã', 'Groselha Preta']
    WHEN 'Tom Ford Oud Wood' THEN ARRAY['Pau-rosa', 'Cardamomo', 'Pimenta Rosa']
    WHEN 'Maison Margiela Replica By the Fireplace' THEN ARRAY['Laranja', 'Folhas de Violeta', 'Pimenta Rosa']
    WHEN 'Le Labo Santal 33' THEN ARRAY['Cardamomo', 'Íris', 'Violeta']
    WHEN 'Byredo Gypsy Water' THEN ARRAY['Bergamota', 'Limão', 'Pimenta', 'Gengibre']
    WHEN 'Diptyque Philosykos' THEN ARRAY['Folhas de Figueira', 'Figo Verde']
    WHEN 'Amouage Interlude Man' THEN ARRAY['Bergamota', 'Pimenta', 'Orégano', 'Pimenta Preta']
    WHEN 'Nasomatto Black Afgano' THEN ARRAY['Maconha', 'Folhas Verdes']
    
    -- Ultra Luxury
    WHEN 'Clive Christian No. 1' THEN ARRAY['Bergamota', 'Limão', 'Cardamomo', 'Noz-moscada', 'Tomilho']
    WHEN 'Roja Dove Creation-E' THEN ARRAY['Bergamota', 'Limão', 'Petit Grain', 'Tomilho']
    WHEN 'Amouage Gold Woman' THEN ARRAY['Lírio', 'Pêssego', 'Damasco', 'Coco', 'Prata']
    WHEN 'Creed Green Irish Tweed' THEN ARRAY['Limão', 'Hortelã', 'Folhas de Violeta']
    WHEN 'Baccarat Rouge 540' THEN ARRAY['Açafrão', 'Jasmim', 'Amêndoa Amarga', 'Cedro']
    ELSE top_notes
  END,
  
  heart_notes = CASE name
    -- Premium
    WHEN 'Dolce & Gabbana Light Blue' THEN ARRAY['Bambu', 'Jasmim', 'Rosa Branca']
    WHEN 'Calvin Klein CK One' THEN ARRAY['Jasmim', 'Rosa', 'Lírio do Vale', 'Íris', 'Noz-moscada']
    WHEN 'Hugo Boss Bottled' THEN ARRAY['Gerânio', 'Cravo', 'Canela']
    WHEN 'Paco Rabanne 1 Million' THEN ARRAY['Canela', 'Couro', 'Rosa']
    WHEN 'Carolina Herrera Good Girl' THEN ARRAY['Jasmim', 'Tuberosa', 'Flor de Laranjeira']
    WHEN 'Versace Eros' THEN ARRAY['Gerânio', 'Ambroxan', 'Fava Tonka']
    WHEN 'Yves Saint Laurent Black Opium' THEN ARRAY['Café', 'Jasmim', 'Flor de Laranjeira']
    WHEN 'Dior Sauvage' THEN ARRAY['Gerânio', 'Lavanda', 'Elemi', 'Pimenta Sichuan']
    WHEN 'Chanel Coco Mademoiselle' THEN ARRAY['Jasmim', 'Rosa', 'Lírio do Vale']
    WHEN 'Tom Ford Black Orchid' THEN ARRAY['Orquídea', 'Especiarias', 'Gardênia', 'Frutas']
    
    -- Luxury
    WHEN 'Creed Aventus' THEN ARRAY['Folhas de Louro', 'Rosa', 'Jasmim', 'Bétula']
    WHEN 'Tom Ford Oud Wood' THEN ARRAY['Oud', 'Sândalo', 'Pau-de-rosa']
    WHEN 'Maison Margiela Replica By the Fireplace' THEN ARRAY['Castanha', 'Rosa', 'Canela', 'Cravo']
    WHEN 'Le Labo Santal 33' THEN ARRAY['Sândalo', 'Amyris', 'Cedro']
    WHEN 'Byredo Gypsy Water' THEN ARRAY['Gengibre', 'Orris', 'Pinho']
    WHEN 'Diptyque Philosykos' THEN ARRAY['Folhas de Figueira', 'Leite de Figo']
    WHEN 'Amouage Interlude Man' THEN ARRAY['Âmbar', 'Opoponax', 'Olíbano']
    WHEN 'Nasomatto Black Afgano' THEN ARRAY['Maconha', 'Resinas Verdes']
    
    -- Ultra Luxury  
    WHEN 'Clive Christian No. 1' THEN ARRAY['Rosa', 'Jasmim', 'Lírio', 'Ylang Ylang', 'Íris']
    WHEN 'Roja Dove Creation-E' THEN ARRAY['Rosa', 'Jasmim', 'Ylang Ylang', 'Gerânio']
    WHEN 'Amouage Gold Woman' THEN ARRAY['Rosa', 'Jasmim', 'Narciso', 'Cravo', 'Orris']
    WHEN 'Creed Green Irish Tweed' THEN ARRAY['Violeta', 'Íris', 'Sândalo']
    WHEN 'Baccarat Rouge 540' THEN ARRAY['Âmbar', 'Almíscar', 'Madeira de Agar']
    ELSE heart_notes
  END,
  
  base_notes = CASE name
    -- Premium
    WHEN 'Dolce & Gabbana Light Blue' THEN ARRAY['Cedro', 'Âmbar', 'Almíscar']
    WHEN 'Calvin Klein CK One' THEN ARRAY['Âmbar', 'Sândalo', 'Almíscar', 'Cedro', 'Musgo de Carvalho']
    WHEN 'Hugo Boss Bottled' THEN ARRAY['Sândalo', 'Cedro', 'Vetiver', 'Musgo de Carvalho']
    WHEN 'Paco Rabanne 1 Million' THEN ARRAY['Âmbar', 'Couro', 'Madeira', 'Patchouli']
    WHEN 'Carolina Herrera Good Girl' THEN ARRAY['Fava Tonka', 'Cacau', 'Sândalo', 'Âmbar']
    WHEN 'Versace Eros' THEN ARRAY['Cedro', 'Musgo de Carvalho', 'Vetiver', 'Baunilha']
    WHEN 'Yves Saint Laurent Black Opium' THEN ARRAY['Baunilha', 'Patchouli', 'Cedro', 'Cachemira']
    WHEN 'Dior Sauvage' THEN ARRAY['Âmbar', 'Patchouli', 'Labdanum']
    WHEN 'Chanel Coco Mademoiselle' THEN ARRAY['Patchouli', 'Baunilha', 'Vetiver', 'Almíscar']
    WHEN 'Tom Ford Black Orchid' THEN ARRAY['Patchouli', 'Baunilha', 'Âmbar', 'Sândalo']
    
    -- Luxury
    WHEN 'Creed Aventus' THEN ARRAY['Almíscar', 'Musgo de Carvalho', 'Ambergris', 'Baunilha']
    WHEN 'Tom Ford Oud Wood' THEN ARRAY['Oud', 'Sândalo', 'Baunilha', 'Âmbar']
    WHEN 'Maison Margiela Replica By the Fireplace' THEN ARRAY['Baunilha', 'Guaiac', 'Cachemira', 'Benzoin']
    WHEN 'Le Labo Santal 33' THEN ARRAY['Sândalo', 'Papiro', 'Couro', 'Cedro']
    WHEN 'Byredo Gypsy Water' THEN ARRAY['Baunilha', 'Sândalo', 'Âmbar']
    WHEN 'Diptyque Philosykos' THEN ARRAY['Madeira de Figueira', 'Casca de Árvore']
    WHEN 'Amouage Interlude Man' THEN ARRAY['Couro', 'Âmbar', 'Oud', 'Musgo de Carvalho']
    WHEN 'Nasomatto Black Afgano' THEN ARRAY['Haxixe', 'Oud', 'Madeiras Verdes']
    
    -- Ultra Luxury
    WHEN 'Clive Christian No. 1' THEN ARRAY['Sândalo', 'Cedro', 'Âmbar', 'Almíscar', 'Vetiver']
    WHEN 'Roja Dove Creation-E' THEN ARRAY['Sândalo', 'Âmbar', 'Almíscar', 'Musgo de Carvalho']
    WHEN 'Amouage Gold Woman' THEN ARRAY['Sândalo', 'Âmbar', 'Almíscar', 'Civeta', 'Musgo de Carvalho']
    WHEN 'Creed Green Irish Tweed' THEN ARRAY['Sândalo', 'Âmbar', 'Almíscar']
    WHEN 'Baccarat Rouge 540' THEN ARRAY['Almíscar', 'Âmbar', 'Fir Resin', 'Cedro']
    ELSE base_notes
  END;