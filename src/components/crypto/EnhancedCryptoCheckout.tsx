import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import QRCode from "react-qr-code";
import { 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Coins,
  Timer,
  Link as LinkIcon,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCryptoCheckoutProps {
  orderId: string;
  onPaymentComplete?: () => void;
}

interface EnhancedPaymentStatus {
  orderId: string;
  paymentStatus: string;
  statusMessage: string;
  isInTopUpWindow: boolean;
  totalAmountUSD: number;
  totalReceived: number;
  totalConfirmedReceived: number;
  expectedAmount: number;
  underpaidAmount: number;
  overpaidAmount: number;
  confirmationsRequired: number;
  addresses: Array<{
    id: string;
    coin: string;
    address: string;
    derivationPath: string;
    derivationIndex: number;
    addressType: string;
    expectedAmount: number;
    estimatedNetworkFee: number;
    recommendedTotal: number;
    qrData: string;
    expiresAt: string;
    topUpWindowExpiresAt: string;
  }>;
  transactions: Array<{
    id: string;
    tx_hash: string;
    amount: number;
    confirmations: number;
    status: string;
    confirmationProgress: string;
    explorerUrl: string;
    detected_at: string;
    coin: string;
    address: string;
  }>;
  timeRemaining: {
    hours: number;
    minutes: number;
    expired: boolean;
    isTopUpWindow: boolean;
  };
  minecraftUsername: string;
  orderStatus: string;
  priceInfo?: {
    coinSymbol: string;
    usdPrice: number;
    priceSource: string;
    snapshotTime: string;
  };
  availableActions: {
    canTopUp: boolean;
    canRequestRefund: boolean;
    needsUserAction: boolean;
  };
  meta: {
    lastChecked: string;
    dataSource: string;
    version: string;
  };
}

export const EnhancedCryptoCheckout: React.FC<EnhancedCryptoCheckoutProps> = ({
  orderId,
  onPaymentComplete,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<EnhancedPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPaymentStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('crypto-status-enhanced', {
        body: { orderId }
      });

      if (error) {
        console.error('Status check error:', error);
        throw error;
      }

      setPaymentStatus(data);
      
      // Check if payment is complete
      if (data.paymentStatus === 'paid' && onPaymentComplete) {
        onPaymentComplete();
      }
    } catch (error: any) {
      console.error('Failed to fetch payment status:', error);
      toast({
        title: "Connection Error",
        description: "Failed to fetch payment status. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, onPaymentComplete, toast]);

  useEffect(() => {
    fetchPaymentStatus();
    
    // Set up polling for updates every 30 seconds
    const interval = setInterval(fetchPaymentStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchPaymentStatus]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      pending: 'default',
      partial: 'secondary',
      pending_confirmations: 'secondary',
      paid: 'default',
      overpaid: 'secondary',
      expired: 'destructive'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="w-4 h-4" />,
      partial: <Timer className="w-4 h-4" />,
      pending_confirmations: <RefreshCw className="w-4 h-4 animate-spin" />,
      paid: <CheckCircle className="w-4 h-4" />,
      overpaid: <AlertTriangle className="w-4 h-4" />,
      expired: <AlertTriangle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load payment information. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  const address = paymentStatus.addresses[0];
  const progressPercentage = (paymentStatus.totalConfirmedReceived / paymentStatus.expectedAmount) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Status Header */}
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(paymentStatus.paymentStatus)}
              Enhanced Crypto Payment Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(paymentStatus.paymentStatus)} className="text-xs">
                {paymentStatus.statusMessage}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPaymentStatus()}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${paymentStatus.totalAmountUSD.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Order Total (USD)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {paymentStatus.totalConfirmedReceived.toFixed(8)}
              </div>
              <div className="text-sm text-muted-foreground">
                Confirmed {address?.coin || 'Crypto'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {paymentStatus.timeRemaining.hours}h {paymentStatus.timeRemaining.minutes}m
              </div>
              <div className="text-sm text-muted-foreground">
                {paymentStatus.timeRemaining.isTopUpWindow ? 'Top-up Window' : 'Time Remaining'}
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span>{Math.min(100, progressPercentage).toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(100, progressPercentage)} className="h-3" />
          </div>

          {/* Underpayment/Overpayment Alerts */}
          {paymentStatus.underpaidAmount > 0 && (
            <Alert className="mt-4">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                <strong>Underpayment:</strong> You need to send an additional{' '}
                <span className="font-mono font-bold">
                  {paymentStatus.underpaidAmount.toFixed(8)} {address?.coin}
                </span>
                {paymentStatus.isInTopUpWindow && (
                  <span className="text-green-600 font-medium">
                    {' '}(Top-up window active - same address can be used)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus.overpaidAmount > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Overpayment:</strong> You sent{' '}
                <span className="font-mono font-bold">
                  {paymentStatus.overpaidAmount.toFixed(8)} {address?.coin}
                </span>{' '}
                more than required. Contact support for refund processing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {address && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Payment Instructions */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cryptocurrency Info */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Cryptocurrency</span>
                  <Badge variant="outline">{address.coin}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Network: Mainnet</div>
                  <div>Address Type: {address.addressType}</div>
                  <div>Derivation: {address.derivationPath}</div>
                  <div>Index: {address.derivationIndex}</div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCode value={address.qrData} size={200} />
              </div>

              {/* Payment Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Address</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-muted rounded text-xs break-all font-mono">
                    {address.address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(address.address, "Payment address")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Required Amount:</span>
                  <span className="font-mono font-bold">
                    {address.expectedAmount.toFixed(8)} {address.coin}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Est. Network Fee:</span>
                  <span className="font-mono">
                    {address.estimatedNetworkFee.toFixed(8)} {address.coin}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Recommended Total:</span>
                  <span className="font-mono text-primary">
                    {address.recommendedTotal.toFixed(8)} {address.coin}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(
                    address.recommendedTotal.toFixed(8), 
                    "Recommended amount"
                  )}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Recommended Amount
                </Button>
              </div>

              {/* Important Warning */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> Network fees are your responsibility. Send at least the required amount. 
                  The recommended total includes estimated network fees for faster confirmation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Transaction History & Details */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentStatus.transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p>No transactions detected yet</p>
                  <p className="text-xs">Transactions are checked every 30 seconds</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentStatus.transactions.map((tx, index) => (
                    <div key={tx.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tx.status === 'confirmed' ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            }
                            {tx.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tx.confirmationProgress}
                          </span>
                        </div>
                        <div className="text-sm font-mono font-bold">
                          {tx.amount.toFixed(8)} {tx.coin}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Transaction ID:</span>
                          <div className="flex items-center gap-1">
                            <code className="font-mono">
                              {tx.tx_hash.substring(0, 10)}...{tx.tx_hash.substring(-6)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => window.open(tx.explorerUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          Detected: {new Date(tx.detected_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Information */}
              {paymentStatus.priceInfo && (
                <div className="mt-6 p-3 bg-muted/20 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Price Information</div>
                    <div className="text-muted-foreground space-y-1">
                      <div>
                        {paymentStatus.priceInfo.coinSymbol}: ${paymentStatus.priceInfo.usdPrice.toFixed(2)}
                      </div>
                      <div className="text-xs">
                        Source: {paymentStatus.priceInfo.priceSource} • 
                        Snapshot: {new Date(paymentStatus.priceInfo.snapshotTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Information */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Order ID</div>
              <code className="text-xs">{paymentStatus.orderId.slice(0, 8)}</code>
            </div>
            <div>
              <div className="font-medium">Player</div>
              <div>{paymentStatus.minecraftUsername}</div>
            </div>
            <div>
              <div className="font-medium">Order Status</div>
              <Badge variant="outline">{paymentStatus.orderStatus}</Badge>
            </div>
            <div>
              <div className="font-medium">Last Updated</div>
              <div className="text-xs">{new Date(paymentStatus.meta.lastChecked).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};