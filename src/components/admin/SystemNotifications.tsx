import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Truck, 
  FileText,
  Package 
} from 'lucide-react';

interface SystemNotificationsProps {
  className?: string;
}

export const SystemNotifications: React.FC<SystemNotificationsProps> = ({ className }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Sistema Integrado Ativo</AlertTitle>
        <AlertDescription>
          Todas as APIs estão funcionando e o sistema está pronto para processamento automático de pedidos.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <FileText className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">NF-e</p>
            <p className="text-xs text-green-600">Sistema configurado</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
            Ativo
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">Etiquetas</p>
            <p className="text-xs text-blue-600">Melhor Envio integrado</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
            Ativo
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
          <Truck className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-800">Coletas</p>
            <p className="text-xs text-purple-600">Agendamento automático</p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800">
            Ativo
          </Badge>
        </div>
      </div>
    </div>
  );
};