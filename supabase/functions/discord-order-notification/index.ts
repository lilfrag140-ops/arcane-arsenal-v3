import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, notificationType = 'order_paid' } = await req.json();
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch order details with order items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (
            name,
            category
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to fetch order: ${orderError?.message}`);
    }

    // Get user profile for additional info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username, discord_username, discord_id')
      .eq('user_id', order.user_id)
      .maybeSingle();

    const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!discordWebhookUrl) {
      throw new Error("Discord webhook URL not configured");
    }

    // Format order items for display
    const itemsList = order.order_items.map((item: any) => 
      `${item.quantity}x ${item.products.name} ($${item.price})`
    ).join('\n');

    // Create Discord embed based on notification type
    const isOrderPlaced = notificationType === 'order_placed';
    const embed = {
      title: isOrderPlaced ? "📋 New Order Placed" : "💰 Order Payment Confirmed",
      color: isOrderPlaced ? 0xffaa00 : 0x00ff00, // Orange for placed, Green for paid
      fields: [
        {
          name: "📋 Order ID",
          value: `\`${order.id.slice(0, 8)}\``,
          inline: true
        },
        {
          name: "👤 Customer",
          value: profile?.username || profile?.discord_username || order.minecraft_username || "Unknown",
          inline: true
        },
        {
          name: "🎮 Minecraft Username",
          value: order.minecraft_username,
          inline: true
        },
        {
          name: "💬 Discord User",
          value: profile?.discord_username ? `@${profile.discord_username}${profile.discord_id ? ` (${profile.discord_id})` : ''}` : "N/A",
          inline: true
        },
        {
          name: "📦 Items",
          value: itemsList || "No items",
          inline: false
        },
        {
          name: "💰 Total",
          value: `$${order.total_amount}`,
          inline: true
        },
        {
          name: "💳 Payment Method",
          value: order.payment_method || "unknown",
          inline: true
        },
        {
          name: isOrderPlaced ? "📋 Status" : "✅ Status",
          value: isOrderPlaced ? "⏳ Awaiting Payment" : "✅ Paid",
          inline: true
        },
        {
          name: "📅 Order Time",
          value: new Date(order.created_at).toLocaleString(),
          inline: false
        }
      ],
      footer: {
        text: isOrderPlaced ? "DonutGroceries - Order Placed" : "DonutGroceries - Payment Confirmed"
      },
      timestamp: new Date(order.created_at).toISOString()
    };

    // Send to Discord with retry logic
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const discordResponse = await fetch(discordWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed],
            content: `## ${isOrderPlaced ? '📋 Order Placed' : '💰 Payment Confirmed'} (JSON)\n\`\`\`json\n${JSON.stringify({
              orderId: order.id,
              userId: order.user_id,
              minecraft_username: order.minecraft_username,
              discord_info: {
                username: profile?.discord_username || null,
                id: profile?.discord_id || null
              },
              items: order.order_items.map((item: any) => ({
                name: item.products.name,
                category: item.products.category,
                quantity: item.quantity,
                price: item.price
              })),
              total: order.total_amount,
              currency: 'USD',
              paymentStatus: isOrderPlaced ? 'pending' : order.status,
              gateway: order.payment_method || 'unknown',
              timestamp: order.created_at,
              notificationType: notificationType,
              shipping: { 
                delivery_method: 'minecraft_username',
                minecraft_username: order.minecraft_username
              }
            }, null, 2)}\n\`\`\``
          }),
        });

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          console.error(`Discord webhook error (attempt ${retryCount + 1}):`, errorText);
          
          if (retryCount < maxRetries - 1) {
            // Exponential backoff: wait 2^retryCount seconds
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            retryCount++;
            continue;
          } else {
            throw new Error(`Discord webhook failed after ${maxRetries} attempts: ${errorText}`);
          }
        }

        console.log(`Discord ${notificationType} notification sent successfully for order:`, orderId);
        break;
      } catch (error) {
        console.error(`Discord webhook attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          retryCount++;
        } else {
          throw error;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Discord notification error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});