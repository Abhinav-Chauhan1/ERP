"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Save, 
  Users, 
  MessageSquare, 
  HardDrive,
  AlertTriangle,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { updateSchoolUsageLimits, getSchoolUsageMetrics } from "@/lib/actions/school-management-actions";

interface SchoolUsageLimitsProps {
  schoolId: string;
  plan: 'STARTER' | 'GROWTH' | 'DOMINATE';
}

interface UsageLimits {
  maxStudents: number;
  maxTeachers: number;
  maxAdmins: number;
  whatsappLimit: number;
  smsLimit: number;
  storageLimit: number; // in MB
  maxClasses: number;
  maxSubjects: number;
}

interface CurrentUsage {
  students: number;
  teachers: number;
  admins: number;
  whatsappUsed: number;
  smsUsed: number;
  storageUsed: number;
  classes: number;
  subjects: number;
}

const defaultLimits: Record<string, UsageLimits> = {
  STARTER: {
    maxStudents: 100,
    maxTeachers: 10,
    maxAdmins: 3,
    whatsappLimit: 1000,
    smsLimit: 500,
    storageLimit: 1024, // 1GB
    maxClasses: 10,
    maxSubjects: 15,
  },
  GROWTH: {
    maxStudents: 500,
    maxTeachers: 50,
    maxAdmins: 10,
    whatsappLimit: 5000,
    smsLimit: 2500,
    storageLimit: 5120, // 5GB
    maxClasses: 50,
    maxSubjects: 50,
  },
  DOMINATE: {
    maxStudents: -1, // Unlimited
    maxTeachers: -1,
    maxAdmins: -1,
    whatsappLimit: 20000,
    smsLimit: 10000,
    storageLimit: 20480, // 20GB
    maxClasses: -1,
    maxSubjects: -1,
  },
};

