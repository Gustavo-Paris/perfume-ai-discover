import { Helmet } from 'react-helmet-async';
import SecurityAlertConfig from '@/components/admin/SecurityAlertConfig';

const AdminSecurityAlerts = () => {
  return (
    <>
      <Helmet>
        <title>Alertas de Segurança - Admin</title>
        <meta name="description" content="Configure alertas automáticos de segurança" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Alertas de Segurança</h1>
          <p className="text-muted-foreground mt-2">
            Configure alertas automáticos para eventos de segurança críticos
          </p>
        </div>

        <SecurityAlertConfig />
      </div>
    </>
  );
};

export default AdminSecurityAlerts;
