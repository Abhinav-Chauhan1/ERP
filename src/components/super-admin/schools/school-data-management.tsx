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
import { Progress } from "@/components/ui/progress";
import { 
  Save, 
  Database, 
  Download, 
  Upload,
  Trash2,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  FileText,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { useBreakpoint, mobileClasses } from "@/lib/utils/mobile-responsive";
import { aria, focus, formAccessibility } from "@/lib/utils/accessibility";

interface SchoolDataManagementProps {
  schoolId: string;
}

interface DataManagementSettings {
  backupSettings: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    backupRetention: number; // days
    includeFiles: boolean;
    encryptBackups: boolean;
  };
  exportSettings: {
    allowDataExport: boolean;
    exportFormats: string[];
    requireApproval: boolean;
  };
  dataRetention: {
    studentDataRetention: number; // years
    auditLogRetention: number; // days
    messageRetention: number; // days
    autoCleanup: boolean;
  };
  storageManagement: {
    storageQuota: number; // GB
    currentUsage: number; // GB
    compressionEnabled: boolean;
    autoArchive: boolean;
    archiveAfterDays: number;
  };
}

interface BackupInfo {
  id: string;
  createdAt: string;
  size: string;
  type: string;
  status: string;
}

const defaultSettings: DataManagementSettings = {
  backupSettings: {
    autoBackupEnabled: true,
    backupFrequency: "DAILY",
    backupRetention: 30,
    includeFiles: true,
    encryptBackups: true,
  },
  exportSettings: {
    allowDataExport: true,
    exportFormats: ["CSV", "JSON", "PDF"],
    requireApproval: true,
  },
  dataRetention: {
    studentDataRetention: 7,
    auditLogRetention: 365,
    messageRetention: 90,
    autoCleanup: false,
  },
  storageManagement: {
    storageQuota: 10,
    currentUsage: 2.5,
    compressionEnabled: true,
    autoArchive: true,
    archiveAfterDays: 365,
  },
};

const mockBackups: BackupInfo[] = [
  {
    id: "1",
    createdAt: "2024-01-25T10:00:00Z",
    size: "245 MB",
    type: "Full",
    status: "Completed"
  },
  {
    id: "2",
    createdAt: "2024-01-24T10:00:00Z",
    size: "189 MB",
    type: "Incremental",
    status: "Completed"
  },
  {
    id: "3",
    createdAt: "2024-01-23T10:00:00Z",
    size: "201 MB",
    type: "Incremental",
    status: "Completed"
  }
];

