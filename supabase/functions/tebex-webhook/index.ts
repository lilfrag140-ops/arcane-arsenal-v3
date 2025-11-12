import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    const webhookData = await req.json();
    console.log('Received Tebex webhook:', JSON.stringify(webhookData, null, 2));

    // Tebex webhook payload structure
    const { type, subject } = webhookData;

    if (!type || !subject) {
      throw new Error('Invalid webhook payload');
    }

    // Handle payment completion
    if (type === 'payment.completed') {
      const orderId = subject.custom?.order_id;
      const minecraftUsername = subject.custom?.minecraft_username;

      if (!orderId) {
        console.error('No order_id in webhook custom data');
        throw new Error('Missing order_id in webhook');
      }

      console.log('Processing completed payment for order:', orderId);

      // Update order status to completed
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Error updating order:', orderUpdateError);
        throw orderUpdateError;
      }

      // Update Tebex checkout status
      const { error: checkoutUpdateError } = await supabaseClient
        .from('tebex_checkouts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (checkoutUpdateError) {
        console.error('Error updating Tebex checkout:', checkoutUpdateError);
      }

      // Get order details for Discord notification
      const { data: order } = await supabaseClient
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (name)
          )
        `)
        .eq('id', orderId)
        .single();

      // Send Discord notification
      const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
      if (discordWebhookUrl && order) {
        try {
          const itemsList = order.order_items
            .map((item: any) => `${item.quantity}x ${item.products.name} ($${item.price})`)
            .join('\n');

          await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: '🎉 New Order Completed (Tebex)',
                color: 0x00ff00,
                fields: [
                  { name: 'Order ID', value: orderId, inline: true },
                  { name: 'Amount', value: `$${order.total_amount}`, inline: true },
                  { name: 'Payment Method', value: 'Tebex', inline: true },
                  { name: 'Minecraft Username', value: minecraftUsername || 'N/A', inline: true },
                  { name: 'Items', value: itemsList || 'N/A', inline: false },
                ],
                timestamp: new Date().toISOString(),
              }],
            }),
          });
        } catch (discordError) {
          console.error('Discord notification error:', discordError);
        }
      }

      console.log('Order completed successfully:', orderId);
    }

    // Handle payment refunded
    if (type === 'payment.refunded') {
      const orderId = subject.custom?.order_id;
      
      if (orderId) {
        const { error: orderUpdateError } = await supabaseClient
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating refunded order:', orderUpdateError);
        }

        const { error: checkoutUpdateError } = await supabaseClient
          .from('tebex_checkouts')
          .update({
            status: 'cancelled',
          })
          .eq('order_id', orderId);

        if (checkoutUpdateError) {
          console.error('Error updating cancelled checkout:', checkoutUpdateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in tebex-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
