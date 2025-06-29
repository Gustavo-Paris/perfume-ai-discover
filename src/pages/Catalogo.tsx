
import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import PerfumeCard from '@/components/perfume/PerfumeCard';
import { samplePerfumes } from '@/data/perfumes';

const Catalogo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Get unique values for filters
  const brands = [...new Set(samplePerfumes.map(p => p.brand))];
  const genders = [...new Set(samplePerfumes.map(p => p.gender))];
  const families = [...new Set(samplePerfumes.map(p => p.family))];

  // Filter and sort perfumes
  const filteredPerfumes = useMemo(() => {
    let filtered = samplePerfumes.filter(perfume => {
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
      const matchesPrice = perfume.price_5ml >= priceRange[0] && perfume.price_5ml <= priceRange[1];

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
          return a.price_5ml - b.price_5ml;
        case 'price-high':
          return b.price_5ml - a.price_5ml;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, sortBy, selectedBrands, selectedGenders, selectedFamilies, priceRange]);

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

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">Marcas</h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h3 className="font-semibold mb-3">Gênero</h3>
        <div className="space-y-2">
          {genders.map(gender => (
            <div key={gender} className="flex items-center space-x-2">
              <Checkbox
                id={`gender-${gender}`}
                checked={selectedGenders.includes(gender)}
                onCheckedChange={(checked) => handleGenderChange(gender, checked as boolean)}
              />
              <Label htmlFor={`gender-${gender}`} className="text-sm capitalize">
                {gender}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Fragrance Family */}
      <div>
        <h3 className="font-semibold mb-3">Família Olfativa</h3>
        <div className="space-y-2">
          {families.map(family => (
            <div key={family} className="flex items-center space-x-2">
              <Checkbox
                id={`family-${family}`}
                checked={selectedFamilies.includes(family)}
                onCheckedChange={(checked) => handleFamilyChange(family, checked as boolean)}
              />
              <Label htmlFor={`family-${family}`} className="text-sm">
                {family}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">
          Preço (5ml): R$ {priceRange[0]} - R$ {priceRange[1]}
        </h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={200}
          min={0}
          step={10}
          className="w-full"
        />
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Limpar Filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
            Catálogo de <span className="gradient-text">Perfumes</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore nossa coleção completa de fragrâncias premium
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, marca ou família..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="brand">Marca A-Z</SelectItem>
              <SelectItem value="price-low">Menor Preço</SelectItem>
              <SelectItem value="price-high">Maior Preço</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Filtros</h2>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredPerfumes.length} produto{filteredPerfumes.length !== 1 ? 's' : ''} encontrado{filteredPerfumes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredPerfumes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou buscar por outros termos
                </p>
                <Button onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPerfumes.map((perfume) => (
                  <PerfumeCard key={perfume.id} perfume={perfume} />
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
