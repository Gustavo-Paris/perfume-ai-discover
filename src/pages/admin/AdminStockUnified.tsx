import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavigationBreadcrumbs } from '@/components/admin/NavigationBreadcrumbs';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package, History } from 'lucide-react';

// Import content from existing pages
import AdminStock from './AdminStock';
import AdminInventory from './AdminInventory';

export default function AdminStockUnified() {
  return (
    <>
      <NavigationBreadcrumbs 
        items={[
          { label: 'Estoque', current: true }
        ]}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/lots">
              <Button variant="outline" size="sm">
                Gerenciar Lotes
              </Button>
            </Link>
            <Link to="/admin/produto-cadastro">
              <Button size="sm">
                Novo Produto
              </Button>
            </Link>
          </div>
        }
      />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Visualize o estoque atual e histórico de movimentações</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Movimentações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStock />
          </TabsContent>

          <TabsContent value="movements">
            <AdminInventory />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
