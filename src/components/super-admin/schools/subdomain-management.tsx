"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface SubdomainManagementProps {
  schoolId: string;
  schoolName: string;
  subdomain: string | null;
  subdomainStatus?: string;
  dnsConfigured?: boolean;
  sslConfigured?: boolean;
  sslExpiresAt?: string;
}

export function SubdomainManagement({
  schoolId,
  schoolName,
  subdomain,
  subdomainStatus = "PENDING",
  dnsConfigured = false,
  sslConfigured = false,
  sslExpiresAt,
}: SubdomainManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({
    subdomain: subdomainStatus,
    dns: dnsConfigured,
    ssl: sslConfigured,
    sslExpiry: sslExpiresAt,
  });

  const handleSubdomainAction = async (action: string) => {
    if (!subdomain) {
      toast.error("No subdomain configured for this school");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/subdomain/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          schoolId,
          subdomain,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to manage subdomain");
      }

      // Update local status based on action
      if (action === "create") {
        setStatus(prev => ({ ...prev, subdomain: "DNS_CONFIGURED" }));
        toast.success("Subdomain infrastructure creation initiated");
      } else if (action === "verify") {
        setStatus(prev => ({
          ...prev,
          dns: result.dns?.verified || false,
          ssl: result.ssl?.valid || false,
        }));
        toast.success("Subdomain verification completed");
      } else if (action === "renew-ssl") {
        setStatus(prev => ({
          ...prev,
          ssl: result.ssl?.renewed || false,
          sslExpiry: result.ssl?.expiresAt,
        }));
        toast.success("SSL certificate renewal completed");
      } else if (action === "delete") {
        setStatus(prev => ({ ...prev, subdomain: "PENDING", dns: false, ssl: false }));
        toast.success("Subdomain infrastructure deleted");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to manage subdomain");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "DNS_CONFIGURED":
        return <Badge className="bg-blue-100 text-blue-800">DNS Configured</Badge>;
      case "SSL_CONFIGURED":
        return <Badge className="bg-teal-100 text-teal-800">SSL Configured</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getSSLExpiryStatus = () => {
    if (!status.sslExpiry) return null;
    
    const expiryDate = new Date(status.sslExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (daysUntilExpiry < 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expires Soon</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    }
  };

  if (!subdomain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Globe className="h-5 w-5 mr-2" />
            Subdomain Management
          </CardTitle>
          <CardDescription>
            No subdomain configured for this school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Configure a subdomain in the school settings to enable subdomain management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Globe className="h-5 w-5 mr-2" />
          Subdomain Management
        </CardTitle>
        <CardDescription>
          Manage DNS and SSL configuration for {subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subdomain Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Subdomain Status</span>
            </div>
            {getStatusBadge(status.subdomain)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DNS Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">DNS Configuration</span>
              </div>
              {status.dns ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* SSL Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">SSL Certificate</span>
              </div>
              {status.ssl ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          {/* SSL Expiry */}
          {status.ssl && status.sslExpiry && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">SSL Expires: {new Date(status.sslExpiry).toLocaleDateString()}</span>
              </div>
              {getSSLExpiryStatus()}
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <h4 className="font-medium">Management Actions</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {status.subdomain === "PENDING" && (
              <Button
                onClick={() => handleSubdomainAction("create")}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Setup Infrastructure
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => handleSubdomainAction("verify")}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Status
            </Button>

            {status.ssl && (
              <Button
                variant="outline"
                onClick={() => handleSubdomainAction("renew-ssl")}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Renew SSL
              </Button>
            )}

            {status.subdomain !== "PENDING" && (
              <Button
                variant="destructive"
                onClick={() => handleSubdomainAction("delete")}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Delete Infrastructure
              </Button>
            )}
          </div>

          {/* Visit Subdomain */}
          {status.subdomain === "ACTIVE" && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                asChild
                className="w-full"
              >
                <a
                  href={`https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit {subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Infrastructure Setup</p>
              <ul className="space-y-1 text-xs">
                <li>• DNS records are created automatically</li>
                <li>• SSL certificates are provisioned via Let's Encrypt</li>
                <li>• Changes may take 5-10 minutes to propagate</li>
                <li>• SSL certificates auto-renew 30 days before expiry</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}