import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, CreditCard, ArrowLeft, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useCart } from "@/contexts/CartContext";

const NewCheckout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [minecraftUsername, setMinecraftUsername] = useState("");
  const { state, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!minecraftUsername.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your Minecraft username",
        variant: "destructive",
      });
      return;
    }

    if (state.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    // Check minimum order amount
    if (totalAmount < 1) {
      toast({
        title: "Minimum Order Required",
        description: "Orders must be at least $1.00 to proceed",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call Tebex checkout edge function
      const { data, error } = await supabase.functions.invoke('create-tebex-checkout', {
        body: {
          items: state.items,
          minecraft_username: minecraftUsername.trim(),
        }
      });

      if (error) throw error;

      // Clear cart
      clearCart();

      // Redirect to Tebex checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }

      toast({
        title: "Redirecting to Checkout",
        description: "You will be redirected to complete your payment with Tebex.",
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="card-modern text-center max-w-md mx-auto">
            <CardContent className="py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your Cart is Empty</h2>
              <p className="text-muted-foreground mb-6">Add some items to your cart before checking out</p>
              <Link to="/">
                <Button className="btn-primary">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/cart">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold gradient-text">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment & Delivery</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Minecraft Username */}
                <div className="space-y-2">
                  <Label htmlFor="minecraft-username" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Minecraft Username *</span>
                  </Label>
                  <Input
                    id="minecraft-username"
                    placeholder="Enter your Minecraft username"
                    value={minecraftUsername}
                    onChange={(e) => setMinecraftUsername(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Items will be delivered to this Minecraft account on DonutSMP
                  </p>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <Label className="text-lg font-medium">Secure Checkout with Tebex</Label>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-foreground">
                      🔒 Your payment is processed securely through Tebex, a trusted payment platform for gaming communities.
                      We support credit cards, PayPal, and various other payment methods.
                    </p>
                  </div>
                </div>

                {/* No Refunds Policy */}
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">⚠️ Important Policy</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium">NO REFUNDS - All sales are final</p>
                    <p>• Items are delivered instantly to your Minecraft account</p>
                    <p>• Make sure your Minecraft username is correct before checkout</p>
                    <p>• All payments are processed through Tebex and are non-refundable</p>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading || !minecraftUsername.trim() || totalAmount < 1}
                  className="w-full btn-primary text-lg py-6"
                  size="lg"
                >
                  {loading ? "Redirecting to Checkout..." : 
                   totalAmount < 1 ? "Minimum Order: $1.00" :
                   `Proceed to Secure Checkout - $${totalAmount.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewCheckout;