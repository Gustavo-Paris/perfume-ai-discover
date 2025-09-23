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
    </>
  );
};

export default AdminRoutes;