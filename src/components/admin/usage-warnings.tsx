'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Smartphone, HardDrive } from 'lucide-react';
import { getUsageStats } from '@/lib/actions/usageActions';
import type { UsageStats } from '@/lib/services/usage-service';

interface UsageWarningsProps {
  schoolId?: string;
}

export function UsageWarnings({ schoolId }: UsageWarningsProps) {
  const [warnings, setWarnings] = useState<Array<{
    type: 'whatsapp' | 'sms' | 'storage';
    message: string;
    severity: 'warning' | 'error';
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUsage() {
      try {
        const response = await getUsageStats(schoolId);

        if (!response.success || !response.data) {
          console.error("Failed to fetch limits:", response.error);
          return;
        }

        const stats = response.data as UsageStats;

        const newWarnings: Array<{
          type: 'whatsapp' | 'sms' | 'storage';
          message: string;
          severity: 'warning' | 'error';
        }> = [];

        // Check WhatsApp usage
        const whatsappUsagePercent = (stats.whatsappUsed / stats.whatsappLimit) * 100;
        if (whatsappUsagePercent >= 90) {
          newWarnings.push({
            type: 'whatsapp',
            message: `WhatsApp usage at ${whatsappUsagePercent.toFixed(0)}% (${stats.whatsappRemaining} messages remaining)`,
            severity: whatsappUsagePercent >= 95 ? 'error' : 'warning',
          });
        }

        // Check SMS usage
        const smsUsagePercent = (stats.smsUsed / stats.smsLimit) * 100;
        if (smsUsagePercent >= 90) {
          newWarnings.push({
            type: 'sms',
            message: `SMS usage at ${smsUsagePercent.toFixed(0)}% (${stats.smsRemaining} messages remaining)`,
            severity: smsUsagePercent >= 95 ? 'error' : 'warning',
          });
        }

        // Check storage usage
        const storageUsagePercent = ((stats.storageLimitMB - stats.storageRemainingMB) / stats.storageLimitMB) * 100;
        if (storageUsagePercent >= 90) {
          newWarnings.push({
            type: 'storage',
            message: `Storage usage at ${storageUsagePercent.toFixed(0)}% (${stats.storageRemainingMB.toFixed(2)} MB remaining)`,
            severity: storageUsagePercent >= 95 ? 'error' : 'warning',
          });
        }

        setWarnings(newWarnings);
      } catch (error) {
        console.error('Failed to check usage:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkUsage();
  }, [schoolId]);

  if (isLoading || warnings.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <Alert key={index} variant={warning.severity === 'error' ? 'destructive' : 'default'}>
          {getIcon(warning.type)}
          <AlertTitle>Usage Limit Warning</AlertTitle>
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}