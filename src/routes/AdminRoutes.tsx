import { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load admin components for better performance
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminPerfumes = lazy(() => import('@/pages/admin/AdminPerfumes'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory'));
const AdminConfig = lazy(() => import('@/pages/admin/AdminConfig'));
const AdminShipments = lazy(() => import('@/pages/admin/AdminShipments'));
const AdminCompanyConfig = lazy(() => import('@/pages/admin/AdminCompanyConfig'));
const AdminOrderAutomation = lazy(() => import('@/pages/admin/AdminOrderAutomation'));
const AdminFiscalNotes = lazy(() => import('@/pages/admin/AdminFiscalNotes'));
const AdminNFeDashboard = lazy(() => import('@/pages/admin/AdminNFeDashboard'));
const AdminOrderManagement = lazy(() => import('@/pages/admin/AdminOrderManagement'));
const AdminSecurityLogs = lazy(() => import('@/pages/admin/AdminSecurityLogs'));
const AdminSecurityAlerts = lazy(() => import('@/pages/admin/AdminSecurityAlerts'));
const AdminSitemap = lazy(() => import('@/pages/admin/AdminSitemap'));

const AdminRoutes = () => {
  return (
    <>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/perfumes" element={<AdminPerfumes />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/coupons" element={<AdminCoupons />} />
      <Route path="/admin/reviews" element={<AdminReviews />} />
      <Route path="/admin/inventory" element={<AdminInventory />} />
      <Route path="/admin/config" element={<AdminConfig />} />
      <Route path="/admin/shipments" element={<AdminShipments />} />
      <Route path="/admin/company" element={<AdminCompanyConfig />} />
      <Route path="/admin/automation" element={<AdminOrderAutomation />} />
      <Route path="/admin/fiscal-notes" element={<AdminFiscalNotes />} />
      <Route path="/admin/nfe-dashboard" element={<AdminNFeDashboard />} />
      <Route path="/admin/order-management" element={<AdminOrderManagement />} />
        <Route path="/admin/security-logs" element={<AdminSecurityLogs />} />
        <Route path="/admin/security-alerts" element={<AdminSecurityAlerts />} />
        <Route path="/admin/sitemap" element={<AdminSitemap />} />
    </>
  );
};

export default AdminRoutes;