import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationBreadcrumbs } from '@/components/admin/NavigationBreadcrumbs';
import { OrderAutomationDashboard } from '@/components/admin/OrderAutomationDashboard';
import { OrderManagementPanel } from '@/components/admin/OrderManagementPanel';
import { OrderAutomationPanel } from '@/components/admin/OrderAutomationPanel';
import { BarChart3, Settings, PlayCircle } from 'lucide-react';

export default function AdminOrderAutomationUnified() {
  return (
    <>
      <NavigationBreadcrumbs 
        items={[
          { label: 'Automação de Pedidos', current: true }
        ]}
      />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Automação de Pedidos</h1>
          <p className="text-muted-foreground">Gerencie métricas, processamento e configurações em um só lugar</p>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Processamento Manual
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <OrderAutomationDashboard />
          </TabsContent>

          <TabsContent value="processing">
            <OrderManagementPanel />
          </TabsContent>

          <TabsContent value="config">
            <OrderAutomationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
