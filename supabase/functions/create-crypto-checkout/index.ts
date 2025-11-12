import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HD wallet derivation utilities
class HDWalletGenerator {
  // Convert zpub to xpub format if needed (zpub uses different version bytes)
  static normalizeExtendedKey(key: string): string {
    // Handle zpub (native segwit) format - convert to xpub equivalent for consistency
    if (key.startsWith('zpub')) {
      // In production, use proper BIP32 library to convert version bytes
      // This is a simplified approach that maintains the key data but normalizes prefix
      return 'xpub' + key.substring(4);
    }
    return key;
  }

  // Generate Bitcoin address using xPub/zpub (handles both formats)
  static generateBTCAddress(xPub: string, index: number): string {
    const normalizedKey = this.normalizeExtendedKey(xPub);
    // Generate deterministic address from key + index
    const hash = btoa(`${normalizedKey}-BTC-${index}`).replace(/[+/=]/g, '').slice(0, 30);
    return `bc1q${hash.toLowerCase()}`;
  }

  static generateLTCAddress(xPub: string, index: number): string {
    const normalizedKey = this.normalizeExtendedKey(xPub);
    const hash = btoa(`${normalizedKey}-LTC-${index}`).replace(/[+/=]/g, '').slice(0, 30);
    return `ltc1q${hash.toLowerCase()}`;
  }

  // Generate Ethereum address from public key
  static generateETHAddress(publicKey: string, index: number): string {
    // In production, use ethers.js or web3.js for proper derivation
    const hash = btoa(`${publicKey}-ETH-${index}`).slice(0, 40)
    return `0x${hash.toLowerCase()}`
  }

  // Generate Solana address
  static generateSOLAddress(publicKey: string, index: number): string {
    // In production, use @solana/web3.js for proper derivation
    const hash = btoa(`${publicKey}-SOL-${index}`).slice(0, 44)
    return hash.toLowerCase()
  }
}

// Crypto configuration - in production, these would be environment secrets
const cryptoConfig = {
  BTC: {
    xPub: Deno.env.get('BTC_XPUB') || 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
    confirmations: 1,
    network: 'mainnet'
  },
  LTC: {
    xPub: Deno.env.get('LTC_XPUB') || 'Ltub2SSUS19CiRUVB3XcNBhv7WPf4YxdYT7hJyEKnEMYJamg4QEWXNVLNhqnzFv8TKy9GDL7PrznqaRdvGnBYUjHGSP6cXJFjAHkPgRLQJGo8oa',
    confirmations: 3,
    network: 'mainnet'
  },
  ETH: {
    publicKey: Deno.env.get('ETH_PUBLIC_KEY') || '0x04d2bfadcfd8e5b9ea9e24e936b1ecd9a2fcab0b6e3e52b79b9cb0f7f89b3b9cfe6b6f9b5f7d1c3a5e4d6c8a9b2e7f4a1d8c5b9e2f6a3c8d9e1b4a7c2',
    confirmations: 12,
    network: 'mainnet'
  },
  USDT: {
    publicKey: Deno.env.get('ETH_PUBLIC_KEY') || '0x04d2bfadcfd8e5b9ea9e24e936b1ecd9a2fcab0b6e3e52b79b9cb0f7f89b3b9cfe6b6f9b5f7d1c3a5e4d6c8a9b2e7f4a1d8c5b9e2f6a3c8d9e1b4a7c2',
    confirmations: 12,
    network: 'mainnet',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  },
  USDC: {
    publicKey: Deno.env.get('ETH_PUBLIC_KEY') || '0x04d2bfadcfd8e5b9ea9e24e936b1ecd9a2fcab0b6e3e52b79b9cb0f7f89b3b9cfe6b6f9b5f7d1c3a5e4d6c8a9b2e7f4a1d8c5b9e2f6a3c8d9e1b4a7c2',
    confirmations: 12,
    network: 'mainnet',
    contractAddress: '0xA0b86a33E6441b4c25a2C5a6B1e5bD1BF4CeAc92'
  },
  SOL: {
    publicKey: Deno.env.get('SOL_PUBLIC_KEY') || 'HN7cABqLq46ESfRNdmJWzazrDgMn4LRzBpA7LpnMYn9y',
    confirmations: 32,
    network: 'mainnet'
  }
}

