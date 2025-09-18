import PerfumeImageUploader from '@/components/admin/PerfumeImageUploader';
import { NavigationBreadcrumbs } from '@/components/admin/NavigationBreadcrumbs';

const AdminPerfumeImages = () => {
  return (
    <div className="space-y-6">
      <NavigationBreadcrumbs 
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Upload de Imagens', href: '/admin/perfume-images' },
        ]}
      />
      
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