export function SchoolDataManagement({ schoolId }: SchoolDataManagementProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [settings, setSettings] = useState<DataManagementSettings>(defaultSettings);
  const [backups, setBackups] = useState<BackupInfo[]>(mockBackups);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    fetchDataManagementSettings();
    fetchBackups();
  }, [schoolId]);

  const fetchDataManagementSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/data-management`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error fetching data management settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/backups`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || mockBackups);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const handleSettingChange = (category: keyof DataManagementSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (category: keyof DataManagementSettings, field: string, value: string[]) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/data-management`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Data management settings updated successfully');
      } else {
        throw new Error('Failed to update data management settings');
      }
    } catch (error) {
      toast.error('Failed to update data management settings');
      console.error('Error updating data management settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'MANUAL' }),
      });

      if (response.ok) {
        toast.success('Backup creation started');
        fetchBackups();
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
      console.error('Error creating backup:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/backups/${backupId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-backup-${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup download started');
      } else {
        throw new Error('Failed to download backup');
      }
    } catch (error) {
      toast.error('Failed to download backup');
      console.error('Error downloading backup:', error);
    }
  };

  const exportData = async (format: string) => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        toast.success(`Data export (${format}) initiated`);
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Error exporting data:', error);
    }
  };

  const storageUsagePercentage = (settings.storageManagement.currentUsage / settings.storageManagement.storageQuota) * 100;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? mobileClasses.padding.mobile : mobileClasses.padding.desktop}`}>
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>
            Current storage usage and quota information
          </CardDescription>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? mobileClasses.padding.mobile : ''}`}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{settings.storageManagement.currentUsage} GB / {settings.storageManagement.storageQuota} GB</span>
            </div>
            <Progress 
              value={storageUsagePercentage} 
              className="h-2" 
              {...aria.attributes.label(`Storage usage: ${storageUsagePercentage.toFixed(1)}% used`)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{storageUsagePercentage.toFixed(1)}% used</span>
              <span>{(settings.storageManagement.storageQuota - settings.storageManagement.currentUsage).toFixed(1)} GB available</span>
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
              <div>
                <Label className="text-base font-medium">Enable Compression</Label>
                <p className="text-sm text-muted-foreground">
                  Compress files to save storage space
                </p>
              </div>
              <Switch
                checked={settings.storageManagement.compressionEnabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('storageManagement', 'compressionEnabled', checked)
                }
                className={focus.classes.visible}
                {...aria.attributes.label("Enable file compression")}
              />
            </div>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
              <div>
                <Label className="text-base font-medium">Auto Archive</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically archive old files
                </p>
              </div>
              <Switch
                checked={settings.storageManagement.autoArchive}
                onCheckedChange={(checked) => 
                  handleSettingChange('storageManagement', 'autoArchive', checked)
                }
                className={focus.classes.visible}
                {...aria.attributes.label("Enable automatic archiving")}
              />
            </div>
          </div>

          {settings.storageManagement.autoArchive && (
            <div className="space-y-2">
              <Label htmlFor="archiveAfterDays">Archive files after (days)</Label>
              <Input
                id="archiveAfterDays"
                type="number"
                min="30"
                max="3650"
                value={settings.storageManagement.archiveAfterDays}
                onChange={(e) => 
                  handleSettingChange('storageManagement', 'archiveAfterDays', parseInt(e.target.value))
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Backup Management
          </CardTitle>
          <CardDescription>
            Configure automatic backups and manage existing backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Auto Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create regular backups
              </p>
            </div>
            <Switch
              checked={settings.backupSettings.autoBackupEnabled}
              onCheckedChange={(checked) => 
                handleSettingChange('backupSettings', 'autoBackupEnabled', checked)
              }
            />
          </div>

          {settings.backupSettings.autoBackupEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={settings.backupSettings.backupFrequency}
                    onValueChange={(value) => 
                      handleSettingChange('backupSettings', 'backupFrequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    min="7"
                    max="365"
                    value={settings.backupSettings.backupRetention}
                    onChange={(e) => 
                      handleSettingChange('backupSettings', 'backupRetention', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include Files</Label>
                      <Switch
                        checked={settings.backupSettings.includeFiles}
                        onCheckedChange={(checked) => 
                          handleSettingChange('backupSettings', 'includeFiles', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Encrypt Backups</Label>
                      <Switch
                        checked={settings.backupSettings.encryptBackups}
                        onCheckedChange={(checked) => 
                          handleSettingChange('backupSettings', 'encryptBackups', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
            <h4 className="font-medium">Manual Backup</h4>
            <Button 
              onClick={createBackup} 
              disabled={isCreatingBackup}
              className={`${focus.classes.visible} ${isMobile ? 'w-full' : ''}`}
              {...aria.attributes.label("Create manual backup")}
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Recent Backups</Label>
            <div className="border rounded-lg">
              {backups.map((backup, index) => (
                <div key={backup.id} className={`p-3 flex items-center justify-between ${index !== backups.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {backup.type} Backup - {backup.size}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={backup.status === 'Completed' ? 'default' : 'secondary'}>
                      {backup.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBackup(backup.id)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export school data in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Allow Data Export</Label>
              <p className="text-sm text-muted-foreground">
                Enable data export functionality
              </p>
            </div>
            <Switch
              checked={settings.exportSettings.allowDataExport}
              onCheckedChange={(checked) => 
                handleSettingChange('exportSettings', 'allowDataExport', checked)
              }
            />
          </div>

          {settings.exportSettings.allowDataExport && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Require Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Require super admin approval for exports
                    </p>
                  </div>
                  <Switch
                    checked={settings.exportSettings.requireApproval}
                    onCheckedChange={(checked) => 
                      handleSettingChange('exportSettings', 'requireApproval', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available Export Formats</Label>
                  <div className="flex gap-2">
                    {["CSV", "JSON", "PDF", "XLSX"].map((format) => (
                      <Badge
                        key={format}
                        variant={settings.exportSettings.exportFormats.includes(format) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const formats = settings.exportSettings.exportFormats.includes(format)
                            ? settings.exportSettings.exportFormats.filter(f => f !== format)
                            : [...settings.exportSettings.exportFormats, format];
                          handleArrayChange('exportSettings', 'exportFormats', formats);
                        }}
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Export</Label>
                  <div className="flex gap-2">
                    {settings.exportSettings.exportFormats.map((format) => (
                      <Button
                        key={format}
                        size="sm"
                        variant="outline"
                        onClick={() => exportData(format)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Configure how long different types of data are retained
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentDataRetention">Student Data (years)</Label>
              <Input
                id="studentDataRetention"
                type="number"
                min="1"
                max="50"
                value={settings.dataRetention.studentDataRetention}
                onChange={(e) => 
                  handleSettingChange('dataRetention', 'studentDataRetention', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditLogRetention">Audit Logs (days)</Label>
              <Input
                id="auditLogRetention"
                type="number"
                min="30"
                max="2555"
                value={settings.dataRetention.auditLogRetention}
                onChange={(e) => 
                  handleSettingChange('dataRetention', 'auditLogRetention', parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="messageRetention">Messages (days)</Label>
              <Input
                id="messageRetention"
                type="number"
                min="7"
                max="365"
                value={settings.dataRetention.messageRetention}
                onChange={(e) => 
                  handleSettingChange('dataRetention', 'messageRetention', parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Auto Cleanup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete data after retention period
              </p>
            </div>
            <Switch
              checked={settings.dataRetention.autoCleanup}
              onCheckedChange={(checked) => 
                handleSettingChange('dataRetention', 'autoCleanup', checked)
              }
            />
          </div>

          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Data Retention Warning
                </p>
                <p className="text-yellow-700 dark:text-yellow-200 mt-1">
                  Enabling auto cleanup will permanently delete data after the retention period. 
                  This action cannot be undone. Ensure you have proper backups before enabling.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect school data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100">
                  Permanent Data Operations
                </p>
                <p className="text-red-700 dark:text-red-200 mt-1">
                  These actions cannot be undone. Use with extreme caution.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="destructive" size="sm" type="button">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Purge Old Data
                  </Button>
                  <Button variant="destructive" size="sm" type="button">
                    <Database className="h-3 w-3 mr-1" />
                    Reset Database
                  </Button>
                  <Button variant="destructive" size="sm" type="button">
                    <Shield className="h-3 w-3 mr-1" />
                    Delete All Backups
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`${focus.classes.visible} ${isMobile ? 'w-full' : ''}`}
          {...aria.attributes.label("Save data management settings")}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Data Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}