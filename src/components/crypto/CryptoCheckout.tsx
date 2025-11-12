import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface CryptoCheckoutProps {
  orderId: string;
  onPaymentComplete?: () => void;
}

interface PaymentStatus {
  orderId: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'expired';
  totalAmountUSD: number;
  totalReceived: number;
  totalConfirmedReceived: number;
  confirmationsRequired: number;
  addresses: Array<{
    coin: string;
    address: string;
    expectedAmount: number;
    qrData: string;
  }>;
  transactions: Array<{
    id: string;
    tx_hash: string;
    amount: number;
    confirmations: number;
    coin: string;
    detected_at: string;
  }>;
  timeRemaining: {
    hours: number;
    minutes: number;
    expired: boolean;
  };
  minecraftUsername: string;
}

const supportedCoins = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł' },
  { symbol: 'USDT', name: 'Tether USD', icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💲' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' }
];

export const CryptoCheckout: React.FC<CryptoCheckoutProps> = ({ orderId, onPaymentComplete }) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPaymentStatus = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('crypto-status-enhanced', {
        body: { orderId }
      });

      if (error) throw error;

      setPaymentStatus(data);

      // Generate QR code for the selected coin
      const currentAddress = data.addresses.find((addr: any) => addr.coin === selectedCoin);
      if (currentAddress) {
        const qrUrl = await QRCode.toDataURL(currentAddress.qrData);
        setQrCodeUrl(qrUrl);
      }

      // Check if payment is complete
      if (data.paymentStatus === 'paid' && onPaymentComplete) {
        onPaymentComplete();
      }

    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();
    
    // Set up polling for status updates
    const interval = setInterval(fetchPaymentStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [orderId, selectedCoin]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading payment details...</span>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Not Found</h3>
        <p className="text-muted-foreground">Unable to load payment details.</p>
      </div>
    );
  }

  const currentAddress = paymentStatus.addresses.find(addr => addr.coin === selectedCoin);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Header */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(paymentStatus.paymentStatus)}
              <span>Payment Status</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPaymentStatus}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge className={`${getStatusColor(paymentStatus.paymentStatus)} text-white`}>
                {paymentStatus.paymentStatus.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Status</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                ${paymentStatus.totalConfirmedReceived.toFixed(2)} / ${paymentStatus.totalAmountUSD.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Confirmed / Required</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {paymentStatus.timeRemaining.expired ? 'Expired' : 
                 `${paymentStatus.timeRemaining.hours}h ${paymentStatus.timeRemaining.minutes}m`}
              </p>
              <p className="text-sm text-muted-foreground">Time Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {paymentStatus.paymentStatus !== 'paid' && paymentStatus.paymentStatus !== 'expired' && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Send Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coin Selection */}
            <div className="space-y-2">
              <Label>Select Cryptocurrency</Label>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCoins.map(coin => (
                    <SelectItem key={coin.symbol} value={coin.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{coin.icon}</span>
                        <span>{coin.name} ({coin.symbol})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentAddress && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan QR code with your crypto wallet
                  </p>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <div>
                    <Label>Amount to Send</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        value={`${currentAddress.expectedAmount.toFixed(8)} ${selectedCoin}`}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentAddress.expectedAmount.toFixed(8), 'Amount')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Wallet Address</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        value={currentAddress.address}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentAddress.address, 'Address')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">⚠️ Important Notes</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Send the EXACT amount shown above</li>
                      <li>• Transaction fees are YOUR responsibility</li>
                      <li>• Only send {selectedCoin} to this address</li>
                      <li>• Payment expires in {paymentStatus.timeRemaining.hours}h {paymentStatus.timeRemaining.minutes}m</li>
                      <li>• Requires {paymentStatus.confirmationsRequired} network confirmations</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {paymentStatus.transactions.length > 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentStatus.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {supportedCoins.find(c => c.symbol === tx.coin)?.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.amount.toFixed(8)} {tx.coin}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {tx.tx_hash.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={tx.confirmations >= paymentStatus.confirmationsRequired ? "default" : "secondary"}
                    >
                      {tx.confirmations}/{paymentStatus.confirmationsRequired} confirmations
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(tx.detected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {paymentStatus.paymentStatus === 'paid' && (
        <Card className="card-modern bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-800 mb-2">Payment Confirmed!</h3>
              <p className="text-green-700 mb-4">
                Your payment has been confirmed and your order is being processed.
              </p>
              <p className="text-sm text-green-600">
                Items will be delivered to: <span className="font-semibold">{paymentStatus.minecraftUsername}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Message */}
      {paymentStatus.paymentStatus === 'expired' && (
        <Card className="card-modern bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-800 mb-2">Payment Expired</h3>
              <p className="text-red-700 mb-4">
                This payment window has expired. Please create a new order to continue.
              </p>
              <Button variant="destructive" onClick={() => window.location.href = '/'}>
                Return to Shop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};