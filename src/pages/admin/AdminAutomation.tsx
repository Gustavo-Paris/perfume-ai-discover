import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AutomationDashboard } from '@/components/admin/AutomationDashboard';

export default function AdminAutomation() {
  return (
    <div className="container mx-auto p-6">
      <AutomationDashboard />
    </div>
  );
}