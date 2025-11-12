import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Blockchain RPC endpoints - in production, use your own nodes or services like Infura/Alchemy
const rpcEndpoints = {
  BTC: 'https://blockstream.info/api',
  LTC: 'https://api.blockcypher.com/v1/ltc/main',
  ETH: 'https://api.etherscan.io/api',
  SOL: 'https://api.mainnet-beta.solana.com'
}

// Mock blockchain monitoring - in production, use proper RPC calls or indexer services
class BlockchainMonitor {
  static async checkBTCAddress(address: string): Promise<{ balance: number; transactions: any[] }> {
    try {
      const response = await fetch(`${rpcEndpoints.BTC}/address/${address}`);
      const data = await response.json();
      
      return {
        balance: data.chain_stats?.funded_txo_sum || 0,
        transactions: data.txs || []
      };
    } catch (error) {
      console.error('BTC monitoring error:', error);
      return { balance: 0, transactions: [] };
    }
  }

  static async checkETHAddress(address: string, contractAddress?: string): Promise<{ balance: number; transactions: any[] }> {
    try {
      const apiKey = Deno.env.get('ETHERSCAN_API_KEY') || 'demo';
      let url: string;
      
      if (contractAddress) {
        // ERC-20 token balance
        url = `${rpcEndpoints.ETH}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
      } else {
        // ETH balance
        url = `${rpcEndpoints.ETH}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      const balance = parseInt(data.result || '0') / (contractAddress ? 1000000 : 1000000000000000000);
      
      // Get transactions
      const txUrl = `${rpcEndpoints.ETH}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      const txResponse = await fetch(txUrl);
      const txData = await txResponse.json();
      
      return {
        balance,
        transactions: txData.result || []
      };
    } catch (error) {
      console.error('ETH monitoring error:', error);
      return { balance: 0, transactions: [] };
    }
  }

  static async checkSOLAddress(address: string): Promise<{ balance: number; transactions: any[] }> {
    try {
      const response = await fetch(rpcEndpoints.SOL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      const balance = (data.result?.value || 0) / 1000000000; // Convert lamports to SOL
      
      return {
        balance,
        transactions: []
      };
    } catch (error) {
      console.error('SOL monitoring error:', error);
      return { balance: 0, transactions: [] };
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get all pending crypto addresses that haven't expired
    const { data: pendingAddresses, error: addressesError } = await supabaseService
      .from('crypto_addresses')
      .select(`
        *,
        orders!inner(
          id,
          user_id,
          total_amount,
          crypto_payment_status,
          crypto_confirmations_required
        )
      `)
      .lt('expires_at', new Date().toISOString())
      .in('orders.crypto_payment_status', ['pending', 'partial']);

    if (addressesError) {
      throw new Error(`Failed to fetch addresses: ${addressesError.message}`);
    }

    if (!pendingAddresses || pendingAddresses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending addresses to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const addressData of pendingAddresses) {
      try {
        let addressStatus;
        
        switch (addressData.coin_symbol) {
          case 'BTC':
          case 'LTC':
            addressStatus = await BlockchainMonitor.checkBTCAddress(addressData.address);
            break;
          case 'ETH':
            addressStatus = await BlockchainMonitor.checkETHAddress(addressData.address);
            break;
          case 'USDT':
            addressStatus = await BlockchainMonitor.checkETHAddress(
              addressData.address,
              '0xdAC17F958D2ee523a2206206994597C13D831ec7'
            );
            break;
          case 'USDC':
            addressStatus = await BlockchainMonitor.checkETHAddress(
              addressData.address,
              '0xA0b86a33E6441b4c25a2C5a6B1e5bD1BF4CeAc92'
            );
            break;
          case 'SOL':
            addressStatus = await BlockchainMonitor.checkSOLAddress(addressData.address);
            break;
          default:
            continue;
        }

        // Process transactions for this address
        for (const tx of addressStatus.transactions) {
          const amount = parseFloat(tx.value || tx.amount || '0');
          const confirmations = tx.confirmations || 0;
          
          if (amount > 0) {
            // Check if transaction already exists
            const { data: existingTx } = await supabaseService
              .from('crypto_transactions')
              .select('id')
              .eq('crypto_address_id', addressData.id)
              .eq('tx_hash', tx.hash || tx.txid)
              .single();

            if (!existingTx) {
              // Insert new transaction
              const { error: txError } = await supabaseService
                .from('crypto_transactions')
                .insert({
                  crypto_address_id: addressData.id,
                  tx_hash: tx.hash || tx.txid,
                  amount: amount,
                  confirmations: confirmations,
                  block_height: tx.block_height || tx.blockNumber,
                  detected_at: new Date().toISOString(),
                  confirmed_at: confirmations >= addressData.orders.crypto_confirmations_required 
                    ? new Date().toISOString() 
                    : null
                });

              if (txError) {
                console.error('Failed to insert transaction:', txError);
              } else {
                results.push({
                  address: addressData.address,
                  coin: addressData.coin_symbol,
                  orderId: addressData.orders.id,
                  transaction: tx.hash || tx.txid,
                  amount: amount,
                  confirmations: confirmations,
                  status: 'detected'
                });
              }
            } else {
              // Update existing transaction confirmations
              const { error: updateError } = await supabaseService
                .from('crypto_transactions')
                .update({
                  confirmations: confirmations,
                  confirmed_at: confirmations >= addressData.orders.crypto_confirmations_required 
                    ? new Date().toISOString() 
                    : null
                })
                .eq('id', existingTx.id);

              if (updateError) {
                console.error('Failed to update transaction:', updateError);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error monitoring address ${addressData.address}:`, error);
      }
    }

    // Clean up expired addresses
    await supabaseService.rpc('handle_expired_crypto_payments');

    return new Response(
      JSON.stringify({ 
        message: 'Monitoring complete',
        processedAddresses: pendingAddresses.length,
        detectedTransactions: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})