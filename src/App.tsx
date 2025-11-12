// App.tsx - Main application component
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import StickyBannerDemo from "@/components/ui/sticky-banner-demo";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Support from "./pages/Support";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import About from "./pages/About";
import NewCheckout from "./pages/NewCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProductDetails from "./pages/ProductDetails";
import Orders from "./pages/Orders";
import Reviews from "./pages/Reviews";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CryptoPayment from "./pages/CryptoPayment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <StickyBannerDemo />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/support" element={<Support />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<NewCheckout />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop" element={<Index />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/crypto-payment" element={<CryptoPayment />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
