import CsvImporter from '@/components/admin/CsvImporter';

const AdminCsvImport = () => {
  return (
    <div className="space-y-6">      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importação CSV</h1>
          <p className="text-muted-foreground">
            Importe múltiplos perfumes e lotes de estoque via arquivo CSV
          </p>
        </div>
      </div>

      <CsvImporter />
    </div>
  );
};

export default AdminCsvImport;