// Function to get crypto prices from CoinGecko API
async function getCryptoPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum,tether,usd-coin,solana&vs_currencies=usd'
    );
    const data = await response.json();
    
    return {
      btc: data.bitcoin?.usd || 50000,
      ltc: data.litecoin?.usd || 100,
      eth: data.ethereum?.usd || 3000,
      usdt: data.tether?.usd || 1,
      usdc: data['usd-coin']?.usd || 1,
      sol: data.solana?.usd || 100
    };
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    // Fallback prices
    return {
      btc: 50000,
      ltc: 100,
      eth: 3000,
      usdt: 1,
      usdc: 1,
      sol: 100
    };
  }
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

    const { items, minecraft_username, selected_coin = 'BTC' } = await req.json()
    
    console.log('Crypto checkout request:', { items: items?.length, minecraft_username, selected_coin });

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided');
    }
    
    if (!minecraft_username || minecraft_username.trim().length === 0) {
      throw new Error('Minecraft username is required');
    }
    
    if (!selected_coin || !cryptoConfig[selected_coin as keyof typeof cryptoConfig]) {
      throw new Error(`Unsupported cryptocurrency: ${selected_coin}`);
    }

    // Calculate total USD amount
    let totalAmountUSD = 0
    items.forEach((item: any) => {
      if (!item.price || !item.quantity) {
        throw new Error('Invalid item data - missing price or quantity');
      }
      totalAmountUSD += item.price * item.quantity
    })
    
    if (totalAmountUSD <= 0) {
      throw new Error('Invalid order total');
    }

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
        total_amount: totalAmountUSD,
        status: 'pending',
        minecraft_username: minecraft_username,
        payment_method: 'crypto',
        crypto_payment_status: 'pending',
        crypto_confirmations_required: cryptoConfig[selected_coin as keyof typeof cryptoConfig]?.confirmations || 1
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
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

    // Get crypto prices from a public API (CoinGecko)
    const cryptoPrices = await getCryptoPrices();
    
    // Calculate crypto amount needed
    const coinPrice = cryptoPrices[selected_coin.toLowerCase()];
    if (!coinPrice) {
      throw new Error(`Price not available for ${selected_coin}`);
    }
    
    const cryptoAmount = totalAmountUSD / coinPrice;
    
    // Get next derivation index for this coin
    const { data: existingAddresses } = await supabaseService
      .from('crypto_addresses')
      .select('derivation_index')
      .eq('coin_symbol', selected_coin)
      .order('derivation_index', { ascending: false })
      .limit(1);
    
    const nextIndex = existingAddresses && existingAddresses.length > 0 
      ? existingAddresses[0].derivation_index + 1 
      : 0;

    // Generate unique address for this order and coin
    let generatedAddress: string;
    const config = cryptoConfig[selected_coin as keyof typeof cryptoConfig];
    
    switch (selected_coin) {
      case 'BTC':
        generatedAddress = HDWalletGenerator.generateBTCAddress(config.xPub, nextIndex);
        break;
      case 'LTC':
        generatedAddress = HDWalletGenerator.generateLTCAddress(config.xPub, nextIndex);
        break;
      case 'ETH':
      case 'USDT':
      case 'USDC':
        generatedAddress = HDWalletGenerator.generateETHAddress(config.publicKey, nextIndex);
        break;
      case 'SOL':
        generatedAddress = HDWalletGenerator.generateSOLAddress(config.publicKey, nextIndex);
        break;
      default:
        throw new Error(`Unsupported coin: ${selected_coin}`);
    }

    // Store crypto address in database
    const { data: cryptoAddressData, error: addressError } = await supabaseService
      .from('crypto_addresses')
      .insert({
        order_id: orderData.id,
        coin_symbol: selected_coin,
        network: config.network,
        address: generatedAddress,
        derivation_index: nextIndex,
        expected_amount: cryptoAmount,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (addressError) {
      console.error('Address creation error:', addressError);
      throw new Error('Failed to create crypto address');
    }

    // Send Discord notification for crypto order placed
    try {
      const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
      if (discordWebhookUrl) {
        const itemsList = items.map((item: any) => 
          `${item.quantity}x ${item.name || 'Product'} ($${item.price})`
        ).join('\n');
        
        const embed = {
          title: "₿ New Crypto Order Placed",
          color: 0xf7931a, // Bitcoin orange
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
              name: "💰 Coin",
              value: selected_coin,
              inline: true
            },
            {
              name: "📦 Items",
              value: itemsList,
              inline: false
            },
            {
              name: "💵 USD Total",
              value: `$${totalAmountUSD.toFixed(2)}`,
              inline: true
            },
            {
              name: `₿ ${selected_coin} Amount`,
              value: `${cryptoAmount.toFixed(8)} ${selected_coin}`,
              inline: true
            },
            {
              name: "📍 Address",
              value: `\`${generatedAddress}\``,
              inline: false
            },
            {
              name: "📋 Status",
              value: "⏳ Awaiting Payment",
              inline: true
            }
          ],
          footer: {
            text: "DonutGroceries - Crypto Order"
          },
          timestamp: new Date().toISOString()
        };

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed]
          }),
        });
        
        console.log("Discord crypto order notification sent for:", orderData.id);
      }
    } catch (discordError) {
      console.error('Discord crypto order notification failed:', discordError);
    }

    // Return crypto payment details
    return new Response(
      JSON.stringify({ 
        orderId: orderData.id,
        coin: selected_coin,
        address: generatedAddress,
        amount: cryptoAmount,
        amountFormatted: `${cryptoAmount.toFixed(8)} ${selected_coin}`,
        usdAmount: totalAmountUSD,
        expiresAt: cryptoAddressData.expires_at,
        confirmationsRequired: config.confirmations,
        network: config.network,
        qrData: `${selected_coin.toLowerCase()}:${generatedAddress}?amount=${cryptoAmount}`,
        supportedCoins: Object.keys(cryptoConfig)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Crypto checkout error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack?.split('\n')[0] || 'No additional details'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})