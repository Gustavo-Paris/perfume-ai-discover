import { SecurityMetricsDashboard } from '@/components/admin/SecurityMetricsDashboard';

export default function AdminSecurityMetrics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Métricas de Segurança</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento em tempo real de atividades de segurança e compliance
        </p>
      </div>

      <SecurityMetricsDashboard />
    </div>
  );
}
