'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SchoolSelection } from '@/components/auth/school-selection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * School Selection Page
 * 
 * Standalone page for multi-school users to select their active school context.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

interface School {
  id: string;
  name: string;
  schoolCode: string;
}

export default function SelectSchoolPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get available schools from session context service
    const loadAvailableSchools = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API to get user's available schools
        const response = await fetch('/api/auth/user/schools', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load schools');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load schools');
        }

        setSchools(data.schools || []);
      } catch (error) {
        console.error('Error loading schools:', error);
        setError('Failed to load available schools');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableSchools();
  }, [router]);

  const handleSchoolSelect = async (schoolId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/context/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newSchoolId: schoolId,
          token
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to switch school context');
      }

      // Redirect to the provided URL
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        router.refresh();
      }
    } catch (error: any) {
      throw error; // Re-throw to be handled by SchoolSelection component
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading available schools...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <SchoolSelection schools={schools} onSchoolSelect={handleSchoolSelect} />
    </div>
  );
}