import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface CsvPerfumeData {
  marca: string;
  nome: string;
  descricao: string;
  familia: string;
  genero: string;
  categoria: string;
  notas_topo: string;
  notas_coracao: string;
  notas_base: string;
  image_url: string;
  tipo_produto: string;
  tamanho_original_ml: string;
  tamanhos_disponivel: string;
  codigo_lote: string;
  qty_ml: string;
  custo_total: string;
  warehouse_id: string;
  fornecedor: string;
  data_validade: string;
  margem_percentual: string;
}

export const useCsvImport = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const parseNotes = (notesString: string) => {
    return notesString.split(', ').map(note => note.trim()).filter(note => note.length > 0);
  };

  const parseSizes = (sizesString: string) => {
    try {
      return JSON.parse(sizesString);
    } catch {
      return [];
    }
  };

  const importCsvData = async (csvText: string) => {
    setLoading(true);
    
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      const dataLines = lines.slice(1);
      
      setProgress({ current: 0, total: dataLines.length });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;
        
        try {
          // Parse CSV line properly handling quoted fields
          const values = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          const rowData: Partial<CsvPerfumeData> = {};
          headers.forEach((header, index) => {
            rowData[header.trim() as keyof CsvPerfumeData] = values[index] || '';
          });
          
          // Check if perfume already exists
          const { data: existingPerfume } = await supabase
            .from('perfumes')
            .select('id')
            .eq('brand', rowData.marca || '')
            .eq('name', rowData.nome || '')
            .maybeSingle();

          if (existingPerfume) {
            console.log(`Perfume ${rowData.marca} - ${rowData.nome} já existe, pulando...`);
            continue;
          }

          const mapGender = (gender: string): string => {
            const normalizedGender = (gender || '').toLowerCase().trim();
            if (normalizedGender.includes('/') || normalizedGender.includes('unissex')) {
              return 'unissex';
            }
            if (normalizedGender.includes('feminino')) {
              return 'feminino';
            }
            if (normalizedGender.includes('masculino')) {
              return 'masculino';
            }
            return 'unissex'; // default fallback
          };

          // Create perfume
          const perfumeData = {
            brand: rowData.marca || '',
            name: rowData.nome || '',
            description: rowData.descricao || '',
            family: rowData.familia || '',
            gender: mapGender(rowData.genero || ''),
            category: rowData.categoria || '',
            top_notes: parseNotes(rowData.notas_topo || ''),
            heart_notes: parseNotes(rowData.notas_coracao || ''),
            base_notes: parseNotes(rowData.notas_base || ''),
            image_url: rowData.image_url || null,
            target_margin_percentage: parseFloat(rowData.margem_percentual || '80'),
            available_sizes: parseSizes(rowData.tamanhos_disponivel || '[]'),
            price_2ml: 0,
            price_5ml: 0,
            price_10ml: 0,
            price_full: 0,
            avg_cost_per_ml: 0
          };
          
          const { data: perfume, error: perfumeError } = await supabase
            .from('perfumes')
            .insert(perfumeData)
            .select()
            .single();
          
          if (perfumeError) throw perfumeError;
          
          // Create inventory lot if data provided
          if (rowData.codigo_lote && rowData.qty_ml && rowData.custo_total && rowData.warehouse_id) {
            const lotData = {
              perfume_id: perfume.id,
              lot_code: rowData.codigo_lote,
              qty_ml: parseInt(rowData.qty_ml),
              total_cost: parseFloat(rowData.custo_total),
              cost_per_ml: parseFloat(rowData.custo_total) / parseInt(rowData.qty_ml),
              warehouse_id: rowData.warehouse_id,
              supplier: rowData.fornecedor || null
            };
            
            const { error: lotError } = await supabase
              .from('inventory_lots')
              .insert(lotData);
            
            if (lotError) console.warn('Erro ao criar lote:', lotError);
          }
          
          successCount++;
        } catch (error) {
          console.error(`Erro na linha ${i + 2}:`, error);
          errorCount++;
        }
        
        setProgress({ current: i + 1, total: dataLines.length });
      }
      
      toast({
        title: "Importação concluída!",
        description: `${successCount} perfumes criados com sucesso. ${errorCount} erros.`
      });
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Falha ao processar o arquivo CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return {
    importCsvData,
    loading,
    progress
  };
};