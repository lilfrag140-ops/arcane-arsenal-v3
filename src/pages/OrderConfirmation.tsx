import { useState, useEffect } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Copy, ExternalLink, ArrowLeft, AlertTriangle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  minecraft_username: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
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

    if (orderId) {
      fetchOrder();
    }

    return () => subscription.unsubscribe();
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getPaymentInstructions = () => {
    if (!order) return null;

    const method = order.payment_method.toLowerCase();
    const shortOrderId = order.id.slice(0, 8);

    switch (method) {
      case 'venmo':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary">
              <span className="text-2xl">💙</span>
              <h3 className="text-lg font-semibold">Venmo Payment</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Send to:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">@DonutGroceries</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('@DonutGroceries', 'Venmo username')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Amount:</span>
                <span className="font-mono text-lg">${order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="font-medium">IMPORTANT - Include this note:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-yellow-400">Order #{shortOrderId}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`Order #${shortOrderId}`, 'Order ID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'cashapp':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary">
              <span className="text-2xl">💚</span>
              <h3 className="text-lg font-semibold">Cash App Payment</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Send to:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">$DonutGroceries</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('$DonutGroceries', 'Cash App username')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Amount:</span>
                <span className="font-mono text-lg">${order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="font-medium">IMPORTANT - Include this note:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-yellow-400">Order #{shortOrderId}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`Order #${shortOrderId}`, 'Order ID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'paypal':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary">
              <span className="text-2xl">💛</span>
              <h3 className="text-lg font-semibold">PayPal Friends & Family</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Send to:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">donutgroceries@gmail.com</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('donutgroceries@gmail.com', 'PayPal email')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="font-medium">Amount:</span>
                <span className="font-mono text-lg">${order.total_amount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="font-medium">IMPORTANT - Include this note:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-yellow-400">Order #{shortOrderId}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`Order #${shortOrderId}`, 'Order ID')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Make sure to select "Friends & Family" to avoid fees</span>
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'crypto':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary">
              <span className="text-2xl">₿</span>
              <h3 className="text-lg font-semibold">Cryptocurrency Payment</h3>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                Cryptocurrency payments are processed automatically through Coinbase Commerce.
                You will receive an email with payment instructions shortly.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="card-modern text-center max-w-md mx-auto">
            <CardContent className="py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">The order you're looking for could not be found.</p>
              <Link to="/">
                <Button className="btn-primary">Back to Shop</Button>
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
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="card-modern mb-6">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-3xl font-heading font-bold mb-2">Order Placed Successfully!</h1>
              <p className="text-muted-foreground mb-4">
                Your order has been created and is waiting for payment confirmation.
              </p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
                Order #{order.id.slice(0, 8)}
              </Badge>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="card-modern mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Payment Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getPaymentInstructions()}
              
              <Separator className="my-6" />
              
              <div className="space-y-3">
                <h4 className="font-medium">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Send payment using the details above</li>
                  <li><strong>MUST include your Order ID</strong> in the payment note</li>
                  <li>Wait for our team to confirm payment (usually within 30 minutes)</li>
                  <li>Receive your DonutSMP items instantly after confirmation</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="card-modern mb-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Minecraft Username:</span>
                  <span className="font-medium">{order.minecraft_username}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">${order.total_amount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                View All Orders
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full btn-primary">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;