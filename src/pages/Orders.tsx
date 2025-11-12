// Orders page for tracking purchases
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, CreditCard, User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, Navigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  minecraft_username: string;
  created_at: string;
  order_items?: OrderItem[];
}

const Orders = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchOrders();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchOrders();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrders = async () => {
    try {
      // Log sensitive data access for audit purposes
      await supabase.rpc('log_sensitive_access', {
        action_type: 'user_order_view',
        table_name: 'orders',
        details: { timestamp: new Date().toISOString() }
      });

      // Fetch orders with masked sensitive data using RPC to apply masking
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          status,
          minecraft_username,
          payment_method,
          created_at,
          updated_at,
          stripe_payment_intent_id
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // For each order, fetch its items and product details
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              product_id,
              quantity,
              price,
              products:product_id (
                name
              )
            `)
            .eq('order_id', order.id);

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return { ...order, order_items: [] };
          }

          // Format the items with product names
          const formattedItems = (itemsData || []).map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.products?.name || 'Unknown Product'
          }));

          // Apply payment intent masking for display
          const maskedOrder = {
            ...order,
            stripe_payment_intent_id: order.stripe_payment_intent_id?.startsWith('pi_') 
              ? `pi_****${order.stripe_payment_intent_id.slice(-4)}`
              : order.stripe_payment_intent_id,
            order_items: formattedItems
          };

          return maskedOrder;
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders.",
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'venmo':
        return '💙';
      case 'cashapp':
        return '💚';
      case 'paypal':
        return '💛';
      case 'crypto':
        return '₿';
      default:
        return '💳';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shop
                  </Button>
                </Link>
                <h1 className="text-3xl font-heading font-bold gradient-text">My Orders</h1>
              </div>
            </div>
            <p className="text-muted-foreground">Track your DonutSMP purchases and delivery status</p>
          </div>

          {/* Orders */}
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card className="card-modern">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted/20 rounded mb-4"></div>
                      <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="card-modern text-center">
              <CardContent className="py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
                <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                <Link to="/">
                  <Button className="btn-primary">
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="card-modern hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Products Purchased */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mb-4 p-4 bg-card/50 rounded-lg border border-border/50">
                        <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span>Items Purchased</span>
                        </h4>
                        <div className="space-y-2">
                          {order.order_items.map((item, index) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                                  {item.quantity}
                                </span>
                                <span className="text-foreground">{item.product_name}</span>
                              </div>
                              <span className="text-muted-foreground">${item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Payment Info */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Payment Method</p>
                          <p className="text-sm text-muted-foreground flex items-center space-x-1">
                            <span>{getPaymentMethodIcon(order.payment_method)}</span>
                            <span>{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Minecraft User */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          <User className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Minecraft User</p>
                          <p className="text-sm text-muted-foreground">{order.minecraft_username}</p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Package className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Amount</p>
                          <p className="text-lg font-bold text-primary">${order.total_amount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    {order.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-400">
                          ⏳ Waiting for payment confirmation. Please ensure you've sent payment with your Order ID.
                        </p>
                      </div>
                    )}
                    {order.status === 'processing' && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-400">
                          🔄 Payment confirmed! Your items are being prepared for delivery.
                        </p>
                      </div>
                    )}
                    {order.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-400">
                          ✅ Order completed! Items have been delivered to your Minecraft account.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      <ChatbotWidget />
    </>
  );
};

export default Orders;