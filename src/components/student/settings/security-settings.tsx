'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { TwoFactorSettings } from '@/components/shared/settings/two-factor-settings';

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <TwoFactorSettings />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl">Account Security</CardTitle>
          <CardDescription>
            Manage your password and active sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password */}
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Change your password to keep your account secure
                </p>
              </div>
            </div>
            <Link href="/student/profile/change-password">
              <Button variant="outline" size="sm" className="min-h-[40px]">
                Change Password
              </Button>
            </Link>
          </div>

          {/* Active Sessions */}
          <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage devices where you're currently logged in
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Managed through your Clerk account settings
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8'
                  }
                }}
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-900">
                Security Best Practices
              </h3>
              <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication</li>
                <li>Don't share your account credentials</li>
                <li>Log out from shared devices</li>
                <li>Review active sessions regularly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
