import { ProductWizard } from '@/components/admin/ProductWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProductWizard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/config">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Assistente de Cadastro</h1>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Crie um novo produto seguindo o passo a passo guiado
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Como funciona o cadastro?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">1. Dados do Perfume</h3>
                <p className="text-blue-700">
                  Cadastre as informações básicas: marca, nome, família olfativa e notas.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">2. Precificação</h3>
                <p className="text-green-700">
                  Defina custos e margens. Os preços serão calculados automaticamente.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">3. Estoque Inicial</h3>
                <p className="text-purple-700">
                  Crie o primeiro lote de estoque com código e quantidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProductWizard 
          onComplete={() => {
            window.location.href = '/admin/config';
          }} 
        />
      </div>
    </div>
  );
};

export default AdminProductWizard;