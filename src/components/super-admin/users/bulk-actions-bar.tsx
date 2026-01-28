"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserCheck, 
  UserX, 
  Trash2, 
  Users, 
  School,
  AlertTriangle
} from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkAction: (action: string, data?: any) => void;
  onClearSelection: () => void;
  schools: Array<{
    id: string;
    name: string;
    schoolCode: string;
  }>;
}

export function BulkActionsBar({
  selectedCount,
  onBulkAction,
  onClearSelection,
  schools,
}: BulkActionsBarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [showSchoolActionDialog, setShowSchoolActionDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    data?: any;
    title: string;
    description: string;
    confirmText: string;
    variant: 'default' | 'destructive';
  } | null>(null);
  
  const [roleChangeData, setRoleChangeData] = useState({
    role: '',
    schoolId: '',
    reason: '',
  });

  const [schoolActionData, setSchoolActionData] = useState({
    schoolId: '',
    role: '',
    action: '',
    reason: '',
  });

  const handleBulkAction = (action: string, data?: any) => {
    switch (action) {
      case 'activate':
        setPendingAction({
          action,
          title: 'Activate Users',
          description: `Are you sure you want to activate ${selectedCount} selected users? This will enable their access to all associated schools.`,
          confirmText: 'Activate',
          variant: 'default',
        });
        setShowConfirmDialog(true);
        break;

      case 'deactivate':
        setPendingAction({
          action,
          title: 'Deactivate Users',
          description: `Are you sure you want to deactivate ${selectedCount} selected users? This will disable their access to all schools.`,
          confirmText: 'Deactivate',
          variant: 'destructive',
        });
        setShowConfirmDialog(true);
        break;

      case 'delete':
        setPendingAction({
          action,
          title: 'Delete Users',
          description: `Are you sure you want to permanently delete ${selectedCount} selected users? This action cannot be undone and will remove all user data.`,
          confirmText: 'Delete',
          variant: 'destructive',
        });
        setShowConfirmDialog(true);
        break;

      case 'change_role':
        setShowRoleChangeDialog(true);
        break;

      case 'add_to_school':
        setSchoolActionData({ ...schoolActionData, action: 'add_to_school' });
        setShowSchoolActionDialog(true);
        break;

      case 'remove_from_school':
        setSchoolActionData({ ...schoolActionData, action: 'remove_from_school' });
        setShowSchoolActionDialog(true);
        break;

      default:
        onBulkAction(action, data);
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.action, pendingAction.data);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const confirmRoleChange = () => {
    if (roleChangeData.role) {
      onBulkAction('change_role', {
        role: roleChangeData.role,
        schoolId: roleChangeData.schoolId || undefined,
        reason: roleChangeData.reason,
      });
    }
    setShowRoleChangeDialog(false);
    setRoleChangeData({ role: '', schoolId: '', reason: '' });
  };

  const confirmSchoolAction = () => {
    if (schoolActionData.schoolId) {
      const actionData: any = {
        schoolId: schoolActionData.schoolId,
        reason: schoolActionData.reason,
      };

      if (schoolActionData.action === 'add_to_school' && schoolActionData.role) {
        actionData.role = schoolActionData.role;
      }

      onBulkAction(schoolActionData.action, actionData);
    }
    setShowSchoolActionDialog(false);
    setSchoolActionData({ schoolId: '', role: '', action: '', reason: '' });
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedCount} users selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('activate')}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('deactivate')}
              >
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('change_role')}
              >
                <Users className="h-4 w-4 mr-1" />
                Change Role
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('add_to_school')}
              >
                <School className="h-4 w-4 mr-1" />
                Add to School
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('remove_from_school')}
              >
                <School className="h-4 w-4 mr-1" />
                Remove from School
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button size="sm" variant="outline" onClick={onClearSelection}>
                Clear Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {pendingAction?.title}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={pendingAction?.variant || 'default'} 
              onClick={confirmAction}
            >
              {pendingAction?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Roles</DialogTitle>
            <DialogDescription>
              Change the role for {selectedCount} selected users. You can optionally specify a school to limit the change to that school only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Role</Label>
              <Select value={roleChangeData.role} onValueChange={(value) => 
                setRoleChangeData({ ...roleChangeData, role: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="school">School (Optional)</Label>
              <Select value={roleChangeData.schoolId} onValueChange={(value) => 
                setRoleChangeData({ ...roleChangeData, schoolId: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All schools (leave empty for all)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name} ({school.schoolCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Reason for role change..."
                value={roleChangeData.reason}
                onChange={(e) => setRoleChangeData({ ...roleChangeData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={!roleChangeData.role}>
              Change Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Action Dialog */}
      <Dialog open={showSchoolActionDialog} onOpenChange={setShowSchoolActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {schoolActionData.action === 'add_to_school' ? 'Add Users to School' : 'Remove Users from School'}
            </DialogTitle>
            <DialogDescription>
              {schoolActionData.action === 'add_to_school' 
                ? `Add ${selectedCount} selected users to a school with the specified role.`
                : `Remove ${selectedCount} selected users from the specified school.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="school">School</Label>
              <Select value={schoolActionData.schoolId} onValueChange={(value) => 
                setSchoolActionData({ ...schoolActionData, schoolId: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name} ({school.schoolCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schoolActionData.action === 'add_to_school' && (
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={schoolActionData.role} onValueChange={(value) => 
                  setSchoolActionData({ ...schoolActionData, role: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="PARENT">Parent</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Reason for this action..."
                value={schoolActionData.reason}
                onChange={(e) => setSchoolActionData({ ...schoolActionData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchoolActionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSchoolAction} 
              disabled={!schoolActionData.schoolId || (schoolActionData.action === 'add_to_school' && !schoolActionData.role)}
            >
              {schoolActionData.action === 'add_to_school' ? 'Add to School' : 'Remove from School'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
     