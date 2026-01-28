"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Shield, 
  Lock, 
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface SchoolSecuritySettingsProps {
  schoolId: string;
}

interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    methods: string[];
  };
  sessionManagement: {
    sessionTimeout: number; // minutes
    maxConcurrentSessions: number;
    forceLogoutOnPasswordChange: boolean;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiry: number; // days, 0 = never
  };
  ipWhitelisting: {
    enabled: boolean;
    allowedIPs: string[];
    blockUnknownIPs: boolean;
  };
  auditLogging: {
    enabled: boolean;
    logLevel: string;
    retentionDays: number;
  };
  dataEncryption: {
    encryptSensitiveData: boolean;
    encryptionLevel: string;
  };
  apiSecurity: {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    requireApiKey: boolean;
  };
}

const defaultSettings: SecuritySettings = {
  twoFactorAuth: {
    enabled: false,
    required: false,
    methods: ["SMS", "EMAIL"],
  },
  sessionManagement: {
    sessionTimeout: 480, // 8 hours
    maxConcurrentSessions: 3,
    forceLogoutOnPasswordChange: true,
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiry: 90,
  },
  ipWhitelisting: {
    enabled: false,
    allowedIPs: [],
    blockUnknownIPs: false,
  },
  auditLogging: {
    enabled: true,
    logLevel: "INFO",
    retentionDays: 365,
  },
  dataEncryption: {
    encryptSensitiveData: true,
    encryptionLevel: "AES-256",
  },
  apiSecurity: {
    rateLimitEnabled: true,
    maxRequestsPerMinute: 100,
    requireApiKey: false,
  },
};

