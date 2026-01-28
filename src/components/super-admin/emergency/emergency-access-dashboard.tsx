'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  School, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  History,
  BarChart3,
  Eye,
  Power,
  PowerOff
} from 'lucide-react';

interface EmergencyAccessStats {
  totalEmergencyActions: number;
  activeDisabledAccounts: number;
  recentActions: number;
  topReasons: Array<{ reason: string; count: number }>;
}

interface EmergencyAccessHistory {
  id: string;
  targetType: 'USER' | 'SCHOOL';
  targetId: string;
  targetName: string;
  action: 'DISABLE' | 'ENABLE' | 'FORCE_DISABLE';
  reason: string;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  disabledUntil?: Date;
  affectedUsers: number;
  invalidatedSessions: number;
  isReversed: boolean;
  reversedAt?: Date;
  reversedBy?: string;
  reversedReason?: string;
}

interface EmergencyDisableRequest {
  reason: string;
  disableUntil?: Date;
  notifyUsers: boolean;
  revokeActiveSessions: boolean;
  preventNewLogins: boolean;
  confirmationCode: string;
}

export default function EmergencyAccessDashboard() {
  const [stats, setStats] = useState<EmergencyAccessStats | null>(null);
  const [history, setHistory] = useState<EmergencyAccessHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [disableUserDialog, setDisableUserDialog] = useState(false);
  const [disableSchoolDialog, setDisableSchoolDialog] = useState(false);
  const [statusCheckDialog, setStatusCheckDialog] = useState(false);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [disableRequest, setDisableRequest] = useState<EmergencyDisableRequest>({
    reason: '',
    notifyUsers: false,
    revokeActiveSessions: true,
    preventNewLogins: true,
    confirmationCode: '',
  });

  // Status check states
  const [statusCheck, setStatusCheck] = useState({
    targetType: 'USER' as 'USER' | 'SCHOOL',
    targetId: '',
    result: null as any,
  });

  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    targetType: '',
    action: '',
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/super-admin/emergency/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError('Failed to load emergency access statistics');
      }
    } catch (error) {
      setError('Failed to load emergency access statistics');
    }
  };

  const loadHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (historyFilters.targetType) params.append('targetType', historyFilters.targetType);
      if (historyFilters.action) params.append('action', historyFilters.action);
      params.append('limit', historyFilters.limit.toString());
      params.append('offset', historyFilters.offset.toString());

      const response = await fetch(`/api/super-admin/emergency/history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data.history);
      } else {
        setError('Failed to load emergency access history');
      }
    } catch (error) {
      setError('Failed to load emergency access history');
    }
  };

  const handleEmergencyDisableUser = async () => {
    if (!selectedUserId || !disableRequest.reason || !disableRequest.confirmationCode) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/emergency/users/${selectedUserId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disableRequest),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`User emergency disabled successfully. ${data.data.affectedUsers} user(s) affected, ${data.data.invalidatedSessions} session(s) invalidated.`);
        setDisableUserDialog(false);
        resetForms();
        loadStats();
        loadHistory();
      } else {
        setError(data.error || 'Failed to emergency disable user');
      }
    } catch (error) {
      setError('Failed to emergency disable user');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyDisableSchool = async () => {
    if (!selectedSchoolId || !disableRequest.reason || !disableRequest.confirmationCode) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/emergency/schools/${selectedSchoolId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disableRequest),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`School emergency disabled successfully. ${data.data.affectedUsers} user(s) affected, ${data.data.invalidatedSessions} session(s) invalidated.`);
        setDisableSchoolDialog(false);
        resetForms();
        loadStats();
        loadHistory();
      } else {
        setError(data.error || 'Failed to emergency disable school');
      }
    } catch (error) {
      setError('Failed to emergency disable school');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyEnable = async (targetType: 'USER' | 'SCHOOL', targetId: string) => {
    const reason = prompt('Please provide a reason for enabling this account:');
    if (!reason || reason.length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = targetType === 'USER' 
        ? `/api/super-admin/emergency/users/${targetId}/disable`
        : `/api/super-admin/emergency/schools/${targetId}/disable`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${targetType.toLowerCase()} emergency enabled successfully.`);
        loadStats();
        loadHistory();
      } else {
        setError(data.error || `Failed to emergency enable ${targetType.toLowerCase()}`);
      }
    } catch (error) {
      setError(`Failed to emergency enable ${targetType.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusCheck = async () => {
    if (!statusCheck.targetId) {
      setError('Please provide a target ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        targetType: statusCheck.targetType,
        targetId: statusCheck.targetId,
      });

      const response = await fetch(`/api/super-admin/emergency/status?${params}`);
      const data = await response.json();

      if (data.success) {
        setStatusCheck(prev => ({ ...prev, result: data.data }));
      } else {
        setError('Failed to check emergency status');
      }
    } catch (error) {
      setError('Failed to check emergency status');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setSelectedUserId('');
    setSelectedSchoolId('');
    setDisableRequest({
      reason: '',
      notifyUsers: false,
      revokeActiveSessions: true,
      preventNewLogins: true,
      confirmationCode: '',
    });
    setStatusCheck({
      targetType: 'USER',
      targetId: '',
      result: null,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const getActionBadge = (action: string, isReversed: boolean) => {
    if (isReversed) {
      return <Badge variant="outline" className="text-green-600">REVERSED</Badge>;
    }
    
    switch (action) {
      case 'DISABLE':
        return <Badge variant="destructive">DISABLED</Badge>;
      case 'ENABLE':
        return <Badge variant="default" className="bg-green-600">ENABLED</Badge>;
      case 'FORCE_DISABLE':
        return <Badge variant="destructive" className="bg-red-800">FORCE DISABLED</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Access Controls</h1>
          <p className="text-gray-600">Manage emergency access controls for users and schools</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setDisableUserDialog(true)}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <PowerOff className="h-4 w-4" />
            <span>Disable User</span>
          </Button>
          <Button
            onClick={() => setDisableSchoolDialog(true)}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <PowerOff className="h-4 w-4" />
            <span>Disable School</span>
          </Button>
          <Button
            onClick={() => setStatusCheckDialog(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Check Status</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emergency Actions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmergencyActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Disabled Accounts</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.activeDisabledAccounts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Actions (24h)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.topReasons[0]?.reason.substring(0, 20)}...
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.topReasons[0]?.count} times
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Emergency Access History</span>
          </CardTitle>
          <CardDescription>
            Recent emergency access actions and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex space-x-4">
              <Select
                value={historyFilters.targetType}
                onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, targetType: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Target Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="SCHOOL">Schools</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={historyFilters.action}
                onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="DISABLE">Disable</SelectItem>
                  <SelectItem value="ENABLE">Enable</SelectItem>
                  <SelectItem value="FORCE_DISABLE">Force Disable</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadHistory} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Target</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Action</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Reason</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Performed By</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Impact</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">
                        <div>
                          <div className="font-medium">{record.targetName}</div>
                          <div className="text-sm text-gray-500">
                            {record.targetType} • {record.targetId.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {getActionBadge(record.action, record.isReversed)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="max-w-xs truncate" title={record.reason}>
                          {record.reason}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="text-sm">
                          <div>{record.performedByName}</div>
                          <div className="text-gray-500">{formatDate(record.performedAt)}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="text-sm">
                          {record.disabledUntil && (
                            <div>Until: {formatDate(record.disabledUntil)}</div>
                          )}
                          {record.isReversed && record.reversedAt && (
                            <div className="text-green-600">
                              Reversed: {formatDate(record.reversedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="text-sm">
                          <div>{record.affectedUsers} users</div>
                          <div className="text-gray-500">
                            {record.invalidatedSessions} sessions
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {record.action === 'DISABLE' && !record.isReversed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmergencyEnable(record.targetType, record.targetId)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Power className="h-3 w-3 mr-1" />
                            Enable
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Disable User Dialog */}
      <Dialog open={disableUserDialog} onOpenChange={setDisableUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Disable User</span>
            </DialogTitle>
            <DialogDescription>
              This action will immediately disable the user account and revoke all active sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason (Required)</Label>
              <Textarea
                id="reason"
                value={disableRequest.reason}
                onChange={(e) => setDisableRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Provide a detailed reason for emergency disabling this user"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="confirmationCode">Confirmation Code</Label>
              <Input
                id="confirmationCode"
                value={disableRequest.confirmationCode}
                onChange={(e) => setDisableRequest(prev => ({ ...prev, confirmationCode: e.target.value }))}
                placeholder={selectedUserId ? `DISABLE-${selectedUserId.slice(-6).toUpperCase()}` : 'DISABLE-XXXXXX'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter: DISABLE-{selectedUserId.slice(-6).toUpperCase() || 'XXXXXX'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="revokeActiveSessions"
                  checked={disableRequest.revokeActiveSessions}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, revokeActiveSessions: !!checked }))
                  }
                />
                <Label htmlFor="revokeActiveSessions">Revoke active sessions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preventNewLogins"
                  checked={disableRequest.preventNewLogins}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, preventNewLogins: !!checked }))
                  }
                />
                <Label htmlFor="preventNewLogins">Prevent new logins</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyUsers"
                  checked={disableRequest.notifyUsers}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, notifyUsers: !!checked }))
                  }
                />
                <Label htmlFor="notifyUsers">Notify affected users</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableUserDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyDisableUser}
              disabled={loading || !selectedUserId || !disableRequest.reason || !disableRequest.confirmationCode}
            >
              {loading ? 'Disabling...' : 'Emergency Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Disable School Dialog */}
      <Dialog open={disableSchoolDialog} onOpenChange={setDisableSchoolDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Disable School</span>
            </DialogTitle>
            <DialogDescription>
              This action will immediately disable the school and all associated user accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="schoolId">School ID</Label>
              <Input
                id="schoolId"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                placeholder="Enter school ID"
              />
            </div>

            <div>
              <Label htmlFor="schoolReason">Reason (Required)</Label>
              <Textarea
                id="schoolReason"
                value={disableRequest.reason}
                onChange={(e) => setDisableRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Provide a detailed reason for emergency disabling this school"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="schoolConfirmationCode">Confirmation Code</Label>
              <Input
                id="schoolConfirmationCode"
                value={disableRequest.confirmationCode}
                onChange={(e) => setDisableRequest(prev => ({ ...prev, confirmationCode: e.target.value }))}
                placeholder={selectedSchoolId ? `SCHOOL-${selectedSchoolId.slice(-6).toUpperCase()}` : 'SCHOOL-XXXXXX'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter: SCHOOL-{selectedSchoolId.slice(-6).toUpperCase() || 'XXXXXX'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schoolRevokeActiveSessions"
                  checked={disableRequest.revokeActiveSessions}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, revokeActiveSessions: !!checked }))
                  }
                />
                <Label htmlFor="schoolRevokeActiveSessions">Revoke active sessions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schoolPreventNewLogins"
                  checked={disableRequest.preventNewLogins}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, preventNewLogins: !!checked }))
                  }
                />
                <Label htmlFor="schoolPreventNewLogins">Prevent new logins</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schoolNotifyUsers"
                  checked={disableRequest.notifyUsers}
                  onCheckedChange={(checked) => 
                    setDisableRequest(prev => ({ ...prev, notifyUsers: !!checked }))
                  }
                />
                <Label htmlFor="schoolNotifyUsers">Notify affected users</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableSchoolDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyDisableSchool}
              disabled={loading || !selectedSchoolId || !disableRequest.reason || !disableRequest.confirmationCode}
            >
              {loading ? 'Disabling...' : 'Emergency Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Check Dialog */}
      <Dialog open={statusCheckDialog} onOpenChange={setStatusCheckDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Check Emergency Status</span>
            </DialogTitle>
            <DialogDescription>
              Check if an account is currently emergency disabled
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={statusCheck.targetType}
                onValueChange={(value: 'USER' | 'SCHOOL') => 
                  setStatusCheck(prev => ({ ...prev, targetType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="SCHOOL">School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetId">Target ID</Label>
              <Input
                id="targetId"
                value={statusCheck.targetId}
                onChange={(e) => setStatusCheck(prev => ({ ...prev, targetId: e.target.value }))}
                placeholder={`Enter ${statusCheck.targetType.toLowerCase()} ID`}
              />
            </div>

            {statusCheck.result && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Status Result:</h4>
                {statusCheck.result.isDisabled ? (
                  <div className="space-y-2">
                    <Badge variant="destructive">EMERGENCY DISABLED</Badge>
                    <div className="text-sm">
                      <div><strong>Reason:</strong> {statusCheck.result.reason}</div>
                      <div><strong>Disabled At:</strong> {formatDate(statusCheck.result.disabledAt)}</div>
                      {statusCheck.result.disabledUntil && (
                        <div><strong>Disabled Until:</strong> {formatDate(statusCheck.result.disabledUntil)}</div>
                      )}
                      <div><strong>Performed By:</strong> {statusCheck.result.performedBy}</div>
                    </div>
                  </div>
                ) : (
                  <Badge variant="default" className="bg-green-600">ACTIVE</Badge>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusCheckDialog(false)}>
              Close
            </Button>
            <Button
              onClick={handleStatusCheck}
              disabled={loading || !statusCheck.targetId}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}