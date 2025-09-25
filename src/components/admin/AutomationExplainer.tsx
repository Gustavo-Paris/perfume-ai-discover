import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  FileText, 
  Package, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

export const AutomationExplainer = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Zap className="w-4 h-4" />
        <AlertDescription>
          <strong>O que é esta página?</strong><br />
          Esta página mostra o status da automação pós-pagamento para pedidos recentes. 
          Você pode reprocessar manualmente pedidos que falharam na automação.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-blue-500" />
              Como Funciona a Automação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">1. Pagamento Confirmado</p>
                <p className="text-sm text-muted-foreground">Sistema detecta pagamento aprovado</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">2. Gerar NF-e</p>
                <p className="text-sm text-muted-foreground">Emite automaticamente a nota fiscal</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">3. Criar Etiqueta</p>
                <p className="text-sm text-muted-foreground">Gera etiqueta de envio no Melhor Envio</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">4. Enviar Email</p>
                <p className="text-sm text-muted-foreground">Notifica cliente com dados da compra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Status dos Processos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Etiqueta OK</span>
              <span className="text-xs text-muted-foreground">- Processado com sucesso</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Sem NF-e</span>
              <span className="text-xs text-muted-foreground">- Falha na geração</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">Etiqueta</span>
              <span className="text-xs text-muted-foreground">- Em processamento</span>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                <strong>Dica:</strong> Use o botão "Gerar NF-e" para reprocessar pedidos que falharam.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pré-requisitos para Automação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">📋 Para NF-e Funcionar:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Dados da empresa completos</li>
                <li>• Token Focus NFe configurado</li>
                <li>• Certificado digital A1</li>
                <li>• Produtos com dados fiscais</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📦 Para Etiquetas Funcionarem:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Token Melhor Envio ativo</li>
                <li>• Endereço de origem configurado</li>
                <li>• Dimensões dos produtos</li>
                <li>• Saldo na conta Melhor Envio</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};