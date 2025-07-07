import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/hooks/useAdvancedSearch';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface DynamicFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  searchQuery?: string;
  className?: string;
}

const DynamicFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  searchQuery,
  className
}: DynamicFiltersProps) => {
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);
  const [familyOptions, setFamilyOptions] = useState<FilterOption[]>([]);
  const [genderOptions, setGenderOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brands: true,
    families: true,
    genders: true,
    price: true
  });
  const [loading, setLoading] = useState(false);

  // Carregar opções de filtro baseadas na busca atual
  useEffect(() => {
    loadFilterOptions();
  }, [searchQuery]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('perfumes_with_stock')
        .select('brand, family, gender, category, price_full');

      // Se há uma busca ativa, filtrar por ela
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Processar marcas
        const brandCounts = data.reduce((acc, item) => {
          acc[item.brand] = (acc[item.brand] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setBrandOptions(
          Object.entries(brandCounts)
            .map(([brand, count]) => ({
              value: brand,
              label: brand,
              count
            }))
            .sort((a, b) => b.count - a.count)
        );

        // Processar famílias
        const familyCounts = data.reduce((acc, item) => {
          acc[item.family] = (acc[item.family] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setFamilyOptions(
          Object.entries(familyCounts)
            .map(([family, count]) => ({
              value: family,
              label: family,
              count
            }))
            .sort((a, b) => b.count - a.count)
        );

        // Processar gêneros
        const genderCounts = data.reduce((acc, item) => {
          acc[item.gender] = (acc[item.gender] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setGenderOptions(
          Object.entries(genderCounts)
            .map(([gender, count]) => ({
              value: gender,
              label: gender,
              count
            }))
            .sort((a, b) => b.count - a.count)
        );

        // Processar categorias se existir
        if (data.some(item => item.category)) {
          const categoryCounts = data
            .filter(item => item.category)
            .reduce((acc, item) => {
              acc[item.category!] = (acc[item.category!] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          setCategoryOptions(
            Object.entries(categoryCounts)
              .map(([category, count]) => ({
                value: category,
                label: category,
                count
              }))
              .sort((a, b) => b.count - a.count)
          );
        }
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter(b => b !== brand);
    
    onFiltersChange({ brands: newBrands });
  };

  const handleFamilyChange = (family: string, checked: boolean) => {
    const newFamilies = checked
      ? [...filters.families, family]
      : filters.families.filter(f => f !== family);
    
    onFiltersChange({ families: newFamilies });
  };

  const handleGenderChange = (gender: string, checked: boolean) => {
    const newGenders = checked
      ? [...filters.genders, gender]
      : filters.genders.filter(g => g !== gender);
    
    onFiltersChange({ genders: newGenders });
  };

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({ priceRange: [value[0], value[1]] });
  };

  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'brand':
        handleBrandChange(value, false);
        break;
      case 'family':
        handleFamilyChange(value, false);
        break;
      case 'gender':
        handleGenderChange(value, false);
        break;
    }
  };

  const hasActiveFilters = 
    filters.brands.length > 0 ||
    filters.families.length > 0 ||
    filters.genders.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpar tudo
            </Button>
          )}
        </div>
        
        {/* Tags de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.brands.map(brand => (
              <Badge key={brand} variant="secondary" className="text-xs">
                {brand}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter('brand', brand)}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
            {filters.families.map(family => (
              <Badge key={family} variant="secondary" className="text-xs">
                {family}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter('family', family)}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
            {filters.genders.map(gender => (
              <Badge key={gender} variant="secondary" className="text-xs">
                {gender}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter('gender', gender)}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
              <Badge variant="secondary" className="text-xs">
                R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ priceRange: [0, 1000] })}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* Filtro de Preço */}
            <Collapsible 
              open={expandedSections.price} 
              onOpenChange={() => toggleSection('price')}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Preço</span>
                  {expandedSections.price ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={handlePriceChange}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>R$ {filters.priceRange[0]}</span>
                    <span>R$ {filters.priceRange[1]}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Filtro de Marcas */}
            {brandOptions.length > 0 && (
              <>
                <Collapsible 
                  open={expandedSections.brands} 
                  onOpenChange={() => toggleSection('brands')}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">Marcas</span>
                      {expandedSections.brands ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    {brandOptions.slice(0, 8).map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${option.value}`}
                          checked={filters.brands.includes(option.value)}
                          onCheckedChange={(checked) => 
                            handleBrandChange(option.value, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`brand-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{option.label}</span>
                          <span className="text-muted-foreground">({option.count})</span>
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Separator />
              </>
            )}

            {/* Filtro de Famílias */}
            {familyOptions.length > 0 && (
              <>
                <Collapsible 
                  open={expandedSections.families} 
                  onOpenChange={() => toggleSection('families')}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">Famílias Olfativas</span>
                      {expandedSections.families ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    {familyOptions.slice(0, 6).map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`family-${option.value}`}
                          checked={filters.families.includes(option.value)}
                          onCheckedChange={(checked) => 
                            handleFamilyChange(option.value, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`family-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{option.label}</span>
                          <span className="text-muted-foreground">({option.count})</span>
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                <Separator />
              </>
            )}

            {/* Filtro de Gênero */}
            {genderOptions.length > 0 && (
              <Collapsible 
                open={expandedSections.genders} 
                onOpenChange={() => toggleSection('genders')}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium">Gênero</span>
                    {expandedSections.genders ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {genderOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gender-${option.value}`}
                        checked={filters.genders.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleGenderChange(option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`gender-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex justify-between"
                      >
                        <span>{option.label}</span>
                        <span className="text-muted-foreground">({option.count})</span>
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicFilters;