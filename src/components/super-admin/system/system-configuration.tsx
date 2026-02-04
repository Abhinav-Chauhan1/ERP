"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Globe, 
  Mail, 
  Smartphone, 
  Database, 
  Shield,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ConfigurationSetting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'password';
  value: any;
  defaultValue: any;
  options?: string[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  isSystem?: boolean;
  requiresRestart?: boolean;
}

export function SystemConfiguration() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Mock configuration data - in real implementation, this would come from API
  const [configurations, setConfigurations] = useState<ConfigurationSetting[]>([
    // Global Settings
    {
      id: "app_name",
      category: "Global",
      name: "Application Name",
      description: "The name of the application displayed to users",
      type: "string",
      value: "SikshaMitra ERP",
      defaultValue: "SikshaMitra ERP",
      validation: { required: true },
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "app_url",
      category: "Global",
      name: "Application URL",
      description: "The base URL of the application",
      type: "string",
      value: "https://app.sikshamitra.com",
      defaultValue: "https://app.sikshamitra.com",
      validation: { required: true, pattern: "^https?://" },
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "maintenance_mode",
      category: "Global",
      name: "Maintenance Mode",
      description: "Enable maintenance mode to prevent user access",
      type: "boolean",
      value: false,
      defaultValue: false,
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "max_schools",
      category: "Global",
      name: "Maximum Schools",
      description: "Maximum number of schools allowed in the system",
      type: "number",
      value: 1000,
      defaultValue: 1000,
      validation: { min: 1, max: 10000 },
      isSystem: false,
      requiresRestart: false
    },

    // Email Configuration
    {
      id: "smtp_host",
      category: "Email",
      name: "SMTP Host",
      description: "SMTP server hostname",
      type: "string",
      value: "smtp.gmail.com",
      defaultValue: "",
      validation: { required: true },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "smtp_port",
      category: "Email",
      name: "SMTP Port",
      description: "SMTP server port",
      type: "number",
      value: 587,
      defaultValue: 587,
      validation: { min: 1, max: 65535 },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "smtp_username",
      category: "Email",
      name: "SMTP Username",
      description: "SMTP authentication username",
      type: "string",
      value: "noreply@sikshamitra.com",
      defaultValue: "",
      validation: { required: true },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "smtp_password",
      category: "Email",
      name: "SMTP Password",
      description: "SMTP authentication password",
      type: "password",
      value: "••••••••••••",
      defaultValue: "",
      validation: { required: true },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "email_from_name",
      category: "Email",
      name: "From Name",
      description: "Default sender name for emails",
      type: "string",
      value: "SikshaMitra Support",
      defaultValue: "SikshaMitra Support",
      validation: { required: true },
      isSystem: false,
      requiresRestart: false
    },

    // SMS Configuration
    {
      id: "sms_provider",
      category: "SMS",
      name: "SMS Provider",
      description: "SMS service provider",
      type: "select",
      value: "msg91",
      defaultValue: "msg91",
      options: ["msg91"],
      validation: { required: true },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "msg91_api_key",
      category: "SMS",
      name: "MSG91 API Key",
      description: "MSG91 API key for SMS services",
      type: "password",
      value: "••••••••••••",
      defaultValue: "",
      validation: { required: true },
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "sms_sender_id",
      category: "SMS",
      name: "SMS Sender ID",
      description: "Sender ID for SMS messages",
      type: "string",
      value: "SIKSMA",
      defaultValue: "SIKSMA",
      validation: { required: true },
      isSystem: false,
      requiresRestart: false
    },

    // Database Configuration
    {
      id: "db_pool_size",
      category: "Database",
      name: "Connection Pool Size",
      description: "Maximum number of database connections",
      type: "number",
      value: 20,
      defaultValue: 20,
      validation: { min: 5, max: 100 },
      isSystem: true,
      requiresRestart: true
    },
    {
      id: "db_timeout",
      category: "Database",
      name: "Query Timeout (seconds)",
      description: "Maximum time to wait for database queries",
      type: "number",
      value: 30,
      defaultValue: 30,
      validation: { min: 5, max: 300 },
      isSystem: true,
      requiresRestart: true
    },
    {
      id: "backup_enabled",
      category: "Database",
      name: "Automatic Backups",
      description: "Enable automatic database backups",
      type: "boolean",
      value: true,
      defaultValue: true,
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "backup_frequency",
      category: "Database",
      name: "Backup Frequency",
      description: "How often to create backups",
      type: "select",
      value: "daily",
      defaultValue: "daily",
      options: ["hourly", "daily", "weekly"],
      isSystem: false,
      requiresRestart: false
    },

    // Security Configuration
    {
      id: "session_timeout",
      category: "Security",
      name: "Session Timeout (minutes)",
      description: "User session timeout in minutes",
      type: "number",
      value: 60,
      defaultValue: 60,
      validation: { min: 5, max: 480 },
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "password_min_length",
      category: "Security",
      name: "Minimum Password Length",
      description: "Minimum required password length",
      type: "number",
      value: 8,
      defaultValue: 8,
      validation: { min: 6, max: 32 },
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "mfa_required",
      category: "Security",
      name: "Require MFA",
      description: "Require multi-factor authentication for all users",
      type: "boolean",
      value: false,
      defaultValue: false,
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "ip_whitelist_enabled",
      category: "Security",
      name: "IP Whitelist",
      description: "Enable IP address whitelisting",
      type: "boolean",
      value: false,
      defaultValue: false,
      isSystem: false,
      requiresRestart: false
    },

    // Performance Configuration
    {
      id: "cache_enabled",
      category: "Performance",
      name: "Enable Caching",
      description: "Enable application-level caching",
      type: "boolean",
      value: true,
      defaultValue: true,
      isSystem: false,
      requiresRestart: true
    },
    {
      id: "cache_ttl",
      category: "Performance",
      name: "Cache TTL (seconds)",
      description: "Default cache time-to-live",
      type: "number",
      value: 3600,
      defaultValue: 3600,
      validation: { min: 60, max: 86400 },
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "rate_limit_enabled",
      category: "Performance",
      name: "Rate Limiting",
      description: "Enable API rate limiting",
      type: "boolean",
      value: true,
      defaultValue: true,
      isSystem: false,
      requiresRestart: false
    },
    {
      id: "rate_limit_requests",
      category: "Performance",
      name: "Rate Limit (requests/minute)",
      description: "Maximum requests per minute per user",
      type: "number",
      value: 100,
      defaultValue: 100,
      validation: { min: 10, max: 1000 },
      isSystem: false,
      requiresRestart: false
    }
  ]);

  const categories = Array.from(new Set(configurations.map(config => config.category)));

  const handleConfigChange = (configId: string, newValue: any) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === configId ? { ...config, value: newValue } : config
      )
    );
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setHasChanges(false);
  };

  const handleResetToDefaults = async (category?: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setConfigurations(prev => 
      prev.map(config => 
        (!category || config.category === category) 
          ? { ...config, value: config.defaultValue }
          : config
      )
    );
    
    setIsLoading(false);
    setHasChanges(true);
  };

  const togglePasswordVisibility = (configId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const renderConfigInput = (config: ConfigurationSetting) => {
    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.value}
              onCheckedChange={(checked) => handleConfigChange(config.id, checked)}
              disabled={config.isSystem}
            />
            <Label>{config.value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={config.value}
            onValueChange={(value) => handleConfigChange(config.id, value)}
            disabled={config.isSystem}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={config.value}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            placeholder={config.description}
            disabled={config.isSystem}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              type={showPasswords[config.id] ? 'text' : 'password'}
              value={config.value}
              onChange={(e) => handleConfigChange(config.id, e.target.value)}
              placeholder={config.description}
              disabled={config.isSystem}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => togglePasswordVisibility(config.id)}
            >
              {showPasswords[config.id] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={config.value}
            onChange={(e) => handleConfigChange(config.id, parseInt(e.target.value) || 0)}
            placeholder={config.description}
            disabled={config.isSystem}
            min={config.validation?.min}
            max={config.validation?.max}
          />
        );

      default:
        return (
          <Input
            value={config.value}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            placeholder={config.description}
            disabled={config.isSystem}
          />
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Global':
        return <Globe className="h-4 w-4" />;
      case 'Email':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <Smartphone className="h-4 w-4" />;
      case 'Database':
        return <Database className="h-4 w-4" />;
      case 'Security':
        return <Shield className="h-4 w-4" />;
      case 'Performance':
        return <Zap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const configStats = {
    total: configurations.length,
    system: configurations.filter(c => c.isSystem).length,
    requiresRestart: configurations.filter(c => c.requiresRestart && c.value !== c.defaultValue).length,
    modified: configurations.filter(c => c.value !== c.defaultValue).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">
            Manage system-wide settings and configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => handleResetToDefaults()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isLoading || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Configuration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {configStats.system} system settings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configStats.modified}</div>
            <p className="text-xs text-muted-foreground">
              Settings changed from default
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requires Restart</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{configStats.requiresRestart}</div>
            <p className="text-xs text-muted-foreground">
              Settings need restart
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Configuration categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <CardTitle>{category} Configuration</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetToDefaults(category)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Category
                  </Button>
                </div>
                <CardDescription>
                  Configure {category.toLowerCase()} settings for the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {configurations
                    .filter(config => config.category === category)
                    .map(config => (
                      <div key={config.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={config.id} className="font-medium">
                              {config.name}
                            </Label>
                            {config.isSystem && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                            {config.requiresRestart && config.value !== config.defaultValue && (
                              <Badge variant="destructive" className="text-xs">
                                Restart Required
                              </Badge>
                            )}
                            {config.value !== config.defaultValue && (
                              <Badge variant="secondary" className="text-xs">
                                Modified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                        <div className="max-w-md">
                          {renderConfigInput(config)}
                        </div>
                        {config.validation && (
                          <div className="text-xs text-muted-foreground">
                            {config.validation.required && "Required. "}
                            {config.validation.min && config.validation.max && 
                              `Range: ${config.validation.min} - ${config.validation.max}. `}
                            {config.validation.pattern && 
                              `Pattern: ${config.validation.pattern}`}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Restart Warning */}
      {configStats.requiresRestart > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Restart Required</h4>
                <p className="text-sm text-yellow-700">
                  {configStats.requiresRestart} setting{configStats.requiresRestart !== 1 ? 's' : ''} require{configStats.requiresRestart === 1 ? 's' : ''} a system restart to take effect.
                  Please restart the application after saving changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}