import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Package, Warehouse, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ValidationResult {
  type: 'error' | 'warning' | 'success';
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

interface SmartValidationsProps {
  entityType: 'perfume' | 'lot' | 'material';
  entityData: any;
  context?: string;
}

export const SmartValidations = ({ entityType, entityData, context }: SmartValidationsProps) => {
  const getValidations = (): ValidationResult[] => {
    const validations: ValidationResult[] = [];

    if (entityType === 'perfume') {
      // Validações para perfumes
      if (!entityData.avg_cost_per_ml || entityData.avg_cost_per_ml === 0) {
        validations.push({
          type: 'error',
          message: 'Perfume sem custo definido. É necessário ter pelo menos um lote para calcular custos.',
          action: {
            label: 'Criar Lote',
            href: '/admin/lots'
          }
        });
      }

      if (!entityData.inventory_lots || entityData.inventory_lots.length === 0) {
        validations.push({
          type: 'warning',
          message: 'Perfume sem estoque disponível.',
          action: {
            label: 'Adicionar Estoque',
            href: '/admin/lots'
          }
        });
      }

      if (entityData.price_full && entityData.avg_cost_per_ml) {
        const margin = ((entityData.price_full - (entityData.avg_cost_per_ml * 50)) / entityData.price_full) * 100;
        if (margin < 30) {
          validations.push({
            type: 'warning',
            message: `Margem baixa (${margin.toFixed(1)}%). Considere revisar a precificação.`
          });
        }
      }
    }

    if (entityType === 'lot') {
      // Validações para lotes
      if (entityData.expiry_date) {
        const expiryDate = new Date(entityData.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilExpiry < 0) {
          validations.push({
            type: 'error',
            message: 'Lote vencido. Considere remover do estoque ativo.'
          });
        } else if (daysUntilExpiry < 30) {
          validations.push({
            type: 'warning',
            message: `Lote vence em ${daysUntilExpiry} dias.`
          });
        }
      }

      if (!entityData.cost_per_ml || entityData.cost_per_ml === 0) {
        validations.push({
          type: 'warning',
          message: 'Lote sem custo definido. Isso afetará os cálculos de margem.'
        });
      }

      if (entityData.qty_ml < 50) {
        validations.push({
          type: 'warning',
          message: 'Estoque baixo neste lote.'
        });
      }
    }

    if (entityType === 'material') {
      // Validações para materiais
      if (entityData.current_stock <= entityData.min_stock_alert) {
        validations.push({
          type: 'error',
          message: 'Material abaixo do estoque mínimo.',
          action: {
            label: 'Reabastecer',
            href: '/admin/materials-simplified'
          }
        });
      }

      if (!entityData.cost_per_unit || entityData.cost_per_unit === 0) {
        validations.push({
          type: 'warning',
          message: 'Material sem custo definido.'
        });
      }
    }

    return validations;
  };

  const validations = getValidations();

  if (validations.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Todas as validações passaram. {entityType === 'perfume' ? 'Perfume' : entityType === 'lot' ? 'Lote' : 'Material'} está configurado corretamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {validations.map((validation, index) => (
        <Alert 
          key={index} 
          className={
            validation.type === 'error' 
              ? 'border-red-200 bg-red-50' 
              : validation.type === 'warning'
                ? 'border-orange-200 bg-orange-50'
                : 'border-green-200 bg-green-50'
          }
        >
          {validation.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : validation.type === 'warning' ? (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={
            validation.type === 'error' 
              ? 'text-red-700' 
              : validation.type === 'warning'
                ? 'text-orange-700'
                : 'text-green-700'
          }>
            <div className="flex items-center justify-between">
              <span>{validation.message}</span>
              {validation.action && (
                <Link to={validation.action.href}>
                  <Button variant="outline" size="sm" className="ml-2">
                    {validation.action.label}
                  </Button>
                </Link>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

// Componente para mostrar status de dependências
interface DependencyStatusProps {
  perfumeId?: string;
  showMaterials?: boolean;
  showStock?: boolean;
  showPricing?: boolean;
}

export const DependencyStatus = ({ 
  perfumeId, 
  showMaterials = false, 
  showStock = true, 
  showPricing = true 
}: DependencyStatusProps) => {
  // Aqui você faria queries para buscar os dados reais
  const hasStock = true; // Mock - substituir por query real
  const hasPricing = true; // Mock - substituir por query real
  const hasMaterials = false; // Mock - substituir por query real

  const dependencies = [
    {
      name: 'Estoque',
      status: hasStock,
      icon: <Package className="h-4 w-4" />,
      href: '/admin/lots',
      show: showStock
    },
    {
      name: 'Precificação',
      status: hasPricing,
      icon: <DollarSign className="h-4 w-4" />,
      href: '/admin/perfumes',
      show: showPricing
    },
    {
      name: 'Materiais',
      status: hasMaterials,
      icon: <Warehouse className="h-4 w-4" />,
      href: '/admin/materials-simplified',
      show: showMaterials
    }
  ].filter(dep => dep.show);

  return (
    <div className="flex gap-2 flex-wrap">
      {dependencies.map((dep) => (
        <Link key={dep.name} to={dep.href}>
          <Badge 
            variant={dep.status ? "default" : "destructive"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {dep.icon}
            <span className="ml-1">{dep.name}</span>
            {dep.status ? ' ✓' : ' !'}
          </Badge>
        </Link>
      ))}
    </div>
  );
};