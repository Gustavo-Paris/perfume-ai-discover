
import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { usePerfumes } from '@/hooks/usePerfumes';
import { DatabasePerfume } from '@/types';

const Catalogo = () => {
  const { data: databasePerfumes, isLoading } = usePerfumes();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Convert DatabasePerfume to Perfume format for compatibility
  const perfumes = useMemo(() => {
    if (!databasePerfumes) return [];
    
    return databasePerfumes.map((dbPerfume: DatabasePerfume) => ({
      id: dbPerfume.id,
      name: dbPerfume.name,
      brand: dbPerfume.brand,
      family: dbPerfume.family,
      gender: dbPerfume.gender,
      size_ml: [50, 100], // Default sizes since this info isn't in database
      price_full: Number(dbPerfume.price_full),
      price_5ml: dbPerfume.price_5ml ? Number(dbPerfume.price_5ml) : 0,
      price_10ml: dbPerfume.price_10ml ? Number(dbPerfume.price_10ml) : 0,
      stock_full: 10, // Default stock since this info isn't in database
      stock_5ml: 50,
      stock_10ml: 30,
      description: dbPerfume.description || '',
      image_url: dbPerfume.image_url || '',
      top_notes: dbPerfume.top_notes,
      heart_notes: dbPerfume.heart_notes,
      base_notes: dbPerfume.base_notes,
      created_at: dbPerfume.created_at
    }));
  }, [databasePerfumes]);

  // Get unique values for filters
  const brands = [...new Set(perfumes.map(p => p.brand))];
  const genders = [...new Set(perfumes.map(p => p.gender))];
  const families = [...new Set(perfumes.map(p => p.family))];

  // Filter and sort perfumes
  const filteredPerfumes = useMemo(() => {
    let filtered = perfumes.filter(perfume => {
      // Search filter
      const matchesSearch = perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           perfume.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           perfume.family.toLowerCase().includes(searchTerm.toLowerCase());

      // Brand filter
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(perfume.brand);

      // Gender filter
      const matchesGender = selectedGenders.length === 0 || selectedGenders.includes(perfume.gender);

      // Family filter
      const matchesFamily = selectedFamilies.length === 0 || selectedFamilies.includes(perfume.family);

      // Price filter (using 5ml price as reference)
      const referencePrice = perfume.price_5ml || perfume.price_full / 10; // Fallback calculation
      const matchesPrice = referencePrice >= priceRange[0] && referencePrice <= priceRange[1];

      return matchesSearch && matchesBrand && matchesGender && matchesFamily && matchesPrice;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'brand':
          return a.brand.localeCompare(b.brand);
        case 'price-low':
          const priceA = a.price_5ml || a.price_full / 10;
          const priceB = b.price_5ml || b.price_full / 10;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = a.price_5ml || a.price_full / 10;
          const priceB2 = b.price_5ml || b.price_full / 10;
          return priceB2 - priceA2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [perfumes, searchTerm, sortBy, selectedBrands, selectedGenders, selectedFamilies, priceRange]);

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands(prev => [...prev, brand]);
    } else {
      setSelectedBrands(prev => prev.filter(b => b !== brand));
    }
  };

  const handleGenderChange = (gender: string, checked: boolean) => {
    if (checked) {
      setSelectedGenders(prev => [...prev, gender]);
    } else {
      setSelectedGenders(prev => prev.filter(g => g !== gender));
    }
  };

  const handleFamilyChange = (family: string, checked: boolean) => {
    if (checked) {
      setSelectedFamilies(prev => [...prev, family]);
    } else {
      setSelectedFamilies(prev => prev.filter(f => f !== family));
    }
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedGenders([]);
    setSelectedFamilies([]);
    setPriceRange([0, 1000]);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Carregando perfumes...</div>
          </div>
        </div>
      </div>
    );
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brands */}
      <div>
        <h3 className="font-display font-semibold mb-3 text-gray-900">Marcas</h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-navy-900 data-[state=checked]:border-navy-900"
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h3 className="font-display font-semibold mb-3 text-gray-900">Gênero</h3>
        <div className="space-y-2">
          {genders.map(gender => (
            <div key={gender} className="flex items-center space-x-2">
              <Checkbox
                id={`gender-${gender}`}
                checked={selectedGenders.includes(gender)}
                onCheckedChange={(checked) => handleGenderChange(gender, checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-navy-900 data-[state=checked]:border-navy-900"
              />
              <Label htmlFor={`gender-${gender}`} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer capitalize">
                {gender}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Fragrance Family */}
      <div>
        <h3 className="font-display font-semibold mb-3 text-gray-900">Família Olfativa</h3>
        <div className="space-y-2">
          {families.map(family => (
            <div key={family} className="flex items-center space-x-2">
              <Checkbox
                id={`family-${family}`}
                checked={selectedFamilies.includes(family)}
                onCheckedChange={(checked) => handleFamilyChange(family, checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-navy-900 data-[state=checked]:border-navy-900"
              />
              <Label htmlFor={`family-${family}`} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                {family}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-display font-semibold mb-3 text-gray-900">
          Preço (5ml): R$ {priceRange[0]} - R$ {priceRange[1]}
        </h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={200}
          min={0}
          step={10}
          className="w-full [&_[role=slider]]:bg-navy-900 [&_[role=slider]]:border-navy-900"
        />
      </div>

      <Button onClick={clearFilters} className="w-full btn-secondary">
        Limpar Filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 text-gray-900">
            Catálogo de <span className="text-brand-gradient">Fragrâncias</span>
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Explore nossa coleção completa de perfumes premium selecionados
          </p>
        </motion.div>

        {/* Search and Controls */}
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, marca ou família..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 rounded-xl"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="brand">Marca A-Z</SelectItem>
              <SelectItem value="price-low">Menor Preço</SelectItem>
              <SelectItem value="price-high">Maior Preço</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden btn-secondary">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white">
              <SheetHeader>
                <SheetTitle className="font-display text-gray-900">Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <motion.aside 
            className="hidden md:block w-64 shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass rounded-2xl sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-gray-900">Filtros</h2>
                  <Filter className="h-4 w-4 text-gray-500" />
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </motion.aside>

          {/* Products Grid */}
          <motion.main 
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600 font-medium">
                {filteredPerfumes.length} produto{filteredPerfumes.length !== 1 ? 's' : ''} encontrado{filteredPerfumes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredPerfumes.length === 0 ? (
              <Card className="glass rounded-2xl">
                <CardContent className="text-center py-12">
                  <h3 className="font-display font-semibold text-xl mb-2 text-gray-900">Nenhum produto encontrado</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Tente ajustar os filtros ou buscar por outros termos
                  </p>
                  <Button onClick={clearFilters} className="btn-primary">
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPerfumes.map((perfume, index) => (
                  <motion.div
                    key={perfume.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <PerfumeCard perfume={perfume} />
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
