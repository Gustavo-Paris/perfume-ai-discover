import PerfumeImageUploader from '@/components/admin/PerfumeImageUploader';

const AdminPerfumeImages = () => {
  console.log('AdminPerfumeImages: Component loading');
  
  return (
    <div className="space-y-6">      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload de Imagens de Perfumes</h1>
          <p className="text-muted-foreground">
            Identifique e faça upload das imagens de perfumes para o Supabase Storage
          </p>
        </div>
      </div>

      <PerfumeImageUploader />
    </div>
  );
};

export default AdminPerfumeImages;