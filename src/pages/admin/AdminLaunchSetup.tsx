import SEO from '@/components/SEO';
import LaunchPromoSetup from '@/components/promotion/LaunchPromoSetup';
import LaunchReadinessCheck from '@/components/admin/LaunchReadinessCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminLaunchSetup = () => {
  return (
    <>
      <SEO 
        title="Configuração de Lançamento - Admin"
        description="Configurar promoções e cupons para o lançamento da loja"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">🚀 Preparação para Lançamento</h1>
          <p className="text-muted-foreground">
            Verifique o status do sistema e configure promoções de lançamento
          </p>
        </div>

        <Tabs defaultValue="readiness" className="space-y-4">
          <TabsList>
            <TabsTrigger value="readiness">Status do Sistema</TabsTrigger>
            <TabsTrigger value="promotions">Promoções de Lançamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="readiness">
            <LaunchReadinessCheck />
          </TabsContent>
          
          <TabsContent value="promotions">
            <LaunchPromoSetup />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminLaunchSetup;