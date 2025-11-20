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
import { Database, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateSecuritySettings, triggerBackup } from "@/lib/actions/settingsActions";

interface SecuritySettingsFormProps {
  initialData: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    passwordRequireNumber: boolean;
    passwordRequireUppercase: boolean;
    autoBackup: boolean;
    backupFrequency: string;
  };
}

export function SecuritySettingsForm({ initialData }: SecuritySettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(initialData.twoFactorAuth);
  const [sessionTimeout, setSessionTimeout] = useState(initialData.sessionTimeout);
  const [passwordExpiry, setPasswordExpiry] = useState(initialData.passwordExpiry);
  const [passwordMinLength, setPasswordMinLength] = useState(initialData.passwordMinLength);
  const [passwordRequireSpecialChar, setPasswordRequireSpecialChar] = useState(initialData.passwordRequireSpecialChar);
  const [passwordRequireNumber, setPasswordRequireNumber] = useState(initialData.passwordRequireNumber);
  const [passwordRequireUppercase, setPasswordRequireUppercase] = useState(initialData.passwordRequireUppercase);
  const [autoBackup, setAutoBackup] = useState(initialData.autoBackup);
  const [backupFrequency, setBackupFrequency] = useState(initialData.backupFrequency);

  const handleSave = async () => {
    // Validation
    if (sessionTimeout < 5 || sessionTimeout > 1440) {
      toast.error("Session timeout must be between 5 and 1440 minutes");
      return;
    }

    if (passwordExpiry < 30 || passwordExpiry > 365) {
      toast.error("Password expiry must be between 30 and 365 days");
      return;
    }

    if (passwordMinLength < 6 || passwordMinLength > 32) {
      toast.error("Password minimum length must be between 6 and 32 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await updateSecuritySettings({
        twoFactorAuth,
        sessionTimeout,
        passwordExpiry,
        passwordMinLength,
        passwordRequireSpecialChar,
        passwordRequireNumber,
        passwordRequireUppercase,
        autoBackup,
        backupFrequency,
      });
      
      if (result.success) {
        toast.success("Security settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setBackupLoading(true);
    try {
      const result = await triggerBackup();
      
      if (result.success) {
        toast.success("Backup initiated successfully");
      } else {
        toast.error(result.error || "Failed to trigger backup");
      }
    } catch (error) {
      console.error("Error triggering backup:", error);
      toast.error("Failed to trigger backup");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Access</CardTitle>
          <CardDescription>
            Manage authentication and session security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for admin accounts
              </p>
            </div>
            <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input 
              id="sessionTimeout"
              type="number" 
              value={sessionTimeout} 
              onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
              min="5"
              max="1440"
            />
            <p className="text-sm text-muted-foreground">
              Auto logout after inactivity (5-1440 minutes)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>
            Configure password requirements and security rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
            <Input 
              id="passwordExpiry"
              type="number" 
              value={passwordExpiry} 
              onChange={(e) => setPasswordExpiry(parseInt(e.target.value) || 90)}
              min="30"
              max="365"
            />
            <p className="text-sm text-muted-foreground">
              Require password change every (30-365 days)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
            <Input 
              id="passwordMinLength"
              type="number" 
              value={passwordMinLength} 
              onChange={(e) => setPasswordMinLength(parseInt(e.target.value) || 8)}
              min="6"
              max="32"
            />
            <p className="text-sm text-muted-foreground">
              Minimum characters required (6-32)
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Require Special Character</Label>
              <Switch 
                checked={passwordRequireSpecialChar} 
                onCheckedChange={setPasswordRequireSpecialChar} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Number</Label>
              <Switch 
                checked={passwordRequireNumber} 
                onCheckedChange={setPasswordRequireNumber} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letter</Label>
              <Switch 
                checked={passwordRequireUppercase} 
                onCheckedChange={setPasswordRequireUppercase} 
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Backup</CardTitle>
          <CardDescription>
            Manage data backup and retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Enable scheduled automatic backups
              </p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
          </div>
          <div className="space-y-2">
            <Label>Backup Frequency</Label>
            <Select value={backupFrequency} onValueChange={setBackupFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackupNow} disabled={backupLoading}>
              {backupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Database className="h-4 w-4 mr-2" />
              {backupLoading ? "Processing..." : "Backup Now"}
            </Button>
            <Button variant="outline">
              View Backups
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
