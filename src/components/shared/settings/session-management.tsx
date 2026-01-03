"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  isCurrent: boolean
  expiresAt: Date
  createdAt: Date
  device: string
  location: string
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false)
  const { toast } = useToast()

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/sessions")
      const data = await response.json()

      if (data.success) {
        setSessions(data.sessions.map((s: any) => ({
          ...s,
          expiresAt: new Date(s.expiresAt),
          createdAt: new Date(s.createdAt)
        })))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch sessions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const revokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId)
      const response = await fetch(`/api/user/sessions?sessionId=${sessionId}`, {
        method: "DELETE"
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Session revoked successfully"
        })
        // Refresh sessions list
        await fetchSessions()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to revoke session",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error revoking session:", error)
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive"
      })
    } finally {
      setRevoking(null)
    }
  }

  const revokeAllSessions = async () => {
    try {
      setRevoking("all")
      const response = await fetch("/api/user/sessions?revokeAll=true", {
        method: "DELETE"
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        // Refresh sessions list
        await fetchSessions()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to revoke sessions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error revoking sessions:", error)
      toast({
        title: "Error",
        description: "Failed to revoke sessions",
        variant: "destructive"
      })
    } finally {
      setRevoking(null)
      setShowRevokeAllDialog(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase()
    if (deviceLower.includes("mobile") || deviceLower.includes("phone")) {
      return <Smartphone className="h-4 w-4" />
    } else if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active login sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={revoking === "all"}
              >
                {revoking === "all" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Revoke All Other Sessions
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Active {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(session.expiresAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Revoke
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {otherSessions.length > 0 && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Security Tip
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  If you see any sessions you don't recognize, revoke them immediately and change your password.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out from all other devices. Your current session will remain active.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={revokeAllSessions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
