"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Receipt, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { updatePaymentConfig, saveCashfreeCredentials, testCashfreeConnection, type PaymentConfigType } from "@/lib/actions/paymentConfigActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PaymentConfigurationFormProps {
  initialData: PaymentConfigType;
}

export function PaymentConfigurationForm({ initialData }: PaymentConfigurationFormProps) {
  const [loading, setLoading] = useState(false);
  const [enableOnlinePayment, setEnableOnlinePayment] = useState(initialData.enableOnlinePayment);
  const [enableOfflineVerification, setEnableOfflineVerification] = useState(initialData.enableOfflineVerification);
  const [onlinePaymentGateway, setOnlinePaymentGateway] = useState(initialData.onlinePaymentGateway || "");
  const [maxReceiptSizeMB, setMaxReceiptSizeMB] = useState(initialData.maxReceiptSizeMB);
  const [allowedReceiptFormats, setAllowedReceiptFormats] = useState(initialData.allowedReceiptFormats);
  const [autoNotifyOnVerification, setAutoNotifyOnVerification] = useState(initialData.autoNotifyOnVerification);

  // Cashfree credentials state
  const [cfAppId, setCfAppId] = useState("");
  const [cfSecret, setCfSecret] = useState("");
  const [showCfSecret, setShowCfSecret] = useState(false);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfTestLoading, setCfTestLoading] = useState(false);

  // Parse allowed formats for display
  const formatsList = allowedReceiptFormats.split(',').map(f => f.trim());

  const handleFormatToggle = (format: string) => {
    const formats = allowedReceiptFormats.split(',').map(f => f.trim().toLowerCase());
    const formatLower = format.toLowerCase();
    
    if (formats.includes(formatLower)) {
      // Remove format
      const newFormats = formats.filter(f => f !== formatLower);
      if (newFormats.length === 0) {
        toast.error("At least one format must be allowed");
        return;
      }
      setAllowedReceiptFormats(newFormats.join(','));
    } else {
      // Add format
      formats.push(formatLower);
      setAllowedReceiptFormats(formats.join(','));
    }
  };

  const isFormatSelected = (format: string) => {
    const formats = allowedReceiptFormats.split(',').map(f => f.trim().toLowerCase());
    return formats.includes(format.toLowerCase());
  };

  const handleTestConnection = async () => {
    if (!cfAppId.trim() || !cfSecret.trim()) {
      toast.error("Enter App ID and Secret Key to test");
      return;
    }
    setCfTestLoading(true);
    try {
      const result = await testCashfreeConnection(cfAppId, cfSecret);
      if (result.success) {
        toast.success("Connection successful! Credentials are valid.");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } finally {
      setCfTestLoading(false);
    }
  };

  const handleSaveCashfreeCredentials = async () => {
    if (!cfAppId.trim() || !cfSecret.trim()) {
      toast.error("App ID and Secret Key are required");
      return;
    }
    setCfLoading(true);
    try {
      const result = await saveCashfreeCredentials(cfAppId, cfSecret, cfSecret);
      if (result.success) {
        toast.success("Cashfree credentials saved successfully");
        setCfAppId("");
        setCfSecret("");
      } else {
        toast.error(result.error || "Failed to save credentials");
      }
    } catch {
      toast.error("Failed to save credentials");
    } finally {
      setCfLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation: at least one payment method must be enabled
    if (!enableOnlinePayment && !enableOfflineVerification) {
      toast.error("At least one payment method must be enabled");
      return;
    }

    // Validation: max receipt size
    if (maxReceiptSizeMB <= 0) {
      toast.error("Maximum receipt size must be greater than 0 MB");
      return;
    }

    if (maxReceiptSizeMB > 50) {
      toast.error("Maximum receipt size cannot exceed 50 MB");
      return;
    }

    // Validation: online payment gateway required if online payment is enabled
    if (enableOnlinePayment && !onlinePaymentGateway) {
      toast.error("Please select a payment gateway for online payments");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePaymentConfig({
        enableOnlinePayment,
        enableOfflineVerification,
        onlinePaymentGateway: enableOnlinePayment ? onlinePaymentGateway : null,
        maxReceiptSizeMB,
        allowedReceiptFormats,
        autoNotifyOnVerification,
      });
      
      if (result.success) {
        toast.success("Payment configuration saved successfully");
      } else {
        toast.error(result.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving payment configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Configure which payment methods are available to students and parents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning if both are disabled */}
          {!enableOnlinePayment && !enableOfflineVerification && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                At least one payment method must be enabled. Students and parents will not be able to make payments.
              </AlertDescription>
            </Alert>
          )}

          {/* Online Payment Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label>Enable Online Payment</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow students and parents to pay fees online through a payment gateway
                </p>
              </div>
              <Switch 
                checked={enableOnlinePayment} 
                onCheckedChange={setEnableOnlinePayment}
              />
            </div>

            {/* Payment Gateway Selection (shown when online payment is enabled) */}
            {enableOnlinePayment && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="paymentGateway">Payment Gateway</Label>
                <Select value={onlinePaymentGateway} onValueChange={setOnlinePaymentGateway}>
                  <SelectTrigger id="paymentGateway">
                    <SelectValue placeholder="Select a payment gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHFREE">Cashfree</SelectItem>
                    <SelectItem value="STRIPE">Stripe</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="PAYTM">Paytm</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the payment gateway to process online payments
                </p>
              </div>
            )}

            {/* Cashfree credentials (shown when Cashfree is selected) */}
            {enableOnlinePayment && onlinePaymentGateway === "CASHFREE" && (
              <div className="ml-6 rounded-lg border p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Cashfree API Credentials</p>
                    <p className="text-xs text-muted-foreground">
                      Your school&apos;s Cashfree account — fee payments go directly to your bank
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {initialData.cashfreeSecretSet && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Configured
                      </Badge>
                    )}
                    {!initialData.cashfreeSecretSet && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Not set
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cfAppId">App ID</Label>
                    <Input
                      id="cfAppId"
                      placeholder={initialData.cashfreeAppId || "CF App ID from Cashfree dashboard"}
                      value={cfAppId}
                      onChange={(e) => setCfAppId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cfSecret">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="cfSecret"
                        type={showCfSecret ? "text" : "password"}
                        placeholder={initialData.cashfreeSecretSet ? "••••••••••••••••" : "Secret Key from Cashfree dashboard"}
                        value={cfSecret}
                        onChange={(e) => setCfSecret(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCfSecret(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCfSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                </div>
                <p className="text-xs text-muted-foreground">
                  Cashfree uses the same Secret Key for both API calls and webhook signatures — no separate webhook secret needed.
                </p>

                <Alert className="py-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    Register this webhook URL in your Cashfree dashboard under Developers → Webhooks:
                    <br />
                    <code className="font-mono text-xs bg-muted px-1 rounded break-all">
                      {typeof window !== "undefined" ? window.location.origin : ""}/api/payments/webhook
                    </code>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={cfTestLoading || !cfAppId.trim() || !cfSecret.trim()}
                  >
                    {cfTestLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Test Connection
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveCashfreeCredentials}
                    disabled={cfLoading || !cfAppId.trim() || !cfSecret.trim()}
                  >
                    {cfLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Save Credentials
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Verification Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <Label>Enable Offline Receipt Verification</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow students and parents to upload payment receipts for manual verification
              </p>
            </div>
            <Switch 
              checked={enableOfflineVerification} 
              onCheckedChange={setEnableOfflineVerification}
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload Settings Card (shown when offline verification is enabled) */}
      {enableOfflineVerification && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Upload Settings</CardTitle>
            <CardDescription>
              Configure receipt upload requirements and limitations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Max Receipt Size */}
            <div className="space-y-2">
              <Label htmlFor="maxReceiptSize">Maximum Receipt Size (MB)</Label>
              <Input 
                id="maxReceiptSize"
                type="number" 
                value={maxReceiptSizeMB} 
                onChange={(e) => setMaxReceiptSizeMB(parseInt(e.target.value) || 5)}
                min="1"
                max="50"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size for receipt uploads (1-50 MB)
              </p>
            </div>

            {/* Allowed Formats */}
            <div className="space-y-2">
              <Label>Allowed Receipt Formats</Label>
              <div className="flex flex-wrap gap-2">
                {['jpg', 'jpeg', 'png', 'pdf', 'webp'].map((format) => (
                  <Button
                    key={format}
                    type="button"
                    variant={isFormatSelected(format) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFormatToggle(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Select which file formats are allowed for receipt uploads
              </p>
            </div>

            {/* Auto Notify Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Notify on Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send notifications when receipts are verified or rejected
                </p>
              </div>
              <Switch 
                checked={autoNotifyOnVerification} 
                onCheckedChange={setAutoNotifyOnVerification}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
