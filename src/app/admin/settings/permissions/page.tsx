"use client";


import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, UserCog, Loader2 } from "lucide-react";
import { RolePermissionsManager } from "@/components/admin/permissions/role-permissions-manager";
import { UserPermissionsManager } from "@/components/admin/permissions/user-permissions-manager";
import { PermissionsList } from "@/components/admin/permissions/permissions-list";
import { getPermissionsByCategory } from "@/lib/actions/permissionActions";
import toast from "react-hot-toast";

export default function PermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const result = await getPermissionsByCategory();
      if (result.success && result.data) {
        setPermissions(result.data);
      } else {
        toast.error(result.error || "Failed to load permissions");
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage role-based and user-specific permissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Role Permissions
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="h-4 w-4 mr-2" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            All Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {permissions ? (
            <RolePermissionsManager permissions={permissions} />
          ) : (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground">No permissions data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {permissions ? (
            <UserPermissionsManager permissions={permissions} />
          ) : (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground">No permissions data available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {permissions ? (
            <PermissionsList permissions={permissions} />
          ) : (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground">No permissions data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

