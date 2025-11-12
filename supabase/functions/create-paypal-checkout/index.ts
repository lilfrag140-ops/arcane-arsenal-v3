import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user

    if (!user?.email) throw new Error('User not authenticated')

    const { items, minecraft_username } = await req.json()

    // Calculate total
    let totalAmount = 0
    items.forEach((item: any) => {
      totalAmount += item.price * item.quantity
    })

    // Create order record in Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data: orderData, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        minecraft_username: minecraft_username,
        payment_method: 'paypal',
      })
      .select()
      .single()

    if (orderError) {
      throw new Error('Failed to create order')
    }

    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabaseService
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Don't fail the order creation, but log the error
    }

    // Send Discord notification for order placed
    try {
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (discordWebhookUrl) {
        // Format order items for display
        const itemsList = `${items[0].quantity}x ${items[0].name || 'Product'} ($${items[0].price})`;
        
        // Create Discord embed
        const embed = {
          title: "📋 New Order Placed",
          color: 0xffaa00, // Orange color
          fields: [
            {
              name: "📋 Order ID",
              value: `\`${orderData.id.slice(0, 8)}\``,
              inline: true
            },
            {
              name: "🎮 Minecraft Username", 
              value: minecraft_username,
              inline: true
            },
            {
              name: "📦 Items",
              value: itemsList,
              inline: false
            },
            {
              name: "💰 Total",
              value: `$${totalAmount}`,
              inline: true
            },
            {
              name: "💳 Payment Method",
              value: "paypal",
              inline: true
            },
            {
              name: "📋 Status",
              value: "⏳ Awaiting Payment",
              inline: true
            }
          ],
          footer: {
            text: "DonutGroceries - Order Placed"
          },
          timestamp: new Date().toISOString()
        };

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed],
            content: `## 📋 Order Placed (JSON)\n\`\`\`json\n${JSON.stringify({
              orderId: orderData.id,
              userId: user.id,
              minecraft_username: minecraft_username,
              items: items,
              total: totalAmount,
              currency: 'USD',
              paymentStatus: 'pending',
              gateway: 'paypal',
              timestamp: new Date().toISOString(),
              notificationType: 'order_placed'
            }, null, 2)}\n\`\`\``
          }),
        });
        
        console.log("Discord order placed notification sent for:", orderData.id);
      }
    } catch (discordError) {
      console.error('Discord order placed notification failed:', discordError);
      // Don't fail the order creation if Discord notification fails
    }

    // Return PayPal payment details
    return new Response(
      JSON.stringify({ 
        orderId: orderData.id,
        amount: totalAmount,
        items: items,
        message: 'PayPal integration pending - please implement PayPal SDK on frontend'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})