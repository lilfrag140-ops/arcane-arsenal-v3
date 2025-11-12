import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { EnhancedCryptoCheckout } from "@/components/crypto/EnhancedCryptoCheckout";
import { useToast } from "@/hooks/use-toast";

const CryptoPayment = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePaymentComplete = () => {
    toast({
      title: "Payment Confirmed!",
      description: "Your cryptocurrency payment has been confirmed. Items will be delivered shortly.",
    });
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      window.location.href = `/payment-success?order_id=${orderId}&payment_method=crypto`;
    }, 2000);
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Payment Link</h1>
            <p className="text-muted-foreground">No order ID found in the URL.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold gradient-text mb-2">
              Cryptocurrency Payment
            </h1>
            <p className="text-muted-foreground">
              Complete your payment using cryptocurrency. Supported coins: Bitcoin, Ethereum, Litecoin, USDT, USDC, and Solana.
            </p>
          </div>

          <EnhancedCryptoCheckout 
            orderId={orderId} 
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      </main>
    </div>
  );
};

export default CryptoPayment;