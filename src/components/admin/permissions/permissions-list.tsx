"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PermissionsListProps {
  permissions: Record<string, any[]>;
}

export function PermissionsList({ permissions }: PermissionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filterPermissions = (categoryPermissions: any[]) => {
    if (!searchTerm) return categoryPermissions;
    return categoryPermissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredCategories = permissions 
    ? Object.entries(permissions)
        .map(([category, categoryPermissions]) => ({
          category,
          permissions: filterPermissions(categoryPermissions),
        }))
        .filter((item) => item.permissions.length > 0)
    : [];

  const totalPermissions = permissions ? Object.values(permissions).flat().length : 0;
  const filteredCount = filteredCategories.reduce(
    (sum, item) => sum + item.permissions.length,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          All Permissions
        </CardTitle>
        <CardDescription>
          View all available permissions in the system ({totalPermissions} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalPermissions} permissions
          </div>
        )}

        {/* Permissions by Category */}
        <Accordion type="multiple" className="w-full">
          {filteredCategories.map(({ category, permissions: categoryPermissions }) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold">
                    {category.replace(/_/g, " ")}
                  </span>
                  <Badge variant="secondary">{categoryPermissions.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {categoryPermissions.map((permission: any) => (
                    <div
                      key={permission.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{permission.resource}</Badge>
                            <Badge variant="outline">{permission.action}</Badge>
                            {permission.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No permissions found matching your search
          </div>
        )}
      </CardContent>
    </Card>
  );
}