export function SchoolUsageLimits({ schoolId, plan }: SchoolUsageLimitsProps) {
  const [limits, setLimits] = useState<UsageLimits>(() => 
    defaultLimits[plan] || defaultLimits.STARTER
  );
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage>({
    students: 0,
    teachers: 0,
    admins: 0,
    whatsappUsed: 0,
    smsUsed: 0,
    storageUsed: 0,
    classes: 0,
    subjects: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsageLimits();
    fetchCurrentUsage();
  }, [schoolId]);

  const fetchUsageLimits = async () => {
    try {
      // For now, use default limits based on plan
      // In a real implementation, you might fetch from school metadata
      setLimits(defaultLimits[plan] || defaultLimits.STARTER);
    } catch (error) {
      console.error('Error fetching usage limits:', error);
      setLimits(defaultLimits[plan] || defaultLimits.STARTER);
    }
  };

  const fetchCurrentUsage = async () => {
    setIsLoading(true);
    try {
      const result = await getSchoolUsageMetrics(schoolId);
      if (result.success && result.data) {
        const data = result.data;
        setCurrentUsage({
          students: 0, // Would need to be fetched from school details
          teachers: 0,
          admins: 0,
          whatsappUsed: data.currentUsage.whatsappUsed,
          smsUsed: data.currentUsage.smsUsed,
          storageUsed: data.currentUsage.storageUsedMB,
          classes: 0,
          subjects: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching current usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitChange = (field: keyof UsageLimits, value: string) => {
    const numValue = parseInt(value) || 0;
    setLimits(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSchoolUsageLimits(schoolId, {
        whatsappLimit: limits.whatsappLimit,
        smsLimit: limits.smsLimit,
        storageLimitMB: limits.storageLimit,
        maxActiveUsers: limits.maxStudents + limits.maxTeachers + limits.maxAdmins,
        maxConcurrentSessions: 100, // Default value
      });

      if (result.success) {
        toast.success('Usage limits updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update usage limits');
      }
    } catch (error) {
      toast.error('Failed to update usage limits');
      console.error('Error updating usage limits:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatLimit = (limit: number | undefined | null) => {
    if (limit === undefined || limit === null) return 'Not set';
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Plan: {plan}
          </CardTitle>
          <CardDescription>
            Default limits for {plan} plan. You can customize these limits below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Students:</span> {formatLimit(defaultLimits[plan].maxStudents)}
            </div>
            <div>
              <span className="font-medium">Teachers:</span> {formatLimit(defaultLimits[plan].maxTeachers)}
            </div>
            <div>
              <span className="font-medium">WhatsApp:</span> {defaultLimits[plan].whatsappLimit.toLocaleString()}/month
            </div>
            <div>
              <span className="font-medium">Storage:</span> {(defaultLimits[plan].storageLimit / 1024).toFixed(1)}GB
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Limits
          </CardTitle>
          <CardDescription>
            Configure maximum number of users for different roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxStudents">Max Students</Label>
                <Badge variant="outline">
                  {currentUsage.students} / {formatLimit(limits.maxStudents)}
                </Badge>
              </div>
              <Input
                id="maxStudents"
                type="number"
                value={limits.maxStudents === -1 ? '' : limits.maxStudents}
                onChange={(e) => handleLimitChange('maxStudents', e.target.value)}
                placeholder="Unlimited"
              />
              {limits.maxStudents !== -1 && (
                <Progress 
                  value={getUsagePercentage(currentUsage.students, limits.maxStudents)} 
                  className="h-2"
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxTeachers">Max Teachers</Label>
                <Badge variant="outline">
                  {currentUsage.teachers} / {formatLimit(limits.maxTeachers)}
                </Badge>
              </div>
              <Input
                id="maxTeachers"
                type="number"
                value={limits.maxTeachers === -1 ? '' : limits.maxTeachers}
                onChange={(e) => handleLimitChange('maxTeachers', e.target.value)}
                placeholder="Unlimited"
              />
              {limits.maxTeachers !== -1 && (
                <Progress 
                  value={getUsagePercentage(currentUsage.teachers, limits.maxTeachers)} 
                  className="h-2"
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxAdmins">Max Admins</Label>
                <Badge variant="outline">
                  {currentUsage.admins} / {formatLimit(limits.maxAdmins)}
                </Badge>
              </div>
              <Input
                id="maxAdmins"
                type="number"
                value={limits.maxAdmins === -1 ? '' : limits.maxAdmins}
                onChange={(e) => handleLimitChange('maxAdmins', e.target.value)}
                placeholder="Unlimited"
              />
              {limits.maxAdmins !== -1 && (
                <Progress 
                  value={getUsagePercentage(currentUsage.admins, limits.maxAdmins)} 
                  className="h-2"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication Limits
          </CardTitle>
          <CardDescription>
            Monthly limits for messaging services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsappLimit">WhatsApp Messages/Month</Label>
                <Badge variant="outline" className={getUsageColor(getUsagePercentage(currentUsage.whatsappUsed, limits.whatsappLimit))}>
                  {currentUsage.whatsappUsed} / {limits.whatsappLimit.toLocaleString()}
                </Badge>
              </div>
              <Input
                id="whatsappLimit"
                type="number"
                value={limits.whatsappLimit}
                onChange={(e) => handleLimitChange('whatsappLimit', e.target.value)}
              />
              <Progress 
                value={getUsagePercentage(currentUsage.whatsappUsed, limits.whatsappLimit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="smsLimit">SMS Messages/Month</Label>
                <Badge variant="outline" className={getUsageColor(getUsagePercentage(currentUsage.smsUsed, limits.smsLimit))}>
                  {currentUsage.smsUsed} / {limits.smsLimit.toLocaleString()}
                </Badge>
              </div>
              <Input
                id="smsLimit"
                type="number"
                value={limits.smsLimit}
                onChange={(e) => handleLimitChange('smsLimit', e.target.value)}
              />
              <Progress 
                value={getUsagePercentage(currentUsage.smsUsed, limits.smsLimit)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Academic Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage & Academic Limits
          </CardTitle>
          <CardDescription>
            Storage space and academic resource limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="storageLimit">Storage Limit (MB)</Label>
                <Badge variant="outline" className={getUsageColor(getUsagePercentage(currentUsage.storageUsed, limits.storageLimit))}>
                  {(currentUsage.storageUsed / 1024).toFixed(1)}GB / {(limits.storageLimit / 1024).toFixed(1)}GB
                </Badge>
              </div>
              <Input
                id="storageLimit"
                type="number"
                value={limits.storageLimit}
                onChange={(e) => handleLimitChange('storageLimit', e.target.value)}
              />
              <Progress 
                value={getUsagePercentage(currentUsage.storageUsed, limits.storageLimit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxClasses">Max Classes</Label>
                <Badge variant="outline">
                  {currentUsage.classes} / {formatLimit(limits.maxClasses)}
                </Badge>
              </div>
              <Input
                id="maxClasses"
                type="number"
                value={limits.maxClasses === -1 ? '' : limits.maxClasses}
                onChange={(e) => handleLimitChange('maxClasses', e.target.value)}
                placeholder="Unlimited"
              />
              {limits.maxClasses !== -1 && (
                <Progress 
                  value={getUsagePercentage(currentUsage.classes, limits.maxClasses)} 
                  className="h-2"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Usage Alerts
          </CardTitle>
          <CardDescription>
            Automatic alerts when usage approaches limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Automatic Notifications
                </p>
                <p className="text-yellow-700 dark:text-yellow-200 mt-1">
                  School administrators will be notified when usage reaches 80% and 95% of any limit.
                  Super admins will be notified when limits are exceeded.
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
              Save Limits
            </>
          )}
        </Button>
      </div>
    </div>
  );
}