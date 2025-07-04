import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
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
import PerfumeDetails from "./pages/PerfumeDetails";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => {
  useAnalytics();
  useOrderTracking();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
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
                  <Route path="/perfume/:id" element={<PerfumeDetails />} />
                  <Route path="/admin/perfumes" element={<AdminPerfumes />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                  <Route path="/admin/lots" element={<AdminLots />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
