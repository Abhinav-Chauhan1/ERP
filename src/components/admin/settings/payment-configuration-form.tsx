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
import { Loader2, CreditCard, Receipt, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { updatePaymentConfig, type PaymentConfigType } from "@/lib/actions/paymentConfigActions";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
                    <SelectItem value="RAZORPAY">Razorpay</SelectItem>
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
