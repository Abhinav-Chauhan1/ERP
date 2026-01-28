"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Shield, 
  Unlock, 
  Search, 
  RefreshCw,
  Clock,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Blocked Identifiers Management Component
 * Admin interface for managing blocked identifiers and rate limiting
 * Requirements: 14.4
 */

interface BlockedIdentifier {
  id: string;
  identifier: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
  attempts: number;
  isActive: boolean;
}

interface RateLimitStats {
  totalBlocked: number;
  activeBlocks: number;
  expiredBlocks: number;
  topReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export default function BlockedIdentifiersManagement() {
  const [blockedIdentifiers, setBlockedIdentifiers] = useState<BlockedIdentifier[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentifier, setSelectedIdentifier] = useState<BlockedIdentifier | null>(null);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load blocked identifiers and stats
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [identifiersResponse, statsResponse] = await Promise.all([
        fetch('/api/super-admin/security/blocked-identifiers'),
        fetch('/api/super-admin/security/rate-limit-stats')
      ]);

      if (identifiersResponse.ok) {
        const identifiersData = await identifiersResponse.json();
        setBlockedIdentifiers(identifiersData.identifiers || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load blocked identifiers:', error);
      toast.error('Failed to load blocked identifiers');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Unblock identifier
  const unblockIdentifier = async (identifier: string) => {
    try {
      const response = await fetch('/api/super-admin/security/unblock-identifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      if (response.ok) {
        toast.success('Identifier unblocked successfully');
        setUnblockDialogOpen(false);
        setSelectedIdentifier(null);
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to unblock identifier');
      }
    } catch (error) {
      console.error('Failed to unblock identifier:', error);
      toast.error('Failed to unblock identifier');
    }
  };

  // Filter identifiers based on search term
  const filteredIdentifiers = blockedIdentifiers.filter(item =>
    item.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format time remaining
  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    
    if (remaining <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get reason badge color
  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'EXCESSIVE_LOGIN_FAILURES':
        return 'destructive';
      case 'SUSPICIOUS_ACTIVITY_PATTERN':
        return 'destructive';
      case 'OTP_ABUSE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Management</h2>
          <p className="text-muted-foreground">
            Manage blocked identifiers and rate limiting
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Blocked</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBlocked}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.activeBlocks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Blocks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.expiredBlocks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.topReasons[0]?.reason.replace(/_/g, ' ') || 'None'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.topReasons[0]?.count || 0} occurrences
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="blocked" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocked">Blocked Identifiers</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by identifier or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Blocked Identifiers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blocked Identifiers
              </CardTitle>
              <CardDescription>
                Currently blocked identifiers and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIdentifiers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No blocked identifiers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Expires At</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIdentifiers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.identifier}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getReasonBadgeColor(item.reason)}>
                            {item.reason.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.blockedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(item.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeRemaining(new Date(item.expiresAt))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.attempts}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.isActive && new Date(item.expiresAt) > new Date() ? "destructive" : "secondary"}
                          >
                            {item.isActive && new Date(item.expiresAt) > new Date() ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.isActive && new Date(item.expiresAt) > new Date() && (
                            <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedIdentifier(item)}
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unblock
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Unblock Identifier</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to unblock "{selectedIdentifier?.identifier}"?
                                    This will immediately remove all restrictions for this identifier.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setUnblockDialogOpen(false);
                                      setSelectedIdentifier(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => selectedIdentifier && unblockIdentifier(selectedIdentifier.identifier)}
                                  >
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Unblock
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Block Reasons</CardTitle>
                <CardDescription>
                  Most common reasons for blocking identifiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.topReasons.length ? (
                  <div className="space-y-3">
                    {stats.topReasons.map((reason, index) => (
                      <div key={reason.reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium">
                            {reason.reason.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant="outline">{reason.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No blocking statistics available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Rate limiting system status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abuse Detection</span>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Cleanup</span>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}