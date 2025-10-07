/**
 * Página administrativa para visualização de logs de segurança
 */

import { Helmet } from 'react-helmet-async';
import SecurityAuditLog from '@/components/admin/SecurityAuditLog';

const AdminSecurityLogs = () => {
  return (
    <>
      <Helmet>
        <title>Logs de Segurança - Admin</title>
        <meta name="description" content="Visualize e monitore logs de auditoria de segurança" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs de Segurança</h1>
          <p className="text-muted-foreground mt-2">
            Monitore eventos críticos e atividades suspeitas no sistema
          </p>
        </div>

        <SecurityAuditLog />
      </div>
    </>
  );
};

export default AdminSecurityLogs;
