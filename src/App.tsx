import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Curadoria from "./pages/Curadoria";
import Fidelidade from "./pages/Fidelidade";
import Catalogo from "./pages/Catalogo";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import Pedidos from "./pages/Pedidos";
import Auth from "./pages/Auth";
import AdminPerfumes from "./pages/admin/AdminPerfumes";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLots from "./pages/admin/AdminLots";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStock from "./pages/admin/AdminStock";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminReviews from "./pages/admin/AdminReviews";
import Notificacoes from "./pages/Notificacoes";
import Wishlist from "./pages/Wishlist";
import PerfumeDetails from "./pages/PerfumeDetails";
import Privacidade from "./pages/Privacidade";
import TrocaDevolucao from "./pages/TrocaDevolucao";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import EmailPreferences from "./components/notifications/EmailPreferences";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

const AppContent = () => {
  useAnalytics();
  useUserAnalytics();
  useOrderTracking();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curadoria" element={<Curadoria />} />
          <Route path="/fidelidade" element={<Fidelidade />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/perfume/:id" element={<PerfumeDetails />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="config" element={<AdminConfig />} />
            {/* Legacy admin routes */}
            <Route path="perfumes" element={<AdminPerfumes />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="lots" element={<AdminLots />} />
          </Route>
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/troca-devolucao" element={<TrocaDevolucao />} />
          <Route path="/email-preferences" element={<EmailPreferences />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <ScrollToTop />
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
