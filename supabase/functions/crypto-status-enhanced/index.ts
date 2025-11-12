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
    console.log('Enhanced status check for order:', orderId, 'by user:', user.id);

    if (!orderId) throw new Error('Order ID is required')

    // Get comprehensive order data with all crypto details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        crypto_addresses (
          id,
          coin_symbol,
          address,
          expected_amount,
          estimated_network_fee,
          recommended_total,
          derivation_path,
          derivation_index,
          address_type,
          expires_at,
          top_up_window_expires_at,
          crypto_transactions (
            id,
            tx_hash,
            amount,
            confirmations,
            block_height,
            detected_at,
            confirmed_at
          )
        ),
        crypto_price_snapshots (
          coin_symbol,
          usd_price,
          price_source,
          created_at
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

    // Calculate comprehensive payment status
    const cryptoAddresses = order.crypto_addresses || []
    let totalReceived = 0
    let totalConfirmedReceived = 0
    let allTransactions: any[] = []
    let isExpired = false
    let isInTopUpWindow = false

    for (const address of cryptoAddresses) {
      const now = new Date()
      const expiresAt = new Date(address.expires_at)
      const topUpExpiresAt = new Date(address.top_up_window_expires_at || address.expires_at)
      
      // Check expiry status
      if (expiresAt < now) {
        isExpired = true
      }
      
      if (topUpExpiresAt > now && expiresAt < now) {
        isInTopUpWindow = true
      }

      const transactions = address.crypto_transactions || []
      allTransactions = [...allTransactions, ...transactions.map((tx: any) => ({
        ...tx,
        coin: address.coin_symbol,
        address: address.address,
        derivation_path: address.derivation_path,
        derivation_index: address.derivation_index
      }))]

      // Sum up amounts (only confirmed transactions)
      for (const tx of transactions) {
        const amount = parseFloat(tx.amount)
        totalReceived += amount
        
        if (tx.confirmations >= order.crypto_confirmations_required) {
          totalConfirmedReceived += amount
        }
      }
    }

    // Determine comprehensive payment status
    let paymentStatus = 'pending'
    let statusMessage = 'Awaiting payment'
    
    const expectedAmount = cryptoAddresses[0]?.expected_amount || order.total_amount
    const underpaidAmount = Math.max(0, expectedAmount - totalConfirmedReceived)
    const overpaidAmount = Math.max(0, totalConfirmedReceived - expectedAmount)
    
    if (isExpired && !isInTopUpWindow && totalConfirmedReceived < expectedAmount) {
      paymentStatus = 'expired'
      statusMessage = 'Payment window expired'
    } else if (totalConfirmedReceived >= expectedAmount) {
      paymentStatus = 'paid'
      statusMessage = 'Payment confirmed'
      
      if (overpaidAmount > 0) {
        paymentStatus = 'overpaid'
        statusMessage = `Payment confirmed (overpaid by ${overpaidAmount.toFixed(8)})`
      }
    } else if (totalReceived >= expectedAmount) {
      paymentStatus = 'pending_confirmations'
      statusMessage = `Payment detected, awaiting ${order.crypto_confirmations_required} confirmations`
    } else if (totalReceived > 0) {
      paymentStatus = 'partial'
      statusMessage = `Partial payment received (${underpaidAmount.toFixed(8)} remaining)`
      
      if (isInTopUpWindow) {
        statusMessage += ` - Top-up window active`
      }
    }

    // Calculate time remaining
    const now = new Date()
    const mainExpiryTime = cryptoAddresses.length > 0 
      ? new Date(cryptoAddresses[0].expires_at)
      : new Date(now.getTime() + 15 * 60 * 1000)
    const topUpExpiryTime = cryptoAddresses.length > 0 
      ? new Date(cryptoAddresses[0].top_up_window_expires_at || cryptoAddresses[0].expires_at)
      : mainExpiryTime

    const relevantExpiryTime = isInTopUpWindow ? topUpExpiryTime : mainExpiryTime
    const timeRemainingMs = Math.max(0, relevantExpiryTime.getTime() - now.getTime())
    const timeRemainingHours = Math.floor(timeRemainingMs / (1000 * 60 * 60))
    const timeRemainingMinutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60))

    // Get price information
    const priceSnapshot = order.crypto_price_snapshots?.[0]
    
    // Enhanced response with comprehensive payment information
    const response = {
      orderId: order.id,
      paymentStatus,
      statusMessage,
      isInTopUpWindow,
      totalAmountUSD: order.total_amount,
      totalReceived,
      totalConfirmedReceived,
      expectedAmount,
      underpaidAmount,
      overpaidAmount,
      confirmationsRequired: order.crypto_confirmations_required,
      
      // Address information
      addresses: cryptoAddresses.map((addr: any) => ({
        id: addr.id,
        coin: addr.coin_symbol,
        address: addr.address,
        derivationPath: addr.derivation_path,
        derivationIndex: addr.derivation_index,
        addressType: addr.address_type,
        expectedAmount: addr.expected_amount,
        estimatedNetworkFee: addr.estimated_network_fee,
        recommendedTotal: addr.recommended_total,
        qrData: `${addr.coin_symbol.toLowerCase()}:${addr.address}?amount=${addr.recommended_total}`,
        expiresAt: addr.expires_at,
        topUpWindowExpiresAt: addr.top_up_window_expires_at
      })),
      
      // Transaction history with enhanced details
      transactions: allTransactions
        .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
        .map(tx => ({
          ...tx,
          status: tx.confirmations >= order.crypto_confirmations_required ? 'confirmed' : 'pending',
          confirmationProgress: `${tx.confirmations}/${order.crypto_confirmations_required}`,
          explorerUrl: this.generateExplorerUrl(tx.tx_hash, tx.coin)
        })),
      
      // Timing information
      timeRemaining: {
        hours: timeRemainingHours,
        minutes: timeRemainingMinutes,
        expired: timeRemainingMs === 0,
        isTopUpWindow: isInTopUpWindow
      },
      
      // Order details
      minecraftUsername: order.minecraft_username,
      orderStatus: order.status,
      
      // Price information
      priceInfo: priceSnapshot ? {
        coinSymbol: priceSnapshot.coin_symbol,
        usdPrice: priceSnapshot.usd_price,
        priceSource: priceSnapshot.price_source,
        snapshotTime: priceSnapshot.created_at
      } : null,
      
      // Actions available to user
      availableActions: {
        canTopUp: isInTopUpWindow && underpaidAmount > 0,
        canRequestRefund: overpaidAmount > 0 && paymentStatus === 'overpaid',
        needsUserAction: paymentStatus === 'partial' || paymentStatus === 'overpaid'
      },
      
      // System information
      meta: {
        lastChecked: now.toISOString(),
        dataSource: 'enhanced_crypto_status',
        version: '2.0'
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Enhanced status check error:', error)
    console.error('Error details:', error.message)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to generate blockchain explorer URLs
function generateExplorerUrl(txHash: string, coin: string): string {
  const explorers: Record<string, string> = {
    'BTC': `https://blockstream.info/tx/${txHash}`,
    'LTC': `https://live.blockcypher.com/ltc/tx/${txHash}`,
    'ETH': `https://etherscan.io/tx/${txHash}`,
    'USDT': `https://etherscan.io/tx/${txHash}`,
    'USDC': `https://etherscan.io/tx/${txHash}`,
    'SOL': `https://solscan.io/tx/${txHash}`
  }
  
  return explorers[coin] || '#'
}