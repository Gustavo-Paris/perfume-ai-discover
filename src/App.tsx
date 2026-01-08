import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundaryOptimized from "@/components/ui/ErrorBoundaryOptimized";
import { useAnalytics } from '@/hooks/useAnalytics';
import PerformanceOptimizer from '@/components/analytics/PerformanceOptimizer';
import { Suspense, lazy } from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContextOptimized";
import { RecoveryProvider } from "./contexts/RecoveryContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Curadoria from "./pages/Curadoria";
import Fidelidade from "./pages/Fidelidade";
import CatalogoOptimized from "./pages/CatalogoOptimized";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Pedidos from "./pages/Pedidos";
import Auth from "./pages/Auth";
import AdminPerfumes from "./pages/admin/AdminPerfumes";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminStock from "./pages/admin/AdminStock";
import AdminPerfumeImages from "./pages/admin/AdminPerfumeImages";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLots from "./pages/admin/AdminLots";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import Wishlist from "./pages/Wishlist";
import ComparisonPage from "./pages/ComparisonPage";
import PerfumeDetails from "./pages/PerfumeDetails";
import Privacidade from "./pages/Privacidade";
import TrocaDevolucao from "./pages/TrocaDevolucao";
import TermosUso from "./pages/TermosUso";
import FAQ from "./pages/FAQ";
import SAC from "./pages/SAC";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import EmailPreferences from "./components/notifications/EmailPreferences";
import Unsubscribe from "./pages/Unsubscribe";
import Search from "./pages/Search";
import Afiliados from "./pages/Afiliados";
import MinhasNotasFiscais from './pages/MinhasNotasFiscais';
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSupportMacros from "./pages/admin/AdminSupportMacros";
import AdminCompany from "./pages/admin/AdminCompany";
import AdminLocalDelivery from "./pages/admin/AdminLocalDelivery";
import AdminCsvImport from './pages/admin/AdminCsvImport';
import AdminShipments from "./pages/admin/AdminShipments";
import AdminFiscalNotes from "./pages/admin/AdminFiscalNotes";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import Assinaturas from "./pages/Assinaturas";
import MinhaAssinatura from "./pages/MinhaAssinatura";

import AdminMaterialsSimplified from "./pages/admin/AdminMaterialsSimplified";
import AdminProductCadastro from './pages/admin/AdminProductCadastro';
import AdminSecurityMetrics from "./pages/admin/AdminSecurityMetrics";
import AdminSecurityLogs from "./pages/admin/AdminSecurityLogs";
import AdminSecurityAlerts from "./pages/admin/AdminSecurityAlerts";
import AdminSitemap from "./pages/admin/AdminSitemap";
import AdminMonitoring from "./pages/admin/AdminMonitoring";

// Lazy load admin pages
const AdminLaunchSetup = lazy(() => import('./pages/admin/AdminLaunchSetup'));
const AdminStockUnified = lazy(() => import('./pages/admin/AdminStockUnified'));
const AdminOrderAutomationUnified = lazy(() => import('./pages/admin/AdminOrderAutomationUnified'));

import { SupportChat } from "./components/support/SupportChat";
import { SessionMonitor } from "./components/auth/SessionMonitor";

const queryClient = new QueryClient();

const AppContent = () => {
  useAnalytics();
  
  return (
    <div className="min-h-screen flex flex-col">
      <PerformanceOptimizer />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curadoria" element={<Curadoria />} />
          <Route path="/fidelidade" element={<Fidelidade />} />
          <Route path="/catalogo" element={<CatalogoOptimized />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/notas-fiscais" element={<MinhasNotasFiscais />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/comparacao/:id" element={<ComparisonPage />} />
          <Route path="/perfume/:id" element={<PerfumeDetails />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="fiscal-notes" element={<AdminFiscalNotes />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="cupons" element={<AdminCoupons />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="promocoes" element={<AdminPromotions />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="afiliados" element={<AdminAffiliates />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="assinaturas" element={<AdminSubscriptions />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="company" element={<AdminCompany />} />
            <Route path="shipments" element={<AdminShipments />} />
            <Route path="local-delivery" element={<AdminLocalDelivery />} />
            <Route path="security-metrics" element={<AdminSecurityMetrics />} />
            <Route path="security-logs" element={<AdminSecurityLogs />} />
            <Route path="security-alerts" element={<AdminSecurityAlerts />} />
            <Route path="sitemap" element={<AdminSitemap />} />
            <Route path="monitoring" element={<AdminMonitoring />} />
            
            <Route path="materials-simplified" element={<AdminMaterialsSimplified />} />
            
            <Route path="produto-cadastro" element={<AdminProductCadastro />} />
            <Route path="perfume-images" element={<AdminPerfumeImages />} />
            <Route path="csv-import" element={<AdminCsvImport />} />
            <Route path="launch-setup" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <AdminLaunchSetup />
              </Suspense>
            } />
            <Route path="stock-unified" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <AdminStockUnified />
              </Suspense>
            } />
            <Route path="order-automation-unified" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <AdminOrderAutomationUnified />
              </Suspense>
            } />
            {/* Legacy admin routes */}
            <Route path="perfumes" element={<AdminPerfumes />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="lots" element={<AdminLots />} />
          </Route>
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos-uso" element={<TermosUso />} />
          <Route path="/troca-devolucao" element={<TrocaDevolucao />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/sac" element={<SAC />} />
          <Route path="/search" element={<Search />} />
          <Route path="/afiliados" element={<Afiliados />} />
          <Route path="/assinaturas" element={<Assinaturas />} />
          <Route path="/minha-assinatura" element={<MinhaAssinatura />} />
          <Route path="/email-preferences" element={<EmailPreferences />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <SupportChat />
      <SessionMonitor />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundaryOptimized>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <RecoveryProvider>
                <CartProvider>
                  <ScrollToTop />
                  <AppContent />
                </CartProvider>
              </RecoveryProvider>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundaryOptimized>
  );
};

export default App;
