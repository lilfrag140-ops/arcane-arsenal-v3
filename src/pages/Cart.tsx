import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    category: string;
    image_url?: string;
    stock_quantity: number;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [minecraftUsername, setMinecraftUsername] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      return removeItem(itemId);
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quantity",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      toast({
        title: "Removed",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item",
      });
    }
  };

  const checkout = async () => {
    if (!minecraftUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your Minecraft username",
      });
      return;
    }

    // Check minimum order amount
    if (totalAmount < 1) {
      toast({
        variant: "destructive",
        title: "Minimum Order Required",
        description: "Orders must be at least $1.00 to proceed",
      });
      return;
    }

    // Redirect to checkout page
    window.location.href = '/checkout';
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading cart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-4">Add some items to get started!</p>
              <Link to="/">
                <Button className="btn-primary">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted/30 rounded-lg flex items-center justify-center">
                        {item.product.category === 'currency' && '💰'}
                        {item.product.category === 'spawner' && '🏗️'}
                        {item.product.category === 'item' && '⚡'}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {item.product.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${item.product.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                          max={item.product.stock_quantity}
                          aria-label={`Quantity for ${item.product.name}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Delivery</span>
                      <span>Instant*</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minecraft Username</label>
                    <Input
                      placeholder="Enter your Minecraft username"
                      value={minecraftUsername}
                      onChange={(e) => setMinecraftUsername(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full btn-primary"
                    onClick={checkout}
                    disabled={cartItems.length === 0 || totalAmount < 1}
                  >
                    {totalAmount < 1 ? `Minimum Order: $1.00` : 'Proceed to Checkout'}
                  </Button>

                  <Link to="/">
                    <Button variant="outline" className="w-full mt-2">
                      Continue Shopping
                    </Button>
                  </Link>

                  <p className="text-xs text-muted-foreground text-center mt-2">
                    *In-game money has instant delivery. Spawners and elytra may take additional processing time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default Cart;