
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Curadoria from "./pages/Curadoria";
import Catalogo from "./pages/Catalogo";
import Carrinho from "./pages/Carrinho";
import Auth from "./pages/Auth";
import AdminPerfumes from "./pages/admin/AdminPerfumes";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLots from "./pages/admin/AdminLots";
import PerfumeDetails from "./pages/PerfumeDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/curadoria" element={<Curadoria />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/carrinho" element={<Carrinho />} />
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