export function SchoolSecuritySettings({ schoolId }: SchoolSecuritySettingsProps) {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newIP, setNewIP] = useState("");

  useEffect(() => {
    fetchSecuritySettings();
  }, [schoolId]);

  const fetchSecuritySettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/security-settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (category: keyof SecuritySettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (category: keyof SecuritySettings, field: string, value: string[]) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const addIP = () => {
    if (newIP && !settings.ipWhitelisting.allowedIPs.includes(newIP)) {
      const updatedIPs = [...settings.ipWhitelisting.allowedIPs, newIP];
      handleArrayChange('ipWhitelisting', 'allowedIPs', updatedIPs);
      setNewIP("");
    }
  };

  const removeIP = (ip: string) => {
    const updatedIPs = settings.ipWhitelisting.allowedIPs.filter(allowedIP => allowedIP !== ip);
    handleArrayChange('ipWhitelisting', 'allowedIPs', updatedIPs);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/security-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Security settings updated successfully');
      } else {
        throw new Error('Failed to update security settings');
      }
    } catch (error) {
      toast.error('Failed to update security settings');
      console.error('Error updating security settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Configure multi-factor authentication requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to enable two-factor authentication
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('twoFactorAuth', 'enabled', checked)
              }
            />
          </div>

          {settings.twoFactorAuth.enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Require 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Make two-factor authentication mandatory for all users
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth.required}
                  onCheckedChange={(checked) => 
                    handleSettingChange('twoFactorAuth', 'required', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Available 2FA Methods</Label>
                <div className="flex gap-2">
                  {["SMS", "EMAIL", "TOTP"].map((method) => (
                    <Badge
                      key={method}
                      variant={settings.twoFactorAuth.methods.includes(method) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const methods = settings.twoFactorAuth.methods.includes(method)
                          ? settings.twoFactorAuth.methods.filter(m => m !== method)
                          : [...settings.twoFactorAuth.methods, method];
                        handleArrayChange('twoFactorAuth', 'methods', methods);
                      }}
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure user session policies and timeouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="15"
                max="1440"
                value={settings.sessionManagement.sessionTimeout}
                onChange={(e) => 
                  handleSettingChange('sessionManagement', 'sessionTimeout', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
              <Input
                id="maxSessions"
                type="number"
                min="1"
                max="10"
                value={settings.sessionManagement.maxConcurrentSessions}
                onChange={(e) => 
                  handleSettingChange('sessionManagement', 'maxConcurrentSessions', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Force Logout on Password Change</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out all sessions when password is changed
              </p>
            </div>
            <Switch
              checked={settings.sessionManagement.forceLogoutOnPasswordChange}
              onCheckedChange={(checked) => 
                handleSettingChange('sessionManagement', 'forceLogoutOnPasswordChange', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Define password requirements and security rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                id="minLength"
                type="number"
                min="6"
                max="32"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => 
                  handleSettingChange('passwordPolicy', 'minLength', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                min="0"
                max="365"
                value={settings.passwordPolicy.passwordExpiry}
                onChange={(e) => 
                  handleSettingChange('passwordPolicy', 'passwordExpiry', parseInt(e.target.value))
                }
                placeholder="0 = Never expires"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Password Requirements</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase Letters</Label>
                <Switch
                  checked={settings.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => 
                    handleSettingChange('passwordPolicy', 'requireUppercase', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Lowercase Letters</Label>
                <Switch
                  checked={settings.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => 
                    handleSettingChange('passwordPolicy', 'requireLowercase', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <Switch
                  checked={settings.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => 
                    handleSettingChange('passwordPolicy', 'requireNumbers', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Special Characters</Label>
                <Switch
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => 
                    handleSettingChange('passwordPolicy', 'requireSpecialChars', checked)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelisting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            IP Whitelisting
          </CardTitle>
          <CardDescription>
            Control access based on IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable IP Whitelisting</Label>
              <p className="text-sm text-muted-foreground">
                Restrict access to specific IP addresses
              </p>
            </div>
            <Switch
              checked={settings.ipWhitelisting.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('ipWhitelisting', 'enabled', checked)
              }
            />
          </div>

          {settings.ipWhitelisting.enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Add IP Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="192.168.1.1"
                  />
                  <Button onClick={addIP} size="sm">
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed IP Addresses</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.ipWhitelisting.allowedIPs.map((ip) => (
                    <Badge key={ip} variant="secondary" className="cursor-pointer">
                      {ip}
                      <button
                        onClick={() => removeIP(ip)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Block Unknown IPs</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically block access from non-whitelisted IPs
                  </p>
                </div>
                <Switch
                  checked={settings.ipWhitelisting.blockUnknownIPs}
                  onCheckedChange={(checked) => 
                    handleSettingChange('ipWhitelisting', 'blockUnknownIPs', checked)
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit Logging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Logging
          </CardTitle>
          <CardDescription>
            Configure security audit logging and retention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all security-related events and user actions
              </p>
            </div>
            <Switch
              checked={settings.auditLogging.enabled}
              onCheckedChange={(checked) => 
                handleSettingChange('auditLogging', 'enabled', checked)
              }
            />
          </div>

          {settings.auditLogging.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select
                    value={settings.auditLogging.logLevel}
                    onValueChange={(value) => 
                      handleSettingChange('auditLogging', 'logLevel', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERROR">Error Only</SelectItem>
                      <SelectItem value="WARN">Warning & Above</SelectItem>
                      <SelectItem value="INFO">Info & Above</SelectItem>
                      <SelectItem value="DEBUG">All Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Period (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="30"
                    max="2555"
                    value={settings.auditLogging.retentionDays}
                    onChange={(e) => 
                      handleSettingChange('auditLogging', 'retentionDays', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Encryption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Data Encryption
          </CardTitle>
          <CardDescription>
            Configure data encryption and security levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Encrypt Sensitive Data</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt PII and sensitive information at rest
              </p>
            </div>
            <Switch
              checked={settings.dataEncryption.encryptSensitiveData}
              onCheckedChange={(checked) => 
                handleSettingChange('dataEncryption', 'encryptSensitiveData', checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="encryptionLevel">Encryption Level</Label>
            <Select
              value={settings.dataEncryption.encryptionLevel}
              onValueChange={(value) => 
                handleSettingChange('dataEncryption', 'encryptionLevel', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AES-128">AES-128</SelectItem>
                <SelectItem value="AES-256">AES-256</SelectItem>
                <SelectItem value="RSA-2048">RSA-2048</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Encryption Status
                </p>
                <p className="text-green-700 dark:text-green-200 mt-1">
                  All data transmission is encrypted using TLS 1.3. 
                  Database encryption is managed automatically.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Security Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}