import SEO from '@/components/SEO';
import { SitemapGenerator } from '@/components/admin/SitemapGenerator';

const AdminSitemap = () => {
  return (
    <>
      <SEO 
        title="Gerenciador de Sitemap - Admin"
        description="Gere e gerencie o sitemap.xml do site"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciador de Sitemap</h1>
          <p className="text-muted-foreground">
            Gere e visualize o sitemap.xml do seu site para melhorar o SEO
          </p>
        </div>

        <SitemapGenerator />
      </div>
    </>
  );
};

export default AdminSitemap;
