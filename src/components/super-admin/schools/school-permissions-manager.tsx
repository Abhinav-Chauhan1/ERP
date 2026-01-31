"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Shield, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  Bell,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { useBreakpoint, mobileClasses } from "@/lib/utils/mobile-responsive";
import { aria, focus } from "@/lib/utils/accessibility";

interface SchoolPermissionsManagerProps {
  schoolId: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  enabled: boolean;
  isPremium?: boolean;
}

const defaultPermissions: Permission[] = [
  // User Management
  {
    id: "manage_students",
    name: "Manage Students",
    description: "Add, edit, and remove student accounts",
    category: "User Management",
    icon: <Users className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_teachers",
    name: "Manage Teachers",
    description: "Add, edit, and remove teacher accounts",
    category: "User Management",
    icon: <Users className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_parents",
    name: "Manage Parents",
    description: "Add, edit, and remove parent accounts",
    category: "User Management",
    icon: <Users className="h-4 w-4" />,
    enabled: true,
  },
  
  // Academic Features
  {
    id: "manage_classes",
    name: "Class Management",
    description: "Create and manage classes and sections",
    category: "Academic",
    icon: <BookOpen className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_subjects",
    name: "Subject Management",
    description: "Add and manage subjects and curriculum",
    category: "Academic",
    icon: <BookOpen className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_exams",
    name: "Examination System",
    description: "Create and manage exams and assessments",
    category: "Academic",
    icon: <FileText className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_timetable",
    name: "Timetable Management",
    description: "Create and manage class timetables",
    category: "Academic",
    icon: <Calendar className="h-4 w-4" />,
    enabled: true,
  },
  
  // Communication
  {
    id: "send_notifications",
    name: "Send Notifications",
    description: "Send notifications to users",
    category: "Communication",
    icon: <Bell className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "bulk_messaging",
    name: "Bulk Messaging",
    description: "Send bulk SMS and WhatsApp messages",
    category: "Communication",
    icon: <MessageSquare className="h-4 w-4" />,
    enabled: true,
    isPremium: true,
  },
  {
    id: "email_campaigns",
    name: "Email Campaigns",
    description: "Create and send email campaigns",
    category: "Communication",
    icon: <MessageSquare className="h-4 w-4" />,
    enabled: false,
    isPremium: true,
  },
  
  // Analytics & Reports
  {
    id: "view_analytics",
    name: "Analytics Dashboard",
    description: "Access analytics and insights",
    category: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "generate_reports",
    name: "Generate Reports",
    description: "Create and export various reports",
    category: "Analytics",
    icon: <FileText className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Access advanced analytics and predictions",
    category: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    enabled: false,
    isPremium: true,
  },
  
  // System
  {
    id: "manage_settings",
    name: "System Settings",
    description: "Configure school settings and preferences",
    category: "System",
    icon: <Settings className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "manage_billing",
    name: "Billing Management",
    description: "View and manage billing information",
    category: "System",
    icon: <CreditCard className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: "data_export",
    name: "Data Export",
    description: "Export school data and backups",
    category: "System",
    icon: <Database className="h-4 w-4" />,
    enabled: true,
  },
];

export function SchoolPermissionsManager({ schoolId }: SchoolPermissionsManagerProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [schoolId]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        // Merge with default permissions
        const updatedPermissions = defaultPermissions.map(perm => {
          const saved = data.permissions?.find((p: any) => p.id === perm.id);
          return saved ? { ...perm, enabled: saved.enabled } : perm;
        });
        setPermissions(updatedPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    setPermissions(prev => 
      prev.map(perm => 
        perm.id === permissionId ? { ...perm, enabled } : perm
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: permissions.map(p => ({
            id: p.id,
            enabled: p.enabled,
          })),
        }),
      });

      if (response.ok) {
        toast.success('Permissions updated successfully');
      } else {
        throw new Error('Failed to update permissions');
      }
    } catch (error) {
      toast.error('Failed to update permissions');
      console.error('Error updating permissions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? mobileClasses.padding.mobile : mobileClasses.padding.desktop}`}>
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{category}</h3>
            <Badge variant="outline">
              {categoryPermissions.filter(p => p.enabled).length} / {categoryPermissions.length}
            </Badge>
          </div>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
            {categoryPermissions.map((permission) => (
              <Card key={permission.id} className="relative">
                <CardContent className={`${isMobile ? mobileClasses.card.mobile : 'p-4'}`}>
                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-start justify-between'}`}>
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        {permission.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{permission.name}</Label>
                          {permission.isPremium && (
                            <Badge variant="secondary" className="text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={permission.enabled}
                      onCheckedChange={(enabled) => 
                        handlePermissionToggle(permission.id, enabled)
                      }
                      className={`${focus.classes.visible} ${isMobile ? 'self-start' : ''}`}
                      {...aria.attributes.label(`Toggle ${permission.name} permission`)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {category !== Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] && (
            <Separator className="my-6" />
          )}
        </div>
      ))}

      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`${focus.classes.visible} ${isMobile ? 'w-full' : ''}`}
          {...aria.attributes.label("Save permission settings")}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}