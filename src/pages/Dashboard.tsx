import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Package, CreditCard, MessageSquare, Settings, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface UserProfile {
  id: string;
  username: string | null;
  minecraft_username: string | null;
  total_spent: number | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  minecraft_username: string;
}

export const Dashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;


        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch recent orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ordersData) {
          setOrders(ordersData);
        }

        // Fetch recent tickets
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ticketsData) {
          setTickets(ticketsData);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info */}
      <div className="border-b bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Welcome back{profile?.username ? `, ${profile.username}` : ''}!
              </h1>
              <p className="text-muted-foreground">
                Manage your account, orders, and preferences
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${profile?.total_spent?.toFixed(2) || '0.00'}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orders.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No orders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex justify-between items-center p-3 bg-muted/20 rounded">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${order.total_amount}</p>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Support Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tickets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No support tickets</p>
                    ) : (
                      <div className="space-y-3">
                        {tickets.slice(0, 3).map((ticket) => (
                          <div key={ticket.id} className="p-3 bg-muted/20 rounded">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{ticket.title}</h4>
                              <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{ticket.category}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">${order.total_amount}</p>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Minecraft Username: {order.minecraft_username}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No support tickets</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{ticket.title}</h3>
                            <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Category: {ticket.category}</span>
                            <span>Priority: {ticket.priority}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile?.username || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                        placeholder="Enter your username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minecraft_username">Minecraft Username</Label>
                      <Input
                        id="minecraft_username"
                        value={profile?.minecraft_username || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, minecraft_username: e.target.value } : null)}
                        placeholder="Enter your Minecraft username"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => updateProfile({ 
                      username: profile?.username, 
                      minecraft_username: profile?.minecraft_username 
                    })}
                    className="btn-primary"
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;