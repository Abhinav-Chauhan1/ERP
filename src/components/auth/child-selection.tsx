"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User, Loader2 } from "lucide-react"

/**
 * Child Selection Component
 * 
 * Allows parents with multiple children to select which child's information to access.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

interface ChildOption {
  id: string
  name: string
  class?: string
  section?: string
}

interface ChildSelectionProps {
  children: ChildOption[]
  onChildSelect: (childId: string) => Promise<void>
}

export function ChildSelection({ children, onChildSelect }: ChildSelectionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [error, setError] = useState("")

  const handleChildSelection = async (childId: string) => {
    setSelectedChildId(childId)
    setIsLoading(true)
    setError("")

    try {
      await onChildSelect(childId)
    } catch (error: any) {
      console.error('Child selection error:', error)
      setError(error.message || "Failed to switch child context")
    } finally {
      setIsLoading(false)
      setSelectedChildId("")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <User className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <CardTitle>Select Child</CardTitle>
        <CardDescription>
          Please select which child's information you want to access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => handleChildSelection(child.id)}
              disabled={isLoading}
            >
              {isLoading && selectedChildId === child.id ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <div>
                    <div className="font-medium">Switching to {child.name}...</div>
                    {child.class && child.section && (
                      <div className="text-sm text-gray-500">Class: {child.class} - {child.section}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">{child.name}</div>
                  {child.class && child.section && (
                    <div className="text-sm text-gray-500">Class: {child.class} - {child.section}</div>
                  )}
                </div>
              )}
            </Button>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => {
              localStorage.removeItem('auth_token')
              router.push('/login')
            }}
            className="text-sm text-gray-600"
            disabled={isLoading}
          >
            Sign out and try different account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}