import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Production-ready blockchain monitoring with multiple RPC providers and failover
class BlockchainMonitorEnhanced {
  // Multi-provider RPC endpoints with failover
  static rpcProviders = {
    BTC: [
      'https://blockstream.info/api',
      'https://mempool.space/api',
      'https://api.blockcypher.com/v1/btc/main'
    ],
    LTC: [
      'https://api.blockcypher.com/v1/ltc/main',
      'https://insight.litecore.io/api'
    ],
    ETH: [
      'https://api.etherscan.io/api',
      'https://api.polygonscan.com/api', // Alternative for ETH monitoring
    ],
    SOL: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com'
    ]
  };

  // Enhanced Bitcoin/Litecoin monitoring with multiple providers
  static async checkBTCAddress(address: string, coin: 'BTC' | 'LTC' = 'BTC'): Promise<{ balance: number; transactions: any[] }> {
    const providers = this.rpcProviders[coin];
    
    for (const provider of providers) {
      try {
        console.log(`Checking ${coin} address ${address} via ${provider}`);
        
        let response;
        if (provider.includes('blockcypher')) {
          const apiKey = Deno.env.get('BLOCKCYPHER_API_KEY') || '';
          const apiParam = apiKey ? `?token=${apiKey}` : '';
          response = await fetch(`${provider}/addrs/${address}${apiParam}`, {
            signal: AbortSignal.timeout(10000)
          });
        } else if (provider.includes('blockstream') || provider.includes('mempool')) {
          response = await fetch(`${provider}/address/${address}`, {
            signal: AbortSignal.timeout(10000)
          });
        } else if (provider.includes('insight')) {
          response = await fetch(`${provider}/addr/${address}`, {
            signal: AbortSignal.timeout(10000)
          });
        } else {
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Normalize response format across different providers
        let balance = 0;
        let transactions: any[] = [];
        
        if (provider.includes('blockcypher')) {
          balance = (data.balance || 0) / 100000000; // Convert satoshis to coins
          transactions = data.txs || [];
        } else if (provider.includes('blockstream') || provider.includes('mempool')) {
          balance = (data.chain_stats?.funded_txo_sum || 0) / 100000000;
          
          // Get transactions separately for blockstream/mempool
          try {
            const txResponse = await fetch(`${provider}/address/${address}/txs`, {
              signal: AbortSignal.timeout(10000)
            });
            if (txResponse.ok) {
              transactions = await txResponse.json();
            }
          } catch (txError) {
            console.warn(`Failed to fetch transactions for ${address}:`, txError);
          }
        } else if (provider.includes('insight')) {
          balance = data.balance || 0;
          transactions = data.transactions || [];
        }

        console.log(`Successfully monitored ${coin} address via ${provider}: ${balance} coins, ${transactions.length} transactions`);
        
        return {
          balance,
          transactions: transactions.map((tx: any) => ({
            txid: tx.txid || tx.hash,
            hash: tx.hash || tx.txid,
            confirmations: tx.confirmations || 0,
            blockHeight: tx.block_height || tx.blockHeight || tx.block,
            value: this.extractReceivedAmount(tx, address, coin),
            timestamp: tx.time || tx.received || new Date().toISOString()
          }))
        };
        
      } catch (error) {
        console.error(`${coin} monitoring error with ${provider}:`, error);
      }
    }
    
    console.warn(`All ${coin} providers failed for address ${address}`);
    return { balance: 0, transactions: [] };
  }

  // Enhanced Ethereum monitoring with token support
  static async checkETHAddress(address: string, contractAddress?: string): Promise<{ balance: number; transactions: any[] }> {
    const providers = this.rpcProviders.ETH;
    
    for (const provider of providers) {
      try {
        const apiKey = Deno.env.get('ETHERSCAN_API_KEY') || 'YourApiKeyToken';
        
        let balanceUrl: string;
        let txUrl: string;
        
        if (contractAddress) {
          // ERC-20 token balance and transactions
          balanceUrl = `${provider}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
          txUrl = `${provider}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        } else {
          // ETH balance and transactions
          balanceUrl = `${provider}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
          txUrl = `${provider}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        }
        
        const [balanceResponse, txResponse] = await Promise.all([
          fetch(balanceUrl, { signal: AbortSignal.timeout(10000) }),
          fetch(txUrl, { signal: AbortSignal.timeout(10000) })
        ]);
        
        if (!balanceResponse.ok || !txResponse.ok) {
          throw new Error(`HTTP error: ${balanceResponse.status}/${txResponse.status}`);
        }
        
        const [balanceData, txData] = await Promise.all([
          balanceResponse.json(),
          txResponse.json()
        ]);
        
        const decimals = contractAddress ? (contractAddress.includes('USDT') ? 6 : 6) : 18;
        const balance = parseInt(balanceData.result || '0') / Math.pow(10, decimals);
        
        const transactions = (txData.result || []).map((tx: any) => ({
          txid: tx.hash,
          hash: tx.hash,
          confirmations: tx.confirmations ? parseInt(tx.confirmations) : 0,
          blockHeight: parseInt(tx.blockNumber || '0'),
          value: contractAddress ? 
            (parseInt(tx.value || '0') / Math.pow(10, decimals)) :
            (parseInt(tx.value || '0') / Math.pow(10, 18)),
          timestamp: new Date(parseInt(tx.timeStamp || '0') * 1000).toISOString(),
          to: tx.to,
          from: tx.from,
          isError: tx.isError === '1'
        })).filter((tx: any) => 
          tx.to.toLowerCase() === address.toLowerCase() && !tx.isError && tx.value > 0
        );

        console.log(`Successfully monitored ETH${contractAddress ? ' token' : ''} address via ${provider}: ${balance} tokens, ${transactions.length} transactions`);
        
        return { balance, transactions };
        
      } catch (error) {
        console.error(`ETH monitoring error with ${provider}:`, error);
      }
    }
    
    console.warn(`All ETH providers failed for address ${address}`);
    return { balance: 0, transactions: [] };
  }

  // Enhanced Solana monitoring
  static async checkSOLAddress(address: string): Promise<{ balance: number; transactions: any[] }> {
    const providers = this.rpcProviders.SOL;
    
    for (const provider of providers) {
      try {
        const [balanceResponse, signaturesResponse] = await Promise.all([
          fetch(provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [address, { commitment: 'confirmed' }]
            }),
            signal: AbortSignal.timeout(10000)
          }),
          fetch(provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'getSignaturesForAddress',
              params: [address, { limit: 100, commitment: 'confirmed' }]
            }),
            signal: AbortSignal.timeout(10000)
          })
        ]);
        
        if (!balanceResponse.ok || !signaturesResponse.ok) {
          throw new Error(`HTTP error: ${balanceResponse.status}/${signaturesResponse.ok}`);
        }
        
        const [balanceData, signaturesData] = await Promise.all([
          balanceResponse.json(),
          signaturesResponse.json()
        ]);
        
        const balance = (balanceData.result?.value || 0) / 1000000000; // Convert lamports to SOL
        const signatures = signaturesData.result || [];
        
        // Get transaction details for each signature
        const transactions = [];
        for (const sig of signatures.slice(0, 10)) { // Limit to recent 10 transactions
          try {
            const txResponse = await fetch(provider, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'getTransaction',
                params: [sig.signature, { commitment: 'confirmed', encoding: 'jsonParsed' }]
              }),
              signal: AbortSignal.timeout(5000)
            });
            
            if (txResponse.ok) {
              const txData = await txResponse.json();
              if (txData.result) {
                transactions.push({
                  txid: sig.signature,
                  hash: sig.signature,
                  confirmations: sig.confirmationStatus === 'finalized' ? 32 : 1,
                  blockHeight: sig.slot || 0,
                  value: this.extractSOLAmount(txData.result, address),
                  timestamp: new Date((sig.blockTime || 0) * 1000).toISOString()
                });
              }
            }
          } catch (txError) {
            console.warn(`Failed to get SOL transaction details for ${sig.signature}:`, txError);
          }
        }

        console.log(`Successfully monitored SOL address via ${provider}: ${balance} SOL, ${transactions.length} transactions`);
        
        return { balance, transactions };
        
      } catch (error) {
        console.error(`SOL monitoring error with ${provider}:`, error);
      }
    }
    
    console.warn(`All SOL providers failed for address ${address}`);
    return { balance: 0, transactions: [] };
  }

  // Helper function to extract received amount from transaction
  private static extractReceivedAmount(tx: any, address: string, coin: 'BTC' | 'LTC'): number {
    try {
      if (tx.outputs) {
        // Blockcypher format
        const receivedOutput = tx.outputs.find((output: any) => 
          output.addresses && output.addresses.includes(address)
        );
        return receivedOutput ? (receivedOutput.value / 100000000) : 0;
      }
      
      if (tx.vout) {
        // Bitcoin Core / Insight format
        const receivedOutput = tx.vout.find((output: any) => 
          output.scriptPubKey && 
          output.scriptPubKey.addresses && 
          output.scriptPubKey.addresses.includes(address)
        );
        return receivedOutput ? receivedOutput.value : 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error extracting received amount:', error);
      return 0;
    }
  }

  // Helper function to extract SOL amount from transaction
  private static extractSOLAmount(tx: any, address: string): number {
    try {
      const preBalances = tx.meta?.preBalances || [];
      const postBalances = tx.meta?.postBalances || [];
      const accountKeys = tx.transaction?.message?.accountKeys || [];
      
      const accountIndex = accountKeys.findIndex((key: any) => 
        (key.pubkey || key) === address
      );
      
      if (accountIndex !== -1 && accountIndex < preBalances.length && accountIndex < postBalances.length) {
        const balanceChange = postBalances[accountIndex] - preBalances[accountIndex];
        return balanceChange > 0 ? (balanceChange / 1000000000) : 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error extracting SOL amount:', error);
      return 0;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Enhanced crypto monitoring started at:', new Date().toISOString());

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get all active crypto addresses that need monitoring
    const { data: pendingAddresses, error: addressesError } = await supabaseService
      .from('crypto_addresses')
      .select(`
        *,
        orders!inner(
          id,
          user_id,
          total_amount,
          crypto_payment_status,
          crypto_confirmations_required,
          crypto_underpaid_amount,
          crypto_overpaid_amount
        )
      `)
      .or('expires_at.gt.now(),top_up_window_expires_at.gt.now()')
      .in('orders.crypto_payment_status', ['pending', 'partial']);

    if (addressesError) {
      throw new Error(`Failed to fetch addresses: ${addressesError.message}`);
    }

    if (!pendingAddresses || pendingAddresses.length === 0) {
      console.log('No pending addresses to monitor');
      // Clean up expired addresses
      await supabaseService.rpc('handle_expired_crypto_payments');
      
      return new Response(
        JSON.stringify({ 
          message: 'No pending addresses to monitor',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Monitoring ${pendingAddresses.length} addresses...`);

    const results = [];
    let processedCount = 0;
    let detectedCount = 0;

    for (const addressData of pendingAddresses) {
      try {
        processedCount++;
        console.log(`Processing ${processedCount}/${pendingAddresses.length}: ${addressData.coin_symbol} ${addressData.address}`);

        let addressStatus;
        
        switch (addressData.coin_symbol) {
          case 'BTC':
            addressStatus = await BlockchainMonitorEnhanced.checkBTCAddress(addressData.address, 'BTC');
            break;
          case 'LTC':
            addressStatus = await BlockchainMonitorEnhanced.checkBTCAddress(addressData.address, 'LTC');
            break;
          case 'ETH':
            addressStatus = await BlockchainMonitorEnhanced.checkETHAddress(addressData.address);
            break;
          case 'USDT':
            addressStatus = await BlockchainMonitorEnhanced.checkETHAddress(
              addressData.address,
              '0xdAC17F958D2ee523a2206206994597C13D831ec7'
            );
            break;
          case 'USDC':
            addressStatus = await BlockchainMonitorEnhanced.checkETHAddress(
              addressData.address,
              '0xA0b86a33E6441b4c25a2C5a6B1e5bD1BF4CeAc92'
            );
            break;
          case 'SOL':
            addressStatus = await BlockchainMonitorEnhanced.checkSOLAddress(addressData.address);
            break;
          default:
            console.warn(`Unsupported coin: ${addressData.coin_symbol}`);
            continue;
        }

        // Process new transactions
        for (const tx of addressStatus.transactions) {
          const amount = parseFloat(tx.value || '0');
          const confirmations = parseInt(tx.confirmations || '0');
          
          if (amount > 0) {
            // Check if transaction already exists (idempotency)
            const { data: existingTx } = await supabaseService
              .from('crypto_transactions')
              .select('id, confirmations')
              .eq('crypto_address_id', addressData.id)
              .eq('tx_hash', tx.txid || tx.hash)
              .maybeSingle();

            if (!existingTx) {
              // Insert new transaction
              const { error: txError } = await supabaseService
                .from('crypto_transactions')
                .insert({
                  crypto_address_id: addressData.id,
                  tx_hash: tx.txid || tx.hash,
                  amount: amount,
                  confirmations: confirmations,
                  block_height: tx.blockHeight || null,
                  detected_at: new Date().toISOString(),
                  confirmed_at: confirmations >= addressData.orders.crypto_confirmations_required 
                    ? new Date().toISOString() 
                    : null
                });

              if (txError) {
                console.error('Failed to insert transaction:', txError);
              } else {
                detectedCount++;
                console.log(`✅ New transaction detected: ${tx.txid} - ${amount} ${addressData.coin_symbol}`);
                
                results.push({
                  address: addressData.address,
                  coin: addressData.coin_symbol,
                  orderId: addressData.orders.id,
                  transaction: tx.txid || tx.hash,
                  amount: amount,
                  confirmations: confirmations,
                  status: 'newly_detected',
                  blockHeight: tx.blockHeight
                });

                // Log audit event for payment detection
                await supabaseService.rpc('log_crypto_audit_event', {
                  p_event_type: 'payment_detected',
                  p_order_id: addressData.orders.id,
                  p_crypto_address_id: addressData.id,
                  p_event_data: {
                    tx_hash: tx.txid || tx.hash,
                    amount: amount,
                    confirmations: confirmations,
                    block_height: tx.blockHeight,
                    coin_symbol: addressData.coin_symbol
                  },
                  p_raw_payload: tx
                });
              }
            } else if (existingTx.confirmations !== confirmations) {
              // Update confirmations if changed
              const { error: updateError } = await supabaseService
                .from('crypto_transactions')
                .update({
                  confirmations: confirmations,
                  confirmed_at: confirmations >= addressData.orders.crypto_confirmations_required 
                    ? new Date().toISOString() 
                    : null
                })
                .eq('id', existingTx.id);

              if (!updateError) {
                console.log(`📝 Updated confirmations for ${tx.txid}: ${confirmations}`);
                
                results.push({
                  address: addressData.address,
                  coin: addressData.coin_symbol,
                  orderId: addressData.orders.id,
                  transaction: tx.txid || tx.hash,
                  amount: amount,
                  confirmations: confirmations,
                  status: 'confirmations_updated',
                  blockHeight: tx.blockHeight
                });
              }
            }
          }
        }
        
        // Brief delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error monitoring address ${addressData.address}:`, error);
      }
    }

    // Clean up expired addresses and handle underpayments/overpayments
    await supabaseService.rpc('handle_expired_crypto_payments');

    const summary = {
      message: 'Enhanced monitoring complete',
      timestamp: new Date().toISOString(),
      statistics: {
        totalAddressesMonitored: pendingAddresses.length,
        addressesProcessed: processedCount,
        newTransactionsDetected: detectedCount,
        totalResults: results.length
      },
      results: results
    };

    console.log('Monitoring summary:', summary.statistics);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhanced monitoring error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})