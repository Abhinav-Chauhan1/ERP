"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface AuthStatus {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  } | null;
  isSuperAdmin: boolean;
  sessionExpiry?: string;
}

export function AuthStatusChecker() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      if (session?.user) {
        setAuthStatus({
          isAuthenticated: true,
          user: session.user,
          isSuperAdmin: session.user.role === 'SUPER_ADMIN',
          sessionExpiry: session.expires
        });
      } else {
        setAuthStatus({
          isAuthenticated: false,
          user: null,
          isSuperAdmin: false
        });
      }
    } catch (err) {
      setError('Failed to check authentication status');
      console.error('Auth status check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking Authentication Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Authentication Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={checkAuthStatus} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {authStatus?.isAuthenticated ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Authenticated</label>
            <div className="mt-1">
              <Badge variant={authStatus?.isAuthenticated ? "default" : "destructive"}>
                {authStatus?.isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Super Admin</label>
            <div className="mt-1">
              <Badge variant={authStatus?.isSuperAdmin ? "default" : "destructive"}>
                {authStatus?.isSuperAdmin ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>

        {authStatus?.user && (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-600">User</label>
              <p className="text-sm">{authStatus.user.name || authStatus.user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-sm">{authStatus.user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="text-sm">{authStatus.user.role}</p>
            </div>
            
            {authStatus.sessionExpiry && (
              <div>
                <label className="text-sm font-medium text-gray-600">Session Expires</label>
                <p className="text-sm">{new Date(authStatus.sessionExpiry).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {!authStatus?.isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Not Authenticated</p>
                <p>You need to log in to access super admin features.</p>
                <a href="/sd" className="text-yellow-900 underline hover:no-underline">
                  Go to Super Admin Login
                </a>
              </div>
            </div>
          </div>
        )}

        {authStatus?.isAuthenticated && !authStatus?.isSuperAdmin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Insufficient Permissions</p>
                <p>You need super admin privileges to manage schools.</p>
              </div>
            </div>
          </div>
        )}

        <Button onClick={checkAuthStatus} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}