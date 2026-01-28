"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, School, Loader2 } from "lucide-react"

/**
 * School Selection Component
 * 
 * Allows multi-school users to select which school context to work in.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface SchoolOption {
  id: string
  name: string
  schoolCode: string
}

interface SchoolSelectionProps {
  schools: SchoolOption[]
  onSchoolSelect: (schoolId: string) => Promise<void>
}

export function SchoolSelection({ schools, onSchoolSelect }: SchoolSelectionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("")
  const [error, setError] = useState("")

  const handleSchoolSelection = async (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    setIsLoading(true)
    setError("")

    try {
      await onSchoolSelect(schoolId)
    } catch (error: any) {
      console.error('School selection error:', error)
      setError(error.message || "Failed to switch school context")
    } finally {
      setIsLoading(false)
      setSelectedSchoolId("")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <School className="h-12 w-12 mx-auto text-blue-600 mb-2" />
        <CardTitle>Select School</CardTitle>
        <CardDescription>
          You have access to multiple schools. Please select one to continue.
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
          {schools.map((school) => (
            <Button
              key={school.id}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => handleSchoolSelection(school.id)}
              disabled={isLoading}
            >
              {isLoading && selectedSchoolId === school.id ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <div>
                    <div className="font-medium">Switching to {school.name}...</div>
                    <div className="text-sm text-gray-500">Code: {school.schoolCode}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">{school.name}</div>
                  <div className="text-sm text-gray-500">Code: {school.schoolCode}</div>
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