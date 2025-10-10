import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, LineChart, Megaphone } from 'lucide-react';

export type DashboardType = 'overview' | 'financial' | 'orders' | 'inventory' | 'performance' | 'analytics' | 'marketing';

interface DashboardSelectorProps {
  value: DashboardType;
  onChange: (value: DashboardType) => void;
}

const dashboards = [
  { value: 'overview' as const, label: 'Visão Geral', icon: BarChart3 },
  { value: 'marketing' as const, label: 'Marketing & Cupons', icon: Megaphone },
  { value: 'financial' as const, label: 'Financeiro', icon: DollarSign },
  { value: 'orders' as const, label: 'Pedidos', icon: ShoppingCart },
  { value: 'inventory' as const, label: 'Estoque', icon: Package },
  { value: 'performance' as const, label: 'Performance', icon: TrendingUp },
  { value: 'analytics' as const, label: 'Analytics', icon: LineChart },
];

export function DashboardSelector({ value, onChange }: DashboardSelectorProps) {
  const currentDashboard = dashboards.find(d => d.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue>
          <div className="flex items-center gap-2">
            {currentDashboard && <currentDashboard.icon className="h-4 w-4" />}
            {currentDashboard?.label}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {dashboards.map((dashboard) => (
          <SelectItem key={dashboard.value} value={dashboard.value}>
            <div className="flex items-center gap-2">
              <dashboard.icon className="h-4 w-4" />
              {dashboard.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}