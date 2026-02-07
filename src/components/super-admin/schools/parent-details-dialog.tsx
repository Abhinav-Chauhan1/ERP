'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Users,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';

interface ParentDetailsDialogProps {
  parent: {
    id: string;
    occupation?: string | null;
    relation?: string | null;
    alternatePhone?: string | null;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      isActive: boolean;
    };
    children: Array<{
      student: {
        id: string;
        user: {
          firstName: string;
          lastName: string;
          name?: string | null;
        };
        enrollments: Array<{
          class: {
            name: string;
          };
        }>;
      };
    }>;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParentDetailsDialog({
  parent,
  open,
  onOpenChange,
}: ParentDetailsDialogProps) {
  if (!parent) return null;

  const parentName = parent.user.name || `${parent.user.firstName} ${parent.user.lastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5" />
            {parentName}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Parent account details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <Badge variant={parent.user.isActive ? "default" : "secondary"}>
              {parent.user.isActive ? "Active" : "Inactive"}
            </Badge>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{parent.user.email || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Primary Phone:</span>
                  <span>{parent.user.phone || "Not provided"}</span>
                </div>
                {parent.alternatePhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Alternate Phone:</span>
                    <span>{parent.alternatePhone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Relation:</span>
                  <span>{parent.relation || "Parent"}</span>
                </div>
                {parent.occupation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Occupation:</span>
                    <span>{parent.occupation}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                  <span>{parent.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Children Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Children ({parent.children.length})
            </h3>
            {parent.children.length > 0 ? (
              <div className="space-y-3">
                {parent.children.map((child) => {
                  const childName = child.student.user.name ||
                    `${child.student.user.firstName} ${child.student.user.lastName}`;
                  const className = child.student.enrollments[0]?.class?.name;

                  return (
                    <div
                      key={child.student.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{childName}</p>
                        {className && (
                          <p className="text-sm text-muted-foreground">Class: {className}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Student
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No children linked to this parent account</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">User ID:</span>
                <p className="text-muted-foreground font-mono">{parent.user.id}</p>
              </div>
              <div>
                <span className="font-medium">Parent ID:</span>
                <p className="text-muted-foreground font-mono">{parent.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}