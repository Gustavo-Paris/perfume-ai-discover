import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useCsvImport } from '@/hooks/useCsvImport';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { debugError } from '@/utils/removeDebugLogsProduction';

const CsvImporter = () => {
  const [csvContent, setCsvContent] = useState('');
  const { importCsvData, loading, progress } = useCsvImport();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvContent) return;
    importCsvData(csvContent);
  };

  const loadExampleCsv = async () => {
    try {
      const response = await fetch('/csv_perfumes.csv');
      const text = await response.text();
      setCsvContent(text);
    } catch (error) {
      debugError('Erro ao carregar CSV exemplo:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Perfumes via CSV
          </CardTitle>
          <CardDescription>
            Importe múltiplos perfumes e seus lotes de estoque usando um arquivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O CSV deve conter as colunas: marca, nome, descricao, familia, genero, categoria, 
              notas_topo, notas_coracao, notas_base, image_url, tipo_produto, tamanho_original_ml, 
              tamanhos_disponivel, codigo_lote, qty_ml, custo_total, warehouse_id, fornecedor, 
              data_validade, margem_percentual
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadExampleCsv}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Carregar CSV Exemplo
              </Button>
              
              <div className="flex-1">
                <label className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-accent">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {csvContent && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  CSV carregado - {csvContent.split('\n').length - 1} linhas de dados
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importando perfumes...</span>
                      <span>{progress.current}/{progress.total}</span>
                    </div>
                    <Progress 
                      value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleImport}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Importando...' : 'Importar Perfumes'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CsvImporter;