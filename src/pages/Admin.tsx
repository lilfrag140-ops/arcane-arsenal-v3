import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Package, CreditCard, User, Search, Filter, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { Session } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  minecraft_username: string;
  created_at: string;
  stripe_payment_intent_id?: string;
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [maskedPaymentIds, setMaskedPaymentIds] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { logOrderView, logOrderStatusUpdate } = useAdminAudit();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        checkAdminStatus();
        fetchOrders();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        checkAdminStatus();
        fetchOrders();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('current_user_has_role', { 
        _role: 'admin' 
      });
      
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Log admin access to orders data
      if (data && data.length > 0) {
        await logOrderView('bulk_view', { order_count: data.length });
      }

      // Fetch masked payment intent IDs for display
      const maskedIds: Record<string, string> = {};
      if (data) {
        for (const order of data) {
          if (order.stripe_payment_intent_id) {
            try {
              const { data: maskedId } = await supabase.rpc('mask_payment_intent_id', {
                payment_intent_id: order.stripe_payment_intent_id,
                user_id: order.user_id
              });
              if (maskedId) {
                maskedIds[order.id] = maskedId;
              }
            } catch (maskError) {
              console.error('Error masking payment ID:', maskError);
            }
          }
        }
      }
      setMaskedPaymentIds(maskedIds);
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

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.minecraft_username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      const oldStatus = currentOrder?.status || 'unknown';

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Log the admin action
      await logOrderStatusUpdate(orderId, oldStatus, newStatus);

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold gradient-text mb-2">Order Management</h1>
          <p className="text-muted-foreground">Manage customer orders and payment confirmations</p>
        </div>

        {/* Filters */}
        <Card className="card-modern mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID or Minecraft username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Package className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Processing</p>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'processing').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Package className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
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
        ) : filteredOrders.length === 0 ? (
          <Card className="card-modern text-center">
            <CardContent className="py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
              <p className="text-muted-foreground">No orders match your current filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="card-modern">
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
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                        {maskedPaymentIds[order.id] && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {maskedPaymentIds[order.id]}
                          </p>
                        )}
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

                    {/* Security Status */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Security</p>
                        <p className="text-xs text-muted-foreground">Data Logged</p>
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      disabled={order.status === 'processing'}
                    >
                      Mark Processing
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={order.status === 'completed'}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      disabled={order.status === 'cancelled'}
                    >
                      Cancel Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;