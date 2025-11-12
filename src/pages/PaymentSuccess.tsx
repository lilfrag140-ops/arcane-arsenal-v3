import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const { toast } = useToast();
  const orderId = searchParams.get('order_id');
  const paymentMethod = searchParams.get('payment_method') || 'unknown';

  useEffect(() => {
    if (orderId) {
      updateOrderStatus();
    }
  }, [orderId]);

  const updateOrderStatus = async () => {
    try {
      // For Tebex payments, the webhook already updated the order status
      // Just fetch the order details
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // If order status is still pending, update it (fallback if webhook hasn't fired yet)
      if (order.status === 'pending' && paymentMethod === 'tebex') {
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            payment_method: paymentMethod 
          })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;
        setOrderData(data);
      } else {
        setOrderData(order);
      }
      
      // Clear cart items
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      }

      // Send Discord notification only if not Tebex (Tebex webhook handles it)
      if (paymentMethod !== 'tebex') {
        try {
          await supabase.functions.invoke('discord-order-notification', {
            body: { 
              orderId: order.id,
              notificationType: 'order_paid'
            }
          });
        } catch (discordError) {
          console.error('Discord notification failed:', discordError);
        }
      }

      toast({
        title: "Payment Successful!",
        description: `Your ${paymentMethod} payment has been confirmed and your order is being processed.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Payment Processed",
        description: `Your ${paymentMethod} payment was successful. Order details will be updated shortly.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your {paymentMethod} payment. Your order has been confirmed.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderData && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{orderData.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold">${orderData.total_amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Minecraft Username:</span>
                  <span>{orderData.minecraft_username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-600 font-medium">Completed</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="bg-muted/20 p-6 rounded-lg mb-8">
          <h3 className="font-bold mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Your items will be delivered to your Minecraft account within 24 hours</li>
            <li>• You'll receive an email confirmation shortly</li>
            <li>• Join our Discord for support: discord.gg/donutgrocery</li>
            <li>• Spawners and elytra may take additional processing time</li>
          </ul>
        </div>

        <div className="text-center space-y-4">
          <Link to="/dashboard">
            <Button className="btn-primary mr-4">
              View Orders
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;