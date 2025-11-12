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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { items, minecraft_username } = await req.json();

    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!minecraft_username || !minecraft_username.trim()) {
      throw new Error('Minecraft username is required');
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    console.log('Creating order for user:', user.id, 'Total:', totalAmount);

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: 'tebex',
        minecraft_username: minecraft_username.trim(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      throw new Error('Failed to create order items');
    }

    // Create Tebex checkout via their API
    const tebexProjectId = Deno.env.get('TEBEX_PROJECT_ID');
    const tebexPrivateKey = Deno.env.get('TEBEX_PRIVATE_KEY');

    if (!tebexProjectId || !tebexPrivateKey) {
      throw new Error('Tebex API credentials not configured');
    }

    // Prepare packages for Tebex
    const packages = items.map((item: any) => ({
      name: item.name,
      price: item.price,
      qty: item.quantity,
      type: 'single',
    }));

    const tebexCheckoutData = {
      complete_url: `https://1e6ea275-a216-4ea7-91ad-45d1311d409d.lovableproject.com/payment-success?order_id=${order.id}&payment_method=tebex`,
      cancel_url: `https://1e6ea275-a216-4ea7-91ad-45d1311d409d.lovableproject.com/checkout`,
      custom: {
        order_id: order.id,
        minecraft_username: minecraft_username.trim(),
      },
      packages: packages,
    };

    console.log('Creating Tebex checkout:', tebexCheckoutData);

    // Call Tebex API with Basic Auth
    const authString = btoa(`${tebexProjectId}:${tebexPrivateKey}`);
    const tebexResponse = await fetch('https://checkout.tebex.io/api/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tebexCheckoutData),
    });

    if (!tebexResponse.ok) {
      const errorText = await tebexResponse.text();
      console.error('Tebex API error:', tebexResponse.status, errorText);
      throw new Error(`Tebex API error: ${tebexResponse.status} - ${errorText}`);
    }

    const tebexResult = await tebexResponse.json();
    console.log('Tebex checkout created:', tebexResult);

    // Store Tebex checkout info in database
    const { error: tebexError } = await supabaseClient
      .from('tebex_checkouts')
      .insert({
        order_id: order.id,
        tebex_ident: tebexResult.data.ident,
        tebex_checkout_url: tebexResult.data.links.checkout,
        status: 'pending',
      });

    if (tebexError) {
      console.error('Error storing Tebex checkout:', tebexError);
      // Continue anyway as the order is already created
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        checkoutUrl: tebexResult.data.links.checkout,
        ident: tebexResult.data.ident,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-tebex-checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
