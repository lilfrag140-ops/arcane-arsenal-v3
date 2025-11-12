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

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user

    if (!user?.email) throw new Error('User not authenticated')

    const { orderId } = await req.json()
    console.log('Checking status for order:', orderId);

    if (!orderId) throw new Error('Order ID is required')

    // Get order with crypto details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        crypto_addresses (
          id,
          coin_symbol,
          address,
          expected_amount,
          expires_at,
          crypto_transactions (
            id,
            tx_hash,
            amount,
            confirmations,
            detected_at,
            confirmed_at
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (orderError) {
      console.error('Database error:', orderError);
      throw new Error('Database error: ' + orderError.message);
    }
    
    if (!order) {
      console.log('No order found for user:', user.id, 'orderId:', orderId);
      throw new Error('Order not found or access denied');
    }

    // Calculate payment status
    const cryptoAddresses = order.crypto_addresses || []
    let totalReceived = 0
    let totalConfirmedReceived = 0
    let allTransactions: any[] = []
    let isExpired = false

    for (const address of cryptoAddresses) {
      // Check if address has expired
      if (new Date(address.expires_at) < new Date()) {
        isExpired = true
      }

      const transactions = address.crypto_transactions || []
      allTransactions = [...allTransactions, ...transactions.map((tx: any) => ({
        ...tx,
        coin: address.coin_symbol,
        address: address.address
      }))]

      // Sum up amounts
      for (const tx of transactions) {
        totalReceived += parseFloat(tx.amount)
        if (tx.confirmations >= order.crypto_confirmations_required) {
          totalConfirmedReceived += parseFloat(tx.amount)
        }
      }
    }

    // Determine payment status
    let paymentStatus = 'pending'
    if (isExpired && totalConfirmedReceived < order.total_amount) {
      paymentStatus = 'expired'
    } else if (totalConfirmedReceived >= order.total_amount) {
      paymentStatus = 'paid'
    } else if (totalReceived > 0) {
      paymentStatus = 'partial'
    }

    // Calculate time remaining
    const now = new Date()
    const expiryTime = cryptoAddresses.length > 0 
      ? new Date(cryptoAddresses[0].expires_at)
      : new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const timeRemainingMs = Math.max(0, expiryTime.getTime() - now.getTime())
    const timeRemainingHours = Math.floor(timeRemainingMs / (1000 * 60 * 60))
    const timeRemainingMinutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60))

    return new Response(
      JSON.stringify({
        orderId: order.id,
        paymentStatus,
        totalAmountUSD: order.total_amount,
        totalReceived,
        totalConfirmedReceived,
        confirmationsRequired: order.crypto_confirmations_required,
        addresses: cryptoAddresses.map((addr: any) => ({
          coin: addr.coin_symbol,
          address: addr.address,
          expectedAmount: addr.expected_amount,
          qrData: `${addr.coin_symbol.toLowerCase()}:${addr.address}?amount=${addr.expected_amount}`
        })),
        transactions: allTransactions.sort((a, b) => 
          new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
        ),
        expiresAt: cryptoAddresses[0]?.expires_at,
        timeRemaining: {
          hours: timeRemainingHours,
          minutes: timeRemainingMinutes,
          expired: timeRemainingMs === 0
        },
        minecraftUsername: order.minecraft_username
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Status check error:', error)
    console.error('Error details:', error.message)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})